import { els } from "./domRefs.js";
import { state } from "./state.js";
import {
  handleAnswer, handleDontKnow, nextQuestionManual,
  adjustPriorityFactor, renderQuestion,
  retryWrongOnly, toggleFlag, updateFlagButtonForCurrent
} from "./quizUI.js";
import { startQuizMode } from "./session.js";
import {
  rebuildGenreButtons,
  showQuestionCountScreen,
  showManageScreen,
  rebuildManageList,
  showAddScreen,
  handleAddQuestion,
  handleSaveEdit,
  addChoiceInput,
  cancelEdit,
  resetGenreStats,
  exportCurrentGenre,
  importGenreFromFile,
  showGenreManage,
  buildGenreManageList,
  onManageListClick,
  handleManageCheckboxChange,
  doBulkDelete,
  applyBulkTag,
  moveGenre,
  deleteGenre,
  renameGenre,
  updateBulkUI,
  resetAllData
} from "./manage.js";
import {
  populateSettingsForm, saveSettingsFromForm,
  toggleAutoDelayVisibility
} from "./settingsUI.js";
import { showScreen, showToast } from "./utils.js";
import { saveSettings, safeLoadQuizzes, loadGenreOrder, saveGenreOrder, saveQuizzes } from "./storage.js";
import { loadMode } from "./modes/registry.js";
import multipleUI from "./modes/multiple/ui.js";
import flashUI from "./modes/flashcards/ui.js";

/* モード表示更新 */
function updateModeButtonsUI() {
  if (!els.modeSingleBtn) return;
  const mode = state.appMode || "single";
  els.modeSingleBtn.classList.toggle("active", mode === "single");
  els.modeMultipleBtn.classList.toggle("active", mode === "multiple");
  els.modeFlashBtn.classList.toggle("active", mode === "flashcards");
  if(els.currentModeLabel){
    els.currentModeLabel.textContent =
      mode === "single" ? "択一" :
      mode === "multiple" ? "複数選択" :
      "単語帳";
  }
}

async function setAppMode(mode) {
  if (!mode || mode === state.appMode) {
    updateModeButtonsUI();
    return;
  }
  // セッション破棄
  state.activeSession = null;
  state.questions = [];
  state.currentIndex = 0;
  state.correctCount = 0;
  state.answered = false;

  // 設定反映
  state.appMode = mode;
  state.settings.appMode = mode;
  saveSettings(state.settings);

  // モードモジュールロード
  try {
    state.currentModeModule = await loadMode(mode);
  } catch (e) {
    console.error("Failed to load mode module:", e);
    showToast("モード読み込みに失敗しました");
    return;
  }

  // データ再読込
  state.quizzes = safeLoadQuizzes(mode);
  state.genreOrder = loadGenreOrder(mode);
  state.currentGenre = null;
  state.selectedQuestionIds.clear();
  state.tagFilter = "";

  rebuildGenreButtons();
  rebuildManageList();
  showScreen("genreSelect");
  updateModeButtonsUI();
  showToast(`モードを「${els.currentModeLabel?.textContent || mode}」に切り替えました`);
}

/* クイズ開始 */
function startQuizNormal(g,limit){
  if(startQuizMode(g,{limit,lowAccuracy:false})){
    showScreen("quizScreen");
    renderQuestion();
  }
}
function startQuizLowAcc(g,limit){
  if(startQuizMode(g,{limit,lowAccuracy:true})){
    showScreen("quizScreen");
    renderQuestion();
  }
}
function startQuizFlaggedOnly(g){
  if(startQuizMode(g,{flaggedOnly:true})){
    showScreen("quizScreen");
    renderQuestion();
  }
}

export function bindEvents(){
  /* モード切替 */
  els.modeSingleBtn?.addEventListener("click", ()=>setAppMode("single"));
  els.modeMultipleBtn?.addEventListener("click", ()=>setAppMode("multiple"));
  els.modeFlashBtn?.addEventListener("click", ()=>setAppMode("flashcards"));
  updateModeButtonsUI();

  /* キーボード */
  window.addEventListener("keydown", e=>{
    const session = state.activeSession;
    if(session?.mode === "multiple"){
      // Enter/Space: 未確定→採点、確定済→次へ
      if(e.key==="Enter" || e.key===" "){
        if(!state.answered){
          multipleUI.submitMultipleAnswer(session);
        } else {
          multipleUI.nextMultiple(session);
        }
        return;
      }
      // 数字キー: トグルのみ
      if(/^[1-9]$/.test(e.key)){
        const idx = +e.key - 1;
        const cb = els.choicesContainer?.querySelector(`.choice[data-index='${idx}'] input[type=checkbox]`);
        if(cb){
          cb.checked = !cb.checked;
          cb.dispatchEvent(new Event("change",{bubbles:true}));
        }
        return;
      }
      return;
    }
    if(session?.mode === "flashcards"){
      if(e.key==="Enter" || e.key===" "){
        flashUI.nextFlashcard(session);
        return;
      }
      return;
    }
    // single
    if(state.answered && state.settings.progressMode==="manual" && (e.key==="Enter"||e.key===" ")){
      nextQuestionManual();
      return;
    }
    if(state.answered) return;
    if(/^[1-9]$/.test(e.key)){
      const n=+e.key;
      const choices=[...els.choicesContainer.querySelectorAll(".choice")];
      if(n>=1 && n<=choices.length) handleAnswer(n-1);
    } else if(e.key==="0"){
      handleDontKnow();
    }
  });

  /* わからない */
  els.iDontKnowBtn?.addEventListener("click", ()=>{
    const session=state.activeSession;
    if(session?.mode==="multiple"){
      multipleUI.submitMultipleAnswer(session,{forcedDontKnow:true});
      return;
    }
    if(session?.mode==="flashcards"){
      flashUI.nextFlashcard(session);
      return;
    }
    handleDontKnow();
  });

  /* 次へ */
  els.nextQuestionBtn?.addEventListener("click", ()=>{
    const session=state.activeSession;
    if(session?.mode==="multiple"){
      multipleUI.nextMultiple(session);
      return;
    }
    if(session?.mode==="flashcards"){
      flashUI.nextFlashcard(session);
      return;
    }
    nextQuestionManual();
  });

  /* フラグ切替 */
  els.flagToggleBtn?.addEventListener("click", ()=>{
    const q = state.questions[state.currentIndex];
    if(!q) return;
    const newState = toggleFlag(state.currentGenre,q.id);
    updateFlagButtonForCurrent();
    saveQuizzes(state.appMode);
    showToast(newState? "要チェックに追加":"要チェックを解除");
  });

  /* 出題率調整（低正答率モードでUIが表示される） */
  els.priorityUpBtn?.addEventListener("click", ()=>{
    const m=state.settings.priorityIncreaseMultiplier || 1.4;
    adjustPriorityFactor(m);
  });
  els.priorityDownBtn?.addEventListener("click", ()=>{
    const m=state.settings.priorityIncreaseMultiplier || 1.4;
    adjustPriorityFactor(1/m);
  });

  /* 問題数選択画面 */
  if(els.qCountButtons){
    els.qCountButtons.addEventListener("click", e=>{
      const btn=e.target.closest("button");
      if(!btn) return;
      const genre=btn.dataset.genre;
      const mode=btn.dataset.mode;
      const count=btn.dataset.count;
      if(!genre || !mode) return;
      let limit=null;
      if(count && count!=="all"){
        const n=parseInt(count,10);
        if(!isNaN(n)&&n>0) limit=n;
      }
      switch(mode){
        case "normal":  startQuizNormal(genre, count==="all"? null:limit); break;
        case "low":     startQuizLowAcc(genre, limit); break;
        case "flagged": startQuizFlaggedOnly(genre); break;
      }
    });
  }

  /* ジャンル追加 */
  els.addGenreBtn?.addEventListener("click", ()=>{
    const name=prompt("新しいジャンル名:");
    if(!name) return;
    const g=name.trim();
    if(!g) return;
    if(state.quizzes[g]){ alert("既に存在します"); return; }
    state.quizzes[g]=[];
    state.genreOrder.push(g);
    saveGenreOrder(state.genreOrder,state.appMode);
    saveQuizzes(state.appMode);
    rebuildGenreButtons();
    showToast(`ジャンル「${g}」追加`);
  });

  /* 管理画面遷移/戻る（manageBackBtn と manageBackBtn2 の両方を見る） */
  els.manageBtn?.addEventListener("click", ()=>{
    if(!state.currentGenre){
      const first=state.genreOrder[0];
      if(!first){ showToast("ジャンルがありません"); return; }
      state.currentGenre=first;
    }
    showManageScreen(state.currentGenre);
  });
  els.manageBackBtn?.addEventListener("click", ()=>showScreen("genreSelect"));
  els.manageBackBtn2?.addEventListener("click", ()=>showScreen("genreSelect"));
  els.genreManageBtn?.addEventListener("click", ()=>showGenreManage());

  /* 戻り/再挑戦 */
  els.qCountCancelBtn?.addEventListener("click", ()=>showScreen("genreSelect"));
  els.backBtn?.addEventListener("click", ()=>{
    if(confirm("進行中のクイズを終了しますか？")) showScreen("genreSelect");
  });
  els.retryWrongBtn?.addEventListener("click", retryWrongOnly);
  els.backToGenreBtn?.addEventListener("click", ()=>showScreen("genreSelect"));
  els.retrySameBtn?.addEventListener("click", ()=>{
    const s=state.lastSession;
    if(!s||!s.genre){ showToast("直前の出題条件がありません"); return; }
    if(s.flaggedOnly)      startQuizFlaggedOnly(s.genre);
    else if(s.lowAccuracy) startQuizLowAcc(s.genre,s.limit);
    else                   startQuizNormal(s.genre,s.limit);
  });
  els.backToCountBtn?.addEventListener("click", ()=>{
    if(!state.currentGenre) showScreen("genreSelect");
    else showQuestionCountScreen(state.currentGenre);
  });

  /* 結果画面 フラグ操作 */
  els.wrongList?.addEventListener("click", e=>{
    const btn=e.target.closest(".flag-btn");
    if(!btn) return;
    const id=btn.dataset.id;
    const newState=toggleFlag(state.currentGenre,id);
    btn.classList.toggle("active",newState);
    btn.textContent=newState?"★ 要チェック":"☆ 要チェック";
    saveQuizzes(state.appMode);
  });
  els.rightList?.addEventListener("click", e=>{
    const btn=e.target.closest(".flag-btn");
    if(!btn) return;
    const id=btn.dataset.id;
    const newState=toggleFlag(state.currentGenre,id);
    btn.classList.toggle("active",newState);
    btn.textContent=newState?"★ 要チェック":"☆ 要チェック";
    saveQuizzes(state.appMode);
  });

  els.manageFromResultBtn?.addEventListener("click", ()=>{
    if(!state.currentGenre){
      showToast("現在のジャンルが特定できません");
      showScreen("genreSelect");
      return;
    }
    showManageScreen(state.currentGenre);
  });

  /* 管理画面操作（省略部は既存のまま） */
  els.manageListWrap?.addEventListener("click", onManageListClick);
  els.manageListWrap?.addEventListener("change", handleManageCheckboxChange);
  els.selectAllBtn?.addEventListener("click", ()=>{
    const cbs=els.manageListWrap.querySelectorAll(".q-select");
    cbs.forEach(cb=>{
      cb.checked=true;
      const key=cb.dataset.genre+"|"+cb.dataset.id;
      state.selectedQuestionIds.add(key);
    });
    updateBulkUI();
  });
  els.deselectAllBtn?.addEventListener("click", ()=>{
    const cbs=els.manageListWrap.querySelectorAll(".q-select");
    cbs.forEach(cb=>cb.checked=false);
    state.selectedQuestionIds.clear();
    updateBulkUI();
  });
  els.bulkDeleteBtn?.addEventListener("click", doBulkDelete);
  els.bulkTagApplyBtn?.addEventListener("click", ()=>applyBulkTag());
  els.bulkTagInput?.addEventListener("input", ()=>updateBulkUI());
  els.sortSelect?.addEventListener("change", ()=>{
    state.sortMode = els.sortSelect.value;
    rebuildManageList();
  });
  els.tagFilterInput?.addEventListener("input", ()=>{
    state.tagFilter = els.tagFilterInput.value.trim();
    rebuildManageList();
  });

  /* ジャンル管理画面 */
  els.genreManageList?.addEventListener("click", e=>{
    const btn=e.target.closest("button[data-act]");
    if(!btn) return;
    const act=btn.dataset.act;
    const g=btn.dataset.g;
    switch(act){
      case "up": moveGenre(g,-1); buildGenreManageList(); break;
      case "down": moveGenre(g,1); buildGenreManageList(); break;
      case "del": deleteGenre(g); break;
      case "manage": state.currentGenre=g; showManageScreen(g); break;
      case "rename": renameGenre(g); break;
    }
  });

  /* 追加/編集画面 */
  els.addQuestionBtn?.addEventListener("click", ()=>{
    const g = state.currentGenre || state.genreOrder[0] || "";
    showAddScreen(g);
  });
  els.addChoiceBtn?.addEventListener("click", ()=>addChoiceInput(""));
  els.addForm?.addEventListener("submit", e=>{
    e.preventDefault();
    handleAddQuestion(false);
  });
  els.submitAddBtn?.addEventListener("click", ()=>handleAddQuestion(false));
  els.addAndContinueBtn?.addEventListener("click", ()=>handleAddQuestion(true));
  els.cancelAddBtn?.addEventListener("click", ()=>{
    if(confirm("追加をキャンセルしますか？")) showScreen("genreSelect");
  });
  els.saveEditBtn?.addEventListener("click", ()=>handleSaveEdit());
  els.cancelEditBtn?.addEventListener("click", ()=>cancelEdit());
  els.backToManageBtn?.addEventListener("click", ()=>{
    if(state.currentGenre){
      showManageScreen(state.currentGenre);
    } else {
      showScreen("genreSelect");
    }
  });

  /* 全データリセット */
  els.resetAllDataBtn?.addEventListener("click", ()=>resetAllData());

  /* 設定 */
  els.settingsBtn?.addEventListener("click", ()=>{
    populateSettingsForm();
    showScreen("settingsScreen");
  });
  els.settingsForm?.addEventListener("change", e=>{
    if(e.target.name==="progressMode") toggleAutoDelayVisibility();
  });
  els.settingsForm?.addEventListener("submit", e=>{
    e.preventDefault();
    saveSettingsFromForm();
    showScreen("genreSelect");
  });
  els.cancelSettingsBtn?.addEventListener("click", ()=>showScreen("genreSelect"));
}

export { startQuizNormal, startQuizLowAcc, startQuizFlaggedOnly };