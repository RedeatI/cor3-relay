(() => {
  function observeCenterRead(pending){
    if(!pending||typeof pending.catch!=='function')return pending;
    pending.catch(error=>{
      if(/^CENTER_[A-Z_]+$/.test(error?.message||'')){console.warn('[COR3 Helper] Account read not ready: '+error.message);return;}
      try{cor3LogError('popup.js',error,{action:'cached-read'});}catch{console.warn('[COR3 Helper] Cached read did not complete.');}
    });
    return pending;
  }
  // src/popup/i18n.js
  var _lang = globalThis.Cor3UiLanguage?.get() || "en";
  var _listeners = /* @__PURE__ */ new Set();
  var _observer = null;
  var _translating = false;
  var STATIC_ZH = {
    // Section / panel titles
    "Pinned Timers": "\u56FA\u5B9A\u8BA1\u65F6\u5668",
    "\u{1F4CC} Pinned Timers": "\u{1F4CC} \u56FA\u5B9A\u8BA1\u65F6\u5668",
    "Automation/QoL Toggles": "\u81EA\u52A8\u5316/\u4FBF\u5229\u5F00\u5173",
    "Hack Automation Toggles": "\u7834\u89E3\u81EA\u52A8\u5316\u5F00\u5173",
    "Objective Automation Toggles": "\u76EE\u6807\u81EA\u52A8\u5316\u5F00\u5173",
    "QoL Toggles": "\u4FBF\u5229\u5F00\u5173",
    "Info Panel Toggles": "\u4FE1\u606F\u9762\u677F\u5F00\u5173",
    "Daily Ops": "\u6BCF\u65E5\u884C\u52A8",
    "\u{1F4C5} Daily Ops": "\u{1F4C5} \u6BCF\u65E5\u884C\u52A8",
    "Markets": "\u5E02\u573A",
    "\u{1F3EA} Markets": "\u{1F3EA} \u5E02\u573A",
    "Expeditions": "\u8FDC\u5F81",
    "Inventory": "\u4ED3\u5E93",
    "Loadout": "\u914D\u88C5",
    "\u{1F5A5}\uFE0F Loadout": "\u{1F5A5}\uFE0F \u914D\u88C5",
    "Hardwares": "\u786C\u4EF6",
    "\u2699\uFE0F Hardwares": "\u2699\uFE0F \u786C\u4EF6",
    "Softwares": "\u8F6F\u4EF6",
    "\u{1F4BE} Softwares": "\u{1F4BE} \u8F6F\u4EF6",
    "System Overview": "\u7CFB\u7EDF\u6982\u89C8",
    "\u{1F4CA} System Overview": "\u{1F4CA} \u7CFB\u7EDF\u6982\u89C8",
    "Status: Ready": "\u72B6\u6001\uFF1A\u5C31\u7EEA",
    "Show toggles \u25BE": "\u5C55\u5F00\u5F00\u5173 \u25BE",
    "Hide toggles \u25B4": "\u6536\u8D77\u5F00\u5173 \u25B4",
    // Toggle labels
    "Helper-Only Mode": "\u4EC5\u8F85\u52A9\u6A21\u5F0F",
    "\u{1F6E1}\uFE0F Helper-Only Mode": "\u{1F6E1}\uFE0F \u4EC5\u8F85\u52A9\u6A21\u5F0F",
    "(hides automation)": "\uFF08\u9690\u85CF\u81EA\u52A8\u5316\uFF09",
    "Auto Decrypt Hacking": "\u81EA\u52A8\u89E3\u5BC6\u7834\u89E3",
    "Auto ICE Wall Hacking": "\u81EA\u52A8 ICE Wall \u7834\u89E3",
    "Auto Simple Decrypt Hacking": "\u81EA\u52A8\u7B80\u5355\u89E3\u5BC6\u7834\u89E3",
    "Auto Daily Hacking": "\u81EA\u52A8\u6BCF\u65E5\u7834\u89E3",
    "Auto Job Solver UI": "\u81EA\u52A8\u4EFB\u52A1\u6C42\u89E3\u5668\u754C\u9762",
    "\u{1F916} Auto Job Solver UI": "\u{1F916} \u81EA\u52A8\u4EFB\u52A1\u6C42\u89E3\u5668\u754C\u9762",
    "Auto Valuable Seller UI": "\u81EA\u52A8\u8D35\u91CD\u7269\u54C1\u51FA\u552E\u754C\u9762",
    "\u{1F48E} Auto Valuable Seller UI": "\u{1F48E} \u81EA\u52A8\u8D35\u91CD\u7269\u54C1\u51FA\u552E\u754C\u9762",
    "Auto Update Markets": "\u81EA\u52A8\u5237\u65B0\u5E02\u573A",
    "Auto Cleanup Failed Jobs": "\u81EA\u52A8\u6E05\u7406\u5931\u8D25\u4EFB\u52A1",
    "Auto NPC Chat": "\u81EA\u52A8 NPC \u5BF9\u8BDD",
    "Auto Chat Log": "\u81EA\u52A8\u5BF9\u8BDD\u65E5\u5FD7",
    "No auto chat activity yet.": "\u6682\u65E0\u81EA\u52A8\u5BF9\u8BDD\u8BB0\u5F55\u3002",
    "endpoint switched": "\u5DF2\u5207\u6362\u8282\u70B9",
    "endpoint already": "\u5DF2\u5728\u76EE\u6807\u8282\u70B9",
    "endpoint failed": "\u8282\u70B9\u5207\u6362\u5931\u8D25",
    "Secret Link/Server Finder": "\u9690\u85CF\u8FDE\u63A5/\u670D\u52A1\u5668\u67E5\u627E",
    "\u{1F50D} Secret Link/Server Finder": "\u{1F50D} \u9690\u85CF\u8FDE\u63A5/\u670D\u52A1\u5668\u67E5\u627E",
    "Disable Desktop Glitch/Wave": "\u7981\u7528\u684C\u9762\u6545\u969C/\u6CE2\u7EB9",
    "\u{1F3A8} Disable Desktop Glitch/Wave": "\u{1F3A8} \u7981\u7528\u684C\u9762\u6545\u969C/\u6CE2\u7EB9",
    "Disable Network Fog": "\u7981\u7528\u7F51\u7EDC\u8FF7\u96FE",
    "\u{1F3A8} Disable Network Fog": "\u{1F3A8} \u7981\u7528\u7F51\u7EDC\u8FF7\u96FE",
    "Move Notifications To Left": "\u901A\u77E5\u79FB\u52A8\u5230\u5DE6\u4FA7",
    "\u{1F4CC} Move Notifications To Left": "\u{1F4CC} \u901A\u77E5\u79FB\u52A8\u5230\u5DE6\u4FA7",
    // Status / common
    "Off": "\u5173\u95ED",
    "On": "\u5F00\u542F",
    "Active": "\u8FD0\u884C\u4E2D",
    "Inactive": "\u672A\u8FD0\u884C",
    "Running": "\u8FD0\u884C\u4E2D",
    "Paused": "\u5DF2\u6682\u505C",
    "Ready": "\u5C31\u7EEA",
    "Loading...": "\u52A0\u8F7D\u4E2D...",
    "Loading\u2026": "\u52A0\u8F7D\u4E2D\u2026",
    "Claimed": "\u5DF2\u9886\u53D6",
    "Unclaimed": "\u672A\u9886\u53D6",
    "Claim": "\u9886\u53D6",
    "Save": "\u4FDD\u5B58",
    "Cancel": "\u53D6\u6D88",
    "Insurance:": "\u4FDD\u9669\uFF1A",
    "Yes": "\u662F",
    "No": "\u5426",
    "Pending": "\u5F85\u5904\u7406",
    "Resolved": "\u5DF2\u5904\u7406",
    "AUTO-RESOLVED": "\u81EA\u52A8\u5904\u7406",
    "RESOLVED": "\u5DF2\u5904\u7406",
    "PENDING": "\u5F85\u5904\u7406",
    "No data": "\u6682\u65E0\u6570\u636E",
    "AVAILABLE": "\u53EF\u7528",
    "RESTING": "\u4F11\u606F\u4E2D",
    "IN_PROGRESS": "\u8FDB\u884C\u4E2D",
    "PREPARING": "\u51C6\u5907\u4E2D",
    "RUNNING": "\u8FDB\u884C\u4E2D",
    "COMPLETED": "\u5DF2\u5B8C\u6210",
    "FAILED": "\u5931\u8D25",
    "ARCHIVED": "\u5DF2\u5F52\u6863",
    "FULL_SUCCESS": "\u5B8C\u5168\u6210\u529F",
    "PARTIAL_SUCCESS": "\u90E8\u5206\u6210\u529F",
    "FAILURE": "\u5931\u8D25",
    "SUCCESS": "\u6210\u529F",
    "DEATH": "\u6B7B\u4EA1",
    "DAMAGED": "\u635F\u574F",
    "SEVERELY_DAMAGED": "\u4E25\u91CD\u635F\u574F",
    "DESTROYED": "\u5DF2\u6467\u6BC1",
    "No active expeditions.": "\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u8FDC\u5F81\u3002",
    "No pending decisions found.": "\u6CA1\u6709\u5F85\u5904\u7406\u7684\u51B3\u7B56\u3002",
    "No expedition data yet.": "\u6682\u65E0\u8FDC\u5F81\u6570\u636E\u3002",
    "Loading expedition data...": "\u6B63\u5728\u52A0\u8F7D\u8FDC\u5F81\u6570\u636E...",
    "No archived expeditions found.": "\u6CA1\u6709\u5DF2\u5F52\u6863\u7684\u8FDC\u5F81\u3002",
    "Loading archived expeditions...": "\u6B63\u5728\u52A0\u8F7D\u5DF2\u5F52\u6863\u8FDC\u5F81...",
    "No mercenaries found.": "\u6CA1\u6709\u53EF\u7528\u96C7\u4F63\u5175\u3002",
    "Loading mercenaries...": "\u6B63\u5728\u52A0\u8F7D\u96C7\u4F63\u5175...",
    "Waiting for mercenary data...": "\u6B63\u5728\u7B49\u5F85\u96C7\u4F63\u5175\u6570\u636E...",
    "No drone data yet. Click \u{1F504} to refresh.": "\u6682\u65E0\u65E0\u4EBA\u673A\u6570\u636E\uFF0C\u70B9\u51FB \u{1F504} \u5237\u65B0\u3002",
    "No active drone mission.": "\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u65E0\u4EBA\u673A\u4EFB\u52A1\u3002",
    "No active mission decisions.": "\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u4EFB\u52A1\u51B3\u7B56\u3002",
    "No archived drone missions found.": "\u6CA1\u6709\u5DF2\u5F52\u6863\u7684\u65E0\u4EBA\u673A\u4EFB\u52A1\u3002",
    "Requesting drone data...": "\u6B63\u5728\u8BF7\u6C42\u65E0\u4EBA\u673A\u6570\u636E...",
    "Loading archived drone missions...": "\u6B63\u5728\u52A0\u8F7D\u5DF2\u5F52\u6863\u7684\u65E0\u4EBA\u673A\u4EFB\u52A1...",
    "No items found.": "\u6CA1\u6709\u7269\u54C1\u3002",
    "Loading inventory...": "\u6B63\u5728\u52A0\u8F7D\u4ED3\u5E93...",
    "Requesting inventory from server...": "\u6B63\u5728\u4ECE\u670D\u52A1\u5668\u8BF7\u6C42\u4ED3\u5E93\u6570\u636E...",
    "No loadout data yet": "\u6682\u65E0\u914D\u88C5\u6570\u636E",
    "No data yet": "\u6682\u65E0\u6570\u636E",
    // Market labels / job reset
    "Market-1 Jobs Reset": "\u5E02\u573A-1 \u4EFB\u52A1\u91CD\u7F6E",
    "Market-2 Jobs Reset": "\u5E02\u573A-2 \u4EFB\u52A1\u91CD\u7F6E",
    "Market-3 Jobs Reset": "\u5E02\u573A-3 \u4EFB\u52A1\u91CD\u7F6E",
    "Market-4 Jobs Reset": "\u5E02\u573A-4 \u4EFB\u52A1\u91CD\u7F6E",
    "Credits": "\u4FE1\u7528\u70B9",
    "Jobs": "\u4EFB\u52A1",
    "Items": "\u7269\u54C1",
    "Lots": "\u6302\u5355",
    "Next reset": "\u4E0B\u6B21\u91CD\u7F6E",
    "Jobs Reset": "\u4EFB\u52A1\u91CD\u7F6E",
    // Inventory / sorting
    "Rarity": "\u7A00\u6709\u5EA6",
    "Tag": "\u6807\u7B7E",
    "Sell": "\u51FA\u552E",
    "Sort": "\u6574\u7406",
    "Smart Sort": "\u667A\u80FD\u6574\u7406",
    "Compact Sort": "\u7D27\u51D1\u6574\u7406",
    "Sell Price": "\u51FA\u552E\u4EF7\u683C",
    "Total Value": "\u603B\u4EF7\u503C",
    // Auto Job Solver / Auto Valuable Seller UI
    "\u{1F916} Auto Job Solver": "\u{1F916} \u81EA\u52A8\u4EFB\u52A1\u6C42\u89E3\u5668",
    "\u25B6 Start Auto Jobs": "\u25B6 \u5F00\u59CB\u81EA\u52A8\u4EFB\u52A1",
    "\u25A0 Stop Auto Jobs": "\u25A0 \u505C\u6B62\u81EA\u52A8\u4EFB\u52A1",
    "\u{1F504} Auto Finish All Jobs": "\u{1F504} \u81ea\u52a8\u5b8c\u6210\u6240\u6709\u4efb\u52a1",
    "\u{1F3AF} Auto Finish All \u2014 Job Types": "\u{1F3AF} \u81EA\u52A8\u5B8C\u6210 \u2014 \u4EFB\u52A1\u7C7B\u578B",
    "Select All Types": "\u5168\u9009\u7C7B\u578B",
    "Only new market jobs are filtered; taken jobs always run. No selection = all types.": "\u4EC5\u7B5B\u9009\u5E02\u573A\u65B0\u4EFB\u52A1\uFF0C\u5DF2\u63A5\u4EFB\u52A1\u7167\u5E38\u5B8C\u6210\uFF1B\u672A\u52FE\u9009\u4EFB\u4F55\u7C7B\u578B\u65F6\u6309\u5168\u90E8\u7C7B\u578B\u6267\u884C\u3002",
    "\u{1F5A5}\uFE0F Debug Console": "\u{1F5A5}\uFE0F \u8C03\u8BD5\u63A7\u5236\u53F0",
    "Logs": "\u65E5\u5FD7",
    "Loading job data...": "\u6B63\u5728\u52A0\u8F7D\u4EFB\u52A1\u6570\u636E...",
    "No job data yet.": "\u6682\u65E0\u4EFB\u52A1\u6570\u636E\u3002",
    "No logs yet.": "\u6682\u65E0\u65E5\u5FD7\u3002",
    "All jobs completed or expired.": "\u6240\u6709\u4EFB\u52A1\u5DF2\u5B8C\u6210\u6216\u5DF2\u8FC7\u671F\u3002",
    "Refreshing (sequential)...": "\u6B63\u5728\u4F9D\u6B21\u5237\u65B0...",
    "\u{1F48E} Auto Valuable Seller": "\u{1F48E} \u81EA\u52A8\u8D35\u91CD\u7269\u54C1\u51FA\u552E",
    "Servers": "\u670D\u52A1\u5668",
    "Downloads": "\u4E0B\u8F7D",
    "Maintenance": "\u7EF4\u62A4",
    "\u25B6 Start Valuable Seller": "\u25B6 \u5F00\u59CB\u81EA\u52A8\u51FA\u552E",
    "\u25B6 Start Valuable Search": "\u25B6 \u5F00\u59CB\u641C\u7D22\u8D35\u91CD\u7269\u54C1",
    'No valuable data yet. Click "Start Valuable Search" to scan servers.': "\u6682\u65E0\u8D35\u91CD\u7269\u54C1\u6570\u636E\u3002\u70B9\u51FB\u201C\u5F00\u59CB\u641C\u7D22\u8D35\u91CD\u7269\u54C1\u201D\u626B\u63CF\u670D\u52A1\u5668\u3002",
    'No download data yet. Click "Start Valuable Search" to scan.': "\u6682\u65E0\u4E0B\u8F7D\u6570\u636E\u3002\u70B9\u51FB\u201C\u5F00\u59CB\u641C\u7D22\u8D35\u91CD\u7269\u54C1\u201D\u626B\u63CF\u3002",
    'Run "Start Valuable Search" to see the maintenance status of servers. If no servers are shown after the search, there is no upcoming or active maintenance.': "\u8FD0\u884C\u201C\u5F00\u59CB\u641C\u7D22\u8D35\u91CD\u7269\u54C1\u201D\u4EE5\u67E5\u770B\u670D\u52A1\u5668\u7EF4\u62A4\u72B6\u6001\u3002\u5982\u679C\u641C\u7D22\u540E\u6CA1\u6709\u663E\u793A\u670D\u52A1\u5668\uFF0C\u5219\u6CA1\u6709\u5373\u5C06\u8FDB\u884C\u6216\u6B63\u5728\u8FDB\u884C\u7684\u7EF4\u62A4\u3002",
    // Version / updates
    "Check for Updates": "\u68C0\u67E5\u66F4\u65B0",
    "You're up to date!": "\u5DF2\u662F\u6700\u65B0\u7248\u672C\uFF01",
    "Updates detected:": "\u68C0\u6D4B\u5230\u66F4\u65B0\uFF1A",
    "Download from GitHub": "\u4ECE GitHub \u4E0B\u8F7D"
  };
  var ERROR_ZH = {
    "Unknown error": "\u672A\u77E5\u9519\u8BEF",
    "unknown error": "\u672A\u77E5\u9519\u8BEF",
    "IP already exists on server": "\u8BE5 IP \u5DF2\u5B58\u5728\u4E8E\u670D\u52A1\u5668",
    "Server IP limit reached": "\u670D\u52A1\u5668 IP \u6570\u91CF\u5DF2\u8FBE\u4E0A\u9650",
    "No path to server (unreachable)": "\u65E0\u6CD5\u5230\u8FBE\u670D\u52A1\u5668\uFF08\u4E0D\u53EF\u8FBE\uFF09",
    "Server is in maintenance": "\u670D\u52A1\u5668\u7EF4\u62A4\u4E2D",
    "Missing required software": "\u7F3A\u5C11\u6240\u9700\u8F6F\u4EF6",
    "Not enough hack power": "\u7834\u89E3\u7B97\u529B\u4E0D\u8DB3",
    "No hacking software": "\u6CA1\u6709\u7834\u89E3\u8F6F\u4EF6",
    "Cannot read SAI file": "\u65E0\u6CD5\u8BFB\u53D6 SAI \u6587\u4EF6",
    "Access token expired or invalid": "\u8BBF\u95EE\u4EE4\u724C\u8FC7\u671F\u6216\u65E0\u6548",
    "Session token expired": "\u4F1A\u8BDD\u4EE4\u724C\u5DF2\u8FC7\u671F",
    "Job already taken previously": "\u4EFB\u52A1\u5DF2\u88AB\u63A5\u53D6",
    "Job no longer available": "\u4EFB\u52A1\u5DF2\u4E0D\u53EF\u7528",
    "Job has expired": "\u4EFB\u52A1\u5DF2\u8FC7\u671F",
    "Job conditions not met": "\u4EFB\u52A1\u6761\u4EF6\u672A\u6EE1\u8DB3",
    "File not found on server": "\u670D\u52A1\u5668\u4E0A\u627E\u4E0D\u5230\u6587\u4EF6",
    "Log not found on server": "\u670D\u52A1\u5668\u4E0A\u627E\u4E0D\u5230\u65E5\u5FD7",
    "Access denied to server": "\u670D\u52A1\u5668\u8BBF\u95EE\u88AB\u62D2\u7EDD",
    "Rate limited \u2014 too many requests": "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u5DF2\u88AB\u9650\u6D41",
    "File not found on server/folder": "\u670D\u52A1\u5668/\u6587\u4EF6\u5939\u4E2D\u627E\u4E0D\u5230\u6587\u4EF6",
    "Market not reachable": "\u5E02\u573A\u4E0D\u53EF\u8FBE",
    "Unable to decrypt that file extension. Please install the appropriate decryption software": "\u65E0\u6CD5\u89E3\u5BC6\u8BE5\u6587\u4EF6\u6269\u5C55\u540D\uFF0C\u8BF7\u5B89\u88C5\u76F8\u5E94\u7684\u89E3\u5BC6\u8F6F\u4EF6",
    "Insufficient decrypt power for this file": "\u8BE5\u6587\u4EF6\u89E3\u5BC6\u7B97\u529B\u4E0D\u8DB3",
    "File is already decrypted": "\u6587\u4EF6\u5DF2\u89E3\u5BC6",
    "Job is not available (stale data)": "\u4EFB\u52A1\u4E0D\u53EF\u7528\uFF08\u6570\u636E\u8FC7\u671F\uFF09",
    "No cor3.gg tab": "\u672A\u627E\u5230 cor3.gg \u6807\u7B7E\u9875",
    "Insufficient credits to launch expedition": "\u4FE1\u7528\u70B9\u4E0D\u8DB3\uFF0C\u65E0\u6CD5\u6D3E\u9063\u8FDC\u5F81",
    "Insufficient credits to open reward container. Auto-send disabled.": "\u4FE1\u7528\u70B9\u4E0D\u8DB3\uFF0C\u65E0\u6CD5\u5F00\u542F\u5956\u52B1\u5BB9\u5668\u3002\u81EA\u52A8\u6D3E\u9063\u5DF2\u7981\u7528\u3002",
    "Auto expedition paused: automatic mercenary selection returned no mercenary.": "\u81EA\u52A8\u8FDC\u5F81\u5DF2\u6682\u505C\uFF1A\u81EA\u52A8\u9009\u62E9\u672A\u8FD4\u56DE\u53EF\u7528\u96C7\u4F63\u5175\u3002",
    "Auto expedition paused: the selected expedition location is missing zone/goal config.": "\u81EA\u52A8\u8FDC\u5F81\u5DF2\u6682\u505C\uFF1A\u6240\u9009\u8FDC\u5F81\u5730\u70B9\u7F3A\u5C11\u533A\u57DF/\u76EE\u6807\u914D\u7F6E\u3002",
    "Auto expedition paused: stash is full. Clear stash space, then turn Auto expedition off and on to resume.": "\u81EA\u52A8\u8FDC\u5F81\u5DF2\u6682\u505C\uFF1A\u4ED3\u5E93\u5DF2\u6EE1\u3002\u8BF7\u6E05\u7406\u4ED3\u5E93\u7A7A\u95F4\uFF0C\u7136\u540E\u5173\u95ED\u518D\u5F00\u542F\u201C\u81EA\u52A8\u8FDC\u5F81\u201D\u4EE5\u6062\u590D\u3002",
    "Auto expedition paused: not enough credits. Earn credits, then turn Auto expedition off and on to resume.": "\u81EA\u52A8\u8FDC\u5F81\u5DF2\u6682\u505C\uFF1A\u4FE1\u7528\u70B9\u4E0D\u8DB3\u3002\u8BF7\u83B7\u53D6\u66F4\u591A\u4FE1\u7528\u70B9\uFF0C\u7136\u540E\u5173\u95ED\u518D\u5F00\u542F\u201C\u81EA\u52A8\u8FDC\u5F81\u201D\u4EE5\u6062\u590D\u3002",
    "Auto drone paused. Re-enable Auto expedition to resume.": "\u81EA\u52A8\u65E0\u4EBA\u673A\u5DF2\u6682\u505C\u3002\u8BF7\u91CD\u65B0\u542F\u7528\u201C\u81EA\u52A8\u8FDC\u5F81\u201D\u4EE5\u6062\u590D\u3002",
    "Drone is destroyed \u2014 auto-drone paused. Repair or replace the drone.": "\u65E0\u4EBA\u673A\u5DF2\u6467\u6BC1\u2014\u2014\u81EA\u52A8\u8FDC\u5F81\u5DF2\u6682\u505C\u3002\u8BF7\u7EF4\u4FEE\u6216\u66F4\u6362\u65E0\u4EBA\u673A\u3002"
  };
  var ERROR_PHRASES_ZH = [
    ["Auto expedition paused:", "\u81EA\u52A8\u8FDC\u5F81\u5DF2\u6682\u505C\uFF1A"],
    ["no available mercenary with expedition data. All candidates may be resting or missing configure data.", "\u6CA1\u6709\u53EF\u7528\u4E14\u5DF2\u83B7\u53D6\u8FDC\u5F81\u6570\u636E\u7684\u96C7\u4F63\u5175\u3002\u6240\u6709\u5019\u9009\u53EF\u80FD\u90FD\u5728\u4F11\u606F\u6216\u7F3A\u5C11\u914D\u7F6E\u6570\u636E\u3002"],
    [" USOL market is unreachable.", " USOL \u5E02\u573A\u4E0D\u53EF\u8FBE\u3002"],
    ["selected mercenary is no longer available (status: ", "\u6240\u9009\u96C7\u4F63\u5175\u5DF2\u4E0D\u53EF\u7528\uFF08\u72B6\u6001\uFF1A"],
    ["no expedition config available for ", "\u6CA1\u6709\u53EF\u7528\u7684\u8FDC\u5F81\u914D\u7F6E\uFF1A"],
    ["Failed to open reward container: ", "\u5F00\u542F\u5956\u52B1\u5BB9\u5668\u5931\u8D25\uFF1A"],
    ["Mercenary not available after ", "\u96C7\u4F63\u5175\u4E0D\u53EF\u7528\uFF0C\u5DF2\u91CD\u8BD5 "],
    [" retries. Merc data may be stale.", " \u6B21\u3002\u96C7\u4F63\u5175\u6570\u636E\u53EF\u80FD\u5DF2\u8FC7\u671F\u3002"],
    ["Expedition action still in progress \u2014 retrying shortly\u2026", "\u8FDC\u5F81\u64CD\u4F5C\u4ECD\u5728\u5904\u7406\u4E2D\u2014\u2014\u7A0D\u540E\u91CD\u8BD5\u2026"],
    ["Turn Auto expedition off and on to retry.", "\u8BF7\u5173\u95ED\u518D\u5F00\u542F\u201C\u81EA\u52A8\u8FDC\u5F81\u201D\u4EE5\u91CD\u8BD5\u3002"],
    ["stash is full. Clear stash space, then turn Auto expedition off and on to resume.", "\u4ED3\u5E93\u5DF2\u6EE1\u3002\u8BF7\u6E05\u7406\u4ED3\u5E93\u7A7A\u95F4\uFF0C\u7136\u540E\u5173\u95ED\u518D\u5F00\u542F\u201C\u81EA\u52A8\u8FDC\u5F81\u201D\u4EE5\u6062\u590D\u3002"],
    ["not enough credits. Earn credits, then turn Auto expedition off and on to resume.", "\u4FE1\u7528\u70B9\u4E0D\u8DB3\u3002\u8BF7\u83B7\u53D6\u66F4\u591A\u4FE1\u7528\u70B9\uFF0C\u7136\u540E\u5173\u95ED\u518D\u5F00\u542F\u201C\u81EA\u52A8\u8FDC\u5F81\u201D\u4EE5\u6062\u590D\u3002"],
    ["Rate limited \u2014 retrying in ", "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\u2014\u2014\u6B63\u5728\u91CD\u8BD5\uFF1A"],
    ["Rate limited \u2014 auto-dispatch disabled after ", "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\u2014\u2014\u81EA\u52A8\u8FDC\u5F81\u5DF2\u7981\u7528\uFF0C\u91CD\u8BD5\u6B21\u6570\uFF1A"],
    [" retries. Re-enable to resume.", " \u6B21\u3002\u91CD\u65B0\u542F\u7528\u540E\u7EE7\u7EED\u3002"],
    ["Drone repair failed: ", "\u65E0\u4EBA\u673A\u7EF4\u4FEE\u5931\u8D25\uFF1A"],
    ["Drone launch failed: ", "\u65E0\u4EBA\u673A\u6D3E\u9063\u5931\u8D25\uFF1A"],
    ["Drone claim failed: ", "\u65E0\u4EBA\u673A\u9886\u53D6\u5931\u8D25\uFF1A"],
    ["Drone ", "\u65E0\u4EBA\u673A "],
    [" deferred (", " \u64CD\u4F5C\u5EF6\u8FDF\uFF08"],
    [") \u2014 retrying\u2026", "\uFF09\u2014\u2014 \u6B63\u5728\u91CD\u8BD5\u2026"],
    ["Auto-send disabled.", "\u81EA\u52A8\u6D3E\u9063\u5DF2\u7981\u7528\u3002"]
  ];
  function translateErrorText(text) {
    if (_lang !== "zh" || text == null) return text == null ? "" : String(text);
    let out = String(text);
    if (ERROR_ZH[out]) return ERROR_ZH[out];
    for (const [en, zh] of ERROR_PHRASES_ZH) {
      if (out.indexOf(en) !== -1) out = out.split(en).join(zh);
    }
    return out;
  }
  var PHRASE_ZH = [
    ["Battery Cost:", "\u7535\u91CF\u6D88\u8017\uFF1A"],
    ["Total Cost:", "\u603B\u8D39\u7528\uFF1A"],
    ["Open Cost:", "\u5F00\u542F\u8D39\u7528\uFF1A"],
    ["Sell Price:", "\u51FA\u552E\u4EF7\u683C\uFF1A"],
    ["Next Task:", "\u4E0B\u4E00\u4EFB\u52A1\uFF1A"],
    ["Next reset:", "\u4E0B\u6B21\u91CD\u7F6E\uFF1A"],
    ["Grace period ends:", "\u5BBD\u9650\u671F\u7ED3\u675F\uFF1A"],
    ["Remaining:", "\u5269\u4F59\uFF1A"],
    ["Deadline:", "\u622A\u6B62\u65F6\u95F4\uFF1A"],
    ["Expires in:", "\u5269\u4F59\u65F6\u95F4\uFF1A"],
    ["Task:", "\u4EFB\u52A1\uFF1A"],
    ["Claimed:", "\u5DF2\u9886\u53D6\uFF1A"],
    ["Streak:", "\u8FDE\u7EED\u5929\u6570\uFF1A"],
    ["Difficulty:", "\u96BE\u5EA6\uFF1A"],
    ["Bonus:", "\u5956\u52B1\uFF1A"],
    ["Reward:", "\u5956\u52B1\uFF1A"],
    ["Credits:", "\u4FE1\u7528\u70B9\uFF1A"],
    ["Jobs:", "\u4EFB\u52A1\uFF1A"],
    ["Items:", "\u7269\u54C1\uFF1A"],
    ["Lots:", "\u6302\u5355\uFF1A"],
    ["Status:", "\u72B6\u6001\uFF1A"],
    ["Location:", "\u5730\u70B9\uFF1A"],
    ["Mission:", "\u4EFB\u52A1\uFF1A"],
    ["Risk:", "\u98CE\u9669\uFF1A"],
    ["Loot:", "\u6218\u5229\u54C1\uFF1A"],
    ["Battery:", "\u7535\u91CF\uFF1A"],
    ["Durability:", "\u8010\u4E45\uFF1A"],
    ["Cost:", "\u8D39\u7528\uFF1A"]
  ];
  function translatePhrases(text) {
    let out = text;
    for (const [en, zh] of PHRASE_ZH) {
      if (out.indexOf(en) !== -1) out = out.split(en).join(zh);
    }
    return out;
  }
  function getUiLang() {
    return _lang;
  }
  function t(en, zh) {
    return _lang === "zh" ? zh : en;
  }
  function translateStatus(text) {
    if (_lang !== "zh" || text == null) return text;
    return STATIC_ZH[String(text)] || String(text);
  }
  function marketLabel(name) {
    if (name == null) return "";
    const text = String(name);
    if (_lang !== "zh") return text;
    return text.replace(/\bMarkets\b/g, "\u5E02\u573A").replace(/\bMarket\b/g, "\u5E02\u573A");
  }
  function onLangChange(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }
  function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n-en]").forEach((el) => {
      const text = _lang === "zh" ? el.dataset.i18nZh : el.dataset.i18nEn;
      if (text != null) el.textContent = text;
    });
    document.querySelectorAll("[data-i18n-title-en]").forEach((el) => {
      const text = _lang === "zh" ? el.dataset.i18nTitleZh : el.dataset.i18nTitleEn;
      if (text != null) el.title = text;
    });
  }
  function shouldSkipTextNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest("script, style, [data-i18n-en]")) return true;
    return false;
  }
  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkipTextNode(node)) return;
    const current = node.nodeValue;
    if (!node.__i18nOriginal || current !== node.__i18nOriginal && current !== node.__i18nLast) {
      node.__i18nOriginal = current;
    }
    const original = node.__i18nOriginal;
    const trimmed = original.trim();
    if (!trimmed) return;
    let translated = trimmed;
    if (_lang === "zh") {
      if (STATIC_ZH[trimmed] != null) {
        translated = STATIC_ZH[trimmed];
      } else {
        translated = marketLabel(translatePhrases(trimmed));
      }
    }
    const next = original.replace(trimmed, translated);
    node.__i18nLast = next;
    if (node.nodeValue !== next) node.nodeValue = next;
  }
  function translateTextIn(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
  }
  function installObserver() {
    if (_observer || !document.body) return;
    _observer = new MutationObserver((mutations) => {
      if (_translating) return;
      if (_lang !== "zh") return;
      _translating = true;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          translateTextIn(node);
        }
      }
      _translating = false;
    });
    _observer.observe(document.body, { childList: true, subtree: true });
  }
  function applyLangUi() {
    document.documentElement.lang = _lang === "zh" ? "zh-CN" : "en";
    if(globalThis.Cor3UiLanguage){_listeners.forEach(fn=>{try{fn(_lang);}catch{}});return;}
    const btn = document.getElementById("langToggleBtn");
    if (btn) btn.title = t("Language", "\u8BED\u8A00");
    document.querySelectorAll("#langDropdown .theme-option").forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.lang === _lang);
    });
    applyStaticTranslations();
    translateTextIn(document.body);
    _listeners.forEach((fn) => {
      try {
        fn(_lang);
      } catch (e) {
      }
    });
  }
  async function setLang(lang) {
    if(globalThis.Cor3UiLanguage)return globalThis.Cor3UiLanguage.set(lang);
    _lang = lang === "zh" ? "zh" : "en";
    await Cor3CenterStore.set({ uiLang: _lang });
    applyLangUi();
  }
  function setupLanguageDropdown() {
    const btn = document.getElementById("langToggleBtn");
    const dropdown = document.getElementById("langDropdown");
    if (!btn || !dropdown) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const themeDropdown2 = document.getElementById("themeDropdown");
      if (themeDropdown2) themeDropdown2.classList.remove("open");
      dropdown.classList.toggle("open");
    });
    dropdown.querySelectorAll(".theme-option").forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.remove("open");
        setLang(opt.dataset.lang);
      });
    });
    document.addEventListener("click", () => dropdown.classList.remove("open"));
  }
  function init() {
    if(globalThis.Cor3UiLanguage){const service=globalThis.Cor3UiLanguage;const sync=()=>{_lang=service.get();applyLangUi();};service.onChanged(sync);void service.ready.then(sync);sync();return;}
    setupLanguageDropdown();
    installObserver();
    Cor3CenterStore.get("uiLang", (data) => {
      _lang = data && data.uiLang === "zh" ? "zh" : "en";
      applyLangUi();
    });
  }
  init();

  // src/popup/state.js
  var state = {
    isHelper: false,
    expeditionEndTimes: {},
    dailyNextTaskTime: null,
    coreMarketName: null,
    darkMarketName: null,
    soyuzMarketName: null,
    usolMarketName: null,
    coreNextJobsResetAt: null,
    bmiNextJobsResetAt: null,
    soyuzNextJobsResetAt: null,
    usolNextJobsResetAt: null,
    isRefreshing: false,
    refreshQueue: [],
    isProcessingQueue: false,
    pinnedTimers: { daily: false, home_jobs: false, dark_jobs: false, soyuz_jobs: false, usol_jobs: false },
    autoRefresh: { home_jobs: false, dark_jobs: false, soyuz_jobs: false, usol_jobs: false },
    autoRefreshRetry: { home_jobs: null, dark_jobs: null, soyuz_jobs: null, usol_jobs: null },
    lastTimerSeconds: { home_jobs: null, dark_jobs: null, soyuz_jobs: null, usol_jobs: null },
    cachedLoadoutData: null,
    selectedMercenaryId: null,
    mercRestTimers: {},
    autoJobsRunning: false,
    autoFinishAllActive: false,
    autoJobsSelectedTypes: { home: [], dark: [], soyuz: [], usol: [] },
    autoJobsDebugLogs: [],
    autoJobsTracker: [],
    valuableSearchRunning: false,
    valuableSellerRunning: false,
    valuableDebugLogs: [],
    autoChosenDecisions: /* @__PURE__ */ new Set(),
    _specialistTimerInterval: null,
    _renderDebugJobsId: 0,
    _maintTimerInterval: null
  };
  var zoomList = {
    "Lyapun AA8": 2.1,
    "A/Bver 410": 2.1,
    "RE-nova v3.0": 2.1,
    "D-Badger v2.2": 2.1,
    "Porter-triX lr8": 2.1,
    "H0pp3R ced/p 03": 1.8,
    "Screener Pro r10": 1.8,
    "5CRYPt0L 0J": 2.3,
    "OmniFlow 12.35X": 2.575,
    "8Pro Series 1870": 2.5,
    "I-Partner C16-10": 2.6
  };

  // src/popup/theme.js
  var themeToggleBtn = document.getElementById("themeToggleBtn");
  var themeDropdown = document.getElementById("themeDropdown");
  var themeOptions = themeDropdown.querySelectorAll(".theme-option");
  function applyTheme(themeName) {
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) document.body.classList.remove(cls);
    });
    if (themeName) {
      document.body.classList.add("theme-" + themeName);
    }
    themeOptions.forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.theme === themeName);
    });
  }
  Cor3CenterStore.get("selectedTheme", (data) => {
    applyTheme(data.selectedTheme || "default");
  });
  themeToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const langDropdown = document.getElementById("langDropdown");
    if (langDropdown) langDropdown.classList.remove("open");
    themeDropdown.classList.toggle("open");
  });
  themeOptions.forEach((opt) => {
    opt.addEventListener("click", async (e) => {
      e.stopPropagation();
      const theme = opt.dataset.theme;
      applyTheme(theme);
      await Cor3CenterStore.set({ selectedTheme: theme });
      themeDropdown.classList.remove("open");
    });
  });
  document.addEventListener("click", () => {
    themeDropdown.classList.remove("open");
  });

  // src/popup/utils.js
  async function getCor3Tab() { return Cor3CenterUi.resolve(); }
  function formatTimeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - ts;
    if (diff < 6e4) return t("Updated just now", "\u521A\u521A\u66F4\u65B0");
    const mins = Math.floor(diff / 6e4);
    if (mins < 60) return t(`Updated ${mins}m ago`, `\u66F4\u65B0\u4E8E ${mins} \u5206\u949F\u524D`);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return t(`Updated ${hrs}h ${remMins}m ago`, `\u66F4\u65B0\u4E8E ${hrs} \u5C0F\u65F6 ${remMins} \u5206\u949F\u524D`);
  }
  function showLastUpdated(el, tsKey) {
    Cor3CenterStore.get(tsKey, (result) => {
      const ts = result[tsKey];
      el.textContent = ts ? formatTimeAgo(ts) : "";
    });
  }
  function formatTimeRemaining(dateStr) {
    if (!dateStr) return "--";
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const totalSec = Math.floor(diff / 1e3);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor(totalSec % 3600 / 60);
    const s = totalSec % 60;
    return `${h}h:${m}m:${s}s`;
  }
  function humanDelay(min = 400, max = 900) {
    return new Promise((r) => setTimeout(r, min + Math.floor(Math.random() * (max - min))));
  }
  function waitForStorageKey(key, timeoutMs = 8e3) {
    return new Promise((resolve) => {
      let done = false;
      const poll = setInterval(async () => {
        const data = await Cor3CenterStore.get(key);
        if (data[key]) {
          clearInterval(poll);
          if (!done) {
            done = true;
            resolve(true);
          }
        }
      }, 400);
      setTimeout(() => {
        clearInterval(poll);
        if (!done) {
          done = true;
          resolve(false);
        }
      }, timeoutMs);
    });
  }
  function updateSelectAllState(selectAllCb, checkboxes) {
    if (checkboxes.length === 0) {
      selectAllCb.checked = false;
      selectAllCb.indeterminate = false;
      return;
    }
    const checkedCount = checkboxes.filter((cb) => cb.checked).length;
    selectAllCb.checked = checkedCount === checkboxes.length;
    selectAllCb.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
  }

  // src/popup/panel-controls.js
  var statusDiv = document.getElementById("status");
  var sidePanelBtn = document.getElementById("sidePanelBtn");
  (function detectMode() {
    const params = new URLSearchParams(window.location.search);
    const isPopout = params.get("mode") === "popout";
    const isSidePanel = params.get("mode") === "sidepanel";
    if (!isPopout && !isSidePanel) return;
    document.body.classList.add(isPopout ? "mode-popout" : "mode-sidepanel");
    const mainView = document.getElementById("mainView");
    if (!mainView) return;
    function makeCard(elements) {
      const card = document.createElement("div");
      card.className = "popout-card";
      for (const el of elements) card.appendChild(el);
      return card;
    }
    const grid = document.createElement("div");
    grid.id = "popoutGrid";
    const headerRow = mainView.querySelector(".header-row");
    const insertRef = headerRow ? headerRow.nextSibling : mainView.firstChild;
    const wrappedEls = /* @__PURE__ */ new Set();
    function addCard(elements) {
      if (!elements || elements.length === 0) return;
      const filtered = elements.filter(Boolean);
      if (filtered.length === 0) return;
      const card = makeCard(filtered);
      grid.appendChild(card);
      for (const el of filtered) wrappedEls.add(el);
    }
    const helperDiv = mainView.querySelector("#helperModeToggle")?.closest('div[style*="justify-content"]');
    const pinned = document.getElementById("pinnedTimersSection");
    addCard([helperDiv, pinned].filter(Boolean));
    addCard([mainView.querySelector(".toggles-section")].filter(Boolean));
    addCard([document.getElementById("dailyOpsAutomationPanel")].filter(Boolean));
    addCard([document.getElementById("autoJobSolverSection")].filter(Boolean));
    addCard([document.getElementById("autoValuableSellerSection")].filter(Boolean));
    const allSections = mainView.querySelectorAll(":scope > .section");
    let marketsSection = null;
    for (const s of allSections) {
      if (s.style.display === "none") continue;
      if (s.querySelector("#marketContainer")) {
        marketsSection = s;
        break;
      }
    }
    if (marketsSection) {
      wrappedEls.add(marketsSection);
      addCard([marketsSection]);
    }
    let expeditionsSection = null;
    for (const s of allSections) {
      if (s.querySelector("#expeditionInfoContainer") || s.querySelector("#activeExpeditionSection")) {
        expeditionsSection = s;
        break;
      }
    }
    if (expeditionsSection) {
      wrappedEls.add(expeditionsSection);
      addCard([expeditionsSection]);
    }
    let inventorySection = null;
    for (const s of allSections) {
      if (s.id === "inventoryPanelSection") {
        inventorySection = s;
        break;
      }
    }
    if (inventorySection) {
      wrappedEls.add(inventorySection);
      addCard([inventorySection]);
    }
    let loadoutSection = null;
    for (const s of allSections) {
      if (s.querySelector("#refreshLoadoutBtn") || s.querySelector("#loadoutHwContainer")) {
        loadoutSection = s;
        break;
      }
    }
    if (loadoutSection) {
      wrappedEls.add(loadoutSection);
      addCard([loadoutSection]);
    }
    for (const s of allSections) {
      if (wrappedEls.has(s)) continue;
      if (s.querySelector(".alarm-section-title") || s.querySelector("#alarmList")) {
        addCard([s]);
      }
    }
    const versionEls = [];
    const vi = document.getElementById("versionInfoSection");
    if (vi) {
      const p = vi.closest('div[style*="border-top"]');
      if (p) versionEls.push(p);
    }
    const cb = document.getElementById("checkUpdateBtn");
    if (cb) {
      const p = cb.closest('div[style*="text-align:center"]');
      if (p) versionEls.push(p);
    }
    const st = document.getElementById("status");
    if (st) versionEls.push(st);
    addCard(versionEls);
    const remaining = Array.from(mainView.children).filter(
      (el) => !wrappedEls.has(el) && el !== headerRow && !el.classList.contains("theme-dropdown") && el !== grid
    );
    for (const el of remaining) {
      if (el.nodeType !== 1) continue;
      if (el.id === "popoutGrid") continue;
      const card = document.createElement("div");
      card.className = "popout-card";
      card.appendChild(el);
      grid.appendChild(card);
    }
    mainView.insertBefore(grid, insertRef);
  })();
  if (sidePanelBtn) {
    sidePanelBtn.addEventListener("click", async () => {
      try {
        await Cor3CenterUi.panel();
        window.close();
      } catch (e) {
        document.getElementById("centerConnectionStatus").textContent = "侧栏未打开。请在当前游戏标签使用插件弹窗。";
      }
    });
  }

  // src/popup/timestamps.js
  var dailyLastUpdated = document.getElementById("dailyLastUpdated");
  var coreMarketLastUpdated = document.getElementById("coreMarketLastUpdated");
  var darkMarketLastUpdated = document.getElementById("darkMarketLastUpdated");
  var soyuzMarketLastUpdated = document.getElementById("soyuzMarketLastUpdated");
  var usolMarketLastUpdated = document.getElementById("usolMarketLastUpdated");
  var expeditionLastUpdated = document.getElementById("expeditionLastUpdated");
  var personalDroneLastUpdated = document.getElementById("personalDroneLastUpdated");
  var inventoryLastUpdated = document.getElementById("inventoryLastUpdated");
  var archivedExpLastUpdated = document.getElementById("archivedExpLastUpdated");
  var loadoutLastUpdated = document.getElementById("loadoutLastUpdated");
  function refreshAllTimestamps() {
    showLastUpdated(dailyLastUpdated, "dailyOpsUpdatedAt");
    showLastUpdated(coreMarketLastUpdated, "marketDataUpdatedAt");
    showLastUpdated(darkMarketLastUpdated, "darkMarketDataUpdatedAt");
    showLastUpdated(soyuzMarketLastUpdated, "soyuzMarketDataUpdatedAt");
    showLastUpdated(usolMarketLastUpdated, "usolMarketDataUpdatedAt");
    showLastUpdated(expeditionLastUpdated, "expeditionsDataUpdatedAt");
    showLastUpdated(personalDroneLastUpdated, "droneDataUpdatedAt");
    if (inventoryLastUpdated) showLastUpdated(inventoryLastUpdated, "stashDataUpdatedAt");
    if (archivedExpLastUpdated) showLastUpdated(archivedExpLastUpdated, "archivedExpeditionsUpdatedAt");
    if (loadoutLastUpdated) showLastUpdated(loadoutLastUpdated, "loadoutUpdatedAt");
  }
  onLangChange(() => refreshAllTimestamps());

  // src/popup/dom-helpers.js
  function _h(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "className") e.className = v;
        else if (k === "textContent") e.textContent = v;
        else if (k === "title") e.title = v;
        else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === "style" && typeof v === "string") e.style.cssText = v;
        else if (k === "dataset" && typeof v === "object") {
          for (const [dk, dv] of Object.entries(v)) e.dataset[dk] = dv;
        } else e.setAttribute(k, v);
      }
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      if (typeof c === "string" || typeof c === "number") e.appendChild(document.createTextNode(String(c)));
      else if (c instanceof Node) e.appendChild(c);
      else if (Array.isArray(c)) c.forEach((x) => {
        if (x instanceof Node) e.appendChild(x);
        else if (x != null && x !== false) e.appendChild(document.createTextNode(String(x)));
      });
    }
    return e;
  }
  function _noData(...parts) {
    const d = document.createElement("div");
    d.className = "no-decisions";
    parts.forEach((p, i) => {
      if (i > 0) d.appendChild(document.createElement("br"));
      d.appendChild(document.createTextNode(p));
    });
    return d;
  }
  function _clearEl(el) {
    el.textContent = "";
  }
  function _safeSetHtml(el, html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    el.replaceChildren(...doc.body.childNodes);
  }

  // src/popup/daily-ops.js
  var dailyTimerLine = document.getElementById("dailyTimerLine");
  var dailyStatusLine = document.getElementById("dailyStatusLine");
  var dailyClaimed = document.getElementById("dailyClaimed");
  var dailyStreak = document.getElementById("dailyStreak");
  var dailyDifficulty = document.getElementById("dailyDifficulty");
  var dailyStreakBonus = document.getElementById("dailyStreakBonus");
  var refreshDailyBtn = document.getElementById("refreshDailyBtn");
  function updateDailyTimer() {
    if (!state.dailyNextTaskTime) {
      dailyTimerLine.textContent = "\u23F3 Next Task: --:--:--";
      return;
    }
    const now = Date.now();
    const diff = state.dailyNextTaskTime - now;
    if (diff <= 0) {
      dailyTimerLine.textContent = "\u23F3 Next Task: 0h:0m:0s";
      return;
    }
    const totalSec = Math.floor(diff / 1e3);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor(totalSec % 3600 / 60);
    const s = totalSec % 60;
    dailyTimerLine.textContent = `\u23F3 Next Task: ${h}h:${m}m:${s}s`;
  }
  function calcStreakBonus(streak, rewardsData) {
    if (!rewardsData || !Array.isArray(rewardsData) || streak === void 0 || streak === null) return "--";
    const dayEntry = rewardsData.find((r) => r.day === streak);
    if (dayEntry && dayEntry.amount !== void 0) return (dayEntry.amount / 100).toFixed(2);
    const sorted = rewardsData.filter((r) => r.day <= streak).sort((a, b) => b.day - a.day);
    if (sorted.length > 0 && sorted[0].amount !== void 0) return (sorted[0].amount / 100).toFixed(2);
    return "--";
  }
  async function displayDailyOpsData(data) {
    if (!data) return;
    state.dailyNextTaskTime = data.nextTaskTime ? new Date(data.nextTaskTime).getTime() : null;
    dailyClaimed.textContent = data.hasClaimedToday ? "Yes" : "No";
    dailyStreak.textContent = data.currentStreak ?? "--";
    dailyDifficulty.textContent = data.difficulty ? data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1) : "--";
    const { dailyRewardsData } = await Cor3CenterStore.get("dailyRewardsData");
    const bonus = calcStreakBonus(data.currentStreak, dailyRewardsData);
    dailyStreakBonus.textContent = bonus;
    updateDailyTimer();
  }
  async function fetchDailyOps() {
    dailyStatusLine.style.display = "";
    dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-cyan);" }, "\u23F3 Refreshing daily ops..."));
    try {
      const tab = await getCor3Tab();
      if (!tab) {
        dailyStatusLine.style.display = "";
        dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-red);" }, "\u26A0\uFE0F No cor3.gg tab found"));
        return;
      }
      console.log("[COR3 Helper] Sending fetchDailyOps message to content script");
      const response = await Cor3CenterUi.send(tab.id, { action: "fetchDailyOps" });
      if (response && response.error && (response.error === "token_expired" || response.error.includes("Invalid access token"))) {
        dailyStatusLine.style.display = "";
        dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-red);" }, "\u26A0\uFE0F Access token expired. Page refresh required."));
        return;
      }
      if (response && response.data) {
        console.log("[COR3 Helper] Daily ops data received:", response.data);
        await displayDailyOpsData(response.data);
        dailyStatusLine.style.display = "none";
        refreshAllTimestamps();
      } else if (response === void 0) {
        console.log("[COR3 Helper] No response from content script, trying cached data");
        const { dailyOpsData } = await Cor3CenterStore.get("dailyOpsData");
        if (dailyOpsData) {
          await displayDailyOpsData(dailyOpsData);
          dailyStatusLine.style.display = "";
          dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-orange);" }, "\u26A0\uFE0F Using cached data (content script not responding)"));
        } else {
          dailyStatusLine.style.display = "";
          dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-red);" }, "\u26A0\uFE0F No data available. Refresh the page."));
        }
      } else {
        const { dailyOpsData } = await Cor3CenterStore.get("dailyOpsData");
        if (dailyOpsData) await displayDailyOpsData(dailyOpsData);
      }
    } catch (e) {
      console.log("[COR3 Helper] Daily ops fetch error:", e);
      cor3LogError("popup.js", e, { action: "fetchDailyOps" });
      try {
        const { dailyOpsData } = await Cor3CenterStore.get("dailyOpsData");
        if (dailyOpsData) {
          await displayDailyOpsData(dailyOpsData);
          dailyStatusLine.style.display = "";
          dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-orange);" }, "\u26A0\uFE0F Using cached data (error occurred)"));
        } else {
          dailyStatusLine.style.display = "";
          dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-red);" }, "\u26A0\uFE0F Failed to load daily ops"));
        }
      } catch (e2) {
        dailyStatusLine.style.display = "";
        dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-red);" }, "\u26A0\uFE0F Failed to load daily ops"));
      }
    }
  }
  async function loadCachedDailyOps() {
    try {
      const { dailyOpsData, dailyOpsError } = await Cor3CenterStore.get(["dailyOpsData", "dailyOpsError"]);
      if (dailyOpsError === "token_expired") {
        dailyStatusLine.style.display = "";
        dailyStatusLine.replaceChildren(_h("span", { style: "color:var(--accent-red);" }, "\u26A0\uFE0F Access token expired. Page refresh required."));
      }
      if (dailyOpsData) await displayDailyOpsData(dailyOpsData);
    } catch (e) {
    }
  }
  function initDailyOps() {
    observeCenterRead(loadCachedDailyOps());
    refreshDailyBtn.addEventListener("click", () => fetchDailyOps());
  }
  initDailyOps();

  // src/popup/dev-tcs.js
  var devTcsSection = document.getElementById("devTcsSection");
  var reachPullBtn = document.getElementById("devTcReachPullBtn");
  var reachSelect = document.getElementById("devTcReachSelect");
  var reachToggle = document.getElementById("devTcReachToggle");
  var reachLog = document.getElementById("devTcReachLog");
  var _reachMapCache = null;
  function reachLogMsg(msg, color) {
    if (!reachLog) return;
    reachLog.style.display = "";
    const line = document.createElement("div");
    line.textContent = "[" + (/* @__PURE__ */ new Date()).toLocaleTimeString() + "] " + msg;
    if (color) line.style.color = color;
    reachLog.appendChild(line);
    reachLog.scrollTop = reachLog.scrollHeight;
  }
  function clearReachLog() {
    if (reachLog) {
      reachLog.innerHTML = "";
      reachLog.style.display = "none";
    }
  }
  if (reachPullBtn) {
    reachPullBtn.addEventListener("click", async () => {
      reachPullBtn.disabled = true;
      reachPullBtn.textContent = "...";
      clearReachLog();
      reachLogMsg("Sending get.map...");
      const tab = await getCor3Tab();
      if (!tab) {
        reachLogMsg("No cor3.gg tab found", "var(--accent-red)");
        reachPullBtn.disabled = false;
        reachPullBtn.textContent = "\u{1F504}";
        return;
      }
      Cor3CenterUi.send(tab.id, { action: "requestNetworkMap" });
      const waitStart = Date.now();
      const poll = setInterval(async () => {
        const data = await Cor3CenterStore.get("serverMaintenanceMap");
        if (data.serverMaintenanceMap && Object.keys(data.serverMaintenanceMap).length > 0) {
          clearInterval(poll);
          _reachMapCache = data.serverMaintenanceMap;
          populateReachSelect(data.serverMaintenanceMap);
          reachLogMsg("Map loaded: " + Object.keys(data.serverMaintenanceMap).length + " servers", "var(--accent-green)");
          reachPullBtn.disabled = false;
          reachPullBtn.textContent = "\u{1F504}";
        } else if (Date.now() - waitStart > 1e4) {
          clearInterval(poll);
          reachLogMsg("Timeout waiting for map data", "var(--accent-red)");
          reachPullBtn.disabled = false;
          reachPullBtn.textContent = "\u{1F504}";
        }
      }, 500);
    });
  }
  function populateReachSelect(servers) {
    if (!reachSelect) return;
    reachSelect.innerHTML = "";
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "\u2014 select server \u2014";
    reachSelect.appendChild(defaultOpt);
    const sorted = Object.entries(servers).sort((a, b) => (a[1].serverName || "").localeCompare(b[1].serverName || ""));
    for (const [id, info] of sorted) {
      const opt = document.createElement("option");
      opt.value = id;
      let label = info.serverName || id.substring(0, 8);
      if (info.isInMaintenance) label += " \u26D4";
      opt.textContent = label;
      reachSelect.appendChild(opt);
    }
  }
  if (reachToggle) {
    reachToggle.addEventListener("change", async () => {
      if (!reachToggle.checked) return;
      reachToggle.disabled = true;
      const serverId = reachSelect ? reachSelect.value : "";
      if (!serverId) {
        reachLogMsg("No server selected", "var(--accent-red)");
        reachToggle.checked = false;
        reachToggle.disabled = false;
        return;
      }
      const serverName = _reachMapCache && _reachMapCache[serverId] ? _reachMapCache[serverId].serverName : serverId.substring(0, 8);
      clearReachLog();
      reachLogMsg("Testing reachability to " + serverName + "...");
      const tab = await getCor3Tab();
      if (!tab) {
        reachLogMsg("No cor3.gg tab found", "var(--accent-red)");
        reachToggle.checked = false;
        reachToggle.disabled = false;
        return;
      }
      reachLogMsg("Connecting to " + serverName + "...");
      Cor3CenterUi.send(tab.id, { action: "devTcTestReachability", serverId });
      const resultKey = "_devTcReachResult";
      const progressKey = "_devTcReachProgress";
      await Cor3CenterStore.remove([resultKey, progressKey]);
      let lastLogCount = 0;
      const waitStart = Date.now();
      const poll = setInterval(async () => {
        const progressData = await Cor3CenterStore.get(progressKey);
        if (progressData[progressKey] && progressData[progressKey].log) {
          const lines = progressData[progressKey].log;
          for (let i = lastLogCount; i < lines.length; i++) {
            reachLogMsg(lines[i].msg, lines[i].color || null);
          }
          lastLogCount = lines.length;
        }
        const data = await Cor3CenterStore.get(resultKey);
        if (data[resultKey]) {
          clearInterval(poll);
          const result = data[resultKey];
          for (let i = lastLogCount; i < (result.log || []).length; i++) {
            reachLogMsg(result.log[i].msg, result.log[i].color || null);
          }
          if (result.reachable) {
            reachLogMsg("Reachable: YES", "var(--accent-green)");
          } else {
            reachLogMsg("Reachable: NO \u2014 " + (result.reason || "unknown"), "var(--accent-red)");
          }
          Cor3CenterStore.remove([resultKey, progressKey]);
          reachToggle.checked = false;
          reachToggle.disabled = false;
        } else if (Date.now() - waitStart > 3e5) {
          clearInterval(poll);
          reachLogMsg("Timeout waiting for reachability result (5m)", "var(--accent-red)");
          Cor3CenterStore.remove([resultKey, progressKey]);
          reachToggle.checked = false;
          reachToggle.disabled = false;
        }
      }, 500);
    });
  }

  // src/popup/pinned-timers.js
  var pinnedTimersSection = document.getElementById("pinnedTimersSection");
  var pinnedTimersContainer = document.getElementById("pinnedTimersContainer");
  var pinDailyBtn = document.getElementById("pinDailyBtn");
  var pinCoreMarketBtn = document.getElementById("pinCoreMarketBtn");
  var pinDarkMarketBtn = document.getElementById("pinDarkMarketBtn");
  var pinSoyuzMarketBtn = document.getElementById("pinSoyuzMarketBtn");
  var pinUsolMarketBtn = document.getElementById("pinUsolMarketBtn");
  async function loadPinnedState() {
    const data = await Cor3CenterStore.get(["pinnedTimers", "autoRefresh"]);
    if (data.pinnedTimers) state.pinnedTimers = data.pinnedTimers;
    if (data.autoRefresh) state.autoRefresh = data.autoRefresh;
    updatePinButtons();
    renderPinnedTimers();
  }
  async function savePinnedState() {
    await Cor3CenterStore.set({ pinnedTimers: state.pinnedTimers, autoRefresh: state.autoRefresh });
  }
  function updatePinButtons() {
    pinDailyBtn.classList.toggle("pinned", !!state.pinnedTimers.daily);
    pinCoreMarketBtn.classList.toggle("pinned", !!state.pinnedTimers.home_jobs);
    pinDarkMarketBtn.classList.toggle("pinned", !!state.pinnedTimers.dark_jobs);
    pinSoyuzMarketBtn.classList.toggle("pinned", !!state.pinnedTimers.soyuz_jobs);
    pinUsolMarketBtn.classList.toggle("pinned", !!state.pinnedTimers.usol_jobs);
  }
  function renderPinnedTimers() {
    let anyPinned = state.pinnedTimers.daily || state.pinnedTimers.home_jobs || state.pinnedTimers.dark_jobs || state.pinnedTimers.soyuz_jobs || state.pinnedTimers.usol_jobs;
    if (!anyPinned) {
      for (const key of Object.keys(state.pinnedTimers)) {
        if (key.startsWith("exp_") && state.pinnedTimers[key]) {
          anyPinned = true;
          break;
        }
      }
    }
    pinnedTimersSection.style.display = anyPinned ? "" : "none";
    _clearEl(pinnedTimersContainer);
    if (state.pinnedTimers.daily) {
      const row = _h(
        "div",
        { className: "pinned-timer-row" },
        _h("div", null, _h("span", { className: "pinned-timer-symbol-daily" }, "\u{1F4C5} "), _h("span", { className: "pinned-timer-label" }, "Daily Ops")),
        _h("span", { className: "pinned-timer-value", id: "pinnedDailyValue" }, "--:--:--")
      );
      pinnedTimersContainer.appendChild(row);
    }
    function _buildJobRow(pinKey, symbolCls, symbol, name, valueId, autoRefreshId) {
      const row = _h(
        "div",
        { className: "pinned-timer-row" },
        _h("div", { style: "width: 200%;" }, _h("span", { className: symbolCls }, symbol + " "), _h("span", { className: "pinned-timer-label" }, name + " Jobs")),
        _h("span", { className: "pinned-timer-value", id: valueId }, "--:--:--")
      );
      if (!state.isHelper) {
        const cb = _h("input", { type: "checkbox", id: autoRefreshId });
        if (state.autoRefresh[pinKey]) cb.checked = true;
        row.appendChild(_h("label", { className: "pinned-auto-refresh", title: "Auto-refresh jobs when timer hits 0" }, cb, " Auto"));
        pinnedTimersContainer.appendChild(row);
        cb.addEventListener("change", async () => {
          state.autoRefresh[pinKey] = cb.checked;
          await savePinnedState();
          sendAutoRefreshToContent();
        });
      } else {
        pinnedTimersContainer.appendChild(row);
      }
    }
    if (state.pinnedTimers.home_jobs) _buildJobRow("home_jobs", "pinned-timer-symbol-core", "\u{1F3E0}", state.coreMarketName || "Market-1", "pinnedCoreJobsValue", "autoRefreshCore");
    if (state.pinnedTimers.dark_jobs) _buildJobRow("dark_jobs", "pinned-timer-symbol-dark", "\u{1F311}", state.darkMarketName || "Market-2", "pinnedDarkJobsValue", "autoRefreshDark");
    if (state.pinnedTimers.soyuz_jobs) _buildJobRow("soyuz_jobs", "pinned-timer-symbol-soyuz", "\u262D", state.soyuzMarketName || "Market-3", "pinnedSoyuzJobsValue", "autoRefreshSoyuz");
    if (state.pinnedTimers.usol_jobs) _buildJobRow("usol_jobs", "pinned-timer-symbol-usol", "\u262E", state.usolMarketName || "Market-4", "pinnedUsolJobsValue", "autoRefreshUsol");
    for (const key of Object.keys(state.pinnedTimers)) {
      if (!key.startsWith("exp_") || !state.pinnedTimers[key]) continue;
      const expId = key.substring(4);
      const endTime = state.expeditionEndTimes[expId];
      let expLabel = "Expedition";
      const row = _h(
        "div",
        { className: "pinned-timer-row" },
        _h("span", { className: "pinned-timer-label" }, "\u{1F3AF} ", _h("span", { className: "pinned-exp-label", dataset: { expId } }, expLabel)),
        _h("span", { className: "pinned-timer-value pinned-exp-timer", dataset: { expId } }, endTime ? formatTimeRemaining(endTime) : "--:--:--")
      );
      pinnedTimersContainer.appendChild(row);
    }
    Cor3CenterStore.get(["expeditionsData", "droneMissionData"], async (result) => {
      const exps = result.expeditionsData || [];
      const droneMission = result.droneMissionData || null;
      const activeExpIds = new Set(exps.map((e) => e.id));
      const activeDroneId = droneMission && droneMission.status === "RUNNING" ? droneMission.id : null;
      if (activeDroneId) activeExpIds.add(activeDroneId);
      let staleRemoved = false;
      for (const key of Object.keys(state.pinnedTimers)) {
        if (key.startsWith("exp_") && state.pinnedTimers[key]) {
          const expId = key.substring(4);
          if (!activeExpIds.has(expId)) {
            delete state.pinnedTimers[key];
            delete state.expeditionEndTimes[expId];
            staleRemoved = true;
          }
        }
      }
      if (staleRemoved) {
        await savePinnedState();
        renderPinnedTimers();
        return;
      }
      for (const exp of exps) {
        if (exp.endTime) state.expeditionEndTimes[exp.id] = exp.endTime;
        const labelEl = pinnedTimersContainer.querySelector(`.pinned-exp-label[data-exp-id="${exp.id}"]`);
        if (labelEl) {
          labelEl.textContent = `${exp.locationName || "Expedition"} \u2014 ${exp.zoneName || ""}`;
        }
      }
      if (activeDroneId) {
        if (droneMission.endTime) state.expeditionEndTimes[activeDroneId] = droneMission.endTime;
        const labelEl = pinnedTimersContainer.querySelector(`.pinned-exp-label[data-exp-id="${activeDroneId}"]`);
        if (labelEl) {
          const loc = droneMission.location && droneMission.location.name || "";
          const mis = droneMission.mission && droneMission.mission.name || "";
          labelEl.textContent = `${loc} \u2014 ${mis}`;
        }
      }
    });
  }
  function updatePinnedTimerValues() {
    const pinnedDaily = document.getElementById("pinnedDailyValue");
    if (pinnedDaily) {
      if (!state.dailyNextTaskTime) {
        pinnedDaily.textContent = "--:--:--";
      } else {
        const diff = state.dailyNextTaskTime - Date.now();
        if (diff <= 0) {
          pinnedDaily.textContent = "0h:0m:0s";
        } else {
          const totalSec = Math.floor(diff / 1e3);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor(totalSec % 3600 / 60);
          const s = totalSec % 60;
          pinnedDaily.textContent = `${h}h:${m}m:${s}s`;
        }
      }
    }
    const pinnedCore = document.getElementById("pinnedCoreJobsValue");
    if (pinnedCore) {
      pinnedCore.textContent = state.coreNextJobsResetAt ? formatTimeRemaining(state.coreNextJobsResetAt) : "--:--:--";
    }
    const pinnedDark = document.getElementById("pinnedDarkJobsValue");
    if (pinnedDark) {
      pinnedDark.textContent = state.bmiNextJobsResetAt ? formatTimeRemaining(state.bmiNextJobsResetAt) : "--:--:--";
    }
    const pinnedSoyuz = document.getElementById("pinnedSoyuzJobsValue");
    if (pinnedSoyuz) {
      pinnedSoyuz.textContent = state.soyuzNextJobsResetAt ? formatTimeRemaining(state.soyuzNextJobsResetAt) : "--:--:--";
    }
    const pinnedUsol = document.getElementById("pinnedUsolJobsValue");
    if (pinnedUsol) {
      pinnedUsol.textContent = state.usolNextJobsResetAt ? formatTimeRemaining(state.usolNextJobsResetAt) : "--:--:--";
    }
    document.querySelectorAll(".pinned-exp-timer").forEach((el) => {
      const expId = el.dataset.expId;
      const endTime = state.expeditionEndTimes[expId];
      el.textContent = endTime ? formatTimeRemaining(endTime) : "--:--:--";
    });
  }
  async function sendAutoRefreshToContent() {
    const tab = await getCor3Tab();
    if (tab) {
      Cor3CenterUi.send(tab.id, {
        action: "updateAutoRefresh",
        autoRefresh: state.autoRefresh
      }).catch(() => {
      });
    }
  }
  function initPinnedTimers() {
    pinDailyBtn.addEventListener("click", async () => {
      state.pinnedTimers.daily = !state.pinnedTimers.daily;
      await savePinnedState();
      updatePinButtons();
      renderPinnedTimers();
    });
    pinCoreMarketBtn.addEventListener("click", async () => {
      state.pinnedTimers.home_jobs = !state.pinnedTimers.home_jobs;
      await savePinnedState();
      updatePinButtons();
      renderPinnedTimers();
    });
    pinDarkMarketBtn.addEventListener("click", async () => {
      state.pinnedTimers.dark_jobs = !state.pinnedTimers.dark_jobs;
      await savePinnedState();
      updatePinButtons();
      renderPinnedTimers();
    });
    pinSoyuzMarketBtn.addEventListener("click", async () => {
      state.pinnedTimers.soyuz_jobs = !state.pinnedTimers.soyuz_jobs;
      await savePinnedState();
      updatePinButtons();
      renderPinnedTimers();
    });
    pinUsolMarketBtn.addEventListener("click", async () => {
      state.pinnedTimers.usol_jobs = !state.pinnedTimers.usol_jobs;
      await savePinnedState();
      updatePinButtons();
      renderPinnedTimers();
    });
    observeCenterRead(loadPinnedState());
    Cor3CenterStore.get("autoRefresh", (data) => {
      if (data.autoRefresh) state.autoRefresh = data.autoRefresh;
      sendAutoRefreshToContent();
    });
  }
  initPinnedTimers();

  // src/popup/expeditions.js
  var expeditionInfoContainer = document.getElementById("expeditionInfoContainer");
  var personalDroneSectionToggle = document.getElementById("personalDroneSectionToggle");
  var personalDroneSectionBody = document.getElementById("personalDroneSectionBody");
  if (personalDroneSectionToggle && personalDroneSectionBody) {
    personalDroneSectionToggle.addEventListener("click", async () => {
      personalDroneSectionToggle.classList.toggle("open");
      personalDroneSectionBody.classList.toggle("open");
    });
  }
  observeCenterRead(loadExpeditions());
  function renderExpeditionError(error) {
    const now = Date.now();
    if (error.noRetry) {
      return _h(
        "div",
        { className: "warning-banner", style: "background:rgba(255,80,80,0.15);border-color:var(--accent-red);color:var(--accent-red);" },
        _h("div", { style: { fontWeight: "bold", marginBottom: "4px" } }, t("\u274C Expedition Error", "\u274C \u8FDC\u5F81\u9519\u8BEF")),
        _h("div", { style: { fontSize: "10px" } }, translateErrorText(error.error)),
        _h("div", { style: { fontSize: "10px", marginTop: "4px" } }, t("Re-enable Auto expedition to retry.", "\u8BF7\u91CD\u65B0\u542F\u7528\u201C\u81EA\u52A8\u8FDC\u5F81\u201D\u540E\u91CD\u8BD5\u3002"))
      );
    }
    const retryAfter = error.retryAfter || 12e4;
    const timeUntilRetry = Math.max(0, retryAfter - (now - error.timestamp));
    if (timeUntilRetry > 0) {
      const retryMinutes = Math.ceil(timeUntilRetry / 6e4);
      return _h(
        "div",
        { className: "warning-banner", style: "background:rgba(255,165,0,0.15);border-color:var(--accent-orange);color:var(--accent-orange);" },
        _h("div", { style: { fontWeight: "bold", marginBottom: "4px" } }, t("\u26A0\uFE0F Expedition Launch Failed", "\u26A0\uFE0F \u8FDC\u5F81\u6D3E\u9063\u5931\u8D25")),
        _h("div", { style: { fontSize: "10px" } }, translateErrorText(error.error)),
        _h("div", { style: { fontSize: "10px", marginTop: "4px" } }, t(`Retrying in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}...`, `\u5C06\u5728 ${retryMinutes} \u5206\u949F\u540E\u91CD\u8BD5...`))
      );
    }
    Cor3CenterStore.remove("expeditionLaunchError");
    return null;
  }
  function buildContainerItems(containerData) {
    const frag = document.createDocumentFragment();
    frag.appendChild(_h("div", { className: "detail-row", style: "color:var(--accent-green);font-weight:bold;" }, "Items Found:"));
    for (const item of containerData) {
      const tierColor = item.tier === "RARE" ? "var(--accent-blue)" : item.tier === "EPIC" ? "var(--accent-purple,#a855f7)" : item.tier === "LEGENDARY" ? "var(--accent-orange)" : "var(--text-dim)";
      const img = _h("img", { src: item.imageUrl, style: "width:32px;height:32px;border-radius:4px;background:rgba(255,255,255,0.05);" });
      img.onerror = function() {
        this.style.display = "none";
      };
      frag.appendChild(
        _h(
          "div",
          { style: "display:flex;align-items:center;gap:8px;padding:3px 0;" },
          img,
          _h(
            "div",
            { style: "flex:1;min-width:0;" },
            _h("div", { style: "font-size:11px;font-weight:bold;color:var(--text-primary);" }, `${item.name} x${item.quantity}`),
            _h("div", { style: `font-size:9px;color:${tierColor};` }, item.tier)
          )
        )
      );
    }
    return frag;
  }
  function renderExpeditionInfo(expeditions) {
    _clearEl(expeditionInfoContainer);
    Cor3CenterStore.get("expeditionLaunchError", (result) => {
      if (result.expeditionLaunchError) {
        const errorEl = renderExpeditionError(result.expeditionLaunchError);
        if (errorEl) expeditionInfoContainer.appendChild(errorEl);
      }
    });
    if (!expeditions || expeditions.length === 0) {
      if (!expeditionInfoContainer.hasChildNodes()) {
        expeditionInfoContainer.appendChild(_noData("No active expeditions."));
      }
      return;
    }
    for (const exp of expeditions) {
      if (exp.endTime) {
        state.expeditionEndTimes[exp.id] = exp.endTime;
      }
      const card = document.createElement("div");
      card.className = "expedition-card";
      const statusClass = exp.status === "RUNNING" ? " running" : "";
      const mercName = exp.mercenary ? exp.mercenary.callsign : "Unknown";
      const insurance = exp.hasInsurance ? "Yes" : "No";
      const header = _h(
        "div",
        { className: "exp-header" },
        _h("span", { className: "exp-title" }, `\u{1F4CD} ${exp.locationName || "Unknown"} \u2014 ${exp.zoneName || "Unknown"}`),
        _h("span", { className: "exp-status" + statusClass }, exp.status || "UNKNOWN")
      );
      card.appendChild(header);
      const payAndOpenMsg = exp.messages && exp.messages.find((m) => m.actionType === "pay_and_open");
      const hasContainerData = exp.containerData && Array.isArray(exp.containerData) && exp.containerData.length > 0;
      if (hasContainerData) {
        card.appendChild(buildContainerItems(exp.containerData));
      } else if (payAndOpenMsg && exp.status === "COMPLETED" && !exp.containerOpenedAt) {
        const ad = payAndOpenMsg.actionData || {};
        const row = _h(
          "div",
          { style: "display:flex;align-items:center;gap:10px;" },
          _h(
            "div",
            { style: "flex:1;" },
            _h(
              "div",
              { className: "detail-row" },
              _h("span", { className: "label" }, "Open Cost:"),
              ` \u{1F4B0} ${(ad.cost || 0).toLocaleString()}`
            ),
            _h(
              "div",
              { className: "detail-row" },
              _h("span", { className: "label" }, "Items Inside:"),
              ` \u{1F4E6} ${ad.itemCount || "?"}`
            )
          )
        );
        if (ad.containerImageUrl) {
          const cImg = _h("img", { src: ad.containerImageUrl, style: "width:48px;height:48px;border-radius:6px;background:rgba(255,255,255,0.05);" });
          cImg.onerror = function() {
            this.style.display = "none";
          };
          row.appendChild(cImg);
        }
        card.appendChild(row);
      } else {
        const mercRow = _h(
          "div",
          { className: "detail-row" },
          _h("span", { className: "label" }, "Mercenary:"),
          ` \u{1F9D1} ${mercName}`
        );
        if (exp.specialization === "PROSPECTOR") {
          mercRow.appendChild(_h("span", { className: "merc-elite-badge" }, "ELITE"));
        }
        card.appendChild(mercRow);
        card.appendChild(_h(
          "div",
          { className: "detail-row" },
          _h("span", { className: "label" }, "Total Cost:"),
          ` \u{1F4B0} ${exp.totalCost ? exp.totalCost.toLocaleString() : "--"}`
        ));
        card.appendChild(_h(
          "div",
          { className: "detail-row" },
          _h("span", { className: "label" }, "Insurance:"),
          ` ${insurance}`
        ));
        card.appendChild(_h(
          "div",
          { className: "detail-row" },
          _h("span", { className: "label" }, "Risk Score:"),
          ` ${exp.riskScore ?? "--"}`
        ));
        if (exp.endTime) {
          const timerSpan = _h("span", { className: "exp-timer", dataset: { expId: exp.id } }, formatTimeRemaining(exp.endTime));
          const pinBtn = _h("button", { className: "refresh-btn-small pin-btn pin-exp-btn", dataset: { expId: exp.id }, title: "Pin Expedition Timer" }, "\u{1F4CC}");
          card.appendChild(_h(
            "div",
            { className: "exp-timer-row" },
            _h("span", { style: "font-size:11px;color:var(--accent-orange);" }, "\u23F3 ", timerSpan),
            pinBtn
          ));
        }
      }
      expeditionInfoContainer.appendChild(card);
    }
    expeditionInfoContainer.querySelectorAll(".pin-exp-btn").forEach((btn) => {
      const expId = btn.dataset.expId;
      btn.classList.toggle("pinned", !!state.pinnedTimers["exp_" + expId]);
      btn.addEventListener("click", async () => {
        const key = "exp_" + expId;
        state.pinnedTimers[key] = !state.pinnedTimers[key];
        btn.classList.toggle("pinned", !!state.pinnedTimers[key]);
        await savePinnedState();
        renderPinnedTimers();
      });
    });
  }
  async function loadExpeditions() {
    const { expeditionsData } = await Cor3CenterStore.get("expeditionsData");
    renderExpeditionInfo(expeditionsData || []);
    refreshAllTimestamps();
    setInterval(() => {
      Cor3CenterStore.get("expeditionLaunchError", (result) => {
        if (result.expeditionLaunchError) {
          const error = result.expeditionLaunchError;
          const now = Date.now();
          const retryAfter = error.retryAfter || 12e4;
          const timeUntilRetry = Math.max(0, retryAfter - (now - error.timestamp));
          if (timeUntilRetry <= 0) {
            Cor3CenterStore.remove("expeditionLaunchError");
            observeCenterRead(loadExpeditions());
          }
        }
      });
    }, 3e4);
  }
  async function requestExpeditions() {
    expeditionInfoContainer.replaceChildren(_noData("Loading expedition data..."));
    await Cor3CenterStore.remove(["expeditionsData", "expeditionDecisions"]);
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestExpeditions" });
    } catch (e) {
    }
    let loaded = false;
    const poll = setInterval(async () => {
      const { expeditionsData } = await Cor3CenterStore.get("expeditionsData");
      if (expeditionsData) {
        clearInterval(poll);
        if (loaded) return;
        loaded = true;
        await loadExpeditions();
      }
    }, 300);
    setTimeout(() => {
      clearInterval(poll);
      if (!loaded) {
        loaded = true;
        expeditionInfoContainer.replaceChildren(_noData("No active expeditions."));
      }
    }, 5e3);
  }

  // src/popup/expedition-tabs.js
  var expTabMercenaries = document.getElementById("expTabMercenaries");
  var expTabDrone = document.getElementById("expTabDrone");
  var expPanelMercenaries = document.getElementById("expPanelMercenaries");
  var expPanelDrone = document.getElementById("expPanelDrone");
  function switchExpeditionMode(mode) {
    if (!expTabMercenaries || !expTabDrone || !expPanelMercenaries || !expPanelDrone) return;
    const merc = mode === "merc";
    expTabMercenaries.classList.toggle("active", merc);
    expTabDrone.classList.toggle("active", !merc);
    expPanelMercenaries.classList.toggle("active", merc);
    expPanelDrone.classList.toggle("active", !merc);
  }
  if (expTabMercenaries) expTabMercenaries.addEventListener("click", () => switchExpeditionMode("merc"));
  if (expTabDrone) expTabDrone.addEventListener("click", () => switchExpeditionMode("drone"));
  [["mercExpActiveToggle", "mercExpActiveBody"]].forEach(([thId, tbId]) => {
    const h = document.getElementById(thId);
    const b = document.getElementById(tbId);
    if (h && b) h.addEventListener("click", () => {
      h.classList.toggle("open");
      b.classList.toggle("open");
    });
  });

  // src/popup/drone.js
  var refreshDroneBtn = document.getElementById("refreshDroneBtn");
  var personalDroneContainer = document.getElementById("personalDroneContainer");
  var personalDroneLastUpdated2 = document.getElementById("personalDroneLastUpdated");
  var droneWarning = document.getElementById("droneWarning");
  var autoDroneToggle = document.getElementById("autoDroneToggle");
  var autoDroneRepairToggle = document.getElementById("autoDroneRepairToggle");
  var droneActiveContainer = document.getElementById("droneActiveContainer");
  var droneActiveLastUpdated = document.getElementById("droneActiveLastUpdated");
  var droneArchivedToggle = document.getElementById("droneArchivedToggle");
  var droneArchivedSectionBody = document.getElementById("droneArchivedSectionBody");
  var droneArchivedContainer = document.getElementById("droneArchivedContainer");
  var droneArchivedLastUpdated = document.getElementById("droneArchivedLastUpdated");
  var refreshDroneActiveBtn = document.getElementById("refreshDroneActiveBtn");
  var refreshDroneArchivedBtn = document.getElementById("refreshDroneArchivedBtn");
  var droneExpActiveToggle = document.getElementById("droneExpActiveToggle");
  var droneExpActiveBody = document.getElementById("droneExpActiveBody");
  var _droneData = null;
  var _droneMissionData = null;
  var _droneArchivedLoaded = false;
  var _droneSettings = { enabled: false, paused: false, repairEnabled: false };
  var _localWarning = "";
  function normalizeDroneSettings(raw) {
    const cfg = raw || {};
    return {
      enabled: !!cfg.enabled,
      paused: !!cfg.paused,
      repairEnabled: !!cfg.repairEnabled
    };
  }
  function droneSettingsToStorage() {
    return {
      enabled: autoDroneToggle ? autoDroneToggle.checked : false,
      repairEnabled: autoDroneRepairToggle ? autoDroneRepairToggle.checked : false
    };
  }
  function saveDroneSettings() {
    Cor3CenterStore.update("autoDrone",droneSettingsToStorage());
  }
  function setDroneWarningText(text) {
    if (!droneWarning) return;
    if (!text) {
      droneWarning.style.display = "none";
      droneWarning.textContent = "";
      return;
    }
    droneWarning.textContent = "\u26A0\uFE0F " + translateErrorText(text);
    droneWarning.style.borderColor = "var(--accent-orange)";
    droneWarning.style.color = "var(--accent-orange)";
    droneWarning.style.background = "rgba(255,160,0,0.15)";
    droneWarning.style.display = "";
  }
  function renderDroneWarning(cfg) {
    const parts = [];
    if (cfg && cfg.paused) parts.push("Auto drone paused. Re-enable Auto expedition to resume.");
    if (_localWarning) parts.push(_localWarning);
    setDroneWarningText(parts.join(" "));
  }
  function updateDroneWarning(cfg, localWarning) {
    _droneSettings = normalizeDroneSettings(cfg);
    if (localWarning !== void 0) _localWarning = localWarning || "";
    renderDroneWarning(_droneSettings);
  }
  function applySettingsToUi(raw) {
    _droneSettings = normalizeDroneSettings(raw);
    if (autoDroneToggle) autoDroneToggle.checked = _droneSettings.enabled;
    if (autoDroneRepairToggle) autoDroneRepairToggle.checked = _droneSettings.repairEnabled;
    renderDroneWarning(_droneSettings);
  }
  function renderDrone() {
    if (!personalDroneContainer) return;
    if (!_droneData || !_droneData.drone) {
      personalDroneContainer.replaceChildren(_noData(t("No drone data yet. Click \u{1F504} to refresh.", "\u6682\u65E0\u65E0\u4EBA\u673A\u6570\u636E\uFF0C\u70B9\u51FB \u{1F504} \u5237\u65B0\u3002")));
      return;
    }
    const drone = _droneData.drone;
    const battery = _droneData.battery || {};
    const durPct = drone.maxDurability ? Math.max(0, Math.min(100, Math.round(drone.durability / drone.maxDurability * 100))) : 0;
    const battPct = battery.max ? Math.max(0, Math.min(100, Math.round(battery.current / battery.max * 100))) : 0;
    const durColor = durPct > 60 ? "var(--accent-green)" : durPct > 30 ? "var(--accent-orange)" : "var(--accent-red,#ff4444)";
    const battColor = battPct > 40 ? "var(--accent-green)" : battPct > 15 ? "var(--accent-orange)" : "var(--accent-red,#ff4444)";
    let statusText = t("Idle", "\u7A7A\u95F2"), statusColor = "var(--accent-green)";
    if (drone.isDestroyed) {
      statusText = t("DESTROYED", "\u5DF2\u6467\u6BC1");
      statusColor = "var(--accent-red,#ff4444)";
    } else if (drone.isRepairing) {
      statusText = t("Repairing\u2026", "\u7EF4\u4FEE\u4E2D\u2026");
      statusColor = "var(--accent-orange)";
    } else if (_droneData.activeMissionId) {
      statusText = t("On mission", "\u6267\u884C\u4EFB\u52A1\u4E2D");
      statusColor = "var(--accent-blue)";
    }
    const card = _h("div", { className: "expedition-card" });
    const bar = (label, pct, color, right) => _h(
      "div",
      { style: "display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text-muted);margin-top:4px;" },
      _h("span", { style: "width:52px;" }, label),
      _h(
        "div",
        { style: "flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;" },
        _h("div", { style: `height:100%;width:${pct}%;background:${color};border-radius:4px;` })
      ),
      _h("span", { style: "width:52px;text-align:right;" }, right)
    );
    card.appendChild(_h(
      "div",
      { className: "exp-header" },
      _h("span", { className: "exp-title" }, `\u{1F6E9}\uFE0F ${drone.name || "Drone"}`),
      _h("span", { className: "exp-status", style: `color:${statusColor};` }, statusText)
    ));
    const body = _h("div", { style: "padding:4px 0;" });
    body.appendChild(bar(t("Durability", "\u8010\u4E45"), durPct, durColor, `${drone.durability}/${drone.maxDurability}`));
    body.appendChild(bar(t("Battery", "\u7535\u91CF"), battPct, battColor, `${battPct}%`));
    if (drone.isRepairing && drone.repairSecondsRemaining != null) {
      body.appendChild(_h("div", { className: "detail-row" }, _h("span", { className: "label" }, t("Repair:", "\u7EF4\u4FEE\uFF1A")), ` ${Math.ceil(drone.repairSecondsRemaining / 60)}${t("m remaining", " \u5206\u949F\u540E\u5B8C\u6210")}`));
    }
    if (typeof battery.restoreSeconds === "number" && battery.restoreSeconds > 0 && battery.current < battery.max) {
      body.appendChild(_h("div", { className: "detail-row" }, _h("span", { className: "label" }, t("Full in:", "\u5145\u6EE1\u8FD8\u9700\uFF1A")), ` ${Math.floor(battery.restoreSeconds / 3600)}h ${Math.floor(battery.restoreSeconds % 3600 / 60)}m`));
    }
    card.appendChild(body);
    personalDroneContainer.replaceChildren(card);
  }
  function renderDroneActive() {
    if (!droneActiveContainer) return;
    const mission = _droneMissionData;
    const isRunning = mission && _droneData && _droneData.activeMissionId && mission.status === "RUNNING";
    if (!isRunning) {
      droneActiveContainer.replaceChildren(_noData(t("No active drone mission.", "\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u65E0\u4EBA\u673A\u4EFB\u52A1\u3002")));
      return;
    }
    const loc = mission.location && mission.location.name || "";
    const mis = mission.mission && mission.mission.name || "";
    if (mission.endTime) state.expeditionEndTimes[mission.id] = mission.endTime;
    const timerSpan = _h("span", { className: "exp-timer", dataset: { expId: mission.id } }, mission.endTime ? formatTimeRemaining(mission.endTime) : "--");
    const pinBtn = _h("button", { className: "refresh-btn-small pin-btn pin-exp-btn", dataset: { expId: mission.id }, title: t("Pin Expedition Timer", "\u56FA\u5B9A\u8FDC\u5F81\u8BA1\u65F6\u5668") }, "\u{1F4CC}");
    const card = _h(
      "div",
      { className: "expedition-card" },
      _h(
        "div",
        { className: "exp-header" },
        _h("span", { className: "exp-title" }, `\u{1F4CD} ${loc} \u2014 ${mis}`),
        _h("span", { className: "exp-status running" }, mission.status || "RUNNING")
      ),
      _h("div", { className: "detail-row" }, _h("span", { className: "label" }, t("Risk:", "\u98CE\u9669\uFF1A")), ` ${mission.finalRisk ?? "--"}`),
      _h("div", { className: "detail-row" }, _h("span", { className: "label" }, t("Battery Cost:", "\u7535\u91CF\u6D88\u8017\uFF1A")), ` ${mission.batteryCost ?? "--"}`),
      mission.endTime ? _h(
        "div",
        { className: "exp-timer-row" },
        _h("span", { style: "font-size:11px;color:var(--accent-orange);" }, "\u23F3 ", timerSpan),
        pinBtn
      ) : null
    );
    droneActiveContainer.replaceChildren(card);
    card.querySelectorAll(".pin-exp-btn").forEach((btn) => {
      const expId = btn.dataset.expId;
      btn.classList.toggle("pinned", !!state.pinnedTimers["exp_" + expId]);
      btn.addEventListener("click", async () => {
        const key = "exp_" + expId;
        state.pinnedTimers[key] = !state.pinnedTimers[key];
        btn.classList.toggle("pinned", !!state.pinnedTimers[key]);
        await savePinnedState();
        renderPinnedTimers();
      });
    });
  }
  function renderDroneArchived(data) {
    if (!droneArchivedContainer) return;
    let items = data;
    if (data && !Array.isArray(data) && data.items) items = data.items;
    if (!items || !Array.isArray(items) || items.length === 0) {
      droneArchivedContainer.replaceChildren(_noData(t("No archived drone missions found.", "\u6CA1\u6709\u5DF2\u5F52\u6863\u7684\u65E0\u4EBA\u673A\u4EFB\u52A1\u3002")));
      return;
    }
    const locale = getUiLang() === "zh" ? "zh-CN" : void 0;
    const frag = document.createDocumentFragment();
    for (const m of items) {
      const outcome = (m.outcome || m.status || "ARCHIVED").toUpperCase();
      let cls = "outcome-full";
      if (outcome.includes("SEVERELY") || outcome.includes("DESTROYED")) cls = "outcome-death";
      else if (outcome.includes("DAMAGED")) cls = "outcome-partial";
      else if (outcome.includes("PARTIAL")) cls = "outcome-partial";
      else if (outcome.includes("FAIL")) cls = "outcome-fail";
      const loc = m.location && m.location.name || "";
      const mis = m.mission && m.mission.name || "";
      const infoParts = [`\u{1F4CD} ${loc || "--"}`];
      if (m.finalRisk !== void 0) infoParts.push(`\u26A0\uFE0F ${t("Risk:", "\u98CE\u9669\uFF1A")} ${m.finalRisk}`);
      if (m.damageDealt !== void 0) infoParts.push(`\u{1F4A5} ${t("Damage:", "\u635F\u4F24\uFF1A")} ${m.damageDealt}`);
      const card = _h(
        "div",
        { className: "archived-exp-card" },
        _h(
          "div",
          { className: "archived-exp-header" },
          _h("span", { className: "archived-exp-merc" }, `\u{1F6E9}\uFE0F ${mis || "?"}`),
          _h("span", { className: `outcome-tag ${cls}` }, translateStatus(outcome))
        ),
        _h("div", { className: "archived-exp-info" }, infoParts.join(" \xB7 "))
      );
      const lootItems = Array.isArray(m.loot) ? m.loot : [];
      if (lootItems.length > 0) {
        const uid = "drone_archived_" + m.id;
        const lootHeader = _h(
          "div",
          { className: "expandable-header", dataset: { expand: uid } },
          _h("span", { className: "expand-arrow" }, "\u25B6"),
          _h("span", { className: "expand-label" }, `\u{1F4E6} ${t(`Loot (${lootItems.length} items)`, `\u6218\u5229\u54C1\uFF08${lootItems.length} \u4EF6\uFF09`)}`)
        );
        const lootBody = _h("div", { className: "expandable-body", id: uid });
        for (const li of lootItems) {
          const det = li && typeof li === "object" && li.item ? li.item : li && typeof li === "object" ? li : { name: String(li) };
          const imgSrc = det.imageUrl || det.image || "";
          const row = _h("div", { style: "font-size:10px;margin:2px 0;" });
          if (imgSrc) {
            row.appendChild(_h("img", {
              src: imgSrc,
              style: "width:24px;height:24px;border-radius:4px;vertical-align:middle;margin-right:4px;"
            }));
          }
          row.appendChild(document.createTextNode(det.name || det.id || "?"));
          if (det.tier) {
            row.appendChild(_h("span", { className: "tier-tag tier-tag-" + String(det.tier).toLowerCase() }, det.tier));
          }
          if (det.isCollected) {
            row.appendChild(_h("span", { style: "color:var(--accent-green);font-size:9px;" }, ` \u2713 ${t("Collected", "\u5DF2\u6536\u96C6")}`));
          } else if (det.isDeleted) {
            row.appendChild(_h("span", { style: "color:var(--accent-red);font-size:9px;" }, ` \u2717 ${t("Deleted", "\u5DF2\u5220\u9664")}`));
          }
          lootBody.appendChild(row);
        }
        card.appendChild(_h("div", { className: "container-items" }, lootHeader, lootBody));
      }
      const completedTs = m.completedAt || m.endTime || m.startTime;
      if (completedTs) {
        card.appendChild(_h(
          "span",
          { style: "font-size:9px;color:var(--text-dim);display:flex;flex-direction:row-reverse;" },
          `\u{1F550} ${t("Completed", "\u5B8C\u6210\u4E8E")} ${new Date(completedTs).toLocaleString(locale)}`
        ));
      }
      frag.appendChild(card);
    }
    droneArchivedContainer.replaceChildren(frag);
    droneArchivedContainer.querySelectorAll(".expandable-header").forEach((hdr) => {
      hdr.addEventListener("click", () => {
        hdr.classList.toggle("open");
        const targetId = hdr.getAttribute("data-expand");
        const body = document.getElementById(targetId);
        if (body) body.classList.toggle("openExtended");
      });
    });
  }
  async function loadDrone() {
    const { droneData, droneMissionData } = await Cor3CenterStore.get(["droneData", "droneMissionData"]);
    _droneData = droneData || null;
    _droneMissionData = droneMissionData || null;
    renderDrone();
    renderDroneActive();
    if (personalDroneLastUpdated2) showLastUpdated(personalDroneLastUpdated2, "droneDataUpdatedAt");
    if (droneActiveLastUpdated) showLastUpdated(droneActiveLastUpdated, "droneMissionUpdatedAt");
  }
  async function requestDrone() {
    if (personalDroneContainer) personalDroneContainer.replaceChildren(_noData(t("Requesting drone data...", "\u6B63\u5728\u8BF7\u6C42\u65E0\u4EBA\u673A\u6570\u636E...")));
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestDroneOptions" });
    } catch (e) {
    }
    await waitForStorageKey("droneData", 8e3);
    await loadDrone();
  }
  async function loadDroneArchived() {
    const { droneArchivedData } = await Cor3CenterStore.get("droneArchivedData");
    renderDroneArchived(droneArchivedData || null);
    if (droneArchivedLastUpdated) showLastUpdated(droneArchivedLastUpdated, "droneArchivedUpdatedAt");
  }
  async function requestDroneArchived() {
    if (droneArchivedContainer) droneArchivedContainer.replaceChildren(_noData(t("Loading archived drone missions...", "\u6B63\u5728\u52A0\u8F7D\u5DF2\u5F52\u6863\u7684\u65E0\u4EBA\u673A\u4EFB\u52A1\u3002")));
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestDroneArchived", cursor: null, limit: 20 });
    } catch (e) {
    }
    await waitForStorageKey("droneArchivedData", 8e3);
    await loadDroneArchived();
    _droneArchivedLoaded = true;
  }
  if (refreshDroneBtn) refreshDroneBtn.addEventListener("click", () => requestDrone());
  if (refreshDroneActiveBtn) refreshDroneActiveBtn.addEventListener("click", async () => {
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestDroneOptions" });
    } catch (e) {
    }
    setTimeout(() => loadDrone(), 2e3);
  });
  if (refreshDroneArchivedBtn) refreshDroneArchivedBtn.addEventListener("click", () => requestDroneArchived());
  if (droneExpActiveToggle && droneExpActiveBody) {
    droneExpActiveToggle.addEventListener("click", () => {
      droneExpActiveToggle.classList.toggle("open");
      droneExpActiveBody.classList.toggle("open");
    });
  }
  if (droneArchivedToggle && droneArchivedSectionBody) {
    droneArchivedToggle.addEventListener("click", () => {
      droneArchivedToggle.classList.toggle("open");
      droneArchivedSectionBody.classList.toggle("open");
      if (droneArchivedSectionBody.classList.contains("open") && !_droneArchivedLoaded) requestDroneArchived();
    });
  }
  [autoDroneToggle, autoDroneRepairToggle].filter(Boolean).forEach((el) => {
    el.addEventListener("change", () => {
      if (el === autoDroneToggle) {
        const enabled = autoDroneToggle.checked;
        Cor3CenterStore.get("autoDrone", (data) => {
          const existing = data.autoDrone || {};
          Cor3CenterStore.set({
            autoDrone: Object.assign({}, existing, droneSettingsToStorage(), { paused: false })
          });
        });
        _localWarning = "";
        Cor3CenterStore.remove("droneWarning");
        updateDroneWarning({ enabled, paused: false, repairEnabled: autoDroneRepairToggle ? autoDroneRepairToggle.checked : false });
        if (enabled) requestDrone();
      } else {
        saveDroneSettings();
      }
    });
  });
  Cor3CenterStore.get("autoDrone", (data) => {
    const cfg = data.autoDrone || {};
    applySettingsToUi(cfg);
    Cor3CenterStore.get("droneWarning", (local) => {
      _localWarning = local.droneWarning || "";
      renderDroneWarning(_droneSettings);
    });
  });
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.droneData || changes.droneMissionData) loadDrone();
    if (changes.droneArchivedData) loadDroneArchived();
    if (changes.droneWarning) {
      _localWarning = changes.droneWarning.newValue || "";
      renderDroneWarning(_droneSettings);
    }
  });
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.autoDrone && changes.autoDrone.newValue) {
      applySettingsToUi(changes.autoDrone.newValue);
    }
  });
  onLangChange(() => {
    observeCenterRead(loadDrone());
    observeCenterRead(loadDroneArchived());
  });
  observeCenterRead(loadDrone());
  observeCenterRead(loadDroneArchived());

  // src/shared/server-constants.js
  var HOME_SERVER_ID = "019c0a5b-eeeb-7d3e-b9c9-fd5c2ba7d399";
  var MARKET_IDS = {
    home: "019d3ea4-85bd-7389-904d-8f7c85841134",
    dark: "019d3ea4-85bd-7389-904d-908ba9194aa0",
    soyuz: "019da731-2db5-7d76-9447-1ea3b9b78001",
    usol: "019e4065-6ae8-760d-8724-58ab4f2cf7d7"
  };
  var MARKET_SERVER_IDS = {
    dark: "019d29c5-4b37-79bf-b23e-304d8ea03c15",
    soyuz: "019da6f1-16f7-75a6-b6d3-0b1d5f92a108",
    usol: "019e4052-c317-7388-9d71-883ffb1560cd"
  };
  var MARKET_SELL_ORDER = [
    { name: "USOL", id: MARKET_IDS.usol, serverId: MARKET_SERVER_IDS.usol },
    { name: "SOYUZ", id: MARKET_IDS.soyuz, serverId: MARKET_SERVER_IDS.soyuz },
    { name: "D4RK", id: MARKET_IDS.dark, serverId: MARKET_SERVER_IDS.dark },
    { name: "HOME", id: MARKET_IDS.home, serverId: null }
  ];
  var MARKET_RESET_DURATIONS_MS = {
    home: 6 * 60 * 60 * 1e3,
    dark: 12 * 60 * 60 * 1e3,
    soyuz: 10 * 60 * 60 * 1e3,
    usol: 8 * 60 * 60 * 1e3
  };

  // src/shared/server-map.js
  function ServerMap() {
    this._servers = {};
    this._adjacency = {};
    this._homeId = null;
    this._ready = false;
    this._pathCache = {};
    this._serverPriority = null;
  }
  ServerMap.prototype.update = function(mapData) {
    if (!mapData || !mapData.servers || !mapData.connections) return;
    this._servers = {};
    this._adjacency = {};
    this._pathCache = {};
    this._serverPriority = null;
    this._homeId = null;
    var servers = Array.isArray(mapData.servers) ? mapData.servers : [];
    var connections = Array.isArray(mapData.connections) ? mapData.connections : [];
    for (var i = 0; i < servers.length; i++) {
      var s = servers[i];
      this._servers[s.id] = {
        id: s.id,
        name: s.serverName,
        ip: s.serverIp,
        typeName: s.serverTypeName || null,
        cluster: s.serverCluster || null,
        faction: s.faction || null,
        defenceRate: s.serverDefenceRate || 0,
        isInMaintenance: !!s.isInMaintenance,
        maintenanceEndsAt: s.maintenanceEndsAt || null,
        timeUntilMaintenance: s.timeUntilMaintenance || null,
        isDiscovered: s.isDiscovered !== false,
        isAccessible: !!s.isAccessible,
        isReachable: !!s.isReachable,
        accessType: s.accessType || "none",
        hasAdminAccess: !!s.hasAdminAccess,
        isEndpoint: !!s.isEndpoint,
        canSetEndpoint: s.canSetEndpoint !== false,
        marketId: s.marketId || null,
        transitType: s.transitType || null
      };
      this._adjacency[s.id] = [];
      if (s.serverTypeName === "Home" || s.serverName === "Home Server" || s.id === HOME_SERVER_ID) {
        this._homeId = s.id;
      }
    }
    for (var j = 0; j < connections.length; j++) {
      var c = connections[j];
      if (this._adjacency[c.serverA] && this._adjacency[c.serverB]) {
        this._adjacency[c.serverA].push({ targetId: c.serverB, connectionId: c.id, isHidden: !!c.isHidden });
        this._adjacency[c.serverB].push({ targetId: c.serverA, connectionId: c.id, isHidden: !!c.isHidden });
      }
    }
    this._ready = true;
  };
  ServerMap.prototype.isReady = function() {
    return this._ready;
  };
  ServerMap.prototype.getServer = function(serverId) {
    return this._servers[serverId] || null;
  };
  ServerMap.prototype.getServerByName = function(name) {
    for (var id in this._servers) {
      if (this._servers[id].name === name) return this._servers[id];
    }
    return null;
  };
  ServerMap.prototype.getServerIdByName = function(name) {
    var s = this.getServerByName(name);
    return s ? s.id : null;
  };
  ServerMap.prototype.getAllServers = function() {
    return this._servers;
  };
  ServerMap.prototype.getHomeId = function() {
    return this._homeId;
  };
  ServerMap.prototype.findAllPaths = function(targetId, opts) {
    if (!this._ready || !this._homeId) return [];
    if (targetId === this._homeId) return [[]];
    var skipMaintenance = !opts || opts.skipMaintenance !== false;
    var maintFp = skipMaintenance ? this.getMaintenanceFingerprint() : "";
    var cacheKey = targetId + "|" + (skipMaintenance ? "sm:" + maintFp : "all");
    if (this._pathCache[cacheKey]) return this._pathCache[cacheKey];
    var allPaths = [];
    var visited = {};
    var self = this;
    function dfs(currentId, path) {
      if (currentId === targetId) {
        allPaths.push(path.slice());
        return;
      }
      var neighbors = self._adjacency[currentId];
      if (!neighbors) return;
      for (var i = 0; i < neighbors.length; i++) {
        var nb = neighbors[i];
        if (!visited[nb.targetId]) {
          if (skipMaintenance && nb.targetId !== targetId) {
            var srv = self._servers[nb.targetId];
            if (srv && srv.isInMaintenance) {
              var remaining = srv.maintenanceEndsAt ? new Date(srv.maintenanceEndsAt).getTime() - Date.now() : 0;
              if (remaining > 0) continue;
            }
          }
          visited[nb.targetId] = true;
          path.push({ id: nb.targetId, name: (self._servers[nb.targetId] || {}).name || nb.targetId, isHidden: nb.isHidden });
          dfs(nb.targetId, path);
          path.pop();
          visited[nb.targetId] = false;
        }
      }
    }
    visited[this._homeId] = true;
    dfs(this._homeId, []);
    allPaths.sort(function(a, b) {
      return a.length - b.length;
    });
    this._pathCache[cacheKey] = allPaths;
    return allPaths;
  };
  ServerMap.prototype.getShortestPath = function(targetId) {
    var paths = this.findAllPaths(targetId);
    return paths.length > 0 ? paths[0] : null;
  };
  ServerMap.prototype.getShortestPathByName = function(serverName) {
    var id = this.getServerIdByName(serverName);
    if (!id) return null;
    return this.getShortestPath(id);
  };
  ServerMap.prototype.findAllPathsByName = function(serverName) {
    var id = this.getServerIdByName(serverName);
    if (!id) return [];
    return this.findAllPaths(id);
  };
  ServerMap.prototype.checkPathMaintenance = function(targetServerNameOrId) {
    if (!this._ready) return { blocked: false };
    var targetId = this._servers[targetServerNameOrId] ? targetServerNameOrId : this.getServerIdByName(targetServerNameOrId);
    if (!targetId) return { blocked: false };
    var reachablePaths = this.findAllPaths(targetId);
    if (reachablePaths.length > 0) return { blocked: false, usedPath: reachablePaths[0] };
    var allPaths = this.findAllPaths(targetId, { skipMaintenance: false });
    if (allPaths.length === 0) return { blocked: true, blockerName: "no-path", endsAt: null, remainingMs: 0 };
    var firstBlocker = null;
    var firstPath = allPaths[0];
    for (var bi = 0; bi < firstPath.length; bi++) {
      var bsrv = this._servers[firstPath[bi].id];
      if (bsrv && bsrv.isInMaintenance) {
        var bRemaining = bsrv.maintenanceEndsAt ? new Date(bsrv.maintenanceEndsAt).getTime() - Date.now() : 0;
        if (bRemaining > 0) {
          firstBlocker = { blocked: true, blockerName: bsrv.name, endsAt: bsrv.maintenanceEndsAt, remainingMs: bRemaining };
          break;
        }
      }
    }
    return firstBlocker || { blocked: true, blockerName: "unknown", endsAt: null, remainingMs: 0 };
  };
  ServerMap.prototype.findBestReachablePath = function(targetServerNameOrId) {
    if (!this._ready) return null;
    var targetId = this._servers[targetServerNameOrId] ? targetServerNameOrId : this.getServerIdByName(targetServerNameOrId);
    if (!targetId) return null;
    var allPaths = this.findAllPaths(targetId);
    return allPaths.length > 0 ? allPaths[0] : null;
  };
  ServerMap.prototype.getMaintenanceFingerprint = function() {
    var parts = [];
    for (var id in this._servers) {
      var s = this._servers[id];
      if (s.isInMaintenance) {
        parts.push(id + ":M:" + (s.maintenanceEndsAt || ""));
      } else if (s.timeUntilMaintenance) {
        parts.push(id + ":U:" + s.timeUntilMaintenance);
      }
    }
    parts.sort();
    return parts.join("|");
  };
  ServerMap.prototype.getServerPriority = function() {
    if (this._serverPriority) return this._serverPriority;
    if (!this._ready || !this._homeId) return [];
    var result = [];
    for (var id in this._servers) {
      if (id === this._homeId) continue;
      var s = this._servers[id];
      var path = this.getShortestPath(id);
      if (path) {
        result.push({ id, name: s.name, pathLength: path.length });
      }
    }
    result.sort(function(a, b) {
      return b.pathLength - a.pathLength;
    });
    this._serverPriority = result.map(function(r) {
      return r.name;
    });
    return this._serverPriority;
  };
  ServerMap.prototype.getServerPriorityIndex = function(serverName) {
    if (!serverName || serverName === "None") return -1;
    var priority = this.getServerPriority();
    var idx = priority.indexOf(serverName);
    return idx >= 0 ? idx : priority.length;
  };
  ServerMap.prototype.getMaintenanceInfo = function() {
    var info = {};
    for (var id in this._servers) {
      var s = this._servers[id];
      info[id] = {
        serverName: s.name,
        isInMaintenance: s.isInMaintenance,
        maintenanceEndsAt: s.maintenanceEndsAt,
        timeUntilMaintenance: s.timeUntilMaintenance
      };
    }
    return info;
  };
  ServerMap.prototype.getServerTypeMap = function() {
    var map = {};
    for (var id in this._servers) {
      var s = this._servers[id];
      map[id] = {
        serverName: s.name,
        serverTypeName: s.typeName,
        serverDefenceRate: s.defenceRate
      };
    }
    return map;
  };
  ServerMap.prototype.toJSON = function() {
    return {
      servers: this._servers,
      adjacency: this._adjacency,
      homeId: this._homeId,
      ready: this._ready
    };
  };
  ServerMap.prototype.fromJSON = function(json) {
    if (!json) return;
    this._servers = json.servers || {};
    this._adjacency = json.adjacency || {};
    this._homeId = json.homeId || null;
    this._ready = !!json.ready;
    this._pathCache = {};
    this._serverPriority = null;
  };
  ServerMap.prototype.getPathForServer = function(serverName) {
    if (this._ready) {
      var id = this.getServerIdByName(serverName);
      if (id) {
        var path = this.getShortestPath(id);
        if (path) return path;
      }
    }
    return FALLBACK_PATH_MAP[serverName] || null;
  };
  ServerMap.prototype.getServerNameById = function(serverId) {
    if (this._ready) {
      var s = this._servers[serverId];
      if (s) return s.name;
    }
    for (var name in FALLBACK_PATH_MAP) {
      var path = FALLBACK_PATH_MAP[name];
      for (var i = 0; i < path.length; i++) {
        if (path[i].id === serverId) return path[i].name;
      }
    }
    return null;
  };
  ServerMap.prototype.getPathForServerId = function(serverId) {
    if (this._ready) {
      var path = this.getShortestPath(serverId);
      if (path) return path;
    }
    for (var name in FALLBACK_PATH_MAP) {
      var path = FALLBACK_PATH_MAP[name];
      if (path.length > 0 && path[path.length - 1].id === serverId) {
        return path;
      }
    }
    return null;
  };
  ServerMap.prototype.getServerIdByNameOrFallback = function(serverName) {
    if (this._ready) {
      var id = this.getServerIdByName(serverName);
      if (id) return id;
    }
    var fb = FALLBACK_PATH_MAP[serverName];
    if (fb && fb.length > 0) return fb[fb.length - 1].id;
    return null;
  };
  ServerMap.prototype.getAllServerIds = function() {
    if (this._ready) {
      var result = {};
      for (var id in this._servers) {
        result[id] = this._servers[id].name;
      }
      return result;
    }
    var result = {};
    for (var name in FALLBACK_PATH_MAP) {
      var path = FALLBACK_PATH_MAP[name];
      var last = path[path.length - 1];
      result[last.id] = name;
    }
    return result;
  };
  ServerMap.prototype.getPathLength = function(serverId) {
    if (this._ready) {
      var path = this.getShortestPath(serverId);
      if (path) return path.length;
    }
    for (var name in FALLBACK_PATH_MAP) {
      var p = FALLBACK_PATH_MAP[name];
      var last = p[p.length - 1];
      if (last.id === serverId) return p.length;
    }
    return 0;
  };
  var FALLBACK_PATH_MAP = {
    "RM7-E1L3": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" }
    ],
    "RM7-E1L5": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" }
    ],
    "RM7-E1L2CT": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1L2CT", id: "019d53aa-5101-7f08-b3dd-378b0ddcf7d0" }
    ],
    "RM7-E1SCP": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" }
    ],
    "RM7-S4L4": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L4", id: "019d1b0a-13a9-77dd-b41f-3ffb5f671742" }
    ],
    "D4RK RM7CE": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" }
    ],
    "D4RK RM7MI": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" },
      { name: "D4RK RM7MI", id: "019d29c5-4b37-79bf-b23e-304d8ea03c15" }
    ],
    "D4RK 2IV2": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" },
      { name: "D4RK 2IV2", id: "019d29c5-4b37-7de9-b46c-022179bcb5eb" }
    ],
    "RM7-N2ECP": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" }
    ],
    "RM7-N2L2": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" }
    ],
    "RM7-N2L3": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" }
    ],
    "RM7-W3NCP": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" },
      { name: "RM7-W3NCP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a106" }
    ],
    "RM7-N1L1": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" },
      { name: "RM7-W3NCP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a106" },
      { name: "RM7-N1L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a104" }
    ],
    "RM7-S4L2": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" }
    ],
    "RM7-S4L3": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" },
      { name: "RM7-S4L3", id: "019e4052-c316-73aa-81f6-3dcef4d6873e" }
    ],
    "RM7-S4L1": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L4", id: "019d1b0a-13a9-77dd-b41f-3ffb5f671742" },
      { name: "RM7-S4L1", id: "019e4052-c315-71df-80da-4e334b96c9e6" }
    ],
    "RM7-S4WCP": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" },
      { name: "RM7-S4WCP", id: "019e4052-c316-73aa-81f6-448645a38c9e" }
    ],
    "D4RK RM7EG": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" },
      { name: "D4RK RM7MI", id: "019d29c5-4b37-79bf-b23e-304d8ea03c15" },
      { name: "D4RK RM7EG", id: "019e4052-c316-73aa-81f6-483e50247e61" }
    ],
    "B43271N": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1L2CT", id: "019d53aa-5101-7f08-b3dd-378b0ddcf7d0" },
      { name: "B43271N", id: "019e4052-c316-73aa-81f6-567c9a8f5738" }
    ],
    "B43272N": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1L2CT", id: "019d53aa-5101-7f08-b3dd-378b0ddcf7d0" },
      { name: "B43271N", id: "019e4052-c316-73aa-81f6-567c9a8f5738" },
      { name: "B43272N", id: "019e4052-c316-73aa-81f6-5aa82fc72bdd" }
    ],
    "B43274N": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "D4RK RM7CE", id: "019d29c5-4b37-7436-aef9-89af09560af3" },
      { name: "D4RK RM7MI", id: "019d29c5-4b37-79bf-b23e-304d8ea03c15" },
      { name: "D4RK RM7EG", id: "019e4052-c316-73aa-81f6-483e50247e61" },
      { name: "B43274N", id: "019e4052-c316-73aa-81f6-60ec61b61f0a" }
    ],
    "URM7-S5L2": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" },
      { name: "RM7-S4L3", id: "019e4052-c316-73aa-81f6-3dcef4d6873e" },
      { name: "URM7-S5L2", id: "019e4052-c317-7388-9d71-85b98a02d5fb" }
    ],
    "URM7-M": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L2", id: "019e4052-c316-73aa-81f6-38c323c58eb2" },
      { name: "RM7-S4L3", id: "019e4052-c316-73aa-81f6-3dcef4d6873e" },
      { name: "URM7-S5L2", id: "019e4052-c317-7388-9d71-85b98a02d5fb" },
      { name: "URM7-M", id: "019e4052-c317-7388-9d71-883ffb1560cd" }
    ],
    "URM7-H": [
      { name: "RM7-E1L5", id: "019d1b0a-13a9-77dd-b41f-374ee144bd07" },
      { name: "RM7-E1SCP", id: "019d1b0a-13a9-77dd-b41f-3a21d490cb2d" },
      { name: "RM7-S4L4", id: "019d1b0a-13a9-77dd-b41f-3ffb5f671742" },
      { name: "RM7-S4L1", id: "019e4052-c315-71df-80da-4e334b96c9e6" },
      { name: "URM7-H", id: "019e4052-c317-7388-9d71-8fed6faaaf99" }
    ],
    "SRM7-M": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" },
      { name: "RM7-W3NCP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a106" },
      { name: "RM7-N1L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a104" },
      { name: "RM7-N3L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a107" },
      { name: "SRM7-M", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a108" }
    ],
    "SRM7-N3L2": [
      { name: "RM7-E1L3", id: "019d1b0a-13a9-77dd-b41f-33f06f2df284" },
      { name: "RM7-N2ECP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a105" },
      { name: "RM7-N2L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a101" },
      { name: "RM7-N2L3", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a102" },
      { name: "RM7-W3NCP", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a106" },
      { name: "RM7-N1L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a104" },
      { name: "RM7-N3L1", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a107" },
      { name: "SRM7-M", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a108" },
      { name: "SRM7-N3L2", id: "019da6f1-16f7-75a6-b6d3-0b1d5f92a109" }
    ]
  };
  function findMaintenanceBlocker(serverMaintenanceMap, marketKey) {
    var pathKey = marketKey === "dark" ? "D4RK RM7MI" : marketKey === "soyuz" ? "SRM7-M" : marketKey === "usol" ? "URM7-M" : null;
    if (!pathKey || !serverMaintenanceMap) return null;
    var path = FALLBACK_PATH_MAP[pathKey];
    if (!path) return null;
    var now = Date.now();
    for (var i = 0; i < path.length; i++) {
      var info = serverMaintenanceMap[path[i].id];
      if (info && info.isInMaintenance && info.maintenanceEndsAt) {
        var remaining = new Date(info.maintenanceEndsAt).getTime() - now;
        if (remaining > 0) {
          return { blockerName: info.serverName || path[i].name, maintenanceEndsAt: info.maintenanceEndsAt };
        }
      }
    }
    return null;
  }

  // src/popup/markets.js
  var marketContainer = document.getElementById("marketContainer");
  var darkMarketContainer = document.getElementById("darkMarketContainer");
  var soyuzMarketContainer = document.getElementById("soyuzMarketContainer");
  var usolMarketContainer = document.getElementById("usolMarketContainer");
  var refreshMarketBtn = document.getElementById("refreshMarketBtn");
  var refreshDarkMarketBtn = document.getElementById("refreshDarkMarketBtn");
  var refreshSoyuzMarketBtn = document.getElementById("refreshSoyuzMarketBtn");
  var refreshUsolMarketBtn = document.getElementById("refreshUsolMarketBtn");
  var coreMarketLabel = document.getElementById("coreMarketLabel");
  var darkMarketLabel = document.getElementById("darkMarketLabel");
  var soyuzMarketLabel = document.getElementById("soyuzMarketLabel");
  var usolMarketLabel = document.getElementById("usolMarketLabel");
  function updateMarketLabel(labelEl, wsName, placeholder, icon) {
    const img = labelEl.querySelector("img.faction-icon");
    const text = wsName || placeholder;
    if (img) {
      labelEl.childNodes.forEach((n) => {
        if (n.nodeType === 3) n.remove();
      });
      labelEl.appendChild(document.createTextNode(" " + text));
    } else {
      if (icon == "\u262D") {
        labelEl.replaceChildren(_h("span", { style: "color:#c33b3b;margin-left:3px;margin-right:1px" }, "\u262D"), " " + text);
      } else if (icon == "\u262E") {
        labelEl.replaceChildren(_h("span", { style: "color:#2592A7;margin-right:1px" }, "\u262E"), " " + text);
      } else {
        labelEl.textContent = `${icon} ${text}`;
      }
    }
  }
  function showMarketInfoPopup(lot) {
    const popup = document.getElementById("marketInfoPopup");
    const overlay = document.getElementById("marketInfoOverlay");
    if (!popup || !overlay) return;
    const det = lot.details || {};
    const isAccess = (lot.category || "").toUpperCase() === "ACCESS";
    const INFO_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color:currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 17V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="8" r="0.75" fill="currentColor"/></svg>';
    let itemName;
    if (isAccess) {
      itemName = (det.serverName || "") + " " + (det.accessType || "") + " access";
    } else {
      itemName = det.name || "Unknown";
    }
    let h = '<div class="info-title">' + INFO_SVG + " " + itemName.toUpperCase() + "</div>";
    h += '<div class="info-desc">';
    const matchedSbstr = itemName ? Object.keys(zoomList).find((substring) => itemName.includes(substring)) : "";
    let zoomMarketImg = "";
    if (matchedSbstr) {
      zoomMarketImg = `style="transform:scale(${zoomList[matchedSbstr]});object-fit:contain;"`;
    }
    if (det.image) h += `<div style="overflow:clip;"><img ${zoomMarketImg} src="${det.image}" alt=""></div>`;
    h += "<span>" + (det.description || "No description available.") + "</span>";
    h += "</div>";
    h += '<div class="info-specs">';
    h += '<div class="info-spec-item"><div class="info-spec-label">Price</div><div class="info-spec-val">' + (lot.price ? lot.price.toLocaleString() : "--") + "</div></div>";
    if (lot.priceModifier) h += '<div class="info-spec-item"><div class="info-spec-label">Price Modifier</div><div class="info-spec-val">' + (lot.priceModifier > 0 ? "+" : "") + lot.priceModifier + "</div></div>";
    if (isAccess) {
      if (lot.accessLevel) h += '<div class="info-spec-item"><div class="info-spec-label">Access Level</div><div class="info-spec-val">' + lot.accessLevel + "</div></div>";
      if (det.durationHours !== void 0) h += '<div class="info-spec-item"><div class="info-spec-label">Duration</div><div class="info-spec-val">' + det.durationHours + "h</div></div>";
      if (det.accessType) h += '<div class="info-spec-item"><div class="info-spec-label">Access Type</div><div class="info-spec-val">' + det.accessType + "</div></div>";
      if (det.serverName) h += '<div class="info-spec-item"><div class="info-spec-label">Server</div><div class="info-spec-val">' + det.serverName + "</div></div>";
      h += '<div class="info-spec-item"><div class="info-spec-label">Available</div><div class="info-spec-val">' + (lot.availableCount !== void 0 ? lot.availableCount : "--") + "</div></div>";
      if (lot.lockedByQuest) h += '<div class="info-spec-item"><div class="info-spec-label">Locked By Quest</div><div class="info-spec-val">' + lot.lockedByQuest + "</div></div>";
      if (lot.unavailableReason) h += '<div class="info-spec-item"><div class="info-spec-label">Status</div><div class="info-spec-val">' + lot.unavailableReason + "</div></div>";
    } else {
      if (det.manufacturer) h += '<div class="info-spec-item"><div class="info-spec-label">Manufacturer</div><div class="info-spec-val">' + det.manufacturer + "</div></div>";
      if (det.tier) h += '<div class="info-spec-item"><div class="info-spec-label">Tier</div><div class="info-spec-val">' + det.tier + "</div></div>";
      if (det.itemVulnerability !== void 0) h += '<div class="info-spec-item"><div class="info-spec-label">Vulnerability</div><div class="info-spec-val">' + det.itemVulnerability + " %</div></div>";
      if (lot.accessLevel) h += '<div class="info-spec-item"><div class="info-spec-label">Access Level</div><div class="info-spec-val">' + lot.accessLevel + "</div></div>";
      if (det.specs && typeof det.specs === "object") {
        if (Array.isArray(det.specs)) {
          for (const spec of det.specs) {
            if (spec && typeof spec === "object") {
              if (spec.type) h += '<div class="info-spec-item"><div class="info-spec-label">Type</div><div class="info-spec-val">' + spec.type + "</div></div>";
              if (spec.power && Array.isArray(spec.power)) h += '<div class="info-spec-item"><div class="info-spec-label">Power</div><div class="info-spec-val">' + spec.power[0] + " \u2013 " + spec.power[1] + "</div></div>";
              if (spec.fileTypes && Array.isArray(spec.fileTypes)) h += '<div class="info-spec-item"><div class="info-spec-label">File Types</div><div class="info-spec-val">' + spec.fileTypes.join(", ") + "</div></div>";
              if (spec.serverTypes && Array.isArray(spec.serverTypes)) h += '<div class="info-spec-item"><div class="info-spec-label">Server Types</div><div class="info-spec-val">' + spec.serverTypes.join(", ") + "</div></div>";
              if (spec.remote !== void 0) h += '<div class="info-spec-item"><div class="info-spec-label">Remote</div><div class="info-spec-val">' + (spec.remote ? "Yes" : "No") + "</div></div>";
            }
          }
        } else {
          for (const [specKey, specVal] of Object.entries(det.specs)) {
            const label = specKey.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
            let displayVal;
            if (Array.isArray(specVal)) {
              displayVal = specVal.join(", ");
            } else if (specVal !== null && typeof specVal === "object") {
              displayVal = JSON.stringify(specVal);
            } else {
              displayVal = specVal;
            }
            h += '<div class="info-spec-item"><div class="info-spec-label">' + label + '</div><div class="info-spec-val">' + displayVal + "</div></div>";
          }
        }
      }
    }
    h += "</div>";
    _safeSetHtml(popup, h);
    popup.classList.add("open");
    overlay.classList.add("open");
    const close = () => {
      popup.classList.remove("open");
      overlay.classList.remove("open");
      overlay.removeEventListener("click", close);
    };
    overlay.addEventListener("click", close);
  }
  function renderMarketInto(container, data, labelPrefix, idPrefix) {
    var openSections = {};
    container.querySelectorAll(".expandable-header.open").forEach((hdr) => {
      var key = hdr.getAttribute("data-expand") || hdr.id;
      if (key) openSections[key] = true;
    });
    _clearEl(container);
    if (!data || !data.market) {
      container.replaceChildren(_noData("No market data available.", "Make sure you have the cor3.gg tab open."));
      return;
    }
    const md = data;
    const market = md.market;
    const rep = md.reputation;
    let html = "";
    if (idPrefix == "home") {
      html += '<img src="factions/core_faction-96x96.png" class="faction-icon" alt="">';
    } else if (idPrefix == "dark") {
      html += '<img src="factions/bmi_faction-96x96.png" class="faction-icon" alt="">';
    } else if (idPrefix == "soyuz") {
      html += '<img src="factions/soyuz_faction-96x96.png" class="faction-icon" alt="">';
    } else if (idPrefix == "usol") {
      html += '<img src="factions/usol_faction-96x96.png" class="faction-icon" alt="">';
    }
    if (md.userCredits !== void 0) {
      html += `<div style="font-size:11px;color:var(--accent-green);margin-bottom:4px;">\u{1F4B0} Credits: ${md.userCredits.toLocaleString()}</div>`;
    }
    if (rep) {
      const pct = rep.requiredReputation > 0 ? Math.min(100, Math.floor(rep.progress / rep.requiredReputation * 100)) : 0;
      html += `<div style="font-size:11px;color:var(--text-muted);margin-bottom:2px;">Reputation \u2014 Level ${rep.level}</div>`;
      html += `<div class="market-rep-bar"><div class="market-rep-fill" style="width:${pct}%"></div></div>`;
      html += `<div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;">`;
      html += `Progress: ${rep.progress}/${rep.requiredReputation} \xB7 `;
      html += `Level Locked: ${rep.isLevelLocked ? "Yes" : "No"} \xB7 `;
      html += `Max Level: ${rep.isMaxLevel ? "Yes" : "No"}`;
      html += `</div>`;
    }
    const jobCount = md.jobs ? md.jobs.length : 0;
    const availableJobs = md.jobs ? md.jobs.filter((j) => !j.isCompleted && !j.isExpired).length : 0;
    if (md.nextJobsResetAt) {
      html += `<div class="${idPrefix}-reset-timer" style="font-size:11px;color:var(--accent-orange);margin-bottom:8px;">\u23F3 Jobs Reset: ${formatTimeRemaining(md.nextJobsResetAt)}</div>`;
    } else if (jobCount > 0) {
      html += `<div style="font-size:11px;color:var(--accent-orange);margin-bottom:8px;">Jobs: ${availableJobs}/${jobCount}</div>`;
    }
    html += `<div class="expandable-header" id="${idPrefix}ItemsToggle"><span class="expand-arrow">\u25B6</span><span class="expand-label">Items List (${(md.lots || []).length})</span></div>`;
    html += `<div class="expandable-body" id="${idPrefix}ItemsBody">`;
    if (md.lots && md.lots.length > 0) {
      const groups = {};
      for (const lot of md.lots) {
        const cat = lot.category || "OTHER";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(lot);
      }
      const INFO_BTN_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><g clip-path="url(#mi2)"><path d="M3.759 1.2H12.243c.703 0 1.3.246 1.81.75.502.503.748 1.095.748 1.797v8.495c0 .71-.246 1.305-.748 1.807-.51.505-1.107.751-1.81.751H3.76c-.71 0-1.306-.246-1.809-.749-.502-.502-.749-1.097-.749-1.808V3.747c0-.703.246-1.295.75-1.798.502-.503 1.098-.75 1.808-.75z" stroke="currentColor" stroke-width="0.8"/><path d="M6.994 3.837h2.002v1.992H6.994V3.837zM6.994 7.124h2.002v5.049H6.994V7.124z" fill="currentColor"/></g><defs><clipPath id="mi2"><rect width="16" height="16" fill="currentColor"/></clipPath></defs></svg>';
      var lotMap = [];
      for (const [cat, items] of Object.entries(groups)) {
        html += `<div class="market-category-title">${cat.charAt(0) + cat.slice(1).toLowerCase()}</div>`;
        for (const lot of items) {
          const det = lot.details || {};
          const isAccess = cat === "ACCESS";
          const isBought = lot.availableCount === 0;
          const boughtTag = isBought && !isAccess ? '<span class="market-item-bought">BOUGHT</span>' : "";
          const matchedSubstring = det.name ? Object.keys(zoomList).find((substring) => det.name.includes(substring)) : "";
          let zoomLotImg = "";
          if (matchedSubstring) {
            zoomLotImg = `style="transform:scale(${zoomList[matchedSubstring]});object-fit:contain;"`;
          }
          const imgHtml = det.image ? `<div style="overflow:hidden;border-radius:6px;width:40px;height:40px;margin-top:6px;"><img src="${det.image}" alt="${det.name || ""}" loading="lazy" ${zoomLotImg}></div>` : "";
          let itemName;
          if (isAccess) {
            itemName = (det.serverName || "") + " " + (det.accessType || "") + " access";
          } else {
            itemName = det.name || "Unknown";
          }
          const unavailTag = lot.unavailableReason ? `<span class="market-item-bought" style="background:rgba(255,160,0,0.2);color:var(--accent-orange);">${lot.unavailableReason.toUpperCase()}</span>` : "";
          const lotIdx = lotMap.length;
          lotMap.push(lot);
          html += `<div class="market-item-card">`;
          html += imgHtml;
          html += `<div class="market-item-info">`;
          html += `<div class="market-item-header">`;
          html += `<div class="market-item-name">${itemName}${boughtTag}${unavailTag}</div>`;
          html += `<button class="market-item-info-btn" data-lot-idx="${lotIdx}">${INFO_BTN_SVG} INFO</button>`;
          html += `</div>`;
          html += `<div class="market-item-price">\u{1F4B0} ${lot.price ? lot.price.toLocaleString() : "--"}</div>`;
          const uid = idPrefix + "_mitem_" + lot.id;
          html += `<div class="expandable-header" data-expand="${uid}"><span class="expand-arrow">\u25B6</span><span class="expand-label">Details</span></div>`;
          html += `<div class="expandable-body" id="${uid}">`;
          if (isAccess) {
            if (lot.accessLevel) html += `<div class="detail-row"><span class="label">Access Level:</span> ${lot.accessLevel}</div>`;
            if (det.durationHours !== void 0) html += `<div class="detail-row"><span class="label">Duration:</span> ${det.durationHours}h</div>`;
            if (det.accessType) html += `<div class="detail-row"><span class="label">Access Type:</span> ${det.accessType}</div>`;
            if (det.serverName) html += `<div class="detail-row"><span class="label">Server:</span> ${det.serverName}</div>`;
            html += `<div class="detail-row"><span class="label">Available:</span> ${lot.availableCount !== void 0 ? lot.availableCount : "--"}</div>`;
            if (lot.lockedByQuest) html += `<div class="detail-row"><span class="label">Locked By Quest:</span> ${lot.lockedByQuest}</div>`;
            if (lot.unavailableReason) html += `<div class="detail-row"><span class="label">Status:</span> ${lot.unavailableReason}</div>`;
          } else {
            if (det.manufacturer) html += `<div class="detail-row"><span class="label">Manufacturer:</span> ${det.manufacturer}</div>`;
            if (det.tier) html += `<div class="detail-row"><span class="label">Tier:</span> ${det.tier}</div>`;
            if (det.itemVulnerability !== void 0) html += `<div class="detail-row"><span class="label">Vulnerability:</span> ${det.itemVulnerability}%</div>`;
            if (det.price) html += `<div class="detail-row"><span class="label">Base Price:</span> \u{1F4B0} ${det.price.toLocaleString()}</div>`;
            if (lot.priceModifier) html += `<div class="detail-row"><span class="label">Price Modifier:</span> ${lot.priceModifier > 0 ? "+" : ""}${lot.priceModifier}</div>`;
            if (lot.accessLevel) html += `<div class="detail-row"><span class="label">Access Level:</span> ${lot.accessLevel}</div>`;
            if (det.specs && typeof det.specs === "object") {
              if (Array.isArray(det.specs)) {
                for (const spec of det.specs) {
                  if (spec && typeof spec === "object") {
                    if (spec.type) html += `<div class="detail-row"><span class="label">Type:</span> ${spec.type}</div>`;
                    if (spec.power && Array.isArray(spec.power)) html += `<div class="detail-row"><span class="label">Power:</span> ${spec.power[0]} \u2013 ${spec.power[1]}</div>`;
                    if (spec.fileTypes && Array.isArray(spec.fileTypes)) html += `<div class="detail-row"><span class="label">File Types:</span> ${spec.fileTypes.join(", ")}</div>`;
                    if (spec.serverTypes && Array.isArray(spec.serverTypes)) html += `<div class="detail-row"><span class="label">Server Types:</span> ${spec.serverTypes.join(", ")}</div>`;
                    if (spec.remote !== void 0) html += `<div class="detail-row"><span class="label">Remote:</span> ${spec.remote ? "Yes" : "No"}</div>`;
                  }
                }
              } else {
                for (const [specKey, specVal] of Object.entries(det.specs)) {
                  const label = specKey.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                  let displayVal;
                  if (Array.isArray(specVal)) {
                    displayVal = specVal.join(", ");
                  } else if (specVal !== null && typeof specVal === "object") {
                    displayVal = JSON.stringify(specVal);
                  } else {
                    displayVal = specVal;
                  }
                  html += `<div class="detail-row"><span class="label">${label}:</span> ${displayVal}</div>`;
                }
              }
            }
            if (det.description) html += `<div class="detail-row" style="color:var(--text-dim);font-style:italic;margin-top:2px;">${det.description}</div>`;
          }
          html += `</div>`;
          html += `</div></div>`;
        }
      }
    } else {
      html += '<div class="no-decisions">No items in market.</div>';
    }
    html += `</div>`;
    const openJobs = (md.jobs || []).filter((j) => !j.isCompleted && !j.isExpired).map((j) => ({ ...j, _status: "OPEN" }));
    const recentActive = (md.recentJobs || []).filter((j) => j.status === "TAKEN" || j.status === "FAILED").map((j) => ({ ...j, _status: j.status === "FAILED" ? "FAILED" : "IN PROGRESS" }));
    const completedJobs = (md.jobs || []).filter((j) => j.isCompleted || j.isExpired).map((j) => ({ ...j, _status: j.isCompleted ? "COMPLETED" : "EXPIRED" }));
    const allJobsList = [...openJobs, ...recentActive, ...completedJobs];
    const activeJobCount = openJobs.length + recentActive.length;
    html += `<div class="expandable-header" id="${idPrefix}JobsToggle"><span class="expand-arrow">\u25B6</span><span class="expand-label">Jobs List (${activeJobCount}/${allJobsList.length})</span></div>`;
    html += `<div class="expandable-body" id="${idPrefix}JobsBody">`;
    if (allJobsList.length > 0) {
      allJobsList.sort((a, b) => {
        const sA = (a.relatedServers && a.relatedServers[0] ? a.relatedServers[0].serverName : "") || "";
        const sB = (b.relatedServers && b.relatedServers[0] ? b.relatedServers[0].serverName : "") || "";
        return sA.localeCompare(sB);
      });
      html += `<table style="width:100%;font-size:10px;border-collapse:collapse;margin-bottom:4px;">`;
      html += `<tr style="color:var(--text-dim);border-bottom:1px solid var(--border);"><th style="text-align:left;padding:3px 4px;">Job</th><th style="text-align:left;padding:3px 4px;">Server</th><th style="text-align:center;padding:3px 4px;">Status</th><th style="text-align:right;padding:3px 4px;">Reward/Penalty</th></tr>`;
      for (const job of allJobsList) {
        const dimStyle = job._status === "COMPLETED" || job._status === "EXPIRED" ? "opacity:0.5;" : "";
        const jobName = job.name || job.id || "Unknown";
        const serverName = job.relatedServers && job.relatedServers[0] ? job.relatedServers[0].serverName : "N/A";
        let rewardStr = "--";
        let rewardColor = "var(--accent-green)";
        const isFailed = job._status === "FAILED" || job._status === "EXPIRED";
        if (isFailed) {
          if (job.reputationPenalty > 0) {
            rewardStr = `<span style="color:var(--accent-red,#f38ba8);">\u2B50 -${job.reputationPenalty.toLocaleString()}</span>`;
            rewardColor = "var(--accent-red, #f38ba8)";
          } else if (job.deposit > 0) {
            rewardStr = `<span style="color:var(--accent-red,#f38ba8);">\u{1F4B0} -${job.deposit.toLocaleString()}</span>`;
            rewardColor = "var(--accent-red, #f38ba8)";
          }
        } else {
          if (job.rewardCredits) {
            rewardStr = `\u{1F4B0} ${job.rewardCredits.toLocaleString()}`;
            if (job.deposit) rewardStr += ` <span style="color:var(--accent-red,#f38ba8);">(-${job.deposit.toLocaleString()})</span>`;
          }
          if (job.rewardReputation) {
            rewardStr += ` \xB7 \u2B50 ${job.rewardReputation}`;
          }
        }
        let statusColor, statusIcon;
        switch (job._status) {
          case "OPEN":
            statusColor = "var(--accent-blue, #89b4fa)";
            statusIcon = "\u{1F539}";
            break;
          case "IN PROGRESS":
            statusColor = "var(--accent-orange, #fab387)";
            statusIcon = "\u{1F504}";
            break;
          case "FAILED":
            statusColor = "var(--accent-red, #f38ba8)";
            statusIcon = "\u274C";
            break;
          case "COMPLETED":
            statusColor = "var(--accent-green, #a6e3a1)";
            statusIcon = "\u2705";
            break;
          case "EXPIRED":
            statusColor = "var(--text-dim, #6c7086)";
            statusIcon = "\u23F0";
            break;
          default:
            statusColor = "var(--text-dim)";
            statusIcon = "\u2014";
            break;
        }
        html += `<tr style="${dimStyle}border-bottom:1px solid var(--border);">`;
        html += `<td style="padding:3px 4px;color:var(--text-secondary);">${jobName}</td>`;
        html += `<td style="padding:3px 4px;color:var(--text-muted);">${serverName}</td>`;
        html += `<td style="padding:3px 4px;text-align:center;color:${statusColor};font-size:9px;">${statusIcon} ${job._status}</td>`;
        html += `<td style="padding:3px 4px;text-align:right;color:${rewardColor};">${rewardStr}</td>`;
        html += `</tr>`;
      }
      html += `</table>`;
    } else {
      html += '<div class="no-decisions">No jobs available.</div>';
    }
    html += `</div>`;
    _safeSetHtml(container, html);
    container.querySelectorAll(".expandable-header").forEach((hdr) => {
      var key = hdr.getAttribute("data-expand") || hdr.id;
      if (key && openSections[key]) {
        hdr.classList.add("open");
        var bodyId = hdr.getAttribute("data-expand") || hdr.id.replace("Toggle", "Body");
        var body = document.getElementById(bodyId);
        if (body) body.classList.add("open");
      }
      hdr.addEventListener("click", () => {
        hdr.classList.toggle("open");
        const targetId = hdr.getAttribute("data-expand") || hdr.id.replace("Toggle", "Body");
        const body2 = document.getElementById(targetId);
        if (body2) body2.classList.toggle("open");
      });
    });
    if (lotMap && lotMap.length > 0) {
      container.querySelectorAll(".market-item-info-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.lotIdx, 10);
          if (!isNaN(idx) && lotMap[idx]) showMarketInfoPopup(lotMap[idx]);
        });
      });
    }
    const cleanupBtnMap = { home: "cleanupCoreMarketBtn", dark: "cleanupDarkMarketBtn", soyuz: "cleanupSoyuzMarketBtn", usol: "cleanupUsolMarketBtn" };
    const cleanupBtn = document.getElementById(cleanupBtnMap[idPrefix]);
    if (cleanupBtn) {
      const failedJobs = (md.recentJobs || []).filter((j) => j.status === "FAILED");
      cleanupBtn.style.display = failedJobs.length > 0 ? "" : "none";
    }
  }
  function renderMarket(data) {
    if (data && data.nextJobsResetAt) state.coreNextJobsResetAt = data.nextJobsResetAt;
    if (data && data.market && data.market.marketName) {
      state.coreMarketName = data.market.marketName;
      updateMarketLabel(coreMarketLabel, state.coreMarketName, "Market-1", "\u{1F3E0}");
      renderPinnedTimers();
    }
    renderMarketInto(marketContainer, data, "Market-1", "home");
  }
  function renderDarkMarket(data, available, maintenanceEndsAt, blockerServer) {
    if (available === false) {
      let timerHtml = "";
      if (blockerServer) timerHtml += " (" + blockerServer + " in maintenance";
      if (maintenanceEndsAt) {
        const diff = new Date(maintenanceEndsAt).getTime() - Date.now();
        if (diff > 0) {
          const mins = Math.ceil(diff / 6e4);
          timerHtml += (blockerServer ? ", " : " (") + "~" + mins + "m remaining";
        }
      }
      if (timerHtml) timerHtml += ")";
      const warningEl = _h("div", { className: "warning-banner" }, "\u26A0\uFE0F D4RK market server is currently unreachable" + timerHtml + ".");
      if (data && data.market) {
        if (data.nextJobsResetAt) state.bmiNextJobsResetAt = data.nextJobsResetAt;
        if (data.market.marketName) {
          state.darkMarketName = data.market.marketName;
          updateMarketLabel(darkMarketLabel, state.darkMarketName, "Market-2", "\u{1F311}");
        }
        renderMarketInto(darkMarketContainer, data, "Market-2 (cached)", "dark");
        darkMarketContainer.prepend(warningEl);
      } else {
        darkMarketContainer.replaceChildren(warningEl, _noData("No cached market data available."));
      }
      return;
    }
    if (data && data.nextJobsResetAt) state.bmiNextJobsResetAt = data.nextJobsResetAt;
    if (data && data.market && data.market.marketName) {
      state.darkMarketName = data.market.marketName;
      updateMarketLabel(darkMarketLabel, state.darkMarketName, "Market-2", "\u{1F311}");
      renderPinnedTimers();
    }
    renderMarketInto(darkMarketContainer, data, "Market-2", "dark");
  }
  function renderSoyuzMarket(data, available, maintenanceEndsAt, blockerServer) {
    if (available === false) {
      let timerHtml = "";
      if (blockerServer) timerHtml += " (" + blockerServer + " in maintenance";
      if (maintenanceEndsAt) {
        const diff = new Date(maintenanceEndsAt).getTime() - Date.now();
        if (diff > 0) {
          const mins = Math.ceil(diff / 6e4);
          timerHtml += (blockerServer ? ", " : " (") + "~" + mins + "m remaining";
        }
      }
      if (timerHtml) timerHtml += ")";
      const warningEl = _h("div", { className: "warning-banner" }, "\u26A0\uFE0F SOYUZ market server is currently unreachable" + timerHtml + ".");
      if (data && data.market) {
        if (data.nextJobsResetAt) state.soyuzNextJobsResetAt = data.nextJobsResetAt;
        if (data.market.marketName) {
          state.soyuzMarketName = data.market.marketName;
          updateMarketLabel(soyuzMarketLabel, state.soyuzMarketName, "Market-3", "\u262D");
        }
        renderMarketInto(soyuzMarketContainer, data, "Market-3 (cached)", "soyuz");
        soyuzMarketContainer.prepend(warningEl);
      } else {
        soyuzMarketContainer.replaceChildren(warningEl, _noData("No cached market data available."));
      }
      return;
    }
    if (data && data.nextJobsResetAt) state.soyuzNextJobsResetAt = data.nextJobsResetAt;
    if (data && data.market && data.market.marketName) {
      state.soyuzMarketName = data.market.marketName;
      updateMarketLabel(soyuzMarketLabel, state.soyuzMarketName, "Market-3", "\u262D");
      renderPinnedTimers();
    }
    renderMarketInto(soyuzMarketContainer, data, "Market-3", "soyuz");
  }
  function renderUsolMarket(data, available, maintenanceEndsAt, blockerServer) {
    if (available === false) {
      let timerHtml = "";
      if (blockerServer) timerHtml += " (" + blockerServer + " in maintenance";
      if (maintenanceEndsAt) {
        const diff = new Date(maintenanceEndsAt).getTime() - Date.now();
        if (diff > 0) {
          const mins = Math.ceil(diff / 6e4);
          timerHtml += (blockerServer ? ", " : " (") + "~" + mins + "m remaining";
        }
      }
      if (timerHtml) timerHtml += ")";
      const warningEl = _h("div", { className: "warning-banner" }, "\u26A0\uFE0F USOL market server is currently unreachable" + timerHtml);
      if (data && data.market) {
        if (data.nextJobsResetAt) state.usolNextJobsResetAt = data.nextJobsResetAt;
        if (data.market.marketName) {
          state.usolMarketName = data.market.marketName;
          updateMarketLabel(usolMarketLabel, state.usolMarketName, "Market-4", "\u262E");
        }
        renderMarketInto(usolMarketContainer, data, "Market-4 (cached)", "usol");
        usolMarketContainer.prepend(warningEl);
      } else {
        usolMarketContainer.replaceChildren(warningEl, _noData("No cached market data available."));
      }
      return;
    }
    if (data && data.nextJobsResetAt) state.usolNextJobsResetAt = data.nextJobsResetAt;
    if (data && data.market && data.market.marketName) {
      state.usolMarketName = data.market.marketName;
      updateMarketLabel(usolMarketLabel, state.usolMarketName, "Market-4", "\u262E");
      renderPinnedTimers();
    }
    renderMarketInto(usolMarketContainer, data, "Market-4", "usol");
  }
  async function loadMarket() {
    const { marketData } = await Cor3CenterStore.get("marketData");
    renderMarket(marketData);
  }
  async function loadDarkMarket() {
    const { darkMarketData, darkMarketAvailable, darkMarketMaintenanceEndsAt, darkMarketBlockerServer } = await Cor3CenterStore.get(["darkMarketData", "darkMarketAvailable", "darkMarketMaintenanceEndsAt", "darkMarketBlockerServer"]);
    renderDarkMarket(darkMarketData, darkMarketAvailable, darkMarketMaintenanceEndsAt, darkMarketBlockerServer);
  }
  async function loadSoyuzMarket() {
    const { soyuzMarketData, soyuzMarketAvailable, soyuzMarketMaintenanceEndsAt, soyuzMarketBlockerServer } = await Cor3CenterStore.get(["soyuzMarketData", "soyuzMarketAvailable", "soyuzMarketMaintenanceEndsAt", "soyuzMarketBlockerServer"]);
    renderSoyuzMarket(soyuzMarketData, soyuzMarketAvailable, soyuzMarketMaintenanceEndsAt, soyuzMarketBlockerServer);
  }
  async function loadUsolMarket() {
    const { usolMarketData, usolMarketAvailable, usolMarketMaintenanceEndsAt, usolMarketBlockerServer } = await Cor3CenterStore.get(["usolMarketData", "usolMarketAvailable", "usolMarketMaintenanceEndsAt", "usolMarketBlockerServer"]);
    renderUsolMarket(usolMarketData, usolMarketAvailable, usolMarketMaintenanceEndsAt, usolMarketBlockerServer);
  }
  function getMarketContainers() {
    return { marketContainer, darkMarketContainer, soyuzMarketContainer, usolMarketContainer };
  }
  function initMarketRefreshButtons() {
    refreshMarketBtn.addEventListener("click", async () => {
      marketContainer.replaceChildren(_noData("Refreshing market data..."));
      try {
        const tab = await getCor3Tab();
        if (!tab) throw new Error("No cor3.gg tab");
        await Cor3CenterUi.send(tab.id, { action: "refreshMarket" });
        setTimeout(() => {
          observeCenterRead(loadMarket());
          refreshAllTimestamps();
        }, 3e3);
      } catch (e) {
        setTimeout(() => {
          observeCenterRead(loadMarket());
          refreshAllTimestamps();
        }, 500);
      }
    });
    refreshDarkMarketBtn.addEventListener("click", async () => {
      darkMarketContainer.replaceChildren(_noData("Refreshing market data..."));
      try {
        const tab = await getCor3Tab();
        if (!tab) throw new Error("No cor3.gg tab");
        await Cor3CenterUi.send(tab.id, { action: "refreshDarkMarket" });
        setTimeout(() => {
          observeCenterRead(loadDarkMarket());
          refreshAllTimestamps();
        }, 3e3);
      } catch (e) {
        setTimeout(() => {
          observeCenterRead(loadDarkMarket());
          refreshAllTimestamps();
        }, 500);
      }
    });
    refreshSoyuzMarketBtn.addEventListener("click", async () => {
      soyuzMarketContainer.replaceChildren(_noData("Refreshing market data..."));
      try {
        const tab = await getCor3Tab();
        if (!tab) throw new Error("No cor3.gg tab");
        await Cor3CenterUi.send(tab.id, { action: "refreshSoyuzMarket" });
        setTimeout(() => {
          observeCenterRead(loadSoyuzMarket());
          refreshAllTimestamps();
        }, 5e3);
      } catch (e) {
        setTimeout(() => {
          observeCenterRead(loadSoyuzMarket());
          refreshAllTimestamps();
        }, 500);
      }
    });
    refreshUsolMarketBtn.addEventListener("click", async () => {
      usolMarketContainer.replaceChildren(_noData("Refreshing market data..."));
      try {
        const tab = await getCor3Tab();
        if (!tab) throw new Error("No cor3.gg tab");
        await Cor3CenterUi.send(tab.id, { action: "refreshUsolMarket" });
        setTimeout(() => {
          observeCenterRead(loadUsolMarket());
          refreshAllTimestamps();
        }, 5e3);
      } catch (e) {
        setTimeout(() => {
          observeCenterRead(loadUsolMarket());
          refreshAllTimestamps();
        }, 500);
      }
    });
  }
  async function refreshMarket1Only() {
    marketContainer.replaceChildren(_noData("Refreshing Market-1..."));
    await Cor3CenterStore.remove("marketData");
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "refreshMarket" });
    } catch (e) {
    }
    await waitForStorageKey("marketData", 8e3);
    await loadMarket();
    refreshAllTimestamps();
  }
  async function setDarkMarketEndpoint() {
    darkMarketContainer.replaceChildren(_noData("Setting Market-2 endpoint..."));
  }
  async function refreshMarket2Only() {
    darkMarketContainer.replaceChildren(_noData("Refreshing Market-2..."));
    await Cor3CenterStore.remove(["darkMarketData", "darkMarketAvailable"]);
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "refreshDarkMarket" });
    } catch (e) {
    }
    await new Promise((resolve) => {
      let done = false;
      const poll = setInterval(async () => {
        const data = await Cor3CenterStore.get(["darkMarketData", "darkMarketAvailable"]);
        if (data.darkMarketData || data.darkMarketAvailable !== void 0) {
          clearInterval(poll);
          if (!done) {
            done = true;
            resolve();
          }
        }
      }, 400);
      setTimeout(() => {
        clearInterval(poll);
        if (!done) {
          done = true;
          resolve();
        }
      }, 1e4);
    });
    await loadDarkMarket();
    refreshAllTimestamps();
  }
  async function refreshMarket3Only() {
    soyuzMarketContainer.replaceChildren(_noData("Refreshing Market-3..."));
    await Cor3CenterStore.remove(["soyuzMarketData", "soyuzMarketAvailable"]);
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "refreshSoyuzMarket" });
    } catch (e) {
    }
    await new Promise((resolve) => {
      let done = false;
      const poll = setInterval(async () => {
        const data = await Cor3CenterStore.get(["soyuzMarketData", "soyuzMarketAvailable"]);
        if (data.soyuzMarketData || data.soyuzMarketAvailable !== void 0) {
          clearInterval(poll);
          if (!done) {
            done = true;
            resolve();
          }
        }
      }, 400);
      setTimeout(() => {
        clearInterval(poll);
        if (!done) {
          done = true;
          resolve();
        }
      }, 15e3);
    });
    await loadSoyuzMarket();
    refreshAllTimestamps();
  }
  async function refreshMarket4Only() {
    usolMarketContainer.replaceChildren(_noData("Refreshing Market-4..."));
    await Cor3CenterStore.remove(["usolMarketData", "usolMarketAvailable"]);
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "refreshUsolMarket" });
    } catch (e) {
    }
    await new Promise((resolve) => {
      let done = false;
      const poll = setInterval(async () => {
        const data = await Cor3CenterStore.get(["usolMarketData", "usolMarketAvailable"]);
        if (data.usolMarketData || data.usolMarketAvailable !== void 0) {
          clearInterval(poll);
          if (!done) {
            done = true;
            resolve();
          }
        }
      }, 400);
      setTimeout(() => {
        clearInterval(poll);
        if (!done) {
          done = true;
          resolve();
        }
      }, 15e3);
    });
    await loadUsolMarket();
    refreshAllTimestamps();
  }
  function initMarketStorageListener() {
    Cor3CenterStore.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.marketData) {
        const md = changes.marketData.newValue;
        if (md) {
          if (md.nextJobsResetAt) state.coreNextJobsResetAt = md.nextJobsResetAt;
          if (md.market && md.market.marketName) {
            state.coreMarketName = md.market.marketName;
            updateMarketLabel(coreMarketLabel, state.coreMarketName, "Market-1", "\u{1F3E0}");
          }
          renderMarket(md);
          refreshAllTimestamps();
        }
      }
      if (changes.darkMarketData || changes.darkMarketAvailable) {
        observeCenterRead(loadDarkMarket());
        refreshAllTimestamps();
      }
      if (changes.soyuzMarketData || changes.soyuzMarketAvailable) {
        observeCenterRead(loadSoyuzMarket());
        refreshAllTimestamps();
      }
      if (changes.usolMarketData || changes.usolMarketAvailable) {
        observeCenterRead(loadUsolMarket());
        refreshAllTimestamps();
      }
      if (changes.serverMaintenanceMap) {
        Cor3CenterStore.get(["darkMarketData", "darkMarketAvailable", "soyuzMarketData", "soyuzMarketAvailable", "usolMarketData", "usolMarketAvailable"], (r) => {
          const map = changes.serverMaintenanceMap.newValue;
          if (!r.darkMarketData && r.darkMarketAvailable === void 0) {
            const b = findMaintenanceBlocker(map, "dark");
            if (b) renderDarkMarket(null, false, b.maintenanceEndsAt, b.blockerName);
          }
          if (!r.soyuzMarketData && r.soyuzMarketAvailable === void 0) {
            const b = findMaintenanceBlocker(map, "soyuz");
            if (b) renderSoyuzMarket(null, false, b.maintenanceEndsAt, b.blockerName);
          }
          if (!r.usolMarketData && r.usolMarketAvailable === void 0) {
            const b = findMaintenanceBlocker(map, "usol");
            if (b) renderUsolMarket(null, false, b.maintenanceEndsAt, b.blockerName);
          }
        });
      }
    });
  }
  function initMarketCacheLoad() {
    Cor3CenterStore.get(["marketData", "darkMarketData", "darkMarketAvailable", "darkMarketMaintenanceEndsAt", "darkMarketBlockerServer", "soyuzMarketData", "soyuzMarketAvailable", "soyuzMarketMaintenanceEndsAt", "soyuzMarketBlockerServer", "usolMarketData", "usolMarketAvailable", "usolMarketMaintenanceEndsAt", "usolMarketBlockerServer", "serverMaintenanceMap"], (result) => {
      if (result.marketData) {
        if (result.marketData.nextJobsResetAt) state.coreNextJobsResetAt = result.marketData.nextJobsResetAt;
        if (result.marketData.market && result.marketData.market.marketName) {
          state.coreMarketName = result.marketData.market.marketName;
          updateMarketLabel(coreMarketLabel, state.coreMarketName, "Market-1", "\u{1F3E0}");
        }
        renderMarket(result.marketData);
      } else {
        marketContainer.replaceChildren(_noData("No market data cached. Click \u{1F504} to refresh."));
      }
      if (result.darkMarketData || result.darkMarketAvailable === false) {
        if (result.darkMarketData) {
          if (result.darkMarketData.nextJobsResetAt) state.bmiNextJobsResetAt = result.darkMarketData.nextJobsResetAt;
          if (result.darkMarketData.market && result.darkMarketData.market.marketName) {
            state.darkMarketName = result.darkMarketData.market.marketName;
            updateMarketLabel(darkMarketLabel, state.darkMarketName, "Market-2", "\u{1F311}");
          }
        }
        renderDarkMarket(result.darkMarketData || null, result.darkMarketAvailable, result.darkMarketMaintenanceEndsAt, result.darkMarketBlockerServer);
      } else {
        const darkBlocker = findMaintenanceBlocker(result.serverMaintenanceMap, "dark");
        if (darkBlocker) {
          renderDarkMarket(null, false, darkBlocker.maintenanceEndsAt, darkBlocker.blockerName);
        } else {
          darkMarketContainer.replaceChildren(_noData("No market data cached. Click \u{1F504} to refresh."));
        }
      }
      if (result.soyuzMarketData || result.soyuzMarketAvailable === false) {
        if (result.soyuzMarketData) {
          if (result.soyuzMarketData.nextJobsResetAt) state.soyuzNextJobsResetAt = result.soyuzMarketData.nextJobsResetAt;
          if (result.soyuzMarketData.market && result.soyuzMarketData.market.marketName) {
            state.soyuzMarketName = result.soyuzMarketData.market.marketName;
            updateMarketLabel(soyuzMarketLabel, state.soyuzMarketName, "Market-3", "\u262D");
          }
        }
        renderSoyuzMarket(result.soyuzMarketData || null, result.soyuzMarketAvailable, result.soyuzMarketMaintenanceEndsAt, result.soyuzMarketBlockerServer);
      } else {
        const soyuzBlocker = findMaintenanceBlocker(result.serverMaintenanceMap, "soyuz");
        if (soyuzBlocker) {
          renderSoyuzMarket(null, false, soyuzBlocker.maintenanceEndsAt, soyuzBlocker.blockerName);
        } else {
          soyuzMarketContainer.replaceChildren(_noData("No market data cached. Click \u{1F504} to refresh."));
        }
      }
      if (result.usolMarketData || result.usolMarketAvailable === false) {
        if (result.usolMarketData) {
          if (result.usolMarketData.nextJobsResetAt) state.usolNextJobsResetAt = result.usolMarketData.nextJobsResetAt;
          if (result.usolMarketData.market && result.usolMarketData.market.marketName) {
            state.usolMarketName = result.usolMarketData.market.marketName;
            updateMarketLabel(usolMarketLabel, state.usolMarketName, "Market-4", "\u262E");
          }
        }
        renderUsolMarket(result.usolMarketData || null, result.usolMarketAvailable, result.usolMarketMaintenanceEndsAt, result.usolMarketBlockerServer);
      } else {
        const usolBlocker = findMaintenanceBlocker(result.serverMaintenanceMap, "usol");
        if (usolBlocker) {
          renderUsolMarket(null, false, usolBlocker.maintenanceEndsAt, usolBlocker.blockerName);
        } else {
          usolMarketContainer.replaceChildren(_noData("No market data cached. Click \u{1F504} to refresh."));
        }
      }
    });
  }
  initMarketRefreshButtons();
  initMarketCacheLoad();
  initMarketStorageListener();

  // src/popup/market-toggles.js
  function wireMarketToggle(toggleId, bodyId, containerId, onExpand) {
    const toggle = document.getElementById(toggleId);
    const body = document.getElementById(bodyId);
    const container = document.getElementById(containerId);
    if (!toggle || !body) return;
    toggle.addEventListener("click", () => {
      const wasOpen = body.classList.contains("open");
      toggle.classList.toggle("open");
      body.classList.toggle("open");
      if (!wasOpen && container && container.innerText.indexOf("No market data cached") !== -1) {
        onExpand();
      }
    });
  }
  wireMarketToggle("coreMarketToggle", "coreMarketBody", "marketContainer", () => refreshMarket1Only());
  wireMarketToggle("darkMarketToggle", "darkMarketBody", "darkMarketContainer", () => refreshMarket2Only());
  wireMarketToggle("soyuzMarketToggle", "soyuzMarketBody", "soyuzMarketContainer", () => refreshMarket3Only());
  wireMarketToggle("usolMarketToggle", "usolMarketBody", "usolMarketContainer", () => refreshMarket4Only());

  // src/popup/ui-toggles.js
  var autoDecryptToggle = document.getElementById("autoDecryptToggle");
  var decryptStatus = document.getElementById("decryptStatus");
  var autoIceWallToggle = document.getElementById("autoIceWallToggle");
  var iceWallStatus = document.getElementById("iceWallStatus");
  var iceWallSolverStatusLine = document.getElementById("iceWallSolverStatusLine");
  var autoSimpleDecryptToggle = document.getElementById("autoSimpleDecryptToggle");
  var simpleDecryptStatus = document.getElementById("simpleDecryptStatus");
  var simpleDecryptSolverStatusLine = document.getElementById("simpleDecryptSolverStatusLine");
  var autoDailyHackToggle = document.getElementById("autoDailyHackToggle");
  var dailyHackStatus = document.getElementById("dailyHackStatus");
  var dailyHackLogEl = document.getElementById("dailyHackLog");
  var dailyHackDiagDetails = document.getElementById("dailyHackDiagDetails");
  var dailyHackDiagActions = document.getElementById("dailyHackDiagActions");
  var dailyHackSchedule = document.getElementById("dailyHackSchedule");
  var copyDailyHackDiagBtn = document.getElementById("copyDailyHackDiagBtn");
  var clearDailyHackDiagBtn = document.getElementById("clearDailyHackDiagBtn");
  var disableBackgroundToggle = document.getElementById("disableBackgroundToggle");
  var backgroundStatus = document.getElementById("backgroundStatus");
  var disableNetworkFogToggle = document.getElementById("disableNetworkFogToggle");
  var networkFogStatus = document.getElementById("networkFogStatus");
  var moveNotificationsToggle = document.getElementById("moveNotificationsToggle");
  var moveNotificationsStatus = document.getElementById("moveNotificationsStatus");
  var autoUpdateMarketsToggle = document.getElementById("autoUpdateMarketsToggle");
  var autoUpdateMarketsStatus = document.getElementById("autoUpdateMarketsStatus");
  var secretFinderToggle = document.getElementById("secretFinderToggle");
  var secretFinderStatus = document.getElementById("secretFinderStatus");
  var secretFinderLogEl = document.getElementById("secretFinderLog");
  var autoChatToggle = document.getElementById("autoChatToggle");
  var autoChatStatus = document.getElementById("autoChatStatus");
  var autoChatLogEl = document.getElementById("autoChatLog");
  var autoCleanupFailedJobsToggle = document.getElementById("autoCleanupFailedJobsToggle");
  var autoCleanupFailedJobsStatus = document.getElementById("autoCleanupFailedJobsStatus");
  var togglesBody = document.getElementById("togglesBody");
  var togglesShowMoreBtn = document.getElementById("togglesShowMoreBtn");
  function statusLabel(el, enabled) {
    if (!el) return;
    el.textContent = enabled ? "Active" : "Off";
    el.style.color = enabled ? "var(--accent-green)" : "var(--text-dim)";
  }
  function renderSolverStatus(el, statusObj) {
    if (!el) return;
    if (!statusObj || !statusObj.message || Date.now() - statusObj.timestamp > 5 * 60 * 1e3) {
      el.style.display = "none";
      return;
    }
    const colorMap = { success: "var(--accent-green)", error: "var(--accent-red, #ff5555)", warn: "var(--accent-orange)", info: "var(--accent-cyan)" };
    el.textContent = statusObj.message;
    el.style.color = colorMap[statusObj.level] || "var(--text-dim)";
    el.style.display = "";
  }
  function updateDecryptStatusLabel(enabled) {
    statusLabel(decryptStatus, enabled);
  }
  function updateIceWallStatusLabel(enabled) {
    statusLabel(iceWallStatus, enabled);
  }
  function updateSimpleDecryptStatusLabel(enabled) {
    statusLabel(simpleDecryptStatus, enabled);
  }
  function updateDailyHackStatusLabel(enabled) {
    statusLabel(dailyHackStatus, enabled);
  }
  function renderDailyHackSchedule(nextCheckAt) {
    if (!dailyHackSchedule) return;
    const enabled = !!(autoDailyHackToggle && autoDailyHackToggle.checked);
    const ts = Number(nextCheckAt) || 0;
    if (!enabled || !ts || ts <= Date.now()) {
      dailyHackSchedule.style.display = "none";
      dailyHackSchedule.textContent = "";
      return;
    }
    const when = new Date(ts).toLocaleString();
    dailyHackSchedule.textContent = `${t("Next auto check:", "\u4E0B\u6B21\u81EA\u52A8\u68C0\u67E5\uFF1A")} ${when}`;
    dailyHackSchedule.style.display = "block";
  }
  function updateBackgroundStatus() {
    if (disableBackgroundToggle) statusLabel(backgroundStatus, disableBackgroundToggle.checked);
  }
  function updateNetworkFogStatus() {
    if (disableNetworkFogToggle) statusLabel(networkFogStatus, disableNetworkFogToggle.checked);
  }
  function updateMoveNotificationsStatus() {
    if (moveNotificationsToggle) statusLabel(moveNotificationsStatus, moveNotificationsToggle.checked);
  }
  function updateAutoUpdateMarketsStatus() {
    if (autoUpdateMarketsToggle) statusLabel(autoUpdateMarketsStatus, autoUpdateMarketsToggle.checked);
  }
  function updateSecretFinderStatusLabel(enabled) {
    statusLabel(secretFinderStatus, enabled);
  }
  function showCenterPreferenceUnknown(toggle, label) {
    if(toggle){toggle.indeterminate=true;toggle.disabled=true;const parent=toggle.closest('label');if(parent)parent.style.filter='grayscale(1)';}
    if(label){label.textContent='未读取';label.style.color='var(--text-secondary)';}
  }
  async function saveCenterSolverPreference(key, action, enabled) {
    const allowed = {autoDecryptEnabled:'toggleDecryptSolver',autoIceWallEnabled:'toggleIceWallSolver',autoSimpleDecryptEnabled:'toggleSimpleDecryptSolver'};
    if (allowed[key] !== action || typeof enabled !== 'boolean') throw Error('CENTER_PREFERENCE_INVALID');
    return Cor3SolverPopup.set({[key]:enabled});
  }
  function initAutoDecrypt() {
    showCenterPreferenceUnknown(autoDecryptToggle, decryptStatus);
    Cor3SolverPopup.get("autoDecryptEnabled").then(data => {
      if(typeof data.autoDecryptEnabled !== 'boolean') { showCenterPreferenceUnknown(autoDecryptToggle, decryptStatus); return; }
      autoDecryptToggle.indeterminate = false; autoDecryptToggle.disabled = !centerPreferenceReady; autoDecryptToggle.closest('label')?.style.removeProperty('filter');
      autoDecryptToggle.checked = data.autoDecryptEnabled;
      updateDecryptStatusLabel(autoDecryptToggle.checked);
    }).catch(() => showCenterPreferenceUnknown(autoDecryptToggle, decryptStatus));
    autoDecryptToggle.addEventListener("change", async () => {
      const enabled = autoDecryptToggle.checked;
      autoDecryptToggle.disabled = true;
      try {
        const result = await saveCenterSolverPreference("autoDecryptEnabled", "toggleDecryptSolver", enabled);
        updateDecryptStatusLabel(enabled);
        if (result.savedOnly && helperStatus) helperStatus.textContent = result.modeChanged ? "偏好已保存，但总闸在保存期间改变；未发送运行命令。" : "偏好已保存；当前暂停，不启动自动化。";
      } catch (error) {
        if (helperStatus) helperStatus.textContent = "偏好保存结果未确认：" + error.message;
      } finally { await refreshMasterAdmission(true); }
    });
  }
  function initAutoIceWall() {
    showCenterPreferenceUnknown(autoIceWallToggle, iceWallStatus);
    Cor3SolverPopup.get("autoIceWallEnabled").then(data => {
      if(typeof data.autoIceWallEnabled !== 'boolean') { showCenterPreferenceUnknown(autoIceWallToggle, iceWallStatus); return; }
      autoIceWallToggle.indeterminate = false; autoIceWallToggle.disabled = !centerPreferenceReady; autoIceWallToggle.closest('label')?.style.removeProperty('filter');
      autoIceWallToggle.checked = data.autoIceWallEnabled;
      updateIceWallStatusLabel(autoIceWallToggle.checked);
    }).catch(() => showCenterPreferenceUnknown(autoIceWallToggle, iceWallStatus));
    autoIceWallToggle.addEventListener("change", async () => {
      const enabled = autoIceWallToggle.checked;
      autoIceWallToggle.disabled = true;
      try {
        const result = await saveCenterSolverPreference("autoIceWallEnabled", "toggleIceWallSolver", enabled);
        updateIceWallStatusLabel(enabled);
        if (result.savedOnly && helperStatus) helperStatus.textContent = result.modeChanged ? "偏好已保存，但总闸在保存期间改变；未发送运行命令。" : "偏好已保存；当前暂停，不启动自动化。";
      } catch (error) {
        if (helperStatus) helperStatus.textContent = "偏好保存结果未确认：" + error.message;
      } finally { await refreshMasterAdmission(true); }
    });
    Cor3CenterStore.get("iceWallSolverStatus", (data) => {
      renderSolverStatus(iceWallSolverStatusLine, data.iceWallSolverStatus);
    });
  }
  function initAutoSimpleDecrypt() {
    showCenterPreferenceUnknown(autoSimpleDecryptToggle, simpleDecryptStatus);
    Cor3SolverPopup.get("autoSimpleDecryptEnabled").then(data => {
      if(typeof data.autoSimpleDecryptEnabled !== 'boolean') { showCenterPreferenceUnknown(autoSimpleDecryptToggle, simpleDecryptStatus); return; }
      autoSimpleDecryptToggle.indeterminate = false; autoSimpleDecryptToggle.disabled = !centerPreferenceReady; autoSimpleDecryptToggle.closest('label')?.style.removeProperty('filter');
      autoSimpleDecryptToggle.checked = data.autoSimpleDecryptEnabled;
      updateSimpleDecryptStatusLabel(autoSimpleDecryptToggle.checked);
    }).catch(() => showCenterPreferenceUnknown(autoSimpleDecryptToggle, simpleDecryptStatus));
    autoSimpleDecryptToggle.addEventListener("change", async () => {
      const enabled = autoSimpleDecryptToggle.checked;
      autoSimpleDecryptToggle.disabled = true;
      try {
        const result = await saveCenterSolverPreference("autoSimpleDecryptEnabled", "toggleSimpleDecryptSolver", enabled);
        updateSimpleDecryptStatusLabel(enabled);
        if (result.savedOnly && helperStatus) helperStatus.textContent = result.modeChanged ? "偏好已保存，但总闸在保存期间改变；未发送运行命令。" : "偏好已保存；当前暂停，不启动自动化。";
      } catch (error) {
        if (helperStatus) helperStatus.textContent = "偏好保存结果未确认：" + error.message;
      } finally { await refreshMasterAdmission(true); }
    });
    Cor3CenterStore.get("simpleDecryptSolverStatus", (data) => {
      renderSolverStatus(simpleDecryptSolverStatusLine, data.simpleDecryptSolverStatus);
    });
  }
  function formatDailyHackDiagEntry(entry) {
    const time = new Date(entry.ts || Date.now()).toLocaleTimeString();
    const level = entry.level || "info";
    const step = entry.step || "log";
    let details = "";
    if (entry.details) {
      try {
        details = " " + JSON.stringify(entry.details);
      } catch (e) {
        details = "";
      }
    }
    return `[${time}] [${level}] [${step}] ${entry.message || ""}${details}`;
  }
  function renderDailyHackDiagnostics() {
    if (!dailyHackLogEl) return;
    Cor3CenterStore.get(["dailyHackDiagnostics", "dailyHackLog"], (data) => {
      const entries = Array.isArray(data.dailyHackDiagnostics) ? data.dailyHackDiagnostics : [];
      if (entries.length === 0) {
        dailyHackLogEl.style.display = "none";
        dailyHackLogEl.textContent = "";
        if (dailyHackDiagDetails) dailyHackDiagDetails.style.display = "none";
        if (dailyHackDiagActions) dailyHackDiagActions.style.display = "none";
        return;
      }
      dailyHackLogEl.textContent = entries.slice(-100).map(formatDailyHackDiagEntry).join("\n");
      dailyHackLogEl.style.display = "";
      if (dailyHackDiagDetails) dailyHackDiagDetails.style.display = "";
      if (dailyHackDiagActions) dailyHackDiagActions.style.display = "flex";
    });
  }
  function initAutoDailyHack() {
    Cor3CenterStore.get("autoDailyHackEnabled", (data) => {
      if(typeof data.autoDailyHackEnabled!=="boolean") {
        autoDailyHackToggle.indeterminate=true;autoDailyHackToggle.disabled=true;
        if(dailyHackStatus)dailyHackStatus.textContent="未读取";
        return;
      }
      autoDailyHackToggle.checked = !!data.autoDailyHackEnabled;
      autoDailyHackToggle.indeterminate=false;
      updateDailyHackStatusLabel(autoDailyHackToggle.checked);
      Cor3CenterStore.get("dailyHackNextCheckAt", (local) => {
        renderDailyHackSchedule(local.dailyHackNextCheckAt);
      });
    });
    renderDailyHackDiagnostics();
    autoDailyHackToggle.addEventListener("change", async () => {
      const enabled = autoDailyHackToggle.checked;
      await Cor3CenterStore.set({ autoDailyHackEnabled: enabled });
      updateDailyHackStatusLabel(enabled);
      if (enabled && dailyHackSchedule) {
        dailyHackSchedule.textContent = t("Checking...", "\u68C0\u67E5\u4E2D...");
        dailyHackSchedule.style.display = "block";
      } else {
        renderDailyHackSchedule(0);
      }
      // The bound game page observes the saved preference.
      setTimeout(renderDailyHackDiagnostics, 500);
    });
    if (copyDailyHackDiagBtn) {
      copyDailyHackDiagBtn.addEventListener("click", async () => {
        if (!dailyHackLogEl) return;
        try {
          await navigator.clipboard.writeText(dailyHackLogEl.textContent || "");
          copyDailyHackDiagBtn.textContent = "\u2705 Copied";
          setTimeout(() => {
            copyDailyHackDiagBtn.textContent = "\u{1F4CB} Copy log";
          }, 1500);
        } catch (e) {
          copyDailyHackDiagBtn.textContent = "\u274C Copy failed";
          setTimeout(() => {
            copyDailyHackDiagBtn.textContent = "\u{1F4CB} Copy log";
          }, 1500);
        }
      });
    }
    if (clearDailyHackDiagBtn) {
      clearDailyHackDiagBtn.addEventListener("click", async () => {
        await Cor3CenterStore.remove(["dailyHackDiagnostics", "dailyHackLog", "dailyHackLogUpdatedAt"]);
        renderDailyHackDiagnostics();
      });
    }
  }
  function initBackgroundToggle() {
    if (!disableBackgroundToggle) return;
    disableBackgroundToggle.addEventListener("change", async () => {
      const isEnabled = disableBackgroundToggle.checked;
      Cor3CenterStore.set({ disableBackground: isEnabled });
      updateBackgroundStatus();
      try {
        const tab = await getCor3Tab();
        if (tab) await Cor3CenterUi.send(tab.id, { action: isEnabled ? "disableBackground" : "enableBackground" });
      } catch (e) {
        cor3LogError("popup.js", e, { action: "toggleBackground" });
      }
    });
  }
  function initNetworkFogToggle() {
    if (!disableNetworkFogToggle) return;
    disableNetworkFogToggle.addEventListener("change", async () => {
      const isEnabled = disableNetworkFogToggle.checked;
      Cor3CenterStore.set({ disableNetworkFog: isEnabled });
      updateNetworkFogStatus();
      try {
        const tab = await getCor3Tab();
        if (tab) await Cor3CenterUi.send(tab.id, { action: isEnabled ? "disableNetworkFog" : "enableNetworkFog" });
      } catch (e) {
        cor3LogError("popup.js", e, { action: "toggleNetworkFog" });
      }
    });
  }
  function initMoveNotificationsToggle() {
    if (!moveNotificationsToggle) return;
    moveNotificationsToggle.addEventListener("change", async () => {
      const isEnabled = moveNotificationsToggle.checked;
      Cor3CenterStore.set({ moveNotificationsLeft: isEnabled });
      updateMoveNotificationsStatus();
      try {
        const tab = await getCor3Tab();
        if (tab) await Cor3CenterUi.send(tab.id, { action: isEnabled ? "moveNotificationsLeft" : "moveNotificationsRight" });
      } catch (e) {
        cor3LogError("popup.js", e, { action: "toggleNotificationPosition" });
      }
    });
  }
  function initAutoUpdateMarketsToggle() {
    if (!autoUpdateMarketsToggle) return;
    autoUpdateMarketsToggle.addEventListener("change", () => {
      const isEnabled = autoUpdateMarketsToggle.checked;
      Cor3CenterStore.set({ autoUpdateMarkets: isEnabled });
      updateAutoUpdateMarketsStatus();
    });
  }
  function autoChatStatusLabel(entry) {
    if (entry.status === "manual") return t("manual", "\u7B49\u5F85\u4EBA\u5DE5");
    if (entry.status === "endpoint-switch") {
      const label = entry.already ? t("endpoint already", "\u5DF2\u5728\u76EE\u6807\u8282\u70B9") : t("endpoint switched", "\u5DF2\u5207\u6362\u8282\u70B9");
      return label + (entry.serverName ? " (" + entry.serverName + ")" : "");
    }
    if (entry.status === "endpoint-failed") {
      return t("endpoint failed", "\u8282\u70B9\u5207\u6362\u5931\u8D25") + (entry.serverName ? " (" + entry.serverName + ")" : "") + (entry.reason ? " \u2014 " + entry.reason : "");
    }
    return t("auto", "\u5DF2\u81EA\u52A8\u56DE\u590D");
  }
  function renderAutoChatLog(logs) {
    if (!autoChatLogEl) return;
    const entries = Array.isArray(logs) ? logs.slice(-50) : [];
    if (entries.length === 0) {
      autoChatLogEl.textContent = t("No auto chat activity yet.", "\u6682\u65E0\u81EA\u52A8\u5BF9\u8BDD\u8BB0\u5F55\u3002");
      return;
    }
    autoChatLogEl.textContent = entries.map((entry) => {
      const time = entry.timestamp ? String(entry.timestamp).slice(11, 19) : "--:--:--";
      const status = autoChatStatusLabel(entry);
      return "[" + time + "] " + (entry.npc || "NPC") + " \xB7 " + status + (entry.summary ? " \u2014 " + entry.summary : "");
    }).join("\n");
  }
  function initAutoChat() {
    if (!autoChatToggle) return;
    Cor3CenterStore.get("autoChatEnabled", (data) => {
      const enabled = !!data.autoChatEnabled;
      autoChatToggle.checked = enabled;
      statusLabel(autoChatStatus, enabled);
    });
    autoChatToggle.addEventListener("change", async () => {
      const enabled = autoChatToggle.checked;
      await Cor3CenterStore.set({ autoChatEnabled: enabled });
      statusLabel(autoChatStatus, enabled);
    });
    Cor3CenterStore.get("autoChatLogs", (data) => renderAutoChatLog(data.autoChatLogs));
  }
  function initAutoCleanupFailedJobsToggle() {
    if (!autoCleanupFailedJobsToggle) return;
    Cor3CenterStore.get("autoCleanupFailedJobsEnabled", (data) => {
      const enabled = !!data.autoCleanupFailedJobsEnabled;
      autoCleanupFailedJobsToggle.checked = enabled;
      statusLabel(autoCleanupFailedJobsStatus, enabled);
    });
    autoCleanupFailedJobsToggle.addEventListener("change", async () => {
      const enabled = autoCleanupFailedJobsToggle.checked;
      await Cor3CenterStore.set({ autoCleanupFailedJobsEnabled: enabled });
      statusLabel(autoCleanupFailedJobsStatus, enabled);
      if (enabled) {
        Cor3CenterUi.command({ action: "runAutoCleanupFailedJobs" }).catch(() => {
        });
      }
    });
  }
  function initSecretFinder() {
    Cor3CenterStore.get("secretFinderEnabled", (data) => {
      secretFinderToggle.checked = !!data.secretFinderEnabled;
      updateSecretFinderStatusLabel(secretFinderToggle.checked);
    });
    Cor3CenterStore.get("secretFinderLog", (data) => {
      if (data.secretFinderLog && secretFinderLogEl && secretFinderToggle.checked) {
        _safeSetHtml(secretFinderLogEl, data.secretFinderLog);
        secretFinderLogEl.style.display = "";
      }
    });
    secretFinderToggle.addEventListener("change", async () => {
      const enabled = secretFinderToggle.checked;
      await Cor3CenterStore.set({ secretFinderEnabled: enabled });
      updateSecretFinderStatusLabel(enabled);
      if (enabled) {
        if (secretFinderLogEl) {
          secretFinderLogEl.replaceChildren(_h("span", { style: "color:var(--accent-cyan);" }, "Starting search..."));
          secretFinderLogEl.style.display = "";
        }
        try {
          const tab = await getCor3Tab();
          if (tab) {
            await Cor3CenterUi.send(tab.id, { action: "startIpSearch" });
          } else {
            if (secretFinderLogEl) secretFinderLogEl.replaceChildren(_h("span", { style: "color:var(--accent-red);" }, "No cor3.gg tab found"));
            secretFinderToggle.checked = false;
            await Cor3CenterStore.set({ secretFinderEnabled: false });
            updateSecretFinderStatusLabel(false);
          }
        } catch (e) {
          if (secretFinderLogEl) secretFinderLogEl.replaceChildren(_h("span", { style: "color:var(--accent-red);" }, "Error: " + e.message));
          secretFinderToggle.checked = false;
          await Cor3CenterStore.set({ secretFinderEnabled: false });
          updateSecretFinderStatusLabel(false);
        }
      }
    });
  }
  function initTogglesShowMore() {
    if (togglesShowMoreBtn && togglesBody) {
      const update = () => {
        togglesShowMoreBtn.textContent = togglesBody.style.display === "none" ? "Show toggles \u25BE" : "Hide toggles \u25B4";
      };
      togglesShowMoreBtn.addEventListener("click", () => {
        togglesBody.style.display = togglesBody.style.display === "none" ? "" : "none";
        update();
      });
      update();
    }
  }
  function initSettingsLoad() {
    Cor3CenterStore.get(["disableBackground", "disableNetworkFog", "moveNotificationsLeft", "autoUpdateMarkets"], (result) => {
      if (disableBackgroundToggle) {
        disableBackgroundToggle.checked = result.disableBackground || false;
        updateBackgroundStatus();
      }
      if (disableNetworkFogToggle) {
        disableNetworkFogToggle.checked = result.disableNetworkFog || false;
        updateNetworkFogStatus();
      }
      if (moveNotificationsToggle) {
        moveNotificationsToggle.checked = result.moveNotificationsLeft || false;
        updateMoveNotificationsStatus();
      }
      if (autoUpdateMarketsToggle) {
        if(typeof result.autoUpdateMarkets==='boolean') {
          autoUpdateMarketsToggle.checked=result.autoUpdateMarkets;
          autoUpdateMarketsToggle.indeterminate=false;
          updateAutoUpdateMarketsStatus();
        } else {
          autoUpdateMarketsToggle.indeterminate=true;autoUpdateMarketsToggle.disabled=true;
          if(autoUpdateMarketsStatus)autoUpdateMarketsStatus.textContent='未读取';
        }
      }
    });
  }
  function initToggleStorageListeners() {
    let dailyRevision = 0;
    Cor3CenterStore.onChanged.addListener((changes, area) => {
      if (area === "local" && (changes.dailyHackDiagnostics || changes.dailyHackLog)) {
        renderDailyHackDiagnostics();
      }
      if (area === "local" && changes.autoDailyHackEnabled) {
        const revision = ++dailyRevision;
        Cor3CenterStore.get(["autoDailyHackEnabled", "dailyHackNextCheckAt"], data => {
          if (revision !== dailyRevision) return;
          if (typeof data.autoDailyHackEnabled !== "boolean") {
            showCenterPreferenceUnknown(autoDailyHackToggle, dailyHackStatus);
            renderDailyHackSchedule(0);
            return;
          }
          autoDailyHackToggle.checked = data.autoDailyHackEnabled;
          autoDailyHackToggle.indeterminate = false;
          updateDailyHackStatusLabel(data.autoDailyHackEnabled);
          renderDailyHackSchedule(data.dailyHackNextCheckAt);
        });
      }
      if (area === "local" && changes.dailyHackNextCheckAt) {
        renderDailyHackSchedule(changes.dailyHackNextCheckAt.newValue);
      }

      if (area === "local" && changes.iceWallSolverStatus) {
        renderSolverStatus(iceWallSolverStatusLine, changes.iceWallSolverStatus.newValue);
      }

      if (area === "local" && changes.simpleDecryptSolverStatus) {
        renderSolverStatus(simpleDecryptSolverStatusLine, changes.simpleDecryptSolverStatus.newValue);
      }
      if (area === "local" && changes.secretFinderLog) {
        const msg = changes.secretFinderLog.newValue;
        if (msg && secretFinderLogEl) {
          _safeSetHtml(secretFinderLogEl, msg);
          secretFinderLogEl.style.display = "";
        }
      }
      if (area === "local" && changes.secretFinderEnabled) {
        secretFinderToggle.checked = !!changes.secretFinderEnabled.newValue;
        updateSecretFinderStatusLabel(secretFinderToggle.checked);
      }
      if (area === "local" && changes.autoChatEnabled && autoChatToggle) {
        autoChatToggle.checked = !!changes.autoChatEnabled.newValue;
        statusLabel(autoChatStatus, autoChatToggle.checked);
      }
      if (area === "local" && changes.autoCleanupFailedJobsEnabled && autoCleanupFailedJobsToggle) {
        autoCleanupFailedJobsToggle.checked = !!changes.autoCleanupFailedJobsEnabled.newValue;
        statusLabel(autoCleanupFailedJobsStatus, autoCleanupFailedJobsToggle.checked);
      }
      if (area === "local" && changes.autoChatLogs) {
        renderAutoChatLog(changes.autoChatLogs.newValue);
      }
    });
  }
  initAutoDecrypt();
  initAutoIceWall();
  initAutoSimpleDecrypt();
  initAutoDailyHack();
  initSettingsLoad();
  initBackgroundToggle();
  initNetworkFogToggle();
  initMoveNotificationsToggle();
  initAutoUpdateMarketsToggle();
  initSecretFinder();
  initAutoChat();
  initAutoCleanupFailedJobsToggle();
  initTogglesShowMore();
  initToggleStorageListeners();

  // src/popup/info-panels.js
  var marketsPanelToggle = document.getElementById("marketsPanelToggle");
  var marketsPanelStatus = document.getElementById("marketsPanelStatus");
  var marketsPanelSection = document.getElementById("marketsPanelSection");
  function applyPanelVisibility(toggleEl, statusEl2, section, key) {
    const enabled = toggleEl.checked;
    if (statusEl2) {
      statusEl2.textContent = enabled ? "On" : "Off";
      statusEl2.style.color = enabled ? "var(--accent-green)" : "var(--text-dim)";
    }
    if (section) {
      section.style.display = enabled ? "" : "none";
      const card = section.closest(".popout-card");
      if (card) card.style.display = enabled ? "" : "none";
    }
    Cor3CenterStore.set({ [key]: enabled });
  }
  Cor3CenterStore.get("marketsPanelEnabled", (data) => {
    if (marketsPanelToggle) marketsPanelToggle.checked = data.marketsPanelEnabled !== false;
    if (marketsPanelToggle && marketsPanelStatus && marketsPanelSection) {
      applyPanelVisibility(marketsPanelToggle, marketsPanelStatus, marketsPanelSection, "marketsPanelEnabled");
    }
  });
  if (marketsPanelToggle && marketsPanelStatus && marketsPanelSection) {
    marketsPanelToggle.addEventListener("change", () => applyPanelVisibility(marketsPanelToggle, marketsPanelStatus, marketsPanelSection, "marketsPanelEnabled"));
  }

  // src/popup/inventory.js
  var inventoryContainer = document.getElementById("inventoryContainer");
  var inventorySectionToggle = document.getElementById("inventorySectionToggle");
  var inventorySectionBody = document.getElementById("inventorySectionBody");
  var spaceInfo = document.getElementById("spaceInfo");
  var refreshInventoryBtn = document.getElementById("refreshInventoryBtn");
  var specialistTimerInfo = document.getElementById("specialistTimerInfo");
  inventorySectionToggle.addEventListener("click", () => {
    inventorySectionToggle.classList.toggle("open");
    inventorySectionBody.classList.toggle("open");
  });
  refreshInventoryBtn.addEventListener("click", () => requestAndLoadInventory());
  async function requestAndLoadInventory() {
    inventoryContainer.replaceChildren(_noData("Requesting inventory from server..."));
    spaceInfo.textContent = "-- / --";
    try {
      const tab = await getCor3Tab();
      if (tab) {
        await Cor3CenterUi.send(tab.id, { action: "requestStash" });
        await Cor3CenterUi.send(tab.id, { action: "requestSpecialists" });
      }
    } catch (e) {
    }
    setTimeout(() => {
      observeCenterRead(loadInventory());
      observeCenterRead(loadSpecialistTimers());
      refreshAllTimestamps();
    }, 2500);
  }
  async function loadInventory() {
    const { stashData } = await Cor3CenterStore.get("stashData");
    renderInventory(stashData);
  }
  async function loadSpecialistTimers() {
    try {
      const { specialistsData } = await Cor3CenterStore.get("specialistsData");
      renderSpecialistTimers(specialistsData);
    } catch (e) {
      specialistTimerInfo.style.display = "none";
    }
  }
  async function renderSpecialistTimers(data) {
    if (state._specialistTimerInterval) {
      clearInterval(state._specialistTimerInterval);
      state._specialistTimerInterval = null;
    }
    specialistTimerInfo.style.display = "none";
    _clearEl(specialistTimerInfo);
    if (!data || !data.specialists || !Array.isArray(data.specialists)) return;
    let activeTemp = null;
    let activeSpecialist = null;
    for (const specialist of data.specialists) {
      if (!specialist.temporary || !Array.isArray(specialist.temporary)) continue;
      for (const temp of specialist.temporary) {
        if (temp.owned && temp.expiresAt) {
          activeTemp = temp;
          activeSpecialist = specialist;
          break;
        }
      }
      if (activeTemp) break;
    }
    if (!activeTemp || !activeTemp.expiresAt) return;
    const expiresAt = new Date(activeTemp.expiresAt).getTime();
    const gracePeriodEndAt = activeTemp.gracePeriodEndAt ? new Date(activeTemp.gracePeriodEndAt).getTime() : null;
    const bonusSlots = activeTemp.bonusSlots || "?";
    const isInGrace = activeTemp.status === "IN_GRACE";
    let extendPriceId = null;
    let extendCredits = null;
    if (activeTemp.prices && activeTemp.prices.length > 0) {
      var creditsOnly = activeTemp.prices.find(function(p) {
        return !p.items || p.items.length === 0;
      });
      var priceEntry = creditsOnly || activeTemp.prices[0];
      extendPriceId = priceEntry.id;
      extendCredits = priceEntry.credits;
    }
    var itemsToLose = 0;
    if (isInGrace) {
      try {
        var result = await Cor3CenterStore.get("stashData");
        var stash = result.stashData;
        if (stash) {
          var capacity = stash.maxCapacity || 0;
          var used = stash.currentUsage || (stash.items ? stash.items.length : 0);
          var overflow = used - capacity;
          if (overflow > 0) itemsToLose = overflow;
        }
      } catch (e) {
      }
    }
    function formatCountdown(ms) {
      if (ms <= 0) return "EXPIRED";
      var d = Math.floor(ms / 864e5);
      var h = Math.floor(ms % 864e5 / 36e5);
      var m = Math.floor(ms % 36e5 / 6e4);
      var s = Math.floor(ms % 6e4 / 1e3);
      var parts = [];
      if (d > 0) parts.push(d + "d");
      parts.push(h + "h");
      parts.push(m + "m");
      parts.push(s + "s");
      return parts.join(" ");
    }
    function updateTimers() {
      var now = Date.now();
      var expiryRemaining = expiresAt - now;
      var graceRemaining = gracePeriodEndAt ? gracePeriodEndAt - now : null;
      var detailsEl = _h(
        "div",
        { className: "item-details" },
        _h("div", { className: "item-name", style: "margin-bottom: 6px;" }, "Stash Expansion Service"),
        _h("div", { className: "item-badges" }, _h("span", { className: "rented-tag" + (isInGrace ? " grace" : "") }, "Rented: " + bonusSlots))
      );
      if (isInGrace) {
        var graceBox = _h(
          "div",
          { className: "stash-grace-box" },
          _h("div", { className: "stash-grace-header" }, "THE RENT HAS ENDED"),
          _h(
            "div",
            { className: "stash-grace-body" },
            _h("div", { className: "stash-grace-row" }, _h("span", null, "Items to lose"), _h("span", { className: "grace-value" }, String(itemsToLose))),
            _h("div", { className: "stash-grace-row" }, _h("span", null, "Expired slots"), _h("span", { className: "grace-value" }, String(bonusSlots))),
            _h("div", { className: "stash-grace-row" }, _h("span", null, "Left time"), _h("span", { className: "grace-value" }, formatCountdown(graceRemaining || 0)))
          )
        );
        detailsEl.appendChild(graceBox);
        if (extendPriceId) {
          detailsEl.appendChild(_h(
            "div",
            { style: "display:flex;justify-content:flex-end;margin-top:4px;" },
            _h("button", { className: "stash-extend-btn", id: "stashExtendBtn" }, "Extend (\u{1F4B0}" + (extendCredits || "?").toLocaleString() + ")")
          ));
        }
      } else {
        detailsEl.appendChild(_h("div", { className: "specialist-timer-row" }, "Expires in: ", _h("span", { className: "specialist-timer" }, formatCountdown(expiryRemaining))));
        if (graceRemaining !== null) {
          detailsEl.appendChild(_h("div", { className: "specialist-timer-row" }, "Grace period ends: ", _h("span", { className: "specialist-grace" }, formatCountdown(graceRemaining))));
        }
      }
      specialistTimerInfo.replaceChildren(_h(
        "div",
        { className: "item-card tier-quest" },
        _h("img", { src: "https://cdn.cor3.gg/corie/characters/avatars/veran_avatar.png", alt: "Specialist", loading: "lazy" }),
        detailsEl
      ));
      specialistTimerInfo.style.display = "";
      var extBtn = document.getElementById("stashExtendBtn");
      if (extBtn && extendPriceId) {
        extBtn.addEventListener("click", function() {
          extBtn.disabled = true;
          extBtn.textContent = "Extending...";
          getCor3Tab().then(function(tab) {
            if (!tab) {
              extBtn.disabled = false;
              extBtn.textContent = "Extend (\u{1F4B0}" + (extendCredits || "?").toLocaleString() + ")";
              return;
            }
            Cor3CenterUi.send(tab.id, {
              action: "purchaseSpecialist",
              specialistType: activeSpecialist.specialistType || "ENGINEER",
              kind: activeTemp.kind || "TEMPORARY",
              level: activeTemp.level,
              priceId: extendPriceId
            }).then(function() {
              extBtn.textContent = "Sent! Refreshing...";
              setTimeout(function() {
                Cor3CenterUi.send(tab.id, { action: "requestSpecialists" });
              }, 2e3);
              setTimeout(function() {
                observeCenterRead(loadSpecialistTimers());
              }, 4e3);
            }).catch(function() {
              extBtn.disabled = false;
              extBtn.textContent = "Extend (\u{1F4B0}" + (extendCredits || "?").toLocaleString() + ")";
            });
          });
        });
      }
      if (expiryRemaining <= 0 && (graceRemaining === null || graceRemaining <= 0)) {
        if (state._specialistTimerInterval) {
          clearInterval(state._specialistTimerInterval);
          state._specialistTimerInterval = null;
        }
      }
    }
    updateTimers();
    state._specialistTimerInterval = setInterval(updateTimers, 1e3);
  }
  function renderInventory(data) {
    _clearEl(inventoryContainer);
    if (!data || !data.items || data.items.length === 0) {
      inventoryContainer.replaceChildren(_noData("No items found.", "Make sure you have the cor3.gg tab open."));
      spaceInfo.textContent = "-- / --";
      return;
    }
    const used = data.currentUsage || data.items.length;
    const max = data.maxCapacity || "?";
    spaceInfo.textContent = `${used} / ${max}`;
    const groups = /* @__PURE__ */ new Map();
    for (const item of data.items) {
      const key = item.itemConfigId || (item.name || "") + "|" + (item.tier || "") + "|" + (item.canCraft ? "1" : "0");
      let g = groups.get(key);
      if (!g) {
        g = { first: item, count: 0, totalQty: 0, totalValue: 0 };
        groups.set(key, g);
      }
      g.count++;
      g.totalQty += item.quantity || 1;
      if (item.canSell && item.sellPrice) g.totalValue += item.sellPrice * (item.quantity || 1);
    }
    let totalSellValue = 0;
    for (const g of groups.values()) totalSellValue += g.totalValue;
    const totalValueEl = document.getElementById("totalValue");
    if (totalValueEl) totalValueEl.textContent = totalSellValue > 0 ? `(\u{1F4B0} ${totalSellValue.toLocaleString()})` : "";
    const RARITY_ORDER = { quest: 0, legendary: 1, epic: 2, superrare: 3, rare: 4, common: 5 };
    const sortedGroups = [...groups.values()].sort((a, b) => {
      const ia = a.first, ib = b.first;
      const ra = RARITY_ORDER[(ia.tier || "common").toLowerCase()] ?? 6;
      const rb = RARITY_ORDER[(ib.tier || "common").toLowerCase()] ?? 6;
      if (ra !== rb) return ra - rb;
      const na = String(ia.name || ia.shortName || "");
      const nb = String(ib.name || ib.shortName || "");
      const byName = na.localeCompare(nb, void 0, { sensitivity: "base" });
      if (byName !== 0) return byName;
      const pa = ia.canSell && ia.sellPrice ? ia.sellPrice : 0;
      const pb = ib.canSell && ib.sellPrice ? ib.sellPrice : 0;
      return pb - pa;
    });
    var invItemMap = [];
    for (const g of sortedGroups) {
      const item = g.first;
      const card = document.createElement("div");
      const tierClass = "tier-" + (item.tier || "common").toLowerCase();
      card.className = "item-card " + tierClass;
      const tierTagClass = "tier-tag tier-tag-" + (item.tier || "common").toLowerCase();
      const badgesEl = _h("div", { className: "item-badges" }, _h("span", { className: tierTagClass }, item.tier || "COMMON"));
      if (item.canCraft) badgesEl.appendChild(_h("span", { className: "badge badge-craft" }, "CRAFT"));
      if (item.canUse) badgesEl.appendChild(_h("span", { className: "badge badge-use" }, "USE"));
      if (g.totalQty > 1) badgesEl.appendChild(_h("span", { className: "badge badge-qty" }, "x" + g.totalQty));
      const invIdx = invItemMap.length;
      invItemMap.push(item);
      const infoBtn = _h("button", { className: "market-item-info-btn inv-info-btn", dataset: { invIdx: String(invIdx) }, style: "width: 10%;padding-left: 4px;" });
      _safeSetHtml(infoBtn, '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><g clip-path="url(#mi2)"><path d="M3.759 1.2H12.243c.703 0 1.3.246 1.81.75.502.503.748 1.095.748 1.797v8.495c0 .71-.246 1.305-.748 1.807-.51.505-1.107.751-1.81.751H3.76c-.71 0-1.306-.246-1.809-.749-.502-.502-.749-1.097-.749-1.808V3.747c0-.703.246-1.295.75-1.798.502-.503 1.098-.75 1.808-.75z" stroke="currentColor" stroke-width="0.8"></path><path d="M6.994 3.837h2.002v1.992H6.994V3.837zM6.994 7.124h2.002v5.049H6.994V7.124z" fill="currentColor"></path></g><defs><clipPath id="mi2"><rect width="16" height="16" fill="currentColor"></rect></clipPath></defs></svg>');
      const detailsEl = _h(
        "div",
        { className: "item-details" },
        _h(
          "div",
          { style: "display: flex; justify-content: space-between; align-items: center;" },
          _h("div", { className: "item-name" }, item.name),
          infoBtn
        ),
        badgesEl
      );
      if (item.canSell && item.sellPrice) {
        detailsEl.appendChild(_h(
          "div",
          { className: "item-action-row" },
          _h("div", { className: "item-price" }, "\u{1F4B0} " + item.sellPrice.toLocaleString()),
          _h("button", { className: "sell-btn", dataset: { itemId: item.id, itemName: item.name }, title: "Sell 1x " + item.name }, "\u{1F4B0} Sell")
        ));
      }
      if (item.imageUrl) card.appendChild(_h("img", { src: item.imageUrl, alt: item.name, loading: "lazy" }));
      card.appendChild(detailsEl);
      inventoryContainer.appendChild(card);
    }
    inventoryContainer.querySelectorAll(".sell-btn").forEach((btn) => {
      let confirmTimeout = null;
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const itemId = btn.dataset.itemId;
        if (!btn.classList.contains("sell-confirm")) {
          btn.classList.add("sell-confirm");
          btn.textContent = "\u2713 Confirm";
          confirmTimeout = setTimeout(() => {
            btn.classList.remove("sell-confirm");
            btn.textContent = "\u{1F4B0} Sell";
          }, 3e3);
          return;
        }
        if (confirmTimeout) clearTimeout(confirmTimeout);
        btn.classList.remove("sell-confirm");
        btn.disabled = true;
        btn.textContent = "\u23F3";
        try {
          const tab = await getCor3Tab();
          if (tab) await Cor3CenterUi.send(tab.id, { action: "sellItem", itemId, quantity: 1 });
        } catch (err) {
          cor3LogError("popup.js", err, { action: "sellItem" });
        }
      });
    });
    inventoryContainer.querySelectorAll(".inv-info-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.invIdx, 10);
        if (!isNaN(idx) && invItemMap[idx]) showInventoryInfoPopup(invItemMap[idx]);
      });
    });
  }
  function showInventoryInfoPopup(item) {
    const popup = document.getElementById("inventoryInfoPopup");
    const overlay = document.getElementById("inventoryInfoOverlay");
    if (!popup || !overlay) return;
    const INFO_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color:currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 17V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="8" r="0.75" fill="currentColor"/></svg>';
    let h = '<div class="info-title">' + INFO_SVG + " " + (item.name || "Unknown").toUpperCase() + "</div>";
    h += '<div class="info-desc">';
    if (item.imageUrl) h += '<img src="' + item.imageUrl + '" alt="">';
    h += "<span>" + (item.description || "No description available.") + "</span>";
    h += "</div>";
    const tags = item.tags || [];
    if (tags.length > 0) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;border-top:1px solid rgba(96,108,124,0.5);padding-top:8px;">';
      for (const tag of tags) {
        h += '<span style="font-size:9px;padding:2px 8px;border-radius:10px;background:rgba(118,193,209,0.15);color:rgba(118,193,209,1);border:1px solid rgba(118,193,209,0.3);">' + tag + "</span>";
      }
      h += "</div>";
    }
    h += '<div class="info-specs">';
    if (item.tier) h += '<div class="info-spec-item"><div class="info-spec-label">Rarity</div><div class="info-spec-val">' + item.tier + "</div></div>";
    if (item.sellPrice) h += '<div class="info-spec-item"><div class="info-spec-label">Sell Price</div><div class="info-spec-val">' + item.sellPrice.toLocaleString() + "</div></div>";
    if (item.canCraft) h += '<div class="info-spec-item"><div class="info-spec-label">Craftable</div><div class="info-spec-val">Yes</div></div>';
    if (item.canUse) h += '<div class="info-spec-item"><div class="info-spec-label">Usable</div><div class="info-spec-val">Yes</div></div>';
    h += "</div>";
    _safeSetHtml(popup, h);
    popup.classList.add("open");
    overlay.classList.add("open");
    const close = () => {
      popup.classList.remove("open");
      overlay.classList.remove("open");
      overlay.removeEventListener("click", close);
    };
    overlay.addEventListener("click", close);
  }
  function initInventoryStorageListener() {
    Cor3CenterStore.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.stashData) {
        observeCenterRead(loadInventory());
        observeCenterRead(loadSpecialistTimers());
        refreshAllTimestamps();
      }
      if (changes.specialistsData) {
        observeCenterRead(loadSpecialistTimers());
      }
    });
  }
  observeCenterRead(loadInventory());
  observeCenterRead(loadSpecialistTimers());
  initInventoryStorageListener();

  // src/popup/inventory-batch.js
  var invBatchRarity = document.getElementById("invBatchRarity");
  var invBatchTag = document.getElementById("invBatchTag");
  var invBatchCount = document.getElementById("invBatchCount");
  var invBatchSellBtn = document.getElementById("invBatchSellBtn");
  var _stashData = null;
  var _invBatchSelling = false;
  var _invBatchTimer = null;
  var _invBatchConfirmTimer = null;
  function inventoryBatchMatches() {
    if (!_stashData || !Array.isArray(_stashData.items)) return [];
    const rarity = invBatchRarity ? invBatchRarity.value : "COMMON";
    const tag = invBatchTag ? invBatchTag.value : "NONE";
    const wantCraft = tag === "CRAFT";
    return _stashData.items.filter(
      (it) => it.canSell && it.sellPrice && it.sellPrice > 0 && (it.tier || "").toUpperCase() === rarity && !!it.canCraft === wantCraft
    );
  }
  function updateInventoryBatchSell() {
    if (!invBatchCount || !invBatchSellBtn) return;
    const matches = inventoryBatchMatches();
    const count = matches.length;
    invBatchCount.textContent = count === 0 ? "no matches" : count + " item(s) \xB7 \u{1F4B0} " + matches.reduce((s, i) => s + i.sellPrice * (i.quantity || 1), 0).toLocaleString();
    if (!_invBatchSelling) {
      invBatchSellBtn.disabled = count === 0;
      invBatchSellBtn.style.opacity = count === 0 ? "0.4" : "";
      invBatchSellBtn.textContent = "Sell";
      invBatchSellBtn.style.borderColor = "var(--accent-green)";
      invBatchSellBtn.style.color = "var(--accent-green)";
      invBatchSellBtn.classList.remove("inv-sell-confirm");
    }
  }
  function finishInventoryBatch() {
    if (!_invBatchSelling) return;
    _invBatchSelling = false;
    if (_invBatchTimer) {
      clearTimeout(_invBatchTimer);
      _invBatchTimer = null;
    }
    updateInventoryBatchSell();
  }
  async function loadBatchStash() {
    const { stashData } = await Cor3CenterStore.get("stashData");
    _stashData = stashData || null;
    updateInventoryBatchSell();
  }
  if (invBatchRarity) invBatchRarity.addEventListener("change", updateInventoryBatchSell);
  if (invBatchTag) invBatchTag.addEventListener("change", updateInventoryBatchSell);
  if (invBatchSellBtn) {
    invBatchSellBtn.addEventListener("click", async () => {
      const matches = inventoryBatchMatches();
      if (matches.length === 0 || _invBatchSelling) return;
      if (!invBatchSellBtn.classList.contains("inv-sell-confirm")) {
        invBatchSellBtn.classList.add("inv-sell-confirm");
        invBatchSellBtn.textContent = "Confirm sell " + matches.length + "?";
        invBatchSellBtn.style.borderColor = "var(--accent-orange)";
        invBatchSellBtn.style.color = "var(--accent-orange)";
        if (_invBatchConfirmTimer) clearTimeout(_invBatchConfirmTimer);
        _invBatchConfirmTimer = setTimeout(() => updateInventoryBatchSell(), 4e3);
        return;
      }
      if (_invBatchConfirmTimer) clearTimeout(_invBatchConfirmTimer);
      _invBatchSelling = true;
      invBatchSellBtn.classList.remove("inv-sell-confirm");
      invBatchSellBtn.disabled = true;
      invBatchSellBtn.textContent = "Selling " + matches.length + "\u2026";
      invBatchSellBtn.style.opacity = "";
      _invBatchTimer = setTimeout(finishInventoryBatch, 6e4);
      try {
        const tab = await getCor3Tab();
        if (!tab) {
          finishInventoryBatch();
          return;
        }
        try {
          await Cor3CenterUi.send(tab.id, { action: "requestStash" });
        } catch (e) {
        }
        await new Promise((r) => setTimeout(r, 2e3));
        await Cor3CenterUi.send(tab.id, {
          action: "batchSellItems",
          items: matches.map((m) => ({ itemId: m.id, quantity: m.quantity || 1 }))
        });
        await Cor3CenterUi.send(tab.id, { action: "requestStash" });
        setTimeout(finishInventoryBatch, 1200);
      } catch (err) {
        console.log("[COR3 Helper] Batch sell error:", err);
        finishInventoryBatch();
      }
    });
  }
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.stashData) {
      _stashData = changes.stashData.newValue || null;
      updateInventoryBatchSell();
    }
  });
  observeCenterRead(loadBatchStash());

  // src/popup/inventory-sort.js
  var smartBtn = document.getElementById("invSortSmartBtn");
  var compactBtn = document.getElementById("invSortCompactBtn");
  var statusEl = document.getElementById("invSortStatus");
  var hintEl = document.getElementById("invSortHint");
  var noticeEl = document.getElementById("invSortNotice");
  var _sorting = false;
  var _confirmMode = null;
  var _confirmTimer = null;
  var LABELS = {
    smart: "Smart Sort",
    compact: "Compact Sort"
  };
  function setButtonsEnabled(enabled) {
    [smartBtn, compactBtn].forEach((btn) => {
      if (!btn) return;
      btn.disabled = !enabled;
      btn.style.opacity = enabled ? "" : "0.45";
    });
  }
  function resetConfirm() {
    if (_confirmTimer) {
      clearTimeout(_confirmTimer);
      _confirmTimer = null;
    }
    _confirmMode = null;
    [smartBtn, compactBtn].forEach((btn) => {
      if (!btn) return;
      btn.classList.remove("inv-sort-confirm");
      const mode = btn === smartBtn ? "smart" : "compact";
      btn.textContent = LABELS[mode];
    });
  }
  function showNotice(text) {
    if (!noticeEl) return;
    if (text) {
      noticeEl.textContent = text;
      noticeEl.style.display = "";
    } else {
      noticeEl.textContent = "";
      noticeEl.style.display = "none";
    }
  }
  function render(progress, sorting, notice) {
    _sorting = !!sorting;
    setButtonsEnabled(!_sorting);
    if (hintEl) hintEl.style.display = _sorting ? "" : "none";
    if (statusEl) {
      if (progress && progress.text) {
        statusEl.textContent = progress.text;
        statusEl.style.display = "";
        statusEl.style.color = progress.error ? "var(--accent-red)" : progress.phase === "done" ? "var(--accent-green)" : "var(--accent-cyan)";
      } else if (_sorting) {
        statusEl.textContent = "Sorting\u2026";
        statusEl.style.display = "";
        statusEl.style.color = "var(--accent-cyan)";
      } else {
        statusEl.textContent = "";
        statusEl.style.display = "none";
      }
    }
    showNotice(notice || null);
    if (!_sorting) resetConfirm();
  }
  async function startSort(mode) {
    if (_sorting) return;
    const btn = mode === "smart" ? smartBtn : compactBtn;
    if (!btn) return;
    if (_confirmMode !== mode) {
      resetConfirm();
      _confirmMode = mode;
      btn.classList.add("inv-sort-confirm");
      btn.textContent = "Confirm?";
      _confirmTimer = setTimeout(resetConfirm, 4e3);
      return;
    }
    resetConfirm();
    _sorting = true;
    setButtonsEnabled(false);
    showNotice(null);
    if (statusEl) {
      statusEl.textContent = "Starting sort\u2026";
      statusEl.style.display = "";
      statusEl.style.color = "var(--accent-cyan)";
    }
    if (hintEl) hintEl.style.display = "";
    try {
      const tab = await getCor3Tab();
      if (!tab) throw new Error("No cor3.gg tab found.");
      const res = await Cor3CenterUi.send(tab.id, { action: "sortStash", mode });
      if (!res || res.ok === false) {
        _sorting = false;
        setButtonsEnabled(true);
        if (statusEl) {
          statusEl.textContent = res && (res.reason || res.error) || "Sort failed (no response from the page).";
          statusEl.style.color = "var(--accent-red)";
          statusEl.style.display = "";
        }
        if (hintEl) hintEl.style.display = "none";
        if (res && res.notice) showNotice(res.notice);
      } else if (res.notice) {
        showNotice(res.notice);
      }
    } catch (err) {
      _sorting = false;
      setButtonsEnabled(true);
      if (statusEl) {
        statusEl.textContent = "Sort failed: " + (err && err.message ? err.message : String(err));
        statusEl.style.color = "var(--accent-red)";
        statusEl.style.display = "";
      }
      if (hintEl) hintEl.style.display = "none";
    }
  }
  if (smartBtn) {
    smartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startSort("smart");
    });
  }
  if (compactBtn) {
    compactBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startSort("compact");
    });
  }
  function loadState() {
    Cor3CenterStore.get(["stashSortProgress", "stashSorting", "stashSortNotice"], (data) => {
      render(data.stashSortProgress || null, !!data.stashSorting, data.stashSortNotice || null);
    });
  }
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.stashSortProgress || changes.stashSorting || changes.stashSortNotice) {
      Cor3CenterStore.get(["stashSortProgress", "stashSorting", "stashSortNotice"], (data) => {
        render(data.stashSortProgress || null, !!data.stashSorting, data.stashSortNotice || null);
      });
    }
  });
  loadState();

  // src/popup/loadout.js
  var loadoutError = document.getElementById("loadoutError");
  var loadoutHwContainer = document.getElementById("loadoutHwContainer");
  var loadoutOverviewContainer = document.getElementById("loadoutOverviewContainer");
  var loadoutSwContainer = document.getElementById("loadoutSwContainer");
  var loadoutSwCount = document.getElementById("loadoutSwCount");
  var refreshLoadoutBtn = document.getElementById("refreshLoadoutBtn");
  var loadoutHwToggle = document.getElementById("loadoutHwToggle");
  var loadoutHwBody = document.getElementById("loadoutHwBody");
  var loadoutOverviewToggle = document.getElementById("loadoutOverviewToggle");
  var loadoutOverviewBody = document.getElementById("loadoutOverviewBody");
  var loadoutSwToggle = document.getElementById("loadoutSwToggle");
  var loadoutSwBody = document.getElementById("loadoutSwBody");
  var loadoutSwSort = document.getElementById("loadoutSwSort");
  var loadoutSwSearch = document.getElementById("loadoutSwSearch");
  var cachedLoadoutData = null;
  loadoutHwToggle.addEventListener("click", () => {
    loadoutHwToggle.classList.toggle("open");
    loadoutHwBody.classList.toggle("open");
  });
  loadoutOverviewToggle.addEventListener("click", () => {
    loadoutOverviewToggle.classList.toggle("open");
    loadoutOverviewBody.classList.toggle("open");
  });
  loadoutSwToggle.addEventListener("click", () => {
    loadoutSwToggle.classList.toggle("open");
    loadoutSwBody.classList.toggle("open");
  });
  var LOADOUT_SPEC_MAP = {
    cpuFrequency: "CPU Frequency",
    cpuCores: "CPU Cores",
    cpuConsuming: "Power Consuming",
    gpuPower: "GPU Power",
    gpuMemory: "GPU Memory",
    gpuConsuming: "Power Consuming",
    ramFrequency: "RAM Frequency",
    ramMemory: "RAM Memory",
    psuPower: "PSU Power",
    psuProtection: "PSU Protection",
    cpu_frequency: "CPU Frequency",
    cpu_cores: "CPU Cores",
    gpu_power: "GPU Power",
    gpu_memory: "GPU Memory",
    ram_frequency: "RAM Frequency",
    ram_memory: "RAM Memory",
    psu_power: "PSU Power",
    psu_total: "PSU Total"
  };
  var LOADOUT_UNIT_MAP = {
    cpu_frequency: "GHz",
    cpuFrequency: "GHz",
    cpu_cores: "Count",
    cpuCores: "Count",
    gpu_power: "PFLOPS",
    gpuPower: "PFLOPS",
    gpu_memory: "TB",
    gpuMemory: "TB",
    ram_frequency: "GHz",
    ramFrequency: "GHz",
    ram_memory: "TB",
    ramMemory: "TB",
    psu_power: "kW",
    psuPower: "kW",
    psu_total: "kW",
    cpuConsuming: "kW",
    gpuConsuming: "kW"
  };
  function loadoutSpecLabel(key) {
    return LOADOUT_SPEC_MAP[key] || key;
  }
  function loadoutUnitLabel(key) {
    return LOADOUT_UNIT_MAP[key] || "";
  }
  var LOADOUT_INFO_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color:currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 17V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="8" r="0.75" fill="currentColor"/></svg>';
  var LOADOUT_INFO_SQUARE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><g clip-path="url(#li)"><path d="M3.759 1.2H12.243c.703 0 1.3.246 1.81.75.502.503.748 1.095.748 1.797v8.495c0 .71-.246 1.305-.748 1.807-.51.505-1.107.751-1.81.751H3.76c-.71 0-1.306-.246-1.809-.749-.502-.502-.749-1.097-.749-1.808V3.747c0-.703.246-1.295.75-1.798.502-.503 1.098-.75 1.808-.75z" stroke="currentColor" stroke-width="0.8"/><path d="M6.994 3.837h2.002v1.992H6.994V3.837zM6.994 7.124h2.002v5.049H6.994V7.124z" fill="currentColor"/></g><defs><clipPath id="li"><rect width="16" height="16" fill="currentColor"/></clipPath></defs></svg>';
  var LOADOUT_CHANGE_SVG = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mc" maskUnits="userSpaceOnUse" x="0" y="0" width="15" height="15" style="mask-type:alpha"><rect width="15" height="15" fill="#D9D9D9"/></mask><g mask="url(#mc)"><path d="M4.375 13.125L1.25 10L4.375 6.875L5.26562 7.75L3.64062 9.375H13.125V10.625H3.64062L5.26562 12.25L4.375 13.125ZM10.625 8.125L9.73438 7.25L11.3594 5.625H1.875V4.375H11.3594L9.73438 2.75L10.625 1.875L13.75 5L10.625 8.125Z" fill="#76C1D1"/></g></svg>';
  var LOADOUT_INSTALL_SVG = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mi" maskUnits="userSpaceOnUse" x="0" y="0" width="15" height="15" style="mask-type:alpha"><rect width="15" height="15" fill="#D9D9D9"/></mask><g mask="url(#mi)"><path d="M7.5 9.894L3.95 6.345l1.167-1.18L6.67 6.728V2.2h1.656v4.528l1.554-1.563 1.167 1.18L7.5 9.894zM3.855 12.8c-.461 0-.853-.16-1.174-.482A1.614 1.614 0 012.2 11.144V9.27h1.656v1.875h7.288V9.27H12.8v1.875c0 .461-.16.853-.482 1.174-.321.322-.713.482-1.174.482H3.855z" fill="#00CDAB"/></g></svg>';
  var LOADOUT_UNINSTALL_SVG = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mu" maskUnits="userSpaceOnUse" x="0" y="0" width="15" height="15" style="mask-type:alpha"><rect width="15" height="15" fill="#D9D9D9"/></mask><g mask="url(#mu)"><path d="M4.277 13.425a1.614 1.614 0 01-1.174-.482 1.614 1.614 0 01-.482-1.174V3.847H1.793V2.191h3.628V1.363H9.56v.828h3.646v1.656h-.828v7.922c0 .461-.16.853-.482 1.174-.321.322-.713.482-1.174.482H4.277zm6.445-9.578H4.277v7.922h6.445V3.847zM5.466 10.616h1.453V4.991H5.466v5.625zm2.614 0h1.453V4.991H8.08v5.625z" fill="#FF5050"/></g></svg>';
  var HW_SPEC_DISPLAY = {
    cpuFrequency: ["Frequency", "GHz"],
    cpuCores: ["Cores count", "count"],
    cpuConsuming: ["Power consuming", "kW"],
    gpuPower: ["Power", "PFLOPS"],
    gpuMemory: ["Memory", "TB"],
    gpuConsuming: ["Power consuming", "kW"],
    ramFrequency: ["Frequency", "GHz"],
    ramMemory: ["Memory", "TB"],
    psuPower: ["Power", "kW"],
    psuProtection: ["Protection", "%"]
  };
  function hwSpecRows(specs, vuln) {
    let h = "";
    Object.entries(specs).forEach(([k, v]) => {
      const d = HW_SPEC_DISPLAY[k];
      if (!d) return;
      h += '<div class="loadout-hw-stat-row"><span>' + d[0] + " " + d[1] + '</span><span class="stat-val">' + v + "</span></div>";
    });
    if (vuln !== void 0 && vuln !== null) {
      h += '<div class="loadout-hw-stat-row"><span>Vulnerability %</span><span class="stat-val">' + vuln + "</span></div>";
    }
    return h;
  }
  function hwSpecRowsSmall(specs, vuln, cls) {
    let h = "";
    Object.entries(specs).forEach(([k, v]) => {
      const d = HW_SPEC_DISPLAY[k];
      if (!d) return;
      h += '<div class="' + cls + '"><span>' + d[0] + " " + d[1] + '</span><span class="stat-val">' + v + "</span></div>";
    });
    if (vuln !== void 0 && vuln !== null) {
      h += '<div class="' + cls + '"><span>Vulnerability %</span><span class="stat-val">' + vuln + "</span></div>";
    }
    return h;
  }
  function showHwInfoPopup(item) {
    const popup = document.getElementById("hwInfoPopup");
    const overlay = document.getElementById("hwInfoOverlay");
    let h = '<div class="info-title">' + LOADOUT_INFO_SVG + " " + (item.name || "").toUpperCase() + "</div>";
    h += '<div class="info-desc">';
    const matchedSubstr = item.name ? Object.keys(zoomList).find((substring) => item.name.includes(substring)) : "";
    let zoomHWImg = "";
    if (matchedSubstr) {
      zoomHWImg = `style="transform:scale(${zoomList[matchedSubstr]});object-fit:contain;"`;
    }
    if (item.image) h += `<div style="overflow:clip;"><img ${zoomHWImg} src="${item.image}" alt=""></div>`;
    h += "<span>" + (item.description || "No description available.") + "</span>";
    h += "</div>";
    h += '<div class="info-specs">';
    const specs = item.specs || {};
    Object.entries(specs).forEach(([k, v]) => {
      const d = HW_SPEC_DISPLAY[k];
      if (!d) return;
      h += '<div class="info-spec-item"><div class="info-spec-label">' + d[0] + '</div><div class="info-spec-val">' + v + " " + d[1] + "</div></div>";
    });
    if (item.itemVulnerability !== void 0) {
      h += '<div class="info-spec-item"><div class="info-spec-label">Vulnerability</div><div class="info-spec-val">' + item.itemVulnerability + " %</div></div>";
    }
    h += "</div>";
    _safeSetHtml(popup, h);
    popup.classList.add("open");
    overlay.classList.add("open");
    const close = () => {
      popup.classList.remove("open");
      overlay.classList.remove("open");
      overlay.removeEventListener("click", close);
    };
    overlay.addEventListener("click", close);
  }
  function renderLoadoutHardware(data) {
    if (!data || !data.equippedHardware) {
      loadoutHwContainer.replaceChildren(_noData("No hardware data"));
      return;
    }
    const hw = data.equippedHardware;
    const avail = data.ownedHardware || [];
    const cats = ["cpu", "gpu", "ram", "psu"];
    let html = "";
    cats.forEach((cat) => {
      const item = hw[cat];
      if (!item) return;
      const replacements = avail.filter((a) => a.category && a.category.toLowerCase() === cat && a.id !== item.id);
      html += '<div class="loadout-hw-card">';
      html += '<div class="loadout-hw-left">';
      html += '<div class="loadout-hw-header">';
      html += '<div class="loadout-hw-cat">' + (item.category || cat.toUpperCase()) + "</div>";
      html += '<div class="loadout-hw-name">' + (item.name || "Unknown") + "</div>";
      html += "</div>";
      html += '<div class="loadout-hw-stats">' + hwSpecRows(item.specs || {}, item.itemVulnerability) + "</div>";
      html += "</div>";
      html += '<div class="loadout-hw-right">';
      html += '<button class="loadout-hw-change-btn" data-cat="' + cat + '">' + LOADOUT_CHANGE_SVG + "CHANGE</button>";
      html += '<button class="loadout-hw-info-btn" data-hw-cat="' + cat + '">' + LOADOUT_INFO_SVG + "INFO</button>";
      html += "</div>";
      html += "</div>";
      html += '<div class="loadout-hw-replace-list" data-cat="' + cat + '">';
      html += '<input type="text" class="loadout-hw-replace-search" placeholder="Search..." data-cat="' + cat + '">';
      html += '<div class="replace-items-wrap" data-cat="' + cat + '">';
      replacements.forEach((r) => {
        html += '<div class="loadout-hw-replace-item" data-search-name="' + (r.name || "").toLowerCase() + '">';
        html += '<div class="replace-left">';
        html += '<div class="replace-header">';
        html += '<div class="replace-cat">' + (r.category || cat.toUpperCase()) + "</div>";
        html += '<div class="replace-name">' + (r.name || "") + "</div>";
        html += "</div>";
        html += '<div class="replace-stats">' + hwSpecRowsSmall(r.specs || {}, r.itemVulnerability, "replace-stat-row") + "</div>";
        html += "</div>";
        html += '<div class="replace-right">';
        html += '<button class="replace-btn" data-id="' + r.id + '">' + LOADOUT_CHANGE_SVG + "CHANGE</button>";
        html += '<button class="replace-info-btn" data-hw-id="' + r.id + '">' + LOADOUT_INFO_SVG + '<span style="margin-top: 1px;">INFO</span></button>';
        html += "</div>";
        html += "</div>";
      });
      html += "</div>";
      html += "</div>";
    });
    if (html) {
      _safeSetHtml(loadoutHwContainer, html);
    } else {
      loadoutHwContainer.replaceChildren(_noData("No hardware equipped"));
    }
    loadoutHwContainer.querySelectorAll(".loadout-hw-change-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cat = btn.dataset.cat;
        const list = loadoutHwContainer.querySelector('.loadout-hw-replace-list[data-cat="' + cat + '"]');
        if (list) list.classList.toggle("open");
      });
    });
    loadoutHwContainer.querySelectorAll(".loadout-hw-replace-search").forEach((input) => {
      input.addEventListener("input", () => {
        const cat = input.dataset.cat;
        const val = input.value.toLowerCase().trim();
        const wrap = loadoutHwContainer.querySelector('.replace-items-wrap[data-cat="' + cat + '"]');
        if (!wrap) return;
        wrap.querySelectorAll(".loadout-hw-replace-item").forEach((item) => {
          item.style.display = !val || item.dataset.searchName.includes(val) ? "" : "none";
        });
      });
    });
    loadoutHwContainer.querySelectorAll(".replace-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        clearLoadoutError();
        const moduleConfigId = btn.dataset.id;
        btn.disabled = true;
        btn.textContent = "...";
        try {
          const tab = await getCor3Tab();
          if (tab) await Cor3CenterUi.send(tab.id, { action: "equipHardware", moduleConfigId });
        } catch (err) {
          showLoadoutError("Equip failed: " + err.message);
        }
      });
    });
    loadoutHwContainer.querySelectorAll(".loadout-hw-info-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cat = btn.dataset.hwCat;
        const item = hw[cat];
        if (item) showHwInfoPopup(item);
      });
    });
    loadoutHwContainer.querySelectorAll(".replace-info-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.hwId;
        const item = avail.find((a) => a.id === id);
        if (item) showHwInfoPopup(item);
      });
    });
  }
  function renderLoadoutOverview(data) {
    if (!data || !data.resources) {
      loadoutOverviewContainer.replaceChildren(_noData("No resource data"));
      return;
    }
    const res = data.resources;
    const supply = res.supply || {};
    const demand = res.demand || {};
    const TOTAL_CELLS = 20;
    const UNIT_LABELS = { cpu_frequency: "GHZ", cpu_cores: "COUNT", gpu_power: "PFLOPS", gpu_memory: "TB", ram_frequency: "GHZ", ram_memory: "TB", psu_power: "KW" };
    let html = '<div class="loadout-res-stats">';
    html += '<div class="loadout-res-header"><div class="loadout-res-header-cell">Type</div><div class="loadout-res-header-cell">Usage / Available</div></div>';
    const keys = ["cpu_frequency", "cpu_cores", "gpu_power", "gpu_memory", "ram_frequency", "ram_memory", "psu_power"];
    keys.forEach((key) => {
      const s = supply[key];
      const d = demand[key] || demand[key === "psu_power" ? "psu_total" : key] || 0;
      if (s === void 0) return;
      const ratio = s > 0 ? Math.min(d / s, 1) : 0;
      let colorFill = "";
      if (ratio > 0.95) {
        colorFill = "red";
      } else if (ratio > 0.75) {
        colorFill = "yellow";
      } else {
        colorFill = "blue";
      }
      const filledCount = Math.round(ratio * TOTAL_CELLS);
      const unit = UNIT_LABELS[key] || "";
      html += '<div class="loadout-res-row">';
      html += '<div class="loadout-res-name">' + loadoutSpecLabel(key) + "</div>";
      html += '<div class="loadout-res-bar-wrap">';
      html += '<div class="loadout-res-bar-edge ' + colorFill + '"></div>';
      html += '<div class="loadout-res-bar-cells">';
      for (let i = 0; i < TOTAL_CELLS; i++) {
        html += '<div class="loadout-res-bar-cell ' + (i < filledCount ? "filled-" : "empty-") + colorFill + '"></div>';
      }
      html += "</div>";
      html += '<div class="loadout-res-bar-edge ' + colorFill + '"></div>';
      html += "</div>";
      const dFmt = Number.isInteger(d) ? d : parseFloat(d.toFixed(2));
      const sFmt = Number.isInteger(s) ? s : parseFloat(s.toFixed(2));
      html += '<div class="loadout-res-vals"><span class="res-highlight">' + dFmt + " / " + sFmt + "</span> " + unit + "</div>";
      html += "</div>";
    });
    html += "</div>";
    _safeSetHtml(loadoutOverviewContainer, html);
  }
  function loadoutToolSvg(type) {
    const t2 = (type || "").toUpperCase();
    if (t2 === "DECRYPT") return '<svg class="loadout-sw-tool-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14.28 6.929c-.018.67.407 1.005 1.276 1.005h5.455L14.28 1.2V6.93zM4.428 1.2c-.96 0-1.439.475-1.439 1.425v18.75c0 .95.48 1.425 1.44 1.425h15.158c.95 0 1.425-.475 1.425-1.425V9.712h-5.456c-.94 0-1.633-.212-2.076-.638-.679-.47-1.004-1.204-.977-2.2V1.2H4.428zm3.88 10.169l1.046 1.059-2.579 2.593 2.592 2.593-1.058 1.06-3.637-3.653 3.637-3.652zm3.678 0h1.52l-1.466 7.304h-1.52l1.466-7.304zm2.66 1.059l1.072-1.06 3.637 3.653-3.664 3.652-1.045-1.059 2.606-2.579-2.606-2.607z" fill="#F1F4F5"/></svg>';
    if (t2 === "HACK") return '<svg class="loadout-sw-tool-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11.259 11.23H6.067v6.844c0 .811.285 1.496.855 2.055.569.574 1.257.861 2.063.861h2.275V11.23zm6.674 0h-5.192v9.76h2.275c.811 0 1.499-.287 2.063-.861.57-.56.854-1.244.854-2.055V11.23zm1.965 3.203h-.862v1.594h.862c.866 0 1.3.436 1.3 1.307v3.936H22.8v-3.936c0-1.934-.967-2.9-2.902-2.9zm2.759-2h-3.598v1.217h3.598V12.44zm-1.466-5.955c0 .866-.431 1.3-1.293 1.3h-1.323v1.601h1.323c1.925 0 2.887-.967 2.887-2.9V2.73h-1.595v3.755zM4.964 14.433H4.102c-1.935 0-2.902.967-2.902 2.9v3.937h1.602v-3.936c0-.871.434-1.307 1.3-1.307h.862v-1.594zm-.023-1.994v-1.217H1.344v1.217h3.597zM5.425 9.386V7.784H4.102c-.862 0-1.293-.433-1.293-1.3V2.731H1.215v3.754c0 1.934.963 2.901 2.887 2.901h1.323zM6.725 6.334v3.143h10.55V6.334c0-.403-.063-.813-.189-1.232a3.063 3.063 0 00-.574-1.08c-.509-.509-1.129-.763-1.86-.763H9.347c-.73 0-1.35.254-1.859.763a3.063 3.063 0 00-.574 1.08c-.126.42-.189.83-.189 1.232z" fill="white"/></svg>';
    if (t2 === "SEARCH") return '<svg class="loadout-sw-tool-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.171 3.934C15.348 2.111 13.144 1.2 10.56 1.2 7.979 1.2 5.775 2.111 3.948 3.934 2.125 5.761 1.214 7.967 1.214 10.552c-.001 2.58.91 4.782 2.734 6.605 1.827 1.827 4.231 2.74 6.812 2.74 1.759 0 3.342-.422 4.749-1.267.278-.167.549-.351.812-.552l1.765 1.765-.001-.005 2.962 2.962 1.939-1.977-2.962-2.956.054-.06-.06.06-1.743-1.738c1.224-1.607 1.836-3.466 1.836-5.578 0-2.584-.914-4.69-2.74-6.517zm.574 6.617c0 1.983-.702 3.674-2.106 5.074-1.4 1.404-3.094 2.106-5.08 2.106-1.982 0-3.675-.702-5.079-2.106-1.4-1.4-2.101-3.091-2.101-5.074 0-1.986.7-3.681 2.101-5.085C6.884 4.066 8.577 3.366 10.56 3.366c1.986 0 3.679.7 5.079 2.1 1.404 1.405 2.106 3.1 2.106 5.085z" fill="white"/></svg>';
    return '<svg class="loadout-sw-tool-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.5"/><path d="M12 8v4l2 2" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>';
  }
  function getSwToolGroup(sw) {
    const specs = sw.specs || [];
    const order = { hack: 0, decrypt: 1, search: 2, view: 3, load: 4 };
    let best = 99;
    specs.forEach((s) => {
      const t2 = (s.type || "").toLowerCase();
      if (order[t2] !== void 0 && order[t2] < best) best = order[t2];
    });
    return best;
  }
  function swMatchesFilter(sw, filterVal) {
    if (filterVal === "all") return true;
    const specs = sw.specs || [];
    return specs.some((s) => (s.type || "").toLowerCase() === filterVal);
  }
  function renderLoadoutSoftware(data) {
    if (!data) {
      loadoutSwContainer.replaceChildren(_noData("No software data"));
      return;
    }
    const equipped = data.equippedSoftware || [];
    const available = data.ownedSoftware || [];
    const softwarePower = data.resources && data.resources.softwarePower || [];
    const equippedIds = new Set(equipped.map((s) => s.id));
    const all = [];
    equipped.forEach((s) => all.push({ ...s, installed: true }));
    available.filter((s) => !equippedIds.has(s.id)).forEach((s) => all.push({ ...s, installed: false }));
    const filterVal = loadoutSwSort.value;
    const searchVal = (loadoutSwSearch.value || "").toLowerCase().trim();
    let filtered = all.filter((s) => swMatchesFilter(s, filterVal));
    if (searchVal) filtered = filtered.filter((s) => (s.name || "").toLowerCase().includes(searchVal) || (s.manufacturer || "").toLowerCase().includes(searchVal));
    const installedItems = filtered.filter((s) => s.installed).sort((a, b) => getSwToolGroup(a) - getSwToolGroup(b));
    const uninstalledItems = filtered.filter((s) => !s.installed).sort((a, b) => getSwToolGroup(a) - getSwToolGroup(b));
    const sorted = [...installedItems, ...uninstalledItems];
    const installedCount = equipped.length;
    const totalCount = all.length;
    loadoutSwCount.textContent = "(" + installedCount + "/" + totalCount + ")";
    if (sorted.length === 0) {
      loadoutSwContainer.replaceChildren(_noData("No programs found"));
      return;
    }
    let html = "";
    sorted.forEach((sw) => {
      const pwInfo = softwarePower.find((p) => p.moduleId === sw.id);
      const specs = sw.specs || [];
      const consuming = sw.consuming || {};
      html += '<div class="loadout-sw-card' + (sw.installed ? " installed" : "") + '">';
      html += '<div class="loadout-sw-header">';
      html += '<div class="loadout-sw-row">';
      html += '<div style="overflow:hidden;border-radius:4px;width:40px;height:40px;">';
      html += '<img class="loadout-sw-img"';
      const matchedSubstring = Object.keys(zoomList).find((substring) => sw.name.includes(substring));
      if (matchedSubstring) {
        html += `style="transform:scale(${zoomList[matchedSubstring]});"`;
      }
      html += ' src="' + (sw.image || "") + '" alt="' + (sw.name || "") + '"></div>';
      html += '<div class="loadout-sw-name">' + (sw.name || "Unknown") + "</div>";
      html += "</div>";
      if (sw.installed) {
        html += '<button class="loadout-sw-install-btn uninstall" data-id="' + sw.id + '" data-action="uninstall">' + LOADOUT_UNINSTALL_SVG + "UNINSTALL</button>";
      } else {
        html += '<button class="loadout-sw-install-btn install" data-id="' + sw.id + '" data-action="install">' + LOADOUT_INSTALL_SVG + "INSTALL</button>";
      }
      html += "</div>";
      const funcLines = specs.map((spec) => {
        const typeLabel = (spec.type || "").toUpperCase();
        let line = "<div>";
        line += '<span class="func-label">FUNC:</span>';
        line += '<span class="func-tags">' + typeLabel;
        if (spec.power) line += " " + spec.power[0] + "/" + spec.power[1];
        line += "</span>";
        line += "</div>";
        return line;
      });
      html += '<div class="loadout-sw-func">';
      html += '<div class="func-left">' + funcLines.join(" ") + "</div>";
      html += '<button class="loadout-sw-info-btn" data-sw-id="' + sw.id + '">' + LOADOUT_INFO_SVG + ' <span style="margin-top: 1px;">INFO</span></button>';
      html += "</div>";
      html += '<div class="loadout-sw-details" data-details-id="' + sw.id + '">';
      html += '<div class="loadout-sw-details-header">Basic Required</div>';
      const consumeKeys = ["cpu_frequency", "cpu_cores", "gpu_power", "gpu_memory", "ram_frequency", "ram_memory"];
      const noAllocKeys = /* @__PURE__ */ new Set(["cpu_frequency", "ram_frequency"]);
      const supply = data.resources && data.resources.supply || {};
      let hasConsume = false;
      if (sw.installed) {
        const rowList = [];
        let minPct = 100;
        let minPctIndex = 0;
        let counter = 0;
        consumeKeys.forEach((ck) => {
          const vals = consuming[ck];
          if (!vals || !Array.isArray(vals) || vals.length < 2) return;
          hasConsume = true;
          const unit = loadoutUnitLabel(ck);
          let allocV, minV, maxV;
          if (noAllocKeys.has(ck)) {
            allocV = null;
            minV = vals[0];
            maxV = vals[1];
          } else {
            allocV = vals[0];
            minV = vals.length >= 2 ? vals[1] : vals[0];
            maxV = vals.length >= 3 ? vals[2] : vals[vals.length - 1];
          }
          let otherBaseDemand = 0;
          equipped.forEach((otherSw) => {
            if (otherSw.id === sw.id) return;
            const otherVals = otherSw.consuming && otherSw.consuming[ck];
            if (!otherVals || !Array.isArray(otherVals)) return;
            otherBaseDemand += otherVals.length === 3 ? otherVals[0] : 0;
          });
          const availableV = (supply[ck] || 0) - otherBaseDemand;
          let pct;
          if (maxV > minV) {
            pct = Math.max(0, Math.min((availableV - minV) / (maxV - minV), 1)) * 100;
          } else {
            pct = availableV >= minV ? 100 : 0;
          }
          if (pct < minPct) {
            minPct = pct;
            minPctIndex = counter;
          }
          rowList.push({
            "label": loadoutSpecLabel(ck),
            "supplyV": supply[ck] || 0,
            "allocV": allocV,
            "unit": unit,
            "minV": minV,
            "maxV": maxV,
            "pct": pct
          });
          counter++;
        });
        counter = 0;
        let color = "blue";
        rowList.forEach((obj) => {
          html += '<div class="loadout-sw-stat-row">';
          html += '<span class="stat-name">' + obj["label"];
          if (obj["allocV"] !== null) {
            html += ' <span class="stat-alloc">(' + obj["allocV"].toFixed(2) + " " + obj["unit"] + ")</span>";
          } else if (obj["unit"]) {
            html += ' <span class="stat-alloc">(' + obj["unit"] + ")</span>";
          }
          html += "</span>";
          html += '<span class="stat-val">' + obj["minV"].toFixed(2) + "/" + obj["maxV"].toFixed(2) + "</span>";
          html += "</div>";
          if (counter === minPctIndex && obj["pct"] !== 100) {
            color = "yellow";
          } else {
            color = "blue";
          }
          html += '<div class="loadout-sw-stat-bar"><div class="stat-bar-fill-' + color + '" style="width:' + obj["pct"].toFixed(1) + '%"></div></div>';
          counter++;
        });
        if (!hasConsume) html += '<div style="font-size:9px;color:rgba(107,120,136,1);">No consumption data</div>';
      } else {
        consumeKeys.forEach((ck) => {
          const vals = consuming[ck];
          if (!vals || !Array.isArray(vals) || vals.length < 2) return;
          hasConsume = true;
          const unit = loadoutUnitLabel(ck);
          let minV, maxV;
          if (noAllocKeys.has(ck)) {
            minV = vals[0];
            maxV = vals[1];
          } else {
            minV = vals.length >= 2 ? vals[1] : vals[0];
            maxV = vals.length >= 3 ? vals[2] : vals[vals.length - 1];
          }
          html += '<div class="loadout-sw-stat-row">';
          html += '<span class="stat-name">' + loadoutSpecLabel(ck);
          if (unit) html += ' <span class="stat-alloc">(' + unit + ")</span>";
          html += "</span>";
          html += '<span class="stat-val">' + minV.toFixed(2) + "/" + maxV.toFixed(2) + "</span>";
          html += "</div>";
          html += '<div class="loadout-sw-stat-bar"><div class="stat-bar-fill"></div></div>';
        });
        if (!hasConsume) html += '<div style="font-size:9px;color:rgba(107,120,136,1);">No consumption data</div>';
      }
      html += '<div class="loadout-sw-tool-section">';
      specs.forEach((spec) => {
        const typeLabel = (spec.type || "").toUpperCase() + " TOOL";
        html += '<div class="loadout-sw-tool-row">';
        html += "<div>" + loadoutToolSvg(spec.type) + "</div>";
        html += "<div>";
        html += '<div class="loadout-sw-tool-name">' + typeLabel + "</div>";
        html += '<div class="loadout-sw-tool-detail">';
        if (spec.fileTypes && spec.fileTypes.length > 0) {
          html += spec.fileTypes.length + " files";
          html += ' <span class="info-tooltip">' + LOADOUT_INFO_SQUARE_SVG + '<span class="tooltip-text">' + spec.fileTypes.join(", ") + "</span></span>";
        }
        if (spec.serverTypes && spec.serverTypes.length > 0) {
          html += spec.serverTypes.length + " servers";
          html += ' <span class="info-tooltip">' + LOADOUT_INFO_SQUARE_SVG + '<span class="tooltip-text">' + spec.serverTypes.join(", ") + "</span></span>";
        }
        html += "</div>";
        html += "</div>";
        html += "</div>";
        if (spec.power) {
          const pwEntry = pwInfo && pwInfo.abilities ? pwInfo.abilities.find((a) => a.type === spec.type) : null;
          html += '<div class="loadout-sw-power-row">';
          html += '<span class="power-label">Power</span>';
          if (pwEntry) {
            html += '<span class="power-val" style="color:rgba(0,205,171,1);font-weight:bold;">' + pwEntry.computedPower + "/" + spec.power[1] + "</span>";
          } else {
            html += '<span class="power-val">' + spec.power[0] + "/" + spec.power[1] + "</span>";
          }
          html += "</div>";
          const pwPct = spec.power[1] > 0 ? Math.min((pwEntry ? pwEntry.computedPower : spec.power[0]) / spec.power[1] * 100, 100) : 0;
          if (sw.installed) {
            html += '<div class="loadout-sw-stat-bar"><div class="stat-bar-fill-blue" style="width:' + pwPct.toFixed(1) + '%"></div></div>';
          } else {
            html += '<div class="loadout-sw-stat-bar"><div class="stat-bar-fill"></div></div>';
          }
        }
      });
      html += "</div>";
      if (pwInfo && pwInfo.ratio !== void 0) {
        html += '<div class="loadout-sw-stat-row" style="margin-top:4px;border-top:1px solid rgba(44,52,62,1);padding-top:4px;"><span class="stat-name">Performance Ratio</span><span class="stat-val">' + (pwInfo.ratio * 100).toFixed(1) + "%</span></div>";
      }
      html += "</div>";
      html += "</div>";
    });
    _safeSetHtml(loadoutSwContainer, html);
    loadoutSwContainer.querySelectorAll(".loadout-sw-install-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        clearLoadoutError();
        const moduleConfigId = btn.dataset.id;
        const action = btn.dataset.action;
        btn.disabled = true;
        btn.textContent = "...";
        try {
          const tab = await getCor3Tab();
          if (tab) {
            if (action === "install") {
              await Cor3CenterUi.send(tab.id, { action: "equipSoftware", moduleConfigId });
            } else {
              await Cor3CenterUi.send(tab.id, { action: "unequipSoftware", moduleConfigId });
            }
          }
        } catch (err) {
          showLoadoutError((action === "install" ? "Install" : "Uninstall") + " failed: " + err.message);
        }
      });
    });
    loadoutSwContainer.querySelectorAll(".loadout-sw-info-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const swId = btn.dataset.swId;
        const card = btn.closest(".loadout-sw-card");
        if (!card) return;
        const details = card.querySelector('.loadout-sw-details[data-details-id="' + swId + '"]');
        if (details) details.classList.toggle("open");
      });
    });
  }
  function showLoadoutError(msg) {
    loadoutError.textContent = translateErrorText(msg);
    loadoutError.style.display = "block";
    setTimeout(() => {
      loadoutError.style.display = "none";
    }, 1e4);
  }
  function clearLoadoutError() {
    loadoutError.textContent = "";
    loadoutError.style.display = "none";
  }
  function renderLoadout(data) {
    if (!data) {
      loadoutHwContainer.replaceChildren(_noData("No loadout data yet"));
      loadoutOverviewContainer.replaceChildren(_noData("No loadout data yet"));
      loadoutSwContainer.replaceChildren(_noData("No loadout data yet"));
      return;
    }
    cachedLoadoutData = data;
    renderLoadoutHardware(data);
    renderLoadoutOverview(data);
    renderLoadoutSoftware(data);
  }
  async function loadLoadout() {
    const { loadoutData, loadoutError: storedError } = await Cor3CenterStore.get(["loadoutData", "loadoutError"]);
    if (storedError) showLoadoutError(storedError.message || JSON.stringify(storedError));
    renderLoadout(loadoutData || null);
  }
  async function refreshLoadout() {
    try {
      const tab = await getCor3Tab();
      if (!tab) throw new Error("No cor3.gg tab");
      await Cor3CenterUi.send(tab.id, { action: "requestLoadout" });
      setTimeout(() => {
        observeCenterRead(loadLoadout());
        refreshAllTimestamps();
      }, 3e3);
    } catch (e) {
      setTimeout(() => {
        observeCenterRead(loadLoadout());
        refreshAllTimestamps();
      }, 500);
    }
  }
  refreshLoadoutBtn.addEventListener("click", () => {
    clearLoadoutError();
    refreshLoadout();
  });
  loadoutSwSort.addEventListener("change", () => {
    if (cachedLoadoutData) renderLoadoutSoftware(cachedLoadoutData);
  });
  loadoutSwSearch.addEventListener("input", () => {
    if (cachedLoadoutData) renderLoadoutSoftware(cachedLoadoutData);
  });
  function initLoadoutStorageListener() {
    Cor3CenterStore.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.loadoutData) {
        renderLoadout(changes.loadoutData.newValue);
        refreshAllTimestamps();
      }
      if (changes.loadoutError && changes.loadoutError.newValue) {
        showLoadoutError(changes.loadoutError.newValue.message || JSON.stringify(changes.loadoutError.newValue));
      }
    });
  }
  observeCenterRead(loadLoadout());
  initLoadoutStorageListener();

  // src/popup/mercenaries.js
  var autoSendMercenaryToggle = document.getElementById("autoSendMercenaryToggle");
  var mercInsuranceToggle = document.getElementById("mercInsuranceToggle");
  var mercWarning = document.getElementById("mercWarning");
  var PAUSE_REASONS = {
    stash_full: "Auto expedition paused: stash is full. Clear stash space, then turn Auto expedition off and on to resume.",
    insufficient_credits: "Auto expedition paused: not enough credits. Earn credits, then turn Auto expedition off and on to resume."
  };
  var _settings = { enabled: false, hasInsurance: false, disabledReason: null };
  var _localWarning2 = "";
  function normalizeSettings(raw) {
    const settings = raw || {};
    return {
      enabled: !!settings.enabled,
      hasInsurance: !!settings.hasInsurance,
      disabledReason: settings.disabledReason || null
    };
  }
  function setWarningText(text) {
    if (!mercWarning) return;
    if (!text) {
      mercWarning.style.display = "none";
      mercWarning.textContent = "";
      return;
    }
    mercWarning.textContent = "\u26A0\uFE0F " + translateErrorText(text);
    mercWarning.style.borderColor = "var(--accent-orange)";
    mercWarning.style.color = "var(--accent-orange)";
    mercWarning.style.background = "rgba(255,160,0,0.15)";
    mercWarning.style.display = "";
  }
  function renderWarning() {
    const parts = [];
    if (_settings.disabledReason) {
      parts.push(PAUSE_REASONS[_settings.disabledReason] || "Auto expedition paused: " + _settings.disabledReason + ". Turn Auto expedition off and on to retry.");
    }
    if (_localWarning2) parts.push(_localWarning2);
    setWarningText(parts.join(" "));
  }
  async function requestMercenaries() {
    try {
      const tab = await getCor3Tab();
      if (!tab) return;
      await Cor3CenterStore.remove(["coreMercsDone", "usolMercsDone"]);
      await Cor3CenterUi.send(tab.id, { action: "requestMercenaries" });
      await waitForStorageKey("coreMercsDone", 3e4);
      try {
        await Cor3CenterUi.send(tab.id, { action: "requestUsolMercenaries" });
      } catch (e) {
      }
      await waitForStorageKey("usolMercsDone", 3e4).catch(() => {
      });
    } catch (e) {
    }
  }
  function applySettingsToUi2(raw) {
    _settings = normalizeSettings(raw);
    if (autoSendMercenaryToggle) autoSendMercenaryToggle.checked = _settings.enabled;
    if (mercInsuranceToggle) mercInsuranceToggle.checked = _settings.hasInsurance;
    renderWarning();
  }
  Cor3CenterStore.get("autoSendMerc", (data) => {
    const raw = data.autoSendMerc || {};
    applySettingsToUi2(raw);
    Cor3CenterStore.get("mercWarning", (local) => {
      _localWarning2 = local.mercWarning || "";
      renderWarning();
    });
  });
  function saveSettings(clearDisabledReason) {
    if (state.isHelper) return;
    const enabled = !!autoSendMercenaryToggle.checked;
    const hasInsurance = !!mercInsuranceToggle.checked;
    Cor3CenterStore.update("autoSendMerc",{enabled,hasInsurance,...(clearDisabledReason?{disabledReason:null}:{})});
  }
  if (autoSendMercenaryToggle) {
    autoSendMercenaryToggle.addEventListener("change", () => {
      saveSettings(true);
      if (autoSendMercenaryToggle.checked) {
        _localWarning2 = "";
        if (mercWarning) mercWarning.style.display = "none";
        Cor3CenterStore.remove(["expeditionLaunchError", "mercWarning"]);
        observeCenterRead(loadExpeditions());
      } else {
        _localWarning2 = "";
        Cor3CenterStore.remove(["expeditionLaunchError", "mercWarning"]);
        renderWarning();
      }
    });
  }
  if (mercInsuranceToggle) {
    mercInsuranceToggle.addEventListener("change", () => {
      saveSettings(false);
      setTimeout(() => requestMercenaries(), 300);
    });
  }
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.autoSendMerc) {
      applySettingsToUi2(changes.autoSendMerc.newValue || {});
    }
    if (area === "local" && changes.mercWarning) {
      _localWarning2 = changes.mercWarning.newValue || "";
      renderWarning();
    }
  });

  // src/popup/archived-expeditions.js
  var archivedExpSectionToggle = document.getElementById("archivedExpSectionToggle");
  var archivedExpSectionBody = document.getElementById("archivedExpSectionBody");
  var archivedExpContainer = document.getElementById("archivedExpContainer");
  var refreshArchivedBtn = document.getElementById("refreshArchivedBtn");
  archivedExpSectionToggle.addEventListener("click", () => {
    archivedExpSectionToggle.classList.toggle("open");
    archivedExpSectionBody.classList.toggle("open");
  });
  async function requestArchivedExpeditions() {
    archivedExpContainer.replaceChildren(_noData("Loading archived expeditions..."));
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestArchivedExpeditions" });
    } catch (e) {
    }
    setTimeout(() => loadArchivedExpeditions(), 3e3);
  }
  if (refreshArchivedBtn) {
    refreshArchivedBtn.addEventListener("click", () => requestArchivedExpeditions());
  }
  async function loadArchivedExpeditions() {
    const { archivedExpeditionsData } = await Cor3CenterStore.get("archivedExpeditionsData");
    renderArchivedExpeditions(archivedExpeditionsData);
    refreshAllTimestamps();
  }
  function renderArchivedExpeditions(data) {
    if (!archivedExpContainer) return;
    _clearEl(archivedExpContainer);
    let items = data;
    if (data && !Array.isArray(data) && data.items) items = data.items;
    if (data && !Array.isArray(data) && data.data) items = data.data;
    if (!items || !Array.isArray(items) || items.length === 0) {
      archivedExpContainer.replaceChildren(_noData("No archived expeditions found."));
      return;
    }
    for (const exp of items) {
      const card = document.createElement("div");
      card.className = "archived-exp-card";
      const factionDisplay = exp.mercenary && exp.mercenary.faction ? (exp.mercenary.faction.name || "").replace("factions.", "").replace(/([A-Z])/g, " $1").trim().split(" ")[0].toUpperCase() : "UNEMPLOYED";
      const mercName = exp.mercenary ? exp.mercenary.callsign : "Unknown";
      const outcome = (exp.outcome || exp.status || "COMPLETED").toUpperCase();
      let outcomeClass = "outcome-full";
      if (outcome.includes("PARTIAL")) outcomeClass = "outcome-partial";
      else if (outcome.includes("FAIL")) outcomeClass = "outcome-fail";
      else if (outcome.includes("DEATH")) outcomeClass = "outcome-death";
      let html = `<div class="archived-exp-header">`;
      html += `<span class="archived-exp-merc">\u{1F9D1} ${mercName}</span>`;
      html += `<span class="outcome-tag ${outcomeClass}">${translateStatus(outcome)}</span>`;
      html += `</div>`;
      html += `<div class="archived-exp-info">`;
      html += `${t("Faction:", "\u9635\u8425\uFF1A")} <b>${factionDisplay}</b>`;
      html += `<br>`;
      if (exp.locationName && exp.zoneName && exp.locationName.length + exp.zoneName.length > 30) {
        html += `\u{1F4CD} ${exp.locationName || "--"} /`;
        html += `<br>`;
        html += `${exp.zoneName || "--"}`;
      } else {
        html += `\u{1F4CD} ${exp.locationName || "--"} / ${exp.zoneName || "--"}`;
      }
      if (exp.objectiveName) html += ` \u2014 ${exp.objectiveName}`;
      html += `<br>`;
      if (exp.totalCost !== void 0) html += `\u{1F4B0} ${t("Cost:", "\u8D39\u7528\uFF1A")} ${exp.totalCost.toLocaleString()} \xB7 `;
      if (exp.riskScore !== void 0) html += `\u26A0\uFE0F ${t("Risk:", "\u98CE\u9669\uFF1A")} ${exp.riskScore}`;
      html += `</div>`;
      const rawContainer = exp.containerData || exp.container;
      const containerItems = Array.isArray(rawContainer) ? rawContainer : rawContainer && Array.isArray(rawContainer.items) ? rawContainer.items : null;
      if (containerItems && containerItems.length > 0) {
        const uid = "archived_" + exp.id;
        html += `<div class="container-items">`;
        html += `<div class="expandable-header" data-expand="${uid}"><span class="expand-arrow">\u25B6</span><span class="expand-label">\u{1F4E6} ${t(`Loot (${containerItems.length} items)`, `\u6218\u5229\u54C1\uFF08${containerItems.length} \u4EF6\uFF09`)}</span></div>`;
        html += `<div class="expandable-body" id="${uid}">`;
        for (const ci of containerItems) {
          const det = ci.item || ci;
          const imgSrc = det.imageUrl || det.image || "";
          const imgTag = imgSrc ? `<img src="${imgSrc}" style="width:24px;height:24px;border-radius:4px;vertical-align:middle;margin-right:4px;" loading="lazy">` : "";
          const tierTag = det.tier ? ` <span class="tier-tag tier-tag-${det.tier.toLowerCase()}">${det.tier}</span>` : "";
          let statusTag = "";
          if (det.isCollected) statusTag = ` <span style="color:var(--accent-green);font-size:9px;">\u2713 ${t("Collected", "\u5DF2\u6536\u96C6")}</span>`;
          else if (det.isDeleted) statusTag = ` <span style="color:var(--accent-red);font-size:9px;">\u2717 ${t("Deleted", "\u5DF2\u5220\u9664")}</span>`;
          html += `<div style="font-size:10px;margin:2px 0;">${imgTag}${det.name || det.id || "?"}${tierTag}${statusTag}</div>`;
        }
        html += `</div></div>`;
      }
      if (exp.completedAt) {
        const locale = getUiLang() === "zh" ? "zh-CN" : void 0;
        const completedText = new Date(exp.completedAt).toLocaleString(locale);
        html += `<span style="font-size:9px;color:var(--text-dim);display:flex;flex-direction:row-reverse;">\u{1F550} ${t("Completed", "\u5B8C\u6210\u4E8E")} ${completedText}</span>`;
      }
      _safeSetHtml(card, html);
      archivedExpContainer.appendChild(card);
    }
    archivedExpContainer.querySelectorAll(".expandable-header").forEach((hdr) => {
      hdr.addEventListener("click", () => {
        hdr.classList.toggle("open");
        const targetId = hdr.getAttribute("data-expand");
        const body = document.getElementById(targetId);
        if (body) body.classList.toggle("openExtended");
      });
    });
  }
  async function refreshArchivedOnly() {
    archivedExpContainer.replaceChildren(_noData("Loading archived expeditions..."));
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestArchivedExpeditions" });
    } catch (e) {
    }
    await waitForStorageKey("archivedExpeditionsData", 5e3);
    await loadArchivedExpeditions();
    refreshAllTimestamps();
  }
  observeCenterRead(loadArchivedExpeditions());

  // src/popup/auto-job-solver-ui.js
  var autoJobSolverToggle = document.getElementById("autoJobSolverToggle");
  var autoJobSolverStatus = document.getElementById("autoJobSolverStatus");
  var autoJobSolverSection = document.getElementById("autoJobSolverSection");
  var autoJobsTabHome = document.getElementById("autoJobsTabHome");
  var autoJobsTabDark = document.getElementById("autoJobsTabDark");
  var autoJobsTabSoyuz = document.getElementById("autoJobsTabSoyuz");
  var autoJobsTabUsol = document.getElementById("autoJobsTabUsol");
  var autoJobsContentHome = document.getElementById("autoJobsContentHome");
  var autoJobsContentDark = document.getElementById("autoJobsContentDark");
  var autoJobsContentSoyuz = document.getElementById("autoJobsContentSoyuz");
  var autoJobsContentUsol = document.getElementById("autoJobsContentUsol");
  var autoJobsStartBtn = document.getElementById("autoJobsStartBtn");
  var autoJobsDebugToggle = document.getElementById("autoJobsDebugToggle");
  var autoJobsDebugConsole = document.getElementById("autoJobsDebugConsole");
  var debugTabJobs = document.getElementById("debugTabJobs");
  var debugTabLogs = document.getElementById("debugTabLogs");
  var debugJobsBody = document.getElementById("debugJobsBody");
  var debugLogsBody = document.getElementById("debugLogsBody");
  var refreshAutoJobsBtn = document.getElementById("refreshAutoJobsBtn");
  var copyAllLogsBtn = document.getElementById("copyAllLogsBtn");
  var autoFinishAllJobsToggle = document.getElementById("autoFinishAllJobsToggle");
  var autoFinishAllTypesDetails = document.getElementById("autoFinishAllTypesDetails");
  var autoFinishAllTypesList = document.getElementById("autoFinishAllTypesList");
  var autoFinishAllTypesCount = document.getElementById("autoFinishAllTypesCount");
  var autoFinishAllTypesSelectAll = document.getElementById("autoFinishAllTypesSelectAll");
  var SUPPORTED_JOB_TYPES = [
    "File Decryption",
    "IP Injection",
    "Data Download",
    "Log Deletion",
    "Log Download",
    "Decrypt & Extract",
    "File Elimination",
    "Data Upload",
    "IP Cleanup"
  ];
  var AUTO_FINISH_ALL_JOB_TYPES_KEY = "autoFinishAllJobTypes";
  var autoFinishAllJobTypes = [...SUPPORTED_JOB_TYPES];
  var MARKET_IDS2 = {
    home: "019d3ea4-85bd-7389-904d-8f7c85841134",
    dark: "019d3ea4-85bd-7389-904d-908ba9194aa0",
    soyuz: "019da731-2db5-7d76-9447-1ea3b9b78001",
    usol: "019e4065-6ae8-760d-8724-58ab4f2cf7d7"
  };
  var SERVER_PRIORITY = ["RM7-N1L1", "RM7-W3NCP", "RM7-N2L3", "RM7-N2L2", "RM7-N2ECP", "D4RK RM7CE", "RM7-S4L4", "RM7-E1SCP", "RM7-E1L2CT", "RM7-E1L5", "RM7-E1L3"];
  function getServerPriority(name) {
    const idx = SERVER_PRIORITY.indexOf(name);
    return idx >= 0 ? idx : SERVER_PRIORITY.length;
  }
  var JOB_TYPE_PRIORITY = [
    "IP Injection",
    "IP Cleanup",
    "Data Upload",
    "Data Download",
    "Log Deletion",
    "Log Download",
    "File Elimination",
    "File Decryption",
    "Decrypt & Extract"
  ];
  function getJobTypePriority(name) {
    const idx = JOB_TYPE_PRIORITY.indexOf(name);
    return idx >= 0 ? idx : JOB_TYPE_PRIORITY.length;
  }
  function resolveRecentJobMarket(recentJob, fallbackMarketKey, allMarketData) {
    if (recentJob.marketId) {
      for (const [key, id] of Object.entries(MARKET_IDS2)) {
        if (id === recentJob.marketId) return key;
      }
    }
    const jobId = recentJob.id;
    for (const [key, storageKey] of [["home", "marketData"], ["dark", "darkMarketData"], ["soyuz", "soyuzMarketData"], ["usol", "usolMarketData"]]) {
      const md = allMarketData[storageKey];
      if (md && md.jobs) {
        const match = md.jobs.find((j) => j.id === jobId);
        if (match) return key;
      }
    }
    return fallbackMarketKey;
  }
  var LOG_JOB_TYPES = ["Log Deletion", "Log Download"];
  function isJobBugged(job) {
    const serverName = job.relatedServers && job.relatedServers[0] ? job.relatedServers[0].serverName : job.serverName || "";
    return serverName === "D4RK RM7CE" && LOG_JOB_TYPES.includes(job.name || job.type);
  }
  var autoJobsRunning = false;
  var autoFinishAllActive = false;
  var autoJobsSelectedTypes = { home: [], dark: [], soyuz: [], usol: [] };
  var autoJobsDebugLogs = [];
  var AUTO_JOBS_MAX_LOGS = 200;
  var autoJobsTracker = [];
  function updateAutoJobSolverStatus(enabled) {
    autoJobSolverStatus.textContent = enabled ? "Active" : "Off";
    autoJobSolverStatus.style.color = enabled ? "var(--accent-green)" : "var(--text-dim)";
    autoJobSolverSection.style.display = enabled ? "" : "none";
    var card = autoJobSolverSection.closest(".popout-card");
    if (card) card.style.display = enabled ? "" : "none";
  }
  Cor3CenterStore.get("autoJobSolverEnabled", (data) => {
    const enabled = !!data.autoJobSolverEnabled;
    autoJobSolverToggle.checked = enabled;
    updateAutoJobSolverStatus(enabled);
    if (enabled) renderAutoJobsTabs();
  });
  autoJobSolverToggle.addEventListener("change", async () => {
    const enabled = autoJobSolverToggle.checked;
    await Cor3CenterStore.set({ autoJobSolverEnabled: enabled });
    updateAutoJobSolverStatus(enabled);
    if (enabled) renderAutoJobsTabs();
  });
  autoJobsTabHome.addEventListener("click", () => switchAutoJobsTab("home"));
  autoJobsTabDark.addEventListener("click", () => switchAutoJobsTab("dark"));
  autoJobsTabSoyuz.addEventListener("click", () => switchAutoJobsTab("soyuz"));
  autoJobsTabUsol.addEventListener("click", () => switchAutoJobsTab("usol"));
  function switchAutoJobsTab(market) {
    autoJobsTabHome.classList.toggle("active", market === "home");
    autoJobsTabDark.classList.toggle("active", market === "dark");
    autoJobsTabSoyuz.classList.toggle("active", market === "soyuz");
    autoJobsTabUsol.classList.toggle("active", market === "usol");
    autoJobsContentHome.classList.toggle("active", market === "home");
    autoJobsContentDark.classList.toggle("active", market === "dark");
    autoJobsContentSoyuz.classList.toggle("active", market === "soyuz");
    autoJobsContentUsol.classList.toggle("active", market === "usol");
  }
  async function renderAutoJobsTabs() {
    const { marketData, darkMarketData, darkMarketAvailable, darkMarketMaintenanceEndsAt, darkMarketBlockerServer, soyuzMarketData, soyuzMarketAvailable, soyuzMarketMaintenanceEndsAt, soyuzMarketBlockerServer, usolMarketData, usolMarketAvailable, usolMarketMaintenanceEndsAt, usolMarketBlockerServer, serverMaintenanceMap } = await Cor3CenterStore.get(["marketData", "darkMarketData", "darkMarketAvailable", "darkMarketMaintenanceEndsAt", "darkMarketBlockerServer", "soyuzMarketData", "soyuzMarketAvailable", "soyuzMarketMaintenanceEndsAt", "soyuzMarketBlockerServer", "usolMarketData", "usolMarketAvailable", "usolMarketMaintenanceEndsAt", "usolMarketBlockerServer", "serverMaintenanceMap"]);
    renderAutoJobsMarket(autoJobsContentHome, marketData, "home");
    const darkB = darkMarketAvailable === false ? null : findMaintenanceBlocker(serverMaintenanceMap, "dark");
    renderAutoJobsMarket(autoJobsContentDark, darkMarketData, "dark", darkB ? false : darkMarketAvailable, darkB ? darkB.maintenanceEndsAt : darkMarketMaintenanceEndsAt, darkB ? darkB.blockerName : darkMarketBlockerServer);
    const soyuzB = soyuzMarketAvailable === false ? null : findMaintenanceBlocker(serverMaintenanceMap, "soyuz");
    renderAutoJobsMarket(autoJobsContentSoyuz, soyuzMarketData, "soyuz", soyuzB ? false : soyuzMarketAvailable, soyuzB ? soyuzB.maintenanceEndsAt : soyuzMarketMaintenanceEndsAt, soyuzB ? soyuzB.blockerName : soyuzMarketBlockerServer);
    const usolB = usolMarketAvailable === false ? null : findMaintenanceBlocker(serverMaintenanceMap, "usol");
    renderAutoJobsMarket(autoJobsContentUsol, usolMarketData, "usol", usolB ? false : usolMarketAvailable, usolB ? usolB.maintenanceEndsAt : usolMarketMaintenanceEndsAt, usolB ? usolB.blockerName : usolMarketBlockerServer);
    if (marketData && marketData.market && marketData.market.marketName) {
      autoJobsTabHome.textContent = "\u{1F3E0} " + marketData.market.marketName;
    }
    if (darkMarketData && darkMarketData.market && darkMarketData.market.marketName) {
      autoJobsTabDark.textContent = "\u{1F311} " + darkMarketData.market.marketName;
    }
    if (soyuzMarketData && soyuzMarketData.market && soyuzMarketData.market.marketName) {
      autoJobsTabSoyuz.replaceChildren(_h("span", { style: "color:#c33b3b;" }, "\u262D"), " " + soyuzMarketData.market.marketName);
    }
    if (usolMarketData && usolMarketData.market && usolMarketData.market.marketName) {
      autoJobsTabUsol.replaceChildren(_h("span", { style: "color:#2592A7;margin-right:1px" }, "\u262E"), " " + usolMarketData.market.marketName);
    }
  }
  function renderAutoJobsMarket(container, data, marketKey, marketAvailable, maintenanceEndsAt, blockerServer) {
    _clearEl(container);
    if (marketAvailable === false) {
      let timerHtml = "";
      if (blockerServer) timerHtml += " (" + blockerServer + " in maintenance";
      if (maintenanceEndsAt) {
        const diff = new Date(maintenanceEndsAt).getTime() - Date.now();
        if (diff > 0) {
          const mins = Math.ceil(diff / 6e4);
          timerHtml += (blockerServer ? ", " : " (") + "~" + mins + "m remaining";
        }
      }
      if (timerHtml) timerHtml += ")";
      const marketLabel2 = marketKey === "dark" ? "D4RK" : marketKey === "soyuz" ? "SOYUZ" : marketKey === "usol" ? "USOL" : "HOME";
      container.appendChild(_h("div", { className: "warning-banner" }, "\u26A0\uFE0F " + marketLabel2 + " market server is currently unreachable" + timerHtml + "."));
    }
    if (!data || !data.jobs && !data.recentJobs) {
      container.appendChild(_h("div", { className: "auto-jobs-no-jobs" }, "No jobs available. Click \u{1F504} to refresh market data."));
      return;
    }
    if (data.nextJobsResetAt) {
      const timerDiv = document.createElement("div");
      timerDiv.className = "auto-jobs-reset-timer";
      timerDiv.dataset.resetAt = data.nextJobsResetAt;
      timerDiv.textContent = "\u23F3 Jobs Reset: " + formatTimeRemaining(data.nextJobsResetAt);
      container.appendChild(timerDiv);
    }
    const openJobs = (data.jobs || []).filter((j) => !j.isCompleted && !j.isExpired);
    const takenJobs = (data.recentJobs || []).filter((j) => j.status === "TAKEN");
    for (const tj of takenJobs) {
      tj._isTaken = true;
    }
    const availableJobs = [...openJobs, ...takenJobs];
    if (availableJobs.length === 0) {
      const noJobsDiv = document.createElement("div");
      noJobsDiv.className = "auto-jobs-no-jobs";
      noJobsDiv.textContent = t("All jobs completed or expired.", "\u6240\u6709\u4EFB\u52A1\u5DF2\u5B8C\u6210\u6216\u5DF2\u8FC7\u671F\u3002");
      container.appendChild(noJobsDiv);
      return;
    }
    const typeMap = {};
    for (const job of availableJobs) {
      const typeName = job.name || "Unknown";
      if (!typeMap[typeName]) typeMap[typeName] = [];
      typeMap[typeName].push(job);
    }
    const checkboxes = [];
    for (const [typeName, jobs] of Object.entries(typeMap)) {
      const isSupported = SUPPORTED_JOB_TYPES.includes(typeName);
      const row = document.createElement("div");
      row.className = "auto-jobs-type-row";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.dataset.jobType = typeName;
      cb.dataset.market = marketKey;
      cb.disabled = !isSupported;
      if (isSupported && autoJobsSelectedTypes[marketKey] && autoJobsSelectedTypes[marketKey].includes(typeName)) {
        cb.checked = true;
      }
      cb.addEventListener("change", () => {
        updateAutoJobsSelectedTypes(marketKey, container);
        updateSelectAllState(selectAllCb, checkboxes);
      });
      const label = document.createElement("span");
      label.className = "job-type-label";
      label.textContent = typeName;
      const takenCount = jobs.filter((j) => j._isTaken).length;
      const buggedCount = jobs.filter((j) => isJobBugged(j)).length;
      const count = document.createElement("span");
      count.className = "job-type-count";
      let countText = `(${jobs.length}`;
      if (takenCount > 0) countText += `, ${takenCount} in-progress`;
      if (buggedCount > 0) countText += `, ${buggedCount} bugged`;
      countText += ")";
      count.textContent = countText;
      row.appendChild(label);
      if (!isSupported) {
        const tooltip = document.createElement("span");
        tooltip.className = "unsupported-tooltip";
        tooltip.textContent = "Not supported";
        tooltip.title = "This job type is currently not supported";
        row.appendChild(tooltip);
      } else if (buggedCount > 0 && buggedCount === jobs.length) {
        const tooltip = document.createElement("span");
        tooltip.className = "unsupported-tooltip";
        tooltip.style.color = "var(--accent-orange)";
        tooltip.textContent = "Bugged";
        tooltip.title = "Log jobs on D4RK RM7CE are bugged (logs tab unavailable)";
        row.appendChild(tooltip);
      }
      row.appendChild(count);
      row.appendChild(cb);
      container.appendChild(row);
      if (isSupported) checkboxes.push(cb);
    }
    const selectAllDiv = document.createElement("div");
    selectAllDiv.className = "auto-jobs-select-all";
    const selectAllCb = document.createElement("input");
    selectAllCb.type = "checkbox";
    selectAllCb.id = "selectAll_" + marketKey;
    const selectAllLabel = document.createElement("label");
    selectAllLabel.className = "job-type-label";
    selectAllLabel.setAttribute("for", selectAllCb.id);
    selectAllLabel.textContent = "Select All";
    const totalTaken = takenJobs.length;
    const selectAllCount = document.createElement("span");
    selectAllCount.className = "job-type-count";
    selectAllCount.textContent = totalTaken > 0 ? `(${availableJobs.length}, ${totalTaken} in-progress)` : `(${availableJobs.length})`;
    selectAllDiv.appendChild(selectAllLabel);
    selectAllDiv.appendChild(selectAllCount);
    selectAllDiv.appendChild(selectAllCb);
    container.appendChild(selectAllDiv);
    selectAllCb.addEventListener("change", () => {
      const checked = selectAllCb.checked;
      for (const cb of checkboxes) {
        cb.checked = checked;
      }
      updateAutoJobsSelectedTypes(marketKey, container);
    });
    updateSelectAllState(selectAllCb, checkboxes);
  }
  function updateAutoJobsSelectedTypes(marketKey, container) {
    const cbs = container.querySelectorAll('input[type="checkbox"][data-job-type]');
    autoJobsSelectedTypes[marketKey] = [];
    cbs.forEach((cb) => {
      if (cb.checked) autoJobsSelectedTypes[marketKey].push(cb.dataset.jobType);
    });
    Cor3CenterStore.set({ autoJobsSelectedTypes });
  }
  Cor3CenterStore.get("autoJobsSelectedTypes", (data) => {
    if (data.autoJobsSelectedTypes) {
      autoJobsSelectedTypes = data.autoJobsSelectedTypes;
    }
  });
  refreshAutoJobsBtn.addEventListener("click", async () => {
    const refreshingText = t("Refreshing (sequential)...", "\u6B63\u5728\u4F9D\u6B21\u5237\u65B0...");
    autoJobsContentHome.replaceChildren(_h("div", { className: "auto-jobs-no-jobs" }, refreshingText));
    autoJobsContentDark.replaceChildren(_h("div", { className: "auto-jobs-no-jobs" }, refreshingText));
    autoJobsContentSoyuz.replaceChildren(_h("div", { className: "auto-jobs-no-jobs" }, refreshingText));
    autoJobsContentUsol.replaceChildren(_h("div", { className: "auto-jobs-no-jobs" }, refreshingText));
    try {
      const tab = await getCor3Tab();
      if (tab) {
        await Cor3CenterUi.send(tab.id, { action: "refreshAllMarketsSeq" });
      }
    } catch (e) {
    }
    await new Promise((r) => {
      let done = false;
      const listener = (changes, area) => {
        if (area === "local" && changes._allMarketsRefreshed) {
          done = true;
          Cor3CenterStore.onChanged.removeListener(listener);
          clearTimeout(tmr);
          r();
        }
      };
      Cor3CenterStore.onChanged.addListener(listener);
      const tmr = setTimeout(() => {
        if (!done) {
          Cor3CenterStore.onChanged.removeListener(listener);
          r();
        }
      }, 3e4);
    });
    renderAutoJobsTabs();
  });
  copyAllLogsBtn.addEventListener("click", async () => {
    if (copyAllLogsBtn.dataset.busy === "true") return;
    copyAllLogsBtn.dataset.busy = "true";
    copyAllLogsBtn.textContent = "\u23F3";
    copyAllLogsBtn.title = "Collecting logs...";
    const MAX_COPY_BYTES = 10 * 1024 * 1024;
    try {
      const storageKeys = ["autoJobsDebugLogs", "valuableDebugLogs", "cor3_errors"];
      const storageData = await Cor3CenterStore.get(storageKeys);
      const tab = await getCor3Tab();
      let wsLogs = [];
      let idbAutoJobLogs = [];
      let idbAutoValuableLogs = [];
      let idbErrorLogs = [];
      let idbPageConsoleLogs = [];
      let idbExtConsoleLogs = [];
      try {
        if (tab) {
          const results = await Cor3CenterUi.execute({
            target: { tabId: tab.id },
            func: () => {
              return new Promise((resolve) => {
                const req = indexedDB.open("cor3_ws_db");
                req.onsuccess = (e) => {
                  const db = e.target.result;
                  const result = { ws: [], autoJobs: [], autoValuable: [], errors: [], pageConsole: [], extConsole: [] };
                  const stores = [];
                  if (db.objectStoreNames.contains("messages")) stores.push("messages");
                  if (db.objectStoreNames.contains("logs")) stores.push("logs");
                  if (stores.length === 0) {
                    db.close();
                    resolve(result);
                    return;
                  }
                  const tx = db.transaction(stores, "readonly");
                  let pending = stores.length;
                  const done = () => {
                    if (--pending <= 0) {
                      resolve(result);
                      db.close();
                    }
                  };
                  if (stores.includes("messages")) {
                    const idx = tx.objectStore("messages").index("timestamp");
                    const cur = idx.openCursor();
                    cur.onsuccess = (ev) => {
                      const c = ev.target.result;
                      if (!c) {
                        done();
                        return;
                      }
                      result.ws.push({ timestamp: c.value.timestamp, direction: c.value.direction, message: c.value.message });
                      c.continue();
                    };
                    cur.onerror = () => done();
                  }
                  if (stores.includes("logs")) {
                    const idx2 = tx.objectStore("logs").index("timestamp");
                    const cur2 = idx2.openCursor();
                    cur2.onsuccess = (ev) => {
                      const c = ev.target.result;
                      if (!c) {
                        done();
                        return;
                      }
                      const v = c.value;
                      const entry = { timestamp: v.timestamp, level: v.level, message: v.message };
                      if (v.category === "auto-jobs") result.autoJobs.push(entry);
                      else if (v.category === "auto-valuable") result.autoValuable.push(entry);
                      else if (v.category === "error-logs") result.errors.push(entry);
                      else if (v.category === "page-console") result.pageConsole.push(entry);
                      else if (v.category === "ext-console") result.extConsole.push(entry);
                      c.continue();
                    };
                    cur2.onerror = () => done();
                  }
                };
                req.onerror = () => resolve({ ws: [], autoJobs: [], autoValuable: [], errors: [], pageConsole: [], extConsole: [] });
              });
            },
            args: []
          });
          if (results && results[0] && results[0].result) {
            const r = results[0].result;
            wsLogs = r.ws || [];
            idbAutoJobLogs = r.autoJobs || [];
            idbAutoValuableLogs = r.autoValuable || [];
            idbErrorLogs = r.errors || [];
            idbPageConsoleLogs = r.pageConsole || [];
            idbExtConsoleLogs = r.extConsole || [];
          }
        }
      } catch (e) {
        console.log("[COR3 Helper] Could not read logs from IndexedDB:", e);
      }
      const mergedAutoJobLogs = idbAutoJobLogs.length > 0 ? idbAutoJobLogs : storageData.autoJobsDebugLogs || [];
      const mergedAutoValuableLogs = idbAutoValuableLogs.length > 0 ? idbAutoValuableLogs : storageData.valuableDebugLogs || [];
      const mergedErrors = idbErrorLogs.length > 0 ? idbErrorLogs : storageData.cor3_errors || [];
      const payload = {
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        extensionVersion: chrome.runtime.getManifest().version,
        autoJobSolverLogs: mergedAutoJobLogs,
        autoValuableSellerLogs: mergedAutoValuableLogs,
        extensionErrors: mergedErrors,
        wsLogs,
        pageConsoleLogs: idbPageConsoleLogs,
        extensionConsoleLogs: idbExtConsoleLogs
      };
      let json = JSON.stringify(payload, null, 2);
      if (json.length > MAX_COPY_BYTES) {
        const trimmableKeys = ["wsLogs", "autoJobSolverLogs", "autoValuableSellerLogs", "extensionErrors", "pageConsoleLogs", "extensionConsoleLogs"];
        const getTs = (entry) => entry.timestamp || entry.ts || "";
        const allTs = [];
        for (const key of trimmableKeys) {
          const arr = payload[key];
          if (arr && arr.length > 0) allTs.push(getTs(arr[0]));
        }
        if (allTs.length > 0) {
          allTs.sort();
          let lo = allTs[0];
          let hi = (/* @__PURE__ */ new Date()).toISOString();
          for (let i = 0; i < 20 && json.length > MAX_COPY_BYTES; i++) {
            const loMs = new Date(lo).getTime();
            const hiMs = new Date(hi).getTime();
            const midMs = loMs + Math.floor((hiMs - loMs) / 2);
            const cutoff = new Date(midMs).toISOString();
            for (const key of trimmableKeys) {
              const arr = payload[key];
              if (!arr || arr.length === 0) continue;
              const idx = arr.findIndex((e) => getTs(e) >= cutoff);
              if (idx > 0) arr.splice(0, idx);
            }
            json = JSON.stringify(payload, null, 2);
            if (json.length > MAX_COPY_BYTES) lo = cutoff;
            else break;
          }
          while (json.length > MAX_COPY_BYTES) {
            let largest = null, largestLen = 0;
            for (const key of trimmableKeys) {
              if (payload[key] && payload[key].length > largestLen) {
                largest = key;
                largestLen = payload[key].length;
              }
            }
            if (!largest || largestLen <= 1) break;
            const removeCount = Math.max(1, Math.floor(largestLen * 0.3));
            payload[largest].splice(0, removeCount);
            json = JSON.stringify(payload, null, 2);
          }
        }
        console.log("[COR3 Helper] Trimmed logs to " + (json.length / 1024 / 1024).toFixed(2) + " MB");
      }
      const wrapped = "```json\n" + json + "\n```";
      await navigator.clipboard.writeText(wrapped);
      const sizeMB = (wrapped.length / 1024 / 1024).toFixed(1);
      copyAllLogsBtn.textContent = "\u2705";
      copyAllLogsBtn.title = "Logs copied (" + sizeMB + " MB)";
      setTimeout(() => {
        copyAllLogsBtn.textContent = "\u{1F4CB}";
        copyAllLogsBtn.title = "Copy all debug logs to clipboard";
        copyAllLogsBtn.dataset.busy = "false";
      }, 2e3);
    } catch (e) {
      console.log("[COR3 Helper] Copy all logs failed:", e);
      cor3LogError("popup.js", e, { action: "copyAllLogs" });
      copyAllLogsBtn.textContent = "\u274C";
      copyAllLogsBtn.title = "Failed to copy logs";
      setTimeout(() => {
        copyAllLogsBtn.textContent = "\u{1F4CB}";
        copyAllLogsBtn.title = "Copy all debug logs to clipboard";
        copyAllLogsBtn.dataset.busy = "false";
      }, 2e3);
    }
  });
  autoJobsStartBtn.addEventListener("click", async () => {
    if (autoJobsRunning) {
      autoJobsRunning = false;
      autoJobsStartBtn.textContent = t("\u25B6 Start Auto Jobs", "\u25B6 \u5F00\u59CB\u81EA\u52A8\u4EFB\u52A1");
      autoJobsStartBtn.className = "auto-jobs-btn-start start";
      addAutoJobLog("Auto Jobs stopped by user.", "warn");
      try {
        const tab = await getCor3Tab();
        if (tab) await Cor3CenterUi.send(tab.id, { action: "stopAutoJobs" });
      } catch (e) {
      }
      await Cor3CenterStore.set({ autoJobsRunning: false });
    } else {
      autoJobsRunning = true;
      autoJobsStartBtn.textContent = t("\u25A0 Stop Auto Jobs", "\u25A0 \u505C\u6B62\u81EA\u52A8\u4EFB\u52A1");
      autoJobsStartBtn.className = "auto-jobs-btn-start stop";
      const { marketData, darkMarketData, soyuzMarketData, usolMarketData } = await Cor3CenterStore.get(["marketData", "darkMarketData", "soyuzMarketData", "usolMarketData"]);
      const jobsToRun = [];
      const seenTakenJobIds = /* @__PURE__ */ new Set();
      for (const marketKey of ["home", "dark", "soyuz", "usol"]) {
        const md = marketKey === "home" ? marketData : marketKey === "dark" ? darkMarketData : marketKey === "usol" ? usolMarketData : soyuzMarketData;
        if (!md) continue;
        const selectedTypes = autoJobsSelectedTypes[marketKey] || [];
        if (selectedTypes.length === 0) continue;
        const openJobs = (md.jobs || []).filter((j) => !j.isCompleted && !j.isExpired && selectedTypes.includes(j.name));
        const takenJobs = (md.recentJobs || []).filter((j) => j.status === "TAKEN" && selectedTypes.includes(j.name));
        for (const job of openJobs) {
          const serverName = job.relatedServers && job.relatedServers[0] ? job.relatedServers[0].serverName : "None";
          const serverId = job.relatedServers && job.relatedServers[0] ? job.relatedServers[0].id : job.conditions && job.conditions.serverConfigId ? job.conditions.serverConfigId : null;
          jobsToRun.push({
            jobId: job.id,
            name: job.name,
            type: job.name,
            serverName,
            serverId,
            marketId: MARKET_IDS2[marketKey],
            marketKey,
            rewardCredits: job.rewardCredits,
            rewardReputation: job.rewardReputation,
            deposit: job.deposit || 0,
            conditions: job.conditions ? job.conditions.items || job.conditions : [],
            alreadyTaken: false,
            canComplete: false,
            status: "pending"
          });
        }
        for (const job of takenJobs) {
          if (seenTakenJobIds.has(job.id)) continue;
          seenTakenJobIds.add(job.id);
          const trueMarketKey = resolveRecentJobMarket(job, marketKey, { marketData, darkMarketData, soyuzMarketData, usolMarketData });
          const serverName = job.relatedServers && job.relatedServers[0] ? job.relatedServers[0].serverName : "None";
          const serverId = job.relatedServers && job.relatedServers[0] ? job.relatedServers[0].id : job.conditions && job.conditions.serverConfigId ? job.conditions.serverConfigId : null;
          if (!selectedTypes.includes(job.name) && trueMarketKey !== marketKey) continue;
          jobsToRun.push({
            jobId: job.id,
            name: job.name,
            type: job.name,
            serverName,
            serverId,
            marketId: MARKET_IDS2[trueMarketKey],
            marketKey: trueMarketKey,
            rewardCredits: job.rewardCredits,
            rewardReputation: job.rewardReputation,
            deposit: job.deposit || 0,
            conditions: job.conditions ? job.conditions.items || job.conditions : [],
            alreadyTaken: true,
            canComplete: !!job.canComplete,
            status: "pending"
          });
        }
      }
      jobsToRun.sort((a, b) => {
        const sp = getServerPriority(a.serverName) - getServerPriority(b.serverName);
        if (sp !== 0) return sp;
        return getJobTypePriority(a.type || a.name) - getJobTypePriority(b.type || b.name);
      });
      if (jobsToRun.length === 0) {
        addAutoJobLog("No jobs selected or available to run.", "warn");
        autoJobsRunning = false;
        autoJobsStartBtn.textContent = t("\u25B6 Start Auto Jobs", "\u25B6 \u5F00\u59CB\u81EA\u52A8\u4EFB\u52A1");
        autoJobsStartBtn.className = "auto-jobs-btn-start start";
        return;
      }
      const newJobIds = new Set(jobsToRun.map((j) => j.jobId));
      const previousJobs = autoJobsTracker.filter(
        (j) => !newJobIds.has(j.jobId) && (j.status === "done" || j.status === "failed")
      );
      autoJobsTracker = [...previousJobs, ...jobsToRun];
      renderDebugJobs();
      addAutoJobLog(`Starting auto jobs: ${jobsToRun.length} job(s) queued.`, "info");
      await Cor3CenterStore.set({ autoJobsRunning: true, autoJobsQueue: jobsToRun, autoJobsTracker });
      try {
        const tab = await getCor3Tab();
        if (tab) {
          await Cor3CenterUi.send(tab.id, {
            action: "startAutoJobs",
            jobs: jobsToRun,
            settings: {}
          });
        }
      } catch (e) {
        addAutoJobLog("Failed to send auto jobs to content script: " + e.message, "error");
      }
    }
  });
  Cor3CenterStore.get("autoJobsDebugConsoleEnabled", (data) => {
    const enabled = !!data.autoJobsDebugConsoleEnabled;
    autoJobsDebugToggle.checked = enabled;
    autoJobsDebugConsole.style.display = enabled ? "" : "none";
    if (enabled) {
      renderDebugJobs();
      renderDebugLogs();
    }
  });
  autoJobsDebugToggle.addEventListener("change", () => {
    const enabled = autoJobsDebugToggle.checked;
    Cor3CenterStore.set({ autoJobsDebugConsoleEnabled: enabled });
    autoJobsDebugConsole.style.display = enabled ? "" : "none";
    if (enabled) {
      renderDebugJobs();
      renderDebugLogs();
    }
  });
  debugTabJobs.addEventListener("click", () => {
    debugTabJobs.classList.add("active");
    debugTabLogs.classList.remove("active");
    debugJobsBody.classList.add("active");
    debugLogsBody.classList.remove("active");
  });
  debugTabLogs.addEventListener("click", () => {
    debugTabLogs.classList.add("active");
    debugTabJobs.classList.remove("active");
    debugLogsBody.classList.add("active");
    debugJobsBody.classList.remove("active");
  });
  function normalizeAutoFinishAllJobTypes(value) {
    const valid = Array.isArray(value) ? SUPPORTED_JOB_TYPES.filter((type) => value.includes(type)) : [];
    return Array.isArray(value) ? valid : [...SUPPORTED_JOB_TYPES];
  }
  function updateAutoFinishAllTypesCount() {
    if (!autoFinishAllTypesCount) return;
    const n = normalizeAutoFinishAllJobTypes(autoFinishAllJobTypes).length;
    autoFinishAllTypesCount.textContent = t(
      `${n}/${SUPPORTED_JOB_TYPES.length} types enabled`,
      `\u5DF2\u542F\u7528 ${n}/${SUPPORTED_JOB_TYPES.length} \u79CD\u7C7B\u578B`
    );
  }
  function getAutoFinishAllTypeCheckboxes() {
    return [...autoFinishAllTypesList.querySelectorAll("input[data-auto-finish-job-type]")];
  }
  function renderAutoFinishAllTypes() {
    if (!autoFinishAllTypesList) return;
    const frag = document.createDocumentFragment();
    const checkboxes = [];
    for (const typeName of SUPPORTED_JOB_TYPES) {
      const row = document.createElement("div");
      row.className = "auto-jobs-type-row";
      const label = document.createElement("span");
      label.className = "job-type-label";
      label.textContent = typeName;
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.dataset.autoFinishJobType = typeName;
      cb.checked = autoFinishAllJobTypes.includes(typeName);
      cb.addEventListener("change", () => {
        saveAutoFinishAllTypes();
        updateSelectAllState(autoFinishAllTypesSelectAll, checkboxes);
      });
      row.append(label, cb);
      frag.appendChild(row);
      checkboxes.push(cb);
    }
    autoFinishAllTypesList.replaceChildren(frag);
    updateSelectAllState(autoFinishAllTypesSelectAll, checkboxes);
    updateAutoFinishAllTypesCount();
  }
  function saveAutoFinishAllTypes() {
    autoFinishAllJobTypes = getAutoFinishAllTypeCheckboxes().filter((cb) => cb.checked).map((cb) => cb.dataset.autoFinishJobType);
    Cor3CenterStore.set({ [AUTO_FINISH_ALL_JOB_TYPES_KEY]: autoFinishAllJobTypes });
    updateAutoFinishAllTypesCount();
    Cor3CenterUi.command({ action: "scheduleAutoFinishAll" }).catch(() => {
    });
  }
  function updateAutoFinishAllTypesVisibility(enabled) {
    if (autoFinishAllTypesDetails) autoFinishAllTypesDetails.style.display = enabled ? "" : "none";
  }
  autoFinishAllTypesSelectAll.addEventListener("change", () => {
    const checked = autoFinishAllTypesSelectAll.checked;
    getAutoFinishAllTypeCheckboxes().forEach((cb) => {
      cb.checked = checked;
    });
    autoFinishAllTypesSelectAll.indeterminate = false;
    saveAutoFinishAllTypes();
  });
  Cor3CenterStore.get(AUTO_FINISH_ALL_JOB_TYPES_KEY, (data) => {
    autoFinishAllJobTypes = normalizeAutoFinishAllJobTypes(data[AUTO_FINISH_ALL_JOB_TYPES_KEY]);
    renderAutoFinishAllTypes();
  });
  onLangChange(updateAutoFinishAllTypesCount);
  Cor3CenterStore.get("autoFinishAllJobsEnabled", (data) => {
    autoFinishAllActive = !!data.autoFinishAllJobsEnabled;
    autoFinishAllJobsToggle.checked = autoFinishAllActive;
    updateAutoFinishAllTypesVisibility(autoFinishAllActive);
  });
  autoFinishAllJobsToggle.addEventListener("change", async () => {
    autoFinishAllActive = autoFinishAllJobsToggle.checked;
    await Cor3CenterStore.set({ autoFinishAllJobsEnabled: autoFinishAllActive });
    updateAutoFinishAllTypesVisibility(autoFinishAllActive);
    if (autoFinishAllActive) {
      addAutoJobLog("\u{1F504} Auto Finish All Jobs enabled", "info");
    } else {
      addAutoJobLog("\u{1F504} Auto Finish All Jobs disabled", "warn");
    }
    Cor3CenterUi.command({ action: "scheduleAutoFinishAll" }).catch(() => {
    });
  });
  async function dismissFailedJobsForMarket(marketKey, btn) {
    const storageKey = { home: "marketData", dark: "darkMarketData", soyuz: "soyuzMarketData", usol: "usolMarketData" }[marketKey];
    const data = await Cor3CenterStore.get(storageKey);
    const md = data[storageKey];
    if (!md || !md.recentJobs) return;
    const failedJobs = md.recentJobs.filter((j) => j.status === "FAILED");
    if (failedJobs.length === 0) return;
    const marketId = MARKET_IDS2[marketKey];
    if (!marketId) return;
    const tab = await getCor3Tab();
    if (!tab) return;
    const dismissList = failedJobs.map((j) => ({ marketId, jobId: j.id }));
    let resp;
    try {
      resp = await Cor3CenterUi.send(tab.id, {
        action: "dismissFailedJobs",
        jobs: dismissList,
        marketKey
      });
    } catch (e) {
      console.log("[COR3 Helper] dismissFailedJobs sendMessage error:", e);
      return;
    }
    if (resp && (resp.queueResult === "queued" || resp.queueResult === "already-running")) {
      const activeType = resp.queueStatus && resp.queueStatus.active ? resp.queueStatus.active : "another automation";
      const friendlyNames = { "auto-jobs": "Auto Job Solver", "auto-valuable": "Auto Valuable Seller", "auto-update-markets": "Auto Update Markets", "auto-send": "Mercenary Auto Expedition", "clear-failed-jobs": "Clear Failed Jobs" };
      const activeName = friendlyNames[activeType] || activeType;
      if (btn) {
        btn.title = 'Delayed \u2014 waiting for "' + activeName + '" to finish';
        btn.style.cursor = "help";
      }
    }
    while (true) {
      await new Promise((r) => setTimeout(r, 1500));
      const qs = await Cor3CenterStore.get("automationQueueStatus");
      const status = qs.automationQueueStatus || {};
      if (status.active !== "clear-failed-jobs" && !(status.queued || []).includes("clear-failed-jobs")) break;
    }
    addAutoJobLog(`\u{1F9F9} Dismissed ${failedJobs.length} failed job(s) from ${marketKey} market`, "info");
  }
  ["home", "dark", "soyuz", "usol"].forEach((key) => {
    const btnId = { home: "cleanupCoreMarketBtn", dark: "cleanupDarkMarketBtn", soyuz: "cleanupSoyuzMarketBtn", usol: "cleanupUsolMarketBtn" }[key];
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "\u23F3";
        const origTitle = btn.title;
        try {
          await dismissFailedJobsForMarket(key, btn);
        } catch (e) {
          console.log("[COR3 Helper] Cleanup error:", e);
          cor3LogError("popup.js", e, { action: "dismissFailedJobs", market: key });
        }
        btn.disabled = false;
        btn.textContent = "\u{1F9F9}";
        btn.title = origTitle;
        btn.style.cursor = "";
      });
    }
  });
  function addAutoJobLog(msg, level = "info") {
    autoJobsDebugLogs.push({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), msg, level });
    if (autoJobsDebugLogs.length > AUTO_JOBS_MAX_LOGS) {
      autoJobsDebugLogs.shift();
    }
    renderDebugLogs();
    Cor3CenterStore.set({ autoJobsDebugLogs });
  }
  function formatLocalLogTime(ts) {
    if (!ts) return "";
    var date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts).slice(11, 19);
    return date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  function renderDebugLogs() {
    if (autoJobsDebugLogs.length === 0) {
      debugLogsBody.replaceChildren(_h("div", { style: "color:var(--text-dim);" }, t("No logs yet.", "\u6682\u65E0\u65E5\u5FD7\u3002")));
      return;
    }
    const frag = document.createDocumentFragment();
    for (const log of autoJobsDebugLogs) {
      const row = document.createElement("div");
      let levelClass = "";
      if (log.level === "error") levelClass = " log-error";
      else if (log.level === "success") levelClass = " log-success";
      else if (log.level === "warn") levelClass = " log-warn";
      row.className = "debug-log-row" + levelClass;
      const displayTime = formatLocalLogTime(log.timestamp) || log.time || "";
      row.appendChild(_h("span", { className: "log-time" }, "[" + displayTime + "]"));
      row.appendChild(document.createTextNode(" " + log.msg));
      frag.appendChild(row);
    }
    debugLogsBody.replaceChildren(frag);
    debugLogsBody.scrollTop = debugLogsBody.scrollHeight;
  }
  var _renderDebugJobsId = 0;
  async function renderDebugJobs() {
    const renderId = ++_renderDebugJobsId;
    const storageData = await Cor3CenterStore.get(["autoJobsCompletedResults", "marketData", "darkMarketData", "soyuzMarketData", "usolMarketData", "autoJobsTracker"]);
    if (renderId !== _renderDebugJobsId) return;
    const { autoJobsCompletedResults, marketData, darkMarketData, soyuzMarketData, usolMarketData } = storageData;
    if (storageData.autoJobsTracker) {
      autoJobsTracker = storageData.autoJobsTracker;
    }
    const completedMap = {};
    if (autoJobsCompletedResults) {
      for (const cj of autoJobsCompletedResults) {
        completedMap[cj.jobId] = cj;
      }
    }
    const trackerMap = {};
    for (const tj of autoJobsTracker) {
      trackerMap[tj.jobId] = tj;
    }
    const marketSources = [
      { key: "home", label: () => ["\u{1F3E0} HOME"], data: marketData },
      { key: "dark", label: () => ["\u{1F311} D4RK"], data: darkMarketData },
      { key: "soyuz", label: () => [_h("span", { style: "color:#c33b3b;margin-left:2px;margin-right:2px" }, "\u262D"), " SOYUZ"], data: soyuzMarketData },
      { key: "usol", label: () => [_h("span", { style: "color:#2592A7;margin-right:2px" }, "\u262E"), " USOL"], data: usolMarketData }
    ];
    let hasAny = false;
    const frag = document.createDocumentFragment();
    for (const ms of marketSources) {
      let resolveStatus = function(jobId, fallbackStatus) {
        const completed = completedMap[jobId];
        if (completed) return { status: completed.status, reward: completed.reward, error: completed.error, lockExpiresAt: completed.lockExpiresAt || null, maintenanceEndsAt: completed.maintenanceEndsAt || null };
        const tracked = trackerMap[jobId];
        if (tracked && tracked.status && tracked.status !== "pending") {
          return { status: tracked.status, reward: tracked.reward || null, error: tracked.error || null, lockExpiresAt: tracked.lockExpiresAt || null, maintenanceEndsAt: tracked.maintenanceEndsAt || null };
        }
        return { status: fallbackStatus, reward: tracked && tracked.reward || null, error: tracked && tracked.error || null, lockExpiresAt: tracked && tracked.lockExpiresAt || null, maintenanceEndsAt: tracked && tracked.maintenanceEndsAt || null };
      };
      const allJobs = [];
      const seenIds = /* @__PURE__ */ new Set();
      if (ms.data && ms.data.jobs) {
        for (const j of ms.data.jobs) {
          if (j.isCompleted || j.isExpired) continue;
          const sn = j.relatedServers && j.relatedServers[0] ? j.relatedServers[0].serverName : "None";
          const resolved = resolveStatus(j.id, "open");
          allJobs.push({ id: j.id, name: j.name, type: j.jobType || j.name, serverName: sn, status: resolved.status, reward: resolved.reward, error: resolved.error, lockExpiresAt: resolved.lockExpiresAt, maintenanceEndsAt: resolved.maintenanceEndsAt });
          seenIds.add(j.id);
        }
      }
      if (ms.data && ms.data.recentJobs) {
        for (const j of ms.data.recentJobs) {
          if (j.status !== "TAKEN" && j.status !== "COMPLETED" || seenIds.has(j.id)) continue;
          const sn = j.relatedServers && j.relatedServers[0] ? j.relatedServers[0].serverName : "None";
          const marketStatus = j.status === "COMPLETED" ? "done" : "in-progress";
          const resolved = resolveStatus(j.id, marketStatus);
          allJobs.push({ id: j.id, name: j.name, type: j.jobType || j.name, serverName: sn, status: resolved.status, reward: resolved.reward, error: resolved.error, lockExpiresAt: resolved.lockExpiresAt, maintenanceEndsAt: resolved.maintenanceEndsAt });
          seenIds.add(j.id);
        }
      }
      for (const tj of autoJobsTracker) {
        if ((tj.marketKey || "home") !== ms.key || seenIds.has(tj.jobId)) continue;
        const resolved = resolveStatus(tj.jobId, tj.status === "pending" ? "open" : tj.status || "open");
        allJobs.push({ id: tj.jobId, name: tj.name, type: tj.type || tj.name, serverName: tj.serverName || "None", status: resolved.status, reward: resolved.reward, error: resolved.error, lockExpiresAt: resolved.lockExpiresAt, maintenanceEndsAt: resolved.maintenanceEndsAt });
        seenIds.add(tj.jobId);
      }
      if (autoJobsCompletedResults) {
        for (const cj of autoJobsCompletedResults) {
          if (cj.marketKey !== ms.key || seenIds.has(cj.jobId)) continue;
          allJobs.push({
            id: cj.jobId,
            name: cj.name,
            type: cj.type || cj.name,
            serverName: cj.serverName || "None",
            status: cj.status,
            reward: cj.reward,
            error: cj.error,
            lockExpiresAt: cj.lockExpiresAt || null,
            maintenanceEndsAt: cj.maintenanceEndsAt || null
          });
          seenIds.add(cj.jobId);
        }
      }
      if (allJobs.length === 0) continue;
      hasAny = true;
      allJobs.sort((a, b) => {
        const sp = getServerPriority(a.serverName) - getServerPriority(b.serverName);
        if (sp !== 0) return sp;
        return getJobTypePriority(a.type || a.name) - getJobTypePriority(b.type || b.name);
      });
      const group = document.createElement("div");
      group.className = "debug-market-group";
      const title = document.createElement("div");
      title.className = "debug-market-group-title";
      title.replaceChildren(...ms.label(), " (" + allJobs.length + ")");
      group.appendChild(title);
      for (const job of allJobs) {
        group.appendChild(createDebugJobRow(job));
      }
      frag.appendChild(group);
    }
    if (!hasAny) {
      const empty = document.createElement("div");
      empty.style.color = "var(--text-dim)";
      empty.textContent = t("No job data yet.", "\u6682\u65E0\u4EFB\u52A1\u6570\u636E\u3002");
      frag.appendChild(empty);
    }
    debugJobsBody.replaceChildren(frag);
  }
  function createDebugJobRow(job) {
    const row = document.createElement("div");
    row.className = "debug-job-row";
    const statusEl2 = document.createElement("span");
    let st = job.status || "open";
    if (st === "open" && isJobBugged(job)) st = "bugged";
    statusEl2.className = "debug-job-status " + st;
    statusEl2.textContent = st.toUpperCase();
    if (job.lockExpiresAt || job.maintenanceEndsAt) {
      const expiryDate = job.lockExpiresAt || job.maintenanceEndsAt;
      const label = job.lockExpiresAt ? "Minigame lock" : "Maintenance";
      const diff = new Date(expiryDate).getTime() - Date.now();
      const mins = diff > 0 ? Math.ceil(diff / 6e4) : 0;
      statusEl2.title = mins > 0 ? `${label} (~${mins}m remaining)` : `${label} (expired)`;
      statusEl2.style.cursor = "help";
    } else if (job.error) {
      statusEl2.title = job.error;
      statusEl2.style.cursor = "help";
    }
    row.appendChild(statusEl2);
    const info = document.createElement("span");
    info.style.cssText = "font-size:10px;color:var(--text-secondary);flex:1;";
    info.textContent = `${job.name} \u2014 ${job.serverName}`;
    row.appendChild(info);
    if (job.status === "failed" || job.status === "skipped") {
      const penaltyVal = job.reputationPenalty || job.reward && job.reward.deposit || job.deposit || 0;
      if (penaltyVal > 0) {
        const penEl = document.createElement("span");
        penEl.style.cssText = "font-size:9px;color:var(--accent-red, #f38ba8);white-space:nowrap;";
        penEl.textContent = `-${penaltyVal}`;
        row.appendChild(penEl);
      }
    } else if (job.reward) {
      const rewardEl = document.createElement("span");
      rewardEl.style.cssText = "font-size:9px;color:var(--accent-green);white-space:nowrap;";
      const dep = job.reward.deposit ? ` (-${job.reward.deposit})` : "";
      rewardEl.textContent = `\u{1F4B0}${job.reward.credits}${dep} \u2B50${job.reward.reputation || 0} \u{1F3C5}${job.reward.renown || 0}`;
      row.appendChild(rewardEl);
    }
    return row;
  }
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes[AUTO_FINISH_ALL_JOB_TYPES_KEY]) {
        const next = normalizeAutoFinishAllJobTypes(changes[AUTO_FINISH_ALL_JOB_TYPES_KEY].newValue);
        if (next.join("|") !== normalizeAutoFinishAllJobTypes(autoFinishAllJobTypes).join("|")) {
          autoFinishAllJobTypes = next;
          renderAutoFinishAllTypes();
        }
      }
      if (changes.autoFinishAllJobsEnabled) {
        autoFinishAllActive = !!changes.autoFinishAllJobsEnabled.newValue;
        autoFinishAllJobsToggle.checked = autoFinishAllActive;
        updateAutoFinishAllTypesVisibility(autoFinishAllActive);
      }
      return;
    }
    if (area !== "local") return;
    if (changes.autoJobsTracker) {
      autoJobsTracker = changes.autoJobsTracker.newValue || [];
      renderDebugJobs();
    }
    if (changes.autoJobsDebugLogs) {
      const newLogs = changes.autoJobsDebugLogs.newValue;
      if (Array.isArray(newLogs)) {
        autoJobsDebugLogs = newLogs;
        renderDebugLogs();
      }
    }
    if (changes.autoJobsRunning) {
      const running = changes.autoJobsRunning.newValue;
      autoJobsRunning = !!running;
      if (autoJobsRunning) {
        autoJobsStartBtn.textContent = t("\u25A0 Stop Auto Jobs", "\u25A0 \u505C\u6B62\u81EA\u52A8\u4EFB\u52A1");
        autoJobsStartBtn.className = "auto-jobs-btn-start stop";
      } else {
        autoJobsStartBtn.textContent = t("\u25B6 Start Auto Jobs", "\u25B6 \u5F00\u59CB\u81EA\u52A8\u4EFB\u52A1");
        autoJobsStartBtn.className = "auto-jobs-btn-start start";
      }
    }
    if (changes.marketData || changes.darkMarketData || changes.soyuzMarketData || changes.usolMarketData) {
      const now = Date.now();
      const checkReset = (change, marketKey) => {
        if (!change) return false;
        const oldReset = change.oldValue && change.oldValue.nextJobsResetAt;
        const newReset = change.newValue && change.newValue.nextJobsResetAt;
        if (!newReset) return false;
        if (oldReset) {
          const oldMs = new Date(oldReset).getTime();
          const newMs = new Date(newReset).getTime();
          if (newMs - oldMs > 6e4) return true;
          const cycleDuration = MARKET_RESET_DURATIONS_MS[marketKey] || 0;
          if (oldMs < now && cycleDuration > 0 && now - oldMs < cycleDuration) return true;
        }
        return false;
      };
      const homeReset = checkReset(changes.marketData, "home");
      const darkReset = checkReset(changes.darkMarketData, "dark");
      const soyuzReset = checkReset(changes.soyuzMarketData, "soyuz");
      const usolReset = checkReset(changes.usolMarketData, "usol");
      if (homeReset || darkReset || soyuzReset || usolReset) {
        const resetMarkets = [homeReset && "HOME", darkReset && "D4RK", soyuzReset && "SOYUZ", usolReset && "USOL"].filter(Boolean).join(", ");
        addAutoJobLog("Job reset detected (" + resetMarkets + ") \u2014 clearing old tracker/results", "info");
        autoJobsTracker = autoJobsTracker.filter((j) => {
          if (homeReset && (j.marketKey || "home") === "home") return false;
          if (darkReset && j.marketKey === "dark") return false;
          if (soyuzReset && j.marketKey === "soyuz") return false;
          if (usolReset && j.marketKey === "usol") return false;
          return true;
        });
        Cor3CenterStore.get("autoJobsCompletedResults", (result) => {
          let cr = Array.isArray(result.autoJobsCompletedResults) ? result.autoJobsCompletedResults : [];
          if (homeReset) cr = cr.filter((j) => j.marketKey !== "home");
          if (darkReset) cr = cr.filter((j) => j.marketKey !== "dark");
          if (soyuzReset) cr = cr.filter((j) => j.marketKey !== "soyuz");
          if (usolReset) cr = cr.filter((j) => j.marketKey !== "usol");
          Cor3CenterStore.set({ autoJobsCompletedResults: cr, autoJobsTracker });
          if (autoJobSolverToggle.checked) renderAutoJobsTabs();
          if (autoJobsDebugToggle.checked) renderDebugJobs();
        });
      } else {
        if (autoJobSolverToggle.checked) renderAutoJobsTabs();
        if (autoJobsDebugToggle.checked) renderDebugJobs();
      }
    }
    if (changes.autoJobsCompletedResults) {
      if (autoJobsDebugToggle.checked) {
        renderDebugJobs();
      }
    }
    if (changes.darkMarketAvailable || changes.soyuzMarketAvailable || changes.usolMarketAvailable || changes.serverMaintenanceMap) {
      if (autoJobSolverToggle.checked) renderAutoJobsTabs();
    }
  });
  Cor3CenterStore.get(["autoJobsDebugLogs", "autoJobsTracker", "autoJobsRunning"], (data) => {
    if (data.autoJobsDebugLogs) {
      autoJobsDebugLogs = data.autoJobsDebugLogs;
      renderDebugLogs();
    }
    if (data.autoJobsTracker) {
      autoJobsTracker = data.autoJobsTracker;
      renderDebugJobs();
    }
    if (data.autoJobsRunning) {
      autoJobsRunning = true;
      autoJobsStartBtn.textContent = t("\u25A0 Stop Auto Jobs", "\u25A0 \u505C\u6B62\u81EA\u52A8\u4EFB\u52A1");
      autoJobsStartBtn.className = "auto-jobs-btn-start stop";
    }
  });

  // src/popup/auto-valuable-seller-ui.js
  var valuableToggle = document.getElementById("autoValuableSellerToggle");
  var valuableStatus = document.getElementById("autoValuableSellerStatus");
  var valuableSection = document.getElementById("autoValuableSellerSection");
  var valuableTabServers = document.getElementById("valuableTabServers");
  var valuableTabDownloads = document.getElementById("valuableTabDownloads");
  var valuableTabMaintenance = document.getElementById("valuableTabMaintenance");
  var valuableContentServers = document.getElementById("valuableContentServers");
  var valuableContentDownloads = document.getElementById("valuableContentDownloads");
  var valuableContentMaintenance = document.getElementById("valuableContentMaintenance");
  var valuableSellerBtn = document.getElementById("valuableSellerBtn");
  var valuableSearchBtn = document.getElementById("valuableSearchBtn");
  var valuableDebugToggle = document.getElementById("valuableDebugToggle");
  var valuableDebugConsole = document.getElementById("valuableDebugConsole");
  var valuableDebugLogsBody = document.getElementById("valuableDebugLogsBody");
  var valuableSearchRunning = false;
  var valuableSellerRunning = false;
  var valuableDebugLogs = [];
  var VALUABLE_MAX_LOGS = 200;
  function updateValuableStatus(enabled) {
    valuableStatus.textContent = enabled ? "Active" : "Off";
    valuableStatus.style.color = enabled ? "var(--accent-green)" : "var(--text-dim)";
    valuableSection.style.display = enabled ? "" : "none";
    var card = valuableSection.closest(".popout-card");
    if (card) card.style.display = enabled ? "" : "none";
  }
  Cor3CenterStore.get("autoValuableSellerEnabled", (data) => {
    const enabled = !!data.autoValuableSellerEnabled;
    valuableToggle.checked = enabled;
    updateValuableStatus(enabled);
    if (enabled) renderValuableTabs();
  });
  valuableToggle.addEventListener("change", async () => {
    const enabled = valuableToggle.checked;
    await Cor3CenterStore.set({ autoValuableSellerEnabled: enabled });
    updateValuableStatus(enabled);
    if (enabled) renderValuableTabs();
  });
  function switchValuableTab(tab) {
    valuableTabServers.classList.toggle("active", tab === "servers");
    valuableTabDownloads.classList.toggle("active", tab === "downloads");
    valuableTabMaintenance.classList.toggle("active", tab === "maintenance");
    valuableContentServers.classList.toggle("active", tab === "servers");
    valuableContentDownloads.classList.toggle("active", tab === "downloads");
    valuableContentMaintenance.classList.toggle("active", tab === "maintenance");
  }
  valuableTabServers.addEventListener("click", () => switchValuableTab("servers"));
  valuableTabDownloads.addEventListener("click", () => switchValuableTab("downloads"));
  valuableTabMaintenance.addEventListener("click", () => switchValuableTab("maintenance"));
  async function renderValuableTabs() {
    const data = await Cor3CenterStore.get(["valuableServersData", "valuableDownloadsData", "valuableMaintenanceData"]);
    renderValuableServers(data.valuableServersData);
    renderValuableDownloads(data.valuableDownloadsData);
    renderValuableMaintenance(data.valuableMaintenanceData);
  }
  function renderValuableServers(data) {
    _clearEl(valuableContentServers);
    if (!data || !data.servers || data.servers.length === 0) {
      valuableContentServers.replaceChildren(_h("div", { className: "auto-jobs-no-jobs" }, t('No valuable data yet. Click "Start Valuable Search" to scan servers.', "\u6682\u65E0\u8D35\u91CD\u7269\u54C1\u6570\u636E\u3002\u70B9\u51FB\u201C\u5F00\u59CB\u641C\u7D22\u8D35\u91CD\u7269\u54C1\u201D\u626B\u63CF\u670D\u52A1\u5668\u3002")));
      return;
    }
    const selectAllDiv = document.createElement("div");
    selectAllDiv.className = "auto-valuable-seller-select-all";
    const selectAllCb = document.createElement("input");
    selectAllCb.type = "checkbox";
    selectAllCb.id = "valuableSelectAllServers";
    const selectAllLabel = document.createElement("label");
    selectAllLabel.className = "job-type-label";
    selectAllLabel.setAttribute("for", selectAllCb.id);
    selectAllLabel.textContent = t("Select All Results", "\u5168\u9009\u7ED3\u679C");
    const selectAllCount = document.createElement("span");
    selectAllCount.className = "job-type-count";
    selectAllCount.textContent = `(${data.servers.length} servers)`;
    selectAllDiv.appendChild(selectAllLabel);
    selectAllDiv.appendChild(selectAllCount);
    selectAllDiv.appendChild(selectAllCb);
    valuableContentServers.appendChild(selectAllDiv);
    const checkboxes = [];
    for (const server of data.servers) {
      const row = document.createElement("div");
      row.className = "valuable-server-row";
      const header = document.createElement("div");
      header.className = "valuable-server-header";
      const arrow = document.createElement("span");
      arrow.className = "expand-arrow";
      arrow.textContent = "\u25B6";
      const nameSpan = document.createElement("span");
      nameSpan.className = "server-name";
      nameSpan.textContent = server.name;
      const countSpan = document.createElement("span");
      countSpan.className = "valuable-count";
      const totalValuables = (server.files || []).length + (server.logs || []).length;
      countSpan.textContent = `(${totalValuables})`;
      const statusSpan = document.createElement("span");
      const statusClass = (server.status || "open").toLowerCase().replace(/\s+/g, "-");
      statusSpan.className = "valuable-status " + statusClass;
      statusSpan.textContent = (server.status || "OPEN").toUpperCase();
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.dataset.serverId = server.id;
      cb.checked = !!server.selected;
      cb.addEventListener("change", () => {
        updateValuableServerSelection();
        updateSelectAllState(selectAllCb, checkboxes);
      });
      checkboxes.push(cb);
      header.appendChild(arrow);
      header.appendChild(nameSpan);
      header.appendChild(countSpan);
      header.appendChild(statusSpan);
      header.appendChild(cb);
      const detailDiv = document.createElement("div");
      detailDiv.className = "valuable-detail-table";
      if (totalValuables > 0) {
        let tableHtml = "<table><tr><th>Type</th><th>Name</th><th>Tags</th><th>Base Price</th><th>Detect Rate</th></tr>";
        for (const f of server.files || []) {
          const tags = (f.tags || []).map((t2) => t2.label || t2.key || t2).join(", ");
          tableHtml += `<tr><td>\u{1F4C4} File</td><td>${f.name || "\u2014"}</td><td>${tags || "\u2014"}</td><td>${f.basePrice || 0}</td><td>${f.detectRate || 0}</td></tr>`;
        }
        for (const l of server.logs || []) {
          const tags = (l.tags || []).map((t2) => t2.label || t2.key || t2).join(", ");
          tableHtml += `<tr><td>\u{1F4CB} Log</td><td>${l.message || "\u2014"}</td><td>${tags || "\u2014"}</td><td>${l.basePrice || 0}</td><td>${l.detectRate || 0}</td></tr>`;
        }
        tableHtml += "</table>";
        _safeSetHtml(detailDiv, tableHtml);
      }
      header.addEventListener("click", (e) => {
        if (e.target.tagName === "INPUT") return;
        arrow.classList.toggle("open");
        detailDiv.classList.toggle("open");
      });
      row.appendChild(header);
      row.appendChild(detailDiv);
      valuableContentServers.appendChild(row);
    }
    selectAllCb.addEventListener("change", () => {
      for (const cb of checkboxes) cb.checked = selectAllCb.checked;
      updateValuableServerSelection();
    });
    updateSelectAllState(selectAllCb, checkboxes);
  }
  var VALUABLE_SERVER_PATH_LENGTHS = {
    "RM7-E1L3": 1,
    "RM7-E1L5": 1,
    "RM7-E1L2CT": 2,
    "RM7-E1SCP": 2,
    "RM7-N2ECP": 2,
    "RM7-S4L4": 3,
    "D4RK RM7CE": 3,
    "RM7-N2L2": 3,
    "RM7-S4L2": 3,
    "B43271N": 3,
    "RM7-N2L3": 4,
    "RM7-S4L3": 4,
    "RM7-S4L1": 4,
    "RM7-S4WCP": 4,
    "B43272N": 4,
    "RM7-W3NCP": 5,
    "URM7-S5L2": 5,
    "URM7-H": 5,
    "D4RK RM7EG": 5,
    "RM7-N1L1": 6,
    "URM7-M": 6,
    "B43274N": 6
  };
  function renderValuableDownloads(data) {
    _clearEl(valuableContentDownloads);
    if (!data || !data.files || data.files.length === 0) {
      valuableContentDownloads.replaceChildren(_h("div", { className: "auto-jobs-no-jobs" }, t('No download data yet. Click "Start Valuable Search" to scan.', "\u6682\u65E0\u4E0B\u8F7D\u6570\u636E\u3002\u70B9\u51FB\u201C\u5F00\u59CB\u641C\u7D22\u8D35\u91CD\u7269\u54C1\u201D\u626B\u63CF\u3002")));
      return;
    }
    const selectAllDiv = document.createElement("div");
    selectAllDiv.className = "auto-valuable-seller-select-all";
    const selectAllCb = document.createElement("input");
    selectAllCb.type = "checkbox";
    selectAllCb.id = "valuableSelectAllDownloads";
    const selectAllLabel = document.createElement("label");
    selectAllLabel.className = "job-type-label";
    selectAllLabel.setAttribute("for", selectAllCb.id);
    selectAllLabel.textContent = t("Select All Results", "\u5168\u9009\u7ED3\u679C");
    const selectAllCount = document.createElement("span");
    selectAllCount.className = "job-type-count";
    selectAllCount.textContent = `(${data.files.length} files)`;
    selectAllDiv.appendChild(selectAllLabel);
    selectAllDiv.appendChild(selectAllCount);
    selectAllDiv.appendChild(selectAllCb);
    valuableContentDownloads.appendChild(selectAllDiv);
    const checkboxes = [];
    const serverGroups = {};
    for (const file of data.files) {
      const source = file.source || "\u2014";
      if (!serverGroups[source]) serverGroups[source] = [];
      serverGroups[source].push(file);
    }
    const sortedSources = Object.keys(serverGroups).sort((a, b) => {
      const lenA = VALUABLE_SERVER_PATH_LENGTHS[a] || 99;
      const lenB = VALUABLE_SERVER_PATH_LENGTHS[b] || 99;
      return lenB - lenA;
    });
    for (const source of sortedSources) {
      const groupFiles = serverGroups[source];
      const groupDiv = document.createElement("div");
      groupDiv.className = "valuable-dl-server-group";
      const headerDiv = document.createElement("div");
      headerDiv.className = "valuable-dl-server-header";
      const nameSpan = document.createElement("span");
      nameSpan.className = "dl-server-name";
      nameSpan.textContent = source;
      const countSpan = document.createElement("span");
      countSpan.className = "dl-server-count";
      countSpan.textContent = `(${groupFiles.length})`;
      headerDiv.appendChild(nameSpan);
      headerDiv.appendChild(countSpan);
      groupDiv.appendChild(headerDiv);
      for (const file of groupFiles) {
        const row = document.createElement("div");
        row.className = "valuable-file-row";
        const nameEl = document.createElement("span");
        nameEl.className = "file-source";
        nameEl.textContent = file.name || file.id;
        const tagSpan = document.createElement("span");
        tagSpan.className = "file-tag";
        const tags = (file.tags || []).map((t2) => t2.label || t2.key || t2).join(", ");
        tagSpan.textContent = tags || "\u2014";
        const statusSpan = document.createElement("span");
        const statusClass = (file.status || "open").toLowerCase().replace(/\s+/g, "-");
        statusSpan.className = "valuable-status " + statusClass;
        statusSpan.textContent = (file.status || "OPEN").toUpperCase();
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.dataset.fileId = file.id;
        cb.checked = !!file.selected;
        cb.addEventListener("change", () => {
          updateValuableDownloadSelection();
          updateSelectAllState(selectAllCb, checkboxes);
        });
        checkboxes.push(cb);
        row.appendChild(nameEl);
        row.appendChild(tagSpan);
        row.appendChild(statusSpan);
        row.appendChild(cb);
        groupDiv.appendChild(row);
      }
      valuableContentDownloads.appendChild(groupDiv);
    }
    selectAllCb.addEventListener("change", () => {
      for (const cb of checkboxes) cb.checked = selectAllCb.checked;
      updateValuableDownloadSelection();
    });
    updateSelectAllState(selectAllCb, checkboxes);
  }
  var _maintTimerInterval = null;
  function renderValuableMaintenance(data) {
    _clearEl(valuableContentMaintenance);
    if (_maintTimerInterval) {
      clearInterval(_maintTimerInterval);
      _maintTimerInterval = null;
    }
    if (!data || !data.servers || data.servers.length === 0) {
      valuableContentMaintenance.replaceChildren(_h("div", { className: "auto-jobs-no-jobs" }, t('Run "Start Valuable Search" to see the maintenance status of servers. If no servers are shown after the search, there is no upcoming or active maintenance.', "\u8FD0\u884C\u201C\u5F00\u59CB\u641C\u7D22\u8D35\u91CD\u7269\u54C1\u201D\u4EE5\u67E5\u770B\u670D\u52A1\u5668\u7EF4\u62A4\u72B6\u6001\u3002\u5982\u679C\u641C\u7D22\u540E\u6CA1\u6709\u663E\u793A\u670D\u52A1\u5668\uFF0C\u5219\u6CA1\u6709\u5373\u5C06\u8FDB\u884C\u6216\u6B63\u5728\u8FDB\u884C\u7684\u7EF4\u62A4\u3002")));
      return;
    }
    const timerEls = [];
    let hasUpcoming = false;
    for (const srv of data.servers) {
      const row = document.createElement("div");
      row.className = "maint-row";
      const isUpcoming = srv.timeUntilMaintenance && !srv.maintenanceEndsAt;
      const nameEl = document.createElement("span");
      nameEl.className = "maint-name";
      nameEl.textContent = srv.serverName;
      const timerEl = document.createElement("span");
      timerEl.className = "maint-timer";
      timerEl.dataset.target = srv.maintenanceEndsAt || srv.timeUntilMaintenance || "";
      timerEls.push(timerEl);
      const statusEl2 = document.createElement("span");
      statusEl2.className = "maint-status";
      statusEl2.dataset.serverId = srv.id;
      if (srv.maintenanceEndsAt) {
        statusEl2.classList.add("in-maintenance");
        statusEl2.textContent = "IN MAINTENANCE";
      } else {
        statusEl2.classList.add("upcoming");
        statusEl2.textContent = "UPCOMING";
      }
      row.appendChild(nameEl);
      row.appendChild(timerEl);
      row.appendChild(statusEl2);
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "maint-checkbox";
      cb.dataset.serverId = srv.id;
      cb.dataset.serverName = srv.serverName;
      if (isUpcoming) {
        hasUpcoming = true;
        cb.disabled = false;
      } else {
        cb.disabled = true;
      }
      row.appendChild(cb);
      valuableContentMaintenance.appendChild(row);
    }
    if (hasUpcoming) {
      const bottomRow = document.createElement("div");
      bottomRow.className = "maint-force-selected-row";
      const batchBtn = document.createElement("button");
      batchBtn.className = "maint-force-selected-btn";
      batchBtn.id = "maintForceSelectedBtn";
      batchBtn.textContent = "Force selected!";
      batchBtn.title = "Force maintenance on all checked servers (furthest first)";
      const all = document.createElement("input");
      all.type="checkbox";
      const allLabel=document.createElement("label");
      allLabel.append(all,document.createTextNode(t("Select all available", "全选可维护目标")));
      const review=document.createElement("p");
      review.setAttribute("aria-live","polite");
      let reviewed=null;
      const choices=()=>Array.from(valuableContentMaintenance.querySelectorAll(".maint-checkbox:not(:disabled)"));
      const reset=()=>{
        reviewed=null;
        review.textContent="";
        const boxes=choices(),count=boxes.filter(box=>box.checked).length;
        all.checked=boxes.length>0&&count===boxes.length;
        all.indeterminate=count>0&&count<boxes.length;
        batchBtn.disabled=!count;
        batchBtn.textContent=t("Review selected","核对所选目标");
      };
      all.addEventListener("change",()=>{for(const box of choices())box.checked=all.checked;reset();});
      for(const box of choices())box.addEventListener("change",reset);
      batchBtn.addEventListener("click",()=>{
        const selected=choices().filter(box=>box.checked);
        const ids=JSON.stringify(selected.map(box=>box.dataset.serverId));
        if(!selected.length){reset();return;}
        if(reviewed===ids){reviewed=null;void handleForceMaintenanceBatch();return;}
        reviewed=ids;
        review.textContent=selected.map(box=>box.dataset.serverName).join(" · ");
        batchBtn.textContent=t("Confirm maintenance","确认维护")+" ("+selected.length+")";
      });
      reset();
      bottomRow.append(allLabel,review,batchBtn);
      valuableContentMaintenance.appendChild(bottomRow);
    }
    function updateTimers() {
      for (const el of timerEls) {
        const target = el.dataset.target;
        if (!target) {
          el.textContent = "\u2014";
          continue;
        }
        const diff = new Date(target).getTime() - Date.now();
        if (diff <= 0) {
          el.textContent = "now";
          continue;
        }
        const h = Math.floor(diff / 36e5);
        const m = Math.floor(diff % 36e5 / 6e4);
        const s = Math.floor(diff % 6e4 / 1e3);
        el.textContent = (h > 0 ? h + "h " : "") + m + "m " + s + "s";
      }
    }
    updateTimers();
    _maintTimerInterval = setInterval(updateTimers, 1e3);
    Cor3CenterStore.get("forceMaintenanceInProgress", (fmState) => {
      const fm = fmState.forceMaintenanceInProgress;
      const allCbs = valuableContentMaintenance.querySelectorAll(".maint-checkbox");
      const batchBtn = document.getElementById("maintForceSelectedBtn");
      if (fm && fm.batch) {
        allCbs.forEach((cb) => {
          cb.disabled = true;
        });
        if (batchBtn) {
          batchBtn.disabled = true;
          batchBtn.classList.add("in-progress");
          batchBtn.textContent = "In-progress...";
        }
        const batchIds = fm.serverIds || [];
        const currentId = fm.currentServerId || null;
        batchIds.forEach((sid) => {
          const statusEl2 = valuableContentMaintenance.querySelector(`.maint-status[data-server-id="${sid}"]`);
          if (statusEl2 && !statusEl2.classList.contains("in-maintenance")) {
            statusEl2.classList.remove("upcoming");
            statusEl2.classList.add("in-progress");
            statusEl2.style.background = sid === currentId ? "var(--accent-orange)" : "var(--accent-light-cyan)";
            statusEl2.style.color = "var(--bg-primary)";
            statusEl2.style.textAlign = "center";
            statusEl2.style.justifySelf = "end";
            statusEl2.style.width = "80px";
            statusEl2.textContent = sid === currentId ? "FORCING..." : "QUEUED";
          }
        });
      }
    });
  }
  async function handleForceMaintenanceBatch() {
    const fmCheck = await Cor3CenterStore.get("forceMaintenanceInProgress");
    if (fmCheck.forceMaintenanceInProgress && fmCheck.forceMaintenanceInProgress.batch) {
      addValuableLog("\u{1F527} Force maintenance already running", "warn");
      return;
    }
    const checkedCbs = valuableContentMaintenance.querySelectorAll(".maint-checkbox:checked");
    if (checkedCbs.length === 0) {
      addValuableLog("\u{1F527} No servers selected for batch force maintenance", "warn");
      return;
    }
    const selected = [];
    checkedCbs.forEach((cb) => {
      selected.push({ id: cb.dataset.serverId, name: cb.dataset.serverName });
    });
    const serverIds = selected.map((s) => s.id);
    const allCbs = valuableContentMaintenance.querySelectorAll(".maint-checkbox");
    const batchBtn = document.getElementById("maintForceSelectedBtn");
    allCbs.forEach((cb) => {
      cb.disabled = true;
    });
    if (batchBtn) {
      batchBtn.disabled = true;
      batchBtn.classList.add("in-progress");
      batchBtn.textContent = "In-progress...";
    }
    serverIds.forEach((sid) => {
      const statusEl2 = valuableContentMaintenance.querySelector(`.maint-status[data-server-id="${sid}"]`);
      if (statusEl2 && !statusEl2.classList.contains("in-maintenance")) {
        statusEl2.classList.remove("upcoming");
        statusEl2.classList.add("in-progress");
        statusEl2.style.background = "var(--accent-light-cyan)";
        statusEl2.style.color = "var(--bg-primary)";
        statusEl2.style.textAlign = "center";
        statusEl2.style.justifySelf = "end";
        statusEl2.style.width = "80px";
        statusEl2.textContent = "QUEUED";
      }
    });
    await Cor3CenterStore.set({ forceMaintenanceInProgress: { batch: true, serverIds, servers: selected, startedAt: Date.now() } });
    addValuableLog(`\u{1F527} Batch force maintenance: ${selected.length} server(s) selected \u2014 starting...`, "info");
    try {
      const tab = await getCor3Tab();
      if (tab) {
        await Cor3CenterUi.send(tab.id, {
          action: "forceMaintenanceBatch",
          servers: selected
        });
      }
    } catch (e) {
      addValuableLog(`\u{1F527} Batch force maintenance failed: ${e.message}`, "error");
      allCbs.forEach((cb) => {
        cb.disabled = false;
      });
      if (batchBtn) {
        batchBtn.disabled = false;
        batchBtn.classList.remove("in-progress");
        batchBtn.textContent = "Force selected!";
      }
      await Cor3CenterStore.remove("forceMaintenanceInProgress");
    }
  }
  async function updateValuableServerSelection() {
    const cbs = valuableContentServers.querySelectorAll('input[type="checkbox"][data-server-id]');
    const selected = [];
    cbs.forEach((cb) => {
      if (cb.checked) selected.push(cb.dataset.serverId);
    });
    await Cor3CenterStore.set({ valuableSelectedServers: selected });
  }
  async function updateValuableDownloadSelection() {
    const cbs = valuableContentDownloads.querySelectorAll('input[type="checkbox"][data-file-id]');
    const selected = [];
    cbs.forEach((cb) => {
      if (cb.checked) selected.push(cb.dataset.fileId);
    });
    await Cor3CenterStore.set({ valuableSelectedDownloads: selected });
  }
  function updateValuableButtons() {
    if (valuableSearchRunning) {
      valuableSearchBtn.textContent = t("\u25A0 Stop Valuable Search", "\u25A0 \u505C\u6B62\u641C\u7D22\u8D35\u91CD\u7269\u54C1");
      valuableSearchBtn.className = "valuable-btn stop";
      valuableSellerBtn.disabled = true;
    } else if (valuableSellerRunning) {
      valuableSellerBtn.textContent = t("\u25A0 Stop Valuable Seller", "\u25A0 \u505C\u6B62\u81EA\u52A8\u51FA\u552E");
      valuableSellerBtn.className = "valuable-btn stop";
      valuableSearchBtn.disabled = true;
    } else {
      valuableSearchBtn.textContent = t("\u25B6 Start Valuable Search", "\u25B6 \u5F00\u59CB\u641C\u7D22\u8D35\u91CD\u7269\u54C1");
      valuableSearchBtn.className = "valuable-btn start";
      valuableSearchBtn.disabled = false;
      valuableSellerBtn.textContent = t("\u25B6 Start Valuable Seller", "\u25B6 \u5F00\u59CB\u81EA\u52A8\u51FA\u552E");
      valuableSellerBtn.className = "valuable-btn start";
      valuableSellerBtn.disabled = false;
    }
  }
  valuableSearchBtn.addEventListener("click", async () => {
    if (valuableSearchRunning) {
      valuableSearchRunning = false;
      updateValuableButtons();
      addValuableLog("Valuable Search stopped by user.", "warn");
      try {
        const tab = await getCor3Tab();
        if (tab) await Cor3CenterUi.send(tab.id, { action: "stopValuable" });
      } catch (e) {
      }
      await Cor3CenterStore.set({ valuableSearchRunning: false, valuableSellerRunning: false });
    } else {
      valuableSearchRunning = true;
      updateValuableButtons();
      addValuableLog("Starting Valuable Search...", "info");
      await Cor3CenterStore.set({ valuableSearchRunning: true, valuableSellerRunning: false });
      try {
        const tab = await getCor3Tab();
        if (tab) {
          await Cor3CenterUi.send(tab.id, {
            action: "startValuableSearch"
          });
        }
      } catch (e) {
        addValuableLog("Failed to start Valuable Search: " + e.message, "error");
      }
    }
  });
  valuableSellerBtn.addEventListener("click", async () => {
    if (valuableSellerRunning) {
      valuableSellerRunning = false;
      updateValuableButtons();
      addValuableLog("Valuable Seller stopped by user.", "warn");
      try {
        const tab = await getCor3Tab();
        if (tab) await Cor3CenterUi.send(tab.id, { action: "stopValuable" });
      } catch (e) {
      }
      await Cor3CenterStore.set({ valuableSellerRunning: false, valuableSearchRunning: false });
    } else {
      const { valuableSelectedServers, valuableSelectedDownloads } = await Cor3CenterStore.get(["valuableSelectedServers", "valuableSelectedDownloads"]);
      const selectedServers = valuableSelectedServers || [];
      const selectedDownloads = valuableSelectedDownloads || [];
      if (selectedServers.length === 0 && selectedDownloads.length === 0) {
        addValuableLog("No servers or downloads selected for selling.", "warn");
        return;
      }
      valuableSellerRunning = true;
      updateValuableButtons();
      addValuableLog(`Starting Valuable Seller: ${selectedServers.length} server(s), ${selectedDownloads.length} download(s) selected.`, "info");
      await Cor3CenterStore.set({ valuableSellerRunning: true, valuableSearchRunning: false });
      try {
        const tab = await getCor3Tab();
        if (tab) {
          await Cor3CenterUi.send(tab.id, {
            action: "startValuableSeller",
            selectedServers,
            selectedDownloads
          });
        }
      } catch (e) {
        addValuableLog("Failed to start Valuable Seller: " + e.message, "error");
      }
    }
  });
  Cor3CenterStore.get("valuableDebugConsoleEnabled", (data) => {
    const enabled = !!data.valuableDebugConsoleEnabled;
    valuableDebugToggle.checked = enabled;
    valuableDebugConsole.style.display = enabled ? "" : "none";
    if (enabled) renderValuableDebugLogs();
  });
  valuableDebugToggle.addEventListener("change", () => {
    const enabled = valuableDebugToggle.checked;
    Cor3CenterStore.set({ valuableDebugConsoleEnabled: enabled });
    valuableDebugConsole.style.display = enabled ? "" : "none";
    if (enabled) renderValuableDebugLogs();
  });
  function addValuableLog(msg, level = "info") {
    valuableDebugLogs.push({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), msg, level });
    if (valuableDebugLogs.length > VALUABLE_MAX_LOGS) valuableDebugLogs.shift();
    renderValuableDebugLogs();
    Cor3CenterStore.set({ valuableDebugLogs });
  }
  function formatLocalLogTime2(ts) {
    if (!ts) return "";
    var date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts).slice(11, 19);
    return date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  function renderValuableDebugLogs() {
    if (valuableDebugLogs.length === 0) {
      valuableDebugLogsBody.replaceChildren(_h("div", { style: "color:var(--text-dim);" }, t("No logs yet.", "\u6682\u65E0\u65E5\u5FD7\u3002")));
      return;
    }
    const frag = document.createDocumentFragment();
    for (const log of valuableDebugLogs) {
      const row = document.createElement("div");
      let levelClass = "";
      if (log.level === "error") levelClass = " log-error";
      else if (log.level === "success") levelClass = " log-success";
      else if (log.level === "warn") levelClass = " log-warn";
      row.className = "debug-log-row" + levelClass;
      const displayTime = formatLocalLogTime2(log.timestamp) || log.time || "";
      row.appendChild(_h("span", { className: "log-time" }, "[" + displayTime + "]"));
      row.appendChild(document.createTextNode(" " + log.msg));
      frag.appendChild(row);
    }
    valuableDebugLogsBody.replaceChildren(frag);
    valuableDebugLogsBody.scrollTop = valuableDebugLogsBody.scrollHeight;
  }
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.valuableServersData) {
      renderValuableServers(changes.valuableServersData.newValue);
    }
    if (changes.valuableDownloadsData) {
      renderValuableDownloads(changes.valuableDownloadsData.newValue);
    }
    if (changes.valuableMaintenanceData) {
      renderValuableMaintenance(changes.valuableMaintenanceData.newValue);
    }
    if (changes.forceMaintenanceInProgress && changes.forceMaintenanceInProgress.newValue) {
      const fm = changes.forceMaintenanceInProgress.newValue;
      if (fm.batch && fm.currentServerId) {
        const batchIds = fm.serverIds || [];
        batchIds.forEach((sid) => {
          const statusEl2 = valuableContentMaintenance.querySelector(`.maint-status[data-server-id="${sid}"]`);
          if (statusEl2 && !statusEl2.classList.contains("in-maintenance")) {
            statusEl2.style.background = sid === fm.currentServerId ? "var(--accent-orange)" : "var(--accent-light-cyan)";
            statusEl2.style.color = "var(--bg-primary)";
            statusEl2.style.textAlign = "center";
            statusEl2.style.justifySelf = "end";
            statusEl2.style.width = "80px";
            statusEl2.textContent = sid === fm.currentServerId ? "FORCING..." : "QUEUED";
          }
        });
      }
    }
    if (changes.valuableForceMaintenanceServerDone && changes.valuableForceMaintenanceServerDone.newValue) {
      const sd = changes.valuableForceMaintenanceServerDone.newValue;
      const statusEl2 = valuableContentMaintenance.querySelector(`.maint-status[data-server-id="${sd.serverId}"]`);
      if (statusEl2) {
        statusEl2.classList.remove("upcoming", "in-progress");
        statusEl2.classList.add("in-maintenance");
        statusEl2.style.background = "";
        statusEl2.style.color = "";
        statusEl2.style.textAlign = "";
        statusEl2.style.justifySelf = "";
        statusEl2.style.width = "";
        statusEl2.textContent = "IN MAINTENANCE";
      }
    }
    if (changes.valuableForceMaintenanceDone) {
      Cor3CenterStore.remove("forceMaintenanceInProgress");
      const allCbs = valuableContentMaintenance.querySelectorAll(".maint-checkbox");
      const batchBtn = document.getElementById("maintForceSelectedBtn");
      allCbs.forEach((cb) => {
        cb.disabled = false;
        cb.checked = false;
      });
      if (batchBtn) {
        batchBtn.disabled = false;
        batchBtn.classList.remove("in-progress");
        batchBtn.textContent = "Force selected!";
      }
    }
    if (changes.valuableSearchRunning) {
      valuableSearchRunning = !!changes.valuableSearchRunning.newValue;
      updateValuableButtons();
    }
    if (changes.valuableSellerRunning) {
      valuableSellerRunning = !!changes.valuableSellerRunning.newValue;
      updateValuableButtons();
    }
    if (changes.valuableDebugLogs) {
      valuableDebugLogs = changes.valuableDebugLogs.newValue || [];
      renderValuableDebugLogs();
    }
  });
  Cor3CenterStore.get(["valuableDebugLogs", "valuableSearchRunning", "valuableSellerRunning", "forceMaintenanceInProgress"], (data) => {
    if (data.valuableDebugLogs) {
      valuableDebugLogs = data.valuableDebugLogs;
      renderValuableDebugLogs();
    }
    if (data.valuableSearchRunning) {
      valuableSearchRunning = true;
      updateValuableButtons();
    }
    if (data.valuableSellerRunning) {
      valuableSellerRunning = true;
      updateValuableButtons();
    }
    if (data.forceMaintenanceInProgress && data.forceMaintenanceInProgress.batch) {
      var fm = data.forceMaintenanceInProgress;
      var batchIds = fm.serverIds || [];
      setTimeout(() => {
        batchIds.forEach((sid) => {
          const statusEl2 = valuableContentMaintenance.querySelector(`.maint-status[data-server-id="${sid}"]`);
          if (statusEl2 && !statusEl2.classList.contains("in-maintenance")) {
            statusEl2.classList.remove("upcoming");
            statusEl2.classList.add("in-progress");
            statusEl2.style.background = sid === fm.currentServerId ? "var(--accent-orange)" : "var(--accent-light-cyan)";
            statusEl2.style.color = "var(--bg-primary)";
            statusEl2.style.textAlign = "center";
            statusEl2.style.justifySelf = "end";
            statusEl2.style.width = "80px";
            statusEl2.textContent = sid === fm.currentServerId ? "FORCING..." : "QUEUED";
          }
        });
        const allCbs = valuableContentMaintenance.querySelectorAll(".maint-checkbox");
        const batchBtn = document.getElementById("maintForceSelectedBtn");
        allCbs.forEach((cb) => {
          cb.disabled = true;
        });
        if (batchBtn) {
          batchBtn.disabled = true;
          batchBtn.classList.add("in-progress");
          batchBtn.textContent = "Forcing...";
        }
      }, 100);
    }
  });

  // Master switch keeps individual preferences intact. Resume needs a fresh game document.
  var centerPreferenceReady = false;
  var centerFullPreferenceReady = false;
  Cor3CenterUi.ready.then(async () => { try {
    await Cor3CenterUi.binding();
    const values=await Cor3CenterStore.get(['autoUpdateMarkets','autoDailyHackEnabled']);
    if(typeof values.autoUpdateMarkets!=='boolean'||typeof values.autoDailyHackEnabled!=='boolean')return;
    centerFullPreferenceReady=true;
    if(autoUpdateMarketsToggle){autoUpdateMarketsToggle.checked=values.autoUpdateMarkets;autoUpdateMarketsToggle.indeterminate=false;updateAutoUpdateMarketsStatus();}
    if(autoDailyHackToggle){autoDailyHackToggle.checked=values.autoDailyHackEnabled;autoDailyHackToggle.indeterminate=false;updateDailyHackStatusLabel(values.autoDailyHackEnabled);}
    renderMaster(state.isHelper);
  } catch (_) {} });
  var helperModeToggle = document.getElementById("helperModeToggle");
  var helperStatus = document.getElementById("helperMasterStatus");
  function renderMasterUnknown(message, preserveMessage = false) {
    centerPreferenceReady=false;
    if(helperModeToggle){helperModeToggle.indeterminate=true;helperModeToggle.disabled=true;const parent=helperModeToggle.closest('label');if(parent)parent.style.filter='grayscale(1)';}
    for(const [id,label] of [['autoDecryptToggle','decryptStatus'],['autoIceWallToggle','iceWallStatus'],['autoSimpleDecryptToggle','simpleDecryptStatus']])showCenterPreferenceUnknown(document.getElementById(id),document.getElementById(label));
    document.querySelectorAll('.auto-decrypt-row input, .auto-choose-row input, .pinned-auto-refresh input').forEach(el=>el.disabled=true);
    if(helperStatus&&!preserveMessage){helperStatus.textContent=message;helperStatus.style.color='var(--text-secondary)';}
  }
  function renderMaster(paused, message, failed) {
    state.isHelper = paused;
    if (helperModeToggle) { helperModeToggle.checked = paused; helperModeToggle.indeterminate=false; helperModeToggle.closest("label")?.style.removeProperty("filter"); }
    if (helperStatus) {
      helperStatus.textContent = message || (paused ? "当前总闸为暂停；三个破解偏好可保存，但不会启动。已提交的游戏动作无法撤回。" : "三个解密功能按当前页面偏好运行，无需账号探测；其他功能仍单独核验账号。");
      helperStatus.style.color = failed ? "var(--accent-red)" : "var(--text-secondary)";
    }
    document.querySelectorAll(".auto-decrypt-row input, .auto-choose-row input, .pinned-auto-refresh input").forEach(el => { el.disabled = paused || !centerFullPreferenceReady; });
    for (const id of ["autoDecryptToggle","autoIceWallToggle","autoSimpleDecryptToggle"]) { const el=document.getElementById(id); if(el) el.disabled=!centerPreferenceReady || el.indeterminate===true; }
  }
  // Global safety-flag read grants no account access or action.
  let masterReadRetry = null, masterReadAttempts = 0;
  async function refreshMasterAdmission(preserveMessage = false) {
    if(helperModeToggle)helperModeToggle.disabled=true;
    try {
      const result=await Cor3SolverPopup.current();
      clearTimeout(masterReadRetry); masterReadRetry = null; masterReadAttempts = 0;
      centerPreferenceReady=true;
      if(!preserveMessage)renderMaster(result.values.helperMode);
      for(const [id,key,label] of [['autoDecryptToggle','autoDecryptEnabled','decryptStatus'],['autoIceWallToggle','autoIceWallEnabled','iceWallStatus'],['autoSimpleDecryptToggle','autoSimpleDecryptEnabled','simpleDecryptStatus']]){
        const el=document.getElementById(id);if(el){el.checked=result.values[key];el.indeterminate=false;el.disabled=false;el.closest('label')?.style.removeProperty('filter');statusLabel(document.getElementById(label),result.values[key]);}
      }
      if(helperModeToggle)helperModeToggle.disabled=false;
      return true;
    } catch (_) {
      renderMasterUnknown('当前游戏页面未确认，设置尚未读取；不代表关闭或暂停。',preserveMessage);
      if (!masterReadRetry && masterReadAttempts++ < 8) masterReadRetry = setTimeout(() => {
        masterReadRetry = null; void refreshMasterAdmission();
      }, Math.min(4000, masterReadAttempts * 500));
      return false;
    }
  }
  refreshMasterAdmission();
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.helperMode) refreshMasterAdmission();
  });
  if (helperModeToggle) helperModeToggle.addEventListener("change", async () => {
    const paused = helperModeToggle.checked;
    if (!await refreshMasterAdmission()) return;
    helperModeToggle.disabled = true;
    renderMaster(paused, paused ? "正在保存暂停设置…" : "正在保存恢复设置…");
    try {
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("后台核对超时，结果未知。")), 12000);
        Cor3SolverPopup.master(paused).then(value => { clearTimeout(timeout); resolve(value); }, error => { clearTimeout(timeout); reject(error); });
      });
      if (!response) throw new Error("后台未应答，无法确认总开关。");
      const missing = response.unconfirmed || [];
      const issues = response.issues || [];
      if (!response.ok) {
        const detail = issues.join(" ") || response.error || (missing.length + " 个游戏上下文未确认，请检查页面状态后重新打开插件。");
        renderMasterUnknown("尚未全部确认：" + detail);
      } else {
        renderMaster(response.paused, response.paused ? "已保存暂停设置；已经提交的游戏动作无法撤回。" : "三个解密功能已允许按当前页面偏好运行，无需再次刷新；其他功能仍需账号核验。");
      }
      if(centerFullPreferenceReady)await loadPinnedState();
    } catch (error) { renderMasterUnknown("停止/保存结果未知：" + error.message + "。不要把未知当作保存成功。"); }
    finally { await refreshMasterAdmission(true); }
  });

  // src/popup/fork-config.js
  var FORK_REPO = "RedeatI/cor3-relay";
  var FORK_REPO_URL = `https://github.com/${FORK_REPO}`;
  var FORK_RELEASES_URL = `${FORK_REPO_URL}/releases`;
  var FORK_DISPLAY_NAME = "COR3 Relay";
  var UPSTREAM_REPO = "Femtoce11/cor3-helper";
  var UPSTREAM_URL = `https://github.com/${UPSTREAM_REPO}`;

  // src/popup/version-info.js
  var checkUpdateBtn = document.getElementById("checkUpdateBtn");
  var updateResult = document.getElementById("updateResult");
  function compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const parse = (v) => {
      const stripped = String(v).replace(/^v/, "");
      const match = stripped.match(/^([\d.]+)(.*)$/);
      if (!match) return { parts: [0], suffix: stripped };
      return {
        parts: match[1].split(".").map((n) => parseInt(n) || 0),
        suffix: match[2] || ""
      };
    };
    const a = parse(v1);
    const b = parse(v2);
    const maxLength = Math.max(a.parts.length, b.parts.length);
    for (let i = 0; i < maxLength; i++) {
      const num1 = a.parts[i] || 0;
      const num2 = b.parts[i] || 0;
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    const hasSuffix1 = a.suffix.length > 0;
    const hasSuffix2 = b.suffix.length > 0;
    if (!hasSuffix1 && hasSuffix2) return -1;
    if (hasSuffix1 && !hasSuffix2) return 1;
    if (hasSuffix1 && hasSuffix2) return a.suffix.localeCompare(b.suffix);
    return 0;
  }
  function pickNewer(a, b) {
    if (!a) return b;
    if (!b) return a;
    return compareVersions(a, b) > 0 ? a : b;
  }
  async function getBundledVersions() {
    try {
      const resp = await fetch(chrome.runtime.getURL("versions.json"), { cache: "no-store" });
      if (!resp.ok) return null;
      return await resp.json();
    } catch (e) {
      return null;
    }
  }
  async function getReferenceVersions() {
    let remote = null;
    try {
      const resp = await fetch(`https://raw.githubusercontent.com/${FORK_REPO}/main/versions.json`, { cache: "no-store" });
      if (resp.ok) remote = await resp.json();
    } catch (e) {
    }
    const bundled = await getBundledVersions();
    if (!remote) return bundled;
    if (!bundled) return remote;
    return {
      web: pickNewer(bundled.web, remote.web),
      system: pickNewer(bundled.system, remote.system),
      patch: pickNewer(bundled.patch, remote.patch)
    };
  }
  checkUpdateBtn.addEventListener("click", async () => {
    updateResult.textContent = t("Checking...", "\u68C0\u67E5\u4E2D...");
    updateResult.style.color = "var(--text-dim)";
    try {
      const localManifest = chrome.runtime.getManifest();
      const localExtVersion = localManifest.version;
      const localExtVersionName = localManifest.version_name || localExtVersion;
      const versionsResp = await fetch(`https://raw.githubusercontent.com/${FORK_REPO}/main/versions.json`, { cache: "no-store" });
      if (!versionsResp.ok) throw new Error("Failed to fetch remote versions");
      const remote = await versionsResp.json();
      let remoteExtVersion = null;
      try {
        const pkgResp = await fetch(`https://raw.githubusercontent.com/${FORK_REPO}/main/package.json`, { cache: "no-store" });
        if (pkgResp.ok) {
          const remotePkg = await pkgResp.json();
          remoteExtVersion = remotePkg.version || null;
        }
      } catch (e) {
      }
      const { webVersion, systemVersion } = await Cor3CenterStore.get(["webVersion", "systemVersion"]);
      let messages = [];
      let extBehind = false;
      if (remoteExtVersion && compareVersions(localExtVersion, remoteExtVersion) < 0) {
        messages.push(`${t("Extension", "\u6269\u5C55")}: <b>v${localExtVersionName}</b> \u2192 <b>v${remoteExtVersion}</b>`);
        extBehind = true;
      }
      if (messages.length > 0) {
        let html = `${t("Updates detected:", "\u68C0\u6D4B\u5230\u66F4\u65B0\uFF1A")}<br>${messages.join("<br>")}`;
        if (extBehind) {
          html += `<br><a href="${FORK_RELEASES_URL}" target="_blank" style="color:var(--accent-cyan);">${t("Download from " + FORK_DISPLAY_NAME, "\u4ECE " + FORK_DISPLAY_NAME + " \u4E0B\u8F7D")}</a><br><span style="font-size:9px;color:var(--text-muted);">${t("Download ZIP, extract, and reload on chrome://extensions", "\u4E0B\u8F7D ZIP\uFF0C\u89E3\u538B\u540E\u5728 chrome://extensions \u91CD\u65B0\u52A0\u8F7D")}</span>`;
        }
        html += `<br><span style="font-size:9px;color:var(--text-muted);">${t("Fork", "\u5206\u652F")}: ${FORK_DISPLAY_NAME} \xB7 ${t("Upstream", "\u4E0A\u6E38")}: <a href="${UPSTREAM_URL}" target="_blank" style="color:var(--accent-cyan);">${UPSTREAM_REPO}</a></span>`;
        _safeSetHtml(updateResult, html);
        updateResult.style.color = "var(--accent-orange)";
      } else {
        const localWeb = webVersion || null;
        const localSys = systemVersion || null;
        updateResult.textContent = t(`You're up to date! (${FORK_DISPLAY_NAME})`, `\u5DF2\u662F\u6700\u65B0\u7248\u672C\uFF01\uFF08${FORK_DISPLAY_NAME}\uFF09`);
        updateResult.style.color = "var(--accent-green)";
      }
    } catch (e) {
      console.log("[COR3 Helper] Check for updates error:", e);
      cor3LogError("popup.js", e, { action: "checkForUpdates" });
      updateResult.textContent = t("Could not check for updates. Check your connection.", "\u65E0\u6CD5\u68C0\u67E5\u66F4\u65B0\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u3002");
      updateResult.style.color = "var(--accent-red)";
    }
  });
  async function displayVersionInfo(retryCount) {
    retryCount = retryCount || 0;
    const versionSection = document.getElementById("versionInfoSection");
    if (!versionSection) return;
    const manifest = chrome.runtime.getManifest();
    const extVersion = manifest.version;
    const extVersionName = manifest.version_name || extVersion;
    const { webVersion, systemVersion, patchVersion } = await Cor3CenterStore.get(["webVersion", "systemVersion", "patchVersion"]);
    let finalWebVersion = webVersion;
    let finalSystemVersion = systemVersion;
    let finalPatchVersion = patchVersion;
    if (!webVersion || !systemVersion || !patchVersion) {
      try {
        const tab = await getCor3Tab();
        if (tab) {
          const response = await Cor3CenterUi.send(tab.id, { action: "getVersionFallbacks" });
          if (response) {
            if (!finalWebVersion && response.webVersion) {
              finalWebVersion = response.webVersion;
              Cor3CenterStore.set({ webVersion: response.webVersion });
            }
            if (!finalSystemVersion && response.systemVersion) {
              finalSystemVersion = response.systemVersion;
              Cor3CenterStore.set({ systemVersion: response.systemVersion });
            }
            if (!finalPatchVersion && response.patchVersion) {
              finalPatchVersion = response.patchVersion;
              Cor3CenterStore.set({ patchVersion: response.patchVersion });
            }
          }
        }
      } catch (e) {
        console.log("[COR3 Helper] Could not get version fallbacks:", e);
      }
    }
    let parts = [`${t("Extension", "\u6269\u5C55")}: v${extVersionName} <span style="color:var(--accent-cyan);">(${FORK_DISPLAY_NAME})</span>`];
    if (finalWebVersion) parts.push(`${t("Web", "\u7F51\u9875")}: ${finalWebVersion}`);
    if (finalSystemVersion) parts.push(`${t("System", "\u7CFB\u7EDF")}: ${finalSystemVersion}`);
    if (finalPatchVersion) parts.push(`${t("Patch", "\u8865\u4E01")}: ${finalPatchVersion}`);
    let html = parts.join(" \xB7 ");
    html += `<br><span style="font-size:9px;color:var(--text-muted);">${t("Fork", "\u5206\u652F")}: <a href="${FORK_REPO_URL}" target="_blank" style="color:var(--accent-cyan);">${FORK_REPO}</a> \xB7 ${t("Upstream", "\u4E0A\u6E38")}: <a href="${UPSTREAM_URL}" target="_blank" style="color:var(--accent-cyan);">${UPSTREAM_REPO}</a></span>`;
    _safeSetHtml(versionSection, html);
    versionSection.style.display = "block";
    if ((!finalWebVersion || !finalSystemVersion || !finalPatchVersion) && retryCount < 5) {
      setTimeout(() => displayVersionInfo(retryCount + 1), 2e3);
    }
  }
  displayVersionInfo(0);
  async function autoCheckWebsiteUpdated() {
    const webVersionNotice = document.getElementById("webVersionNotice");
    const webVersionData = document.getElementById("webVersionData");
    const systemVersionNotice = document.getElementById("systemVersionNotice");
    const systemVersionData = document.getElementById("systemVersionData");
    const patchVersionNotice = document.getElementById("patchVersionNotice");
    const patchVersionData = document.getElementById("patchVersionData");
    if (!webVersionNotice || !webVersionData || !systemVersionNotice || !systemVersionData) return;
    try {
      const remote = await getReferenceVersions();
      if (!remote) return;
      const { webVersion, systemVersion, patchVersion } = await Cor3CenterStore.get(["webVersion", "systemVersion", "patchVersion"]);
      if (webVersion && remote.web) {
        const comparison = compareVersions(webVersion, remote.web);
        if (comparison > 0) {
          webVersionNotice.textContent = t("\u26A0\uFE0F Game website version is newer than the extension reference", "\u26A0\uFE0F \u6E38\u620F\u7F51\u9875\u7248\u672C\u9AD8\u4E8E\u63D2\u4EF6\u53C2\u8003\u7248\u672C");
          webVersionNotice.style.display = "block";
          webVersionData.textContent = t("Detected: " + webVersion + " \xB7 Reference: " + remote.web, "\u68C0\u6D4B\u5230\uFF1A" + webVersion + " \xB7 \u53C2\u8003\u7248\u672C\uFF1A" + remote.web);
          webVersionData.style.display = "block";
        }
      }
      if (systemVersion && remote.system) {
        const comparison = compareVersions(systemVersion, remote.system);
        if (comparison < 0) {
          systemVersionNotice.textContent = t("\u26A0\uFE0F Your System version is behind the extension reference!", "\u26A0\uFE0F \u4F60\u7684 System \u8FDB\u5EA6\u4F4E\u4E8E\u63D2\u4EF6\u53C2\u8003\u7248\u672C\uFF01");
          systemVersionNotice.style.display = "block";
          systemVersionData.textContent = t("Aim for " + remote.system + " system version!", "\u76EE\u6807\u7CFB\u7EDF\u7248\u672C\uFF1A" + remote.system + "\uFF01");
          systemVersionData.style.display = "block";
        }
      }
      if (patchVersion && remote.patch && patchVersionNotice && patchVersionData) {
        const comparison = compareVersions(patchVersion, remote.patch);
        if (comparison > 0) {
          patchVersionNotice.textContent = t("\u26A0\uFE0F Game patch version differs from the extension reference. Check patch notes!", "\u26A0\uFE0F \u6E38\u620F\u8865\u4E01\u7248\u672C\u4E0E\u63D2\u4EF6\u53C2\u8003\u7248\u672C\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u67E5\u770B\u66F4\u65B0\u8BF4\u660E\uFF01");
          patchVersionNotice.style.display = "block";
          patchVersionData.textContent = t("Detected: " + patchVersion + " \xB7 Reference: " + remote.patch, "\u68C0\u6D4B\u5230\uFF1A" + patchVersion + " \xB7 \u53C2\u8003\u7248\u672C\uFF1A" + remote.patch);
          patchVersionData.style.display = "block";
        }
      }
    } catch (e) {
    }
  }
  autoCheckWebsiteUpdated();
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.webVersion || changes.systemVersion || changes.patchVersion) {
      displayVersionInfo();
      autoCheckWebsiteUpdated();
    }
  });

  // src/popup/refresh-all.js
  var refreshAllBtn = document.getElementById("refreshAllBtn");
  var refreshDailyBtn2 = document.getElementById("refreshDailyBtn");
  var refreshExpeditionsBtn = document.getElementById("refreshExpeditionsBtn");
  var inventoryContainer2 = document.getElementById("inventoryContainer");
  var spaceInfo2 = document.getElementById("spaceInfo");
  var expeditionInfoContainer2 = document.getElementById("expeditionInfoContainer");
  var isRefreshing = false;
  refreshExpeditionsBtn.addEventListener("click", () => requestExpeditions());
  async function refreshExpeditionsOnly() {
    expeditionInfoContainer2.replaceChildren(_noData("Loading expedition data..."));
    await Cor3CenterStore.remove(["expeditionsData", "expeditionDecisions"]);
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestExpeditions" });
    } catch (e) {
    }
    await waitForStorageKey("expeditionsData", 8e3);
    await loadExpeditions();
    refreshAllTimestamps();
    resetExpeditionUpdateTimer();
  }
  async function refreshInventoryOnly() {
    inventoryContainer2.replaceChildren(_noData("Requesting inventory..."));
    spaceInfo2.textContent = "-- / --";
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestStash" });
    } catch (e) {
    }
    await waitForStorageKey("stashData", 5e3);
    await loadInventory();
    refreshAllTimestamps();
  }
  async function refreshMercenariesOnly() {
    await requestMercenaries();
    refreshAllTimestamps();
  }
  async function refreshLoadoutOnly() {
    try {
      const tab = await getCor3Tab();
      if (tab) await Cor3CenterUi.send(tab.id, { action: "requestLoadout" });
    } catch (e) {
    }
    await waitForStorageKey("loadoutData", 5e3);
    await loadLoadout();
    refreshAllTimestamps();
  }
  refreshAllBtn.addEventListener("click", async () => {
    if (isRefreshing) return;
    isRefreshing = true;
    refreshAllBtn.classList.add("spinning");
    try {
      await executeRefreshStep("dailyOps", fetchDailyOps);
      await humanDelay();
      await executeRefreshStep("market1", refreshMarket1Only);
      await humanDelay();
      await executeRefreshStep("setDarkEndpoint", setDarkMarketEndpoint);
      await humanDelay();
      await executeRefreshStep("market2", refreshMarket2Only);
      await humanDelay();
      await executeRefreshStep("market3", refreshMarket3Only);
      await humanDelay();
      await executeRefreshStep("market4", refreshMarket4Only);
      await humanDelay();
      await executeRefreshStep("expeditions", refreshExpeditionsOnly);
      await humanDelay();
      await executeRefreshStep("inventory", refreshInventoryOnly);
      await humanDelay();
      await executeRefreshStep("mercenaries", refreshMercenariesOnly);
      await humanDelay();
      await executeRefreshStep("archived", refreshArchivedOnly);
      await humanDelay();
      await executeRefreshStep("loadout", refreshLoadoutOnly);
    } catch (e) {
      console.log("[COR3 Helper] Refresh All error:", e);
      cor3LogError("popup.js", e, { action: "refreshAll" });
    }
    refreshAllBtn.classList.remove("spinning");
    isRefreshing = false;
    refreshAllTimestamps();
  });
  async function executeRefreshStep(name, operation) {
    try {
      console.log(`[COR3 Helper] Refresh All: Starting ${name}`);
      await operation();
      console.log(`[COR3 Helper] Refresh All: Completed ${name}`);
    } catch (error) {
      console.log(`[COR3 Helper] Refresh All: Failed ${name}:`, error);
      cor3LogError("popup.js", error, { action: "refreshStep-" + name });
    }
  }
  function resetExpeditionUpdateTimer() {
    const now = Date.now();
    Cor3CenterStore.set({ expeditionsDataUpdatedAt: now });
    console.log("[COR3 Helper] Expedition update timer reset");
  }

  // src/popup/auto-refresh.js
  async function sendAutoRefreshToContent2() {
    const tab = await getCor3Tab();
    if (tab) {
      Cor3CenterUi.send(tab.id, {
        action: "updateAutoRefresh",
        autoRefresh: state.autoRefresh
      }).catch(() => {
      });
    }
  }
  Cor3CenterStore.get("autoRefresh", (data) => {
    if (data.autoRefresh) state.autoRefresh = data.autoRefresh;
    sendAutoRefreshToContent2();
  });
  function checkAutoRefreshFromPopup() {
  }
  var { marketContainer: marketContainer2, darkMarketContainer: darkMarketContainer2, soyuzMarketContainer: soyuzMarketContainer2, usolMarketContainer: usolMarketContainer2 } = getMarketContainers();
  setInterval(() => {
    updateDailyTimer();
    if (state.coreNextJobsResetAt) {
      const homeResetEl = marketContainer2.querySelector(".home-reset-timer");
      if (homeResetEl) {
        homeResetEl.textContent = `\u23F3 Jobs Reset: ${formatTimeRemaining(state.coreNextJobsResetAt)}`;
      }
    }
    if (state.bmiNextJobsResetAt) {
      const darkResetEl = darkMarketContainer2.querySelector(".dark-reset-timer");
      if (darkResetEl) {
        darkResetEl.textContent = `\u23F3 Jobs Reset: ${formatTimeRemaining(state.bmiNextJobsResetAt)}`;
      }
    }
    if (state.soyuzNextJobsResetAt) {
      const soyuzResetEl = soyuzMarketContainer2.querySelector(".soyuz-reset-timer");
      if (soyuzResetEl) {
        soyuzResetEl.textContent = `\u23F3 Jobs Reset: ${formatTimeRemaining(state.soyuzNextJobsResetAt)}`;
      }
    }
    if (state.usolNextJobsResetAt) {
      const usolResetEl = usolMarketContainer2.querySelector(".usol-reset-timer");
      if (usolResetEl) {
        usolResetEl.textContent = `\u23F3 Jobs Reset: ${formatTimeRemaining(state.usolNextJobsResetAt)}`;
      }
    }
    document.querySelectorAll(".exp-timer").forEach((el) => {
      const expId = el.dataset.expId;
      const endTime = state.expeditionEndTimes[expId];
      if (endTime) el.textContent = formatTimeRemaining(endTime);
    });
    document.querySelectorAll(".auto-jobs-reset-timer").forEach((el) => {
      const resetAt = el.dataset.resetAt;
      if (resetAt) el.textContent = "\u23F3 Jobs Reset: " + formatTimeRemaining(resetAt);
    });
    updatePinnedTimerValues();
    checkAutoRefreshFromPopup();
  }, 1e3);
  setInterval(() => refreshAllTimestamps(), 3e4);

  // src/popup/storage-listeners.js
  Cor3CenterStore.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.expeditionsData) {
      observeCenterRead(loadExpeditions());
      refreshAllTimestamps();
    }
    if (changes.archivedExpeditionsData) {
      observeCenterRead(loadArchivedExpeditions());
    }
    if (changes.dailyOpsData) {
      observeCenterRead(loadCachedDailyOps());
      refreshAllTimestamps();
    }
  });

  // src/popup/index.js
  console.log("[COR3 Helper] popup modules loaded");
})();






