import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../extension/inpage-controls.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf(' function createInlineChoice('),source.indexOf(' if(window.top'));
class Node{
 constructor(doc){this.ownerDocument=doc;this.children=[];this.attrs={};this.dataset={};this.listeners={};this.value='';this.disabled=false;this.hidden=false;this.scrollTop=0;this.textContent='';this.parent=null;}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f);}dispatchEvent(e){for(const f of this.listeners[e.type]||[])f(e);}
 append(n){n.parent=this;this.children.push(n);}replaceChildren(){for(const n of this.children)n.parent=null;this.children=[];}
 closest(selector){if(selector==='fieldset')return this.fieldset||this.parent?.closest(selector)||null;if(selector==='[data-choice-option]')return Object.hasOwn(this.dataset,'choiceOption')?this:this.parent?.closest(selector)||null;throw Error('unexpected selector');}
 contains(n){return this.children.includes(n);}fire(type,extra={}){this.dispatchEvent({type,target:this,...extra});}
 focus(){assert.fail('choice must not request focus');}showPicker(){assert.fail('native popup must not open');}
}
function fixture(beforeOpen){const doc={tags:[],createElement(tag){this.tags.push(tag);return new Node(this);}},c=vm.createContext({Event:class{constructor(type,options){this.type=type;Object.assign(this,options);}}});
 vm.runInContext(code,c);const control=new Node(doc),list=new Node(doc);control.setAttribute('aria-label','已有软件');const choice=c.createInlineChoice(control,list,beforeOpen);return {doc,control,list,choice};}
const rows=()=>[{id:'one',name:'Seeker',installed:true},{id:'two',name:'Porter'}];
test('opening the production chooser only displays ordinary DOM option buttons',()=>{const f=fixture();f.choice.set(rows(),'选择已有软件');f.control.fire('click');assert.equal(f.list.hidden,false);assert.equal(f.control.attrs['aria-expanded'],'true');assert.deepEqual(f.doc.tags,['button','button','button']);assert.ok(f.list.children.every(x=>x.type==='button'&&!x.attrs.role));});
test('clicking an inline option updates local selection once and closes the list',()=>{const f=fixture(),changes=[];f.control.addEventListener('change',e=>changes.push({type:e.type,bubbles:e.bubbles}));f.choice.set(rows(),'选择已有软件');f.control.fire('click');f.list.fire('click',{target:f.list.children[1]});assert.equal(f.control.value,'one');assert.equal(f.control.dataset.value,'one');assert.equal(f.control.textContent,'Seeker（已安装）');assert.equal(f.list.hidden,true);assert.deepEqual(changes,[{type:'change',bubbles:true}]);f.control.fire('click');f.list.fire('click',{target:f.list.children[1]});assert.equal(changes.length,1);});
test('unchanged polling preserves open state, selected value and existing option nodes',()=>{const f=fixture();f.choice.set(rows(),'选择已有软件');f.control.fire('click');f.list.fire('click',{target:f.list.children[2]});f.control.fire('click');const node=f.list.children[2];f.list.scrollTop=77;f.choice.set(rows(),'选择已有软件');assert.equal(f.list.children[2],node);assert.equal(f.choice.renderCount(),1);assert.equal(f.list.hidden,false);assert.equal(f.control.value,'two');assert.equal(f.list.scrollTop,77);});
test('removed inventory cannot retain an old module or accept an obsolete option node',()=>{const f=fixture();f.choice.set(rows(),'选择已有软件');f.control.fire('click');const old=f.list.children[2];f.control.value='two';f.control.fire('click');f.choice.set([rows()[0]],'选择已有软件');assert.equal(f.control.value,'');f.list.fire('click',{target:old});assert.equal(f.control.value,'');});
test('disabled controls cannot open or change selection and sync closes an existing list',()=>{const f=fixture();f.choice.set(rows(),'选择已有软件');f.control.fire('click');f.control.disabled=true;f.choice.sync();assert.equal(f.list.hidden,true);f.control.fire('click');assert.equal(f.list.hidden,true);f.list.fire('click',{target:f.list.children[2]});assert.equal(f.control.value,'');});
test('a disabled expedition fieldset blocks its chooser without changing preferences',()=>{const f=fixture();f.choice.set(rows(),'自动选择');f.control.fieldset={disabled:true};f.control.fire('click');assert.equal(f.list.hidden,true);assert.equal(f.control.value,'');});
test('opening another chooser closes the previous inline list',()=>{const a=fixture(),b=fixture(()=>a.choice.close());a.choice.set(rows(),'选择');b.choice.set(rows(),'选择');a.control.fire('click');b.control.fire('click');assert.equal(a.list.hidden,true);assert.equal(b.list.hidden,false);});
test('Escape closes an inline list without moving focus',()=>{const f=fixture();f.choice.set(rows(),'选择');f.control.fire('click');let prevented=false,stopped=false;f.list.fire('keydown',{key:'Escape',preventDefault:()=>prevented=true,stopPropagation:()=>stopped=true});assert.equal(f.list.hidden,true);assert.equal(prevented,true);assert.equal(stopped,true);});
test('saved expedition selections and installed labels synchronize without emitting changes',()=>{const f=fixture(),events=[];f.control.addEventListener('change',e=>events.push(e));f.choice.set(rows(),'自动选择');f.control.value='two';f.choice.sync();assert.equal(f.control.textContent,'Porter');f.control.fire('click');assert.equal(f.list.children[2].attrs['aria-pressed'],'true');assert.equal(events.length,0);});
test('option labels stay plain text and no native picker remains in the in-page UI',()=>{const f=fixture();f.choice.set([{id:'safe',name:'<img src=x onerror=alert(1)>'}],'选择');f.control.fire('click');assert.equal(f.list.children[1].textContent,'<img src=x onerror=alert(1)>');assert.ok(!source.includes('<select'));assert.ok(!code.includes('.focus('));assert.ok(!code.includes('showPicker'));assert.ok(!code.includes('dispatchKeyEvent'));for(const id of ['hardware','software','mercenary','destination'])assert.ok(source.includes('id="'+id+'Choices"'));assert.match(source,/if\(!event\.isTrusted\)/);});
test('a large inventory creates no hidden option nodes and reuses them on a fast reopen',()=>{const f=fixture(),inventory=Array.from({length:500},(_,i)=>({id:String(i),name:'Module '+i}));f.choice.set(inventory,'Choose');assert.equal(f.doc.tags.length,0);for(let i=0;i<20;i++)f.choice.set(inventory,'Choose');assert.equal(f.doc.tags.length,0);f.control.fire('click');assert.equal(f.doc.tags.length,501);const first=f.list.children[1];f.control.fire('click');f.control.fire('click');assert.equal(f.list.children[1],first);assert.equal(f.doc.tags.length,501);});
const equipmentCode=source.slice(source.indexOf(' function createEquipmentList('),source.indexOf(" for (const name of ['hardware','software'])"));
function inventory(kind){
 class CardNode extends Node {
  append(...nodes){for(const node of nodes)super.append(node);}
  insertBefore(node,before){if(node.parent)node.remove();const index=before?this.children.indexOf(before):this.children.length;this.children.splice(index,0,node);node.parent=this;}
  remove(){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
  closest(selector){if(selector==='[data-equipment-id]')return Object.hasOwn(this.dataset,'equipmentId')?this:this.parent?.closest(selector)||null;return super.closest(selector);}
  focus(){this.ownerDocument.focused=this;}
  replaceChildren(...nodes){super.replaceChildren();this.append(...nodes);}
 }
 const element=tag=>Object.assign(new CardNode(doc),{tag,style:{}});
 const doc={createElement:element,createElementNS:(_namespace,tag)=>element(tag)},control=new CardNode(doc),list=new CardNode(doc),empty=new CardNode(doc);
 control.id=kind;
 const context=vm.createContext({document:doc,setText:(node,value)=>node.textContent=value,Event:class{constructor(type,options){this.type=type;Object.assign(this,options);}}});
 vm.runInContext(equipmentCode,context);
 return {doc,control,list,empty,inventory:context.createEquipmentList(control,list,empty)};
}
test('visible hardware cards show numbers before selection and pressing a number selects only its item',()=>{
 const f=inventory('hardware'),items=[{id:'cpu',name:'CPU',category:'CPU',installed:true,stats:[]},{id:'cpu2',name:'Candidate',category:'CPU',stats:[{label:'频率',value:14.6,unit:'GHz'}]}];
 let changes=0;f.control.addEventListener('change',()=>changes++);
 f.inventory.set(items,'未读取');
 assert.equal(f.control.value,'cpu');
 const first=f.list.children[0],candidate=f.list.children[1],metric=candidate.children[1].children[1].children[0];
 assert.equal(metric.textContent,'频率 14.6 GHz');
 assert.equal(first.children[2].hidden,false);
 assert.equal(candidate.children[2].hidden,true);
 f.list.fire('keydown',{key:'ArrowDown',target:first,preventDefault(){}});
 assert.equal(f.doc.focused,candidate);
 assert.equal(changes,0);
 f.list.fire('click',{target:metric});
 assert.equal(f.control.value,'cpu2');
 assert.equal(candidate.attrs['aria-pressed'],'true');
 assert.equal(changes,1);
});
test('a live spec update preserves card focus, read-only and empty states',()=>{
 const f=inventory('hardware'),item={id:'cpu',name:'CPU',stats:[{label:'核心数',value:6,unit:''}]};
 f.inventory.set([item],'未读取');const card=f.list.children[0];card.focus();
 f.inventory.set([{...item,stats:[{...item.stats[0],value:8}]}],'未读取');
 assert.equal(f.list.children[0],card);
 assert.equal(f.doc.focused,card);
 assert.equal(card.children[1].children[1].children[0].textContent,'核心数 8');
 f.control.disabled=true;f.inventory.sync();assert.ok(card.disabled);
 f.inventory.set([],'此类装备为空');
 assert.ok(f.list.hidden);assert.equal(f.empty.textContent,'此类装备为空');assert.equal(f.control.value,'');
});
test('software cards show multiple abilities and keep unknown bounds unknown',()=>{
 const f=inventory('software');
 f.inventory.set([{id:'tool',name:'Tool',functions:[{type:'HACK',min:12,max:26},{type:'SEARCH',min:null,max:22}]}],'');
 const readings=f.list.children[0].children[1].children[1].children.map(node=>node.textContent);
 assert.deepEqual(readings,['HACK 12–26','SEARCH —–22']);
});
test('card prefers actual images and retains a pictogram after an image error without retrying on poll',()=>{
 const f=inventory('software'),item={id:'tool',name:'Tool',image:'https://cdn.cor3.gg/fixture/tool.png',functions:[{type:'DECRYPT'}]};
 f.inventory.set([item],'');const wrapper=f.list.children[0].children[0], [fallback,image]=wrapper.children;
 assert.equal(fallback.tag,'svg');assert.equal(image.tag,'img');assert.equal(image.src,item.image);
 image.fire('error');f.inventory.set([{...item}],'');assert.deepEqual(wrapper.children,[fallback]);
 f.inventory.set([{...item,image:'https://cdn.cor3.gg/fixture/tool2.png'}],'');const [next,loaded]=wrapper.children;
 loaded.fire('load');assert.equal(loaded.style.opacity,'1');assert.equal(next.style.visibility,'hidden');
});
