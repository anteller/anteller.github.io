export function normalizeQuestion(raw){
  // single 判定
  if(raw && Array.isArray(raw.choices) && typeof raw.answer === "number"){
    return normalizeSingle(raw);
  }
  // multiple 判定
  if(raw && Array.isArray(raw.choices) && Array.isArray(raw.correctIndexes)){
    return normalizeMultiple(raw);
  }
  // flashcards 判定 (front/back)
  if(raw && typeof raw.front === "string" && typeof raw.back === "string"){
    return normalizeFlashcard(raw);
  }
  // 不明: 旧形式/壊れた → single 互換へ
  return normalizeSingle(raw||{});
}

function baseId(id){
  return (typeof id === "string" && id.trim()!=="")? id : createId();
}

function normalizeTags(t){
  if(!t) return [];
  if(Array.isArray(t)) return t.filter(x=>typeof x==="string" && x.trim()!=="");
  if(typeof t==="string") return t.split(",").map(s=>s.trim()).filter(Boolean);
  return [];
}

/* ----- single ----- */
function normalizeSingle(r){
  const q = typeof r.q==="string"? r.q.trim(): (r.question || "");
  let choices = Array.isArray(r.choices)? r.choices.map(c=>String(c).trim()).filter(c=>c!=="") : [];
  if(choices.length<2) choices = ["A","B"];
  let answer = typeof r.answer==="number"? r.answer:0;
  if(answer<0 || answer>=choices.length) answer=0;
  return {
    id: baseId(r.id),
    q,
    choices,
    answer,
    exp: typeof r.exp==="string"? r.exp:"",
    tags: normalizeTags(r.tags),
    stats: r.stats && typeof r.stats==="object"
      ? { c: r.stats.c||0, t: r.stats.t||0 }
      : { c:0, t:0 },
    flagged: !!r.flagged,
    priorityFactor: typeof r.priorityFactor==="number"? r.priorityFactor:1
  };
}

/* ----- multiple ----- */
function normalizeMultiple(r){
  const q = typeof r.q==="string"? r.q.trim(): (r.question || "");
  let choices = Array.isArray(r.choices)? r.choices.map(c=>String(c).trim()).filter(c=>c!=="") : [];
  if(choices.length<2) choices = ["選択肢1","選択肢2"];
  let correctIndexes = Array.isArray(r.correctIndexes)? r.correctIndexes.filter(i=>Number.isInteger(i)&&i>=0&&i<choices.length) : [];
  if(!correctIndexes.length) correctIndexes = [0];
  return {
    id: baseId(r.id),
    q,
    choices,
    correctIndexes,
    exp: typeof r.exp==="string"? r.exp:"",
    tags: normalizeTags(r.tags),
    stats: r.stats && typeof r.stats==="object"
      ? { c: r.stats.c||0, t: r.stats.t||0 }
      : { c:0, t:0 },
    flagged: !!r.flagged,
    priorityFactor: typeof r.priorityFactor==="number"? r.priorityFactor:1
  };
}

/* ----- flashcards ----- */
function normalizeFlashcard(r){
  const front = typeof r.front==="string"? r.front.trim(): "";
  const back  = typeof r.back==="string"? r.back.trim(): "";
  return {
    id: baseId(r.id),
    front,
    back,
    tags: normalizeTags(r.tags),
    stats: r.stats && typeof r.stats==="object"
      ? { seen: r.stats.seen||0, known: r.stats.known||0 }
      : { seen:0, known:0 },
    flagged: !!r.flagged
  };
}