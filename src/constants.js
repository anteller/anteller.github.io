export const STORAGE_KEY = "quizzes"; // 既存キー（互換用）
export const SETTINGS_KEY = "quiz_settings_v1";
export const GENRE_ORDER_KEY = "quiz_genre_order_v1"; // legacy global (フォールバック用)
export const DATA_VERSION = 2;

// モード別ストレージキー
export const STORAGE_KEY_SINGLE = "quizzes_single";
export const STORAGE_KEY_MULTIPLE = "quizzes_multiple";
export const STORAGE_KEY_FLASH = "quizzes_flashcards";

// モード別ジャンル順キー
export const GENRE_ORDER_KEY_SINGLE = "quiz_genre_order_single_v1";
export const GENRE_ORDER_KEY_MULTIPLE = "quiz_genre_order_multiple_v1";
export const GENRE_ORDER_KEY_FLASH = "quiz_genre_order_flash_v1";

// アプリ出題モード定義
export const APP_MODES = {
  SINGLE: "single",
  MULTIPLE: "multiple",
  FLASHCARDS: "flashcards"
};

export const DEFAULT_SETTINGS = {
  progressMode: "manual",
  autoDelaySeconds: 1.0,
  questionCountOptions: ["5", "10", "30", "all"],
  themeMode: "auto",
  undoDurationSeconds: 7,
  shuffleChoices: false,
  priorityIncreaseMultiplier: 1.4,
  // 既定モード
  appMode: APP_MODES.SINGLE
};

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 6;