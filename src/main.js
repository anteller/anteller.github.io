"use strict";

// ***** インポート *****
import { state } from "./state.js";
import { safeLoadQuizzes, loadSettings, loadGenreOrder } from "./storage.js";
import { applyTheme, showScreen } from "./utils.js";
import { rebuildGenreButtons } from "./manage.js";
import { bindEvents } from "./events.js";

// ***** 初期化 *****
function init(){
  state.quizzes = safeLoadQuizzes();
  loadSettings();
  loadGenreOrder();
  rebuildGenreButtons();
  applyTheme();
  showScreen("genreSelect");
  // ここで他の初期フォーム（追加画面など）の初期化が必要なら呼び出し
  bindEvents();
}

init();

// デバッグ用
window.__QUIZ_STATE__ = state;