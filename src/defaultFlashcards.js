import { DATA_VERSION } from "./constants.js";

// 単語帳モード用のデフォルト問題
// - front/back は空でもOK（ユーザー要望に合わせて空入力も許容）
// - q は「問題文（任意）」として出題画面に常時表示される
export const defaultFlashcards = {
  __version: DATA_VERSION,
  "サンプル": [
    {
      id: "f1",
      q: "英単語: 意味を答えて",
      front: "apple",
      back: "りんご",
      exp: "基本的な名詞。",
      tags: ["英語", "名詞"],
      stats: { seen: 0, known: 0 },
      flagged: false,
      priorityFactor: 1
    },
    {
      id: "f2",
      q: "英単語: 反対語を答えて",
      front: "hot",
      back: "cold",
      exp: "温度の形容詞。",
      tags: ["英語", "形容詞"],
      stats: { seen: 0, known: 0 },
      flagged: false,
      priorityFactor: 1
    },
    {
      id: "f3",
      q: "（例）表/裏が空でも登録できる",
      front: "",
      back: "",
      exp: "このカードは入力が空でも保存できる例です。",
      tags: ["サンプル"],
      stats: { seen: 0, known: 0 },
      flagged: false,
      priorityFactor: 1
    }
  ],
  "用語（基礎）": [
    {
      id: "f4",
      q: "用語: 意味を答えて",
      front: "アルゴリズム",
      back: "問題を解く手順や計算方法",
      exp: "プログラムの中身（手順）そのもの。",
      tags: ["用語"],
      stats: { seen: 0, known: 0 },
      flagged: false,
      priorityFactor: 1
    },
    {
      id: "f5",
      q: "用語: 意味を答えて",
      front: "変数",
      back: "値を入れておく箱（名前付きの領域）",
      exp: "プログラミングの基本概念。",
      tags: ["用語"],
      stats: { seen: 0, known: 0 },
      flagged: false,
      priorityFactor: 1
    }
  ]
};
