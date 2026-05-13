function formatVND(n){return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(n)}
function val(id){return parseFloat(document.getElementById(id).value)||0}
function sync(b,s){
  const n=document.getElementById(`num-${b}`),r=document.getElementById(`range-${b}`);
  if(s==='range')n.value=r.value;else r.value=n.value;
  calculate();
}

// All input IDs that should be persisted
const ALL_INPUT_IDS = [
  'num-base-cost',
  'num-cost-lite','num-cost-fast','num-cost-qual','num-cost-up',
  'num-t-lite','num-t-fast','num-t-qual','num-t-up',
  'num-c-easy-count','num-c-med-count','num-c-hard-count',
  'num-c-easy-test','num-c-easy-draft','num-c-easy-final','num-c-easy-up',
  'num-c-med-test','num-c-med-draft','num-c-med-final','num-c-med-up',
  'num-c-hard-test','num-c-hard-draft','num-c-hard-final','num-c-hard-up'
];

const STORAGE_KEY = 'estimator_settings';

// Debounced save to avoid excessive writes
let saveTimer = null;
function saveSettings() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const data = {};
    ALL_INPUT_IDS.forEach(id => { data[id] = val(id); });
    chrome.storage.local.set({ [STORAGE_KEY]: data });
  }, 300);
}

function calculate(){
  const bC=val('num-base-cost'),cL=val('num-cost-lite'),cF=val('num-cost-fast'),cQ=val('num-cost-qual'),cU=val('num-cost-up');
  const tL=val('num-t-lite'),tF=val('num-t-fast'),tQ=val('num-t-qual'),tU=val('num-t-up');
  const eC=val('num-c-easy-count'),mC=val('num-c-med-count'),hC=val('num-c-hard-count'),tS=eC+mC+hC;
  const gL=(eC*val('num-c-easy-test'))+(mC*val('num-c-med-test'))+(hC*val('num-c-hard-test'));
  const gF=(eC*val('num-c-easy-draft'))+(mC*val('num-c-med-draft'))+(hC*val('num-c-hard-draft'));
  const gQ=(eC*val('num-c-easy-final'))+(mC*val('num-c-med-final'))+(hC*val('num-c-hard-final'));
  const gU=(eC*val('num-c-easy-up'))+(mC*val('num-c-med-up'))+(hC*val('num-c-hard-up'));
  const crL=gL*cL,crF=gF*cF,crQ=gQ*cQ,crU=gU*cU,tc=crL+crF+crQ+crU,cost=tc*bC;
  const pM=(gL*tL)+(gF*tF)+(gQ*tQ)+(gU*tU),pH=pM/60,bH=pH*0.2,tH=pH+bH;
  document.getElementById('res-total-scenes').innerText=tS;
  document.getElementById('res-total-credits').innerText=tc.toLocaleString();
  document.getElementById('res-grand-total').innerText=formatVND(cost);
  document.getElementById('res-cr-lite').innerText=crL.toLocaleString()+' cr';
  document.getElementById('res-cr-fast').innerText=crF.toLocaleString()+' cr';
  document.getElementById('res-cr-qual').innerText=crQ.toLocaleString()+' cr';
  document.getElementById('res-cr-up').innerText=crU.toLocaleString()+' cr';
  document.getElementById('res-pure-time').innerText=pH.toFixed(1)+'h';
  document.getElementById('res-buffer-time').innerText=bH.toFixed(1)+'h';
  document.getElementById('res-total-hours').innerText=tH.toFixed(1);
  // Donut chart via conic-gradient
  const donut=document.getElementById('donut-chart');
  if(tc>0){
    const pL=(crL/tc)*100, pF=(crF/tc)*100, pQ=(crQ/tc)*100;
    const s1=pL, s2=s1+pF, s3=s2+pQ;
    donut.style.background=`conic-gradient(`
      +`#94a3b8 0% ${s1}%, `
      +`#60a5fa ${s1}% ${s2}%, `
      +`#c084fc ${s2}% ${s3}%, `
      +`#34d399 ${s3}% 100%)`;
  } else {
    donut.style.background='conic-gradient(#2e2e2e 0deg 360deg)';
  }
  // Persist settings
  saveSettings();
}

// Restore saved values, then sync range sliders
function restoreSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, result => {
      const data = result[STORAGE_KEY];
      if (data) {
        ALL_INPUT_IDS.forEach(id => {
          const el = document.getElementById(id);
          if (el && data[id] !== undefined) el.value = data[id];
        });
        // Sync range sliders to match restored number inputs
        const syncPairs = [
          'c-easy-count','c-med-count','c-hard-count',
          'base-cost','cost-lite','cost-fast','cost-qual','cost-up',
          't-lite','t-fast','t-qual','t-up'
        ];
        syncPairs.forEach(baseId => {
          const numEl = document.getElementById(`num-${baseId}`);
          const rangeEl = document.getElementById(`range-${baseId}`);
          if (numEl && rangeEl) rangeEl.value = numEl.value;
        });
      }
      resolve();
    });
  });
}

// Bind all event listeners (no inline handlers for CSP compliance)
document.addEventListener('DOMContentLoaded', async () => {
  // Restore saved settings first
  await restoreSettings();

  // Sync pairs: range <-> number input
  const syncPairs = [
    'c-easy-count','c-med-count','c-hard-count',
    'base-cost','cost-lite','cost-fast','cost-qual','cost-up',
    't-lite','t-fast','t-qual','t-up'
  ];
  syncPairs.forEach(baseId => {
    const rangeEl = document.getElementById(`range-${baseId}`);
    const numEl = document.getElementById(`num-${baseId}`);
    if (rangeEl) rangeEl.addEventListener('input', () => sync(baseId, 'range'));
    if (numEl) numEl.addEventListener('input', () => sync(baseId, 'num'));
  });

  // Pure calculate inputs (multipliers)
  const calcIds = [
    'num-c-easy-test','num-c-easy-draft','num-c-easy-final','num-c-easy-up',
    'num-c-med-test','num-c-med-draft','num-c-med-final','num-c-med-up',
    'num-c-hard-test','num-c-hard-draft','num-c-hard-final','num-c-hard-up'
  ];
  calcIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });

  calculate();
});
