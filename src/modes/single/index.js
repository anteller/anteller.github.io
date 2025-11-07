// 現行「択一」モードのラッパー（Phase 1）
// まだ既存ファイルの場所は動かさず、既存モジュールへ委譲します。
// Phase 1-2 で quizUI.js / session.js を ./ に移動し、旧パスは再エクスポートのシムに切替予定。

import { STORAGE_KEY, SETTINGS_KEY } from "../../constants.js";
import * as quizUI from "../../quizUI.js";      // 既存
import * as session from "../../session.js";    // 既存
import * as manage from "../../manage.js";      // 既存（管理機能も当面は共通を利用）

const SingleMode = {
  id: "single",
  title: "択一",
  icon: "🅂",
  storageKeys: {
    quizzesKey: STORAGE_KEY,
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
    renderQuestion: quizUI.renderQuestion,
    handleAnswer: quizUI.handleAnswer,
    handleDontKnow: quizUI.handleDontKnow,
    nextQuestionManual: quizUI.nextQuestionManual,
    toggleFlag: quizUI.toggleFlag,
    updateFlagButtonForCurrent: quizUI.updateFlagButtonForCurrent,
    // 低正答率の係数調整も単一モードでは活用
    adjustPriorityFactor: quizUI.adjustPriorityFactor
  },
  // manage: 既存の管理画面ロジックを当面そのまま流用
  manage: {
    // 必要に応じて必要な関数を増やす
    ...manage
  }
};

export default SingleMode;