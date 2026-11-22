/* Ordinary in-page UI backed by isolated extension code. Mutation requires a trusted click. */
(() => {'use strict';
 function createInlineChoice(control,list,beforeOpen=()=>{}){
  const label=control.getAttribute('aria-label')||'',doc=control.ownerDocument;
  let rows=[],signature='',renderedSignature='',renderCount=0;
  const disabled=()=>control.disabled||control.closest('fieldset')?.disabled===true;
  function close(){list.hidden=true;control.setAttribute('aria-expanded','false');}
  function sync(){
   const selected=rows.find(x=>x.value===control.value);
   if(!selected)control.value=rows[0]?.value||'';
   const text=rows.find(x=>x.value===control.value)?.label||label;
   if(globalThis.Cor3UiLanguage?.setText)globalThis.Cor3UiLanguage.setText(control,text);else if(control.textContent!==text)control.textContent=text;
   if(control.dataset.value!==control.value)control.dataset.value=control.value;const aria=globalThis.Cor3UiLanguage?.text?.(label+'：'+text)||label+'：'+text;if(control.getAttribute('aria-label')!==aria)control.setAttribute('aria-label',aria);
   if(!list.hidden)for(const option of list.children){const pressed=String(option.value===control.value);if(option.getAttribute?.('aria-pressed')!==pressed)option.setAttribute('aria-pressed',pressed);}
   if(disabled())close();
  }
  function renderOptions(){if(renderedSignature===signature)return;const scroll=list.scrollTop;list.replaceChildren();++renderCount;for(const row of rows){const option=doc.createElement('button');option.type='button';option.className='choice-option';option.dataset.choiceOption='';option.dataset.value=row.value;option.value=row.value;option.textContent=row.label;list.append(option);}list.scrollTop=scroll;renderedSignature=signature;}
  function set(items,empty){
   const next=[...(empty?[{value:'',label:empty}]:[]),...items.map(item=>({value:String(item.id),label:item.name+(item.category?' · '+item.category:'')+(item.installed?'（已安装）':'')}))];
   const key=JSON.stringify(next);
   if(key!==signature){
    signature=key;rows=next;renderedSignature='';if(list.hidden)list.replaceChildren();else renderOptions();
   }
   sync();
  }
  control.addEventListener('click',()=>{if(disabled())return;if(!list.hidden){close();return;}beforeOpen();renderOptions();list.hidden=false;control.setAttribute('aria-expanded','true');sync();});
  list.addEventListener('click',event=>{
   const option=event.target.closest('[data-choice-option]');
   if(disabled()||list.hidden||!option||!list.contains(option)||!rows.some(x=>x.value===option.value))return;
   const changed=control.value!==option.value;control.value=option.value;sync();close();
   if(changed)control.dispatchEvent(new Event('change',{bubbles:true}));
  });
  for(const node of [control,list])node.addEventListener('keydown',event=>{if(event.key==='Escape'){close();event.preventDefault();event.stopPropagation();}});
  close();return Object.freeze({set,sync,close,isOpen:()=>!list.hidden,renderCount:()=>renderCount});
 }

 const samePageScope=(a,b)=>!!a&&!!b&&a.accountId===b.accountId&&a.documentId===b.documentId;
 function createViewReader({request,scope,visible,apply,failed}){
  let active=null;
  function read(){
   if(!visible())return Promise.resolve();
   const observed=scope();
   if(!observed){active=null;failed({code:'PAGE_ACCOUNT_UNAVAILABLE'});return Promise.resolve();}
   const expected={accountId:observed.accountId,documentId:observed.documentId};
   if(active&&samePageScope(active.expected,expected))return active.promise;
   const entry={expected};
   active=entry;
   const current=()=>active===entry&&visible();
   entry.promise=Promise.resolve().then(()=>request(expected)).then(view=>{
    if(!current())return;
    if(!samePageScope(scope(),expected)||!samePageScope(view?.scope,expected))throw Object.assign(Error('PAGE_CHANGED'),{code:'PAGE_CHANGED'});
    apply(view);
   }).catch(error=>{if(current())failed(error);}).finally(()=>{if(active===entry)active=null;});
   return entry.promise;
  }
  return {read,invalidate(){active=null;}};
 }

 if(window.top!==window||!document.body||document.getElementById('cor3-helper-controls'))return;
 const shell=globalThis.Cor3HelperUi;if(!shell)return;
 const host=document.createElement('div');host.id='cor3-helper-controls';
 host.style.cssText='display:block';
 const shadow=host.attachShadow({mode:'open'});
 shadow.innerHTML=`<style>
 :host{all:initial;display:block;min-width:0;max-width:100%;overflow-wrap:anywhere;container-type:inline-size;color-scheme:dark;font:12px/1.5 system-ui,sans-serif;color:#d7eef2}*{box-sizing:border-box}button,input,select{font:inherit;color:inherit;background:#16252c;border:1px solid #47717d;border-radius:4px}button{padding:5px 9px;cursor:pointer}button:hover{background:#243b45}button:disabled,input:disabled,select:disabled{opacity:.5;cursor:default}section{position:relative;width:100%;padding:0;background:transparent}#open,header{display:none}.primary{width:100%;background:#83cbd9;color:#04151e;font-weight:700;border-color:#83cbd9;padding:8px}.task-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px}.task-grid label{margin:2px 0;font-size:11px}progress{width:100%;height:5px;accent-color:#83cbd9}.market-times{font-size:11px}.market-times div{display:flex;justify-content:space-between;border-bottom:1px solid #294650;padding:3px 0}.row.end{justify-content:flex-end}.row.end button{padding:3px 8px}section[hidden]{display:none}header,.row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}header{justify-content:space-between;margin-bottom:8px}h2{font-size:14px;margin:0}p{margin:7px 0}details{border-top:1px solid #304650;margin-top:10px;padding-top:8px}summary{font-weight:600;cursor:pointer;color:#8dd6e4}label{display:block;margin:7px 0}label.check{display:flex;align-items:center;gap:6px}input[type=number],select{min-width:0;max-width:100%;width:100%;padding:5px}input[type=checkbox]{accent-color:#55d995}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.5 ui-monospace,monospace;margin:7px 0;color:#b5cbd2}.equipment-info{margin:8px 0 10px;min-width:0}.equipment-info>small{display:block;margin:4px 0}.equipment-state{font-size:11px;color:#8dd6e4}.equipment-stats{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px;margin:6px 0}.equipment-stats th,.equipment-stats td{padding:6px 5px;border-bottom:1px solid #294650;overflow-wrap:anywhere;text-align:right;font-variant-numeric:tabular-nums}.equipment-stats th:first-child,.equipment-stats td:first-child{width:44%;text-align:left}.equipment-stats th{font-weight:500;color:#92b8c4;background:#14262e}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}.status{padding:7px;background:#192b34;border-radius:4px}.notice{color:#f1ca7a;min-height:18px}small{color:#93aeb9}fieldset{border:0;padding:0;margin:0;min-width:0}legend{font-weight:600;color:#b5dce6;margin-top:8px}
 .choice-trigger{width:100%;padding:6px 8px;text-align:left;white-space:normal}.choice-trigger::after{content:' ▾';float:right;color:#8dd6e4}.choice-list{max-height:min(260px,38vh);overflow-y:auto;border:1px solid #47717d;border-radius:4px;background:#101f27;padding:0;margin-top:3px}.choice-list[hidden]{display:none}.choice-option{display:block;width:100%;text-align:left;white-space:normal;padding:8px;border:0;border-bottom:1px solid #29434d;border-radius:0}.choice-option:last-child{border-bottom:0}.type-filter{display:flex;gap:0;margin:5px 0}.type-filter:empty{display:none}.type-filter button{flex:1;min-width:0;border-radius:0;padding:4px 2px;font-size:11px}.type-filter button:first-child{border-radius:3px 0 0 3px}.type-filter button:last-child{border-radius:0 3px 3px 0}.type-filter button[aria-pressed=true]{background:#28515f;color:#c2edf4}.choice-option[aria-pressed=true]{background:#28515f;color:#b8edf4}.choice-option:focus-visible,.choice-trigger:focus-visible{outline:2px solid #8dd6e4;outline-offset:-2px}
 .choice-trigger{padding:8px 10px;background:#10212a;border-color:#416571}.choice-trigger[aria-expanded=true]{background:#18343e;border-color:#83cbd9}.choice-trigger[aria-expanded=true]::after{content:'▴'}.choice-list{border-color:#416571}.choice-option{border-left:3px solid transparent;padding:8px 9px}.choice-option:hover{background:#1b3540}.choice-option[aria-pressed=true]{background:#244956;border-left-color:#83cbd9;color:#d5f3f6}.type-filter{margin:6px 0}.type-filter button{min-height:28px;padding:4px 3px;background:#10212a}.type-filter button+button{margin-left:-1px}.type-filter button[aria-pressed=true]{position:relative;background:#2a5a68;border-color:#72bccb;color:#e1faff;font-weight:600}.equipment-actions{display:flex;justify-content:flex-end;gap:6px;margin:7px 0 10px}.equipment-actions:has(button:not([hidden])){min-height:28px}.equipment-state{color:#93aeb9}.equipment-state.installed{color:#9bd0ba}.hardware-comparison td:last-child{color:#b5e8f1}
 @container (max-width:300px){.type-filter button{font-size:10px;padding:4px 1px}.grid,.task-grid{grid-template-columns:1fr}.market-times div{flex-wrap:wrap;gap:0 6px}}

 #identity{border:1px solid #2f4b58;border-inline-start:2px solid #75c9d8;padding:8px 10px;background:#132731}
 #threeState{color:#abdce5}
 #queue,#cache,#logs{padding:7px 8px;border-radius:4px;background:#091720;border:1px solid #233a45}
 .operation-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:5px}
 .operation-actions button{min-width:0;min-height:36px;padding:6px 4px;line-height:1.35;text-align:center;text-wrap:balance;overflow-wrap:anywhere}
 .operation-actions button:focus-visible{outline:2px solid #a1e6ef;outline-offset:-3px}
 #jobProgress:not(:empty),#autoMarketState:not(:empty){color:#c5e1e9}
 #jobBar{display:block;margin:9px 0;border-radius:3px;overflow:hidden}
 #jobBar[hidden]{display:none}
 #jobResults p{padding:6px 8px;margin:3px 0;background:#12252e;border-radius:4px}
 .market-times div:nth-child(odd){background:#142630}
 .market-times div{padding-inline:7px}
 .loadout{margin-top:14px}
 .loadout>summary{font-size:13px}
 #loadoutAt{display:block;margin:4px 0 10px}
 .equipment-section{padding:10px 0;border-top:1px solid #263c46}
 .equipment-section h3{color:#bce9f0;font-size:12px;margin:0 0 7px}
 .equipment-list{display:grid;align-content:start;gap:5px;max-height:min(330px,42vh);overflow:auto;overscroll-behavior:contain;scrollbar-width:thin}
 .equipment-list[hidden],.equipment-actions button[hidden]{display:none}
 .equipment-card{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:start;gap:8px;width:100%;min-height:52px;padding:8px;text-align:left;background:#10212a;border:1px solid #355361;border-radius:5px;scroll-margin-block:3px}
 .equipment-card:not(:disabled):hover{background:#172e39;border-color:#557d8b}
 .equipment-card[aria-pressed=true],.equipment-card[aria-pressed=true]:not(:disabled):hover{background:#193945;border-color:#73c5d5;box-shadow:inset 2px 0 #83dbe9}
 .equipment-card:focus-visible,.type-filter button:focus-visible,.equipment-actions button:focus-visible,details>summary:focus-visible{outline:2px solid #a1e6ef;outline-offset:2px}
 .equipment-card:focus-visible{outline-offset:-2px}
 .equipment-icon{display:grid;place-items:center;width:100%;aspect-ratio:1;background:#0c1b24;border-radius:4px;color:#90c6d3;overflow:hidden}
 .equipment-icon>img,.equipment-icon>svg{grid-area:1/1;pointer-events:none}
 .equipment-icon>img{width:100%;height:100%;object-fit:contain}
 .equipment-icon>svg{width:72%;height:72%}
 .equipment-name{display:block;font-weight:650;color:#e1f2f5}
 .equipment-metrics{display:flex;flex-wrap:wrap;gap:2px 8px;margin-top:2px;color:#aac7d1;font-size:11px;font-variant-numeric:tabular-nums}
 .equipment-metrics span{max-width:100%}
 .equipment-badge{align-self:start;border-radius:3px;background:#1b3838;padding:2px 4px;color:#aed9ca;font-size:10px;line-height:1.3;max-width:100%}
 .equipment-empty{padding:10px;border:1px dashed #3e5c68;border-radius:5px;color:#9fbac6;margin:6px 0 0}
 .equipment-actions{margin:6px 0 0}
 .equipment-actions button:not([hidden]){min-height:28px;padding-inline:12px;background:#22505e;border-color:#5a9caa;color:#d8f7fb}
 .equipment-actions button:hover:not(:disabled){background:#306371}
 .equipment-actions #unequipSoftware:not([hidden]){background:#182b34;border-color:#49606c}
 .equipment-info{margin:0}
 .equipment-info:empty,#operation:empty{display:none}
 .equipment-info details{margin:7px 0 0;border:0;padding:0}
 .equipment-info summary{font-size:11px}
 .resource-rows{margin-top:6px;padding:1px 8px;background:#0a1923;border:1px solid #365663;border-radius:5px}
 .resource-row{display:grid;grid-template-columns:minmax(67px,25%) minmax(38px,1fr) minmax(76px,30%);gap:6px;padding:5px 1px;align-items:center;font-size:11px;line-height:1.32}
 .resource-row+.resource-row{border-top:1px solid #213b48}
 .resource-label{color:#b7d1da}
 .resource-value{grid-column:3;grid-row:1;text-align:right;color:#e0f3f7;font:500 11px/1.3 ui-monospace,Consolas,monospace;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
 .resource-value small{display:block;margin-top:2px;font:inherit;color:#a3c2cd}
 .resource-track{--step:calc(100% / 24);--cell:calc(var(--step) - min(1.5px,var(--step) * .35));--mark:#8ee8f4;--range:#3c8298;position:relative;height:10px;grid-column:2;grid-row:1;background:#2a5060;overflow:hidden;mask:repeating-linear-gradient(90deg,#000 0 var(--cell),transparent var(--cell) var(--step))}
 .resource-track[data-level=high]{--mark:#f3cb88;--range:#8c6e43}
 .resource-track[data-level=full]{--mark:#ff7c80;--range:#9e4c57}
 .resource-track>span{position:absolute;inset-block:0;inset-inline-start:0;background:var(--mark)}
 .resource-track .resource-range{background:var(--range)}
 .resource-track[data-level=unknown]{height:1px;background:#436570}
 @container (max-width:280px){.resource-track{--step:calc(100% / 16)}.resource-row{grid-template-columns:minmax(0,1fr) auto;gap:3px 6px}.resource-track{grid-column:1/-1;grid-row:2}.resource-value{grid-column:2;max-width:100%}.operation-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @container (max-width:285px){.equipment-card{grid-template-columns:27px minmax(0,1fr);gap:4px 7px}.equipment-badge{grid-column:2;justify-self:start}}

 header{display:none!important}
 </style>
 <button id="open" type="button" aria-expanded="false">Helper 操作</button>
 <section id="panel" aria-label="COR3 Helper 页内面板" hidden>
 <header><h2>COR3 Helper <span id="version"></span></h2><button id="close" aria-label="关闭 Helper 面板">×</button></header>
 <p id="identity" class="status">账号未读取</p><p id="threeState">解密许可未读取</p><pre id="queue">操作状态未读取</pre>
 <div id="jobsArea"><label><input id="autoMarket" type="checkbox" checked> 市场刷新后自动运行</label><p id="autoMarketState" role="status"></p><div id="marketTimes" class="market-times"></div><p><button id="runJobs" class="primary">运行一轮市场任务</button></p><p id="jobProgress" role="status" aria-live="polite">等待手动运行</p><progress id="jobBar" max="1" value="0" hidden></progress><div class="row end"><button id="stopJobs" hidden>停止本轮</button></div><details id="resultDetails" hidden><summary id="resultTitle">本轮明细</summary><div id="jobResults"></div></details><details><summary>任务类型</summary><div id="jobTypes" class="task-grid"></div></details></div>
 <div id="operationsArea" hidden><div class="operation-actions"><button id="state">更新状态</button><button data-refresh="markets">刷新四市场</button><button data-refresh="loadout">刷新配装</button><button data-refresh="expeditions">刷新远征</button><button data-refresh="drone">刷新无人机</button><button data-refresh="daily">刷新日常</button></div>
 <p id="autoRead" aria-live="polite"></p>
 <details id="loadoutSection" class="loadout"><summary>配装</summary><small id="loadoutAt"></small>
 <section class="equipment-section" aria-labelledby="hardwareHeading">
 <h3 id="hardwareHeading">硬件</h3>
 <div id="hardwareTypes" class="type-filter" role="group" aria-label="硬件类型"></div>
 <input id="hardware" type="hidden"><div id="hardwareChoices" class="equipment-list" role="group" aria-label="已有硬件" hidden></div><p id="hardwareEmpty" class="equipment-empty" role="status">未读取</p>
 <div id="hardwareInfo" class="equipment-info"></div><div class="equipment-actions"><button id="equipHardware">更换硬件</button></div>
 </section>
 <section class="equipment-section" aria-labelledby="softwareHeading">
 <h3 id="softwareHeading">软件</h3>
 <div id="softwareTypes" class="type-filter" role="group" aria-label="软件类型"></div>
 <input id="software" type="hidden"><div id="softwareChoices" class="equipment-list" role="group" aria-label="已有软件" hidden></div><p id="softwareEmpty" class="equipment-empty" role="status">未读取</p>
 <div id="softwareInfo" class="equipment-info"></div><div class="equipment-actions"><button id="equipSoftware">安装软件</button><button id="unequipSoftware">卸下软件</button></div>
 </section>
 <details id="systemOverview"><summary>系统概览</summary><div id="systemUsage"></div></details>
 <p id="operation" role="status"></p></details>
 <details><summary>雇佣兵远征</summary><fieldset id="mercForm"><label class="check"><input id="mercEnabled" type="checkbox">雇佣兵自动远征</label>
 <div class="grid"><label class="check"><input id="mercClaim" type="checkbox">自动领取</label><label class="check"><input id="mercDecide" type="checkbox">自动决策</label><label class="check"><input id="mercUsol" type="checkbox">USOL 优先</label><label class="check"><input id="mercCheapest" type="checkbox">优先最便宜</label></div>
 <p id="mercAvailability"></p><div class="choice"><label>雇佣兵</label><button id="mercenary" type="button" class="choice-trigger" aria-label="远征雇佣兵" aria-controls="mercenaryChoices" aria-expanded="false"></button><div id="mercenaryChoices" class="choice-list" role="group" aria-label="远征雇佣兵" hidden></div></div><div class="choice"><label>目的地</label><button id="destination" type="button" class="choice-trigger" aria-label="远征目的地" aria-controls="destinationChoices" aria-expanded="false"></button><div id="destinationChoices" class="choice-list" role="group" aria-label="远征目的地" hidden></div></div>
 <div class="grid"><label>每次总费用上限（CR）<input id="maxCost" type="number" min="0" max="999999" step="1"></label><label>低于此余额暂停（CR）<input id="minCredits" type="number" min="0" max="999999999" step="1"></label></div><small>启用时保存费用上限与余额下限；保险等其他设置保留。</small>
 <p id="mercDirty"></p><button id="saveMerc">保存雇佣兵设置</button></fieldset></details>
 <details><summary>无人机远征</summary><fieldset id="droneForm"><p id="droneAvailability">无人机未读取</p><label class="check"><input id="droneEnabled" type="checkbox">无人机自动远征</label>
 <div class="grid"><label class="check"><input id="dronePaused" type="checkbox">暂停无人机</label><label class="check"><input id="droneAuto" type="checkbox">自动选择任务</label><label class="check"><input id="droneClaim" type="checkbox">无人机自动领取</label><label class="check"><input id="droneDecide" type="checkbox">无人机自动决策</label><label class="check"><input id="droneCharge" type="checkbox">满电后派遣</label></div><p id="droneDirty"></p><button id="saveDrone">保存无人机设置</button></fieldset></details>
 <details><summary>缓存与日志</summary><pre id="savedSettings"></pre><pre id="cache">未读取</pre><pre id="logs">当前页面暂无运行日志</pre></details>
 </div><p id="notice" class="notice" role="status" aria-live="polite"></p></section>`;
 shell.mount('controls',host);
 const el=id=>shadow.getElementById(id),panel=el('panel');let current=null,stale=false,busy=false,dirtyMerc=false,dirtyDrone=false,timer=null,resultsKey=null,timesKey=null;
 for(const name of globalThis.Cor3JobBatchFactory?.types||[]){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;input.dataset.jobType=name;label.append(input,document.createTextNode(' '+name));shadow.getElementById('jobTypes').append(label);}
 const client=()=>globalThis.Cor3InPageControls;
 function setText(node,value){const text=String(value??'');if(globalThis.Cor3UiLanguage?.setText)globalThis.Cor3UiLanguage.setText(node,text);else if(node.textContent!==text)node.textContent=text;}
 el('version').textContent=globalThis.chrome?.runtime?.getManifest?.().version||'2.3.0';
 const dateFormats=new Map();
 const date=x=>{if(!Number.isFinite(x)||x<=0)return '未读取';const language=globalThis.Cor3UiLanguage?.get?.()==='en'?'en-GB':'zh-CN';let formatter=dateFormats.get(language);if(!formatter){formatter=new Intl.DateTimeFormat(language,{year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Shanghai'});dateFormats.set(language,formatter);}return formatter.format(new Date(x));};
 const errors={PAGE_JOB_BATCH_RUNNING:'本轮任务正在执行',PAGE_TASK_BUSY:'当前还有操作在运行，请等空闲后再启动',PAGE_QUEUE_UNREAD:'操作状态尚未读取',PAGE_JOB_LOOP_ENABLED:'请先关闭自动完成所有任务，再使用单轮模式',PAGE_JOB_TYPES_EMPTY:'请至少选择一种任务',PAGE_JOB_REFRESH_UNCONFIRMED:'市场刷新尚未确认，本轮没有启动任务',PAGE_JOB_START_UNCONFIRMED:'任务启动未确认，请查看状态',PAGE_CHANGED:'页面或账号已变化，请重新读取',PAGE_ACCOUNT_UNAVAILABLE:'当前页面账号未确认',PAGE_BINDING_UNAVAILABLE:'当前账号绑定尚未确认',PAGE_AUTOMATION_PAUSED:'自动操作已暂停，设置未更改',PAGE_BUDGET_REQUIRED:'启用前请设置费用上限和余额下限',PAGE_BUDGET_INVALID:'请输入有效的非负整数金额',PAGE_DRONE_UNAVAILABLE:'无人机尚未可用，未启用',PAGE_SELECTION_UNAVAILABLE:'选择已不可用，请重新读取远征',PAGE_EQUIPMENT_NOT_OWNED:'未在当前账号配装中找到所选装备',PAGE_EQUIPMENT_PENDING:'已有配装操作等待确认，请勿重复提交',PAGE_LOADOUT_UNAVAILABLE:'未收到新的配装状态',PAGE_ACTION_REJECTED:'插件未接受此操作',PAGE_ACTION_TIMEOUT:'操作等待超时，结果待核对',CENTER_STORE_TIMEOUT:'后台读取超时，正在重试…',PAGE_SAVE_UNCONFIRMED:'设置保存尚未确认，请读取状态核对'};
 const choices=new Map();
 for(const name of ['mercenary','destination'])choices.set(name,createInlineChoice(el(name),el(name+'Choices'),()=>{for(const choice of choices.values())choice.close?.();}));
 shadow.addEventListener('click',event=>{for(const [name,choice]of choices)if(!event.composedPath().includes(el(name))&&!event.composedPath().includes(el(name+'Choices')))choice.close?.();});
 function options(control,items,empty){choices.get(control.id).set(items,empty);}
 function createEquipmentList(control, list, emptyState) {
  const cards = new Map();
  let previousIds = [], items = [];
  const outlines = {
   CPU:'M6 6h12v12H6z M9 9h6v6H9z M9 3v3m6-3v3m-6 12v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3',
   GPU:'M3 6h18v11H3z M3 8H1v11m6-2v2h8v-2 M9 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m7 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5',
   RAM:'M2 7h20v10h-8l-2-2-2 2H2z M6 10h3v3H6zm9 0h3v3h-3z M5 17v2m3-2v2m8-2v2m3-2v2',
   PSU:'M4 4h16v16H4z M13 7l-4 6h4l-2 4 5-6h-4z',
   HACK:'M3 5h18v14H3z M6 9l3 3-3 3m6 0h5',
   DECRYPT:'M5 11h14v9H5z M9 11V7a3 3 0 1 1 6 0m-3 7v3',
   SEARCH:'M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12m4.5 10.5L20 20',
   VIEW:'M2 12q10-13 20 0-10 13-20 0zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
   LOAD:'M4 15v5h16v-5 M12 4v11m-4-4 4 4 4-4',
   other:'M3 5h18v14H3z M3 9h18m-14 4h4m-4 3h8',
  };
  function updateIcon(card, item) {
   const type = control.id === 'hardware' ? item.category : item.functions?.[0]?.type;
   const outline = Object.hasOwn(outlines,type) ? outlines[type] : outlines.other;
   const imageUrl = item.image || '';
   if (card.outline === outline && card.imageUrl === imageUrl) return;
   card.outline = outline;
   card.imageUrl = imageUrl;
   const ns = 'http://www.w3.org/2000/svg';
   const fallback = document.createElementNS(ns,'svg');
   fallback.setAttribute('viewBox','0 0 24 24');
   const path = document.createElementNS(ns,'path');
   for (const [name,value] of Object.entries({d:outline,fill:'none',stroke:'currentColor','stroke-width':'1.5','stroke-linecap':'round','stroke-linejoin':'round'})) path.setAttribute(name,value);
   fallback.append(path);
   card.icon.replaceChildren(fallback);
   if (!imageUrl) return;
   const image = document.createElement('img');
   image.alt = '';
   image.referrerPolicy = 'no-referrer';
   image.loading = 'lazy';
   image.decoding = 'async';
   // Keep the image in layout at zero opacity so lazy loading can start when the card is visible.
   image.style.opacity = '0';
   image.addEventListener('load',() => { image.style.opacity = '1'; fallback.style.visibility = 'hidden'; },{once:true});
   image.addEventListener('error',() => image.remove(),{once:true});
   image.src = imageUrl;
   card.icon.append(image);
  }
  const apply = () => {
   for (const [id, card] of cards) {
    const pressed = String(id === control.value);
    if (card.button.getAttribute('aria-pressed') !== pressed) card.button.setAttribute('aria-pressed', pressed);
    if (card.button.disabled !== control.disabled) card.button.disabled = control.disabled;
   }
  };
  list.addEventListener('click', event => {
   const button = event.target.closest('[data-equipment-id]');
   if (control.disabled || !button || cards.get(button.value)?.button !== button || control.value === button.value) return;
   control.value = button.value;
   apply();
   control.dispatchEvent(new Event('change', {bubbles:true}));
  });
  list.addEventListener('keydown', event => {
   if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
   const row = event.target.closest('[data-equipment-id]');
   const index = previousIds.indexOf(row?.value);
   if (index < 0 || control.disabled) return;
   const last = previousIds.length - 1;
   const target = {Home:0, End:last, ArrowUp:Math.max(0,index-1), ArrowDown:Math.min(last,index+1)}[event.key];
   event.preventDefault();
   cards.get(previousIds[target]).button.focus();
  });
  function createCard(id) {
   const button = document.createElement('button');
   button.type = 'button';
   button.value = id;
   button.dataset.equipmentId = id;
   button.dataset.value = id;
   button.className = 'equipment-card';
   const icon = document.createElement('span');
   icon.className = 'equipment-icon';
   icon.setAttribute('aria-hidden','true');
   const copy = document.createElement('span');
   copy.className = 'equipment-copy';
   const name = document.createElement('span');
   name.className = 'equipment-name';
   name.setAttribute('data-language-raw','');
   const details = document.createElement('span');
   details.className = 'equipment-metrics';
   const installed = document.createElement('span');
   installed.className = 'equipment-badge';
   setText(installed,'已安装');
   copy.append(name, details);
   button.append(icon, copy, installed);
   return {button, icon, name, details, installed, metricsKey:''};
  }
  function updateCard(card, item) {
   updateIcon(card,item);
   if (card.name.textContent !== item.name) card.name.textContent = item.name;
   card.installed.hidden = item.installed !== true;
   const values = control.id === 'hardware' ? item.stats || [] : item.functions || [];
   const key = JSON.stringify(values);
   if (key === card.metricsKey) return;
   card.metricsKey = key;
   const text = (value, unit) => Number.isFinite(value) ? value + (unit ? ' ' + unit : '') : '—';
   const lines = values.map(row => control.id === 'hardware'
    ? row.label + ' ' + text(row.value,row.unit)
    : row.type + ' ' + (row.min === null && row.max === null ? '—' : text(row.min) + '–' + text(row.max)));
   if (!lines.length) lines.push(control.id === 'hardware' ? '参数未读取' : '功能参数未读取');
   card.details.replaceChildren(...lines.map(line => {
    const metric = document.createElement('span');
    setText(metric,line);
    return metric;
   }));
  }
  return {
   sync: apply,
   set(next, empty) {
    if (items !== next) {
     items = next;
     const ids = [...new Set(items.map(item => item.id))];
     const retained = new Set(ids);
     for (const [id, card] of cards) {
      if (!retained.has(id)) { card.button.remove(); cards.delete(id); }
     }
     for (const item of items) {
      if (!cards.has(item.id)) cards.set(item.id, createCard(item.id));
      updateCard(cards.get(item.id), item);
     }
     if (ids.length !== previousIds.length || ids.some((id,index) => id !== previousIds[index])) {
      for (const [index, id] of ids.entries()) {
       const button = cards.get(id).button;
       if (list.children[index] !== button) list.insertBefore(button, list.children[index] || null);
      }
      list.scrollTop = 0;
      previousIds = ids;
     }
    }
    if (!cards.has(control.value)) control.value = items.find(item => item.installed)?.id ?? items[0]?.id ?? '';
    list.hidden = !items.length;
    emptyState.hidden = !!items.length;
    if (!items.length) setText(emptyState, empty);
    apply();
   },
  };
 }
 for (const name of ['hardware','software']) {
  choices.set(name, createEquipmentList(el(name),el(name+'Choices'),el(name+'Empty')));
 }
 const loadoutFilter={hardware:'CPU',software:'HACK'},filterKeys={hardware:'',software:''},typeSelection={hardware:new Map(),software:new Map()};
 const softwareKinds=['HACK','DECRYPT','SEARCH','VIEW','LOAD'],softwareLabels={HACK:'入侵',DECRYPT:'解密',SEARCH:'搜索',VIEW:'查看',LOAD:'加载',OTHER:'其他'};
 function renderLoadout(view){
  const hardware=view?.loadout?.hardware||[],software=view?.loadout?.software||[];
  const kinds={hardware:['CPU','GPU','RAM','PSU',...(hardware.some(x=>!['CPU','GPU','RAM','PSU'].includes(x.category))?['OTHER']:[])],software:[...softwareKinds,...(software.some(x=>!x.functions?.length||x.functions.some(f=>!softwareKinds.includes(f.type)))?['OTHER']:[])]};
  for(const kind of ['hardware','software']){
   if(!kinds[kind].includes(loadoutFilter[kind]))loadoutFilter[kind]=kinds[kind][0]||'';
   const group=el(kind+'Types'),key=kinds[kind].join('|');
   if(filterKeys[kind]!==key){filterKeys[kind]=key;group.replaceChildren();for(const type of kinds[kind]){const button=document.createElement('button');button.type='button';button.dataset.loadoutType=type;setText(button,kind==='software'?softwareLabels[type]:type==='OTHER'?'其他':type);group.append(button);}}
   for(const button of group.children){const pressed=String(button.dataset.loadoutType===loadoutFilter[kind]);if(button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);}
  }
  const rows={hardware:hardware.filter(x=>loadoutFilter.hardware==='OTHER'?!['CPU','GPU','RAM','PSU'].includes(x.category):x.category===loadoutFilter.hardware),software:software.filter(x=>loadoutFilter.software==='OTHER'?!x.functions?.length||x.functions.some(f=>!softwareKinds.includes(f.type)):x.functions?.some(f=>f.type===loadoutFilter.software))};
  for(const kind of ['hardware','software']){options(el(kind),rows[kind],rows[kind].length?'':view?.loadout?.available?'此类装备为空':'未读取');const selected=typeSelection[kind].get(loadoutFilter[kind]);if(selected&&rows[kind].some(x=>x.id===selected)){el(kind).value=selected;choices.get(kind).sync();}else if(selected)typeSelection[kind].delete(loadoutFilter[kind]);}
  renderEquipment(view);
 }
 let hardwareKey='',softwareKey='',equipmentScope='',hardwareScope='';
 const resourceNumber=value=>Number.isFinite(value)?String(value):'—';
 function renderResourceRows(parent,readings,isDemand=false){
  const list=document.createElement('div');list.className='resource-rows';
  for(const reading of readings){
   const row=document.createElement('div');row.className='resource-row';
   const label=document.createElement('span');label.className='resource-label';setText(label,reading.label);
   const track=document.createElement('div');track.className='resource-track';track.setAttribute('aria-hidden','true');
   const value=document.createElement('span');value.className='resource-value';
   const unit=reading.unit?' '+reading.unit:'';
   const base=isDemand?reading.min:reading.used;
   const peak=isDemand?reading.max:reading.used;
   const capacity=reading.capacity;
   const range=isDemand&&Number.isFinite(base)&&base===peak?resourceNumber(base):resourceNumber(base)+(isDemand?'–':' / ')+resourceNumber(isDemand?peak:capacity);
   value.textContent=range+unit;
   if(isDemand&&Number.isFinite(reading.allocated)){
    const allocated=document.createElement('small');setText(allocated,'当前 '+resourceNumber(reading.allocated)+unit);value.append(allocated);
   }
   const known=Number.isFinite(capacity)&&capacity>0&&(Number.isFinite(base)||Number.isFinite(peak));
   const ratio=known?(Number.isFinite(peak)?peak:base)/capacity:null;
   track.dataset.level=ratio===null?'unknown':ratio>=.95?'full':ratio>=.8?'high':'normal';
   if(known){
    const fill=(amount,className)=>{const band=document.createElement('span');band.className=className;band.style.width=100*Math.min(1,Math.max(0,amount/capacity))+'%';track.append(band);};
    if(isDemand&&Number.isFinite(peak))fill(peak,'resource-range');
    if(Number.isFinite(base))fill(base,'resource-base');
   }
   row.append(label,track,value);list.append(row);
  }
  parent.append(list);
 }
 function renderEquipment(view){
  const hardware=view?.loadout?.hardware||[],software=view?.loadout?.software||[],selected=hardware.find(x=>x.id===el('hardware').value),installed=selected&&hardware.find(x=>x.installed&&x.category===selected.category),program=software.find(x=>x.id===el('software').value);
  const capacity=new Map((view?.loadout?.resources||[]).map(row=>[row.key,row.capacity]));
  const demands=program?.demands?.map(row=>({...row,capacity:capacity.get(row.key),allocated:program.installed?row.allocated:null}));
  const hwKey=JSON.stringify([view?.scope,selected,installed]),swKey=JSON.stringify([view?.scope,program,demands]),scopeKey=JSON.stringify(view?.scope);if(hwKey===hardwareKey&&swKey===softwareKey)return;const keepResources=scopeKey===equipmentScope&&el('softwareInfo').querySelector('details')?.open===true;equipmentScope=scopeKey;
  const element=(tag,value)=>{const node=document.createElement(tag);if(value!==undefined)setText(node,value);return node;};
  const number=value=>Number.isFinite(value)?String(value):'—';
  function table(parent,headers,rows){if(!rows.length)return;const node=element('table');node.className='equipment-stats'+(parent.id==='hardwareInfo'?' hardware-comparison':'');const head=element('thead'),heading=element('tr');for(const name of headers)heading.append(element('th',name));head.append(heading);const body=element('tbody');for(const values of rows){const row=element('tr');for(const value of values)row.append(element('td',value));body.append(row);}node.append(head,body);parent.append(node);}
  function metadata(parent,item){if(!item)return;const name=String(item.name||'').toLowerCase(),line=[item.manufacturer,item.version].filter(value=>value&&!name.includes(String(value).toLowerCase())).join(' · ');if(line){const node=element('small',line);node.setAttribute('data-language-raw','');parent.append(node);}}
  if (hwKey !== hardwareKey) {
   hardwareKey = hwKey;
   const holder = el('hardwareInfo');
   const open = scopeKey === hardwareScope && holder.querySelector('details')?.open === true;
   hardwareScope = scopeKey;
   holder.replaceChildren();
   if (selected && installed && selected.id !== installed.id) {
    const current = new Map((installed.stats || []).map(row => [row.key,row]));
    const candidate = new Map((selected.stats || []).map(row => [row.key,row]));
    const keys = new Set([...current.keys(), ...candidate.keys()]);
    if (keys.size) {
     const details = element('details');
     details.open = open;
     details.append(element('summary','对比当前硬件'));
     table(details,['参数','当前','所选'], [...keys].map(key => {
      const measurement = candidate.get(key) || current.get(key);
      return [measurement.label + (measurement.unit ? ' · ' + measurement.unit : ''), number(current.get(key)?.value), number(candidate.get(key)?.value)];
     }));
     holder.append(details);
    }
   }
  }
  if (swKey !== softwareKey) {
   softwareKey = swKey;
   const holder = el('softwareInfo');
   holder.replaceChildren();
   if (program) {
    metadata(holder,program);
    if (demands?.length) {
     const details = element('details');
     details.open = keepResources;
     details.append(element('summary','资源需求'));
     renderResourceRows(details,demands,true);
     holder.append(details);
    }
   }
  }
 }

 let resourceKey = '', resourceScope = '';
 function renderSystemUsage(view) {
  const scope = JSON.stringify(view?.scope);
  if (scope !== resourceScope) {
   if (resourceScope) el('systemOverview').open = false;
   resourceScope = scope;
  }
  const rows = view?.loadout?.resources || [];
  const key = JSON.stringify([scope,rows]);
  if (key === resourceKey) return;
  resourceKey = key;
  const mount = el('systemUsage');
  mount.replaceChildren();
  if (!rows.length) {
   const empty = document.createElement('p');
   empty.className = 'equipment-empty';
   setText(empty,'暂无资源数据');
   mount.append(empty);
   return;
  }
  renderResourceRows(mount,rows);
 }
 function enabled(){const write=!!current?.allowed&&!busy&&!stale;shadow.querySelectorAll('[data-refresh],#autoMarket,[data-job-type],#equipHardware,#equipSoftware,#unequipSoftware,#saveMerc,#saveDrone').forEach(x=>x.disabled=!write);el('mercForm').disabled=!write;el('droneForm').disabled=!write;el('hardware').disabled=stale||!current?.loadout.available;el('software').disabled=stale||!current?.loadout.available;el('equipHardware').disabled||=!el('hardware').value;el('equipSoftware').disabled||=!el('software').value;el('unequipSoftware').disabled||=!el('software').value;el('droneEnabled').disabled=!write||(!current?.droneAvailable&&!el('droneEnabled').checked);el('state').disabled=busy;const running=['queued','reconnecting','waiting-minigame','refreshing','starting','waiting-ack','running','finishing','cancelling'].includes(current?.jobs?.batch?.phase);el('runJobs').disabled=!write||running||current?.queue?.active==='auto-jobs'||current?.queue?.queued?.includes('auto-jobs');el('stopJobs').hidden=!['queued','waiting-minigame','refreshing','starting','waiting-ack','running','finishing','cancelling','reconnecting'].includes(current?.jobs?.batch?.phase);el('stopJobs').disabled=!write||current?.jobs?.batch?.phase==='cancelling';for(const choice of choices.values())choice.sync();const hw=current?.loadout?.hardware?.find(x=>x.id===el('hardware').value),sw=current?.loadout?.software?.find(x=>x.id===el('software').value);el('equipHardware').disabled||=hw?.installed===true;el('equipSoftware').disabled||=sw?.installed===true;el('unequipSoftware').disabled||=sw?.installed!==true;const pending=['queued','requested','unconfirmed'].includes(current?.operation?.phase);for(const id of ['equipHardware','equipSoftware','unequipSoftware'])el(id).disabled||=pending;el('equipHardware').hidden=!hw||hw.installed===true;el('equipSoftware').hidden=!sw||sw.installed===true;el('unequipSoftware').hidden=!sw||sw.installed!==true;}
 function jobProgress(batch){
  const phases={queued:'本轮已排队'+(batch.waitingFor?' · 等待 '+batch.waitingFor:''),reconnecting:'连接正在重新核对；执行结果尚未确认','waiting-minigame':'限时小游戏进行中，市场任务等待',refreshing:'正在刷新市场…',starting:'正在启动任务…','waiting-ack':'等待执行器确认；端点仍由本轮占用',finishing:'正在核对本轮结果',running:batch.leaseExpired?'端点占用已超时，等待本轮结束确认':'正在执行',cancelling:'正在停止，等待当前步骤结束',complete:batch.summary&&(batch.summary.failed||batch.summary.skipped)?'本轮已结束，请核对明细':batch.unreadMarkets?.length?'本轮已结束，部分市场未读取':batch.ready?'本轮已完成，可继续主线':'本轮已完成，等待当前操作结束',cancelled:batch.ready?'本轮已停止，可继续其他事项':'已停止，等待当前操作结束',blocked:errors[batch.code]||'本轮未确认，请查看状态',unconfirmed:'部分结果未确认，请核对任务与日志'};
  return (phases[batch.phase]||batch.phase)+(batch.total?' · '+(batch.processed??batch.done)+' / '+batch.total:'')+(batch.current?' · '+batch.current:'')+(batch.summary?' · 成功 '+batch.summary.done+' / 失败 '+batch.summary.failed+' / 跳过 '+batch.summary.skipped:'');
 }
 function renderJobs(jobs,previousBatch,changed=false){
  if(jobs&&Object.hasOwn(jobs,'autoEnabled')){el('autoMarket').checked=jobs.autoEnabled;const a=jobs.autoStatus;setText(el('autoMarketState'),jobs.autoEnabled?({waiting:jobs.batch?.source==='manual'?'自动调度等待手动批次结束':'等待限时操作或当前任务结束','waiting-permission':'等待当前页面许可',submitted:'刷新后的一轮已加入队列',empty:'本次刷新没有待执行任务',review:'自动任务待核对：'+(a?.code||'请查看日志'),'legacy-loop':'已有连续自动任务，未重复启动'}[a?.phase]||'任一市场读到新任务后自动排队'):'已关闭自动运行');}
  const batch=jobs?.batch;
  setText(el('jobProgress'),batch?jobProgress(batch):(jobs?.autoEnabled??current?.jobs?.autoEnabled)?'等待任一市场新任务':'等待手动运行');
  if(batch&&['running','complete','cancelled','blocked','unconfirmed'].includes(batch.phase)&&previousBatch?.phase!==batch.phase)setText(el('notice'),'');
  el('jobBar').hidden=!batch?.total;el('jobBar').max=batch?.total||1;el('jobBar').value=batch?.processed??batch?.done??0;setText(el('stopJobs'),batch?.phase==='queued'?'取消排队':'停止本轮');
  const rows=batch?(batch.results||[]):(jobs?.recent?.rows||[]),statusLabels={pending:'等待',running:'执行中',done:'成功',failed:'失败',skipped:'跳过',bugged:'跳过',unknown:'未确认'};
  el('resultDetails').hidden=!rows.length;setText(el('resultTitle'),batch?'本轮明细':'最近任务记录 · '+date(jobs?.recent?.at));const nextResultsKey=JSON.stringify([current?.scope?.accountId,current?.scope?.documentId,rows]);if(resultsKey!==nextResultsKey){resultsKey=nextResultsKey;el('jobResults').replaceChildren();for(const item of rows){const row=document.createElement('p');const message=item.error==='No compatible game software is available.'?'缺少兼容的游戏软件':item.error;row.textContent=(statusLabels[item.status]||'未确认')+' · '+item.name+(message?' · '+message:'');el('jobResults').append(row);}}
  if(rows.some(x=>x.status==='failed')&&(changed||previousBatch?.phase!==batch?.phase&&batch?.phase==='complete'))el('resultDetails').open=true;
  if(batch?.reason)setText(el('notice'),{AUTO_JOB_ENGINE_UNAVAILABLE:'任务脚本未就绪；本轮未启动，可在状态日志核对',PAGE_AUTOMATION_PAUSED:'页面许可已停止；本轮未启动'}[batch.reason]||'执行器启动未确认');
  shell.setTaskStatus?.(batch);
 }
 const queueText=queue=>queue?`执行：${queue.active||'空闲'} · 等待：${queue.queued.length}\n端点：${queue.owner||'空闲'}${queue.blocked?' · '+queue.blocked:''}`:'操作状态未读取';
 function renderSolverStatus(){const three=globalThis.Cor3ThreeAutomation;setText(el('threeState'),three?'解密许可：'+(three.allowed()?'开':'等待')+' · '+(three.status()?.code||'SOLVER_STARTING'):'解密许可未读取');}
 function sampleStatus(){
  const status=client()?.readStatus?.();
  if(!status)return;
  shell.setQueueStatus?.(status);
  verifyVisibleScope();
  if(!panel.hidden)return;
  const {scope,queue,batch,connection}=status;
  renderSolverStatus();
  setText(el('identity'),scope?scope.accountId+' · '+(status.allowed?'页面许可开':'自动操作暂停'):'当前账号绑定尚未确认 · '+connection);
  setText(el('queue'),queueText(queue));
  setText(el('jobProgress'),batch?jobProgress(batch):queue?'当前无单轮任务':'当前进度未确认');
  shell.setTaskStatus?.(batch);
 }
 function render(view){if(stale)setText(el('notice'),'');stale=false;const changed=!current||current.scope.documentId!==view.scope.documentId||current.scope.accountId!==view.scope.accountId;if(changed){typeSelection.hardware.clear();typeSelection.software.clear();loadoutFilter.hardware='CPU';loadoutFilter.software='HACK';dirtyMerc=false;dirtyDrone=false;for(const [name,choice]of choices){el(name).value='';choice.close?.();}}const previousBatch=current?.jobs?.batch;current=view;shadow.querySelectorAll('input[type=checkbox]').forEach(x=>x.indeterminate=false);
  renderJobs(view.jobs,previousBatch,changed);
  const nextTimesKey=JSON.stringify([view.scope,view.jobs?.resets]);if(timesKey!==nextTimesKey){timesKey=nextTimesKey;el('marketTimes').replaceChildren();for(const key of ['home','dark','soyuz','usol']){const row=document.createElement('div'),label=document.createElement('span'),value=document.createElement('span');label.textContent={home:'CORE',dark:'D4RK',soyuz:'SOYUZ',usol:'USOL'}[key];const timestamp=Date.parse(view.jobs?.resets?.[key]);value.textContent=Number.isFinite(timestamp)?date(timestamp):'刷新时间未读取';row.append(label,value);el('marketTimes').append(row);}}
  syncJobTypes(view.jobs);
  setText(el('version'),view.version);setText(el('identity'),view.scope.accountId+' · '+(view.allowed?'页面许可开':'自动操作暂停'));
  setText(el('queue'),queueText(view.queue));
  if(el('loadoutSection').open)renderLoadout(view);else if(changed){options(el('hardware'),[],'未读取');options(el('software'),[],'未读取');renderEquipment(null);}renderSystemUsage(view);setText(el('loadoutAt'),'配装更新：'+date(view.loadout.at));setText(el('operation'),view.operation?view.operation.phase+' · '+view.operation.details:'');
  if(!dirtyMerc){const m=view.merc;el('mercEnabled').checked=m.enabled===true;el('mercClaim').checked=m.autoClaim!==false;el('mercDecide').checked=m.autoDecide!==false;el('mercUsol').checked=m.autoChooseUsolFirst!==false;el('mercCheapest').checked=m.autoChooseMerc===true;options(el('mercenary'),view.mercenaries,'自动选择');options(el('destination'),view.locations,'按插件规则选择');el('mercenary').value=m.mercenaryId||'';el('destination').value=m.locationConfigId||'';el('maxCost').value=Number.isSafeInteger(m.maxMercCost)?String(m.maxMercCost):'';el('minCredits').value=Number.isSafeInteger(m.minCredits)?String(m.minCredits):'';}
  if(!dirtyDrone){const d=view.drone;el('droneEnabled').checked=d.enabled===true;el('dronePaused').checked=d.paused===true;el('droneAuto').checked=d.autoChooseLocation!==false;el('droneClaim').checked=d.autoClaim!==false;el('droneDecide').checked=d.autoDecide!==false;el('droneCharge').checked=d.fullChargeOnly===true;}
  setText(el('mercDirty'),dirtyMerc?'有未保存修改':'');setText(el('droneDirty'),dirtyDrone?'有未保存修改':'');const states={ready:'已读取',empty:'已读取，列表为空',unread:'未读取'};setText(el('mercAvailability'),'CORE：'+states[view.readStatus.coreMercenaries]+' · USOL：'+states[view.readStatus.usolMercenaries]);
  setText(el('droneAvailability'),view.readStatus.drone==='ready'?'无人机已读取，可用':view.readStatus.drone==='none'?'已读取，当前无无人机；解锁状态未确认':view.readStatus.drone==='error'?'无人机读取失败：'+view.readStatus.droneError:'无人机未读取');
  const flag=x=>x===true?'开':x===false?'关':'未设置',m=view.retainedSettings.merc,d=view.retainedSettings.drone;
  setText(el('savedSettings'),'Auto Update Markets：'+flag(view.defaults.markets)+' · Auto Daily：'+flag(view.defaults.daily)+'\n费用限制：'+flag(m.applyMercCostLimiter)+' · 上限：'+(m.maxMercCost??'未设置')+' CR\n余额保护：'+flag(m.pauseBelowCredits)+' · 下限：'+(m.minCredits??'未设置')+' CR\n远征保险：'+flag(m.hasInsurance)+' · 无人机维修：'+flag(d.repairEnabled)+' · 维修失败暂停：'+flag(d.pauseOnRepairFail));
  const labels={marketDataUpdatedAt:'HOME',darkMarketDataUpdatedAt:'D4RK',soyuzMarketDataUpdatedAt:'SOYUZ',usolMarketDataUpdatedAt:'USOL',expeditionsDataUpdatedAt:'远征',droneDataUpdatedAt:'无人机',dailyOpsUpdatedAt:'Daily'};setText(el('cache'),Object.entries(view.cache).map(([k,v])=>labels[k]+' '+date(v)).join('\n'));setText(el('logs'),view.logs.map(x=>date(x.at)+' '+x.code+' '+x.message).join('\n')||'当前页面暂无运行日志');enabled();
 }
 function currentScope(){return globalThis.Cor3CenterIdentity?.snapshot()||null;}
 function syncJobTypes(jobs){
  if(!jobs)return;
  el('autoMarket').checked=jobs.autoEnabled;
  for(const input of shadow.querySelectorAll('[data-job-type]'))input.checked=jobs.types.includes(input.dataset.jobType);
 }
 function applyView(view){
  render(view);
  const result=globalThis.Cor3PageDataLoader?.status(),names={loadout:'配装',expeditions:'远征',drone:'无人机',daily:'日常',markets:'市场'};
  const own=samePageScope(result?.scope,view.scope);
  setText(el('autoRead'),own?(result.phase==='waiting'?'自动读取等待当前任务结束（'+result.owner+'）':result.phase==='loading'?'正在自动读取'+names[result.kind]+'…':result.phase==='partial'?'尚未读到：'+result.failed.map(x=>names[x]||x).join('、'):result.phase==='retrying'?'读取暂时失败，正在重试…':''):'等待当前页面许可后自动读取');
 }
 function showReadError(e){
   const local=globalThis.Cor3CenterIdentity?.snapshot(),sameDocument=local&&current&&local.accountId===current.scope.accountId&&local.documentId===current.scope.documentId;
   if(sameDocument){syncJobTypes(current.jobs);stale=true;shell.setTaskStatus?.({...current.jobs?.batch,phase:'reconnecting'});setText(el('identity'),current.scope.accountId+' · 连接正在重新核对');setText(el('queue'),'操作状态暂未确认；保留上次读数\n'+(globalThis.Cor3UiLanguage?.source(el('queue'))||el('queue').textContent).replace(/^操作状态暂未确认；保留上次读数\n/,''));setText(el('jobProgress'),'最近读到：'+(globalThis.Cor3UiLanguage?.source(el('jobProgress'))||el('jobProgress').textContent).replace(/^最近读到：/,''));setText(el('notice'),'正在自动恢复读取，请勿重复启动或刷新游戏');enabled();return;}
   stale=true;current=null;setText(el('notice'),'');shell.setTaskStatus?.(null);setText(el('jobProgress'),'当前进度未确认');el('jobBar').hidden=true;el('resultDetails').hidden=true;resultsKey=null;timesKey=null;el('jobResults').replaceChildren();el('marketTimes').replaceChildren();setText(el('identity'),errors[e.code||e.message]||'当前页面状态未读取');setText(el('autoRead'),'等待当前页面许可后自动读取');setText(el('mercAvailability'),'雇佣兵未读取');setText(el('droneAvailability'),'无人机未读取');setText(el('savedSettings'),'保存设置未读取');setText(el('queue'),'操作状态未读取');setText(el('loadoutAt'),'配装更新：未读取');options(el('hardware'),[],'未读取');options(el('software'),[],'未读取');renderEquipment(null);renderSystemUsage(null);typeSelection.hardware.clear();typeSelection.software.clear();el('softwareTypes').replaceChildren();filterKeys.software='';options(el('mercenary'),[],'未读取');options(el('destination'),[],'未读取');el('maxCost').value='';el('minCredits').value='';shadow.querySelectorAll('input[type=checkbox]').forEach(x=>x.indeterminate=true);setText(el('logs'),'当前页面日志未读取');setText(el('operation'),'');enabled();
 }
 const reader=createViewReader({
  scope:currentScope,visible:()=>!panel.hidden,apply:applyView,failed:showReadError,
  request:scope=>client()?.read(scope)??Promise.reject(Error('PAGE_CLIENT_NOT_READY')),
 });
 function verifyVisibleScope(){
  if(current&&!samePageScope(current.scope,currentScope())){
   reader.invalidate();
   showReadError({code:'PAGE_CHANGED'});
  }
 }
 function read(){
  verifyVisibleScope();
  renderSolverStatus();
  return busy?Promise.resolve():reader.read();
 }
 async function act(event,fn,success){
  if(!event.isTrusted){setText(el('notice'),'请使用真实点击操作此按钮');return false;}
  verifyVisibleScope();
  if(busy||stale||!current?.allowed)return false;
  const scope={...current.scope};
  reader.invalidate();
  busy=true;
  enabled();
  let notice;
  try{
   const result=await fn(scope);
   notice=success||(result.phase==='queued'?'已排队，等待执行':result.phase==='saved'?'设置已保存并读回确认':'请求已发出，请核对游戏结果');
  }catch(e){
   notice=errors[e.code||e.message]||'操作未确认，请读取状态与日志';
  }finally{
   try{
    if(!panel.hidden&&samePageScope(currentScope(),scope))await reader.read();
    verifyVisibleScope();
    if(!panel.hidden&&samePageScope(currentScope(),scope))setText(el('notice'),notice);
   }finally{
    busy=false;
    enabled();
    schedule();
   }
  }
  return true;
 }
 function schedule(){clearTimeout(timer);if(panel.hidden)return;const urgent=stale||['queued','requested'].includes(current?.operation?.phase)||['loading','waiting','waiting-permission'].includes(globalThis.Cor3PageDataLoader?.status().phase),active=['queued','reconnecting','waiting-minigame','refreshing','starting','waiting-ack','running','finishing','cancelling'].includes(current?.jobs?.batch?.phase);timer=setTimeout(async()=>{if(!busy)await read();schedule();},urgent?750:active?3000:5000);}
 client()?.onJobsState?.(event=>{
  sampleStatus();
  if(panel.hidden||!samePageScope(currentScope(),event.scope))return;
  const previous=current?.jobs?.batch;
  const q=samePageScope(event.queue,event.scope)?event.queue:null;
  if(samePageScope(current?.scope,event.scope)){
   const queue=q?{active:q.active,queued:q.queued||[],owner:q.lease?.owner,blocked:q.blocked}:null;
   current={...current,jobs:{...current.jobs,batch:event.batch},queue};
   setText(el('queue'),queueText(queue));
  }
  if(event.batch?.phase==='reconnecting')stale=true;
  renderJobs({batch:event.batch},previous);enabled();
 });
 shell.onOpen(tab=>{globalThis.Cor3PageDataLoader?.ensure();if(tab==='status')return;panel.hidden=false;el('jobsArea').hidden=tab!=='tasks';el('operationsArea').hidden=tab!=='operations';void read();schedule();});
 shell.onClose(()=>{for(const choice of choices.values())choice.close?.();panel.hidden=true;clearTimeout(timer);sampleStatus();});
 const selectedJobTypes=()=>[...shadow.querySelectorAll('[data-job-type]')].filter(x=>x.checked).map(x=>x.dataset.jobType);
 async function saveJobSettings(event){
  const enabled=el('autoMarket').checked,types=selectedJobTypes();
  if(!await act(event,scope=>client().saveAutoMarket(enabled,types,scope)))syncJobTypes(current?.jobs);
 }
 el('autoMarket').addEventListener('change',event=>void saveJobSettings(event));
 el('jobTypes').addEventListener('change',event=>void saveJobSettings(event));
 el('runJobs').addEventListener('click',e=>void act(e,scope=>client().runJobs([...shadow.querySelectorAll('[data-job-type]')].filter(x=>x.checked).map(x=>x.dataset.jobType),scope),'本轮已加入队列，进度会自动更新'));
 el('stopJobs').addEventListener('click',e=>void act(e,scope=>client().stopJobs(scope),'已请求取消本轮，等待当前步骤结束'));
 el('open').addEventListener('click',()=>{panel.hidden=!panel.hidden;el('open').setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){globalThis.Cor3PageDataLoader?.ensure();void read();schedule();}else{clearTimeout(timer);}});
 el('close').addEventListener('click',()=>{panel.hidden=true;clearTimeout(timer);el('open').setAttribute('aria-expanded','false');});
 el('state').addEventListener('click',()=>void read());
 shadow.querySelectorAll('[data-refresh]').forEach(button=>button.addEventListener('click',e=>void act(e,s=>client().refresh(button.dataset.refresh,s))));
 for(const [button,kind,install]of [['equipHardware','hardware',true],['equipSoftware','software',true],['unequipSoftware','software',false]])el(button).addEventListener('click',event=>{const id=el(kind).value;void act(event,scope=>client().equip(kind,id,install,scope));});
 el('loadoutSection').addEventListener('toggle',() => {
  if (!el('loadoutSection').open) return;
  renderLoadout(current);
  renderSystemUsage(current);
  enabled();
 });
 for (const kind of ['hardware','software']) {
  el(kind+'Types').addEventListener('keydown', event => {
   const keys = ['ArrowLeft','ArrowRight','Home','End'];
   if (!keys.includes(event.key)) return;
   const buttons = Array.from(el(kind+'Types').children);
   const index = buttons.indexOf(event.target);
   if (index < 0) return;
   const last = buttons.length - 1;
   const target = {Home:0, End:last, ArrowLeft:(index+last)%buttons.length, ArrowRight:(index+1)%buttons.length}[event.key];
   event.preventDefault();
   buttons[target].focus();
  });
 }
 for(const name of ['hardware','software'])el(name).addEventListener('change',()=>{typeSelection[name].set(loadoutFilter[name],el(name).value);renderEquipment(current);enabled();});
 for(const kind of ['hardware','software'])el(kind+'Types').addEventListener('click',event=>{const button=event.target.closest('[data-loadout-type]');if(!current||!button||!el(kind+'Types').contains(button))return;typeSelection[kind].set(loadoutFilter[kind],el(kind).value);loadoutFilter[kind]=button.dataset.loadoutType;for(const choice of choices.values())choice.close?.();renderLoadout(current);enabled();});
 for(const event of ['input','change']){el('mercForm').addEventListener(event,()=>{dirtyMerc=true;el('mercDirty').textContent='有未保存修改';});el('droneForm').addEventListener(event,()=>{dirtyDrone=true;el('droneDirty').textContent='有未保存修改';enabled();});}
 el('saveMerc').addEventListener('click',e=>void act(e,async scope=>{const patch={enabled:el('mercEnabled').checked,autoClaim:el('mercClaim').checked,autoDecide:el('mercDecide').checked,autoChooseUsolFirst:el('mercUsol').checked,autoChooseMerc:el('mercCheapest').checked,mercenaryId:el('mercenary').value||null,locationConfigId:el('destination').value||null};if(patch.enabled){patch.maxMercCost=el('maxCost').valueAsNumber;patch.minCredits=el('minCredits').valueAsNumber;patch.applyMercCostLimiter=true;patch.pauseBelowCredits=true;}const result=await client().saveMerc(patch,scope);dirtyMerc=false;return result;}));
 el('saveDrone').addEventListener('click',e=>void act(e,async scope=>{const result=await client().saveDrone({enabled:el('droneEnabled').checked,paused:el('dronePaused').checked,autoClaim:el('droneClaim').checked,autoDecide:el('droneDecide').checked,autoChooseLocation:el('droneAuto').checked,fullChargeOnly:el('droneCharge').checked},scope);dirtyDrone=false;return result;}));
 enabled();sampleStatus();const statusTimer=setInterval(sampleStatus,5000);
 window.addEventListener('pagehide',()=>{reader.invalidate();clearTimeout(timer);clearInterval(statusTimer);host.remove();},{once:true});
})();
