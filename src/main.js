"use strict";

// ***** インポート *****
import { state } from "./state.js";
import { safeLoadQuizzes, loadSettings, loadGenreOrder } from "./storage.js";
import { applyTheme, showScreen } from "./utils.js";
import { rebuildGenreButtons } from "./manage.js";
import { bindEvents } from "./events.js";
import { setupGenreMenu } from "./genreMenu.js"; // 追加: ジャンルカードの三点メニュー設定

// ***** 初期化 *****
function init(){
  state.quizzes = safeLoadQuizzes();
  loadSettings();
  loadGenreOrder();
  rebuildGenreButtons();
  setupGenreMenu(); // 追加: ジャンルカードへメニューボタン注入＋監視
  applyTheme();
  showScreen("genreSelect");
  // ここで他の初期フォーム（追加画面など）の初期化が必要なら呼び出し
  bindEvents();
}

init();

// デバッグ用
window.__QUIZ_STATE__ = state;