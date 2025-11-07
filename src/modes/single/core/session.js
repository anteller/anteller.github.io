import { state } from "../../../state.js";
import { shuffle, clone, randomizeChoicesOnQuestion } from "../../../utils.js";
import { getAccuracy } from "../../../normalize.js";
import { showToast } from "../../../utils.js";

/**
 * 低正答率優先抽出（重み付きランダム）
 */
function buildWeightedLowAccuracyPool(original, limit){
  const items = original.map(q=>{
    const acc = getAccuracy(q);
    const base = (acc===null)? 1 : (1-acc);
    const unseenBonus = (q.stats && q.stats.t===0) ? 0.5 : 0;
    const pf = q.priorityFactor ?? 1;
    const weight = Math.max(0.05, base + unseenBonus) * pf;
    const key = -Math.log(Math.random()) / weight;
    return { q, key };
  });
  items.sort((a,b)=>a.key-b.key);
  const sel = (limit && limit>0 && limit<items.length) ? items.slice(0,limit) : items;
  return sel.map(i=>i.q);
}

/**
 * クイズ開始
 * flaggedOnly 時に clone を挟み元データを破壊しない
 */
export function startQuizMode(genre,{limit=null,lowAccuracy=false,flaggedOnly=false}={}){
  const arr = state.quizzes[genre];
  if(!arr){ showToast("ジャンルが存在しません"); return false; }
  if(arr.length===0){ showToast("問題がありません"); return false; }

  let pool;
  if(flaggedOnly){
    pool = clone(arr.filter(q=>q.flagged));   // BUGFIX
    if(pool.length===0){ showToast("要チェックなし"); return false; }
  } else if(lowAccuracy){
    pool = buildWeightedLowAccuracyPool(clone(arr), limit);
  } else {
    pool = shuffle(clone(arr));
    if(limit && limit>0 && limit<pool.length) pool = pool.slice(0,limit);
  }

  pool = pool.map(q=>randomizeChoicesOnQuestion(q));

  state.questions = pool;
  state.currentIndex = 0;
  state.correctCount = 0;
  state.wrongQuestions = [];
  state.correctQuestions = [];
  state.isRetryWrongMode = false;
  state.lastSession = { genre, limit, lowAccuracy, flaggedOnly };
  return true;
}