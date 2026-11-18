import { enum as enumSchema } from 'zod/mini';
import { ZH_MESSAGES } from '../../src/ui/i18n-messages.ts';
import { LEGACY_MESSAGES } from './legacy-ui-messages.ts';
import { RELAY_MESSAGES } from './ui-messages.ts';

type Language = 'zh' | 'en';
type Change = Record<string, { newValue?: unknown }>;
type Storage = { get(key: string): Promise<Record<string, unknown>>; set(value: Record<string, unknown>): Promise<unknown> };
type Changes = { addListener(callback: (changes: Change, area: string) => void): void; removeListener?(callback: (changes: Change, area: string) => void): void };
const key = 'cor3RelayUiLanguage';
const languageSchema = enumSchema(['zh', 'en']);
const han = /[\u3400-\u9fff]/;
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const english = new Map<string, string>();
const chinese = new Map<string, string>();
for (const [en, zh] of [...Object.entries(ZH_MESSAGES), ...LEGACY_MESSAGES]) {
    if (!en.trim() || !zh.trim()) continue;
    chinese.set(en.trim(), zh.trim());
    english.set(zh.trim(), en);
}
for (const [zh, en] of RELAY_MESSAGES) {
    english.set(zh.trim(), en);
    chinese.set(en.trim(), zh.trim());
}
function matcher(dictionary: Map<string, string>, target: Language): RegExp {
    const choices = [...dictionary.keys()].filter(value => target !== 'zh' || !['No','Yes','On','Off','None','auto'].includes(value)).sort((a, b) => b.length - a.length).map(value => {
        const start = target === 'zh' && /^[A-Za-z0-9_]/.test(value) ? '(?<![A-Za-z0-9_])' : target === 'en' && /^[\u3400-\u9fff]/.test(value) ? '(?<![\\u3400-\\u9fff])' : '';
        const end = target === 'zh' && /[A-Za-z0-9_]$/.test(value) ? '(?![A-Za-z0-9_])' : target === 'en' && /[\u3400-\u9fff]$/.test(value) ? '(?![\\u3400-\\u9fff])' : '';
        return start + escape(value) + end;
    });
    return new RegExp(choices.join('|'), 'g');
}
const matchers = { zh: matcher(chinese, 'zh'), en: matcher(english, 'en') };
const identifiers = /https?:\/\/[^\s]+|\b[A-Z][A-Z0-9]*_[A-Za-z0-9_-]+\b|\b[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+\b/g;

export function detect(languages: readonly string[]): Language {
    for (const item of languages) {
        if (/^zh(?:-|$)/i.test(item)) return 'zh';
        if (/^en(?:-|$)/i.test(item)) return 'en';
    }
    return 'en';
}

export function translate(value: string, language: Language): string {
    if (language === 'en' ? !han.test(value) : !/[A-Za-z]/.test(value)) return value;
    const dictionary = language === 'zh' ? chinese : english;
    const whole = dictionary.get(value.trim());
    if (whole !== undefined) return value.replace(value.trim(), whole);
    const convert = (part: string) => {
        const exact = dictionary.get(part.trim());
        if (exact !== undefined) return part.replace(part.trim(), exact);
        return part.replace(matchers[language], matched => dictionary.get(matched) ?? matched).replace(/(^|[:：·,\n()（）/])(\s*)([^:：·,\n()（）/]+)(?=$|[:：·,\n()（）/])/g, (_all, separator: string, gap: string, segment: string) => separator + gap + (dictionary.get(segment.trim()) ?? segment));
    };
    // Preserve error codes, event names, URLs, account IDs and filenames verbatim.
    let previous = 0, output = '';
    for (const match of value.matchAll(identifiers)) {
        output += convert(value.slice(previous, match.index)) + match[0];
        previous = match.index + match[0].length;
    }
    return output + convert(value.slice(previous));
}

export function create({ storage, changes, languages = [] }: { storage: Storage; changes?: Changes; languages?: readonly string[] }) {
    let language = detect(languages), revision = 0, writes: Promise<unknown> = Promise.resolve();
    const listeners = new Set<(language: Language) => void>();
    const roots = new Map<Node, MutationObserver | null>();
    const translated = new Map<string, string>();
    const localText = (source: string) => {
        const cached = translated.get(source);
        if (cached !== undefined) return cached;
        const result = translate(source, language);
        if (source.length <= 2048) {
            if (translated.size >= 512) translated.delete(translated.keys().next().value!);
            translated.set(source, result);
        }
        return result;
    };
    const originals = new WeakMap<object, Map<string, { source: string; last: string }>>();
    const publish = (next: Language) => {
        if (next === language) return;
        language = next;
        translated.clear();
        for (const root of roots.keys()) walk(root);
        for (const fn of listeners) { try { fn(language); } catch { /* One UI must not block the others. */ } }
    };
    function render(target: object, property: string, current: string, assign: (value: string) => void) {
        let fields = originals.get(target);
        if (!fields) originals.set(target, fields = new Map());
        const before = fields.get(property);
        const source = before?.last === current ? before.source : current;
        const result = localText(source);
        fields.set(property, { source, last: result });
        if (current !== result) assign(result);
    }
    function walk(node: Node): void {
        if (node.nodeType === 3) {
            const parent = node.parentElement;
            if (parent?.closest('script,style,code,[data-language-raw]')) return;
            render(node, 'text', node.nodeValue ?? '', value => { node.nodeValue = value; });
            return;
        }
        if (node.nodeType === 1) {
            const element = node as Element;
            if (element.matches('script,style,code,[data-language-raw]')) return;
            const label = element.getAttribute(language === 'zh' ? 'data-i18n-zh' : 'data-i18n-en');
            if (label !== null && element.textContent !== label) element.textContent = label;
            const title = element.getAttribute(language === 'zh' ? 'data-i18n-title-zh' : 'data-i18n-title-en');
            if (title !== null && element.getAttribute('title') !== title) element.setAttribute('title', title);
            for (const attribute of ['title', 'aria-label', 'placeholder']) {
                const value = element.getAttribute(attribute);
                if (value !== null) render(element, attribute, value, next => element.setAttribute(attribute, next));
            }
            if (element.shadowRoot) observe(element.shadowRoot);
        }
        if (node.nodeType === 9) (node as Document).documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
        for (const child of node.childNodes) walk(child);
    }
    function observe(root: Node): void {
        if (!root || roots.has(root) || !root.childNodes) return;
        roots.set(root, null);
        walk(root);
        if (typeof MutationObserver !== 'function') return;
        const observer = new MutationObserver(records => {
            for (const record of records) {
                if (record.type === 'childList') for (const child of record.addedNodes) walk(child);
                else walk(record.target);
            }
        });
        observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder'] });
        roots.set(root, observer);
    }
    const initialRevision = revision;
    const ready = storage.get(key).then(saved => {
        const parsed = languageSchema.safeParse(saved[key]);
        if (revision === initialRevision && parsed.success) publish(parsed.data);
    }).catch(() => { /* Browser language stays usable if preferences cannot be read. */ });
    const changed = (value: Change, area: string) => {
        if (area !== 'local' || !Object.hasOwn(value, key)) return;
        ++revision;
        const parsed = languageSchema.safeParse(value[key]?.newValue);
        publish(parsed.success ? parsed.data : detect(languages));
    };
    changes?.addListener(changed);
    return Object.freeze({
        ready, key, get: () => language, text: localText, observe,
        setText(node: Element, source: string) {
            const result = localText(source);
            if (node.textContent !== result) node.textContent = result;
            if (node.childNodes.length === 1 && node.firstChild?.nodeType === 3) {
                originals.set(node.firstChild, new Map([['text', { source, last: result }]]));
            }
        },
        source(node: Node) { return originals.get(node.firstChild ?? node)?.get('text')?.source ?? node.textContent ?? ''; },
        onChanged(fn: (language: Language) => void) { listeners.add(fn); return () => listeners.delete(fn); },
        set(value: unknown) {
            const parsed = languageSchema.safeParse(value);
            if (!parsed.success) return Promise.reject(new Error('UI_LANGUAGE_INVALID'));
            ++revision;
            const task = writes.then(async () => {
                await storage.set({ [key]: parsed.data });
                const actual = await storage.get(key);
                if (actual[key] !== parsed.data) throw new Error('UI_LANGUAGE_SAVE_UNCONFIRMED');
                publish(parsed.data);
            });
            writes = task.catch(() => {});
            return task;
        },
        dispose() { changes?.removeListener?.(changed); for (const observer of roots.values()) observer?.disconnect(); roots.clear(); listeners.clear(); translated.clear(); },
    });
}

type Runtime = ReturnType<typeof create>;
const boundDocuments = new WeakSet<Document>();
export function bindDocument(language: Runtime, document: Document): void {
    if (boundDocuments.has(document)) return;
    boundDocuments.add(document);
    language.observe(document);
    const controls = [...document.querySelectorAll<HTMLButtonElement>('[data-ui-language]')];
    const sync = () => { for (const control of controls) control.setAttribute('aria-pressed', String(control.dataset.uiLanguage === language.get())); };
    const notice = document.getElementById('uiLanguageNotice');
    for (const control of controls) control.addEventListener('click', () => {
        if (notice) notice.hidden = true;
        void language.set(control.dataset.uiLanguage).then(sync).catch(() => {
            if (notice) { notice.hidden = false; notice.textContent = language.text('语言保存失败，请重试'); }
        });
    });
    language.onChanged(sync);
    void language.ready.then(sync);
    sync();
}
type BrowserApi = { i18n?: { getUILanguage?(): string }; storage?: { local?: Storage; onChanged?: Changes } };
const host = globalThis as typeof globalThis & { chrome?: BrowserApi; browser?: BrowserApi; Cor3UiLanguage?: Runtime; Cor3UiLanguageFactory?: object };
host.Cor3UiLanguageFactory = Object.freeze({ create, detect, translate, key, bindDocument });
const api = host.chrome ?? host.browser;
if (api?.storage?.local && !host.Cor3UiLanguage) {
    const browserLanguage = api.i18n?.getUILanguage?.();
    const pageLanguages = typeof navigator === 'undefined' ? [] : [...(navigator.languages ?? []), navigator.language];
    const languages = browserLanguage ? [browserLanguage, ...pageLanguages] : pageLanguages;
    const language = create({ storage: api.storage.local, ...(api.storage.onChanged ? { changes: api.storage.onChanged } : {}), languages });
    host.Cor3UiLanguage = language;
    if (typeof document !== 'undefined' && /^(chrome|moz)-extension:$/.test(globalThis.location?.protocol ?? '')) {
        const mount = () => bindDocument(language, document);
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
        else mount();
    }
    globalThis.addEventListener?.('pagehide', () => language.dispose(), { once: true });
}
