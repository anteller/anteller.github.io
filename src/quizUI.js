import { state } from "./state.js";
import * as singleUI from "./modes/single/core/quizUI.js";
import multipleUI from "./modes/multiple/ui.js";
import flashUI from "./modes/flashcards/ui.js";

// モードに応じて描画を委譲
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
  // single 既存処理へ
  return singleUI.renderQuestion();
}

// single の他APIは既存実装をそのまま re-export
export * from "./modes/single/core/quizUI.js";