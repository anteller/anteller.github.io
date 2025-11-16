// 複数選択モード専用デフォルト問題（サンプル）
export const defaultQuizzesMultiple = {
  "サンプル: 複数選択": [
    {
      id: "m_1",
      q: "複数選択モードのデフォルトは択一とは異なる？",
      choices: ["はい", "いいえ", "どちらでもない"],
      correctIndexes: [0],
      exp: "このモードは別データで初期化されます。",
      tags: ["sample"],
      stats: { c: 0, t: 0 },
      flagged: false,
      priorityFactor: 1
    },
    {
      id: "m_2",
      q: "以下のうち、偶数を選べ。",
      choices: ["1", "2", "3", "4"],
      correctIndexes: [1, 3],
      exp: "2と4が偶数です。",
      tags: ["math"],
      stats: { c: 0, t: 0 },
      flagged: false,
      priorityFactor: 1
    }
  ],
  __version: 2
};