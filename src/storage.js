import {
  STORAGE_KEY, SETTINGS_KEY, GENRE_ORDER_KEY,
  DATA_VERSION, DEFAULT_SETTINGS,
  STORAGE_KEY_SINGLE, STORAGE_KEY_MULTIPLE, STORAGE_KEY_FLASH,
  APP_MODES,
  GENRE_ORDER_KEY_SINGLE, GENRE_ORDER_KEY_MULTIPLE, GENRE_ORDER_KEY_FLASH
} from "./constants.js";
import { state } from "./state.js";
import { normalizeQuestion } from "./normalize.js";
import { clone } from "./utils.js";
import { defaultQuizzes } from "./defaultQuizzes.js";
import { defaultQuizzesMultiple } from "./defaultQuizzes.multiple.js";

/**
 * データ正規化
 */
export function migrateQuizzes(data){
  if(!data.__version) data.__version=1;
  Object.keys(data).forEach(k=>{
    if(k.startsWith("__")) return;
    data[k]=data[k].map(normalizeQuestion);
  });
  data.__version=DATA_VERSION;
  return data;
}

/* ---------- モード対応ヘルパ ---------- */
function keyForMode(mode) {
  const m = mode || (state.settings && state.settings.appMode) || APP_MODES.SINGLE;
  switch (m) {
    case APP_MODES.MULTIPLE: return STORAGE_KEY_MULTIPLE;
    case APP_MODES.FLASHCARDS: return STORAGE_KEY_FLASH;
    case APP_MODES.SINGLE:
    default: return STORAGE_KEY_SINGLE;
  }
}
function keyForGenreOrder(mode){
  const m = mode || (state.settings && state.settings.appMode) || APP_MODES.SINGLE;
  switch(m){
    case APP_MODES.MULTIPLE: return GENRE_ORDER_KEY_MULTIPLE;
    case APP_MODES.FLASHCARDS: return GENRE_ORDER_KEY_FLASH;
    case APP_MODES.SINGLE:
    default: return GENRE_ORDER_KEY_SINGLE;
  }
}

/* モード別デフォルト問題 */
function defaultByMode(mode){
  const m = mode || (state.settings && state.settings.appMode) || APP_MODES.SINGLE;
  if(m === APP_MODES.MULTIPLE){
    return migrateQuizzes(clone(defaultQuizzesMultiple));
  }
  // flashcards も分離したいときはここで条件追加
  return migrateQuizzes(clone(defaultQuizzes));
}

/**
 * クイズ読み込み
 */
export function safeLoadQuizzes(mode){
  try{
    const key = keyForMode(mode);
    const raw = localStorage.getItem(key);
    if(!raw){
      // 初回移行: 旧キーを single にコピー
      if(key !== STORAGE_KEY && localStorage.getItem(STORAGE_KEY)){
        const legacyRaw = localStorage.getItem(STORAGE_KEY);
        if(legacyRaw){
          try{
            const parsedLegacy = JSON.parse(legacyRaw);
            const migrated = migrateQuizzes(parsedLegacy);
            try{ localStorage.setItem(key, JSON.stringify(migrated)); }catch{}
            return migrated;
          }catch{}
        }
      }
      return defaultByMode(mode);
    }
    const parsed = JSON.parse(raw);
    if(!parsed.__version || parsed.__version < DATA_VERSION) return migrateQuizzes(parsed);
    Object.keys(parsed).forEach(k=>{
      if(k.startsWith("__")) return;
      parsed[k] = parsed[k].map(normalizeQuestion);
    });
    return parsed;
  }catch(err){
    console.error("safeLoadQuizzes error", err);
    return defaultByMode(mode);
  }
}

export function saveQuizzes(mode){
  try{
    const key = keyForMode(mode || state.settings?.appMode);
    localStorage.setItem(key, JSON.stringify(state.quizzes));
  }catch(err){
    console.error("saveQuizzes failed", err);
  }
}

/* 旧互換ラッパ */
export function safeLoadQuizzesLegacy(){ return safeLoadQuizzes(APP_MODES.SINGLE); }

/* ---------- 設定 ---------- */
export function loadSettings(){
  try{
    const raw=localStorage.getItem(SETTINGS_KEY);
    if(!raw){
      state.settings={...DEFAULT_SETTINGS};
    } else {
      const p=JSON.parse(raw);
      state.settings={...DEFAULT_SETTINGS,...p};
    }
  }catch{
    state.settings={...DEFAULT_SETTINGS};
  }
  // questionCountOptions の正規化（復活させた normalizeQuestionCountOptions を利用）
  state.settings.questionCountOptions = normalizeQuestionCountOptions(state.settings.questionCountOptions);
  // priorityIncreaseMultiplier のバリデーション
  if(typeof state.settings.priorityIncreaseMultiplier!=="number" ||
     !isFinite(state.settings.priorityIncreaseMultiplier) ||
     state.settings.priorityIncreaseMultiplier<1.01){
    state.settings.priorityIncreaseMultiplier=DEFAULT_SETTINGS.priorityIncreaseMultiplier;
  }
  if(state.settings.priorityIncreaseMultiplier>5)
    state.settings.priorityIncreaseMultiplier=5;
}

export function saveSettings(){
  try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }catch{}
}

/* ---------- ジャンル順序 ---------- */
export function loadGenreOrder(mode){
  try{
    const key = keyForGenreOrder(mode);
    const raw = localStorage.getItem(key);
    if(!raw){
      const legacy = localStorage.getItem(GENRE_ORDER_KEY);
      if(legacy){
        try{
          const arr=JSON.parse(legacy);
          if(Array.isArray(arr)){
            try{ localStorage.setItem(key, legacy); }catch{}
            return arr.filter(g=>!!g);
          }
        }catch{}
      }
      return Object.keys(state.quizzes).filter(k=>!k.startsWith("__"));
    }
    const arr = JSON.parse(raw);
    if(!Array.isArray(arr)) return Object.keys(state.quizzes).filter(k=>!k.startsWith("__"));
    const set=new Set(Object.keys(state.quizzes).filter(k=>!k.startsWith("__")));
    const filtered=arr.filter(g=>set.has(g));
    const leftovers=[...set].filter(g=>!filtered.includes(g));
    return [...filtered,...leftovers];
  }catch(err){
    console.error("loadGenreOrder failed", err);
    return Object.keys(state.quizzes).filter(k=>!k.startsWith("__"));
  }
}

export function saveGenreOrder(order, mode){
  try{
    const key = keyForGenreOrder(mode || state.settings?.appMode);
    localStorage.setItem(key, JSON.stringify(order));
  }catch(err){
    console.error("saveGenreOrder failed", err);
  }
}

/* ---------- questionCountOptions 正規化（復活） ---------- */
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

/* ---------- 旧→新キー移行(single) ---------- */
export function migrateIfNeeded(){
  try{
    const hasNew = localStorage.getItem(STORAGE_KEY_SINGLE);
    if(hasNew) return { migrated: false, reason: "already_has_new_key" };
    const oldRaw = localStorage.getItem(STORAGE_KEY);
    if(!oldRaw) return { migrated: false, reason: "no_old_key" };
    localStorage.setItem(STORAGE_KEY_SINGLE, oldRaw);
    try{
      const legacyGenre = localStorage.getItem(GENRE_ORDER_KEY);
      if(legacyGenre && !localStorage.getItem(GENRE_ORDER_KEY_SINGLE)){
        localStorage.setItem(GENRE_ORDER_KEY_SINGLE, legacyGenre);
      }
    }catch{}
    console.info("migrateIfNeeded: copied quizzes -> quizzes_single");
    return { migrated: true };
  }catch(err){
    console.error("migrateIfNeeded failed", err);
    return { migrated: false, error: err };
  }
}