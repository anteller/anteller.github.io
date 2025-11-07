export const STORAGE_KEY = "quizzes";
export const SETTINGS_KEY = "quiz_settings_v1";
export const GENRE_ORDER_KEY = "quiz_genre_order_v1";
export const DATA_VERSION = 2;

// 追加: アプリの出題モードID
export const APP_MODES = {
  SINGLE: "single",
  // MULTIPLE: "multiple",   // Phase 2 以降で使用
  // FLASHCARDS: "flashcards"
};

export const DEFAULT_SETTINGS = {
  progressMode:"manual",
  autoDelaySeconds:1.0,
  questionCountOptions:["5","10","30","all"],
  themeMode:"auto",
  undoDurationSeconds:7,
  shuffleChoices:false,
  priorityIncreaseMultiplier:1.4,
  // 追加: 既定のモード（現状は single）
  appMode: APP_MODES.SINGLE
};

export const MIN_CHOICES=2;
export const MAX_CHOICES=6;