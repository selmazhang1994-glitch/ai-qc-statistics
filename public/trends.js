'use strict';
const TrendModel=(()=>{
 const brandOrder=['MG','荣威','启境','奥迪','尚界','MGAU','MGUK','MGPH'];
 const sceneOrder=['无效沟通','有效定级','持续邀约','战败场景','到店回访'];
 const brandColors={MG:'#2563eb',荣威:'#f59e0b',启境:'#16a34a',奥迪:'#7c3aed',尚界:'#db2777',MGAU:'#e11d48',MGUK:'#0891b2',MGPH:'#0f766e'};
 const sceneColors={无效沟通:'#64748b',有效定级:'#2563eb',持续邀约:'#f59e0b',战败场景:'#ef4444',到店回访:'#16a34a'};
 function ordered(values,order){return [...new Set(values)].sort((a,b)=>(order.includes(a)?order.indexOf(a):999)-(order.includes(b)?order.indexOf(b):999)||a.localeCompare(b,'zh-CN'))}
 function datesBetween(start,end){const dates=[];if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))return dates;for(let t=new Date(start+'T12:00:00Z').getTime(),last=new Date(end+'T12:00:00Z').getTime();t<=last&&dates.length<31;t+=86400000)dates.push(new Date(t).toISOString().slice(0,10));return dates}
 function build(rows,key,start,end){const dates=datesBetween(start,end),names=ordered(rows.map(r=>r[key]),key==='brand'?brandOrder:sceneOrder),map=new Map();for(const r of rows){const k=JSON.stringify([r.date,r[key]]);if(!map.has(k))map.set(k,{total:0,passed:0});const v=map.get(k);v.total+=r.total;v.passed+=r.passed}return{dates,series:names.map(name=>({name,color:(key==='brand'?brandColors:sceneColors)[name]||'#6366f1',points:dates.map(date=>{const v=map.get(JSON.stringify([date,name]));return v?{date,total:v.total,passed:v.passed,failed:v.total-v.passed,rate:100*v.passed/v.total}:null})}))}}
 return{build,ordered,brandOrder,sceneOrder,brandColors,sceneColors};
})();
if(typeof module!=='undefined')module.exports=TrendModel;
