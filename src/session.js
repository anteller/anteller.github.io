import { state } from "./state.js";
import { shuffle } from "./utils.js";

/**
 * 既存 single の startQuizMode を拡張:
 *  - state.currentModeModule.engine.buildSession を優先
 *  - single 従来ロジックはフォールバック
 */

export function startQuizMode(genre, opts={}){
  const modeMod = state.currentModeModule;
  if(modeMod && modeMod.engine && typeof modeMod.engine.buildSession === "function"){
    const session = modeMod.engine.buildSession(genre, opts);
    // single と互換のため state に共通反映
    state.currentGenre = genre;
    state.questions = session.questions || session.cards || [];
    state.currentIndex = 0;
    state.correctCount = 0;
    state.answered = false;
    state.lastSession = {
      genre,
      limit: opts.limit || null,
      lowAccuracy: !!opts.lowAccuracy,
      flaggedOnly: !!opts.flaggedOnly,
      mode: state.appMode
    };
    // モード固有のセッション保持
    state.activeSession = session;
    return true;
  }

  // ----- フォールバック: 旧 single ロジック（簡略化） -----
  const arr = state.quizzes[genre];
  if(!arr || !arr.length) return false;
  let pool = arr.slice();
  if(opts.flaggedOnly){
    pool = pool.filter(q=>q.flagged);
  } else if(opts.lowAccuracy){
    const weighted=[];
    arr.forEach(q=>{
      const t=q.stats?.t||0;
      const c=q.stats?.c||0;
      const acc=t>0? c/t:0;
      const weight=1+(1-acc)*2+(t===0?1.5:0);
      const pf=q.priorityFactor? weight*q.priorityFactor:weight;
      for(let i=0;i<Math.ceil(pf);i++) weighted.push(q);
    });
    pool=shuffle(weighted);
  }
  let limit = null;
  if(Number.isInteger(opts.limit) && opts.limit>0) limit=opts.limit;
  const picked = limit? pool.slice(0,limit):pool;
  state.currentGenre=genre;
  state.questions=picked;
  state.currentIndex=0;
  state.correctCount=0;
  state.wrongQuestions=[];
  state.correctQuestions=[];
  state.isRetryWrongMode=false;
  state.answered=false;
  state.lastSession={ genre, limit:limit || null, lowAccuracy:!!opts.lowAccuracy, flaggedOnly:!!opts.flaggedOnly, mode:"single" };
  return true;
}

export * from "./modes/single/core/session.js";
