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
    lastSession:{genre:null,limit:null,lowAccuracy:false,flaggedOnly:false},
    manageFlaggedOnly:false
};