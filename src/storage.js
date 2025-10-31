import {
  STORAGE_KEY, SETTINGS_KEY, GENRE_ORDER_KEY,
  DATA_VERSION, DEFAULT_SETTINGS
} from "./constants.js";
import { state } from "./state.js";
import { normalizeQuestion } from "./normalize.js";
import { clone } from "./utils.js";
import { defaultQuizzes } from "./defaultQuizzes.js";

export function migrateQuizzes(data){
  if(!data.__version) data.__version=1;
  Object.keys(data).forEach(k=>{
    if(k.startsWith("__")) return;
    data[k]=data[k].map(normalizeQuestion);
  });
  data.__version=DATA_VERSION;
  return data;
}

export function safeLoadQuizzes(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return migrateQuizzes(clone(defaultQuizzes));
    const parsed=JSON.parse(raw);
    if(!parsed.__version || parsed.__version<DATA_VERSION) return migrateQuizzes(parsed);
    Object.keys(parsed).forEach(k=>{
      if(k.startsWith("__")) return;
      parsed[k]=parsed[k].map(normalizeQuestion);
    });
    return parsed;
  }catch{
    return migrateQuizzes(clone(defaultQuizzes));
  }
}

export function saveQuizzes(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.quizzes)); }catch{}
}

export function loadSettings(){
  try{
    const raw=localStorage.getItem(SETTINGS_KEY);
    if(!raw){
      state.settings={...DEFAULT_SETTINGS};
    } else {
      const p=JSON.parse(raw);
      state.settings={...DEFAULT_SETTINGS,...p};
    }
    state.settings.questionCountOptions =
      normalizeQuestionCountOptions(state.settings.questionCountOptions);
    if(typeof state.settings.priorityIncreaseMultiplier!=="number" ||
       !isFinite(state.settings.priorityIncreaseMultiplier) ||
       state.settings.priorityIncreaseMultiplier<1.01){
      state.settings.priorityIncreaseMultiplier=DEFAULT_SETTINGS.priorityIncreaseMultiplier;
    }
    if(state.settings.priorityIncreaseMultiplier>5)
      state.settings.priorityIncreaseMultiplier=5;
  }catch{
    state.settings={...DEFAULT_SETTINGS};
    state.settings.questionCountOptions =
      normalizeQuestionCountOptions(state.settings.questionCountOptions);
  }
}

export function saveSettings(){
  try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }catch{}
}

export function loadGenreOrder(){
  try{
    const raw=localStorage.getItem(GENRE_ORDER_KEY);
    if(!raw){
      state.genreOrder=Object.keys(state.quizzes).filter(k=>!k.startsWith("__"));
      return;
    }
    const arr=JSON.parse(raw);
    if(!Array.isArray(arr)){
      state.genreOrder=Object.keys(state.quizzes).filter(k=>!k.startsWith("__"));
      return;
    }
    const set=new Set(Object.keys(state.quizzes).filter(k=>!k.startsWith("__")));
    const filtered=arr.filter(g=>set.has(g));
    const leftovers=[...set].filter(g=>!filtered.includes(g));
    state.genreOrder=[...filtered,...leftovers];
  }catch{
    state.genreOrder=Object.keys(state.quizzes).filter(k=>!k.startsWith("__"));
  }
}

export function saveGenreOrder(){
  try{ localStorage.setItem(GENRE_ORDER_KEY, JSON.stringify(state.genreOrder)); }catch{}
}

export function normalizeQuestionCountOptions(raw){
  if(!raw) return ["5","10","all"];
  let arr=Array.isArray(raw)? raw : String(raw).split(",");
  arr=arr.map(v=>v.trim().toLowerCase()).filter(v=>v!=="");
  const result=[]; const seen=new Set();
  for(const v of arr){
    if(v==="all"){
      if(!seen.has("all")){ result.push("all"); seen.add("all"); }
    } else if(/^[1-9]\d*$/.test(v)){
      if(!seen.has(v)){ result.push(v); seen.add(v); }
    }
  }
  if(result.length===0) return ["5","10","all"];
  const hasAll=result.includes("all");
  if(hasAll){
    const filtered=result.filter(x=>x!=="all").sort((a,b)=>parseInt(a)-parseInt(b));
    filtered.push("all");
    return filtered;
  }
  return result.sort((a,b)=>parseInt(a)-parseInt(b));
}