/**
 * content_flow_main.js
 * Injected on: labs.google/fx/tools/flow/* (world: MAIN)
 */

(function () {
  "use strict";

  if (window.__reactContextSyncLoaded) {
    return;
  }
  window.__reactContextSyncLoaded = true;

  function getReactProps(el) {
    if (!el) return null;
    const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
    return key ? el[key] : null;
  }

  function getReactFiber(el) {
    if (!el) return null;
    const key = Object.keys(el).find(
      (k) =>
        k.startsWith("__reactFiber$") ||
        k.startsWith("__reactInternalInstance$")
    );
    return key ? el[key] : null;
  }

  function findFiberHandler(fiber, handlerName, maxDepth = 15) {
    let current = fiber;
    let depth = 0;
    while (current && depth < maxDepth) {
      if (current.memoizedProps && typeof current.memoizedProps[handlerName] === "function") {
        return current.memoizedProps[handlerName];
      }
      if (current.stateNode && typeof current.stateNode[handlerName] === "function") {
        return current.stateNode[handlerName];
      }
      current = current.return;
      depth++;
    }
    return null;
  }

  function findPromptInput() {
    const slateEditor = document.querySelector('[data-slate-editor="true"]');
    if (slateEditor && isVisible(slateEditor)) return slateEditor;

    const divs = document.querySelectorAll('div[contenteditable="true"]');
    for (const d of divs) {
      const ph =
        d.getAttribute("data-placeholder") ||
        d.getAttribute("aria-placeholder") ||
        "";
      if (ph.length > 0) return d;
    }

    const textboxes = document.querySelectorAll('div[role="textbox"]');
    for (const tb of textboxes) {
      if (isVisible(tb)) return tb;
    }

    const allDivs = Array.from(
      document.querySelectorAll('div[contenteditable="true"]')
    );
    const bottomDiv = allDivs
      .filter(isVisible)
      .sort(
        (a, b) =>
          b.getBoundingClientRect().top - a.getBoundingClientRect().top
      )[0];
    if (bottomDiv) return bottomDiv;

    const tas = document.querySelectorAll("textarea");
    for (const ta of tas) {
      if (isVisible(ta)) return ta;
    }

    return null;
  }

  let lastInjectTime = 0;
  let lastPromptHash = "";
  const MIN_INJECT_INTERVAL = 3000;

  // Must be declared before humanDelay which calls it
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  function humanDelay(base = 100, jitter = 80) {
    return delay(base + Math.random() * jitter);
  }

  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return String(h);
  }

  async function injectPrompt(text) {
    const hash = simpleHash(text);
    const now = Date.now();
    if (hash === lastPromptHash && now - lastInjectTime < MIN_INJECT_INTERVAL) {
      return { success: true, method: "dedup" };
    }
    lastPromptHash = hash;

    if (now - lastInjectTime < MIN_INJECT_INTERVAL) {
      await delay(MIN_INJECT_INTERVAL - (now - lastInjectTime));
    }
    lastInjectTime = Date.now();

    const input = findPromptInput();
    if (!input) {
      return { success: false, error: "not_found" };
    }

    input.focus();
    await humanDelay(80, 60);

    try {
      document.execCommand("selectAll", false, null);
    } catch (e) {}
    await humanDelay(50, 40);

    let injected = false;
    let method = "";

    // 1. Try paste event first (most natural)
    try {
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      input.dispatchEvent(pasteEvent);
      
      await humanDelay(100, 50);
      const currentText = input.textContent || input.innerText || "";
      if (currentText.includes(text.substring(0, 30))) {
        injected = true;
        method = "clip";
      }
    } catch (e) {}

    // 2. Fallback to execCommand if clipboard fails
    if (!injected) {
      try {
        input.dispatchEvent(new InputEvent("beforeinput", {
          inputType: "insertText",
          data: text,
          bubbles: true,
          cancelable: true,
        }));

        const execSuccess = document.execCommand("insertText", false, text);

        input.dispatchEvent(new InputEvent("input", {
          inputType: "insertText",
          data: text,
          bubbles: true,
        }));

        if (execSuccess) {
          injected = true;
          method = "execcmd";
        }
      } catch (e) {}
    }

    // Removed clipboard redundant fallback here since we moved it to primary

    if (!injected) {
      input.innerHTML = `<span data-slate-string="true">${text}</span>`;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      injected = true;
      method = "html";
    }

    try {
      const sel = window.getSelection();
      sel.collapseToEnd();
    } catch (e) {}

    await humanDelay(100, 80);

    return { success: injected, method };
  }

  function isVisible(el) {
    if (!el || el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  function findSubmitButton() {
    const activeInput = findPromptInput();
    
    const candidateBtns = [];

    // Tìm tất cả các button có text hợp lệ
    const allBtns = Array.from(document.querySelectorAll('button'));
    for (const btn of allBtns) {
      if (!isVisible(btn)) continue;
      const txt = btn.textContent.trim().toLowerCase();
      if (txt.includes('create') || txt.includes('generate') || txt.includes('send') || txt.includes('submit') || txt.includes('tạo') || txt.includes('gửi')) {
        candidateBtns.push(btn);
      }
    }

    // Tìm qua icon nếu chưa thấy hoặc bổ sung thêm
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      if (icon.textContent.trim() === 'arrow_forward') {
        const btn = icon.closest('button');
        const target = btn && isVisible(btn) ? btn : (isVisible(icon) ? icon : null);
        if (target && !candidateBtns.includes(target)) candidateBtns.push(target);
      }
    }

    // Các selectors dự phòng
    const selectors = [
      'button[aria-label*="Send" i]', 
      'button[aria-label*="Generate" i]', 
      'button[aria-label*="Submit" i]',
      'button[aria-label*="Tạo" i]',
      'button[aria-label*="Gửi" i]',
      '.mat-mdc-tooltip-trigger.mdc-icon-button'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isVisible(el) && !candidateBtns.includes(el)) candidateBtns.push(el);
    }

    if (candidateBtns.length === 0) return null;
    if (candidateBtns.length === 1) return candidateBtns[0];

    // Có nhiều ứng viên, ưu tiên nút nào gần input nhất
    if (activeInput) {
      const inputRect = activeInput.getBoundingClientRect();
      candidateBtns.sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        const aDist = Math.abs(aRect.top - inputRect.top) + Math.abs(aRect.left - inputRect.left);
        const bDist = Math.abs(bRect.top - inputRect.top) + Math.abs(bRect.left - inputRect.left);
        return aDist - bDist;
      });
    }

    return candidateBtns[0];
  }

  // === CREDIT TRACKING SYSTEM ===
  let lastReportedTime = 0;
  let _suppressClickCount = 0; // counter: how many upcoming click events to suppress

  function reportUsage(cost, actionType) {
    const now = Date.now();
    // Prevent double counting within 2 seconds
    if (now - lastReportedTime < 2000) {
      console.log(`[PromptAgent] ⏭️ Debounced: ${cost} credits (${actionType})`);
      return;
    }
    lastReportedTime = now;
    window.postMessage({ type: "sys_report_usage", cost, actionType }, "*");
    console.log(`[PromptAgent] ✅ Deducted ${cost} credits for ${actionType}`);
  }

  // ── Credit: model → cost lookup (specificity order: longest first) ──
  const MODEL_LOOKUP = [
    ['lite lower priority', 0],
    ['quality', 100],
    ['fast', 10],
    ['lite', 5],
    ['imagen', 10],
  ];

  // Persistent cache: updated whenever model selection changes
  let _cachedModelCost = 10; // default
  let _cachedModelName = '(unknown)';

  function detectModelFromText(txt) {
    const t = txt.toLowerCase().trim();
    for (const [model, cost] of MODEL_LOOKUP) {
      if (t.includes(model)) return { model, cost };
    }
    return null;
  }

  function scanAndCacheModel() {
    // 1. Radix: look for checked/selected menu items (when dropdown is open)
    const radixChecked = document.querySelectorAll(
      '[role="menuitemradio"][data-state="checked"], [role="option"][aria-selected="true"], [role="menuitem"][aria-checked="true"]'
    );
    for (const el of radixChecked) {
      const txt = el.textContent;
      const match = detectModelFromText(txt);
      if (match) {
        if (_cachedModelName !== match.model) {
          _cachedModelCost = match.cost;
          _cachedModelName = match.model;
          console.log(`[PromptAgent] 📌 Model set (checked attr): "${txt.trim()}" → ${match.cost} credits`);
        }
        return;
      }
    }

    // 2. Any visible button/trigger that contains model keywords (dropdown closed state)
    // Require 'veo' or 'imagen' context to avoid matching unrelated buttons with text like "Fast"
    const candidates = document.querySelectorAll(
      'button, [role="combobox"], [role="button"], [aria-haspopup]'
    );
    for (const el of candidates) {
      if (!isVisible(el)) continue;
      const txt = el.textContent.trim();
      if (txt.length > 80 || txt.length < 2) continue;
      const txtLower = txt.toLowerCase();
      if (!txtLower.includes('veo') && !txtLower.includes('imagen')) continue;
      const match = detectModelFromText(txt);
      if (match) {
        if (_cachedModelName !== match.model) {
          _cachedModelCost = match.cost;
          _cachedModelName = match.model;
          console.log(`[PromptAgent] 📌 Model set (visible btn): "${txt}" → ${match.cost} credits`);
        }
        return;
      }
    }
  }

  // Watch for DOM changes — debounced to avoid hammering on every React re-render
  let _modelWatchDebounce = null;
  const _modelWatcher = new MutationObserver(() => {
    if (_modelWatchDebounce) clearTimeout(_modelWatchDebounce);
    _modelWatchDebounce = setTimeout(scanAndCacheModel, 300);
  });
  _modelWatcher.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state', 'aria-checked', 'aria-selected'] });

  // Initial scan
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndCacheModel);
  } else {
    scanAndCacheModel();
  }

  function getGenerateCost() {
    // Re-scan now (dropdown might just have been clicked)
    scanAndCacheModel();

    // DEBUG: dump all visible elements with model keywords to help diagnose
    const debugEls = Array.from(document.querySelectorAll('*')).filter(el => {
      if (!isVisible(el)) return false;
      const txt = el.textContent.trim();
      return txt.length < 100 && MODEL_LOOKUP.some(([m]) => txt.toLowerCase().includes(m));
    });
    if (debugEls.length > 0) {
      console.log('[PromptAgent] 🔍 DEBUG visible model elements:',
        debugEls.map(el => `<${el.tagName.toLowerCase()}> "${el.textContent.trim()}"`)
      );
    } else {
      console.warn('[PromptAgent] 🔍 DEBUG: No visible model elements found!');
    }

    console.log(`[PromptAgent] 💰 Using cached model: "${_cachedModelName}" → ${_cachedModelCost} credits`);
    return _cachedModelCost;
  }



  // Intercept clicks to capture manual & auto generations and upscales
  document.addEventListener('click', (e) => {
    // Skip synthetic clicks dispatched by THIS extension to avoid double counting
    if (_suppressClickCount > 0) {
      _suppressClickCount--;
      return;
    }

    // ── Check if it's an upscale action first ──
    let target = e.target;
    let isDisabled = false;
    let tempTarget = target;
    while (tempTarget && tempTarget !== document.body) {
      if (tempTarget.disabled || tempTarget.getAttribute('aria-disabled') === 'true' || tempTarget.getAttribute('data-disabled') === 'true') {
        isDisabled = true;
        break;
      }
      tempTarget = tempTarget.parentElement;
    }

    while (target && target !== document.body) {
      const txt = target.textContent || "";
      // Match: "Upscaled · 50 credits" or "4K · 50 credits"
      const upMatch = txt.match(/(?:Upscaled|4K).*?(\d+)\s+credits/i);
      if (upMatch && txt.length < 60) {
        if (!isDisabled) {
          const cost = parseInt(upMatch[1], 10);
          reportUsage(cost, "Upscale");
        }
        return;
      }
      target = target.parentElement;
    }

    // ── Check if it's the main submit/generate button ──
    const submitBtn = findSubmitButton();
    if (submitBtn && (submitBtn === e.target || submitBtn.contains(e.target))) {
      if (submitBtn.disabled || submitBtn.getAttribute('aria-disabled') === 'true' || submitBtn.getAttribute('data-disabled') === 'true') {
        return;
      }
      const cost = getGenerateCost();
      if (cost >= 0) { // allow 0-cost (Lite lower priority)
        reportUsage(cost, "Generate");
      }
    }
  }, true); // capture phase
  // ==============================


  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.type !== "sys_cmd_req") return;

    let promptResult = { success: false };
    let autoSubmitSuccess = false;

    if (data.prompt) {
      promptResult = await injectPrompt(data.prompt);
    } else {
      promptResult = { success: false, error: "empty" };
    }

    if (data.autoSubmit && promptResult.success) {
      await humanDelay(1500, 500);
      let submitBtn = findSubmitButton();
      
      // Chờ nếu nút submit đang bị disable
      for(let i=0; i<4; i++) {
         if (submitBtn && !submitBtn.disabled && submitBtn.getAttribute('aria-disabled') !== 'true' && submitBtn.getAttribute('data-disabled') !== 'true') break;
         await humanDelay(500, 200);
         submitBtn = findSubmitButton() || submitBtn;
      }

      if (submitBtn) {
        try {
          const rect = submitBtn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;

          const eventOpts = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, pointerId: 1 };
          
          // Hover sequence (no click → no credit trigger)
          submitBtn.dispatchEvent(new PointerEvent('pointerover', eventOpts));
          submitBtn.dispatchEvent(new PointerEvent('pointerenter', eventOpts));
          submitBtn.dispatchEvent(new MouseEvent('mouseover', eventOpts));
          submitBtn.dispatchEvent(new MouseEvent('mouseenter', eventOpts));
          await humanDelay(20, 10);

          // Get cost BEFORE click (model info still available)
          const autoCost = getGenerateCost();

          // Suppress BOTH click events: dispatchEvent(click) + .click()
          _suppressClickCount = 2;

          // Click sequence
          submitBtn.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
          submitBtn.dispatchEvent(new MouseEvent('mousedown', eventOpts));
          await humanDelay(50, 30);
          submitBtn.dispatchEvent(new PointerEvent('pointerup', eventOpts));
          submitBtn.dispatchEvent(new MouseEvent('mouseup', eventOpts));
          submitBtn.dispatchEvent(new MouseEvent('click', eventOpts));
          try { submitBtn.click(); } catch(e) { _suppressClickCount = Math.max(0, _suppressClickCount - 1); }

          // Report credit directly (both listener clicks are suppressed)
          if (autoCost >= 0) {
            reportUsage(autoCost, "Generate (Auto)");
          }

          autoSubmitSuccess = true;
        } catch (e) {
          _suppressClickCount = 0; // reset on error
        }
      }


      // Fallback: Also dispatch Enter key on the active input as some forms listen to it
      try {
        const activeInput = findPromptInput();
        if (activeInput) {
          const kbEvent = new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
              bubbles: true, cancelable: true, composed: true
          });
          activeInput.dispatchEvent(kbEvent);
        }
      } catch (e) {}
    }

    window.postMessage(
      {
        type: "sys_cmd_res",
        action: "prompt",
        prompt: promptResult,
        autoSubmitSuccess,
      },
      "*"
    );
  });
})();

