/**
 * content_flow.js — PromptAgent Flow Bridge v3.5
 * Injected on: labs.google/fx/tools/flow/*
 *
 * VERIFIED via live DOM inspection (May 2026):
 *   - Prompt input: contenteditable div at bottom bar, placeholder "Bạn muốn tạo gì?"
 *   - Submit button: circular arrow button right of the input bar
 *   - Generated media: img elements in the main grid
 *
 * Responsibilities:
 * 1. Listen for EXECUTE_PROMPT → fill prompt, optionally trigger Generate
 * 2. Observe generated media → inject "📤 Send to Gemini" buttons
 */

const INJECTED_ATTR = "data-sys-injected";

// ── Context Guard ──────────────────────────────────────────────
function isContextValid() {
  try {
    return !!chrome.runtime?.id;
  } catch (_) {
    return false;
  }
}

function safeSendMessage(message) {
  return new Promise((resolve, reject) => {
    if (!isContextValid()) {
      showReloadBanner();
      reject(new Error("Extension context invalidated"));
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          const msg = chrome.runtime.lastError.message || "Unknown runtime error";
          if (msg.includes("invalidated") || msg.includes("Extension context")) {
            showReloadBanner();
          }
          reject(new Error(msg));
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      showReloadBanner();
      reject(err);
    }
  });
}

let reloadBannerShown = false;
function showReloadBanner() {
  if (reloadBannerShown) return;
  reloadBannerShown = true;

  const banner = document.createElement('div');
  banner.id = 'fb-reload-banner';
  banner.innerHTML = `
    <span>⚠️ PromptAgent extension đã được cập nhật. Vui lòng <strong>reload trang này</strong> (F5) để tiếp tục.</span>
    <button onclick="location.reload()" style="
      margin-left: 12px; padding: 6px 16px; background: #fff; color: #1a1a1a;
      border: none; border-radius: 20px; font-weight: 600; cursor: pointer;
      font-size: 13px;
    ">↻ Reload</button>
  `;
  Object.assign(banner.style, {
    position: 'fixed', top: '0', left: '0', right: '0', zIndex: '999999',
    padding: '12px 20px', background: '#ff6b35', color: '#fff',
    fontFamily: "'Google Sans', Inter, sans-serif", fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    animation: 'fbSlideDown 0.3s ease-out'
  });

  const style = document.createElement('style');
  style.textContent = `@keyframes fbSlideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`;
  document.head.appendChild(style);
  document.body.appendChild(banner);
  console.warn('[FB Flow] Extension context invalidated — reload banner shown.');
}

const UI_STYLES = `
  .sys-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin: 4px;
    padding: 6px 12px;
    background: #242424;
    color: #F5F5F5;
    border: 1px solid #333333;
    border-radius: 100px;
    font-family: 'Google Sans', Inter, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    position: relative;
  }
  .sys-btn:hover { 
    background: #333333; 
    border-color: #444444;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  }
  .sys-btn:active { 
    transform: translateY(1px) scale(0.98); 
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }
  .sys-btn.done { 
    background: #EBEBEB; 
    color: #121212; 
    border: 1px solid #EBEBEB; 
    pointer-events: none; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.05); 
    transform: none;
  }

  /* ── Base button (medium — default) ───────────────── */
  .sys-act-btn {
    position: absolute;
    /* top/left injected dynamically */
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 50%;
    padding: 8px;
    font-size: 0;
    line-height: 0;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    pointer-events: none; /* block clicks when invisible */
  }
  .sys-act-btn svg {
    width: 18px;
    height: 18px;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ── Small variant (grid items < 200px) ─────────── */
  .sys-act-btn.sys-btn-sm {
    padding: 5px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  .sys-act-btn.sys-btn-sm svg {
    width: 12px;
    height: 12px;
  }

  /* ── Large variant (containers > 400px) ─────────── */
  .sys-act-btn.sys-btn-lg {
    padding: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .sys-act-btn.sys-btn-lg svg {
    width: 22px;
    height: 22px;
  }

  /* ── Interaction states ──────────────────────────── */
  .sys-act-btn.hovered {
    opacity: 0.9;
    transform: scale(1);
    pointer-events: auto; /* clickable when hovered */
  }
  .sys-act-btn:hover {
    background: rgba(0, 0, 0, 1);
    opacity: 1 !important;
    transform: scale(1.1) !important;
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
    border-color: rgba(255,255,255,0.3);
  }
  .sys-act-btn:active {
    transform: scale(0.95) !important;
  }
  .sys-act-btn.done {
    background: #ffffff;
    color: #000000;
    border-color: #ffffff;
    opacity: 1 !important;
    transform: scale(1) !important;
    pointer-events: none;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
  .sys-act-btn:hover svg {
    transform: scale(1.1);
  }

  .sys-toast {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(20px) scale(0.95);
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(8px);
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.1);
    font-family: 'Google Sans', Inter, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.2px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.3);
    z-index: 99999;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }
  .sys-toast.show { 
    opacity: 1; 
    transform: translateX(-50%) translateY(0) scale(1); 
  }
`;

function showToast(msg, ms = 3500) {
  const shadow = getShadowRoot();
  if (!shadow) return;
  let t = shadow.querySelector(".sys-toast");
  if (!t) { 
    t = document.createElement("div"); 
    t.className = "sys-toast"; 
    shadow.appendChild(t); 
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove("show"), ms);
}

// ── Robust Element Finder ──────────────────────────────────────
/**
 * Finds an element by trying multiple strategies in order.
 * Returns the first match.
 */
function findElement(strategies) {
  for (const fn of strategies) {
    try {
      const el = fn();
      if (el) return el;
    } catch (_) {}
  }
  return null;
}

/**
 * Polls for an element with requestAnimationFrame.
 */
function waitFor(strategies, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = () => {
      const el = findElement(strategies);
      if (el) return resolve(el);
      if (Date.now() - t0 > timeout) return reject(new Error("Element not found"));
      requestAnimationFrame(poll);
    };
    poll();
  });
}

// ── Prompt Input Strategies ────────────────────────────────────
const PROMPT_STRATEGIES = [
  // Strategy 1: contenteditable div with prompt-related placeholder
  () => {
    const divs = document.querySelectorAll('div[contenteditable="true"]');
    for (const d of divs) {
      const ph = d.getAttribute("data-placeholder") || d.getAttribute("aria-placeholder") || "";
      if (ph.length > 0) return d;
    }
    return null;
  },
  // Strategy 2: contenteditable with role=textbox
  () => document.querySelector('div[contenteditable="true"][role="textbox"]'),
  // Strategy 3: any contenteditable div inside a prompt/input area
  () => document.querySelector('[class*="prompt"] div[contenteditable="true"]'),
  () => document.querySelector('[class*="input"] div[contenteditable="true"]'),
  // Strategy 4: textarea fallback (some Flow versions use textarea)
  () => {
    const tas = document.querySelectorAll("textarea");
    for (const ta of tas) {
      // Pick the one with a prompt-like placeholder or the largest one
      const ph = ta.placeholder || "";
      if (ph.includes("prompt") || ph.includes("tạo") || ph.includes("Describe") || ph.includes("Enter")) return ta;
    }
    // Last resort: pick the visible textarea
    for (const ta of tas) {
      if (ta.offsetHeight > 0 && ta.offsetWidth > 0) return ta;
    }
    return null;
  },
  // Strategy 5: generic contenteditable div (bottom of page, near submit button)
  () => {
    const divs = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
    // Pick the one closest to the bottom of the viewport
    return divs.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0] || null;
  }
];

// ── Submit Button Strategies ───────────────────────────────────
const SUBMIT_STRATEGIES = [
  // Strategy 1 (Primary): Google Symbols icon "arrow_forward" — the actual Generate button
  () => {
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      if (icon.textContent.trim() === 'arrow_forward') {
        // The button is the icon itself or a parent <button>
        return icon.closest('button') || icon;
      }
    }
    return null;
  },
  () => document.querySelector('button[aria-label*="Send"]'),
  () => document.querySelector('button[aria-label*="send"]'),
  () => document.querySelector('button[aria-label*="Submit"]'),
  () => document.querySelector('button[aria-label*="Generate"]'),
  () => document.querySelector('button[type="submit"]'),
  // Fallback: circular button near the bottom of the page
  () => {
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      const rect = btn.getBoundingClientRect();
      if (rect.top > window.innerHeight - 100 && rect.width < 60 && rect.height < 60) {
        return btn;
      }
    }
    return null;
  }
];

// ── Message Listener (guarded) ─────────────────────────────────
try {
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "EXECUTE_PROMPT") {
      executePrompt(req.payload)
        .then(() => sendResponse({ success: true }))
        .catch(err => {
          sendResponse({ success: false, error: err.message });
        });
      return true; // async
    }
  });
} catch (_) {
  console.warn('[FB Flow] Cannot register message listener — context invalidated.');
}

/**
 * Fill the prompt and optionally trigger generation.
 * Delegates actual injection to content_flow_main.js (MAIN world) via postMessage.
 */
async function executePrompt(payload) {
  const { prompt, autoSubmit } = payload;
  if (!prompt) throw new Error("No prompt");

  // Wait for the prompt input to exist in DOM first
  try {
    await waitFor(PROMPT_STRATEGIES, 8000);
  } catch (_) {
    throw new Error("Prompt input not found on page");
  }

  // Ensure MAIN world script is injected on-demand
  await ensureMainWorldScript();

  // Send message to MAIN world script
  const resultPromise = waitForMainWorldResult("prompt", 30000);

  window.postMessage({
    type: "sys_cmd_req",
    prompt: prompt,
    autoSubmit: !!autoSubmit
  }, "*");

  // Wait for confirmation from MAIN world
  try {
    const result = await resultPromise;

    if (result?.prompt?.success) {
      if (autoSubmit) {
        if (result.autoSubmitSuccess) {
          showToast(`🚀 Prompt injected & generating!`, 4000);
        } else {
          showToast(`✅ Prompt injected. Generate button not found — click manually.`, 5000);
        }
      } else {
        showToast(`✅ Prompt injected! Press Generate.`, 4000);
      }
    } else {
      showToast("⚠️ Prompt injection may be incomplete. Please check manually.", 5000);
    }
  } catch (err) {
    showToast("⚠️ Timeout waiting for response. Check prompt manually.", 4000);
  }
}

/**
 * Wait for a result message from the MAIN world script.
 */
function waitForMainWorldResult(expectedAction, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error(`MAIN world timeout for action: ${expectedAction}`));
    }, timeout);

    function handler(event) {
      if (event.source !== window) return;
      const data = event.data;
      if (data?.type === "sys_cmd_res" && data?.action === expectedAction) {
        clearTimeout(timer);
        window.removeEventListener("message", handler);
        resolve(data);
      }
    }

    window.addEventListener("message", handler);
  });
}

// Global listener for credit usage reporting from MAIN world
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (data?.type === "sys_report_usage") {
    safeSendMessage({
      action: "RECORD_USAGE",
      cost: data.cost,
      actionType: data.actionType
    }).catch(err => console.warn("[FB Flow] Failed to report usage:", err.message));
  }
});

// ── Old applySettings removed — now handled by content_flow_main.js (MAIN world) ──

// ── On-demand MAIN World Script Injection ──────────────────────
let mainScriptInjected = false;

function ensureMainWorldScript() {
  // Script is now auto-injected via manifest (world: MAIN).
  // Check the guard flag set by content_flow_main.js itself.
  if (mainScriptInjected || window.__reactContextSyncLoaded) {
    mainScriptInjected = true;
    return Promise.resolve();
  }

  return safeSendMessage({ action: "INJECT_MAIN_SCRIPT" })
    .then((res) => {
      if (res?.success) {
        mainScriptInjected = true;
        return new Promise(resolve => setTimeout(resolve, 250));
      } else {
        throw new Error(res?.error || "Injection failed");
      }
    });
}


// ── Reverse Flow: Absolute Overlay ─────────────────────────────
let overlayContainer = null;
let activeMedia = null;
let activeBtn = null;
let shadowRootNode = null;

function getShadowRoot() {
  if (!shadowRootNode) {
    const host = document.createElement("div");
    host.style.position = "absolute";
    host.style.top = "0";
    host.style.left = "0";
    host.style.width = "100%";
    host.style.height = "100%";
    host.style.pointerEvents = "none";
    // Lower z-index so it stays behind sticky prompt inputs (which usually have z-index > 1000)
    host.style.zIndex = "999"; 
    
    shadowRootNode = host.attachShadow({ mode: "closed" });
    
    const styleEl = document.createElement("style");
    styleEl.textContent = UI_STYLES;
    shadowRootNode.appendChild(styleEl);

    document.documentElement.appendChild(host);
  }
  return shadowRootNode;
}

function getOverlay() {
  if (!overlayContainer) {
    const shadow = getShadowRoot();
    overlayContainer = document.createElement("div");
    shadow.appendChild(overlayContainer);
  }
  return overlayContainer;
}

function isUnfinishedMedia(el) {
  try {
    const style = window.getComputedStyle(el);
    if (style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none') return true;
    if (style.filter && style.filter.includes('blur')) return true; // often used for placeholders
  } catch (e) {}

  if (el.tagName.toLowerCase() === 'img') {
     // A 1x1 or very small natural image stretched over a large container is typically a skeleton/placeholder
     if (el.naturalWidth > 0 && (el.naturalWidth < 100 || el.naturalHeight < 100)) return true;
     
     // Data URIs or SVGs used as placeholders
     const src = el.src || "";
     if (src.startsWith('data:image/') && src.length < 50000) return true; // Very small data URI is likely a placeholder
     if (src.includes('placeholder')) return true;
  }

  let current = el;
  // Increase depth to search for progress indicators
  for (let i = 0; i < 6; i++) {
    if (!current) break;
    
    if (current.getAttribute('aria-busy') === 'true') return true;
    if (current.getAttribute('role') === 'progressbar') return true;
    if (current.hasAttribute('disabled')) return true;
    
    // Look for SVG spinners in the parent container
    if (current.parentElement) {
      const svgs = current.parentElement.querySelectorAll('svg');
      for (const svg of svgs) {
         if (svg.querySelector('animateTransform') || svg.querySelector('circle[stroke-dasharray]')) return true;
         const svgClass = (typeof svg.className === 'string' ? svg.className : (svg.className?.baseVal || '')).toLowerCase();
         if (svgClass.includes('spinner') || svgClass.includes('progress') || svgClass.includes('loading')) return true;
      }
    }
    
    const className = (typeof current.className === 'string' ? current.className : '').toLowerCase();
    if (
      className.includes('loading') || 
      className.includes('generating') || 
      className.includes('spinner') || 
      className.includes('progress') ||
      className.includes('skeleton') ||
      className.includes('shimmer') ||
      className.includes('placeholder') ||
      className.includes('pending')
    ) {
      return true;
    }
    
    const tagName = current.tagName.toLowerCase();
    if (tagName.includes('progress') || tagName.includes('spinner')) {
      return true;
    }
    
    // Kiểm tra text "Generating" hoặc "Đang tạo" trong container nhỏ gần đó
    if (current.parentElement) {
       const textContent = current.parentElement.textContent.toLowerCase();
       if (textContent.length < 100 && (textContent.includes('generating') || textContent.includes('đang tạo') || textContent.includes('creating'))) {
          return true;
       }
    }
    
    current = current.parentElement;
  }
  return false;
}

// We no longer scan all media on an interval.
// Instead, we use event delegation to detect when the user hovers over an image/video.

/** Race a promise against a timeout. Rejects with 'timeout' if exceeded. */
function withTimeout(promise, ms, label = '') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout(${ms}ms)${label ? ': ' + label : ''}`)), ms)
    )
  ]);
}

async function handleCaptureClick(e) {
  e.stopPropagation();
  if (!activeBtn || !activeMedia) return;
  
  const mediaEl = activeMedia;
  const type = mediaEl.tagName.toLowerCase() === 'video' ? 'video' : 'image';
  const originalHtml = activeBtn.innerHTML;

  // Show spinner
  activeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.3"/><path d="M12 2v4" stroke-width="3"/></svg>`;

  // Safety net: always restore button after 15s regardless
  const safetyTimer = setTimeout(() => {
    if (activeBtn) {
      activeBtn.classList.remove('done');
      activeBtn.innerHTML = originalHtml;
    }
  }, 15000);

  const restoreBtn = () => {
    clearTimeout(safetyTimer);
    if (activeBtn) {
      activeBtn.classList.remove('done');
      activeBtn.innerHTML = originalHtml;
    }
  };

  try {
    // 1. Capture media with a 10s timeout
    let dataUrl;
    if (type === "video") {
      dataUrl = captureVideoFrame(mediaEl);
    } else {
      dataUrl = await withTimeout(captureImage(mediaEl), 10000, 'captureImage');
    }

    // 2. Copy to clipboard with a 3s timeout (non-blocking — failure is OK)
    try {
      const res = await withTimeout(fetch(dataUrl), 3000, 'fetch-dataUrl');
      const blob = await res.blob();
      const pngBlob = new Blob([await blob.arrayBuffer()], { type: "image/png" });
      await withTimeout(
        navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]),
        3000, 'clipboard.write'
      );
    } catch (clipErr) {
      // Clipboard failure is non-critical — continue to send
      console.warn("[FB Flow] Clipboard copy skipped:", clipErr.message);
    }

    // 3. Forward to Gemini with a 12s timeout
    try {
      const res = await withTimeout(
        safeSendMessage({
          action: "FORWARD_TO_GEMINI",
          payload: {
            mediaDataUrl: dataUrl,
            mediaType: type,
            analysisPrompt: "Phân tích chi tiết: composition, lighting, color, và đề xuất cải thiện."
          }
        }),
        12000, 'FORWARD_TO_GEMINI'
      );

      clearTimeout(safetyTimer);

      if (res?.success) {
        if (activeBtn) {
          activeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
          activeBtn.classList.add("done");
        }
        showToast("📤 Media sent! Press Ctrl+V in Gemini to paste.", 5000);
        setTimeout(restoreBtn, 3000);
      } else {
        restoreBtn();
        showToast("⚠️ Could not reach Gemini tab. Is it open?", 4000);
      }
    } catch (sendErr) {
      restoreBtn();
      console.warn("[FB Flow] Send to Gemini error:", sendErr.message);
      if (!reloadBannerShown) {
        showToast("⚠️ Extension error. Reload trang (F5) để tiếp tục.", 5000);
      }
    }
  } catch (err) {
    restoreBtn();
    console.warn("[FB Flow] Capture error:", err.message);
    showToast("❌ Media capture failed. Try another image.", 3000);
  }
}



function getSharedButton() {
  if (!activeBtn) {
    const overlay = getOverlay();
    activeBtn = document.createElement("button");
    activeBtn.className = "sys-act-btn";
    activeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L9.5 9.5L2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="currentColor"/><path d="M17 3l3 3M4 18l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    
    activeBtn.addEventListener("click", handleCaptureClick);
    
    // Keep button visible while hovering over it
    activeBtn.addEventListener("mouseenter", () => {
      activeBtn.classList.add("hovered");
    });
    activeBtn.addEventListener("mouseleave", () => {
      activeBtn.classList.remove("hovered");
      activeMedia = null;
    });

    overlay.appendChild(activeBtn);
  }
  return activeBtn;
}

function updateActiveButtonPosition() {
  if (!activeMedia || !activeBtn) return;
  if (!document.documentElement.contains(activeMedia)) {
    activeBtn.classList.remove("hovered");
    activeMedia = null;
    return;
  }
  
  const rect = activeMedia.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    activeBtn.classList.remove("hovered");
    activeMedia = null;
    return;
  }

  const top = rect.top + window.scrollY;
  const left = rect.left + window.scrollX;
  
  let offset = 8;
  activeBtn.classList.remove("sys-btn-sm", "sys-btn-lg");
  if (rect.width < 200) {
    activeBtn.classList.add("sys-btn-sm");
    offset = 4;
  } else if (rect.width > 400) {
    activeBtn.classList.add("sys-btn-lg");
    offset = 12;
  }
  
  activeBtn.style.top = `${top + offset}px`;
  activeBtn.style.left = `${left + offset}px`;
}

// Event delegation for hover detection
document.addEventListener("mouseover", (e) => {
  const target = e.target;
  if (!target) return;
  
  // Bỏ qua nếu đang hover vào vùng chứa thanh prompt input
  const promptInput = document.querySelector('div[contenteditable="true"]');
  if (promptInput) {
    const promptContainer = promptInput.closest('form, [class*="bottom"], [class*="footer"], [role="region"], [class*="prompt"]') || promptInput.parentElement;
    if (promptContainer && promptContainer.contains(target)) {
      if (activeMedia && activeBtn) {
         activeBtn.classList.remove("hovered");
         activeMedia = null;
      }
      return;
    }
  }

  const tagName = target.tagName?.toLowerCase();
  if (tagName === 'img' || tagName === 'video') {
    const rect = target.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) return;
    
    // Bỏ qua ảnh làm background (quá lớn)
    if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8) return;
    
    if (tagName === 'img' && (!target.complete || target.naturalWidth === 0)) return;
    if (tagName === 'video' && target.readyState === 0) return;
    
    const src = target.src || "";
    if (src.includes("favicon") || src.includes("icon") || src.includes("logo") || src.includes("avatar")) return;
    
    if (isUnfinishedMedia(target)) return;
    
    // Valid media hovered
    activeMedia = target;
    const btn = getSharedButton();
    btn.classList.add("hovered");
    updateActiveButtonPosition();
  } else {
    // If hovering outside media
    if (activeMedia && activeBtn) {
       // Check if mouse is interacting with our shadow DOM
       if (shadowRootNode && target === shadowRootNode.host) {
          // Handled by button's own mouseenter/mouseleave
       } else {
          activeBtn.classList.remove("hovered");
          activeMedia = null;
       }
    }
  }
}, { passive: true });

window.addEventListener('scroll', updateActiveButtonPosition, { passive: true });
window.addEventListener('resize', updateActiveButtonPosition, { passive: true });

async function captureImage(img) {
  try {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.toDataURL("image/png");
  } catch (_) {
    const res = await fetch(img.src);
    const blob = await res.blob();
    return new Promise((ok, fail) => {
      const r = new FileReader();
      r.onloadend = () => ok(r.result);
      r.onerror = fail;
      r.readAsDataURL(blob);
    });
  }
}

function captureVideoFrame(vid) {
  const c = document.createElement("canvas");
  c.width = vid.videoWidth || 640;
  c.height = vid.videoHeight || 360;
  c.getContext("2d").drawImage(vid, 0, 0);
  return c.toDataURL("image/png");
}

function init() {
  if (!isContextValid()) {
    console.warn('[FB Flow] Extension context already invalid at init. Aborting.');
    return;
  }
  // Initialization complete. Everything is event-driven now.
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

