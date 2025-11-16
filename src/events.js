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

/* モード切替補助 */
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
  state.answered = false;

  // 設定反映
  state.appMode = mode;
  state.settings.appMode = mode;
  saveSettings(state.settings);

  // モードモジュールのロード
  try {
    state.currentModeModule = await loadMode(mode);
  } catch (e) {
    console.error("Failed to load mode module:", e);
    showToast("モード読み込みに失敗しました");
    return;
  }

  // モード専用データの再読込
  state.quizzes = safeLoadQuizzes(mode);
  state.genreOrder = loadGenreOrder(mode);
  state.currentGenre = null;
  state.selectedQuestionIds.clear();
  state.tagFilter = "";

  // UI再構築（ホーム/管理もモードごとの内容に切替）
  rebuildGenreButtons();
  rebuildManageList();

  // ホームへ戻る
  showScreen("genreSelect");

  updateModeButtonsUI();
  showToast(`モードを「${els.currentModeLabel?.textContent || mode}」に切り替えました`);
}

<<<<<<< HEAD
/* クイズ開始 */
=======
/* クイズ開始用ラッパ */
>>>>>>> parent of cbfbb8a (okoko)
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
  /* ==== モード切替ボタン ==== */
  els.modeSingleBtn?.addEventListener("click", ()=>setAppMode("single"));
  els.modeMultipleBtn?.addEventListener("click", ()=>setAppMode("multiple"));
  els.modeFlashBtn?.addEventListener("click", ()=>setAppMode("flashcards"));
  updateModeButtonsUI();

  /* ==== キーボード ==== */
  window.addEventListener("keydown", e=>{
    const session = state.activeSession;
    if(session?.mode === "multiple"){
<<<<<<< HEAD
      // Enter/Space: 未確定→採点、確定済→次へ
=======
      // Enter → 次へ（回答済みなら）
>>>>>>> parent of cbfbb8a (okoko)
      if(e.key==="Enter" || e.key===" "){
        if(state.answered){
          multipleUI.nextMultiple(session);
        }
        return;
      }
      // 数字キー → 選択トグル（回答確定前は採点しない）
      if(/^[1-9]$/.test(e.key)){
        const idx = +e.key - 1;
        const cb = els.choicesContainer?.querySelector(`.choice[data-index='${idx}'] input[type=checkbox]`);
        if(cb){
          cb.checked = !cb.checked;
          cb.dispatchEvent(new Event("change",{bubbles:true}));
        }
        return;
      }
      // 0キー / その他は無視
      return;
    }
    if(session?.mode === "flashcards"){
      if(e.key==="Enter" || e.key===" "){
        flashUI.nextFlashcard(session);
        return;
      }
      return;
    }
    // single モード既存処理
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

  /* ==== 回答画面 ==== */
  els.iDontKnowBtn?.addEventListener("click", ()=>{
    const session=state.activeSession;
    if(session?.mode==="multiple"){
      // 「わからない」は回答確定扱い（空選択）
      multipleUI.submitMultipleAnswer(session);
      state.answered=true;
      multipleUI.nextMultiple(session);
      return;
    }
    if(session?.mode==="flashcards"){
      flashUI.nextFlashcard(session);
      return;
    }
    handleDontKnow();
  });

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

  els.flagToggleBtn?.addEventListener("click", ()=>{
    const q = state.questions[state.currentIndex];
    if(!q) return;
    const newState = toggleFlag(state.currentGenre,q.id);
    updateFlagButtonForCurrent();
    saveQuizzes(state.appMode);
    showToast(newState? "要チェックに追加":"要チェックを解除");
  });

<<<<<<< HEAD
  /* 出題率調整（低正答率モードでUIが表示される） */
=======
>>>>>>> parent of cbfbb8a (okoko)
  els.priorityUpBtn?.addEventListener("click", ()=>{
    const m=state.settings.priorityIncreaseMultiplier || 1.4;
    adjustPriorityFactor(m);
  });
  els.priorityDownBtn?.addEventListener("click", ()=>{
    const m=state.settings.priorityIncreaseMultiplier || 1.4;
    adjustPriorityFactor(1/m);
  });

  /* ==== スワイプ（singleのみ維持。multipleは回答確定後 Enterで進む運用） ==== */
  (function setupTouchSwipe(){
    try{
      let touchStartX = 0;
      let touchStartY = 0;
      let touching = false;
      const SWIPE_THRESHOLD = 40;
      const SWIPE_MAX_Y_DELTA = 80;
      els.quizScreen?.addEventListener('touchstart', e=>{
        if(!e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touching = true;
      }, { passive: true });
      els.quizScreen?.addEventListener('touchend', e=>{
        if(!touching) return;
        touching = false;
        const t = (e.changedTouches && e.changedTouches[0]) || null;
        if(!t) return;
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if(Math.abs(dy) > SWIPE_MAX_Y_DELTA) return;
        if(dx < -SWIPE_THRESHOLD){
          const session=state.activeSession;
          if(session?.mode==="multiple"){
            if(state.answered) multipleUI.nextMultiple(session);
            return;
          }
          if(session?.mode==="flashcards"){
            flashUI.nextFlashcard(session);
            return;
          }
          if(state.answered) nextQuestionManual();
        }
      }, { passive: true });
    }catch(err){
      console.error('setupTouchSwipe failed', err);
    }
  })();

  /* ==== 問題数選択画面 ==== */
  if(els.qCountButtons){
    els.qCountButtons.addEventListener("click", e=>{
      const btn=e.target.closest("button");
      if(!btn) return;
      const genre=btn.dataset.genre;
      const mode=btn.dataset.mode;
      const count=btn.dataset.count;
      if(!genre || !mode) return;
      let limit=null;
      if(count && count!="all"){
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

  /* ==== ジャンル ==== */
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

<<<<<<< HEAD
  /* 管理画面遷移/戻る */
=======
>>>>>>> parent of cbfbb8a (okoko)
  els.manageBtn?.addEventListener("click", ()=>{
    if(!state.currentGenre){
      const first=state.genreOrder[0];
      if(!first){ showToast("ジャンルがありません"); return; }
      state.currentGenre=first;
    }
    showManageScreen(state.currentGenre);
  });
  els.manageBackBtn2?.addEventListener("click", ()=>showScreen("genreSelect"));
  // domRefs に未定義でも確実にバインドする保険
  document.getElementById("manageBackBtn2")?.addEventListener("click", ()=>showScreen("genreSelect"));

  els.genreManageBtn?.addEventListener("click", ()=>showGenreManage());

  /* ==== 戻り/再挑戦 ==== */
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

  /* ==== 結果画面 フラグ ==== */
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

<<<<<<< HEAD
  /* 管理画面操作（省略部は既存のまま） */
=======
  /* ==== 管理画面 ==== */
>>>>>>> parent of cbfbb8a (okoko)
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
  // 既存のフィルタボタン/Enterキー適用は廃止
  // els.applyFilterBtn?.addEventListener("click", ...)
  // els.clearFilterBtn?.addEventListener("click", ...)
  // els.tagFilterInput?.addEventListener("keydown", ...)

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

<<<<<<< HEAD
  /* ジャンル管理画面 */
=======
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
>>>>>>> parent of cbfbb8a (okoko)
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
  // ホームからの addQuestionBtn は削除済み。以下は管理画面などからの導線のみ有効。
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

/* 外部公開（他で再利用する開始関数） */
export { startQuizNormal, startQuizLowAcc, startQuizFlaggedOnly };