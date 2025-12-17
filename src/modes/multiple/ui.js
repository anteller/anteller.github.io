// 薄いラッパ: 既存実装（single/core/quizUI.js内の複数選択関数）を利用しつつ、
// Phase 0 では入力ハンドラを共通形に揃える。
import { els } from "../../domRefs.js";
import { state } from "../../state.js";
import {
  renderQuestionMultiple,
  submitMultipleAnswer,
  nextMultiple
} from "../single/core/quizUI.js";

function isQuizScreenActive(){
  const screen = document.querySelector(".panel:not(.hidden)[data-screen]");
  return screen?.dataset?.screen === "quizScreen";
}

export function render(session){
  return renderQuestionMultiple(session);
}

export function onKeyDown(e, session){
  if(!isQuizScreenActive()) return false;
  if(!session) return false;

  if(e.key === "Enter" || e.key === " "){
    if(!state.answered){
      submitMultipleAnswer(session);
    } else {
      nextMultiple(session);
    }
    return true;
  }

  if(state.answered) return false;

  if(/^[1-9]$/.test(e.key)){
    const idx = +e.key - 1;
    const btn = els.choicesContainer?.querySelector(`.choice[data-index='${idx}']`);
    if(btn) btn.click();
    return true;
  }
  return false;
}

export function onDontKnow(session){
  if(!session) return false;
  submitMultipleAnswer(session, { forcedDontKnow: true });
  return true;
}

export function onNext(session){
  if(!session) return false;
  nextMultiple(session);
  return true;
}

export default {
  render,
  onKeyDown,
  onDontKnow,
  onNext,
  renderQuestionMultiple,
  submitMultipleAnswer,
  nextMultiple
};

export { renderQuestionMultiple, submitMultipleAnswer, nextMultiple };
