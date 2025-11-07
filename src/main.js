"use strict";

// ***** インポート *****
import { state } from "./state.js";
import { safeLoadQuizzes, loadSettings, loadGenreOrder } from "./storage.js";
import { applyTheme, showScreen } from "./utils.js";
import { rebuildGenreButtons } from "./manage.js";
import { bindEvents } from "./events.js";
import { setupGenreMenu } from "./genreMenu.js"; // 三点メニュー
// ***** モバイルOS判定 *****
function isMobileOS(){
  const ua = navigator.userAgent.toLowerCase();
  return /android/.test(ua) || /iphone|ipad|ipod/.test(ua);
}

// ***** 初期化 *****
function init(){
  if(isMobileOS()){
    document.body.classList.add("is-mobile-os");
  }
  state.quizzes = safeLoadQuizzes();
  loadSettings();
  loadGenreOrder();
  rebuildGenreButtons();
  setupGenreMenu();
  applyTheme();
  showScreen("genreSelect");
  bindEvents();
}

init();

// デバッグ用
window.__QUIZ_STATE__ = state;
