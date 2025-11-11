import { state } from "../../state.js";
import { clone, shuffle } from "../../utils.js";

/**
 * セッション構築:
 *  - genre / limit / lowAccuracy / flaggedOnly は single と同様
 *  - questions は { correctIndexes:[] } を持つ形式
 *  - single 形式のデータが混在していても補正して扱えるようにする
 */
function buildSession(genre, opts={}){
  const all = state.quizzes[genre] || [];
  let pool = all;

  if(opts.flaggedOnly){
    pool = pool.filter(q=>q.flagged);
  } else if(opts.lowAccuracy){
    // 低正答率優先: stats.c/stats.t が低いものを重み付け
    const weighted = [];
    all.forEach(q=>{
      const t = q.stats?.t||0;
      const c = q.stats?.c||0;
      const acc = t>0? c/t:0;
      const weight = 1 + (1-acc)*2 + (t===0? 1.5:0);
      const w = q.priorityFactor? weight*q.priorityFactor : weight;
      const copies = Math.ceil(w);
      for(let i=0;i<copies;i++) weighted.push(q);
    });
    pool = shuffle(weighted);
  }

  const limit = opts.limit && Number.isInteger(opts.limit) && opts.limit>0
    ? opts.limit
    : pool.length;

  // single 形式の問題も multiple 形式へ補正してから使う
  const selected = pool.slice(0, limit).map(q=>{
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
    answers: [], // user selections per question (array of indexes[])
    limit
  };
}

/**
 * 採点:
 *  - 完全一致で正解
 *  - 部分正解や部分点は Phase 3 最小では未対応（後で拡張可能）
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