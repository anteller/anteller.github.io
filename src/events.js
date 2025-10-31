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
import { showScreen, showToast, keyListenerActiveQuiz } from "./utils.js";

/* クイズ開始用ラッパ */
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
  /* ==== 回答画面 ==== */
  els.iDontKnowBtn?.addEventListener("click", handleDontKnow);
  window.addEventListener("keydown", e=>{
    keyListenerActiveQuiz(e,{
      onNext: nextQuestionManual,
      onAnswer: handleAnswer,
      onDontKnow: handleDontKnow
    });
  });
  els.nextQuestionBtn.addEventListener("click", nextQuestionManual);

  els.flagToggleBtn?.addEventListener("click", ()=>{
    const q = state.questions[state.currentIndex];
    if(!q) return;
    const newState = toggleFlag(state.currentGenre,q.id);
    updateFlagButtonForCurrent();
    showToast(newState? "要チェックに追加":"要チェックを解除");
  });

  els.priorityUpBtn?.addEventListener("click", ()=>{
    const m=state.settings.priorityIncreaseMultiplier || 1.4;
    adjustPriorityFactor(m);
  });
  els.priorityDownBtn?.addEventListener("click", ()=>{
    const m=state.settings.priorityIncreaseMultiplier || 1.4;
    adjustPriorityFactor(1/m);
  });

  /* ==== 問題数選択画面（委譲） ==== */
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

  /* ==== ジャンル / トップ ==== */
  els.addGenreBtn.addEventListener("click", ()=>{
    const name=prompt("新しいジャンル名:");
    if(!name) return;
    const g=name.trim();
    if(!g) return;
    if(state.quizzes[g]){ alert("既に存在します"); return; }
    state.quizzes[g]=[];
    state.genreOrder.push(g);
    rebuildGenreButtons();
    showToast(`ジャンル「${g}」追加`);
  });

  els.manageBtn.addEventListener("click", ()=>{
    if(!state.currentGenre){
      const first=state.genreOrder[0];
      if(!first){ showToast("ジャンルがありません"); return; }
      state.currentGenre=first;
    }
    showManageScreen(state.currentGenre);
  });

  els.genreManageBtn?.addEventListener("click", ()=>showGenreManage());

  /* ==== 戻り/再挑戦 ==== */
  els.qCountCancelBtn.addEventListener("click", ()=>showScreen("genreSelect"));
  els.backBtn.addEventListener("click", ()=>{
    if(confirm("進行中のクイズを終了しますか？")) showScreen("genreSelect");
  });
  els.retryWrongBtn.addEventListener("click", retryWrongOnly);
  els.backToGenreBtn.addEventListener("click", ()=>showScreen("genreSelect"));
  els.retrySameBtn.addEventListener("click", ()=>{
    const s=state.lastSession;
    if(!s||!s.genre){ showToast("直前の出題条件がありません"); return; }
    if(s.flaggedOnly)      startQuizFlaggedOnly(s.genre);
    else if(s.lowAccuracy) startQuizLowAcc(s.genre,s.limit);
    else                   startQuizNormal(s.genre,s.limit);
  });
  els.backToCountBtn.addEventListener("click", ()=>{
    if(!state.currentGenre) showScreen("genreSelect");
    else showQuestionCountScreen(state.currentGenre);
  });

  /* ==== 結果画面 フラグ ==== */
  els.wrongList.addEventListener("click", e=>{
    const btn=e.target.closest(".flag-btn");
    if(!btn) return;
    const id=btn.dataset.id;
    const newState=toggleFlag(state.currentGenre,id);
    btn.classList.toggle("active",newState);
    btn.textContent=newState?"★ 要チェック":"☆ 要チェック";
  });
  els.rightList?.addEventListener("click", e=>{
    const btn=e.target.closest(".flag-btn");
    if(!btn) return;
    const id=btn.dataset.id;
    const newState=toggleFlag(state.currentGenre,id);
    btn.classList.toggle("active",newState);
    btn.textContent=newState?"★ 要チェック":"☆ 要チェック";
  });
  // 結果画面 -> 問題管理へ
  els.manageFromResultBtn?.addEventListener("click", ()=>{
    if(!state.currentGenre){
      showToast("現在のジャンルが特定できません");
      showScreen("genreSelect");
      return;
    }
    showManageScreen(state.currentGenre);
  });

  /* ==== 管理画面: 一覧操作 ==== */
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

  els.applyFilterBtn?.addEventListener("click", ()=>{
    state.tagFilter = els.tagFilterInput.value.trim();
    rebuildManageList();
  });
  els.clearFilterBtn?.addEventListener("click", ()=>{
    state.tagFilter="";
    if(els.tagFilterInput) els.tagFilterInput.value="";
    rebuildManageList();
  });
  els.tagFilterInput?.addEventListener("keydown", e=>{
    if(e.key==="Enter"){
      e.preventDefault();
      state.tagFilter = els.tagFilterInput.value.trim();
      rebuildManageList();
    }
  });

  els.flaggedFilterBtn?.addEventListener("click", ()=>{
    state.manageFlaggedOnly=!state.manageFlaggedOnly;
    if(state.manageFlaggedOnly){
      els.flaggedFilterBtn.classList.add("active");
      els.flaggedFilterBtn.textContent="★ 要チェックのみ";
    } else {
      els.flaggedFilterBtn.classList.remove("active");
      els.flaggedFilterBtn.textContent="☆ 要チェックのみ";
    }
    rebuildManageList();
    updateBulkUI();
  });

  els.resetStatsBtn?.addEventListener("click", resetGenreStats);
  els.manageAddBtn?.addEventListener("click", ()=>{
    const g = state.currentGenre || state.genreOrder[0] || "";
    showAddScreen(g);
  });
  els.manageBackBtn2?.addEventListener("click", ()=>showScreen("genreSelect"));

  els.genreFilterSelect?.addEventListener("change", ()=>{
    const val=els.genreFilterSelect.value;
    if(val==="__ALL__"){
      if(els.manageTitle) els.manageTitle.textContent="問題管理 - (すべて)";
    } else {
      state.currentGenre=val;
      if(els.manageTitle) els.manageTitle.textContent=`問題管理 - ${val} (全${(state.quizzes[val]||[]).length}問)`;
    }
    state.selectedQuestionIds.clear();
    rebuildManageList();
    updateBulkUI();
  });

  els.genreExportBtn?.addEventListener("click", exportCurrentGenre);
  els.genreImportBtn?.addEventListener("click", ()=>{
    const val=els.genreFilterSelect ? els.genreFilterSelect.value : state.currentGenre;
    if(val==="__ALL__"){ showToast("「(すべて)」表示中はインポート先不明"); return; }
    if(!val){ showToast("ジャンル未選択"); return; }
    els.genreImportFile?.click();
  });
  els.genreImportFile?.addEventListener("change", e=>{
    const file=e.target.files && e.target.files[0];
    if(!file) return;
    importGenreFromFile(file);
    e.target.value="";
  });

  /* ==== ジャンル管理画面 ==== */
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
  els.genreManageBackBtn?.addEventListener("click", ()=>showScreen("genreSelect"));

  /* ==== 追加画面 ==== */
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
  // 追加/編集画面: 編集中に管理一覧へ戻る
  els.backToManageBtn?.addEventListener("click", ()=>{
    if(state.currentGenre){
      showManageScreen(state.currentGenre);
    } else {
      showScreen("genreSelect");
    }
  });
  /* ==== 全データリセット ==== */
  els.resetAllDataBtn?.addEventListener("click", ()=>resetAllData());

  /* ==== 設定画面 ==== */
  els.settingsBtn.addEventListener("click", ()=>{
    populateSettingsForm();
    showScreen("settingsScreen");
  });
  els.settingsForm.addEventListener("change", e=>{
    if(e.target.name==="progressMode") toggleAutoDelayVisibility();
  });
  els.settingsForm.addEventListener("submit", e=>{
    e.preventDefault();
    saveSettingsFromForm();
    showScreen("genreSelect");
  });
  els.cancelSettingsBtn.addEventListener("click", ()=>showScreen("genreSelect"));
}

/* 外部公開（他で再利用する開始関数） */
export { startQuizNormal, startQuizLowAcc, startQuizFlaggedOnly };