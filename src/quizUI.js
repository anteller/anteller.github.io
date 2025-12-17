import { state } from "./state.js";
import * as singleCore from "./modes/single/core/quizUI.js";

// Phase 0: モードモジュール(ui.render) を優先し、無ければ single へフォールバック
export function renderQuestion(){
  const session = state.activeSession;
  const modeUI = state.currentModeModule?.ui;
  if(modeUI && typeof modeUI.render === "function"){
    return modeUI.render(session);
  }
  return singleCore.renderQuestion();
}

// single の他APIは既存実装をそのまま re-export
export * from "./modes/single/core/quizUI.js";