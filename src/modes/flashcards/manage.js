/**
 * flashcards モード用の編集 UI 補助
 * - front/back を編集
 */

export function buildFlashcardEditor(container, card){
  if(!container) return;
  container.innerHTML="";

  const frontRow = document.createElement("div");
  frontRow.className="choice-editor-row";
  const frontInput = document.createElement("input");
  frontInput.type="text";
  frontInput.className="fc-front";
  frontInput.placeholder="表 (front)";
  frontInput.value = card?.front || "";
  frontRow.append(frontInput);

  const backRow = document.createElement("div");
  backRow.className="choice-editor-row";
  const backInput = document.createElement("input");
  backInput.type="text";
  backInput.className="fc-back";
  backInput.placeholder="裏 (back)";
  backInput.value = card?.back || "";
  backRow.append(backInput);

  container.append(frontRow, backRow);
}

export function readFlashcardEditor(container){
  if(!container) return { front:"", back:"" };
  const front = container.querySelector(".fc-front")?.value.trim() || "";
  const back  = container.querySelector(".fc-back")?.value.trim() || "";
  return { front, back };
}

export default {
  buildFlashcardEditor,
  readFlashcardEditor
};