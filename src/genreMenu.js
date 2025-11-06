// ジャンルカードに常設の三点メニュー（⋮）ボタンを注入し、クリックで既存の「右クリックで管理」と同等の処理を発火させる。
// 既存のコードが genre ボタンの contextmenu をハンドリングして管理画面を開く前提。
// このモジュールは DOM 更新（ジャンル追加/並び替え/リロード）にも追随する。

function createMenuButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "genre-menu-btn";
  btn.title = "管理";
  btn.setAttribute("aria-label", "管理");
  // 三点リーダー（縦）
  btn.textContent = "⋮";
  // クリックで親のジャンルカードに contextmenu イベントを投げる
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    const card = e.currentTarget.closest(".genre-btn");
    if (!card) return;
    // 既存の右クリック（button:2）をエミュレート
    const evt = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 2
    });
    card.dispatchEvent(evt);
  });
  // タッチ端末での誤反応抑制
  btn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
  });
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      (e.currentTarget instanceof HTMLElement) && e.currentTarget.click();
    }
  });
  return btn;
}

function injectMenuButtons() {
  const container = document.getElementById("genreButtons");
  if (!container) return;
  const cards = container.querySelectorAll(".genre-btn");
  cards.forEach((card) => {
    if (card.querySelector(".genre-menu-btn")) return; // 二重挿入防止
    // ジャンルカードが position:relative であることを前提（style.css で設定）
    const btn = createMenuButton();
    card.appendChild(btn);
  });
}

function observeGenreButtons() {
  const container = document.getElementById("genreButtons");
  if (!container) return;
  const obs = new MutationObserver(() => {
    // 子要素の変化（再構築/追加/削除/並び替え）に追随して再注入
    injectMenuButtons();
  });
  obs.observe(container, { childList: true, subtree: false });
}

export function setupGenreMenu() {
  // 初回注入
  injectMenuButtons();
  // 変化監視
  observeGenreButtons();
}