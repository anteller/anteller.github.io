import { STORAGE_KEY_MULTIPLE, SETTINGS_KEY } from "../../constants.js";
import * as manageSingleShim from "../single/core/manage.js"; // 基本管理は流用

import engine from "./engine.js";
import ui from "./ui.js";
import manage from "./manage.js";

const MultipleMode = {
  id: "multiple",
  title: "複数解答",
  icon: "🅜",
  storageKeys: {
    quizzesKey: STORAGE_KEY_MULTIPLE,
    settingsKey: SETTINGS_KEY
  },
  engine,
  ui,
  // 管理画面は single 流用 + 追加エディタ差し替え
  manage: {
    ...manageSingleShim,
    ...manage
  }
};

export default MultipleMode;