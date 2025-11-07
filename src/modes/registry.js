// モードレジストリ（Phase 1: single のみ登録）
// Phase 2 以降で multiple / flashcards を dynamic import で追加予定。
import single from "./single/index.js";

const registry = {
  single,
  // multiple: () => import("./multiple/index.js"),
  // flashcards: () => import("./flashcards/index.js"),
};

export function hasMode(id){
  return !!registry[id];
}

// Phase 1: 同期ロード（single は直 import）
// 以降、他モードは関数なら動的 import で返す。
export async function loadMode(id){
  const mod = registry[id];
  if(!mod) throw new Error(`Mode not found: ${id}`);
  // dynamic import の将来対応
  if(typeof mod === "function"){
    const m = await mod();
    return m.default || m;
  }
  return mod;
}

// 利便用：デフォルトモードID
export const DEFAULT_MODE_ID = "single";