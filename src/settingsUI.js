import { els } from "./domRefs.js";
import { state } from "./state.js";
import { saveSettings, normalizeQuestionCountOptions } from "./storage.js";
import { applyTheme, showToast } from "./utils.js";

export function populateSettingsForm(){
  els.settingsForm.querySelectorAll('input[name="progressMode"]').forEach(r=>{
    r.checked=(r.value===state.settings.progressMode);
  });
  els.autoDelayInput.value=state.settings.autoDelaySeconds;
  els.questionCountOptionsInput.value=state.settings.questionCountOptions.join(",");
  els.settingsForm.querySelectorAll('input[name="themeMode"]').forEach(r=>{
    r.checked=(r.value===state.settings.themeMode);
  });
  if(els.undoDurationInput) els.undoDurationInput.value=state.settings.undoDurationSeconds;
  const sc=document.getElementById("shuffleChoicesInput");
  if(sc) sc.checked=!!state.settings.shuffleChoices;
  const pim=document.getElementById("priorityIncreaseInput");
  if(pim) pim.value=state.settings.priorityIncreaseMultiplier;
  toggleAutoDelayVisibility();
}

export function toggleAutoDelayVisibility(){
  const selected=els.settingsForm.querySelector('input[name="progressMode"]:checked')?.value;
  const wrap=document.getElementById("autoDelayWrap");
  if(wrap) wrap.style.display=selected==="auto"?"block":"none";
}

export function saveSettingsFromForm(){
  const mode=els.settingsForm.querySelector('input[name="progressMode"]:checked')?.value || "auto";
  let delay=parseFloat(els.autoDelayInput.value);
  if(isNaN(delay)||delay<0.3) delay=1.0;
  if(delay>10) delay=10;
  state.settings.progressMode=mode;
  state.settings.autoDelaySeconds=delay;
  state.settings.questionCountOptions=normalizeQuestionCountOptions(els.questionCountOptionsInput.value);
  let theme="auto";
  els.settingsForm.querySelectorAll('input[name="themeMode"]').forEach(r=>{
    if(r.checked) theme=r.value;
  });
  state.settings.themeMode=theme;
  let undoSec=parseFloat(els.undoDurationInput?.value);
  if(isNaN(undoSec)) undoSec=7;
  undoSec=Math.round(undoSec);
  if(undoSec<2) undoSec=2;
  if(undoSec>60) undoSec=60;
  state.settings.undoDurationSeconds=undoSec;
  state.settings.shuffleChoices=!!document.getElementById("shuffleChoicesInput")?.checked;
  const pimEl=document.getElementById("priorityIncreaseInput");
  if(pimEl){
    let val=parseFloat(pimEl.value);
    if(isNaN(val)||val<1.01) val=1.01;
    if(val>5) val=5;
    state.settings.priorityIncreaseMultiplier=parseFloat(val.toFixed(2));
  }
  saveSettings();
  applyTheme();
  showToast("設定を保存しました");
}