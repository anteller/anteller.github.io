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
 * 既存の migrateQuizzes を保持（内部データ正規化）
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

/* モード別デフォルト */
function defaultByMode(mode){
  const m = mode || (state.settings && state.settings.appMode) || APP_MODES.SINGLE;
  if(m === APP_MODES.MULTIPLE){
    return migrateQuizzes(clone(defaultQuizzesMultiple));
  }
  // flashcards は必要に応じて分離可。現状はシングルと同一で初期化。
  return migrateQuizzes(clone(defaultQuizzes));
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

/**
 * safeLoadQuizzes(mode?) - モード別キーから読み込み
 */
export function safeLoadQuizzes(mode){
  try{
    const key = keyForMode(mode);
    const raw = localStorage.getItem(key);

    if(!raw){
      // 旧キー(STORAGE_KEY)フォールバック → コピー（single 初回移行）
      if(key !== STORAGE_KEY && localStorage.getItem(STORAGE_KEY)){
        const legacyRaw = localStorage.getItem(STORAGE_KEY);
        if(legacyRaw){
          try{
            const parsedLegacy = JSON.parse(legacyRaw);
            const migrated = migrateQuizzes(parsedLegacy);
            try{ localStorage.setItem(key, JSON.stringify(migrated)); }catch(e){}
            return migrated;
          }catch(e){}
        }
      }
      // モード別デフォルト
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

/* 既存互換ラッパ（旧挙動） */
export function safeLoadQuizzesLegacy(){ return safeLoadQuizzes(APP_MODES.SINGLE); }

/* ---------- 設定 / ジャンル順序（モード対応） ---------- */

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
}

export function saveSettings(){
  try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }catch{}
}

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
            try{ localStorage.setItem(key, legacy); }catch(e){}
            return arr.filter(g=>!!g);
          }
        }catch(e){}
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

/* ---------- マイグレーション補助（旧キー -> 新 single キーへコピー） ---------- */
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
    }catch(e){}
    console.info("migrateIfNeeded: copied quizzes -> quizzes_single");
    return { migrated: true };
  }catch(err){
    console.error("migrateIfNeeded failed", err);
    return { migrated: false, error: err };
  }
}