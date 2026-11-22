// ws-messages.js — WebSocket message logging via IndexedDB (content script context)
// Runs on cor3.gg origin. Writes immediately on each message. Purges entries >24h old.

const COR3_WS_DB_NAME = 'cor3_ws_db';
const COR3_WS_DB_VERSION = 2;
const COR3_WS_STORE = 'messages';
const COR3_WS_LOGS_STORE = 'logs';
const COR3_WS_MAX_AGE = 24 * 60 * 60 * 1000;
const COR3_WS_MAX_ENTRIES = 30000;
const COR3_WS_LOGS_MAX_ENTRIES = 30000;

let _wsDbInstance = null;
let _wsOpening = null;
let _wsLastPurge = 0;

function _wsInvalidateDb() {
    _wsDbInstance = null;
}

function _wsOpenDb() {
    if (_wsDbInstance) {
        // Verify the cached connection is still usable
        try {
            if (!_wsDbInstance.objectStoreNames.contains(COR3_WS_STORE)) {
                _wsInvalidateDb();
            }
        } catch (e) {
            // Connection is dead (InvalidStateError) — reopen
            _wsInvalidateDb();
        }
    }
    if (_wsDbInstance) return Promise.resolve(_wsDbInstance);
    if (_wsOpening) return _wsOpening;
    _wsOpening = new Promise((resolve, reject) => {
        const req = indexedDB.open(COR3_WS_DB_NAME, COR3_WS_DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(COR3_WS_STORE)) {
                const store = db.createObjectStore(COR3_WS_STORE, { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (!db.objectStoreNames.contains(COR3_WS_LOGS_STORE)) {
                const logStore = db.createObjectStore(COR3_WS_LOGS_STORE, { keyPath: 'id', autoIncrement: true });
                logStore.createIndex('timestamp', 'timestamp', { unique: false });
                logStore.createIndex('category', 'category', { unique: false });
                logStore.createIndex('cat_ts', ['category', 'timestamp'], { unique: false });
            }
        };
        req.onsuccess = (e) => {
            const db = e.target.result;
            _wsDbInstance = db;
            const disconnected = () => { if (_wsDbInstance === db) _wsInvalidateDb(); };
            db.onclose = disconnected;
            db.onversionchange = () => { db.close(); disconnected(); };
            console.log('[COR3 WS-Log] IndexedDB opened successfully');
            resolve(_wsDbInstance);
        };
        req.onerror = (e) => {
            console.log('[COR3 WS-Log] IndexedDB open failed:', e.target.error);
            reject(e.target.error);
        };
    }).finally(() => { _wsOpening = null; });
    return _wsOpening;
}

function _wsTransactionDone(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onabort = tx.onerror = () => reject(tx.error || new Error('Log transaction aborted'));
    });
}

async function _wsPruneStore(db, name, limit, cutoff) {
    // Index.getAllKeys returns primary keys without cloning archived message bodies.
    const tx = db.transaction(name, 'readwrite');
    const store = tx.objectStore(name);
    const expired = store.index('timestamp').getAllKeys(IDBKeyRange.upperBound(cutoff, true), 512);
    expired.onsuccess = () => {
        for (const key of expired.result) store.delete(key);
        const count = store.count();
        count.onsuccess = () => {
            const excess = count.result - limit;
            if (excess <= 0) return;
            // IDs are auto-incremented. Find the last excess key and delete the prefix
            // under the same transaction, including after a concurrent clear or a gap.
            const cursor = store.openKeyCursor();
            let advance = excess - 1;
            cursor.onsuccess = () => {
                const row = cursor.result;
                if (!row) return;
                if (advance) {
                    const skip = advance;
                    advance = 0;
                    row.advance(skip);
                } else {
                    store.delete(IDBKeyRange.upperBound(row.primaryKey));
                }
            };
        };
    };
    await _wsTransactionDone(tx);
}

let _wsPurgeRunning = false;
async function _wsPurgeOld() {
    const now = Date.now();
    const elapsed = now - _wsLastPurge;
    if (_wsPurgeRunning || (elapsed >= 0 && elapsed < 60000)) return;
    _wsPurgeRunning = true;
    _wsLastPurge = now;
    try {
        const db = await _wsOpenDb();
        const cutoff = new Date(now - COR3_WS_MAX_AGE).toISOString();
        await _wsPruneStore(db, COR3_WS_STORE, COR3_WS_MAX_ENTRIES, cutoff);
        await _wsPruneStore(db, COR3_WS_LOGS_STORE, COR3_WS_LOGS_MAX_ENTRIES, cutoff);
    } catch (e) {
        console.log('[COR3 WS-Log] Purge failed:', e);
    } finally {
        _wsPurgeRunning = false;
    }
}

async function _wsWriteEntry(entry) {
    const db = await _wsOpenDb();
    const tx = db.transaction(COR3_WS_STORE, 'readwrite');
    tx.objectStore(COR3_WS_STORE).add(entry);
    await _wsTransactionDone(tx);
}

function _sanitizeWsMessage(msg) {
    return globalThis.Cor3RunLog?.text(typeof msg==="string"?msg:JSON.stringify(globalThis.Cor3RunLog?.redact(msg)||msg))||String(msg);
}

async function cor3LogWsMessage(direction, message) {
    try {
        const entry = {
            timestamp: new Date().toISOString(),
            direction: direction,
            message: _sanitizeWsMessage(message)
        };
        try {
            await _wsWriteEntry(entry);
        } catch (e) {
            // Retry once on stale connection (NotFoundError / InvalidStateError)
            if (e && (e.name === 'NotFoundError' || e.name === 'InvalidStateError')) {
                console.log('[COR3 WS-Log] Stale DB connection (' + e.name + ') — reopening and retrying');
                _wsInvalidateDb();
                await _wsWriteEntry(entry);
            } else {
                throw e;
            }
        }
        _wsPurgeOld();
    } catch (e) {
        console.log('[COR3 WS-Log] cor3LogWsMessage error:', e);
    }
}

async function cor3ClearWsMessages() {
    try {
        const db = await _wsOpenDb();
        const tx = db.transaction(COR3_WS_STORE, 'readwrite');
        tx.objectStore(COR3_WS_STORE).clear();
        await _wsTransactionDone(tx);
        console.log('[COR3 WS-Log] All messages cleared');
    } catch (e) {
        console.log('[COR3 WS-Log] Clear failed:', e);
    }
}

async function cor3LogEntry(category, message, level) {
    try {
        const entry = {
            timestamp: new Date().toISOString(),
            category: category,
            message: globalThis.Cor3RunLog?.text(message)||String(message),
            level: level || 'info'
        };
        const db = await _wsOpenDb();
        const tx = db.transaction(COR3_WS_LOGS_STORE, 'readwrite');
        tx.objectStore(COR3_WS_LOGS_STORE).add(entry);
        await _wsTransactionDone(tx);
        void _wsPurgeOld();
    } catch (e) {
        if (e && (e.name === 'NotFoundError' || e.name === 'InvalidStateError')) {
            _wsInvalidateDb();
            try {
                const db = await _wsOpenDb();
                const tx = db.transaction(COR3_WS_LOGS_STORE, 'readwrite');
                tx.objectStore(COR3_WS_LOGS_STORE).add({
                    timestamp: new Date().toISOString(),
                    category: category,
                    message: globalThis.Cor3RunLog?.text(message)||String(message),
                    level: level || 'info'
                });
                await _wsTransactionDone(tx);
            } catch (e2) {
                console.log('[COR3 WS-Log] cor3LogEntry retry failed:', e2);
            }
        }
    }
}

async function cor3ClearLogsByCategory(category) {
    try {
        const db = await _wsOpenDb();
        const tx = db.transaction(COR3_WS_LOGS_STORE, 'readwrite');
        const idx = tx.objectStore(COR3_WS_LOGS_STORE).index('category');
        const range = IDBKeyRange.only(category);
        const req = idx.openCursor(range);
        req.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) { cursor.delete(); cursor.continue(); }
        };
        await _wsTransactionDone(tx);
        console.log('[COR3 WS-Log] Cleared logs for category:', category);
    } catch (e) {
        console.log('[COR3 WS-Log] Clear logs failed:', e);
    }
}


