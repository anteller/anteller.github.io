"use strict";

import { state } from "./state.js";
import { safeLoadQuizzes, loadSettings, loadGenreOrder } from "./storage.js";
import { applyTheme, showScreen } from "./utils.js";
import { rebuildGenreButtons } from "./manage.js";
import { bindEvents } from "./events.js";
import { setupGenreMenu } from "./genreMenu.js";
import { loadMode, DEFAULT_MODE_ID } from "./modes/registry.js";
import { migrateIfNeeded } from "./migrate.js";

async function init() {
  // 1) 設定復元（先に settings を読んでおく）
  loadSettings();
  state.appMode = state.settings.appMode || DEFAULT_MODE_ID;

  // 2) 旧データ -> モード別へのマイグレーション（非破壊）
  try { await migrateIfNeeded(); } catch(e){ console.warn("migration failed", e); }

  // 3) クイズデータ読み込み（モードに応じて）
  state.quizzes = safeLoadQuizzes(state.appMode);

  // 4) ジャンル順序等の読み込み
  loadGenreOrder();

  // 5) UI 初期化
  rebuildGenreButtons();
  setupGenreMenu();
  applyTheme();
  showScreen("genreSelect");

  // 6) モードモジュールロード（将来動的ロードに切り替えやすい）
  try {
    const modeId = state.appMode || DEFAULT_MODE_ID;
    state.currentMode = modeId;
    state.currentModeModule = await loadMode(modeId);
    console.info("loaded mode:", modeId, state.currentModeModule && state.currentModeModule.title);
  } catch (err) {
    console.warn("mode load failed; falling back to single", err);
    state.currentMode = DEFAULT_MODE_ID;
    state.currentModeModule = await loadMode(DEFAULT_MODE_ID);
  }

  // 7) イベントバインド
  bindEvents();
}

init();

// デバッグ用
window.__QUIZ_STATE__ = state;