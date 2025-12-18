import { els } from "../../domRefs.js";
import { showScreen, showToast, clearAutoTimer } from "../../utils.js";
import { saveQuizzes } from "../../storage.js";
import { state } from "../../state.js";
import { showResult } from "../single/core/quizUI.js";

function isQuizScreenActive(){
  const screen = document.querySelector(".panel:not(.hidden)[data-screen]");
  return screen?.dataset?.screen === "quizScreen";
}

function currentCard(session){
  if(!session) return null;
  return session.cards?.[session.currentIndex] || null;
}

function markCard(session, { known }){
  const card = currentCard(session);
  if(!card) return false;

  card.stats = card.stats || { seen:0, known:0 };
  card.stats.seen += 1;
  if(known) card.stats.known += 1;

  // 結果集計（known を正解扱い）
  if(known){
    state.correctCount++;
    state.correctQuestions.push(card);
  } else {
    state.wrongQuestions.push(card);
  }

  saveQuizzes(state.appMode);
  return true;
}

export function renderFlashcard(session){
  clearAutoTimer();
  state.answered = false;

  const flashcardActions = document.getElementById("flashcardActions");
  const dontKnowWrap = document.querySelector("#quizScreen .dontknow-wrap");

  if(els.explanationBox){
    els.explanationBox.classList.remove("visible");
    els.explanationBox.textContent = "";
  }
  if(els.result) els.result.textContent="";
  if(els.subResult) els.subResult.textContent="";

  const card = currentCard(session);
  if(!card){
    if(els.progress) els.progress.textContent = "進捗: 0 / 0";
    if(els.question) els.question.textContent = "カードがありません";
    if(els.choicesContainer) els.choicesContainer.innerHTML = "";
    if(els.nextQuestionBtn) els.nextQuestionBtn.style.display = "none";
    if(els.iDontKnowBtn) els.iDontKnowBtn.style.display = "none";
    if(flashcardActions) flashcardActions.classList.add("hidden");
    if(dontKnowWrap) dontKnowWrap.classList.remove("hidden");
    return;
  }

  if(els.progress){
    els.progress.textContent = `進捗: ${session.currentIndex+1} / ${session.cards.length}`;
  }

  // 問題文（常に表示）: 管理画面の「問題文(任意)」(q)
  if(els.question){
    els.question.textContent = card.q || "";
  }

  // カード面（表/裏）: choicesContainer に表示（クリックで反転）
  if(els.choicesContainer){
    els.choicesContainer.innerHTML = "";

    const cardBtn = document.createElement("button");
    cardBtn.type = "button";
    cardBtn.className = "choice";
    cardBtn.setAttribute("aria-pressed", session.showingBack ? "true" : "false");
    const frontText = (card.front || "").trim();
    cardBtn.textContent = session.showingBack
      ? (card.back || "")
      : (frontText ? card.front : "裏を表示する");
    cardBtn.addEventListener("click", ()=>{
      session.showingBack = !session.showingBack;
      renderFlashcard(session);
    });
    els.choicesContainer.appendChild(cardBtn);
  }

  // 裏表示時のみ解説を表示
  if(els.explanationBox){
    const exp = card.exp && String(card.exp).trim();
    if(session.showingBack && exp){
      els.explanationBox.textContent = exp;
      els.explanationBox.classList.add("visible");
    } else {
      els.explanationBox.classList.remove("visible");
      els.explanationBox.textContent = "";
    }
  }

  // 既存ボタンを単語帳用に使う
  if(dontKnowWrap) dontKnowWrap.classList.add("hidden");

  if(els.iDontKnowBtn){
    els.iDontKnowBtn.style.display = "inline-flex";
    els.iDontKnowBtn.disabled = false;
    els.iDontKnowBtn.style.opacity = "1";
    els.iDontKnowBtn.textContent = "知らなかった";
    // クラス競合が起きないよう固定
    els.iDontKnowBtn.className = "btn small danger";
  }
  if(els.nextQuestionBtn){
    els.nextQuestionBtn.style.display = "inline-flex";
    els.nextQuestionBtn.textContent = "知っていた";
    // クラス競合が起きないよう固定
    els.nextQuestionBtn.className = "btn small ok";
  }

  if(flashcardActions){
    flashcardActions.classList.remove("hidden");
    flashcardActions.innerHTML = "";
    // 左: 知っていた / 右: 知らなかった
    if(els.nextQuestionBtn) flashcardActions.appendChild(els.nextQuestionBtn);
    if(els.iDontKnowBtn) flashcardActions.appendChild(els.iDontKnowBtn);
  }
}

export function nextFlashcard(session){
  if(session.currentIndex < session.cards.length - 1){
    session.currentIndex++;
    session.showingBack = false;
    renderFlashcard(session);
  } else {
    session.finished = true;
    // 結果画面は共通 showResult() に任せる
    state.currentIndex = state.questions.length;
    showResult();
  }
}

export function render(session){
  return renderFlashcard(session);
}

export function onKeyDown(e, session){
  if(!isQuizScreenActive()) return false;
  if(!session) return false;

  if(e.key === "ArrowLeft"){
    e.preventDefault();
    markCard(session, { known: true });
    nextFlashcard(session);
    return true;
  }
  if(e.key === "ArrowRight"){
    e.preventDefault();
    markCard(session, { known: false });
    nextFlashcard(session);
    return true;
  }

  if(e.key === "Enter" || e.key === " "){
    // Enter/Space は表裏切替のみ
    e.preventDefault();
    session.showingBack = !session.showingBack;
    renderFlashcard(session);
    return true;
  }

  if(e.key === "0"){
    markCard(session, { known: false });
    nextFlashcard(session);
    return true;
  }
  return false;
}

export function onDontKnow(session){
  if(!session) return false;
  markCard(session, { known: false });
  nextFlashcard(session);
  return true;
}

export function onNext(session){
  if(!session) return false;
  markCard(session, { known: true });
  nextFlashcard(session);
  return true;
}

export function retryWrongOnly(session){
  if(state.wrongQuestions.length===0) return false;

  const cards = [...state.wrongQuestions].map(c=>({ ...c }));
  const newSession = {
    mode: "flashcards",
    genre: state.currentGenre,
    cards,
    currentIndex: 0,
    showingBack: false,
    finished: false,
    limit: cards.length,
    retryWrongOnly: true
  };

  state.activeSession = newSession;
  state.questions = cards;
  state.currentIndex = 0;
  state.correctCount = 0;
  state.wrongQuestions = [];
  state.correctQuestions = [];
  state.isRetryWrongMode = true;

  showScreen("quizScreen");
  renderFlashcard(newSession);
  return true;
}

export default {
  renderFlashcard,
  nextFlashcard,
  render,
  onKeyDown,
  onDontKnow,
  onNext,
  retryWrongOnly
};
