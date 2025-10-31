import { createId } from "./utils.js";

export function normalizeQuestion(q){
  if(!Array.isArray(q.choices)) q.choices=[];
  q.choices=q.choices.filter(c=>typeof c==="string"&&c.trim()!=="");
  if(q.choices.length<2){ while(q.choices.length<2) q.choices.push("（未設定）"); }
  if(typeof q.answer!=="number"||q.answer<0||q.answer>=q.choices.length) q.answer=0;
  if(typeof q.exp!=="string") q.exp="";
  if(typeof q.q!=="string") q.q="（無題）";
  if(!q.id||typeof q.id!=="string") q.id=createId();
  if(!q.stats||typeof q.stats!=="object") q.stats={c:0,t:0};
  else {
    if(typeof q.stats.c!=="number") q.stats.c=0;
    if(typeof q.stats.t!=="number") q.stats.t=0;
  }
  if(!Array.isArray(q.tags)) q.tags=[];
  q.tags=q.tags.map(t=>String(t).trim()).filter(t=>t!=="");
  if(typeof q.flagged!=="boolean") q.flagged=false;
  if(typeof q.priorityFactor!=="number"||!isFinite(q.priorityFactor)) q.priorityFactor=1;
  if(q.priorityFactor<0.2) q.priorityFactor=0.2;
  if(q.priorityFactor>5) q.priorityFactor=5;
  return q;
}

export function getAccuracy(q){
  if(!q.stats || q.stats.t===0) return null;
  return q.stats.c / q.stats.t;
}