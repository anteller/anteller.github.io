/**
 * manage.js
 * - 管理系機能 (ジャンル/問題 CRUD, 一括操作, 出題数選択, エクスポート/インポート, 全データリセット)
 * - export function 方式で重複 export を排除
 * - resetAllData: 初期問題読み戻し対応 (defaultQuizzes + migrateQuizzes)
 */

import { state } from "../../../state.js";
import {
  MIN_CHOICES, MAX_CHOICES, DEFAULT_SETTINGS,
  STORAGE_KEY, GENRE_ORDER_KEY, SETTINGS_KEY, DATA_VERSION
} from "../../../constants.js";
import { els } from "../../../domRefs.js";
import {
  showScreen, showToast, shuffle, clone, createId,
  parseTags, buildGenreExportFileName, buildTagBadges
} from "../../../utils.js";
import {
  saveQuizzes, saveGenreOrder, saveSettings, migrateQuizzes
} from "../../../storage.js";
import { normalizeQuestion } from "../../../normalize.js";
import { recordUndo } from "../../../undo.js";
import { defaultQuizzes } from "../../../defaultQuizzes.js";

/* ========== 内部ユーティリティ ========== */
function rebuildGenreSelect(){
  if(!els.genreInput) return;
  els.genreInput.innerHTML="";
  state.genreOrder.forEach(g=>{
    if(!state.quizzes[g]) return;
    const opt=document.createElement("option");
    opt.value=g; opt.textContent=g;
    els.genreInput.appendChild(opt);
  });
}
function rebuildGenreFilterSelect(selectedValue){
  if(!els.genreFilterSelect) return;
  els.genreFilterSelect.innerHTML="";
  const optAll=document.createElement("option");
  optAll.value="__ALL__";
  optAll.textContent="(すべて)";
  els.genreFilterSelect.appendChild(optAll);
  state.genreOrder.forEach(g=>{
    if(!state.quizzes[g]) return;
    const o=document.createElement("option");
    o.value=g; o.textContent=`${g} (${state.quizzes[g].length})`;
    els.genreFilterSelect.appendChild(o);
  });
  if(selectedValue && [...els.genreFilterSelect.options].some(o=>o.value===selectedValue)){
    els.genreFilterSelect.value=selectedValue;
  } else {
    if(state.currentGenre && state.quizzes[state.currentGenre]){
      els.genreFilterSelect.value=state.currentGenre;
    } else {
      els.genreFilterSelect.value="__ALL__";
    }
  }
  updateManageActionButtons();
}
function updateManageActionButtons(){
  const allMode = els.genreFilterSelect && els.genreFilterSelect.value==="__ALL__";
  if(els.genreExportBtn) els.genreExportBtn.disabled=allMode;
  if(els.resetStatsBtn) els.resetStatsBtn.disabled=allMode;
}
function mkMiniBtn(label,act,id,genre,variant){
  const b=document.createElement("button");
  b.type="button";
  b.className="btn small"+(variant? " "+variant:"");
  if(variant==="danger") b.classList.add("danger");
  if(variant==="warn") b.classList.add("warn");
  b.textContent=label;
  b.dataset.act=act; b.dataset.id=id; b.dataset.genre=genre;
  return b;
}
function gBtn(label,act,g,disabled,variant){
  const b=document.createElement("button");
  b.type="button";
  b.className="btn small"+(variant? " "+variant:"");
  if(variant==="danger") b.classList.add("danger");
  b.textContent=label; b.dataset.act=act; b.dataset.g=g; b.disabled=!!disabled;
  return b;
}
function toggleFlag(genre,id){
  const arr=state.quizzes[genre];
  if(!arr) return;
  const q=arr.find(x=>x.id===id);
  if(!q) return;
  q.flagged=!q.flagged;
  saveQuizzes();
  return q.flagged;
}

/* 公開関数 */
export function rebuildGenreButtons(){
  if(!els.genreButtons) return;
  els.genreButtons.innerHTML="";
  const genres=state.genreOrder.filter(g=>state.quizzes[g]);
  if(!genres.length){
    const p=document.createElement("p");
    p.textContent="ジャンルがありません。追加してください。";
    els.genreButtons.appendChild(p);
  } else {
    genres.forEach(g=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="btn genre-btn";
      btn.textContent=`${g} (${state.quizzes[g].length})`;
      btn.addEventListener("click",e=>{
        e.preventDefault();
        state.currentGenre=g;
        showQuestionCountScreen(g);
      });
      btn.addEventListener("contextmenu",e=>{
        e.preventDefault();
        state.currentGenre=g;
        showManageScreen(g);
      });
      els.genreButtons.appendChild(btn);
    });
  }
  rebuildGenreSelect();
  rebuildGenreFilterSelect();
}

export function showQuestionCountScreen(genre){
  if(!state.quizzes[genre]){ showToast("ジャンルが存在しません"); return; }
  const total=state.quizzes[genre].length;
  const opts=state.settings.questionCountOptions;
  let display=[];
  opts.forEach(o=>{
    if(o==="all") display.push("all");
    else {
      const n=parseInt(o,10);
      if(!isNaN(n)&&n>0&&n<=total) display.push(String(n));
    }
  });
  if(!display.includes("all")) display.push("all");

  if(els.qCountButtons) els.qCountButtons.innerHTML="";
  if(els.qCountTitle) els.qCountTitle.textContent=`出題数を選択: ${genre}`;
  if(els.qCountInfo)  els.qCountInfo.textContent=`問題総数: ${total}`;

  display.forEach(val=>{
    if(!els.qCountButtons) return;
    if(val==="all"){
      const wrap=document.createElement("div");
      wrap.className="group";
      const normalBtn=document.createElement("button");
      normalBtn.type="button";
      normalBtn.className="btn small";
      normalBtn.textContent=`全て (${total})`;
      normalBtn.dataset.mode="normal";
      normalBtn.dataset.count="all";
      normalBtn.dataset.genre=genre;
      wrap.appendChild(normalBtn);
      const lbl=document.createElement("div");
      lbl.className="label"; lbl.textContent="(全問題)";
      wrap.appendChild(lbl);
      els.qCountButtons.appendChild(wrap);
    } else {
      const n=parseInt(val,10);
      const wrap=document.createElement("div");
      wrap.className="group";
      const normalBtn=document.createElement("button");
      normalBtn.type="button";
      normalBtn.className="btn small";
      normalBtn.textContent=`${n}問`;
      normalBtn.dataset.mode="normal";
      normalBtn.dataset.count=String(n);
      normalBtn.dataset.genre=genre;
      const lowBtn=document.createElement("button");
      lowBtn.type="button";
      lowBtn.className="btn small alt";
      lowBtn.textContent=`低正答率 ${n}問`;
      lowBtn.title="正答率が低い / 未回答を重みに応じ優先";
      lowBtn.dataset.mode="low";
      lowBtn.dataset.count=String(n);
      lowBtn.dataset.genre=genre;
      wrap.append(normalBtn,lowBtn);
      const lbl=document.createElement("div");
      lbl.className="label"; lbl.textContent="通常 / 低正答率";
      wrap.appendChild(lbl);
      els.qCountButtons.appendChild(wrap);
    }
  });

  const flaggedCount=(state.quizzes[genre]||[]).filter(q=>q.flagged).length;
  if(flaggedCount>0 && els.qCountButtons){
    const wrap=document.createElement("div");
    wrap.className="group";
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="btn small warn";
    btn.textContent=`要チェックのみ (${flaggedCount})`;
    btn.dataset.mode="flagged";
    btn.dataset.genre=genre;
    wrap.appendChild(btn);
    const lbl=document.createElement("div");
    lbl.className="label"; lbl.textContent="マーク問題";
    wrap.appendChild(lbl);
    els.qCountButtons.appendChild(wrap);
  }

  state.pendingGenreForCount=genre;
  showScreen("questionCountScreen");
}

export function showManageScreen(genre){
  if(!state.quizzes[genre]){ showToast("ジャンルが存在しません"); return; }
  state.currentGenre=genre;
  rebuildGenreFilterSelect(genre);
  state.selectedQuestionIds.clear();
  state.sortMode = (els.sortSelect && els.sortSelect.value)? els.sortSelect.value : "original";
  state.tagFilter="";
  if(els.tagFilterInput) els.tagFilterInput.value="";
  rebuildManageList();
  if(els.manageTitle) els.manageTitle.textContent=`問題管理 - ${genre} (全${state.quizzes[genre].length}問)`;
  updateBulkUI();
  showScreen("manageScreen");
}

export function rebuildManageList(){
  if(!els.manageListWrap) return;
  const filterVal=els.genreFilterSelect ? els.genreFilterSelect.value : state.currentGenre;
  let working=[];
  if(filterVal==="__ALL__"){
    state.genreOrder.forEach(g=>{
      (state.quizzes[g]||[]).forEach(q=>working.push({...q,__genre:g}));
    });
  } else {
    working=(state.quizzes[filterVal]||[]).map(q=>({...q,__genre:filterVal}));
  }

  let filtered=working;
  if(state.tagFilter){
    const tokens=state.tagFilter.trim().split(/[ 　]+/).filter(Boolean).map(s=>s.toLowerCase());
    if(tokens.length){
      filtered=filtered.filter(q=>{
        const hay=[];
        if(q.q) hay.push(q.q);
        if(Array.isArray(q.choices)) hay.push(...q.choices);
        if(Array.isArray(q.tags)) hay.push(...q.tags);
        const joined=hay.map(v=>String(v).toLowerCase()).join("\n");
        return tokens.every(tok=>joined.includes(tok));
      });
    }
  }
  if(state.manageFlaggedOnly){
    filtered=filtered.filter(q=>q.flagged);
  }
  filtered=filtered.slice();
  if(state.sortMode==="accdesc"||state.sortMode==="accasc"){
    filtered.sort((a,b)=>{
      const aa=a.stats&&a.stats.t>0? a.stats.c/a.stats.t:0;
      const bb=b.stats&&b.stats.t>0? b.stats.c/b.stats.t:0;
      return state.sortMode==="accdesc"? bb-aa : aa-bb;
    });
  } else if(state.sortMode==="countdesc"||state.sortMode==="countasc"){
    filtered.sort((a,b)=>{
      const at=a.stats? a.stats.t:0;
      const bt=b.stats? b.stats.t:0;
      return state.sortMode==="countdesc"? bt-at : at-bt;
    });
  }

  els.manageListWrap.innerHTML="";
  if(!filtered.length){
    const div=document.createElement("div");
    div.textContent="表示する問題がありません。";
    div.style.padding="10px";
    els.manageListWrap.appendChild(div);
    return;
  }

  const ul=document.createElement("ul");
  ul.className="question-list";
  filtered.forEach(q=>{
    const genreOfQ=q.__genre;
    const acc=(q.stats && q.stats.t>0)? (q.stats.c/q.stats.t*100):null;
    const accStr=acc===null? "-" : acc.toFixed(1)+"%";
    const countStr=q.stats? `${q.stats.c}/${q.stats.t}`:"0/0";
    const originalIndex = state.quizzes[genreOfQ]
      ? state.quizzes[genreOfQ].findIndex(x=>x.id===q.id)
      : -1;

    const li=document.createElement("li");
    li.className="question-item";

    const rowTop=document.createElement("div"); rowTop.className="q-row-top";
    const selCol=document.createElement("div"); selCol.className="select-col";
    const cb=document.createElement("input");
    cb.type="checkbox"; cb.className="q-select";
    cb.dataset.id=q.id; cb.dataset.genre=genreOfQ;
    const qMain=document.createElement("div");
    qMain.className="q-main"; qMain.textContent=q.q;
    selCol.append(cb,qMain);

    const statsBox=document.createElement("div");
    statsBox.style.textAlign="right";
    statsBox.style.minWidth="120px";
    statsBox.style.fontSize="11px";
    statsBox.style.color="var(--c-text-sub)";
    const accDiv=document.createElement("div"); accDiv.innerHTML=`正答率: <strong>${accStr}</strong>`;
    const cntDiv=document.createElement("div"); cntDiv.textContent=countStr;
    statsBox.append(accDiv,cntDiv);
    rowTop.append(selCol,statsBox);

    const meta=document.createElement("div"); meta.className="q-meta";
    if(filterVal==="__ALL__"){
      const gBadge=document.createElement("span");
      gBadge.className="badge-inline";
      gBadge.style.background="#6366f1";
      gBadge.textContent=genreOfQ;
      meta.appendChild(gBadge);
    }
    const metaBadge=document.createElement("span"); metaBadge.className="badge-inline"; metaBadge.textContent=`#${originalIndex+1}`;
    const metaChoices=document.createElement("span"); metaChoices.textContent=`選択肢: ${q.choices.length}`;
    const metaAns=document.createElement("span"); metaAns.textContent=`正解: ${q.answer+1}`;
    const metaExp=document.createElement("span"); metaExp.textContent=q.exp && q.exp.trim()!=="" ? "解説あり":"解説なし";
    if(!(q.exp && q.exp.trim()!=="")) metaExp.style.opacity=".6";
    const metaTags=document.createElement("span");
    if(q.tags?.length){
      metaTags.textContent="タグ: ";
      metaTags.append(buildTagBadges(q.tags));
    } else {
      metaTags.textContent="タグなし";
      metaTags.style.opacity=".6";
    }
    if(q.priorityFactor && Math.abs(q.priorityFactor-1)>0.001){
      const pfSpan=document.createElement("span");
      pfSpan.className="badge-inline";
      pfSpan.style.background="#f59e0b";
      pfSpan.textContent=`PF x${q.priorityFactor.toFixed(2)}`;
      meta.appendChild(pfSpan);
    }
    meta.append(metaBadge,metaChoices,metaAns,metaExp,metaTags);

    const actions=document.createElement("div"); actions.className="q-actions";
    const flagBtn=document.createElement("button");
    flagBtn.type="button";
    flagBtn.className="flag-btn"+(q.flagged?" active":"");
    flagBtn.dataset.id=q.id;
    flagBtn.dataset.genre=genreOfQ;
    flagBtn.title="要チェック切替";
    flagBtn.textContent=q.flagged? "★ 要チェック":"☆ 要チェック";

    const pfWrap=document.createElement("div");
    pfWrap.className="pf-actions";
    const upBtn=document.createElement("button");
    upBtn.type="button"; upBtn.className="btn small pf-up"; upBtn.textContent="↑出題率";
    upBtn.dataset.id=q.id; upBtn.dataset.genre=genreOfQ; upBtn.dataset.act="pf-up";
    const downBtn=document.createElement("button");
    downBtn.type="button"; downBtn.className="btn small pf-down"; downBtn.textContent="↓出題率";
    downBtn.dataset.id=q.id; downBtn.dataset.genre=genreOfQ; downBtn.dataset.act="pf-down";
    const pfBadge=document.createElement("span");
    pfBadge.className="pf-indicator-badge";
    pfBadge.textContent="x"+(q.priorityFactor? q.priorityFactor.toFixed(2):"1.00");
    pfBadge.dataset.id=q.id; pfBadge.dataset.genre=genreOfQ;
    pfWrap.append(upBtn,downBtn,pfBadge);

    actions.append(
      flagBtn,
      pfWrap,
      mkMiniBtn("編集","edit",q.id,genreOfQ),
      mkMiniBtn("複製","dup",q.id,genreOfQ,"warn"),
      mkMiniBtn("削除","del",q.id,genreOfQ,"danger")
    );

    li.append(rowTop,meta,actions);
    ul.appendChild(li);
  });
  els.manageListWrap.appendChild(ul);
}

export function onManageListClick(e){
  const flag=e.target.closest(".flag-btn");
  if(flag){
    const id=flag.dataset.id;
    const g=flag.dataset.genre;
    const newState=toggleFlag(g,id);
    flag.classList.toggle("active",newState);
    flag.textContent=newState? "★ 要チェック":"☆ 要チェック";
    return;
  }
  const pfUp=e.target.closest("button[data-act='pf-up']");
  const pfDown=e.target.closest("button[data-act='pf-down']");
  if(pfUp || pfDown){
    const id=(pfUp||pfDown).dataset.id;
    const g=(pfUp||pfDown).dataset.genre;
    const arr=state.quizzes[g];
    if(arr){
      const q=arr.find(x=>x.id===id);
      if(q){
        const mult=state.settings.priorityIncreaseMultiplier || 1.4;
        let pf=q.priorityFactor ?? 1;
        pf*= pfUp ? mult : 1/mult;
        if(pf<0.2) pf=0.2;
        if(pf>5) pf=5;
        q.priorityFactor=parseFloat(pf.toFixed(4));
        saveQuizzes();
        const badge=e.currentTarget.querySelector(`.pf-indicator-badge[data-id='${id}'][data-genre='${g}']`);
        if(badge) badge.textContent="x"+q.priorityFactor.toFixed(2);
        showToast("PF: x"+q.priorityFactor.toFixed(2));
      }
    }
    return;
  }
  const btn=e.target.closest("button[data-act]");
  if(btn){
    handleQuestionAction(btn.dataset.act, btn.dataset.id, btn.dataset.genre);
  }
}

export function handleManageCheckboxChange(e){
  if(e.target.classList.contains("q-select")){
    const id=e.target.dataset.id;
    const g=e.target.dataset.genre;
    const key=g+"|"+id;
    if(e.target.checked) state.selectedQuestionIds.add(key);
    else state.selectedQuestionIds.delete(key);
    updateBulkUI();
  }
}

export function updateBulkUI(){
  if(!els.bulkInfo) return;
  const count=state.selectedQuestionIds.size;
  els.bulkInfo.textContent=`${count}件選択`;
  if(els.bulkDeleteBtn) els.bulkDeleteBtn.disabled = count===0;
  if(els.bulkTagApplyBtn){
    els.bulkTagApplyBtn.disabled = (count===0 || !els.bulkTagInput?.value.trim());
  }
}

export function doBulkDelete(){ bulkDelete(); }

export function applyBulkTag(rawTags){
  const raw=rawTags || (els.bulkTagInput?.value.trim()||"");
  if(!raw){ showToast("タグ未入力"); return; }
  const tags=raw.split(",").map(t=>t.trim()).filter(t=>t!=="");
  if(!tags.length){ showToast("有効なタグなし"); return; }
  if(!state.selectedQuestionIds.size){ showToast("問題が選択されていません"); return; }
  let updated=0;
  state.selectedQuestionIds.forEach(key=>{
    const [g,id]=key.split("|");
    const arr=state.quizzes[g];
    if(!arr) return;
    const q=arr.find(x=>x.id===id);
    if(!q) return;
    if(!Array.isArray(q.tags)) q.tags=[];
    let changed=false;
    tags.forEach(t=>{
      if(!q.tags.includes(t)){ q.tags.push(t); changed=true; }
    });
    if(changed) updated++;
  });
  if(updated){
    saveQuizzes();
    showToast(`タグ付与: ${updated}件`);
    rebuildManageList();
  } else {
    showToast("更新なし");
  }
}

export function moveGenre(g,dir){
  const idx=state.genreOrder.indexOf(g); if(idx===-1) return;
  const n=idx+dir; if(n<0||n>=state.genreOrder.length) return;
  [state.genreOrder[idx],state.genreOrder[n]]=[state.genreOrder[n],state.genreOrder[idx]];
  saveGenreOrder();
  rebuildGenreButtons();
  rebuildManageList();
  rebuildGenreFilterSelect(els.genreFilterSelect?.value);
}

export function deleteGenre(g){
  if(!confirm(`ジャンル「${g}」を削除しますか？（問題も削除）`)) return;
  const questionsClone=clone(state.quizzes[g]||[]);
  const idx=state.genreOrder.indexOf(g);
  delete state.quizzes[g];
  state.genreOrder=state.genreOrder.filter(x=>x!==g);
  saveQuizzes(); saveGenreOrder();
  rebuildGenreButtons(); buildGenreManageList();
  showToast(`ジャンル「${g}」削除`);
  recordUndo({
    type:"genre-delete",
    genre:g,
    questions:questionsClone,
    genreIndex:idx
  });
}

export function renameGenre(oldName){
  const currentNames=new Set(Object.keys(state.quizzes).filter(k=>!k.startsWith("__")));
  const input=prompt(`新しい名称を入力 (現在: ${oldName})`);
  if(input===null) return;
  const newName=input.trim();
  if(!newName){ showToast("空の名称は不可"); return; }
  if(newName===oldName){ showToast("変更なし"); return; }
  if(currentNames.has(newName)){ showToast("同名ジャンルあり"); return; }
  state.quizzes[newName]=state.quizzes[oldName];
  delete state.quizzes[oldName];
  state.genreOrder=state.genreOrder.map(g=>g===oldName? newName:g);
  if(state.currentGenre===oldName) state.currentGenre=newName;
  saveQuizzes(); saveGenreOrder();
  rebuildGenreButtons(); buildGenreManageList();
  showToast("名称を変更しました");
}

export function showGenreManage(){
  buildGenreManageList();
  showScreen("genreManageScreen");
}

export function buildGenreManageList(){
  if(!els.genreManageList) return;
  els.genreManageList.innerHTML="";
  state.genreOrder.forEach((g,i)=>{
    if(!state.quizzes[g]) return;
    const li=document.createElement("li");
    li.className="genre-item";
    const nameDiv=document.createElement("div");
    nameDiv.className="genre-name";
    nameDiv.textContent=g+" ";
    const countSpan=document.createElement("span");
    countSpan.style.fontSize="11px";
    countSpan.style.color="var(--c-text-sub)";
    countSpan.textContent=`(${state.quizzes[g].length}問)`;
    nameDiv.appendChild(countSpan);
    const actions=document.createElement("div");
    actions.className="genre-actions";
    actions.append(
      gBtn("上","up",g,i===0),
      gBtn("下","down",g,i===state.genreOrder.length-1),
      gBtn("名称変更","rename",g,false),
      gBtn("問題管理","manage",g,false),
      gBtn("削除","del",g,false,"danger")
    );
    li.append(nameDiv,actions);
    els.genreManageList.appendChild(li);
  });
}

export function resetGenreStats(){
  const filterVal=els.genreFilterSelect ? els.genreFilterSelect.value : state.currentGenre;
  if(filterVal==="__ALL__"){ showToast("「(すべて)」表示中はリセットできません"); return; }
  const g=filterVal;
  if(!g || !state.quizzes[g]){ showToast("ジャンル未選択"); return; }
  if(!state.quizzes[g].length){ showToast("問題がありません"); return; }
  if(!confirm(`ジャンル「${g}」の全問題の正答率(統計)をリセットしますか？`)) return;

  const prevStats=state.quizzes[g].map(q=>({id:q.id,c:q.stats? q.stats.c:0,t:q.stats? q.stats.t:0}));
  state.quizzes[g].forEach(q=>{
    if(q.stats){ q.stats.c=0; q.stats.t=0; } else q.stats={c:0,t:0};
  });
  saveQuizzes();
  rebuildManageList();
  showToast("統計をリセットしました");
  recordUndo({ type:"stats-reset", genre:g, prevStats });
}

/**
 * 全データリセット (初期問題再投入)
 * - 2段階確認
 */
export function resetAllData(){
  if(!confirm("全データ（問題・ジャンル・統計・設定）を初期化しますか？")) return;
  if(!confirm("本当に初期化しますか？（元に戻せません）")) return;

  try{ localStorage.removeItem(STORAGE_KEY); }catch{}
  try{ localStorage.removeItem(GENRE_ORDER_KEY); }catch{}
  try{ localStorage.removeItem(SETTINGS_KEY); }catch{}

  const fresh = migrateQuizzes(clone(defaultQuizzes));
  state.quizzes = fresh;
  state.genreOrder = Object.keys(fresh).filter(k=>!k.startsWith("__"));
  state.settings = { ...DEFAULT_SETTINGS };
  saveSettings();
  saveQuizzes();
  saveGenreOrder();

  state.currentGenre=null;
  state.questions=[];
  state.currentIndex=0;
  state.correctCount=0;
  state.wrongQuestions=[];
  state.correctQuestions=[];
  state.selectedQuestionIds.clear();
  state.lastUndo=null;
  state.lastSession={ genre:null, limit:null, lowAccuracy:false, flaggedOnly:false };
  state.isEditingQuestion=false;
  state.editingIndex=-1;

  rebuildGenreButtons();
  showScreen("genreSelect");
  showToast("初期化しました（初期問題を再読込）");
}

export function exportCurrentGenre(){
  const filterVal=els.genreFilterSelect ? els.genreFilterSelect.value : state.currentGenre;
  if(filterVal==="__ALL__"){ showToast("「(すべて)」表示中はエクスポート不可"); return; }
  const g=filterVal;
  if(!g || !state.quizzes[g]){ showToast("ジャンル不明"); return; }
  const data={__version:DATA_VERSION, genre:g, questions:clone(state.quizzes[g])};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const filename=buildGenreExportFileName(g);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },0);
  showToast("エクスポートしました");
}

export function importGenreFromFile(file){
  const reader=new FileReader();
  reader.onerror=()=>showToast("読み込み失敗");
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      const filterVal=els.genreFilterSelect ? els.genreFilterSelect.value : state.currentGenre;
      if(filterVal==="__ALL__"){ showToast("「(すべて)」表示中はインポート先不明"); return; }
      const current=filterVal;
      if(!current){ showToast("ジャンル未選択"); return; }
      let questions=null;
      if(parsed && typeof parsed==="object" && Array.isArray(parsed.questions) && typeof parsed.genre==="string"){
        if(parsed.genre!==current){
          if(!confirm(`ファイル内ジャンル (${parsed.genre}) を現在の「${current}」へ取り込みますか？`)) return;
        }
        questions=parsed.questions;
      } else if(parsed && typeof parsed==="object" && Array.isArray(parsed[current])){
        questions=parsed[current];
      }
      if(!Array.isArray(questions) || !questions.length){
        showToast("有効な問題配列なし");
        return;
      }
      const normalized=questions.map(q=>normalizeQuestion(q));
      const existIds=new Set(state.quizzes[current].map(q=>q.id));
      normalized.forEach(q=>{ if(existIds.has(q.id)) q.id=createId(); });
      if(confirm("インポート: OK=置換 / キャンセル=追加")){
        state.quizzes[current]=normalized;
        showToast("インポート(置換) 完了");
      } else {
        state.quizzes[current].push(...normalized);
        showToast("インポート(追加) 完了");
      }
      saveQuizzes(); rebuildGenreButtons(); rebuildManageList();
    }catch(e){
      console.error(e);
      showToast("インポート失敗");
    }
  };
  reader.readAsText(file,"utf-8");
}

/* ========== 追加 / 編集フォーム関連 ========== */
function renumberChoiceRows(){
  if(!els.choicesEditArea) return;
  [...els.choicesEditArea.querySelectorAll(".choice-editor-row")].forEach((r,i)=>{
    const radio=r.querySelector('input[type="radio"]'); if(radio) radio.value=i;
    const txt=r.querySelector(".choiceText"); if(txt) txt.placeholder=`選択肢 ${i+1}`;
  });
}
function updateRemoveButtonsState(){
  if(!els.choicesEditArea) return;
  const rows=[...els.choicesEditArea.querySelectorAll(".choice-editor-row")];
  const disable=rows.length<=MIN_CHOICES;
  rows.forEach(r=>{
    const b=r.querySelector(".remove-choice-btn");
    if(b){
      b.disabled=disable;
      b.style.opacity=disable?".5":"1";
    }
  });
}
function collectNewQuestion(){
  const genre=els.genreInput?.value.trim();
  const qText=els.questionInput?.value.trim();
  if(!els.choicesEditArea) return null;
  const rows=[...els.choicesEditArea.querySelectorAll(".choice-editor-row")];
  const choices=[];
  rows.forEach(r=>{
    const v=r.querySelector(".choiceText")?.value.trim();
    if(v!=="") choices.push(v);
  });
  if(choices.length<MIN_CHOICES){ showToast(`選択肢は最低${MIN_CHOICES}`); return null; }
  const radios=[...els.choicesEditArea.querySelectorAll('input[name="correctAnswer"]')];
  const checked=radios.find(r=>r.checked);
  let answer=checked? +checked.value:0;
  if(answer<0 || answer>=choices.length) answer=0;
  const exp=els.explanationInput?.value.trim() || "";
  const tags=parseTags(els.tagsInput?.value);
  if(!genre || !qText){ showToast("ジャンル/問題文未入力"); return null; }
  return {genre,question:qText,choices,answer,exp,tags};
}

export function initChoiceEditors(){
  if(!els.choicesEditArea) return;
  els.choicesEditArea.innerHTML="";
  addChoiceInput("",true);
  addChoiceInput("",false);
  updateRemoveButtonsState();
}
export function addChoiceInput(value="",first=false){
  if(!els.choicesEditArea) return;
  const current=els.choicesEditArea.querySelectorAll(".choice-editor-row").length;
  if(current>=MAX_CHOICES){ showToast("最大です"); return; }
  const row=document.createElement("div");
  row.className="choice-editor-row";
  const radioWrap=document.createElement("div"); radioWrap.className="radio-wrap";
  const radio=document.createElement("input");
  radio.type="radio"; radio.name="correctAnswer"; radio.value=String(current);
  if(first) radio.checked=true;
  const span=document.createElement("span"); span.textContent="正解";
  radioWrap.append(radio,span);
  const input=document.createElement("input");
  input.type="text"; input.className="choiceText";
  input.placeholder=`選択肢 ${current+1}`; input.required=true; input.value=value;
  const del=document.createElement("button");
  del.type="button"; del.className="remove-choice-btn"; del.textContent="削除";
  del.addEventListener("click",()=>removeChoiceRow(row));
  row.append(radioWrap,input,del);
  els.choicesEditArea.appendChild(row);
  renumberChoiceRows();
  updateRemoveButtonsState();
}
export function removeChoiceRow(row){
  if(!els.choicesEditArea) return;
  const rows=els.choicesEditArea.querySelectorAll(".choice-editor-row");
  if(rows.length<=MIN_CHOICES){ showToast(`最低${MIN_CHOICES}`); return; }
  const was=row.querySelector('input[type="radio"]')?.checked;
  row.remove();
  renumberChoiceRows();
  if(was){
    const first=els.choicesEditArea.querySelector('input[type="radio"]');
    if(first) first.checked=true;
  }
  updateRemoveButtonsState();
}
export function clearAddForm(){
  state.isEditingQuestion=false; state.editingIndex=-1;
  if(els.addEditTitle) els.addEditTitle.textContent="新しい問題を追加";
  if(els.addFormButtons) els.addFormButtons.style.display="flex";
  if(els.editFormButtons) els.editFormButtons.style.display="none";
  if(els.genreInput) els.genreInput.disabled=false;
  if(els.questionInput) els.questionInput.value="";
  if(els.explanationInput) els.explanationInput.value="";
  if(els.tagsInput) els.tagsInput.value="";
  initChoiceEditors();
}
export function populateEditForm(genre,index){
  const arr=state.quizzes[genre];
  if(!arr || !arr[index]) return;
  const q=arr[index];
  state.isEditingQuestion=true; state.editingIndex=index;
  if(els.addEditTitle) els.addEditTitle.textContent=`問題を編集 (No.${index+1})`;
  if(els.addFormButtons) els.addFormButtons.style.display="none";
  if(els.editFormButtons) els.editFormButtons.style.display="flex";
  if(els.genreInput){
    els.genreInput.value=genre;
    els.genreInput.disabled=true;
  }
  if(els.questionInput) els.questionInput.value=q.q;
  if(els.explanationInput) els.explanationInput.value=q.exp||"";
  if(els.tagsInput) els.tagsInput.value=q.tags? q.tags.join(","):"";
  if(els.choicesEditArea){
    els.choicesEditArea.innerHTML="";
    q.choices.forEach((c,i)=>addChoiceInput(c,i===q.answer));
    updateRemoveButtonsState();
  }
  showScreen("addScreen");
}
export function handleAddQuestion(stay=false){
  const data=collectNewQuestion();
  if(!data) return;
  if(!state.quizzes[data.genre]) state.quizzes[data.genre]=[];
  state.quizzes[data.genre].push({
    id:createId(),
    q:data.question,
    choices:data.choices,
    answer:data.answer,
    exp:data.exp,
    tags:data.tags,
    stats:{c:0,t:0},
    flagged:false,
    priorityFactor:1
  });
  saveQuizzes();
  showToast("追加しました");
  rebuildGenreButtons();
  if(stay){
    if(els.questionInput) els.questionInput.focus();
    initChoiceEditors();
    if(els.questionInput) els.questionInput.value="";
    if(els.explanationInput) els.explanationInput.value="";
    if(els.tagsInput) els.tagsInput.value="";
  } else {
    clearAddForm();
    showScreen("genreSelect");
  }
}
export function handleSaveEdit(){
  if(!state.isEditingQuestion || state.editingIndex<0) return;
  const data=collectNewQuestion();
  if(!data) return;
  const genre=state.currentGenre;
  const arr=state.quizzes[genre];
  const old=arr[state.editingIndex];
  let ans=data.answer;
  if(ans<0 || ans>=data.choices.length) ans=0;
  arr[state.editingIndex]={...old,q:data.question,choices:data.choices,answer:ans,exp:data.exp,tags:data.tags};
  saveQuizzes();
  showToast("更新しました");
  clearAddForm();
  showManageScreen(genre);
}
export function cancelEdit(){
  if(confirm("編集をキャンセルしますか？")){
    clearAddForm();
    showManageScreen(state.currentGenre);
  }
}
export function showAddScreen(prefill){
  clearAddForm();
  if(prefill && state.quizzes[prefill] && els.genreInput) els.genreInput.value=prefill;
  showScreen("addScreen");
  if(els.questionInput) els.questionInput.focus();
}

/* ========== 内部: 個別アクション ========== */
function handleQuestionAction(act,id,genre){
  const arr=state.quizzes[genre];
  if(!arr) return;
  const idx=arr.findIndex(q=>q.id===id);
  if(idx===-1) return;
  switch(act){
    case "edit":
      populateEditForm(genre,idx);
      break;
    case "del":
      if(confirm("この問題を削除しますか？")){
        const deleted=[{index:idx,question:clone(arr[idx])}];
        arr.splice(idx,1);
        saveQuizzes();
        rebuildGenreButtons();
        rebuildManageList();
        updateBulkUI();
        recordUndo({ type:"question-delete", genre, items:deleted });
      }
      break;
    case "dup":
      const copy=clone(arr[idx]);
      copy.id=createId(); copy.stats={c:0,t:0};
      arr.splice(idx+1,0,copy);
      saveQuizzes();
      rebuildManageList();
      rebuildGenreButtons();
      showToast("複製しました");
      break;
  }
}
function bulkDelete(){
  if(!state.selectedQuestionIds.size) return;
  if(!confirm(`${state.selectedQuestionIds.size}件の問題を削除しますか？`)) return;
  const grouped=new Map();
  state.selectedQuestionIds.forEach(key=>{
    const [g,id]=key.split("|");
    const arr=state.quizzes[g];
    if(!arr) return;
    const idx=arr.findIndex(q=>q.id===id);
    if(idx>-1){
      if(!grouped.has(g)) grouped.set(g,[]);
      grouped.get(g).push({index:idx,question:clone(arr[idx])});
    }
  });
  grouped.forEach((list,g)=>{
    const arr=state.quizzes[g];
    list.sort((a,b)=>b.index-a.index).forEach(item=>{
      arr.splice(item.index,1);
    });
  });
  saveQuizzes();
  state.selectedQuestionIds.clear();
  rebuildGenreButtons();
  rebuildManageList();
  updateBulkUI();
  const undoItems=[];
  grouped.forEach((list,g)=>{
    list.forEach(i=>undoItems.push({genre:g,index:i.index,question:i.question}));
  });
  recordUndo({
    type:"question-delete",
    genre:"(複数)",
    items: undoItems.map(x=>({index:x.index,question:x.question,genre:x.genre}))
  });
}