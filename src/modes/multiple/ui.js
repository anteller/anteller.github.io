import { els } from "../../domRefs.js";
import { showToast } from "../../utils.js";
import multipleEngine from "./engine.js";
import { saveQuizzes } from "../../storage.js";
import { state } from "../../state.js";

// 正解インデックス取得（single互換フォールバック）
function getCorrectIndexes(q){
  if(Array.isArray(q.correctIndexes)) return q.correctIndexes;
  return Number.isInteger(q.answer) ? [q.answer] : [];
}

function setNextVisible(visible){
  if(!els.nextQuestionBtn) return;
  els.nextQuestionBtn.style.display = visible ? "inline-flex" : "none";
}

function buildChoiceRow(text, idx, session){
  const row = document.createElement("div");
  row.className = "choice";
  row.dataset.index = String(idx);
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "10px";
  row.style.padding = "8px 10px";
  row.style.border = "1px solid var(--c-border, #5552)";
  row.style.borderRadius = "8px";
  row.style.margin = "6px 0";
  row.style.cursor = "pointer";
  row.style.userSelect = "none";
  row.style.background = "var(--c-surface)";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = String(idx);
  cb.style.transform = "scale(1.2)";

  const label = document.createElement("div");
  label.style.flex = "1 1 auto";
  label.textContent = String(text ?? "");

  row.addEventListener("click", (e)=>{
    if((e.target)?.tagName?.toLowerCase() !== "input"){
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change", { bubbles:true }));
    }
  });

  cb.addEventListener("change", ()=>{
    const sel = [...els.choicesContainer.querySelectorAll("input[type=checkbox]:checked")]
      .map(i=>+i.value);
    session.answers[session.currentIndex] = sel;
  });

  row.append(cb, label);
  return row;
}

export function renderQuestionMultiple(session){
  const q = session.questions[session.currentIndex];
  if(!q) return;

  // 進捗
  if(els.progress){
    els.progress.textContent = `${session.currentIndex+1} / ${session.questions.length}`;
  }

  // 次へボタンを隠す
  setNextVisible(false);
  state.answered = false;

  // 問題文
  if(els.question) els.question.textContent = q.q ?? "";

  // 解説を隠す
  if(els.explanationBox){
    els.explanationBox.innerHTML = "";
    els.explanationBox.style.display = "none";
  }

  // 選択肢
  if(els.choicesContainer){
    els.choicesContainer.innerHTML = "";
    (Array.isArray(q.choices)? q.choices: []).forEach((t,i)=>{
      els.choicesContainer.appendChild(buildChoiceRow(t,i,session));
    });

    const submitBtn = document.createElement("button");
    submitBtn.type="button";
    submitBtn.className="btn small";
    submitBtn.textContent="回答確定";
    submitBtn.style.marginTop="12px";
    submitBtn.style.alignSelf="stretch";
    submitBtn.addEventListener("click", ()=>{
      submitMultipleAnswer(session);
      setNextVisible(true);
    });
    els.choicesContainer.appendChild(submitBtn);
  }

  if(els.result){
    els.result.textContent="";
    els.result.style.color="inherit";
  }
  if(els.subResult){
    els.subResult.textContent="";
    els.subResult.style.color="var(--c-text-sub)";
  }
}

export function submitMultipleAnswer(session){
  const q = session.questions[session.currentIndex];
  const userSel = session.answers[session.currentIndex] || [];
  const correct = multipleEngine.gradeQuestion(q, userSel);

  // 統計
  q.stats = q.stats || { c:0, t:0 };
  q.stats.t += 1;
  if(correct) q.stats.c += 1;

  saveQuizzes(state.appMode);

  const correctIndexes = getCorrectIndexes(q);
  const selected = new Set(userSel);
  const correctSet = new Set(correctIndexes);

  // ハイライト
  const rows = [...els.choicesContainer.querySelectorAll(".choice")];
  rows.forEach(row=>{
    const idx = +row.dataset.index;
    const chosen = selected.has(idx);
    const isCorrect = correctSet.has(idx);
    row.style.borderWidth="2px";
    if(isCorrect && chosen){
      row.style.background="rgba(34,197,94,0.18)";
      row.style.borderColor="rgba(34,197,94,0.9)";
    } else if(!isCorrect && chosen){
      row.style.background="rgba(239,68,68,0.15)";
      row.style.borderColor="rgba(239,68,68,0.8)";
    } else if(isCorrect && !chosen){
      row.style.background="var(--c-surface)";
      row.style.borderColor="rgba(34,197,94,0.8)";
    } else {
      row.style.opacity=".75";
      row.style.borderColor="var(--c-border,#5552)";
    }
    const cb=row.querySelector("input[type=checkbox]");
    if(cb) cb.disabled=true;
  });

  state.answered = true;

  // 結果表示
  if(els.result){
    els.result.textContent = correct? "〇 正解！":"✕ 不正解";
    els.result.style.color = correct? "rgb(34,197,94)" : "rgb(239,68,68)";
  }

  if(els.subResult){
    const choices = Array.isArray(q.choices)? q.choices:[];
    const texts = correctIndexes.map(i=>choices[i]).filter(v=>typeof v!=="undefined");
    els.subResult.textContent = "正解: " + (texts.length? texts.join(", "):"(なし)");
    els.subResult.style.color = "var(--c-text-sub)";
  }

  // 解説表示（存在する場合のみ）
  if(q.exp && q.exp.trim()!=="" && els.explanationBox){
    els.explanationBox.style.display="block";
    els.explanationBox.textContent = q.exp.trim();
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
    if(els.result){
      els.result.textContent = `正解数: ${session.correctCount} / ${session.questions.length}`;
      els.result.style.color="inherit";
    }
    showToast("複数選択モード 終了");
  }
}

export default {
  renderQuestionMultiple,
  submitMultipleAnswer,
  nextMultiple
};