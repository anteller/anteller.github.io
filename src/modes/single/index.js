// 択一モード
// Phase 0: 循環参照を避けるため、ルートの集約モジュールではなく core を直接参照する。

import { STORAGE_KEY_SINGLE, SETTINGS_KEY } from "../../constants.js";
import * as quizUI from "./core/quizUI.js";
import * as session from "./core/session.js";
import * as manage from "./core/manage.js";
import ui from "./ui.js";

const SingleMode = {
  id: "single",
  title: "択一",
  icon: "🅂",
  storageKeys: {
    quizzesKey: STORAGE_KEY_SINGLE,
    settingsKey: SETTINGS_KEY
  },
  // engine: 出題の開始など（既存 session へ委譲）
  engine: {
    // 既存の startQuizMode(g, opts) をラップ（Phase 2 で統一化）
    start(genre, opts){
      return session.startQuizMode(genre, opts);
    }
  },
  // ui: 出題の表示・回答処理（既存 quizUI へ委譲）
  ui: {
    ...ui,
    // 互換: 旧呼び出し名
    renderQuestion: quizUI.renderQuestion,
    handleAnswer: quizUI.handleAnswer,
    handleDontKnow: quizUI.handleDontKnow,
    nextQuestionManual: quizUI.nextQuestionManual,
    toggleFlag: quizUI.toggleFlag,
    updateFlagButtonForCurrent: quizUI.updateFlagButtonForCurrent,
    adjustPriorityFactor: quizUI.adjustPriorityFactor
  },
  // manage: 既存の管理画面ロジックを当面そのまま流用
  manage: {
    // 必要に応じて必要な関数を増やす
    ...manage
  }
};

export default SingleMode;
