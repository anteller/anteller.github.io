import { state } from "./state.js";
import multipleUI from "./modes/multiple/ui.js";
import flashUI from "./modes/flashcards/ui.js";

// 既存 renderQuestion をラップ
export function renderQuestion(){
  const session = state.activeSession;
  if(session){
    if(session.mode === "multiple"){
      multipleUI.renderQuestionMultiple(session);
      return;
    }
    if(session.mode === "flashcards"){
      flashUI.renderFlashcard(session);
      return;
    }
  }
  // single 既存処理は下に元々ある想定
  return renderQuestionSingle();
}

// 以下は元々 single の実装だった部分 (例: renderQuestionSingle, handleAnswer 等)
// 元ファイル末尾などで export { renderQuestion } が既にあればそのまま。
export * from "./modes/single/core/quizUI.js";