import { els } from "../../domRefs.js";
import { showToast } from "../../utils.js";
import multipleEngine from "./engine.js";
import { saveQuizzes } from "../../storage.js";
import { state } from "../../state.js";

// 正解インデックス取得（single互換）
function getCorrectIndexes(q){
  if(Array.isArray(q.correctIndexes)) return q.correctIndexes;
  return Number.isInteger(q.answer) ? [q.answer] : [];
}

function setNextVisible(visible){
  if(!els.nextQuestionBtn) return;
  els.nextQuestionBtn.style.display = visible ? "inline-flex" : "none";
}

function disableIDontKnow(){
  if(els.iDontKnowBtn){
    els.iDontKnowBtn.disabled = true;
    els.iDontKnowBtn.style.opacity = ".55";
  }
}

// ①②…（1〜20まで対応）
function circledNum(n){
  const map = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳".split("");
  return (n>=1 && n<=20)? map[n-1] : String(n);
}

// 低正答率UI（出題率ボタン）を表示/更新
function updatePriorityAdjustUIForMultiple(){
  if(!els.priorityAdjustWrap) return;
  const lowMode=!!state.lastSession?.lowAccuracy;
  if(!lowMode || state.currentIndex>=state.questions.length){
    els.priorityAdjustWrap.classList.add("hidden");
    return;
  }
  const currentQ=state.questions[state.currentIndex];
  const orig=state.quizzes[state.currentGenre]?.find(q=>q.id===currentQ.id);
  const pf=orig?.priorityFactor ?? 1;
  if(els.priorityIndicator) els.priorityIndicator.textContent="x"+pf.toFixed(2);
  els.priorityAdjustWrap.classList.remove("hidden");
}

function buildChoiceRow(text, idx, session){
  const row = document.createElement("div");
  row.className = "choice";
  row.dataset.index = String(idx);
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "10px";
  row.style.padding = "10px 12px";
  // 青枠（ライト/ダーク両対応のフォールバック）
  row.style.border = "2px solid var(--c-primary, #2563eb)";
  row.style.borderRadius = "12px";
  row.style.margin = "8px 0";
  row.style.cursor = "pointer";
  row.style.userSelect = "none";
  row.style.background = "var(--c-surface, #fff)";

  // ①バッジ（左上）
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = circledNum(idx+1);
  badge.style.fontWeight = "600";
  badge.style.marginRight = "6px";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = String(idx);
  cb.style.transform = "scale(1.15)";

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

  row.append(badge, cb, label);
  return row;
}

export function renderQuestionMultiple(session){
  const q = session.questions[session.currentIndex];
  if(!q) return;

  // 進捗
  if(els.progress){
    els.progress.textContent = `${session.currentIndex+1} / ${session.questions.length}`;
  }

  // 次へを隠す・未回答フラグ
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

    // 回答確定（選択肢の下）
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
  if(els.iDontKnowBtn){
    els.iDontKnowBtn.disabled=false;
    els.iDontKnowBtn.style.opacity="1";
  }

  // 低正答率UI
  updatePriorityAdjustUIForMultiple();
}

/**
 * 回答確定
 */
export function submitMultipleAnswer(session, { forcedDontKnow=false } = {}){
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
    row.style.opacity = "1";
    if(isCorrect && chosen){
      row.style.background="rgba(34,197,94,0.16)";
      row.style.borderColor="rgba(34,197,94,0.9)";
    } else if(!isCorrect && chosen){
      row.style.background="rgba(239,68,68,0.12)";
      row.style.borderColor="rgba(239,68,68,0.8)";
    } else if(isCorrect && !chosen){
      row.style.background="var(--c-surface, #fff)";
      row.style.borderColor="rgba(34,197,94,0.8)";
    } else {
      row.style.opacity=".85";
      row.style.borderColor="var(--c-primary, #2563eb)";
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

  // 解説表示
  if(q.exp && q.exp.trim()!=="" && els.explanationBox){
    els.explanationBox.style.display="block";
    els.explanationBox.textContent = q.exp.trim();
  }

  // 次へ
  setNextVisible(true);
  if(state.settings.progressMode==="auto"){
    const delayMs=Math.max(0, state.settings.autoDelaySeconds*1000);
    setTimeout(()=>{ nextMultiple(session); }, delayMs);
  }

  // 低正答率UI（インジケータ更新）
  updatePriorityAdjustUIForMultiple();
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