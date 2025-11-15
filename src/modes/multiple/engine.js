import { state } from "../../state.js";
import { clone, shuffle } from "../../utils.js";
import { getAccuracy } from "../../normalize.js";

/**
 * 択一モードと同等の低正答率優先抽出（指数分布ランダム）
 */
function buildWeightedLowAccuracyPool(original, limit){
  const items = original.map(q=>{
    const acc = getAccuracy(q);
    const base = (acc===null || typeof acc!=="number") ? 1 : (1-acc);
    const unseenBonus = (q.stats && q.stats.t===0) ? 0.5 : 0;
    const pf = q.priorityFactor ?? 1;
    const weight = Math.max(0.05, base + unseenBonus) * pf;
    const key = -Math.log(Math.random()) / weight; // 小さいほど優先
    return { q, key };
  });
  items.sort((a,b)=>a.key - b.key);
  const sel = (limit && limit>0 && limit<items.length) ? items.slice(0,limit) : items;
  return sel.map(i=>i.q);
}

/**
 * セッション構築:
 * - flaggedOnly/lowAccuracy/limit は single と同等の意味
 * - questions は { correctIndexes:[] } を持つ形式に正規化して扱う
 */
function buildSession(genre, opts={}){
  const all = state.quizzes[genre] || [];
  if(!all.length) return {
    mode: "multiple", genre, questions: [], currentIndex: 0, correctCount: 0, finished: false, answers: [], limit: 0
  };

  let pool;
  if(opts.flaggedOnly){
    pool = clone(all.filter(q=>q.flagged));
    if(!pool.length) return {
      mode: "multiple", genre, questions: [], currentIndex: 0, correctCount: 0, finished: false, answers: [], limit: 0
    };
  } else if(opts.lowAccuracy){
    pool = buildWeightedLowAccuracyPool(clone(all), opts.limit);
  } else {
    pool = shuffle(clone(all));
    if(opts.limit && opts.limit>0 && opts.limit<pool.length) pool = pool.slice(0, opts.limit);
  }

  // single 形式の問題も multiple 形式へ補正
  const selected = pool.map(q=>{
    const copy = clone(q);
    if (!Array.isArray(copy.correctIndexes)) {
      const ans = Number.isInteger(copy.answer) ? copy.answer : 0;
      copy.correctIndexes = [ans];
    }
    if (!Array.isArray(copy.choices)) copy.choices = [];
    return copy;
  });

  return {
    mode: "multiple",
    genre,
    questions: selected,
    currentIndex: 0,
    correctCount: 0,
    finished: false,
    answers: [],
    limit: selected.length
  };
}

/**
 * 採点: 完全一致のみ正解
 */
function gradeQuestion(q, userSelections){
  const correctSet = new Set(
    Array.isArray(q.correctIndexes)
      ? q.correctIndexes
      : (Number.isInteger(q.answer) ? [q.answer] : [])
  );
  const userSet = new Set(userSelections || []);
  if(correctSet.size !== userSet.size) return false;
  for(const idx of correctSet){
    if(!userSet.has(idx)) return false;
  }
  return true;
}

export default {
  buildSession,
  gradeQuestion
};