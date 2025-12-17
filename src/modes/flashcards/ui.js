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
    return;
  }

  if(els.progress){
    els.progress.textContent = `進捗: ${session.currentIndex+1} / ${session.cards.length}`;
  }

  // 表/裏表示（questionに表示し、解説欄には出さない）
  if(els.question){
    els.question.textContent = session.showingBack ? card.back : card.front;
  }

  // flip ボタンだけ choicesContainer に置く（既存UX内に収める）
  if(els.choicesContainer){
    els.choicesContainer.innerHTML = "";
    const flipBtn = document.createElement("button");
    flipBtn.type = "button";
    flipBtn.className = "btn small flat";
    flipBtn.textContent = session.showingBack ? "表へ戻す" : "裏を表示";
    flipBtn.addEventListener("click", ()=>{
      session.showingBack = !session.showingBack;
      renderFlashcard(session);
    });
    els.choicesContainer.appendChild(flipBtn);
  }

  // 既存ボタンを単語帳用に使う
  if(els.iDontKnowBtn){
    els.iDontKnowBtn.style.display = "inline-flex";
    els.iDontKnowBtn.disabled = false;
    els.iDontKnowBtn.style.opacity = "1";
    els.iDontKnowBtn.textContent = "知らなかった";
  }
  if(els.nextQuestionBtn){
    els.nextQuestionBtn.style.display = "inline-flex";
    els.nextQuestionBtn.textContent = "知っていた";
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
  if(e.key === "Enter" || e.key === " "){
    // まず裏を表示、裏表示中は「知っていた」として進む
    if(!session.showingBack){
      session.showingBack = true;
      renderFlashcard(session);
    } else {
      markCard(session, { known: true });
      nextFlashcard(session);
    }
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
