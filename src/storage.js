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

/* モードに対応した quizzes の localStorage キーを返す（既定: single） */
function keyForMode(mode) {
  const m = mode || (state.settings && state.settings.appMode) || APP_MODES.SINGLE;
  switch (m) {
    case APP_MODES.MULTIPLE: return STORAGE_KEY_MULTIPLE;
    case APP_MODES.FLASHCARDS: return STORAGE_KEY_FLASH;
    case APP_MODES.SINGLE:
    default: return STORAGE_KEY_SINGLE;
  }
}

/* モードに対応した genreOrder の localStorage キーを返す（既定: single） */
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
 * safeLoadQuizzes(mode?)
 * - 互換性: 引数を省略した呼び出しは既存コードと整合するように動作します。
 * - mode を渡すとそのモード用キーから読み込みます。
 */
export function safeLoadQuizzes(mode){
  try{
    const key = keyForMode(mode);
    const raw = localStorage.getItem(key);

    if(!raw){
      // もし新しいキーにデータがなければ、既存の旧キー(STORAGE_KEY)をフォールバックで読む（初回移行を楽にする）
      if(key !== STORAGE_KEY && localStorage.getItem(STORAGE_KEY)){
        const legacyRaw = localStorage.getItem(STORAGE_KEY);
        if(legacyRaw){
          try{
            const parsedLegacy = JSON.parse(legacyRaw);
            const migrated = migrateQuizzes(parsedLegacy);
            // コピーしておく（非破壊、旧キーは残す）
            try{ localStorage.setItem(key, JSON.stringify(migrated)); }catch(e){}
            return migrated;
          }catch(e){
            // ignore parse error
          }
        }
      }
      // デフォルトを返す（既存の挙動を維持）
      return migrateQuizzes(clone(defaultQuizzes));
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
    return migrateQuizzes(clone(defaultQuizzes));
  }
}

/**
 * saveQuizzes([mode])
 * - mode を渡せばモード別キーへ保存できる。引数省略時は現在の state.settings.appMode を使う。
 */
export function saveQuizzes(mode){
  try{
    const key = keyForMode(mode || state.settings?.appMode);
    localStorage.setItem(key, JSON.stringify(state.quizzes));
  }catch(err){
    console.error("saveQuizzes failed", err);
  }
}

/* 既存互換ラッパ（旧挙動を想定する呼び出し） */
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

/* loadGenreOrder(mode) : モード別に保存された genreOrder を読み込む
   - フォールバック: 新キーが無ければ legacy GENRE_ORDER_KEY を使って single にコピーする
*/
export function loadGenreOrder(mode){
  try{
    const key = keyForGenreOrder(mode);
    const raw = localStorage.getItem(key);
    if(!raw){
      // フォールバック: 旧の global GENRE_ORDER_KEY を読む（初回移行用）
      const legacy = localStorage.getItem(GENRE_ORDER_KEY);
      if(legacy){
        try{
          const arr=JSON.parse(legacy);
          if(Array.isArray(arr)){
            // コピーしておく
            try{ localStorage.setItem(key, legacy); }catch(e){}
            return arr.filter(g=>!!g);
          }
        }catch(e){}
      }
      // デフォルト: quizzes のキーから作る
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

/* ---------- 既存のユーティリティ関数をそのまま保持 ---------- */
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

/* ---------- マイグレーション補助（旧キー -> 新 single キーへコピー） ---------- */
/**
 * 旧 STORAGE_KEY にデータがあり、かつ新キー(STORAGE_KEY_SINGLE) にデータが無ければ
 * コピーを行う（非破壊）。既に新キーがある場合は何もしない。
 */
export function migrateIfNeeded(){
  try{
    const hasNew = localStorage.getItem(STORAGE_KEY_SINGLE);
    if(hasNew) return { migrated: false, reason: "already_has_new_key" };
    const oldRaw = localStorage.getItem(STORAGE_KEY);
    if(!oldRaw) return { migrated: false, reason: "no_old_key" };
    localStorage.setItem(STORAGE_KEY_SINGLE, oldRaw);
    // 同時にジャンル順序の legacy キーがあれば single 用にコピーしておく
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

/* エクスポートの互換名（既存コード互換を助ける） */
export { safeLoadQuizzes as safeLoadQuizzes_old };