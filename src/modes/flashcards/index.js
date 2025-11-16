import { STORAGE_KEY_FLASH, SETTINGS_KEY } from "../../constants.js";
import engine from "./engine.js";
import ui from "./ui.js";
import manage from "./manage.js";

const FlashcardsMode = {
  id: "flashcards",
  title: "単語帳",
  icon: "🅕",
  storageKeys: {
    quizzesKey: STORAGE_KEY_FLASH,
    settingsKey: SETTINGS_KEY
  },
  engine,
  ui,
  manage
};

export default FlashcardsMode;