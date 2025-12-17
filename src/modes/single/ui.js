import { els } from "../../domRefs.js";
import { state } from "../../state.js";
import {
  renderQuestion,
  handleAnswer,
  handleDontKnow,
  nextQuestionManual,
  retryWrongOnly,
  toggleFlag,
  updateFlagButtonForCurrent,
  adjustPriorityFactor
} from "./core/quizUI.js";

function isQuizScreenActive(){
  const screen = document.querySelector(".panel:not(.hidden)[data-screen]");
  return screen?.dataset?.screen === "quizScreen";
}

export function render(session){
  // single は session を持たない/使わない設計でも動く
  return renderQuestion(session);
}

export function onKeyDown(e, session){
  if(!isQuizScreenActive()) return false;
  if(state.answered && state.settings.progressMode === "manual" && (e.key === "Enter" || e.key === " ")){
    nextQuestionManual();
    return true;
  }
  if(state.answered) return false;

  if(/^[1-9]$/.test(e.key)){
    const n = +e.key;
    const choices = [...els.choicesContainer.querySelectorAll(".choice")];
    if(n >= 1 && n <= choices.length) handleAnswer(n - 1);
    return true;
  }
  if(e.key === "0"){
    handleDontKnow();
    return true;
  }
  return false;
}

export function onDontKnow(session){
  handleDontKnow();
  return true;
}

export function onNext(session){
  nextQuestionManual();
  return true;
}

export function onRetryWrongOnly(session){
  retryWrongOnly();
  return true;
}

export function onToggleFlag(session){
  const q = state.questions[state.currentIndex];
  if(!q) return false;
  toggleFlag(state.currentGenre, q.id);
  updateFlagButtonForCurrent();
  return true;
}

export function onAdjustPriority(mult){
  adjustPriorityFactor(mult);
  return true;
}

export default {
  render,
  onKeyDown,
  onDontKnow,
  onNext,
  onRetryWrongOnly,
  onToggleFlag,
  onAdjustPriority
};
