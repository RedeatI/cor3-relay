import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source = name => readFileSync(new URL('../extension/' + name, import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
const accountId = 'FREEL_FF000009-0009';

function pageReader(){
 const text=source('inpage-controls.js');
 const context=vm.createContext({});
 vm.runInContext(text.slice(text.indexOf(' const samePageScope='),text.indexOf('\n if(window.top'))+'\nglobalThis.readerFactory=createViewReader;',context);
 let visible=true, scope={accountId,documentId:'first'};
 const calls=[],applied=[],errors=[];
 const reader=context.readerFactory({
  scope:()=>scope,visible:()=>visible,apply:view=>applied.push(view),failed:error=>errors.push(error),
  request:expected=>new Promise(resolve=>calls.push({expected,resolve})),
 });
 return {reader,calls,applied,errors,show:state=>visible=state,change:()=>scope={accountId,documentId:'second'}};
}

test('a rapid close and reopen renders the in-flight read without waiting for another poll',async()=>{
 const f=pageReader(),first=f.reader.read();await flush();
 f.show(false);await f.reader.read();f.show(true);
 assert.equal(f.reader.read(),first);assert.equal(f.calls.length,1);
 f.calls[0].resolve({scope:f.calls[0].expected});await first;
 assert.equal(f.applied.length,1);assert.equal(f.errors.length,0);
});

test('a read cannot render after closing, changing documents or superseding it after an action',async()=>{
 const f=pageReader(),hidden=f.reader.read();await flush();f.show(false);
 f.calls[0].resolve({scope:f.calls[0].expected});await hidden;assert.equal(f.applied.length,0);
 f.show(true);const before=f.reader.read();await flush();f.change();const after=f.reader.read();await flush();
 f.calls[1].resolve({scope:f.calls[1].expected});await before;assert.equal(f.applied.length,0);
 f.reader.invalidate();const newest=f.reader.read();await flush();
 f.calls[2].resolve({scope:f.calls[2].expected});await after;assert.equal(f.applied.length,0);
 f.calls[3].resolve({scope:f.calls[3].expected});await newest;
 assert.equal(f.applied[0].scope.documentId,'second');assert.equal(f.errors.length,0);
});

function popupStatus(){
 const calls=[],events={};let change;
 const binding={accountId,documentId:'popup',epoch:1};
 const details={open:false,addEventListener:(name,fn)=>events[name]=fn};
 const output={textContent:''};
 const context={document:{getElementById:id=>id==='runtimeStatus'?details:output},Cor3CenterUi:{binding:async()=>binding,ready:Promise.resolve()},Cor3CenterStore:{
  get:()=>new Promise(resolve=>calls.push(resolve)),onChanged:{addListener:fn=>change=fn},
 }};
 vm.runInNewContext(source('runtime-status-ui.js'),context);
 return {calls,binding,output,show(state){details.open=state;events.toggle();},change:()=>change({automationRunLogs:{}})};
}

test('the toolbar status collapses bursts into a trailing read and discards the reply from a closed view',async()=>{
 const f=popupStatus();f.show(true);await flush();assert.equal(f.calls.length,1);
 for(let i=0;i<10;i++)f.change();await flush();assert.equal(f.calls.length,1);
 f.show(false);f.show(true);
 f.calls[0]({networkRuntimeStatus:{...f.binding,active:'old',queued:[],lease:null}});await flush();
 assert.equal(f.output.textContent,'');assert.equal(f.calls.length,2);
 f.calls[1]({networkRuntimeStatus:{...f.binding,active:'current',lease:{owner:'actual'}},automationRunLogs:{...f.binding,entries:null}});await flush();
 assert.match(f.output.textContent,/执行：current/);assert.match(f.output.textContent,/排队：未读取/);
 assert.equal(f.calls.length,2);
});
