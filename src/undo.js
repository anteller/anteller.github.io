import { state } from "./state.js";
import { showToast } from "./utils.js";
import { saveQuizzes, saveGenreOrder } from "./storage.js";
import { rebuildGenreButtons } from "./manage.js";

export function recordUndo(undoObj){
  clearUndoTimer();
  const durationSec=state.settings.undoDurationSeconds || 7;
  const durationMs=durationSec*1000;
  undoObj.timerId=setTimeout(()=>{ state.lastUndo=null; }, durationMs);
  undoObj.expiresAt=Date.now()+durationMs;
  state.lastUndo=undoObj;
  showUndoToastGeneric(undoObj,durationMs);
}

function showUndoToastGeneric(undoObj,durationMs){
  const msg=buildUndoMessage(undoObj);
  showToast(`${msg} <a class="undo-link" href="#" id="undoLink" role="button" tabindex="0">元に戻す</a>`,durationMs);
  setTimeout(()=>{
    const link=document.getElementById("undoLink");
    if(link){
      const handler=(e)=>{
        if(e.type==="click"||e.key==="Enter"||e.key===" "){
          e.preventDefault();
          applyUndo();
        }
      };
      link.addEventListener("click",handler,{once:true});
      link.addEventListener("keydown",handler,{once:true});
      link.focus();
    }
  },40);
}

function buildUndoMessage(u){
  switch(u.type){
    case "question-delete": return `削除しました (${u.items.length}件)`;
    case "genre-delete": return `ジャンル「${u.genre}」を削除しました`;
    case "stats-reset": return `ジャンル「${u.genre}」の統計をリセットしました`;
    default: return "操作を実行しました";
  }
}

function clearUndoTimer(){
  if(state.lastUndo?.timerId){
    clearTimeout(state.lastUndo.timerId);
    state.lastUndo.timerId=null;
  }
}

export function applyUndo(){
  const u=state.lastUndo;
  if(!u) return;
  clearUndoTimer();
  switch(u.type){
    case "question-delete": {
      if(u.genre==="(複数)"){
        const group=new Map();
        u.items.forEach(it=>{
          if(!group.has(it.genre)) group.set(it.genre,[]);
          group.get(it.genre).push(it);
        });
        group.forEach((list,g)=>{
          if(!state.quizzes[g]) return;
          const arr=state.quizzes[g];
            list.sort((a,b)=>a.index-b.index).forEach(entry=>{
              const idx=entry.index<=arr.length? entry.index:arr.length;
              arr.splice(idx,0,entry.question);
            });
        });
      } else {
        if(!state.quizzes[u.genre]) break;
        const arr=state.quizzes[u.genre];
        u.items.sort((a,b)=>a.index-b.index).forEach(entry=>{
          const idx=entry.index<=arr.length? entry.index:arr.length;
          arr.splice(idx,0,entry.question);
        });
      }
      saveQuizzes();
      rebuildGenreButtons();
      showToast("問題の削除を元に戻しました");
      break;
    }
    case "genre-delete": {
      let name=u.genre;
      if(state.quizzes[name]){
        let suffix=1;
        while(state.quizzes[`${name}_${suffix}`]) suffix++;
        name=`${name}_${suffix}`;
      }
      state.quizzes[name]=u.questions;
      const idx=u.genreIndex<=state.genreOrder.length? u.genreIndex:state.genreOrder.length;
      state.genreOrder.splice(idx,0,name);
      saveQuizzes(); saveGenreOrder();
      rebuildGenreButtons();
      showToast("ジャンル削除を元に戻しました");
      break;
    }
    case "stats-reset": {
      if(!state.quizzes[u.genre]) break;
      const map=new Map(u.prevStats.map(s=>[s.id,s]));
      state.quizzes[u.genre].forEach(q=>{
        const rec=map.get(q.id);
        if(rec){
          q.stats.c=rec.c;
            q.stats.t=rec.t;
        }
      });
      saveQuizzes();
      showToast("統計リセットを元に戻しました");
      break;
    }
    default:
      showToast("元に戻す対象が不明です");
  }
  state.lastUndo=null;
}