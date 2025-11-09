import { STORAGE_KEY, STORAGE_KEY_SINGLE } from "./constants.js";

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
    console.info("migrateIfNeeded: copied quizzes -> quizzes_single");
    return { migrated: true };
  }catch(err){
    console.error("migrateIfNeeded failed", err);
    return { migrated: false, error: err };
  }
}