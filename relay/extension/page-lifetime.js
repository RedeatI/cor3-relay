"use strict";
(() => {
  // relay/src/wings-materials.ts
  var wingsMaterials = [
    {
      "step": 1,
      "title": "FARLINE Universal Crimper",
      "items": [
        {
          "name": "FARLINE Universal Crimper",
          "quantity": 1
        }
      ]
    },
    {
      "step": 2,
      "title": "Workshop Selection",
      "items": []
    },
    {
      "step": 3,
      "title": "Seed Funding",
      "items": []
    },
    {
      "step": 4,
      "title": "Forged Drone License",
      "items": []
    },
    {
      "step": 5,
      "title": "Worker Clothing",
      "items": [
        {
          "name": "Old Abibas beanie",
          "quantity": 3
        },
        {
          "name": 'CCS "Kaloshi" Utility boots',
          "quantity": 3
        },
        {
          "name": "Soylent green bar",
          "quantity": 3
        },
        {
          "name": "Kosmonavt Energy Bar",
          "quantity": 3
        },
        {
          "name": "High-load auxiliary cable",
          "quantity": 2
        }
      ]
    },
    {
      "step": 6,
      "title": "Superconductor",
      "items": [
        {
          "name": "Nergalium-79-B slab",
          "quantity": 1
        },
        {
          "name": 'Core tech NIC "Nano" package',
          "quantity": 1
        },
        {
          "name": "Water vial",
          "quantity": 3
        },
        {
          "name": "Artificial milk",
          "quantity": 3
        }
      ]
    },
    {
      "step": 7,
      "title": "Shielding Element",
      "items": [
        {
          "name": "Californium-252 slab",
          "quantity": 1
        },
        {
          "name": "Holocene Holographic cable",
          "quantity": 1
        },
        {
          "name": "Scissors (CCS Field Surgeon Kit Mk2)",
          "quantity": 3
        },
        {
          "name": "Scalpel (CCS Field Surgeon Kit Mk2)",
          "quantity": 3
        },
        {
          "name": 'NPO "Platforma" universal straps with backpack connector slot',
          "quantity": 2
        }
      ]
    },
    {
      "step": 8,
      "title": "Electronics",
      "items": [
        {
          "name": "Circuit components",
          "quantity": 2
        },
        {
          "name": "CCS Painkiller inhaler",
          "quantity": 3
        },
        {
          "name": "CCS small oxygen inhaler tank",
          "quantity": 3
        },
        {
          "name": "METALIFE medical components",
          "quantity": 2
        }
      ]
    },
    {
      "step": 9,
      "title": "Optical Sensors",
      "items": [
        {
          "name": "Holocene Holographic processor",
          "quantity": 1
        },
        {
          "name": "CCS Hydrogel Burn kit",
          "quantity": 3
        },
        {
          "name": "Circuit components",
          "quantity": 2
        },
        {
          "name": "Holocene Holographic processor",
          "quantity": 1
        }
      ]
    },
    {
      "step": 10,
      "title": "Hostile Infringement Protection Firmware",
      "items": []
    },
    {
      "step": 11,
      "title": "Assembly and Calibration",
      "items": [
        {
          "name": 'SPI "Smartwrench" Powered adjustable wrench',
          "quantity": 1
        },
        {
          "name": "High-load auxiliary cable",
          "quantity": 1
        }
      ]
    },
    {
      "step": 12,
      "title": "Assembly Slot",
      "items": []
    },
    {
      "step": 13,
      "title": "Cargo Test",
      "items": []
    },
    {
      "step": 14,
      "title": "System Integration",
      "items": []
    },
    {
      "step": 15,
      "title": "Transfer",
      "items": []
    }
  ];

  // relay/src/page-lifetime.ts
  var record = (x) => x && typeof x === "object" && !Array.isArray(x) ? x : {};
  var rows = (x, maximum) => Array.isArray(x) ? x.slice(0, maximum).map(record) : [];
  var label = (x) => typeof x === "string" ? x.slice(0, 130) : "";
  var count = (x) => typeof x === "number" && Number.isSafeInteger(x) && x >= 0 ? x : null;
  var step = (x) => {
    const n = count(typeof x === "string" && /^\d+$/.test(x) ? Number(x) : x);
    return n && n <= 100 ? n : null;
  };
  function wings(action, input) {
    const data = record(input);
    if (action === "list.history" && Array.isArray(data.items)) {
      const items = rows(data.items, 32).filter((i) => step(i.step)).map((i) => ({
        step: step(i.step),
        title: label(i.title),
        status: label(i.status),
        completedSubtasks: count(i.completedSubtasks),
        totalSubtasks: count(i.totalSubtasks)
      }));
      return items.length ? { items } : null;
    }
    if (action !== "get.page" || !step(data.currentStep)) return null;
    return { currentStep: step(data.currentStep), status: label(data.status), currentStepSubtasks: rows(data.currentStepSubtasks, 32).map((s) => ({
      title: label(s.title),
      status: label(s.status),
      buyCost: count(s.buyCost),
      barterItems: rows(s.barterItems, 20).map((i) => ({
        title: label(i.title),
        availableQuantity: count(i.availableQuantity),
        requiredQuantity: count(i.requiredQuantity)
      })).filter((i) => i.title)
    })) };
  }
  function visible(node) {
    const style = getComputedStyle(node);
    return node.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse";
  }
  var windowTitle = '[data-component-name="ApplicationTitleText"]';
  var windowShell = '[data-component-name="ApplicationWindow"]';
  var terminalName = /^(?:terminal hack|终端入侵|终端破解)$/i;
  var timedTitle = /^(?:terminal hack|ice wall break|signal decode|data partition|sudoku|终端入侵|终端破解|ICE WALL 破解|信号解码|数据分区|数独)$/i;
  var activitySelectors = [
    "IceWallBreakApplication",
    "ConfigHackApplication",
    "DecryptionApplication",
    "SimpleDecryptApplication",
    "SimpleDecryptionApplication"
  ].flatMap(
    (name) => ['[data-component-name="' + name + '"]', '[data-sentry-component="' + name + '"]']
  ).concat('[data-component-name*="SimpleHack"]', '[data-sentry-component*="SimpleHack"]', 'iframe[src*="/games/"]', windowTitle).join(",");
  function timedWindows() {
    const games = [], shells = [];
    for (const el of document.querySelectorAll(activitySelectors)) {
      if (el.matches(windowTitle)) {
        if (!timedTitle.test(el.textContent?.trim() || "")) continue;
        const shell = el.closest(windowShell);
        if (shell && visible(el)) shells.push(shell);
      } else if (visible(el)) games.push(el);
    }
    return games.concat(shells.filter((shell) => !games.some((game) => shell.contains(game))));
  }
  var connectionLine = /^(?:(?:re)?connecting to (?:the )?server|(?:正在|尝试)?(?:重新)?连接(?:到)?服务器)[.。…!！\s]*$/i;
  var terminalComponent = '[data-component-name="ConfigHackApplication"],[data-sentry-component="ConfigHackApplication"]';
  var iceComponent = '[data-component-name="IceWallBreakApplication"],[data-sentry-component="IceWallBreakApplication"]';
  var iceName = /^(?:ice wall break|ICE WALL 破解)$/i;
  var iceConnection = /^(?:awaiting secure channel|等待安全通道|等待安全信道)[.。…!！\s]*$/i;
  var protectedContent = [
    "iframe",
    "canvas",
    'svg[role="grid"]',
    "input",
    "select",
    "textarea",
    "[contenteditable=true]",
    '[role="timer"]',
    '[role="grid"]',
    '[role="log"]',
    "button",
    '[role="button"]',
    ...["Timer", "Countdown", "WallBoard", "History", "EventLog"].flatMap((part) => ["data-component-name", "data-sentry-component", "data-sentry-element"].map((attribute) => "[" + attribute + '*="' + part + '"]'))
  ].join(",");
  function waitingMarker(app, component, titlePattern, messagePattern) {
    if (!visible(app)) return null;
    const shell = app.closest(windowShell);
    const title = shell?.querySelector(windowTitle);
    const matchesTitle = !!title && titlePattern.test(title.textContent?.trim() || "");
    if (!app.matches(component) && !(app === shell && matchesTitle)) return null;
    if (title && !matchesTitle) return null;
    const root = shell || app;
    const header = title?.closest('[data-sentry-element="ApplicationHeaderStyled"]') || title?.closest('[data-component-name="ApplicationTitle"]') || title;
    const hasPlayControls = Array.from(root.querySelectorAll(protectedContent)).some((el) => !header?.contains(el) && visible(el));
    if (hasPlayControls) return null;
    let body = root.innerText.trim();
    if (header) {
      const heading = header.innerText.trim();
      if (!heading || !body.startsWith(heading)) return null;
      body = body.slice(heading.length).trim();
    }
    if (!messagePattern.test(body)) return null;
    return root;
  }
  function terminalWait(app) {
    return waitingMarker(app, terminalComponent, terminalName, connectionLine);
  }
  function emptyIce(app) {
    return !!waitingMarker(app, iceComponent, iceName, iceConnection);
  }
  function readRecovery(owner) {
    if (owner === "initial-fetch") return "startup-read";
    if (owner === "manual-market:roster-home" || owner === "manual-market:roster-usol") return "roster-read";
    return null;
  }
  function monitor() {
    let signature = "", evidenceSince = 0, last = 0, wasBlocked = true, previousNode = null;
    function reset() {
      wasBlocked = true;
      signature = "";
      previousNode = null;
    }
    function observe(o) {
      const read = o.ticket && o.expired && o.fault === "lease-expired" ? readRecovery(o.active) : null;
      const equip = o.active === "page-equip" && o.fault === "equipment-unconfirmed" && o.equipmentChecks >= 2;
      const connection = o.emptyIce ? "ice-empty" : o.terminal ? "terminal-connect" : null;
      const reason = connection ?? (equip ? "equipment-unconfirmed" : read);
      const node = o.emptyIce || o.terminal || null;
      const progress = connection ? o.batchProgress : o.ticket;
      const key = JSON.stringify([o.account, o.documentId, reason, progress]);
      const blockedWork = o.batchBusy || o.queued || !!o.active && !equip && !read;
      const blocked = !o.account || !o.documentId || !o.online || !o.permitted || o.busy || !connection && blockedWork;
      if (blocked || wasBlocked || key !== signature || node !== previousNode || o.now < last || o.now - last > 95e3) {
        evidenceSince = o.now;
      }
      wasBlocked = blocked;
      signature = key;
      previousNode = node;
      last = o.now;
      if (blocked || !connection && o.quiet < 12e4) return null;
      if (reason && o.now - evidenceSince >= (reason === "equipment-unconfirmed" ? 6e5 : 18e4)) return reason;
      if (!reason && !o.active && o.hidden && o.age >= 216e5 && o.quiet >= 3e5 && o.now - evidenceSince >= 12e4) return "idle";
      return null;
    }
    return Object.assign(observe, { reset });
  }
  function isConnectionWait(reason) {
    return reason === "terminal-connect" || reason === "ice-empty";
  }
  function canReload(history, at, reason, lastRecovery) {
    if (!Array.isArray(history) || history.some((x) => !Number.isFinite(x) || x > at)) return false;
    if (isConnectionWait(reason)) {
      const previous = record(lastRecovery);
      const lastAt = count(previous.at);
      return !isConnectionWait(previous.reason) || lastAt === null || lastAt <= at && at - lastAt >= 6e5;
    }
    return history.filter((x) => x > at - 216e5).length < 2 && !history.some((x) => x > at - 18e5);
  }
  Object.assign(globalThis, { Cor3PageLifetime: Object.freeze({ wings, wingsMaterials, timedWindows, emptyIce, terminalWait, readRecovery, monitor, isConnectionWait, canReload }) });
})();
