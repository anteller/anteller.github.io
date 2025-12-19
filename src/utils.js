import { els, screenMap, $ } from "./domRefs.js";
import { state } from "./state.js";

export function showToast(msg, dur=2500){
  els.toast.innerHTML = msg;
  els.toast.classList.add("show");
  setTimeout(()=>{
    if(els.toast.innerHTML===msg) els.toast.classList.remove("show");
  }, dur);
}

export function clearAutoTimer(){
  if(state.autoTimerId!==null){
    clearTimeout(state.autoTimerId);
    state.autoTimerId=null;
  }
}

export function showScreen(name){
  clearAutoTimer();
  Object.keys(screenMap).forEach(k=>{
    screenMap[k]?.classList.toggle("hidden", k!==name);
  });
  // ホーム(genreSelect)以外ではモード切替ボタンを非表示
  if (els.modeToggle) {
    els.modeToggle.classList.toggle("hidden", name!=="genreSelect");
  }
}

export function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
export const clone = (o)=>JSON.parse(JSON.stringify(o));
export function createId(){
  return "q_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8);
}
export function parseTags(str){
  if(!str) return [];
  return [...new Set(str.split(",").map(t=>t.trim()).filter(t=>t!==""))];
}
export function sanitizeFileName(str){
  const replaced=str
    .replace(/[\/\\\?\%\*\:\|\"<>\r\n]/g,"_")
    .replace(/\s+/g,"_")
    .replace(/_+/g,"_")
    .replace(/^_+|_+$/g,"");
  return replaced || "file";
}
export function buildGenreExportFileName(genre){
  const d=new Date();
  const pad=n=>String(n).padStart(2,"0");
  const ts=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  const safe=sanitizeFileName(genre);
  return `quiz_${safe}_${ts}.json`;
}
export function applyTheme(){
  document.body.setAttribute("data-theme", state.settings.themeMode || "auto");
}

export function randomizeChoicesOnQuestion(q){
  if(!q?.choices || q.choices.length<2) return q;
  if(!state.settings.shuffleChoices) return q;
  const orig=q.choices.slice();
  const order=orig.map((_,i)=>i);
  shuffle(order);
  q.choices=order.map(i=>orig[i]);
  q.answer=order.indexOf(q.answer);
  return q;
}

export function buildTagBadges(tags){
  const frag=document.createDocumentFragment();
  tags.forEach(t=>{
    const span=document.createElement("span");
    span.className="tag-badge";
    span.textContent=t;
    frag.appendChild(span);
  });
  return frag;
}

export function keyListenerActiveQuiz(e, handlers){
  if(els.quizScreen.classList.contains("hidden")) return;
  if(handlers.onNext && state.answered && state.settings.progressMode==="manual" && els.nextQuestionBtn.style.display==="inline-flex"){
    if(e.key==="Enter"||e.key===" "){
      handlers.onNext();
      return;
    }
  }
  if(state.answered) return;
  if(/^[1-9]$/.test(e.key)){
    const n=+e.key;
    const choices=[...els.choicesContainer.querySelectorAll(".choice")];
    if(n>=1 && n<=choices.length) handlers.onAnswer(n-1);
  } else if(e.key==="0"){
    handlers.onDontKnow && handlers.onDontKnow();
  }
}

export function showConfirm({
  title = "確認",
  message = "",
  yesText = "はい",
  noText = "いいえ"
} = {}){
  // フォールバック（念のため）
  if(!els.confirmOverlay || !els.confirmDialog || !els.confirmYesBtn || !els.confirmNoBtn){
    return Promise.resolve(window.confirm(message));
  }

  return new Promise(resolve => {
    const prevActive = document.activeElement;

    if(els.confirmTitle) els.confirmTitle.textContent = title;
    if(els.confirmMessage) els.confirmMessage.textContent = message;
    els.confirmYesBtn.textContent = yesText;
    els.confirmNoBtn.textContent = noText;

    els.confirmOverlay.classList.remove("hidden");
    els.confirmOverlay.setAttribute("aria-hidden", "false");

    const cleanup = (result) => {
      els.confirmOverlay.classList.add("hidden");
      els.confirmOverlay.setAttribute("aria-hidden", "true");

      els.confirmYesBtn.removeEventListener("click", onYes);
      els.confirmNoBtn.removeEventListener("click", onNo);
      els.confirmCloseBtn?.removeEventListener("click", onCancel);
      els.confirmOverlay.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onKeyDown, true);

      try{
        if(prevActive && typeof prevActive.focus === "function") prevActive.focus();
      }catch{}
      resolve(result);
    };

    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);
    const onCancel = () => cleanup(null);
    const onBackdrop = (e) => {
      // ダイアログ外クリックはキャンセル扱い
      if(e.target === els.confirmOverlay) cleanup(null);
    };
    const onKeyDown = (e) => {
      if(els.confirmOverlay.classList.contains("hidden")) return;
      if(e.key === "Escape"){
        e.preventDefault();
        cleanup(null);
        return;
      }
      if(e.key === "Tab"){
        // 最小フォーカストラップ（ボタン2つのみ）
        const focusables = [els.confirmCloseBtn, els.confirmYesBtn, els.confirmNoBtn].filter(Boolean);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if(!first || !last) return;

        if(e.shiftKey && document.activeElement === first){
          e.preventDefault();
          last.focus();
        } else if(!e.shiftKey && document.activeElement === last){
          e.preventDefault();
          first.focus();
        }
      }
    };

    els.confirmYesBtn.addEventListener("click", onYes);
    els.confirmNoBtn.addEventListener("click", onNo);
    els.confirmCloseBtn?.addEventListener("click", onCancel);
    els.confirmOverlay.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onKeyDown, true);

    // 初期フォーカスは「はい」（キーボード操作向け）
    setTimeout(()=>{
      try{ els.confirmYesBtn.focus(); }catch{}
    }, 0);
  });
}