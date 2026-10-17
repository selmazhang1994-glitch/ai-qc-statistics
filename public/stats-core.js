'use strict';
const Stats = (() => {
  const window30 = (now = new Date()) => {
    const end = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai'}).format(now);
    return {start:new Date(new Date(end+'T12:00:00Z').getTime()-29*86400000).toISOString().slice(0,10),end};
  };
  function validate(data, schema) {
    const sameKeys=(obj,keys)=>Object.keys(obj).sort().join('|')===keys.sort().join('|');
    if(!sameKeys(data,['schemaVersion','retentionDays','updatedAt','groups','rules']) || data.schemaVersion!=='aggregate-only-v1' || data.retentionDays!==30) throw Error('统计文件格式不匹配');
    if(typeof data.updatedAt!=='string'||data.updatedAt.length>40) throw Error('更新时间格式不正确');
    for(const type of ['groups','rules']) {
      if(!Array.isArray(data[type])) throw Error('缺少统计列表');
      const seen=new Set();
      for(const r of data[type]) {
        const fields=['date','brand','scene','total','passed',...(type==='rules'?['rule']:[])];
        if(!sameKeys(r,fields)) throw Error('统计文件包含不允许公开的字段');
        if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!schema.brands.includes(r.brand)||!schema.scenes.includes(r.scene)||(type==='rules'&&!schema.rules.includes(r.rule))) throw Error('日期、品牌、场景或规则不在允许列表内，请先核对');
        if(!Number.isSafeInteger(r.total)||!Number.isSafeInteger(r.passed)||r.total<1||r.passed<0||r.passed>r.total) throw Error('统计数量不正确');
        const key=JSON.stringify([r.date,r.brand,r.scene,r.rule]);
        if(seen.has(key))throw Error('统计分组重复');seen.add(key);
      }
    }
    return data;
  }
  function summarize(chunks,schema) {
    const groups=new Map(),rules=new Map();
    const add=(map,key,passed)=>{const id=JSON.stringify(key);if(!map.has(id))map.set(id,{...key,total:0,passed:0});const r=map.get(id);r.total++;r.passed+=Number(passed)};
    for(const c of chunks) {
      for(const r of c.recordings)add(groups,{date:r.date,brand:r.brand,scene:r.scene},r.qcPassed);
      for(const q of c.ruleRows) {
        if(!q.calculable)continue;
        const r=c.recordings[q.recordingIndex];
        if(!r||!['通过','优秀','不涉及','未通过'].includes(q.standardResult))throw Error('规则结果无法汇总');
        add(rules,{date:r.date,brand:r.brand,scene:r.scene,rule:q.rule},q.standardResult!=='未通过');
      }
    }
    return validate({schemaVersion:'aggregate-only-v1',retentionDays:30,updatedAt:new Date().toISOString(),groups:[...groups.values()],rules:[...rules.values()]},schema);
  }
  function merge(old,incoming,schema,now=new Date()) {
    validate(old,schema);validate(incoming,schema);
    const w=window30(now),keys=new Set(incoming.groups.map(r=>r.date+'|'+r.brand));
    if(incoming.groups.some(r=>r.date<w.start||r.date>w.end))throw Error('导入日期必须在近30天内');
    const result={schemaVersion:'aggregate-only-v1',retentionDays:30,updatedAt:now.toISOString()};
    for(const type of ['groups','rules'])result[type]=[...old[type].filter(r=>!keys.has(r.date+'|'+r.brand)),...incoming[type]].filter(r=>r.date>=w.start&&r.date<=w.end).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return validate(result,schema);
  }
  return {window30,validate,summarize,merge};
})();
if(typeof module!=='undefined') module.exports=Stats;
