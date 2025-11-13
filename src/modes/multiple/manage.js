import multipleManage from "../../multiple/manage.js";
import flashManage from "../../flashcards/manage.js";

// initChoiceEditors
export function initChoiceEditors(){
  if(!els.choicesEditArea) return;
  if(state.appMode === "multiple"){
    els.choicesEditArea.innerHTML="";
    multipleManage.buildMultipleEditor(els.choicesEditArea,null);
    return;
  }
  if(state.appMode === "flashcards"){
    els.choicesEditArea.innerHTML="";
    flashManage.buildFlashcardEditor(els.choicesEditArea,null);
    return;
  }
  els.choicesEditArea.innerHTML="";
  addChoiceInput("",true);
  addChoiceInput("",false);
  updateRemoveButtonsState();
}

// collectNewQuestion
function collectNewQuestion(){
  const genre=els.genreInput?.value.trim();

  if(state.appMode === "flashcards"){
    const front = els.choicesEditArea?.querySelector(".fc-front")?.value.trim() || "";
    const back  = els.choicesEditArea?.querySelector(".fc-back")?.value.trim() || "";
    const exp   = els.explanationInput?.value.trim() || "";
    const tags  = parseTags(els.tagsInput?.value);
    if(!genre || !front || !back){ showToast("ジャンル/表/裏 未入力"); return null; }
    return { mode:"flashcards", genre, front, back, exp, tags };
  }

  if(state.appMode === "multiple"){
    const { choices, correctIndexes } = multipleManage.readMultipleEditor(els.choicesEditArea);
    const qText = els.questionInput?.value.trim();
    const exp   = els.explanationInput?.value.trim() || "";
    const tags  = parseTags(els.tagsInput?.value);
    if(!genre || !qText){ showToast("ジャンル/問題文未入力"); return null; }
    if(choices.length < 2){ showToast("選択肢は最低2"); return null; }
    if(!correctIndexes.length){ showToast("正解を1つ以上選んでください"); return null; }
    return { mode:"multiple", genre, question:qText, choices, correctIndexes, exp, tags };
  }

  // single
  const qText=els.questionInput?.value.trim();
  if(!els.choicesEditArea) return null;
  const rows=[...els.choicesEditArea.querySelectorAll(".choice-editor-row")];
  const choices=[];
  rows.forEach(r=>{
    const v=r.querySelector(".choiceText")?.value.trim();
    if(v!=="") choices.push(v);
  });
  if(choices.length<2){ showToast(`選択肢は最低2`); return null; }
  const radios=[...els.choicesEditArea.querySelectorAll('input[name="correctAnswer"]')];
  const checked=radios.find(r=>r.checked);
  let answer=checked? +checked.value:0;
  if(answer<0 || answer>=choices.length) answer=0;
  const exp=els.explanationInput?.value.trim() || "";
  const tags=parseTags(els.tagsInput?.value);
  if(!genre || !qText){ showToast("ジャンル/問題文未入力"); return null; }
  return { mode:"single", genre, question:qText, choices, answer, exp, tags };
}

// populateEditForm（差し替え）
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

  if(els.questionInput) els.questionInput.value = q.q || q.front || "";
  if(els.explanationInput) els.explanationInput.value = q.exp || "";
  if(els.tagsInput) els.tagsInput.value = q.tags? q.tags.join(",") : "";

  if(els.choicesEditArea){
    els.choicesEditArea.innerHTML="";
    if(state.appMode === "multiple" && Array.isArray(q.choices)){
      multipleManage.buildMultipleEditor(els.choicesEditArea, q);
    } else if(state.appMode === "flashcards" && typeof q.front === "string"){
      flashManage.buildFlashcardEditor(els.choicesEditArea, q);
    } else {
      (q.choices || []).forEach((c,i)=>addChoiceInput(c,i===q.answer));
      updateRemoveButtonsState();
    }
  }
  showScreen("addScreen");
}