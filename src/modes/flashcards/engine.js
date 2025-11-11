import { state } from "../../state.js";

/**
 * セッション:
 *  - front/back カードを順番に表示
 *  - known 判定は最小: 「知っている」ボタンで known++
 */
function buildSession(genre, opts={}){
  const all = state.quizzes[genre] || [];
  const limit = opts.limit && Number.isInteger(opts.limit) && opts.limit>0
    ? opts.limit
    : all.length;
  const selected = all.slice(0, limit);
  return {
    mode: "flashcards",
    genre,
    cards: selected,
    currentIndex: 0,
    showingBack: false,
    finished: false,
    limit
  };
}

export default { buildSession };