import { DEFAULT_SETTINGS } from "./constants.js";

export const state = {
    quizzes: {},
    genreOrder: [],
    currentGenre: null,
    questions: [],
    currentIndex: 0,
    correctCount: 0,
    wrongQuestions: [],
    correctQuestions: [],
    isRetryWrongMode: false,
    settings: { ...DEFAULT_SETTINGS },
    autoTimerId: null,
    answered: false,
    isEditingQuestion: false,
    editingIndex: -1,
    sortMode: "original",
    tagFilter: "",
    selectedQuestionIds: new Set(),
    pendingGenreForCount: null,
    lastUndo: null,
    lastSession:{genre:null,limit:null,lowAccuracy:false,flaggedOnly:false,mode:DEFAULT_SETTINGS.appMode},
    manageFlaggedOnly:false,
    // 追加: 現在のアプリ出題モード
    appMode: DEFAULT_SETTINGS.appMode
};