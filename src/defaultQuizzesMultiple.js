// 複数選択モード用のデフォルト問題（最小例）
export const defaultQuizzesMultiple = {
  __version: 2,
  "サンプル": [
    {
      id: "m1",
      q: "複数選択の例: 正しいものをすべて選んでください。",
      choices: ["2は偶数", "3は偶数", "4は偶数", "5は偶数"],
      correctIndexes: [0, 2],
      exp: "偶数は2の倍数です。",
      tags: ["サンプル"],
      stats: { c:0, t:0 },
      flagged: false,
      priorityFactor: 1
    },
    {
      id: "m2",
      q: "複数選択の例: フルーツをすべて選択",
      choices: ["リンゴ", "にんじん", "バナナ", "キャベツ"],
      correctIndexes: [0, 2],
      exp: "",
      tags: ["サンプル"],
      stats: { c:0, t:0 },
      flagged: false,
      priorityFactor: 1
    }
  ]
};