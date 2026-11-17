/* Ordinary in-page UI backed by isolated extension code. Mutation requires a trusted click. */
(() => {'use strict';
 function createInlineChoice(control,list,beforeOpen=()=>{}){
  const label=control.getAttribute('aria-label')||'',doc=control.ownerDocument;
  let rows=[],signature='',renderCount=0;
  const disabled=()=>control.disabled||control.closest('fieldset')?.disabled===true;
  function close(){list.hidden=true;control.setAttribute('aria-expanded','false');}
  function sync(){
   const selected=rows.find(x=>x.value===control.value);
   if(!selected)control.value=rows[0]?.value||'';
   const text=rows.find(x=>x.value===control.value)?.label||label;
   if(control.textContent!==text)control.textContent=text;
   control.dataset.value=control.value;control.setAttribute('aria-label',label+'：'+text);
   for(const option of list.children)option.setAttribute('aria-pressed',String(option.value===control.value));
   if(disabled())close();
  }
  function set(items,empty){
   const next=[...(empty?[{value:'',label:empty}]:[]),...items.map(item=>({value:String(item.id),label:item.name+(item.category?' · '+item.category:'')+(item.installed?'（已安装）':'')}))];
   const key=JSON.stringify(next);
   if(key!==signature){
    signature=key;rows=next;const scroll=list.scrollTop;list.replaceChildren();++renderCount;
    for(const row of rows){const option=doc.createElement('button');option.type='button';option.className='choice-option';option.dataset.choiceOption='';option.dataset.value=row.value;option.value=row.value;option.textContent=row.label;list.append(option);}
    list.scrollTop=scroll;
   }
   sync();
  }
  control.addEventListener('click',()=>{if(disabled())return;if(!list.hidden){close();return;}beforeOpen();list.hidden=false;control.setAttribute('aria-expanded','true');});
  list.addEventListener('click',event=>{
   const option=event.target.closest('[data-choice-option]');
   if(disabled()||list.hidden||!option||!list.contains(option)||!rows.some(x=>x.value===option.value))return;
   const changed=control.value!==option.value;control.value=option.value;sync();close();
   if(changed)control.dispatchEvent(new Event('change',{bubbles:true}));
  });
  for(const node of [control,list])node.addEventListener('keydown',event=>{if(event.key==='Escape'){close();event.preventDefault();event.stopPropagation();}});
  close();return Object.freeze({set,sync,close,isOpen:()=>!list.hidden,renderCount:()=>renderCount});
 }

 if(window.top!==window||!document.body||document.getElementById('cor3-helper-controls'))return;
 const shell=globalThis.Cor3HelperUi;if(!shell)return;
 const host=document.createElement('div');host.id='cor3-helper-controls';
 host.style.cssText='display:block';
 const shadow=host.attachShadow({mode:'open'});
 shadow.innerHTML=`<style>
 :host{all:initial;display:block;min-width:0;max-width:100%;overflow-wrap:anywhere;container-type:inline-size;color-scheme:dark;font:12px/1.5 system-ui,sans-serif;color:#d7eef2}*{box-sizing:border-box}button,input,select{font:inherit;color:inherit;background:#16252c;border:1px solid #47717d;border-radius:4px}button{padding:5px 9px;cursor:pointer}button:hover{background:#243b45}button:disabled,input:disabled,select:disabled{opacity:.5;cursor:default}section{position:relative;width:100%;padding:0;background:transparent}#open,header{display:none}.primary{width:100%;background:#83cbd9;color:#04151e;font-weight:700;border-color:#83cbd9;padding:8px}.task-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px}.task-grid label{margin:2px 0;font-size:11px}progress{width:100%;height:5px;accent-color:#83cbd9}.market-times{font-size:11px}.market-times div{display:flex;justify-content:space-between;border-bottom:1px solid #294650;padding:3px 0}.row.end{justify-content:flex-end}.row.end button{padding:3px 8px}section[hidden]{display:none}header,.row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}header{justify-content:space-between;margin-bottom:8px}h2{font-size:14px;margin:0}p{margin:7px 0}details{border-top:1px solid #304650;margin-top:10px;padding-top:8px}summary{font-weight:600;cursor:pointer;color:#8dd6e4}label{display:block;margin:7px 0}label.check{display:flex;align-items:center;gap:6px}input[type=number],select{min-width:0;max-width:100%;width:100%;padding:5px}input[type=checkbox]{accent-color:#55d995}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.5 ui-monospace,monospace;margin:7px 0;color:#b5cbd2}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}.status{padding:7px;background:#192b34;border-radius:4px}.notice{color:#f1ca7a;min-height:18px}small{color:#93aeb9}fieldset{border:0;padding:0;margin:0;min-width:0}legend{font-weight:600;color:#b5dce6;margin-top:8px}
 .choice-trigger{width:100%;padding:6px 8px;text-align:left;white-space:normal}.choice-trigger::after{content:' ▾';float:right;color:#8dd6e4}.choice-list{max-height:160px;overflow-y:auto;border:1px solid #47717d;border-radius:4px;background:#101f27;padding:3px;margin-top:3px}.choice-list[hidden]{display:none}.choice-option{display:block;width:100%;text-align:left;white-space:normal;padding:6px 8px;border:0;border-radius:2px}.choice-option[aria-pressed=true]{background:#28515f;color:#b8edf4}.choice-option:focus-visible,.choice-trigger:focus-visible{outline:2px solid #8dd6e4;outline-offset:-2px}
 @container (max-width:300px){.grid,.task-grid{grid-template-columns:1fr}.market-times div{flex-wrap:wrap;gap:0 6px}}
 header{display:none!important}
 </style>
 <button id="open" type="button" aria-expanded="false">Helper 操作</button>
 <section id="panel" aria-label="COR3 Helper 页内面板" hidden>
 <header><h2>COR3 Helper <span id="version"></span></h2><button id="close" aria-label="关闭 Helper 面板">×</button></header>
 <p id="identity" class="status">账号未读取</p><p id="threeState">解密许可未读取</p><pre id="queue">操作状态未读取</pre>
 <div id="jobsArea"><label><input id="autoMarket" type="checkbox" checked> 市场刷新后自动运行</label><p id="autoMarketState" role="status"></p><div id="marketTimes" class="market-times"></div><p><button id="runJobs" class="primary">运行一轮市场任务</button></p><p id="jobProgress" role="status" aria-live="polite">等待手动运行</p><progress id="jobBar" max="1" value="0" hidden></progress><div class="row end"><button id="stopJobs" hidden>停止本轮</button></div><details id="resultDetails" hidden><summary id="resultTitle">本轮明细</summary><div id="jobResults"></div></details><details><summary>任务类型</summary><div id="jobTypes" class="task-grid"></div></details></div>
 <div id="operationsArea" hidden><div class="row"><button id="state">更新状态</button><button data-refresh="markets">刷新四市场</button><button data-refresh="loadout">刷新配装</button><button data-refresh="expeditions">刷新远征</button><button data-refresh="drone">刷新无人机</button><button data-refresh="daily">刷新日常</button></div>
 <p id="autoRead" aria-live="polite"></p>
 <details><summary>配装</summary><p id="equipped">配装未读取</p><small id="loadoutAt"></small>
 <div class="choice"><label>已有硬件</label><button id="hardware" type="button" class="choice-trigger" aria-label="已有硬件" aria-controls="hardwareChoices" aria-expanded="false"></button><div id="hardwareChoices" class="choice-list" role="group" aria-label="已有硬件" hidden></div></div><button id="equipHardware">更换硬件</button>
 <div class="choice"><label>已有软件</label><button id="software" type="button" class="choice-trigger" aria-label="已有软件" aria-controls="softwareChoices" aria-expanded="false"></button><div id="softwareChoices" class="choice-list" role="group" aria-label="已有软件" hidden></div></div><div class="row"><button id="equipSoftware">安装软件</button><button id="unequipSoftware">卸下软件</button></div><p id="operation"></p></details>
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
 const el=id=>shadow.getElementById(id),panel=el('panel');let current=null,stale=false,busy=false,dirtyMerc=false,dirtyDrone=false,timer=null,generation=0,readFlight=null,dirtyJobs=false,resultsKey=null,timesKey=null;
 for(const name of globalThis.Cor3JobBatchFactory?.types||[]){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;input.dataset.jobType=name;label.append(input,document.createTextNode(' '+name));shadow.getElementById('jobTypes').append(label);}
 const client=()=>globalThis.Cor3InPageControls;
 el('version').textContent=globalThis.chrome?.runtime?.getManifest?.().version||'2.1.0';
 const date=x=>Number.isFinite(x)&&x>0?new Date(x).toLocaleString('zh-CN',{hour12:false,timeZone:'Asia/Shanghai'}):'未读取';
 const errors={PAGE_JOB_BATCH_RUNNING:'本轮任务正在执行',PAGE_TASK_BUSY:'当前还有操作在运行，请等空闲后再启动',PAGE_QUEUE_UNREAD:'操作状态尚未读取',PAGE_JOB_LOOP_ENABLED:'请先关闭自动完成所有任务，再使用单轮模式',PAGE_JOB_TYPES_EMPTY:'请至少选择一种任务',PAGE_JOB_REFRESH_UNCONFIRMED:'市场刷新尚未确认，本轮没有启动任务',PAGE_JOB_START_UNCONFIRMED:'任务启动未确认，请查看状态',PAGE_CHANGED:'页面或账号已变化，请重新读取',PAGE_ACCOUNT_UNAVAILABLE:'当前页面账号未确认',PAGE_BINDING_UNAVAILABLE:'当前账号绑定尚未确认',PAGE_AUTOMATION_PAUSED:'自动操作已暂停，设置未更改',PAGE_BUDGET_REQUIRED:'启用前请设置费用上限和余额下限',PAGE_BUDGET_INVALID:'请输入有效的非负整数金额',PAGE_DRONE_UNAVAILABLE:'无人机尚未可用，未启用',PAGE_SELECTION_UNAVAILABLE:'选择已不可用，请重新读取远征',PAGE_EQUIPMENT_NOT_OWNED:'未在当前账号配装中找到所选装备',PAGE_EQUIPMENT_PENDING:'已有配装操作等待确认，请勿重复提交',PAGE_LOADOUT_UNAVAILABLE:'未收到新的配装状态',PAGE_ACTION_REJECTED:'插件未接受此操作',PAGE_SAVE_UNCONFIRMED:'设置保存尚未确认，请读取状态核对'};
 const choices=new Map();
 for(const name of ['hardware','software','mercenary','destination'])choices.set(name,createInlineChoice(el(name),el(name+'Choices'),()=>{for(const choice of choices.values())choice.close();}));
 shadow.addEventListener('pointerdown',event=>{for(const [name,choice]of choices)if(!event.composedPath().includes(el(name))&&!event.composedPath().includes(el(name+'Choices')))choice.close();});
 function options(control,items,empty){choices.get(control.id).set(items,empty);}

 function enabled(){const write=!!current?.allowed&&!busy&&!stale;shadow.querySelectorAll('[data-refresh],#autoMarket,[data-job-type],#equipHardware,#equipSoftware,#unequipSoftware,#saveMerc,#saveDrone').forEach(x=>x.disabled=!write);el('mercForm').disabled=!write;el('droneForm').disabled=!write;el('hardware').disabled=!write||!current?.loadout.available;el('software').disabled=!write||!current?.loadout.available;el('equipHardware').disabled||=!el('hardware').value;el('equipSoftware').disabled||=!el('software').value;el('unequipSoftware').disabled||=!el('software').value;el('droneEnabled').disabled=!write||(!current?.droneAvailable&&!el('droneEnabled').checked);el('state').disabled=busy;const running=['queued','reconnecting','waiting-minigame','refreshing','starting','waiting-ack','running','finishing','cancelling'].includes(current?.jobs?.batch?.phase);el('runJobs').disabled=!write||running||current?.queue?.active==='auto-jobs'||current?.queue?.queued?.includes('auto-jobs');el('stopJobs').hidden=!['queued','waiting-minigame','refreshing','starting','waiting-ack','running','finishing','cancelling','reconnecting'].includes(current?.jobs?.batch?.phase);el('stopJobs').disabled=!write||current?.jobs?.batch?.phase==='cancelling';for(const choice of choices.values())choice.sync();}
 function renderJobs(jobs,previousBatch,changed=false){
  if(jobs&&Object.hasOwn(jobs,'autoEnabled')){el('autoMarket').checked=jobs.autoEnabled;const a=jobs.autoStatus;el('autoMarketState').textContent=jobs.autoEnabled?({waiting:'等待限时操作或当前任务结束',submitted:'刷新后的一轮已加入队列',empty:'本次刷新没有待执行任务',review:'自动任务待核对：'+(a?.code||'请查看日志'),'legacy-loop':'已有连续自动任务，未重复启动'}[a?.phase]||'任一市场读到新任务后自动排队'):'已关闭自动运行';}
  const batch=jobs?.batch,phases={queued:'本轮已排队'+(batch?.waitingFor?' · 等待 '+batch.waitingFor:''),reconnecting:'连接正在重新核对；执行结果尚未确认','waiting-minigame':'限时小游戏进行中，市场任务等待',refreshing:'正在刷新市场…',starting:'正在启动任务…','waiting-ack':'等待执行器确认；端点仍由本轮占用',finishing:'正在核对本轮结果',running:'正在执行',cancelling:'正在停止，等待当前步骤结束',complete:batch?.summary&&(batch.summary.failed||batch.summary.skipped)?'本轮已结束，请核对明细':batch?.unreadMarkets?.length?'本轮已结束，部分市场未读取':batch?.ready?'本轮已完成，可继续主线':'本轮已完成，等待当前操作结束',cancelled:batch?.ready?'本轮已停止，可继续其他事项':'已停止，等待当前操作结束',blocked:errors[batch?.code]||'本轮未确认，请查看状态',unconfirmed:'部分结果未确认，请核对任务与日志'};
  el('jobProgress').textContent=batch?(phases[batch.phase]||batch.phase)+(batch.total?' · '+(batch.processed??batch.done)+' / '+batch.total:'')+(batch.current?' · '+batch.current:'')+(batch.summary?' · 成功 '+batch.summary.done+' / 失败 '+batch.summary.failed+' / 跳过 '+batch.summary.skipped:''):(jobs?.autoEnabled??current?.jobs?.autoEnabled)?'等待任一市场新任务':'等待手动运行';
  if(batch&&['running','complete','cancelled','blocked','unconfirmed'].includes(batch.phase)&&previousBatch?.phase!==batch.phase)el('notice').textContent='';
  el('jobBar').hidden=!batch?.total;el('jobBar').max=batch?.total||1;el('jobBar').value=batch?.processed??batch?.done??0;el('stopJobs').textContent=batch?.phase==='queued'?'取消排队':'停止本轮';
  const rows=batch?(batch.results||[]):(jobs?.recent?.rows||[]),statusLabels={pending:'等待',running:'执行中',done:'成功',failed:'失败',skipped:'跳过',bugged:'跳过',unknown:'未确认'};
  el('resultDetails').hidden=!rows.length;el('resultTitle').textContent=batch?'本轮明细':'最近任务记录 · '+date(jobs?.recent?.at);const nextResultsKey=JSON.stringify([current?.scope?.accountId,current?.scope?.documentId,rows]);if(resultsKey!==nextResultsKey){resultsKey=nextResultsKey;el('jobResults').replaceChildren();for(const item of rows){const row=document.createElement('p');row.textContent=(statusLabels[item.status]||'未确认')+' · '+item.name+(item.error?' · '+item.error:'');el('jobResults').append(row);}}
  if(rows.some(x=>x.status==='failed')&&(changed||previousBatch?.phase!==batch?.phase&&batch?.phase==='complete'))el('resultDetails').open=true;
  if(batch?.reason)el('notice').textContent={AUTO_JOB_ENGINE_UNAVAILABLE:'任务脚本未就绪；本轮未启动，可在状态日志核对',PAGE_AUTOMATION_PAUSED:'页面许可已停止；本轮未启动'}[batch.reason]||'执行器启动未确认';
  shell.setTaskStatus?.(batch);
 }
 function render(view,force=false){if(stale)el('notice').textContent='';stale=false;const changed=!current||current.scope.documentId!==view.scope.documentId||current.scope.accountId!==view.scope.accountId;if(changed){dirtyMerc=false;dirtyDrone=false;for(const [name,choice]of choices){el(name).value='';choice.close();}}const previousBatch=current?.jobs?.batch;current=view;shadow.querySelectorAll('input[type=checkbox]').forEach(x=>x.indeterminate=false);
  if(changed)dirtyJobs=false;
  renderJobs(view.jobs,previousBatch,changed);
  const nextTimesKey=JSON.stringify([view.scope,view.jobs?.resets]);if(timesKey!==nextTimesKey){timesKey=nextTimesKey;el('marketTimes').replaceChildren();for(const key of ['home','dark','soyuz','usol']){const row=document.createElement('div'),label=document.createElement('span'),value=document.createElement('span');label.textContent={home:'CORE',dark:'D4RK',soyuz:'SOYUZ',usol:'USOL'}[key];const timestamp=Date.parse(view.jobs?.resets?.[key]);value.textContent=Number.isFinite(timestamp)?date(timestamp):'刷新时间未读取';row.append(label,value);el('marketTimes').append(row);}}
  if(!dirtyJobs)for(const input of shadow.querySelectorAll('[data-job-type]'))input.checked=view.jobs?.types?.includes(input.dataset.jobType)!==false;
  el('version').textContent=view.version;el('identity').textContent=view.scope.accountId+' · '+(view.allowed?'页面许可开':'自动操作暂停');
  el('queue').textContent=view.queue?`执行：${view.queue.active||'空闲'} · 等待：${view.queue.queued.length}\n端点：${view.queue.owner||'空闲'}${view.queue.blocked?' · '+view.queue.blocked:''}`:'操作状态未读取';
  options(el('hardware'),view.loadout.hardware,'选择已有硬件');options(el('software'),view.loadout.software,'选择已有软件');el('equipped').textContent=view.loadout.available?(view.loadout.equippedHardware.map(x=>x.category+': '+x.name).join(' · ')||'暂无已安装硬件'):'配装未读取';el('loadoutAt').textContent='配装更新：'+date(view.loadout.at);el('operation').textContent=view.operation?view.operation.phase+' · '+view.operation.details:'';
  if(!dirtyMerc||force){const m=view.merc;el('mercEnabled').checked=m.enabled===true;el('mercClaim').checked=m.autoClaim!==false;el('mercDecide').checked=m.autoDecide!==false;el('mercUsol').checked=m.autoChooseUsolFirst!==false;el('mercCheapest').checked=m.autoChooseMerc===true;options(el('mercenary'),view.mercenaries,'自动选择');options(el('destination'),view.locations,'按插件规则选择');el('mercenary').value=m.mercenaryId||'';el('destination').value=m.locationConfigId||'';el('maxCost').value=Number.isSafeInteger(m.maxMercCost)?String(m.maxMercCost):'';el('minCredits').value=Number.isSafeInteger(m.minCredits)?String(m.minCredits):'';}
  if(!dirtyDrone||force){const d=view.drone;el('droneEnabled').checked=d.enabled===true;el('dronePaused').checked=d.paused===true;el('droneAuto').checked=d.autoChooseLocation!==false;el('droneClaim').checked=d.autoClaim!==false;el('droneDecide').checked=d.autoDecide!==false;el('droneCharge').checked=d.fullChargeOnly===true;}
  el('mercDirty').textContent=dirtyMerc?'有未保存修改':'';el('droneDirty').textContent=dirtyDrone?'有未保存修改':'';const states={ready:'已读取',empty:'已读取，列表为空',unread:'未读取'};el('mercAvailability').textContent='CORE：'+states[view.readStatus.coreMercenaries]+' · USOL：'+states[view.readStatus.usolMercenaries];
  el('droneAvailability').textContent=view.readStatus.drone==='ready'?'无人机已读取，可用':view.readStatus.drone==='none'?'已读取，当前无无人机；解锁状态未确认':view.readStatus.drone==='error'?'无人机读取失败：'+view.readStatus.droneError:'无人机未读取';
  const flag=x=>x===true?'开':x===false?'关':'未设置',m=view.retainedSettings.merc,d=view.retainedSettings.drone;
  el('savedSettings').textContent='Auto Update Markets：'+flag(view.defaults.markets)+' · Auto Daily：'+flag(view.defaults.daily)+'\n费用限制：'+flag(m.applyMercCostLimiter)+' · 上限：'+(m.maxMercCost??'未设置')+' CR\n余额保护：'+flag(m.pauseBelowCredits)+' · 下限：'+(m.minCredits??'未设置')+' CR\n远征保险：'+flag(m.hasInsurance)+' · 无人机维修：'+flag(d.repairEnabled)+' · 维修失败暂停：'+flag(d.pauseOnRepairFail);
  const labels={marketDataUpdatedAt:'HOME',darkMarketDataUpdatedAt:'D4RK',soyuzMarketDataUpdatedAt:'SOYUZ',usolMarketDataUpdatedAt:'USOL',expeditionsDataUpdatedAt:'远征',droneDataUpdatedAt:'无人机',dailyOpsUpdatedAt:'Daily'};el('cache').textContent=Object.entries(view.cache).map(([k,v])=>labels[k]+' '+date(v)).join('\n');el('logs').textContent=view.logs.map(x=>date(x.at)+' '+x.code+' '+x.message).join('\n')||'当前页面暂无运行日志';enabled();
 }
 async function readOnce(force=false){const three=globalThis.Cor3ThreeAutomation;el('threeState').textContent=three?'解密许可：'+(three.allowed()?'开':'等待')+' · '+(three.status()?.code||'SOLVER_STARTING'):'解密许可未读取';const ticket=++generation;try{if(!client())throw Error('PAGE_CLIENT_NOT_READY');const view=await client().read();if(ticket===generation&&panel.hidden===false){render(view,force);
   const result=globalThis.Cor3PageDataLoader?.status(),names={loadout:'配装',expeditions:'远征',drone:'无人机',daily:'日常',markets:'市场'};
   const own=result?.scope?.accountId===view.scope.accountId&&result.scope.documentId===view.scope.documentId;
   el('autoRead').textContent=own?(result.phase==='waiting'?'自动读取等待当前任务结束（'+result.owner+'）':result.phase==='loading'?'正在自动读取'+names[result.kind]+'…':result.phase==='partial'?'尚未读到：'+result.failed.map(x=>names[x]||x).join('、'):''):'等待当前页面许可后自动读取';
  }}catch(e){if(ticket===generation){
   const local=globalThis.Cor3CenterIdentity?.snapshot(),sameDocument=local&&current&&local.accountId===current.scope.accountId&&local.documentId===current.scope.documentId;
   if(sameDocument){stale=true;el('identity').textContent=current.scope.accountId+' · 连接正在重新核对';el('queue').textContent='操作状态暂未确认；保留上次读数\n'+el('queue').textContent.replace(/^操作状态暂未确认；保留上次读数\n/,'');el('jobProgress').textContent='最近读到：'+el('jobProgress').textContent.replace(/^最近读到：/,'');el('notice').textContent='正在自动恢复读取，请勿重复启动或刷新游戏';enabled();return;}
   stale=true;current=null;el('jobProgress').textContent='当前进度未确认';el('jobBar').hidden=true;el('resultDetails').hidden=true;resultsKey=null;timesKey=null;el('jobResults').replaceChildren();el('marketTimes').replaceChildren();el('identity').textContent=errors[e.code]||'当前页面状态未读取';el('autoRead').textContent='等待当前页面许可后自动读取';el('mercAvailability').textContent='雇佣兵未读取';el('droneAvailability').textContent='无人机未读取';el('savedSettings').textContent='保存设置未读取';el('queue').textContent='操作状态未读取';el('equipped').textContent='配装状态未读取';el('loadoutAt').textContent='配装更新：未读取';options(el('hardware'),[],'未读取');options(el('software'),[],'未读取');options(el('mercenary'),[],'未读取');options(el('destination'),[],'未读取');el('maxCost').value='';el('minCredits').value='';shadow.querySelectorAll('input[type=checkbox]').forEach(x=>x.indeterminate=true);el('logs').textContent='当前页面日志未读取';el('operation').textContent='';enabled();}}}
 async function read(force=false){if(readFlight)return readFlight;readFlight=readOnce(force);try{return await readFlight;}finally{readFlight=null;}}
 async function act(event,fn,success){if(!event.isTrusted){el('notice').textContent='请使用真实点击操作此按钮';return;}if(busy||stale||!current?.allowed)return;const scope={...current.scope};busy=true;enabled();try{const result=await fn(scope);el('notice').textContent=success||(result.phase==='queued'?'已排队，等待执行':result.phase==='saved'?'设置已保存并读回确认':'请求已发出，请核对游戏结果');await read();}catch(e){el('notice').textContent=errors[e.code]||'操作未确认，请读取状态与日志';}finally{busy=false;enabled();schedule();}}
 function schedule(){clearTimeout(timer);if(panel.hidden)return;const urgent=stale||['queued','requested'].includes(current?.operation?.phase)||['loading','waiting','waiting-permission'].includes(globalThis.Cor3PageDataLoader?.status().phase),active=['queued','reconnecting','waiting-minigame','refreshing','starting','waiting-ack','running','finishing','cancelling'].includes(current?.jobs?.batch?.phase);timer=setTimeout(async()=>{if(!busy)await read();schedule();},urgent?750:active?3000:5000);}
 client()?.onJobsState?.(event=>{const local=globalThis.Cor3CenterIdentity?.snapshot();if(!local||local.accountId!==event.scope.accountId||local.documentId!==event.scope.documentId){shell.setTaskStatus?.(null);current=null;stale=true;el('jobProgress').textContent='当前进度未确认';el('jobBar').hidden=true;enabled();return;}
  const previous=current?.jobs?.batch,q=event.queue,own=current&&current.scope.accountId===local.accountId&&current.scope.documentId===local.documentId;
  if(own){current={...current,jobs:{...current.jobs,batch:event.batch},queue:q?{active:q.active,queued:q.queued||[],owner:q.lease?.owner,blocked:q.blocked}:null};el('queue').textContent=q?'执行：'+(q.active||'空闲')+' · 等待：'+(q.queued?.length||0)+'\n端点：'+(q.lease?.owner||'空闲')+(q.blocked?' · '+q.blocked:''):'操作状态未确认';}
  if(event.batch?.phase==='reconnecting')stale=true;renderJobs({batch:event.batch},previous);enabled();
 });
 shell.onOpen(tab=>{if(tab==='status')return;panel.hidden=false;el('jobsArea').hidden=tab!=='tasks';el('operationsArea').hidden=tab!=='operations';globalThis.Cor3PageDataLoader?.ensure();void read();schedule();});
 shell.onClose(()=>{for(const choice of choices.values())choice.close();panel.hidden=true;++generation;clearTimeout(timer);});
 const selectedJobTypes=()=>[...shadow.querySelectorAll('[data-job-type]')].filter(x=>x.checked).map(x=>x.dataset.jobType);
 el('autoMarket').addEventListener('change',e=>void act(e,scope=>client().saveAutoMarket(el('autoMarket').checked,selectedJobTypes(),scope)));
 el('jobTypes').addEventListener('change',e=>{dirtyJobs=true;void act(e,async scope=>{const result=await client().saveAutoMarket(el('autoMarket').checked,selectedJobTypes(),scope);dirtyJobs=false;return result;});});
 el('runJobs').addEventListener('click',e=>void act(e,scope=>client().runJobs([...shadow.querySelectorAll('[data-job-type]')].filter(x=>x.checked).map(x=>x.dataset.jobType),scope),'本轮已加入队列，进度会自动更新'));
 el('stopJobs').addEventListener('click',e=>void act(e,scope=>client().stopJobs(scope),'已请求取消本轮，等待当前步骤结束'));
 el('open').addEventListener('click',()=>{panel.hidden=!panel.hidden;el('open').setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){globalThis.Cor3PageDataLoader?.ensure();void read();schedule();}else{++generation;clearTimeout(timer);}});
 el('close').addEventListener('click',()=>{panel.hidden=true;++generation;clearTimeout(timer);el('open').setAttribute('aria-expanded','false');});
 el('state').addEventListener('click',()=>void read());
 shadow.querySelectorAll('[data-refresh]').forEach(button=>button.addEventListener('click',e=>void act(e,s=>client().refresh(button.dataset.refresh,s))));
 for(const [button,kind,install]of [['equipHardware','hardware',true],['equipSoftware','software',true],['unequipSoftware','software',false]])el(button).addEventListener('click',e=>void act(e,s=>client().equip(kind,el(kind).value,install,s)));
 for(const name of ['hardware','software'])el(name).addEventListener('change',enabled);
 for(const event of ['input','change']){el('mercForm').addEventListener(event,()=>{dirtyMerc=true;el('mercDirty').textContent='有未保存修改';});el('droneForm').addEventListener(event,()=>{dirtyDrone=true;el('droneDirty').textContent='有未保存修改';enabled();});}
 el('saveMerc').addEventListener('click',e=>void act(e,async scope=>{const patch={enabled:el('mercEnabled').checked,autoClaim:el('mercClaim').checked,autoDecide:el('mercDecide').checked,autoChooseUsolFirst:el('mercUsol').checked,autoChooseMerc:el('mercCheapest').checked,mercenaryId:el('mercenary').value||null,locationConfigId:el('destination').value||null};if(patch.enabled){patch.maxMercCost=el('maxCost').valueAsNumber;patch.minCredits=el('minCredits').valueAsNumber;patch.applyMercCostLimiter=true;patch.pauseBelowCredits=true;}const result=await client().saveMerc(patch,scope);dirtyMerc=false;return result;}));
 el('saveDrone').addEventListener('click',e=>void act(e,async scope=>{const result=await client().saveDrone({enabled:el('droneEnabled').checked,paused:el('dronePaused').checked,autoClaim:el('droneClaim').checked,autoDecide:el('droneDecide').checked,autoChooseLocation:el('droneAuto').checked,fullChargeOnly:el('droneCharge').checked},scope);dirtyDrone=false;return result;}));
 enabled();window.addEventListener('pagehide',()=>{++generation;clearTimeout(timer);host.remove();},{once:true});
})();
