/**
 * multiple モード用エディタ
 * - 正解チェックを複数可
 * - 各選択肢に削除ボタンを追加
 * - 「選択肢を追加」も呼び出せる addMultipleChoiceRow を公開
 */

function renumberRows(area){
  [...area.querySelectorAll(".choice-editor-row")].forEach((r,i)=>{
    const txt=r.querySelector(".choiceText");
    if(txt) txt.placeholder=`選択肢 ${i+1}`;
    const cb=r.querySelector('input[type="checkbox"]');
    if(cb) cb.value=String(i);
  });
}

function removeRow(area, row){
  row.remove();
  renumberRows(area);
}

export function addMultipleChoiceRow(choicesEditArea, value="", checked=false){
  if(!choicesEditArea) return;
  const i = choicesEditArea.querySelectorAll(".choice-editor-row").length;

  const row = document.createElement("div");
  row.className="choice-editor-row";

  const checkWrap = document.createElement("label");
  checkWrap.className="radio-wrap";
  const cb = document.createElement("input");
  cb.type="checkbox";
  cb.value=String(i);
  cb.checked = checked;
  const span = document.createElement("span");
  span.textContent="正解";
  checkWrap.append(cb,span);

  const input = document.createElement("input");
  input.type="text";
  input.className="choiceText";
  input.value=value;
  input.placeholder=`選択肢 ${i+1}`;

  const del=document.createElement("button");
  del.type="button";
  del.className="remove-choice-btn";
  del.textContent="削除";
  del.addEventListener("click", ()=>removeRow(choicesEditArea, row));

  row.append(checkWrap,input,del);
  choicesEditArea.appendChild(row);
  renumberRows(choicesEditArea);
}

export function buildMultipleEditor(choicesEditArea, questionObj){
  if(!choicesEditArea) return;
  choicesEditArea.innerHTML="";

  const choices = questionObj?.choices || ["選択肢1","選択肢2"];
  const correct = new Set(questionObj?.correctIndexes || [0]);

  choices.forEach((c,i)=>{
    addMultipleChoiceRow(choicesEditArea, c, correct.has(i));
  });
}

export function readMultipleEditor(choicesEditArea){
  if(!choicesEditArea) return { choices:[], correctIndexes:[] };
  const rows=[...choicesEditArea.querySelectorAll(".choice-editor-row")];
  const choices=[];
  const correctIndexes=[];
  rows.forEach((r,i)=>{
    const txt = r.querySelector(".choiceText")?.value.trim();
    if(txt) choices.push(txt);
    const cb = r.querySelector("input[type=checkbox]");
    if(cb?.checked) correctIndexes.push(i);
  });
  if(!correctIndexes.length && choices.length) correctIndexes.push(0);
  return { choices, correctIndexes };
}

export default {
  addMultipleChoiceRow,
  buildMultipleEditor,
  readMultipleEditor
};