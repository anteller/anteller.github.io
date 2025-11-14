import { els } from "../../domRefs.js";
import { showToast } from "../../utils.js";
import multipleEngine from "./engine.js";
import { saveQuizzes } from "../../storage.js";
import { state } from "../../state.js";

// 内部: 正解インデックス配列（single形式にもフォールバック）
function getCorrectIndexes(q){
  if(Array.isArray(q.correctIndexes)) return q.correctIndexes;
  return Number.isInteger(q.answer) ? [q.answer] : [];
}

// 内部: UIの「次へ」ボタン表示切り替え
function setNextVisible(visible){
  if(!els.nextQuestionBtn) return;
  els.nextQuestionBtn.style.display = visible ? "inline-flex" : "none";
}

// 内部: 選択肢の1行DOMを構築
function buildChoiceRow(text, idx, session){
  const row = document.createElement("div");
  row.className = "choice";
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "10px";
  row.style.padding = "8px 10px";
  row.style.border = "1px solid var(--c-border, #ddd)";
  row.style.borderRadius = "8px";
  row.style.margin = "6px 0";
  row.style.cursor = "pointer";
  row.style.userSelect = "none";
  row.style.background = "var(--c-surface, #fff)";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = String(idx);
  cb.style.transform = "scale(1.2)";

  const label = document.createElement("div");
  label.style.flex = "1 1 auto";
  label.textContent = String(text ?? "");

  // クリックで一括トグル
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
  row.dataset.index = String(idx);
  return row;
}

/**
 * 表示: 現在の問題を checkbox 群で表示
 */
export function renderQuestionMultiple(session){
  const q = session.questions[session.currentIndex];
  if(!q) return;

  // 進捗表示
  if(els.progress){
    const cur = session.currentIndex + 1;
    const total = session.questions.length;
    els.progress.textContent = `${cur} / ${total}`;
  }

  // 「次へ」は回答確定まで隠す
  setNextVisible(false);

  // 問題文
  if(els.question) els.question.textContent = q.q ?? "";

  // 選択肢領域
  if(els.choicesContainer) {
    els.choicesContainer.innerHTML = "";

    (Array.isArray(q.choices) ? q.choices : []).forEach((text, idx)=>{
      const row = buildChoiceRow(text, idx, session);
      els.choicesContainer.appendChild(row);
    });

    // 操作バー（回答確定 / クリア）
    const bar = document.createElement("div");
    bar.style.display = "flex";
    bar.style.gap = "8px";
    bar.style.marginTop = "10px";

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "btn small";
    submitBtn.textContent = "回答確定";
    submitBtn.addEventListener("click", ()=>{
      submitMultipleAnswer(session);
      // 確定後に「次へ」を表示
      setNextVisible(true);
    });

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn small flat";
    clearBtn.textContent = "選択をクリア";
    clearBtn.addEventListener("click", ()=>{
      [...els.choicesContainer.querySelectorAll("input[type=checkbox]")].forEach(cb=>{
        cb.checked = false;
      });
      session.answers[session.currentIndex] = [];
    });

    bar.append(submitBtn, clearBtn);
    els.choicesContainer.appendChild(bar);
  }

  if(els.result) els.result.textContent="";
  if(els.subResult) els.subResult.textContent="";
}

/**
 * 回答確定（複数選択）
 * - 正解: 緑
 * - 誤選択: 赤
 * - 未選択の正解: 緑の枠
 * - 以降のチェック変更不可
 */
export function submitMultipleAnswer(session){
  const q = session.questions[session.currentIndex];
  const userSel = session.answers[session.currentIndex] || [];
  const correct = multipleEngine.gradeQuestion(q, userSel);

  // 統計更新
  q.stats = q.stats || { c:0, t:0 };
  q.stats.t += 1;
  if(correct) q.stats.c += 1;

  // 保存
  saveQuizzes(state.appMode);

  // 見た目（ハイライト）
  const correctIndexes = getCorrectIndexes(q);
  const selected = new Set(userSel);
  const correctSet = new Set(correctIndexes);

  const rows = [...els.choicesContainer.querySelectorAll(".choice")];
  rows.forEach(row=>{
    const idx = +row.dataset.index;
    const chosen = selected.has(idx);
    const isCorrect = correctSet.has(idx);

    // 共通のベース
    row.style.borderWidth = "1px";

    // 初期化
    row.style.background = "var(--c-surface, #fff)";
    row.style.borderColor = "var(--c-border, #ddd)";
    row.style.color = "inherit";
    row.style.opacity = "1";

    // ハイライト規則
    if(isCorrect && chosen){
      // 正しく選択 → 緑背景
      row.style.background = "rgba(34,197,94,0.15)";   // green-500 alpha
      row.style.borderColor = "rgba(34,197,94,0.6)";
    } else if(!isCorrect && chosen){
      // 誤選択 → 赤背景
      row.style.background = "rgba(239,68,68,0.12)";   // red-500 alpha
      row.style.borderColor = "rgba(239,68,68,0.6)";
    } else if(isCorrect && !chosen){
      // 選ばなかった正解 → 緑の枠だけ
      row.style.borderColor = "rgba(34,197,94,0.8)";
    } else {
      // それ以外は薄め
      row.style.opacity = "0.85";
    }
  });

  // チェック操作を無効化
  [...els.choicesContainer.querySelectorAll("input[type=checkbox]")]
    .forEach(cb=>cb.disabled = true);

  // 結果文言
  if(els.result) els.result.textContent = correct ? "正解！" : "不正解";

  // 正解のテキスト表示
  if(els.subResult){
    const choices = Array.isArray(q.choices) ? q.choices : [];
    const texts = correctIndexes
      .map(i => choices[i])
      .filter(v=>typeof v!=="undefined");
    els.subResult.textContent = "正解: " + (texts.length? texts.join(", ") : "(なし)");
  }
}

/**
 * 次の問題へ
 */
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