// Relay page recovery and Wings of Mars read models. The page owns its recovery clock.
import { wingsMaterials } from './wings-materials.js';

type Row = Record<string, unknown>;
const record = (x: unknown): Row => x && typeof x === 'object' && !Array.isArray(x) ? x as Row : {};
const rows = (x: unknown, maximum: number): Row[] => Array.isArray(x) ? x.slice(0, maximum).map(record) : [];
const label = (x: unknown): string => typeof x === 'string' ? x.slice(0, 130) : '';
const count = (x: unknown): number | null => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 ? x : null;
const step = (x: unknown): number | null => { const n=count(typeof x==='string' && /^\d+$/.test(x) ? Number(x) : x); return n && n<=100 ? n : null; };

// Adapted from huoyan1231 v2.4.3 drone-build contracts. Project only the game fields displayed by C3.
function wings(action: string, input: unknown) {
    const data=record(input);
    if (action==='list.history' && Array.isArray(data.items)) {
        const items=rows(data.items,32).filter(i=>step(i.step)).map(i=>({step:step(i.step),title:label(i.title),
            status:label(i.status), completedSubtasks:count(i.completedSubtasks), totalSubtasks:count(i.totalSubtasks)}));
        return items.length ? {items} : null;
    }
    if (action!=='get.page'||!step(data.currentStep)) return null;
    return {currentStep:step(data.currentStep),status:label(data.status),currentStepSubtasks:rows(data.currentStepSubtasks,32).map(s=>({
        title:label(s.title),status:label(s.status),buyCost:count(s.buyCost),barterItems:rows(s.barterItems,20).map(i=>({
            title:label(i.title),availableQuantity:count(i.availableQuantity),requiredQuantity:count(i.requiredQuantity)
        })).filter(i=>i.title)
    }))};
}

function visible(node: Element): boolean {
    const style = getComputedStyle(node);
    return node.getClientRects().length > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden' && style.visibility !== 'collapse';
}
const windowTitle = '[data-component-name="ApplicationTitleText"]';
const windowShell = '[data-component-name="ApplicationWindow"]';
const terminalName = /^(?:terminal hack|终端入侵|终端破解)$/i;
const timedTitle = /^(?:terminal hack|ice wall break|signal decode|data partition|sudoku|终端入侵|终端破解|ICE WALL 破解|信号解码|数据分区|数独)$/i;
const activitySelectors = ['IceWallBreakApplication', 'ConfigHackApplication', 'DecryptionApplication',
    'SimpleDecryptApplication', 'SimpleDecryptionApplication'].flatMap(name =>
    ['[data-component-name="' + name + '"]', '[data-sentry-component="' + name + '"]']
).concat('[data-component-name*="SimpleHack"]', '[data-sentry-component*="SimpleHack"]', 'iframe[src*="/games/"]', windowTitle).join(',');

function timedWindows(): Element[] {
    const games: Element[] = [], shells: Element[] = [];
    for (const el of document.querySelectorAll(activitySelectors)) {
        if (el.matches(windowTitle)) {
            if (!timedTitle.test(el.textContent?.trim() || '')) continue;
            const shell = el.closest(windowShell);
            if (shell && visible(el)) shells.push(shell);
        } else if (visible(el)) games.push(el);
    }
    // Keep each independent game. A title and its mounted game represent one window.
    return games.concat(shells.filter(shell => !games.some(game => shell.contains(game))));
}

const connectionLine = /^(?:(?:re)?connecting to (?:the )?server|(?:正在|尝试)?(?:重新)?连接(?:到)?服务器)[.。…!！\s]*$/i;
const terminalComponent = '[data-component-name="ConfigHackApplication"],[data-sentry-component="ConfigHackApplication"]';
const iceComponent = '[data-component-name="IceWallBreakApplication"],[data-sentry-component="IceWallBreakApplication"]';
const iceName = /^(?:ice wall break|ICE WALL 破解)$/i;
const iceConnection = /^(?:awaiting secure channel|等待安全通道|等待安全信道)[.。…!！\s]*$/i;
const protectedContent = [
    'iframe','canvas','svg[role="grid"]','input','select','textarea','[contenteditable=true]',
    '[role="timer"]','[role="grid"]','[role="log"]','button','[role="button"]',
    ...['Timer','Countdown','WallBoard','History','EventLog'].flatMap(part =>
        ['data-component-name','data-sentry-component','data-sentry-element'].map(attribute => '[' + attribute + '*="' + part + '"]'))
].join(',');

function waitingMarker(app: Element, component: string, titlePattern: RegExp, messagePattern: RegExp): Element | null {
    if (!visible(app)) return null;
    const shell = app.closest(windowShell);
    const title = shell?.querySelector(windowTitle);
    const matchesTitle = !!title && titlePattern.test(title.textContent?.trim() || '');
    if (!app.matches(component) && !(app === shell && matchesTitle)) return null;
    if (title && !matchesTitle) return null;
    const root = shell || app;
    const header = title?.closest('[data-sentry-element="ApplicationHeaderStyled"]') ||
        title?.closest('[data-component-name="ApplicationTitle"]') || title;
    const hasPlayControls = Array.from(root.querySelectorAll(protectedContent)).some(el => !header?.contains(el) && visible(el));
    if (hasPlayControls) return null;
    let body = (root as HTMLElement).innerText.trim();
    if (header) {
        const heading = (header as HTMLElement).innerText.trim();
        if (!heading || !body.startsWith(heading)) return null;
        body = body.slice(heading.length).trim();
    }
    if (!messagePattern.test(body)) return null;
    // A loading animation may replace its text node while the same window is still waiting.
    return root;
}

function terminalWait(app: Element): Element | null {
    return waitingMarker(app, terminalComponent, terminalName, connectionLine);
}

function emptyIce(app: Element): boolean {
    return !!waitingMarker(app, iceComponent, iceName, iceConnection);
}

interface Observation {
    account: string; documentId: string; now: number; age: number; quiet: number; hidden: boolean;
    online: boolean; permitted: boolean; busy: boolean; emptyIce: Element | null; active: string | null;
    ticket: string | null; expired: boolean; fault: string | null; queued: boolean; batchBusy: boolean;
    equipmentChecks: number; terminal?: Element | null; batchProgress?: string | null;
}

function readRecovery(owner: string | null): string | null {
    if (owner === 'initial-fetch') return 'startup-read';
    if (owner === 'manual-market:roster-home' || owner === 'manual-market:roster-usol') return 'roster-read';
    return null;
}

function monitor() {
    let signature = '', evidenceSince = 0, last = 0, wasBlocked = true, previousNode: Element | null = null;
    function reset() { wasBlocked = true; signature = ''; previousNode = null; }
    function observe(o: Observation) {
        const read = o.ticket && o.expired && o.fault === 'lease-expired' ? readRecovery(o.active) : null;
        const equip = o.active === 'page-equip' && o.fault === 'equipment-unconfirmed' && o.equipmentChecks >= 2;
        const connection = o.emptyIce ? 'ice-empty' : o.terminal ? 'terminal-connect' : null;
        const reason = connection ?? (equip ? 'equipment-unconfirmed' : read);
        const node = o.emptyIce || o.terminal || null;
        const progress = connection ? o.batchProgress : o.ticket;
        const key = JSON.stringify([o.account, o.documentId, reason, progress]);
        const blockedWork = o.batchBusy || o.queued || (!!o.active && !equip && !read);
        const blocked = !o.account || !o.documentId || !o.online || !o.permitted || o.busy || (!connection && blockedWork);
        if (blocked || wasBlocked || key !== signature || node !== previousNode || o.now < last || o.now-last > 95000) {
            evidenceSince = o.now;
        }
        wasBlocked = blocked;
        signature = key;
        previousNode = node;
        last = o.now;
        if (blocked || (!connection && o.quiet < 120000)) return null;
        if (reason && o.now-evidenceSince >= (reason === 'equipment-unconfirmed' ? 600000 : 180000)) return reason;
        if (!reason && !o.active && o.hidden && o.age >= 21600000 && o.quiet >= 300000 && o.now-evidenceSince >= 120000) return 'idle';
        return null;
    }
    return Object.assign(observe, { reset });
}
function isConnectionWait(reason: unknown): boolean {
    return reason === 'terminal-connect' || reason === 'ice-empty';
}

function canReload(history: unknown, at: number, reason?: string, lastRecovery?: unknown) {
    if(!Array.isArray(history)||history.some(x=>!Number.isFinite(x)||x>at))return false;
    if(isConnectionWait(reason)){
        const previous=record(lastRecovery);
        const lastAt=count(previous.at);
        // The first stalled connection may recover after three minutes. A new
        // document by itself is not evidence that a continuing outage ended.
        return !isConnectionWait(previous.reason) || lastAt === null || (lastAt <= at && at-lastAt>=600000);
    }
    return history.filter(x=>x>at-21600000).length<2 && !history.some(x=>x>at-1800000);
}
Object.assign(globalThis,{Cor3PageLifetime:Object.freeze({wings,wingsMaterials,timedWindows,emptyIce,terminalWait,readRecovery,monitor,isConnectionWait,canReload})});
