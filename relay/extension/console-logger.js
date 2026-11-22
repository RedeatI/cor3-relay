// console-logger.js — Intercepts console.log/warn/error and stores entries.
// Works in two modes:
//   1. Extension contexts (content script, background, popup) — writes to chrome.storage.local + IndexedDB
//   2. MAIN world (content-early.js) — stores in window.__cor3ConsoleLogs array + IndexedDB
//
// Storage key: 'cor3_console_logs' (extension contexts share one key, source is per-entry).
// Each entry: { timestamp, level, source, args (stringified arguments) }
// Both modes also write to IndexedDB 'logs' store (category 'page-console' or 'ext-console')
// so logs survive page refreshes and can be read uniformly by DevTools panel and copy button.
// Purges entries older than 24h on every write (debounced).

(function () {
    'use strict';

    // Detect context
    var hasStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    var isMainWorld = !hasStorage && typeof window !== 'undefined';

    // Auto-detect source context
    var source = 'unknown';
    if (hasStorage) {
        if (typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope) {
            source = 'background';
        } else if (typeof location !== 'undefined' && ['chrome-extension:', 'moz-extension:'].includes(location.protocol)) {
            source = 'popup';
        } else {
            source = 'content';
        }
    }

    var MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours
    var MAX_ENTRIES = 5000;
    var PURGE_INTERVAL = 60000; // purge at most once per minute
    var _lastPurge = 0;

    // ─── IndexedDB writer (shared by both modes) ───
    // Writes to cor3_ws_db / 'logs' store with category 'page-console' or 'ext-console'.
    // Lightweight and fire-and-forget — failures are silently ignored to avoid
    // interfering with normal console output.
    var IDB_NAME = 'cor3_ws_db';
    var IDB_VERSION = 2;
    var IDB_STORE = 'logs';
    var _idbInstance = null;
    var _idbQueue = [];
    var _idbFlushTimer = null;
    var _idbFlushing = false;
    var _idbOpening = null;

    function _idbOpen() {
        if (_idbInstance) {
            try { _idbInstance.objectStoreNames.contains(IDB_STORE); return Promise.resolve(_idbInstance); }
            catch (e) { _idbInstance = null; }
        }
        if (_idbOpening) return _idbOpening;
        _idbOpening = new Promise(function (resolve) {
            try {
                var req = indexedDB.open(IDB_NAME, IDB_VERSION);
                req.onupgradeneeded = function (e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains('messages')) {
                        var s = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                        s.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                    if (!db.objectStoreNames.contains(IDB_STORE)) {
                        var ls = db.createObjectStore(IDB_STORE, { keyPath: 'id', autoIncrement: true });
                        ls.createIndex('timestamp', 'timestamp', { unique: false });
                        ls.createIndex('category', 'category', { unique: false });
                        ls.createIndex('cat_ts', ['category', 'timestamp'], { unique: false });
                    }
                };
                req.onsuccess = function (e) {
                    var db = e.target.result;
                    _idbInstance = db;
                    db.onclose = function () { if (_idbInstance === db) _idbInstance = null; };
                    db.onversionchange = function () { db.close(); if (_idbInstance === db) _idbInstance = null; };
                    resolve(db);
                };
                req.onerror = function () { resolve(null); };
            } catch (e) { resolve(null); }
        }).finally(function () { _idbOpening = null; });
        return _idbOpening;
    }

    var MAX_PENDING = 512;
    function addPending(queue, entry) {
        if (queue.length >= MAX_PENDING) queue.splice(0, MAX_PENDING / 4);
        queue.push(entry);
    }
    function _idbWrite(category, entry) {
        addPending(_idbQueue, { timestamp: entry.timestamp, category: category, message: '[' + entry.source + '] ' + entry.args, level: entry.level });
        if (!_idbFlushing && !_idbFlushTimer) _idbFlushTimer = setTimeout(_idbFlush, 300);
    }

    function _idbFlush() {
        _idbFlushTimer = null;
        if (_idbQueue.length === 0) return;
        _idbFlushing = true;
        _idbOpen().then(function (db) {
            var batch = _idbQueue.splice(0);
            if (!db) return;
            try {
                var tx = db.transaction(IDB_STORE, 'readwrite');
                var store = tx.objectStore(IDB_STORE);
                for (var i = 0; i < batch.length; i++) store.add(batch[i]);
                return new Promise(function (done) { tx.oncomplete = tx.onerror = tx.onabort = done; });
            } catch (e) { /* Closing the page also closes its log store. */ }
        }).finally(function () {
            _idbFlushing = false;
            if (_idbQueue.length && !_idbFlushTimer) _idbFlushTimer = setTimeout(_idbFlush, 300);
        });
    }

    // Stringify arguments safely
    function stringifyArgs(args) {
        args=globalThis.Cor3RunLog?.redact(Array.from(args))||args;
        var parts = [];
        for (var i = 0; i < args.length; i++) {
            try {
                if (typeof args[i] === 'string') {
                    parts.push(args[i]);
                } else if (args[i] instanceof Error) {
                    parts.push(args[i].message + (args[i].stack ? '\n' + args[i].stack : ''));
                } else {
                    parts.push(JSON.stringify(args[i]));
                }
            } catch (e) {
                parts.push('[unserializable]');
            }
        }
        return parts.join(' ').slice(0, 2048);
    }

    // ─── MAIN WORLD MODE ───
    if (isMainWorld) {
        if (!window.__cor3ConsoleLogs) window.__cor3ConsoleLogs = [];
        var logs = window.__cor3ConsoleLogs;

        var origLog = console.log;
        var origWarn = console.warn;
        var origError = console.error;

        var _safeApply = (function () {
            try {
                return new Function('fn', 'ctx', 'a', 'try{fn.apply(ctx,a)}catch(e){}');
            } catch (e) {
                return function (fn, ctx, a) { try { fn.apply(ctx, a); } catch (e) {} };
            }
        })();

        function intercept(level, origFn) {
            return function () {
                _safeApply(origFn, console, arguments);
                var entry = {
                    timestamp: new Date().toISOString(),
                    level: level,
                    source: 'page',
                    args: stringifyArgs(arguments)
                };
                logs.push(entry);
                // Also persist to IndexedDB for DevTools panel / copy
                _idbWrite('page-console', entry);
                // Trim if over max
                while (logs.length > MAX_ENTRIES) logs.shift();
                // Purge old entries periodically
                var now = Date.now();
                if (now - _lastPurge > PURGE_INTERVAL) {
                    _lastPurge = now;
                    var cutoff = new Date(now - MAX_AGE).toISOString();
                    while (logs.length > 0 && logs[0].timestamp < cutoff) logs.shift();
                }
            };
        }

        console.log = intercept('log', origLog);
        console.warn = intercept('warn', origWarn);
        console.error = intercept('error', origError);
        return;
    }

    // ─── EXTENSION CONTEXT MODE (content script, background, popup) ───
    if (!hasStorage) return; // bail if neither mode applies

    var _writeQueue = [];
    var _flushTimer = null;
    var _writing = false;
    var _scope = null;

    function logScope() {
        var b = globalThis.Cor3CenterBinding?.snapshot() || globalThis.Cor3CenterIdentity?.snapshot();
        // A popup is pinned once for its lifetime. Other contexts follow their document.
        if (!b) return globalThis.Cor3CenterUi ? 'popup' : null;
        return JSON.stringify([b.accountId,b.documentId,b.epoch]);
    }
    function flushQueue() {
        _flushTimer = null;
        if (_scope !== logScope()) _writeQueue.length = 0;
        if (!_writeQueue.length || _writing) return;
        var batch = _writeQueue.splice(0, 128);
        var batchScope = _scope;
        _writing = true;
        Promise.resolve().then(function () {
            if (batchScope === logScope()) return globalThis.Cor3CenterStore?.appendConsole(batch);
        }).catch(function () {}).finally(function () {
            _writing = false;
            if (_writeQueue.length) scheduleFlush();
        });
    }
    function scheduleFlush() {
        if (!_flushTimer && !_writing) _flushTimer = setTimeout(flushQueue, 500);
    }

    var origLog = console.log;
    var origWarn = console.warn;
    var origError = console.error;

    function intercept(level, origFn) {
        return function () {
            try { origFn.apply(console, arguments); } catch (e) { /* DOMException from invalidated context */ }
            var entry = {
                timestamp: new Date().toISOString(),
                level: level,
                source: source,
                args: stringifyArgs(arguments)
            };
            var scope = logScope();
            if (scope !== _scope) { _writeQueue.length = 0; _scope = scope; }
            if (scope) { addPending(_writeQueue, entry); scheduleFlush(); }
            // Also persist to IndexedDB for DevTools panel / copy
            // Only content scripts run on cor3.gg origin (same IndexedDB as the page)
            if (source === 'content') _idbWrite('ext-console', entry);
        };
    }

    console.log = intercept('log', origLog);
    console.warn = intercept('warn', origWarn);
    console.error = intercept('error', origError);
})();


