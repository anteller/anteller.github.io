import { state } from "./state.js";
import { els } from "./domRefs.js";
import { showScreen, clearAutoTimer, showToast } from "./utils.js";
import { saveQuizzes } from "./storage.js";

export function toggleFlag(genre,id){
  const arr=state.quizzes[genre];
  if(!arr) return;
  const q=arr.find(x=>x.id===id);
  if(!q) return;
  q.flagged=!q.flagged;
  saveQuizzes();
  return q.flagged;
}

export function updateFlagButtonForCurrent(){
  if(!els.flagToggleBtn) return;
  const presentedQ=state.questions[state.currentIndex];
  if(!presentedQ){
    els.flagToggleBtn.disabled=true;
    els.flagToggleBtn.classList.remove("active");
    els.flagToggleBtn.textContent="☆ 要チェック";
    return;
  }
  els.flagToggleBtn.disabled=false;
  const origArr=state.quizzes[state.currentGenre]||[];
  const orig=origArr.find(q=>q.id===presentedQ.id);
  const flagged=orig?.flagged;
  els.flagToggleBtn.classList.toggle("active", !!flagged);
  els.flagToggleBtn.textContent=flagged?"★ 要チェック":"☆ 要チェック";
}

function buildChoiceButton(text,i,onClick){
  const btn=document.createElement("button");
  btn.type="button";
  btn.className="choice";
  btn.dataset.index=i;
  btn.setAttribute("role","option");
  const badge=document.createElement("span");
  badge.className="badge";
  badge.textContent=i+1;
  const label=document.createElement("span");
  label.textContent=text;
  btn.append(badge,label);
  btn.addEventListener("click",()=>onClick(i));
  return btn;
}

function updatePriorityAdjustUI(){
  if(!els.priorityAdjustWrap) return;
  const lowMode=!!state.lastSession.lowAccuracy;
  if(!lowMode || state.currentIndex>=state.questions.length){
    els.priorityAdjustWrap.classList.add("hidden");
    return;
  }
  const currentQ=state.questions[state.currentIndex];
  const orig=state.quizzes[state.currentGenre].find(q=>q.id===currentQ.id);
  const pf=orig?.priorityFactor ?? 1;
  els.priorityIndicator.textContent="x"+pf.toFixed(2);
  els.priorityAdjustWrap.classList.remove("hidden");
}

export function renderQuestion(){
  clearAutoTimer();
  state.answered=false;
  els.explanationBox.classList.remove("visible");
  els.explanationBox.textContent="";
  els.nextQuestionBtn.style.display="none";
  els.result.textContent="";
  els.subResult.textContent="";
  if(state.currentIndex>=state.questions.length){
    showResult();
    return;
  }
  const qObj=state.questions[state.currentIndex];
  els.progress.textContent=`進捗: ${state.currentIndex+1} / ${state.questions.length}`;
  els.question.textContent=qObj.q;
  els.choicesContainer.innerHTML="";
  qObj.choices.forEach((txt,i)=>els.choicesContainer.appendChild(buildChoiceButton(txt,i,handleAnswer)));
  if(els.iDontKnowBtn){
    els.iDontKnowBtn.disabled=false;
    els.iDontKnowBtn.style.opacity="1";
    els.iDontKnowBtn.style.display="inline-flex";
  }
  updateFlagButtonForCurrent();
  updatePriorityAdjustUI();
}

export function handleDontKnow(){
  if(state.answered) return;
  handleAnswer(-1,true);
}

export function handleAnswer(idx,forcedDontKnow=false){
  if(state.answered) return;
  const presentedQ=state.questions[state.currentIndex];
  if(!presentedQ) return;
  state.answered=true;

  const isValid=idx>=0 && idx<presentedQ.choices.length;
  const isCorrect=isValid && idx===presentedQ.answer;
  const arr=state.quizzes[state.currentGenre];
  const orig=arr? arr.find(q=>q.id===presentedQ.id):null;
  if(orig){
    orig.stats.t+=1;
    if(isCorrect) orig.stats.c+=1;
    saveQuizzes();
  }
  const choiceEls=[...els.choicesContainer.querySelectorAll(".choice")];
  choiceEls.forEach(c=>c.disabled=true);
  choiceEls.forEach(c=>{
    const i=parseInt(c.dataset.index,10);
    if(i===presentedQ.answer) c.classList.add("correct");
    if(!forcedDontKnow && i===idx && !isCorrect) c.classList.add("wrong");
  });
  if(isCorrect){
    els.result.textContent="〇 正解！";
    els.result.style.color="var(--c-ok)";
    state.correctCount++;
    state.correctQuestions.push(presentedQ);
  } else {
    els.result.textContent=forcedDontKnow?"✕ わからない":"✕ 不正解";
    els.result.style.color="var(--c-warn)";
    els.subResult.textContent=`正解: ${presentedQ.choices[presentedQ.answer]}`;
    state.wrongQuestions.push(presentedQ);
  }
  if(presentedQ.exp && presentedQ.exp.trim()!==""){
    els.explanationBox.textContent=presentedQ.exp;
    els.explanationBox.classList.add("visible");
  }
  if(els.iDontKnowBtn){
    els.iDontKnowBtn.disabled=true;
    els.iDontKnowBtn.style.opacity=".55";
  }
  updatePriorityAdjustUI();
  if(state.settings.progressMode==="auto"){
    const delayMs=Math.max(0,state.settings.autoDelaySeconds*1000);
    state.autoTimerId=setTimeout(()=>{
      state.currentIndex++;
      renderQuestion();
    },delayMs);
  } else {
    els.nextQuestionBtn.style.display="inline-flex";
    els.nextQuestionBtn.focus();
  }
}

export function nextQuestionManual(){
  if(state.settings.progressMode!=="manual") return;
  if(!state.answered) return;
  state.currentIndex++;
  renderQuestion();
}

export function adjustPriorityFactor(mult){
  const presentedQ=state.questions[state.currentIndex];
  if(!presentedQ) return;
  const orig=state.quizzes[state.currentGenre].find(q=>q.id===presentedQ.id);
  if(!orig) return;
  let pf=orig.priorityFactor ?? 1;
  pf*=mult;
  if(pf<0.2) pf=0.2;
  if(pf>5) pf=5;
  orig.priorityFactor=parseFloat(pf.toFixed(4));
  saveQuizzes();
  showToast(`出題率: x${orig.priorityFactor.toFixed(2)}`);
  const lowMode=!!state.lastSession.lowAccuracy;
  if(lowMode) els.priorityIndicator.textContent="x"+orig.priorityFactor.toFixed(2);
}

export function retryWrongOnly(){
  if(state.wrongQuestions.length===0) return;
  state.questions=[...state.wrongQuestions].map(q=>({...q}));
  state.currentIndex=0;
  state.correctCount=0;
  state.wrongQuestions=[];
  state.correctQuestions=[];
  state.isRetryWrongMode=true;
  showScreen("quizScreen");
  renderQuestion();
}

export function showResult(){
  clearAutoTimer();
  showScreen("resultScreen");
  const total=state.questions.length;
  els.score.textContent=`正解数: ${state.correctCount} / ${total}（正答率 ${ total ? Math.round(state.correctCount/total*100):0 }%）`;
  els.wrongList.innerHTML="";
  els.rightList && (els.rightList.innerHTML="");

  // 間違い
  if(state.wrongQuestions.length>0){
    els.retryBlock.classList.remove("hidden");
    state.wrongQuestions.forEach(w=>{
      const li=document.createElement("li");
      const line=document.createElement("div");
      const flagBtn=document.createElement("button");
      flagBtn.type="button";
      flagBtn.className="flag-btn"+(w.flagged?" active":"");
      flagBtn.dataset.id=w.id;
      flagBtn.textContent=w.flagged?"★ 要チェック":"☆ 要チェック";
      const span=document.createElement("span");
      span.textContent=w.q+" → 正解: ";
      const strong=document.createElement("strong");
      strong.textContent=w.choices[w.answer];
      line.append(flagBtn,span,strong);
      li.appendChild(line);
      if(w.exp && w.exp.trim()!==""){
        const expDiv=document.createElement("div");
        expDiv.className="exp";
        expDiv.textContent=w.exp;
        li.appendChild(expDiv);
      }
      els.wrongList.appendChild(li);
    });
  } else {
    els.retryBlock.classList.add("hidden");
    const li=document.createElement("li");
    li.textContent="全問正解！おめでとうございます。";
    els.wrongList.appendChild(li);
  }

  // 正解
  if(els.rightList){
    if(state.correctQuestions.length===0){
      const li=document.createElement("li");
      li.textContent="（正解した問題はありません）";
      els.rightList.appendChild(li);
    } else {
      state.correctQuestions.forEach(q=>{
        const li=document.createElement("li");
        const line=document.createElement("div");
        const flagBtn=document.createElement("button");
        flagBtn.type="button";
        flagBtn.className="flag-btn"+(q.flagged?" active":"");
        flagBtn.dataset.id=q.id;
        flagBtn.textContent=q.flagged?"★ 要チェック":"☆ 要チェック";
        const span=document.createElement("span");
        span.textContent=q.q+" → 正解: ";
        const strong=document.createElement("strong");
        strong.textContent=q.choices[q.answer];
        line.append(flagBtn,span,strong);
        li.appendChild(line);
        if(q.exp && q.exp.trim()!==""){
          const expDiv=document.createElement("div");
          expDiv.className="exp";
          expDiv.textContent=q.exp;
          li.appendChild(expDiv);
        }
        els.rightList.appendChild(li);
      });
    }
  }
}