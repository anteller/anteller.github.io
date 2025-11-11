import { els } from "../../domRefs.js";
import { showToast } from "../../utils.js";

export function renderFlashcard(session){
  const card = session.cards[session.currentIndex];
  if(!card){
    if(els.question) els.question.textContent="カードなし";
    return;
  }
  if(els.question){
    els.question.textContent = session.showingBack? card.back : card.front;
  }
  if(els.choicesContainer){
    els.choicesContainer.innerHTML="";
    const flipBtn = document.createElement("button");
    flipBtn.className="btn small";
    flipBtn.textContent = session.showingBack? "表へ戻す":"裏を表示";
    flipBtn.addEventListener("click", ()=>{
      session.showingBack = !session.showingBack;
      renderFlashcard(session);
    });
    els.choicesContainer.appendChild(flipBtn);

    const knownBtn = document.createElement("button");
    knownBtn.className="btn small secondary";
    knownBtn.textContent="知っていた";
    knownBtn.addEventListener("click", ()=>{
      card.stats = card.stats || { seen:0, known:0 };
      card.stats.seen += 1;
      card.stats.known += 1;
      nextFlashcard(session);
    });
    els.choicesContainer.appendChild(knownBtn);

    const unknownBtn = document.createElement("button");
    unknownBtn.className="btn small flat";
    unknownBtn.textContent="知らなかった";
    unknownBtn.addEventListener("click", ()=>{
      card.stats = card.stats || { seen:0, known:0 };
      card.stats.seen += 1;
      nextFlashcard(session);
    });
    els.choicesContainer.appendChild(unknownBtn);
  }
  if(els.result) els.result.textContent="";
  if(els.subResult) els.subResult.textContent="";
}

export function nextFlashcard(session){
  if(session.currentIndex < session.cards.length - 1){
    session.currentIndex++;
    session.showingBack = false;
    renderFlashcard(session);
  } else {
    session.finished = true;
    if(els.question) els.question.textContent="終了 (単語帳)";
    if(els.choicesContainer) els.choicesContainer.innerHTML="";
    if(els.result) els.result.textContent=`総カード: ${session.cards.length}`;
    showToast("単語帳モード 終了");
  }
}

export default {
  renderFlashcard,
  nextFlashcard
};