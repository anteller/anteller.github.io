import { state } from "../../state.js";
import { els } from "../../domRefs.js";
import { showToast } from "../../utils.js";
import multipleEngine from "./engine.js";

/**
 * 表示用: 現在の問題を checkbox 群で表示
 */
export function renderQuestionMultiple(session){
  const q = session.questions[session.currentIndex];
  if(!q) return;

  if(els.question) els.question.textContent = q.q;
  if(els.choicesContainer) els.choicesContainer.innerHTML = "";

  q.choices.forEach((text, idx)=>{
    const wrap = document.createElement("div");
    wrap.className = "choice";
    const cb = document.createElement("input");
    cb.type="checkbox";
    cb.value=String(idx);
    cb.addEventListener("change", ()=>{
      // 選択中一覧更新
      const sel = [...els.choicesContainer.querySelectorAll("input[type=checkbox]:checked")]
        .map(i=>+i.value);
      session.answers[session.currentIndex] = sel;
    });
    const label = document.createElement("label");
    label.style.display="flex";
    label.style.gap="6px";
    label.style.alignItems="center";
    label.append(cb, document.createTextNode(text));
    wrap.append(label);
    els.choicesContainer.appendChild(wrap);
  });
  if(els.result) els.result.textContent="";
  if(els.subResult) els.subResult.textContent="";
}

/**
 * 回答確定（複数選択）
 */
export function submitMultipleAnswer(session){
  const q = session.questions[session.currentIndex];
  const userSel = session.answers[session.currentIndex] || [];
  const correct = multipleEngine.gradeQuestion(q, userSel);

  // 統計更新
  q.stats = q.stats || { c:0, t:0 };
  q.stats.t += 1;
  if(correct) q.stats.c += 1;

  if(correct){
    session.correctCount++;
    if(els.result) els.result.textContent="正解！";
  } else {
    if(els.result) els.result.textContent="不正解";
  }
  if(els.subResult){
    els.subResult.textContent =
      "正解: " + q.correctIndexes.map(i=>q.choices[i]).join(", ");
  }
}

export function nextMultiple(session){
  if(session.currentIndex < session.questions.length - 1){
    session.currentIndex++;
    renderQuestionMultiple(session);
  } else {
    session.finished = true;
    if(els.question) els.question.textContent="終了";
    if(els.choicesContainer) els.choicesContainer.innerHTML="";
    if(els.result) els.result.textContent = `正解数: ${session.correctCount} / ${session.questions.length}`;
    showToast("複数解答モード 終了");
  }
}

export default {
  renderQuestionMultiple,
  submitMultipleAnswer,
  nextMultiple
};