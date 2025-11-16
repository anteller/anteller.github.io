// モードレジストリ: single + multiple + flashcards
import single from "./single/index.js";

const registry = {
  single,
  multiple: () => import("./multiple/index.js"),
  flashcards: () => import("./flashcards/index.js")
};

export function hasMode(id){
  return !!registry[id];
}

export async function loadMode(id){
  const mod = registry[id];
  if(!mod) throw new Error(`Mode not found: ${id}`);
  if(typeof mod === "function"){
    const m = await mod();
    return m.default || m;
  }
  return mod;
}

export const DEFAULT_MODE_ID = "single";