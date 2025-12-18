import { DATA_VERSION } from "./constants.js";

// 複数選択モード用のデフォルト問題（サンプル）
export const defaultQuizzesMultiple = {
  __version: DATA_VERSION,
  "サンプル": [
    {
      id: "m1",
      q: "正しいものをすべて選んでください（偶数）",
      choices: ["2は偶数", "3は偶数", "4は偶数", "5は偶数"],
      correctIndexes: [0, 2],
      exp: "偶数は2の倍数です。",
      tags: ["サンプル", "算数"],
      stats: { c:0, t:0 },
      flagged: false,
      priorityFactor: 1
    },
    {
      id: "m2",
      q: "正しいものをすべて選択（フルーツ）",
      choices: ["リンゴ", "にんじん", "バナナ", "キャベツ"],
      correctIndexes: [0, 2],
      exp: "野菜と混ざっています。",
      tags: ["サンプル"],
      stats: { c:0, t:0 },
      flagged: false,
      priorityFactor: 1
    }
  ],
  "基礎（算数）": [
    {
      id: "m_math_1",
      q: "次のうち、素数をすべて選んでください",
      choices: ["2", "4", "5", "9"],
      correctIndexes: [0, 2],
      exp: "素数は1と自分自身以外で割り切れない数です（2,3,5,7…）。",
      tags: ["算数"],
      stats: { c:0, t:0 },
      flagged: false,
      priorityFactor: 1
    },
    {
      id: "m_math_2",
      q: "次のうち、3の倍数をすべて選んでください",
      choices: ["6", "8", "12", "14"],
      correctIndexes: [0, 2],
      exp: "3の倍数は各桁の和が3の倍数になります。",
      tags: ["算数"],
      stats: { c:0, t:0 },
      flagged: false,
      priorityFactor: 1
    }
  ],
  "基礎（生活）": [
    {
      id: "m_life_1",
      q: "次のうち、再利用（リユース）に当てはまるものを選んでください",
      choices: ["びんを洗って別の用途に使う", "紙を溶かして新しい紙にする", "燃えるゴミとして出す", "マイボトルを繰り返し使う"],
      correctIndexes: [0, 3],
      exp: "リユース=そのまま使う（形を変えない）。リサイクル=材料に戻す。",
      tags: ["生活"],
      stats: { c:0, t:0 },
      flagged: false,
      priorityFactor: 1
    },
    {
      id: "m_life_2",
      q: "次のうち、朝（午前）に起こりやすい現象をすべて選んでください（一般的な傾向）",
      choices: ["日の出", "日没", "朝露", "星が最もよく見える（常に）"],
      correctIndexes: [0, 2],
      exp: "日の出・朝露が代表例。星の見え方は条件によります。",
      tags: ["生活"],
      stats: { c:0, t:0 },
      flagged: false,
      priorityFactor: 1
    }
  ]
};