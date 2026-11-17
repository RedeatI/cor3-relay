/* Configured-cost precedence adapted from SaltApocalypse v2.0.4-salta; LICENSE.upstream. */
(function(root){'use strict';
 function numberFrom(value,keys){
  const visited=new Set();let count=0;
  function walk(item,depth){if(!item||typeof item!=='object'||visited.has(item)||depth>12||++count>10000)return null;visited.add(item);
   for(const key of keys){const raw=item[key];if((typeof raw==='number'||typeof raw==='string'&&raw.trim()!=='')&&Number.isFinite(Number(raw))&&Number(raw)>=0)return Number(raw);}
   for(const child of Object.values(item)){const found=walk(child,depth+1);if(found!==null)return found;}return null;
  }return walk(value,0);
 }
 function totalCostInfo(value){const explicit=numberFrom(value,['totalCost','total_cost','totalPrice','total_price']);return explicit!==null?{total:explicit,explicit:true}:{total:numberFrom(value,['cost','price']),explicit:false};}
 function withinLimit(value,max){const cost=totalCostInfo(value);return cost.explicit&&Number.isFinite(max)&&max>=0&&cost.total<=max;}
 root.Cor3ExpeditionCost=Object.freeze({totalCostInfo,withinLimit});
})(globalThis);
