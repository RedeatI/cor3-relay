// ice-wall-solver.js
// Auto-solver for "ICE Wall Break" hacking minigame on cor3.gg
// Injected into MAIN world. Controllable via window.__iceWallSolverAbort flag.
// The ICE Wall Break game shows a large composite target (9 small triangles forming
// a big triangle) and a board of ~100 triangles. The player must find where the
// target pattern appears on the board and click the anchor cell. The game has
// multiple rounds (counter shows e.g. "0/3").
//
// Algorithm: fingerprint each triangle by its inner SVG shapes. Parse the target
// preview to extract anchor fingerprint + 8 offset fingerprints. Scan the board
// grid for positions where the pattern matches. Use a MutationObserver to wait
// until exactly one candidate remains, then click it.

(function () {
  const lifecycleRun = window.__cor3SolverLifecycle?.begin('ice', document.currentScript?.dataset?.cor3LifecycleTicket);
  function masterAllowed() { return !!lifecycleRun && lifecycleRun.valid() && !window.__iceWallSolverAbort; }
  if (!lifecycleRun) return;
  if (window.__iceWallSolverActive) { lifecycleRun.finish(); return; }
  window.__iceWallSolverAbort = false;
  if (!masterAllowed()) { lifecycleRun.finish(); return; }
	if (window.__iceWallSolverActive) {
		console.log('\u26a0\ufe0f ICE Wall solver is already active. Aborting duplicate initialization.');
		return;
	}
	window.__iceWallSolverActive = true;
	window.__iceWallSolverAbort = false;
	window.__iceWallGameEnded = false;
	var gameGeneration = 0;

	// --- Utilities ------------------------------------------------------------
	const sleep = (ms) => lifecycleRun.sleep(ms);

	const COL_STEP = 31.5;
	const ROW_STEP = 54;

	// Post a status message visible in the popup UI
	function postStatus(msg, level, state) {
		window.postMessage({ type: 'COR3_ICE_WALL_STATUS', message: msg, level: level || 'info', state: state || (level === 'error' ? 'error' : 'progress') }, '*');
	}

	// --- DOM Detection --------------------------------------------------------

	function findIceWallApp() {
		return document.querySelector(
			'[data-component-name="IceWallBreakApplication"], ' +
			'[data-sentry-component="IceWallBreakApplication"]'
		);
	}

	// --- Glyph Fingerprinting -------------------------------------------------

	// Build a fingerprint string from a glyph <g> element's visible SVG children.
	// Skips the bounding triangle hit-area, opacity-0 elements, and the outer
	// outline. Uses raw path "d" attributes for precision.
	function normalizeCoords(s) {
		return s.replace(/-?\d+(\.\d+)?/g, function (m) { return Math.round(parseFloat(m)).toString(); });
	}

	function getCellFingerprint(g) {
		if (g.querySelector('path[fill="#00121D"]')) return null;

		const parts = [];
		for (const el of g.children) {
			if (el.getAttribute('fill-opacity') === '0.2') continue;
			if (el.getAttribute('data-sentry-component') === 'GlyphBoundingTriangle') continue;
			if (el.style && el.style.opacity === '0') continue;

			if (el.tagName === 'path') {
				const d = el.getAttribute('d');
				if (d) parts.push('p:' + normalizeCoords(d));
			} else if (el.tagName === 'rect') {
				parts.push('r:' + normalizeCoords([
					el.getAttribute('x'),
					el.getAttribute('y'),
					el.getAttribute('width'),
					el.getAttribute('height'),
					el.getAttribute('transform') || ''
				].join(',')));
			}
		}
		return parts.length === 0 ? null : parts.join('|');
	}

	// --- Grid Coordinate Parsing ----------------------------------------------

	// Parse a glyph <g> transform into grid col/row + orientation.
	function parseCellTransform(g) {
		const t = g.getAttribute('transform') || '';
		const m = t.match(/translate\(\s*([^,]+),\s*([^)]+)\)/);
		if (!m) return null;
		return {
			col: Math.round(parseFloat(m[1]) / COL_STEP),
			row: Math.round(parseFloat(m[2]) / ROW_STEP),
			orientation: (t.includes('scale(1, -1)') || t.includes('scale(1,-1)')) ? 'down' : 'up'
		};
	}

	// --- Board Map ------------------------------------------------------------

	// Build a Map of "col,row,orient" → { el, fingerprint, col, row, orientation }
	// from the WallBoard SVG.
	function buildCellMap(board) {
		const map = new Map();
		const cells = board.querySelectorAll(':scope > g > g > g');
		for (const g of cells) {
			const pos = parseCellTransform(g);
			if (!pos) continue;
			const key = pos.col + ',' + pos.row + ',' + pos.orientation;
			map.set(key, {
				el: g,
				fingerprint: getCellFingerprint(g),
				col: pos.col,
				row: pos.row,
				orientation: pos.orientation
			});
		}
		return map;
	}

	// --- Target Pattern Extraction --------------------------------------------

	var BOTTOM_LEFT_TARGET_LAYOUT = [
		'1,1,up', '2,0,up', '2,2,down', '3,1,down',
		'3,1,up', '4,0,up', '4,2,down', '5,1,down'
	].join('|');

	function getTargetLayout(cells) {
		return cells
			.map(function (c) { return c.pos.col + ',' + c.pos.row + ',' + c.pos.orientation; })
			.sort()
			.join('|');
	}

	// Extract the target pattern from the TargetPreview SVG.
	// Picks the bottommost "up" cell as anchor (highest row), breaking ties
	// by proximity to the horizontal center. For the known 9-triangle
	// bottom-left layout, the anchor is forced to (1,1,up).
	function extractTargetPattern(preview) {
		if (!preview) return null;
		var children = Array.from(preview.querySelectorAll(':scope > g'));
		if (children.length === 0) return null;

		var cells = [];
		for (var ci = 0; ci < children.length; ci++) {
			var pos = parseCellTransform(children[ci]);
			const fingerprint = getCellFingerprint(children[ci]);
			if (!pos || !Number.isFinite(pos.col) || !Number.isFinite(pos.row) || !fingerprint) return null;
			cells.push({ pos: pos, fingerprint });
		}
		if (cells.length === 0) return null;

		var upCells = cells.filter(function (c) { return c.pos.orientation === 'up'; });
		if (upCells.length === 0) return null;

		var viewBoxAttr = (preview.getAttribute('viewBox') || '').trim();
		var viewBox = viewBoxAttr.split(/[\s,]+/).map(Number);
		var hasValidViewBox = viewBox.length === 4 &&
			viewBox.every(function (v) { return isFinite(v); }) && viewBox[2] > 0;
		var centerCol;
		if (hasValidViewBox) {
			centerCol = (viewBox[0] + viewBox[2] / 2 - COL_STEP) / COL_STEP;
		} else {
			var cols = cells.map(function (c) { return c.pos.col; });
			centerCol = (Math.min.apply(null, cols) + Math.max.apply(null, cols)) / 2;
		}

		var targetLayout = getTargetLayout(cells);
		var anchor;
		if (targetLayout === BOTTOM_LEFT_TARGET_LAYOUT) {
			anchor = upCells.find(function (c) { return c.pos.col === 1 && c.pos.row === 1; });
		}
		if (!anchor) {
			anchor = upCells[0];
			for (var i = 1; i < upCells.length; i++) {
				var cell = upCells[i];
				var isLower = cell.pos.row > anchor.pos.row;
				var isSameRowCloser = cell.pos.row === anchor.pos.row &&
					Math.abs(cell.pos.col - centerCol) < Math.abs(anchor.pos.col - centerCol);
				if (isLower || isSameRowCloser) anchor = cell;
			}
		}

		var anchorCol = anchor.pos.col;
		var anchorRow = anchor.pos.row;
		var offsets = [];
		for (var j = 0; j < cells.length; j++) {
			if (cells[j] === anchor) continue;
			var c = cells[j];
			offsets.push({
				dc: c.pos.col - anchorCol,
				dr: c.pos.row - anchorRow,
				orient: c.pos.orientation,
				fingerprint: c.fingerprint
			});
		}

		var pattern = { anchorFingerprint: anchor.fingerprint, anchorCol: anchorCol, anchorRow: anchorRow, offsets: offsets };
		return pattern;
	}

	// --- Candidate Finding ----------------------------------------------------

	// Find board positions where the target pattern matches (positive matching).
	// Uses dynamic minMatches: ceil((1+offsets.length) / 2.4)
	function findCandidates(cellMap, targetPattern, invalidPositions) {
		const { anchorFingerprint, offsets } = targetPattern;
		const totalCells = 1 + offsets.length;
		const minMatches = Math.max(2, Math.ceil(totalCells / 2.4));
		const candidates = [];

		for (const [, cell] of cellMap) {
			if (cell.orientation !== 'up') continue;
			if (invalidPositions && invalidPositions.has(cell.col + ',' + cell.row)) continue;

			let matches = 0;
			let mismatches = 0;

			// Check anchor fingerprint
			if (cell.fingerprint !== null && anchorFingerprint !== null) {
				if (cell.fingerprint === anchorFingerprint) matches++;
				else mismatches++;
			}

			// Check each offset
			for (const { dc, dr, orient, fingerprint } of offsets) {
				const offsetCell = cellMap.get(
					(cell.col + dc) + ',' + (cell.row + dr) + ',' + orient
				);
				if (!offsetCell) {
					mismatches++;
					continue;
				}
				if (offsetCell.fingerprint === null) continue;
				if (fingerprint === null) continue;

				if (offsetCell.fingerprint === fingerprint) matches++;
				else mismatches++;
			}

			if (mismatches === 0 && matches >= minMatches) {
				candidates.push({
					col: cell.col, row: cell.row, matches: matches, mismatches: mismatches,
					isCompleteMatch: matches === totalCells
				});
			}
		}

		return candidates.sort(function (a, b) { return b.matches - a.matches; });
	}

	// Elimination-based candidate finding.
	// Returns positions where NO offset has a definite mismatch or missing neighbor.
	function findPossiblePositions(cellMap, targetPattern, invalidPositions) {
		const { anchorFingerprint, offsets } = targetPattern;
		const possible = [];

		for (const [, cell] of cellMap) {
			if (cell.orientation !== 'up') continue;
			if (invalidPositions && invalidPositions.has(cell.col + ',' + cell.row)) continue;

			let impossible = false;

			// Check anchor
			if (cell.fingerprint !== null && anchorFingerprint !== null) {
				if (cell.fingerprint !== anchorFingerprint) impossible = true;
			}

			if (!impossible) {
				for (const { dc, dr, orient, fingerprint } of offsets) {
					const offsetCell = cellMap.get(
						(cell.col + dc) + ',' + (cell.row + dr) + ',' + orient
					);
					if (!offsetCell) {
						impossible = true;
						break;
					}
					if (offsetCell.fingerprint === null || fingerprint === null) continue;
					if (offsetCell.fingerprint !== fingerprint) {
						impossible = true;
						break;
					}
				}
			}

			if (!impossible) possible.push({ col: cell.col, row: cell.row });
		}

		return possible;
	}

	function confidentCandidate(cellMap, targetPattern, invalidPositions) {
		const candidates = findCandidates(cellMap, targetPattern, invalidPositions);
		// Short targets can have several visually identical, complete matches.
		const exact = candidates.filter(candidate => candidate.isCompleteMatch);
		if (exact.length) return exact.sort((a, b) => a.row - b.row || a.col - b.col)[0];
		if (invalidPositions?.size || candidates.length !== 1) return null;
		return findPossiblePositions(cellMap, targetPattern, invalidPositions).length === 1 ? candidates[0] : null;
	}

	// --- Click Simulation -----------------------------------------------------

	function clickAnchor(anchorCell) {
		if (!masterAllowed() || !anchorCell.el.isConnected) return;
		const target = anchorCell.el.querySelector(
			'[data-sentry-component="GlyphBoundingTriangle"]'
		) || anchorCell.el;
		target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
	}

	// --- Round Tracking -------------------------------------------------------

	function getRoundCounts(app = findIceWallApp()) {
		const counter = app?.querySelector('[data-sentry-element="SidebarCounterStyled"]');
		if (!counter) return null;
		const match = (counter.textContent || '').match(/^\s*(\d+)\s*\/\s*(\d+)\s*$/);
		if (!match) return null;
		const completed = Number(match[1]);
		const total = Number(match[2]);
		return total > 0 && completed <= total ? { completed, total } : null;
	}

	function readRound(app) {
		const counts = getRoundCounts(app);
		if (!counts || counts.completed >= counts.total) return null;
		const preview = app.querySelector('[data-component-name="TargetPreview"]');
		const board = app.querySelector('[data-component-name="WallBoard"]');
		const pattern = extractTargetPattern(preview);
		if (!board || !pattern) return null;
		const offsets = pattern.offsets.map(offset =>
			JSON.stringify([offset.dc, offset.dr, offset.orient, offset.fingerprint])
		).sort();
		const targetKey = JSON.stringify([pattern.anchorFingerprint, offsets]);
		return { ...counts, board, preview, pattern, targetKey };
	}

	function gameActive(app) {
		return masterAllowed() && !window.__iceWallGameEnded && findIceWallApp() === app;
	}

	function isNewRound(previous, current) {
		if (!previous) return true;
		if (current.completed <= previous.completed) return false;
		// The counter may update before the next preview. If the same pattern
		// is dealt again, accept it only after both puzzle surfaces are replaced.
		return current.targetKey !== previous.targetKey ||
			(current.preview !== previous.preview && current.board !== previous.board);
	}

	function matchRound(round, rejected) {
		const cells = buildCellMap(round.board);
		const match = confidentCandidate(cells, round.pattern, rejected);
		return match ? cells.get(match.col + ',' + match.row + ',up') : null;
	}

	// No-match and temporarily empty views are ordinary during a reveal or
	// round transition. Keep watching within the existing round budget.
	function waitForUniqueCandidate(app, previous, rejected, timeout) {
		return new Promise(resolve => {
			let lastRound = null;
			let observedBoard = null;
			let debounceTimer = null;
			let settled = false;
			const deadline = Date.now() + timeout;
			const observer = new MutationObserver(() => {
				if (settled) return;
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(sample, 60);
			});

			function finish(result) {
				settled = true;
				observer.disconnect();
				clearTimeout(debounceTimer);
				clearInterval(poll);
				document.removeEventListener('visibilitychange', sample);
				resolve(result);
			}

			function sample() {
				if (settled) return;
				if (!gameActive(app)) return finish({ phase: 'stopped' });
				const counts = getRoundCounts(app);
				if (counts && counts.completed === counts.total) return finish({ phase: 'complete' });

				const round = readRound(app);
				if (round && lastRound && round.completed > lastRound.completed) {
					previous = lastRound; // A player may advance the round while we wait.
					lastRound = null;
				}
				if (round && isNewRound(previous, round)) {
					lastRound = round;
					if (round.board !== observedBoard) {
						observer.disconnect();
						observer.observe(round.board, { subtree: true, childList: true, attributes: true });
						observedBoard = round.board;
					}
					const anchor = matchRound(round, rejected);
					if (anchor) return finish({ phase: 'match', round, anchor });
				}
				if (Date.now() >= deadline) finish({ phase: lastRound ? 'no-match' : 'target-unready' });
			}

			const poll = setInterval(sample, 150);
			document.addEventListener('visibilitychange', sample);
			sample();
		});
	}

	function mismatchNotices(app) {
		const notices = new Map();
		const rendered = app.innerText;
		if (typeof rendered !== 'string') return notices;
		for (const line of rendered.split(/\r?\n/)) {
			const text = line.trim();
			const message = text.replace(/^\d{1,2}:\d{2}(?::\d{2})?\s+/, '');
			if (!/^(?:(?:glyph(?: sequence)?|sequence|pattern) mismatch|mismatch|incorrect glyph|符文(?:序列)?不匹配|图案不匹配)(?:[.!。！]|\s*[-–—:]|$)/i.test(message)) continue;
			notices.set(text, (notices.get(text) || 0) + 1);
		}
		return notices;
	}

	async function waitForRoundResult(app, round, priorNotices) {
		const deadline = Date.now() + 4000;
		while (masterAllowed() && findIceWallApp() === app) {
			const counts = getRoundCounts(app);
			if (counts && counts.completed > round.completed &&
				(!window.__iceWallGameEnded || counts.completed === counts.total)) return 'advanced';
			if (window.__iceWallGameEnded) return 'stopped';
			if (counts?.completed === round.completed) {
				const rejected = [...mismatchNotices(app)].some(([line, count]) => count > (priorNotices.get(line) || 0));
				if (rejected) return 'rejected';
			}
			if (Date.now() >= deadline) break;
			await sleep(100);
		}
		return gameActive(app) ? 'advance-unconfirmed' : 'stopped';
	}

	// --- Solve one round and confirm the game's counter -----------------------

	async function runIceWallRound(app, previous) {
		let deadline = Date.now() + 45000;
		const rejected = new Set();
		let retryRound = null;
		while (gameActive(app) && Date.now() < deadline) {
			const result = await waitForUniqueCandidate(app, previous, rejected, deadline - Date.now());
			if (result.phase !== 'match')
				return retryRound && result.phase === 'no-match' ? { phase: 'rejected' } : result;
			if (!gameActive(app)) return { phase: 'stopped' };

			const { round, anchor } = result;
			if (retryRound) {
				if (round.completed > retryRound.completed) return { phase: 'advanced', round: retryRound };
				if (round.completed !== retryRound.completed || round.targetKey !== retryRound.targetKey ||
					round.board !== retryRound.board) return { phase: 'rejected' };
			}
			const current = readRound(app);
			if (!current || current.completed !== round.completed || current.targetKey !== round.targetKey) {
				if (getRoundCounts(app)?.completed > round.completed) previous = round;
				continue;
			}
			const currentAnchor = matchRound(current, rejected);
			if (current.board !== round.board || currentAnchor?.el !== anchor.el || !anchor.el.isConnected) continue;

			const notices = mismatchNotices(app);
			clickAnchor(anchor);
			const phase = await waitForRoundResult(app, round, notices);
			// A missing reply does not prove the click was rejected.
			if (phase !== 'rejected' || retryRound) return { phase, round };
			rejected.add(anchor.col + ',' + anchor.row);
			retryRound = round;
			deadline = Math.min(deadline, Date.now() + 4000);
		}
		return { phase: !gameActive(app) ? 'stopped' : retryRound ? 'rejected' : 'no-match' };
	}

	async function runIceWallSolver() {
		const app = findIceWallApp();
		if (!app) return;
		postStatus('ICE Wall solver started', 'info', 'started');
		let previous = null;

		while (masterAllowed() && findIceWallApp() === app) {
			const counts = getRoundCounts(app);
			if (counts && counts.completed === counts.total) {
				postStatus('Finished (' + counts.completed + '/' + counts.total + ' round(s) completed)', 'success', 'complete');
				return;
			}
			if (window.__iceWallGameEnded) return;
			postStatus('Scanning the current ICE Wall round', 'info');
			const result = await runIceWallRound(app, previous);
			if (result.phase === 'advanced') {
				previous = result.round;
				continue;
			}
			if (result.phase === 'complete' && gameActive(app)) continue;
			if (gameActive(app)) {
				const messages = {
					'target-unready': 'Next round target did not become ready',
					'no-match': 'No reliable glyph match before the deadline',
					'advance-unconfirmed': 'Round did not advance; stopping this attempt',
					'rejected': 'The game rejected the matching glyph'
				};
				if (messages[result.phase]) postStatus(messages[result.phase], 'error');
			}
			return;
		}
	}

	// --- Watcher & External API -----------------------------------------------

	let pendingMinigameData = null;
	const solverListeners = [];

	// External API: await window.awaitIceWallSolver() to wait for solver to finish
	window.awaitIceWallSolver = function () {
		return new Promise(function (resolve) {
			solverListeners.push(resolve);
		});
	};

	window.addEventListener('message', function (event) {
        if (!masterAllowed() || event.source !== window || event.origin !== location.origin) return;
		if (event.data && event.data.type === 'COR3_ICE_WALL_MINIGAME_START') {
			// Signal current solver to stop — a new game session is starting
			window.__iceWallGameEnded = true;
			gameGeneration++;
			pendingMinigameData = event.data.data;
			var sp = pendingMinigameData.meta?.staticParams;
			var logParts = ['Difficulty:', sp?.difficulty, 'Max Attempts:', sp?.maxAttempts];
			if (sp?.timerDurationMs != null) logParts.push('Timer:', sp.timerDurationMs + 'ms');
			console.log(
				'%c\uD83D\uDD13 [COR3 Helper] ICE Wall minigame started!',
				'color: #4ec9f3; font-weight: bold',
				...logParts
			);
		} else if (event.data && event.data.type === 'COR3_ICE_WALL_GAME_ENDED') {
			window.__iceWallGameEnded = true;
		}
	});

	async function watchForIceWall() {
		console.log(
			'%c\uD83D\uDD13 [COR3 Helper] ICE Wall solver watching for minigame...',
			'color: #888; font-style: italic'
		);

		while ((masterAllowed() && !window.__iceWallSolverAbort)) {
			const app = findIceWallApp();
			if (app) {
				// Reset game-ended flag for this new game session
				window.__iceWallGameEnded = false;
				var currentGen = gameGeneration;
				console.log(
					'%c\uD83D\uDD13 [COR3 Helper] ICE Wall game detected in DOM!',
					'color: #4ec9f3; font-weight: bold'
				);

				await runIceWallSolver();

				if (!masterAllowed() || window.__iceWallSolverAbort) break;

				// Wait for the game app to be removed from DOM OR a new game to start
				if (findIceWallApp() && !window.__iceWallGameEnded) {
					console.log(
						'%c\u23f3 [COR3 Helper] Waiting for ICE Wall game to close...',
						'color: #888; font-style: italic'
					);
				}
				while ((masterAllowed() && !window.__iceWallSolverAbort) && !window.__iceWallGameEnded && findIceWallApp()) {
					// Also break out if a new game generation started
					if (gameGeneration !== currentGen) break;
					await sleep(100);
				}

				// Notify any external code waiting for solver completion
				while (solverListeners.length) {
					var fn = solverListeners.shift();
					try { fn(); } catch (e) { console.log('[COR3 Helper] Error in solver listener:', e); }
				}

				if ((masterAllowed() && !window.__iceWallSolverAbort)) {
					console.log(
						'%c\uD83D\uDD13 [COR3 Helper] ICE Wall game closed. Watching for next one...',
						'color: #888; font-style: italic'
					);
				}

				pendingMinigameData = null;
			}

			await sleep(250);
		}

		// Cleanup when aborted
		window.__iceWallSolverActive = false;
		// Cancellation remains latched for this run.
		console.log(
			'%c\uD83D\uDED1 [COR3 Helper] ICE Wall solver stopped.',
			'color: #ff5555; font-weight: bold'
		);
	}

    watchForIceWall().catch(() => {
      window.postMessage({type:'COR3_OBSERVABLE_ERROR',source:'ice',code:'SOLVER_FAILED',phase:'run'}, location.origin);
    }).finally(() => { window.__iceWallSolverActive = false; lifecycleRun.finish(); });
})();


