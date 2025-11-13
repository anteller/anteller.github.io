import { state } from "./state.js";
import * as singleUI from "./modes/single/core/quizUI.js";
import multipleUI from "./modes/multiple/ui.js";
import flashUI from "./modes/flashcards/ui.js";

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
  singleUI.renderQuestion();
}

// 以下 single のエクスポート維持
export * from "./modes/single/core/quizUI.js";