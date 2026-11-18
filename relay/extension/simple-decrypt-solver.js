// simple-decrypt-solver.js
// Auto-solver for the "Simple Decrypt" (simple-hack) minigame on cor3.gg.
//
// The minigame is announced by `minigames start.minigame` with an EXTERNAL url:
// https://svc-corie.cor3.gg/games/simple-hack?attempt=... Depending on the
// client build the UI renders in the main cor3.gg window, in an iframe, or in
// that external page. This script is therefore injected into both the main page
// and the external game page, and deliberately avoids build-specific CSS hashes
// when locating the app, the Decrypt button and the progress readout.
//
// Controllable via window.__simpleDecryptSolverAbort.

(function () {
  'use strict';
  // Correlation ticket only: MAIN world is not an authentication boundary.
  const lifecycleTicket = document.currentScript?.dataset?.cor3LifecycleTicket;
  const lifecycleRun = window.__cor3SolverLifecycle?.begin('simple', lifecycleTicket);
  if (!lifecycleRun) return;
  const owner = Object.freeze({});
  let frameCollectionEpoch = null;
  const frameCollectionListener = event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.type !== 'COR3_SIMPLE_FRAME_ARM' || Object.keys(event.data).length !== 2) return;
    frameCollectionEpoch = typeof event.data.collectionEpoch === 'string' && /^[a-f0-9]{32}$/.test(event.data.collectionEpoch) ? event.data.collectionEpoch : null;
  };
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('message', frameCollectionListener);
    window.postMessage({type:'COR3_SIMPLE_FRAME_COLLECTOR_READY'}, location.origin);
  }

  window.__cor3SimpleRunOwner = owner;
  window.__simpleDecryptSolverActive = true;
  window.__simpleDecryptSolverAbort = false;
  function masterAllowed() {
    return lifecycleRun.valid() && window.__cor3SimpleRunOwner === owner && !window.__simpleDecryptSolverAbort;
  }
  function cleanup() {
    window.removeEventListener?.('message', frameCollectionListener);
    lifecycleRun.finish();
    if (window.__cor3SimpleRunOwner === owner) {
      window.__simpleDecryptSolverActive = false;
      // A stale finalizer must never reset abort or clear a newer run.
      window.__cor3SimpleRunOwner = null;
    }
  }

	const sleep = (ms) => lifecycleRun.sleep(ms);
	const POLL_MS = 300;
	const GAME_TIMEOUT_MS = 120000;

	function postStatus(msg, level) {
		if (!masterAllowed()) return;
        window.postMessage({ type: 'COR3_SIMPLE_DECRYPT_STATUS', lifecycleTicket, message: msg, level: level || 'info' }, location.origin);
	}
	function log(msg) {
		console.log('🔓 [COR3 Helper] ' + msg);
	}
	function isExternalGamePage() {
		try { return /simple-hack/i.test(location.href); } catch (e) { return false; }
	}

	// --- DOM lookup -----------------------------------------------------------

	function getDocuments() {
		const docs = [document];
		try {
			for (const frame of document.querySelectorAll('iframe')) {
				let doc = null;
				try { doc = frame.contentDocument; } catch (e) { /* cross-origin: injected separately */ }
				if (doc && docs.indexOf(doc) === -1) docs.push(doc);
			}
		} catch (e) { /* ignore */ }
		return docs;
	}

	// Component names seen across client builds. The old solver only matched one
	// of them and a generated CSS-in-JS class for the button, which broke on rebuilds.
	const APP_SELECTOR = [
		'[data-component-name="SimpleDecryptApplication"]',
		'[data-sentry-component="SimpleDecryptApplication"]',
		'[data-component-name="SimpleDecryptionApplication"]',
		'[data-sentry-component="SimpleDecryptionApplication"]',
		'[data-component-name*="SimpleDecrypt"]',
		'[data-sentry-component*="SimpleDecrypt"]',
		'[data-component-name*="SimpleHack"]',
		'[data-sentry-component*="SimpleHack"]'
	].join(', ');

	function findApp() {
		for (const doc of getDocuments()) {
			let app = null;
			try { app = doc.querySelector(APP_SELECTOR); } catch (e) { /* ignore */ }
			if (app) return { app: app, doc: doc };
		}
		// EXTERNAL game page fallback: the root may not carry any component name.
		if (isExternalGamePage()) {
			const root = document.querySelector('#root, #app, main') || document.body;
			if (root) {
				return { app: root, doc: document };
			}
		}
		return null;
	}

	function buttonScore(btn) {
		if (!btn || btn.disabled) return -1;
		const text = String(btn.textContent || btn.value || '').trim();
		let meta = '';
		if (btn.getAttribute) {
			meta = ['aria-label', 'title', 'data-sentry-element', 'data-component-name', 'class']
				.map((name) => btn.getAttribute(name) || '').join(' ');
		}
		const hay = text + ' ' + meta;
		if (/close|cancel|取消|关闭|强制|暴力|brute|force[-_ ]?(?:decrypt|hack)|bypass|skip/i.test(hay)) return -1;
		let score = 0;
		if (/decrypt|解密/i.test(hay)) score += 10;
		else if (/start|begin|run|hack|开始|确认|继续|crack|взлом/i.test(hay)) score += 5;
		if (/decryptbutton/i.test(meta)) score += 6;
		if (!text && !meta.trim()) score -= 2;
		return score;
	}

	function findDecryptButton(app, doc) {
		// The identified game container is the only click scope. Never fall back
		// to another dialog in the page when the game has no eligible control.
		const scopes = app && app.querySelectorAll ? [app] : [];

		const candidates = [];
		for (const scope of scopes) {
			let nodes = [];
			try {
				nodes = Array.from(scope.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], [data-sentry-element="DecryptButtonStyled"]'));
			} catch (e) { continue; }
			for (const btn of nodes) {
				const score = buttonScore(btn);
				if (score > 0) candidates.push({ btn: btn, score: score + (scope === app ? 2 : 0) });
			}
		}
		candidates.sort((a, b) => b.score - a.score);
		if (candidates.length) return candidates[0].btn;
		return null;
	}

	function getProgressPercent(app, doc) {
		const root = app || doc.body;
		if (!root) return null;
		const text = String(root.textContent || '').replace(/\s+/g, ' ');
		const match = text.match(/(\d{1,3})\s*%/);
		if (match) return Math.min(100, parseInt(match[1], 10));
		try {
			const bars = root.querySelectorAll('[style*="width"], [role="progressbar"]');
			for (const bar of bars) {
				const style = bar.getAttribute('style') || '';
				const width = style.match(/width\s*:\s*(\d{1,3}(?:\.\d+)?)\s*%/);
				if (width) return Math.min(100, Math.round(parseFloat(width[1])));
				const value = bar.getAttribute('aria-valuenow');
				if (value != null && Number.isFinite(Number(value))) return Math.min(100, Math.round(Number(value)));
			}
		} catch (e) { /* ignore */ }
		return null;
	}

	// --- Solve one game -------------------------------------------------------

	async function solveOnce(gameDocument) {
		log('Simple Decrypt game detected — starting solver');
		postStatus('Simple Decrypt detected — solving...', 'info');
		const started = Date.now();
		let clicked = false;
		let clickedAt = 0;
		let lastPercent = -1;
		let warned = false;

		while (Date.now() - started < GAME_TIMEOUT_MS) {
			if (!masterAllowed()) return 'aborted';

			const found = findApp();
			if (!found) {
				if (clicked) {
					log('Simple Decrypt completed (game closed)');
					postStatus('Decryption completed (game closed)', 'success');
					return 'complete';
				}
				await sleep(POLL_MS);
				continue;
			}

            // An old continuation may not switch into a replacement iframe document.
            if (found.doc !== gameDocument) return 'document-changed';
			if (!clicked) {
				const btn = findDecryptButton(found.app, found.doc);
				if (!btn) {
					if (!warned && Date.now() - started > 5000) {
						warned = true;
						postStatus('Waiting for the Decrypt button to render...', 'warn');
					}
					await sleep(POLL_MS);
					continue;
				}
				try {
					if (!masterAllowed()) return 'stopped';
					btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
				} catch (e) {
					if (!masterAllowed()) return 'stopped';
                    btn.click();
				}
				clicked = true;
				clickedAt = Date.now();
				log('Clicked Decrypt button: ' + String(btn.textContent || '').trim().slice(0, 40));
				postStatus('Clicked Decrypt — waiting for progress...', 'info');
			}

			const pct = getProgressPercent(found.app, found.doc);
			if (pct !== null && pct !== lastPercent) {
				lastPercent = pct;
				if (pct % 25 === 0 || pct >= 90) postStatus('Decrypting... ' + pct + '%', 'info');
			}
			if (pct !== null && pct >= 100 && (!isExternalGamePage() || Date.now() - clickedAt >= 3000)) {
				log('Simple Decrypt reached 100%');
				postStatus('Decryption reached 100%', 'success');
				await sleep(1500);
				return 'complete';
			}
			await sleep(POLL_MS);
		}

		if (masterAllowed() && frameCollectionEpoch) window.postMessage({type:'COR3_SIMPLE_FRAME_ERROR',source:'simpleLifecycle',code:'TIMEOUT',phase:'run',lifecycleTicket,collectionEpoch:frameCollectionEpoch},location.origin);
		postStatus('Decryption timed out after 2 minutes', 'error');
		return clicked ? 'timeout' : 'not-found';
	}

	// --- Watcher --------------------------------------------------------------

	async function watch() {
		log('Simple Decrypt solver watching for minigame...');
		let handledApp = null, handledDocument = null;
		while (masterAllowed()) {
			await sleep(POLL_MS);
            if (!masterAllowed()) return;
			const found = findApp();
            if (!found) { handledApp = null; handledDocument = null; continue; }
            if (found.app === handledApp && found.doc === handledDocument) continue;
            handledApp = found.app; handledDocument = found.doc;

			await solveOnce(found.doc);
		}
  }
  // Restart requires a fresh ticketed injection, never an uncorrelated START.
  watch().catch(() => {
    if (!masterAllowed()) return;
    window.postMessage({type:'COR3_OBSERVABLE_ERROR',source:'simpleLifecycle',code:'SOLVER_FAILED',phase:'run'},location.origin);
    if (typeof frameCollectionEpoch !== 'undefined' && frameCollectionEpoch) window.postMessage({type:'COR3_SIMPLE_FRAME_ERROR',source:'simpleLifecycle',code:'SOLVER_FAILED',phase:'run',lifecycleTicket,collectionEpoch:frameCollectionEpoch},location.origin);
    postStatus('Simple Decrypt solver failed.', 'error');
  }).finally(cleanup);
})();


