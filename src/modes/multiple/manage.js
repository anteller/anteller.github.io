/**
 * multiple モード用エディタ差し替え関数
 * - single のエディタを拡張し、正解チェックを複数可にする
 * - 既存 manage から呼び出される想定で、オーバーライド用の API を提供
 */

export function buildMultipleEditor(choicesEditArea, questionObj){
  if(!choicesEditArea) return;
  choicesEditArea.innerHTML="";

  const choices = questionObj?.choices || ["選択肢1","選択肢2"];
  const correctIndexes = new Set(questionObj?.correctIndexes || [0]);

  choices.forEach((c,i)=>{
    const row = document.createElement("div");
    row.className="choice-editor-row";
    const checkWrap = document.createElement("label");
    checkWrap.className="radio-wrap";
    const cb = document.createElement("input");
    cb.type="checkbox";
    cb.value=String(i);
    cb.checked = correctIndexes.has(i);
    const span = document.createElement("span");
    span.textContent="正解";
    checkWrap.append(cb,span);

    const input = document.createElement("input");
    input.type="text";
    input.className="choiceText";
    input.value=c;
    input.placeholder=`選択肢 ${i+1}`;

    row.append(checkWrap,input);
    choicesEditArea.appendChild(row);
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
  buildMultipleEditor,
  readMultipleEditor
};