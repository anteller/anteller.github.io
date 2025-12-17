import { state } from "../../state.js";
import { clone, shuffle } from "../../utils.js";
import { getAccuracy } from "../../normalize.js";

function buildWeightedLowAccuracyPool(original, limit){
  const items = original.map(card=>{
    const acc = getAccuracy(card);
    const base = (acc===null || typeof acc!=="number") ? 1 : (1-acc);
    const seen = card.stats?.seen || 0;
    const unseenBonus = seen===0 ? 0.5 : 0;
    const pf = card.priorityFactor ?? 1;
    const weight = Math.max(0.05, base + unseenBonus) * pf;
    const key = -Math.log(Math.random()) / weight;
    return { card, key };
  });
  items.sort((a,b)=>a.key - b.key);
  const sel = (limit && limit>0 && limit<items.length) ? items.slice(0,limit) : items;
  return sel.map(i=>i.card);
}

/**
 * セッション:
 *  - front/back カードを順番に表示
 *  - known 判定は最小: 「知っている」ボタンで known++
 */
function buildSession(genre, opts={}){
  const all = state.quizzes[genre] || [];
  if(!all.length){
    return {
      mode: "flashcards",
      genre,
      cards: [],
      currentIndex: 0,
      showingBack: false,
      finished: false,
      limit: 0,
      retryWrongOnly: false
    };
  }

  const limit = opts.limit && Number.isInteger(opts.limit) && opts.limit>0 ? opts.limit : null;

  let pool;
  if(opts.flaggedOnly){
    pool = clone(all.filter(c=>c.flagged));
  } else if(opts.lowAccuracy){
    pool = buildWeightedLowAccuracyPool(clone(all), limit);
  } else {
    pool = shuffle(clone(all));
    if(limit && limit>0 && limit<pool.length) pool = pool.slice(0, limit);
  }

  const selected = pool;
  return {
    mode: "flashcards",
    genre,
    cards: selected,
    currentIndex: 0,
    showingBack: false,
    finished: false,
    limit: selected.length,
    retryWrongOnly: !!opts.retryWrongOnly
  };
}

export default { buildSession };