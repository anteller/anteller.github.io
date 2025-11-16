// 薄いラッパ: single/core/quizUI.js で実装した複数選択専用関数を再エクスポート
import {
  renderQuestionMultiple,
  submitMultipleAnswer,
  nextMultiple
} from "../single/core/quizUI.js";

export default {
  renderQuestionMultiple,
  submitMultipleAnswer,
  nextMultiple
};

export {
  renderQuestionMultiple,
  submitMultipleAnswer,
  nextMultiple
};