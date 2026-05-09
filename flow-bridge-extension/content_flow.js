/**
 * content_flow.js — PromptAgent Flow Bridge v3
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

const INJECTED_ATTR = "data-fb-injected";

// ── CSS Injection ──────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById("fb-styles")) return;
  const style = document.createElement("style");
  style.id = "fb-styles";
  style.textContent = `
    .fb-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin: 4px;
      padding: 6px 12px;
      background: #7C9CFF;
      color: #fff;
      border: none;
      border-radius: 100px;
      font-family: 'Google Sans', Inter, sans-serif;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 150ms, transform 80ms;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      z-index: 9999;
      position: relative;
    }
    .fb-btn:hover { opacity: 0.85; }
    .fb-btn:active { transform: scale(0.96); }
    .fb-btn.done { background: #3FB950; pointer-events: none; opacity: 0.7; }

    .fb-media-container {
      position: relative !important;
    }
    .fb-analyze-btn {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(26, 31, 36, 0.75);
      color: #E6EDF3;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 6px;
      padding: 6px 12px;
      font-family: 'Google Sans', Inter, sans-serif;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      z-index: 100;
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.2s, background 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .fb-media-container:hover .fb-analyze-btn {
      opacity: 1;
    }
    .fb-analyze-btn:hover {
      background: rgba(26, 31, 36, 0.95);
    }
    .fb-analyze-btn.done {
      background: #3FB950;
      opacity: 1;
      pointer-events: none;
    }

    .fb-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      background: #1A1F24;
      color: #E6EDF3;
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid #2A2F36;
      font-family: 'Google Sans', Inter, sans-serif;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      z-index: 99999;
      opacity: 0;
      transition: opacity 250ms, transform 250ms;
    }
    .fb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(style);
}

function showToast(msg, ms = 3500) {
  let t = document.querySelector(".fb-toast");
  if (!t) { t = document.createElement("div"); t.className = "fb-toast"; document.body.appendChild(t); }
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
  () => document.querySelector('button[aria-label*="Send"]'),
  () => document.querySelector('button[aria-label*="send"]'),
  () => document.querySelector('button[aria-label*="Submit"]'),
  () => document.querySelector('button[aria-label*="Generate"]'),
  () => document.querySelector('button[type="submit"]'),
  // The circular arrow submit button at the bottom right of the input bar
  () => {
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      const rect = btn.getBoundingClientRect();
      // Bottom of page, small circular button
      if (rect.top > window.innerHeight - 100 && rect.width < 60 && rect.height < 60) {
        return btn;
      }
    }
    return null;
  }
];

// ── Message Listener ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "EXECUTE_PROMPT") {
    console.log("[FB Flow] EXECUTE_PROMPT received:", req.payload);
    executePrompt(req.payload)
      .then(() => sendResponse({ success: true }))
      .catch(err => {
        console.error("[FB Flow] Error:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async
  }
});

/**
 * Fill the prompt and optionally trigger generation.
 * Delegates actual injection to content_flow_main.js (MAIN world) via postMessage.
 */
async function executePrompt(payload) {
  const { prompt } = payload;
  if (!prompt) throw new Error("No prompt");

  console.log("[FB Flow] Delegating to MAIN world script...");
  console.log("[FB Flow] Prompt:", prompt.substring(0, 60));

  // Wait for the prompt input to exist in DOM first
  try {
    await waitFor(PROMPT_STRATEGIES, 8000);
  } catch (_) {
    throw new Error("Prompt input not found on page");
  }

  // Send message to MAIN world script
  const resultPromise = waitForMainWorldResult("prompt", 30000);

  window.postMessage({
    type: "FB_INJECT_PROMPT",
    prompt: prompt
  }, "*");

  // Wait for confirmation from MAIN world
  try {
    const result = await resultPromise;
    console.log("[FB Flow] MAIN world result:", result);

    if (result?.prompt?.success) {
      const method = result.prompt.method || "unknown";
      showToast(`✅ Prompt injected (${method})! Please verify and press Generate.`, 4000);
    } else {
      showToast("⚠️ Prompt injection may be incomplete. Please check manually.", 5000);
    }
  } catch (err) {
    console.warn("[FB Flow] MAIN world timeout, prompt may still work:", err.message);
    showToast("⚠️ Timeout waiting for response. Check prompt manually.", 4000);
  }

  console.log("[FB Flow] ✅ executePrompt completed.");
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
      if (data?.type === "FB_RESULT" && data?.action === expectedAction) {
        clearTimeout(timer);
        window.removeEventListener("message", handler);
        resolve(data);
      }
    }

    window.addEventListener("message", handler);
  });
}

// ── Old applySettings removed — now handled by content_flow_main.js (MAIN world) ──


// ── Reverse Flow: Scan Generated Media ─────────────────────────
function scanMedia() {
  // Flow renders generated images as <img> in the main grid area
  const imgs = document.querySelectorAll("img");
  for (const img of imgs) {
    if (img.getAttribute(INJECTED_ATTR)) continue;
    
    // Filter: skip tiny icons, logos, avatars
    const rect = img.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) continue;
    
    // Skip nav/header images
    const src = img.src || "";
    if (src.includes("favicon") || src.includes("icon") || src.includes("logo") || src.includes("avatar")) continue;

    img.setAttribute(INJECTED_ATTR, "true");
    addAnalyzeButton(img);
  }

  // Also check for video elements
  const videos = document.querySelectorAll("video");
  for (const vid of videos) {
    if (vid.getAttribute(INJECTED_ATTR)) continue;
    const rect = vid.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) continue;
    vid.setAttribute(INJECTED_ATTR, "true");
    addAnalyzeButton(vid, "video");
  }
}

function addAnalyzeButton(mediaEl, type = "image") {
  const btn = document.createElement("button");
  btn.className = "fb-analyze-btn";
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Gemini`;

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `⏳...`;

    try {
      let dataUrl;
      if (type === "video") {
        dataUrl = captureVideoFrame(mediaEl);
      } else {
        dataUrl = await captureImage(mediaEl);
      }

      // Copy to clipboard immediately in the Flow tab to ensure we have user gesture focus
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const pngBlob = new Blob([await blob.arrayBuffer()], { type: "image/png" });
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob })
        ]);
        console.log("[FB Flow] Image copied to clipboard successfully.");
      } catch (err) {
        console.warn("[FB Flow] Clipboard write failed:", err);
      }

      chrome.runtime.sendMessage({
        action: "FORWARD_TO_GEMINI",
        payload: {
          mediaDataUrl: dataUrl,
          mediaType: type,
          analysisPrompt: "Phân tích chi tiết: composition, lighting, color, và đề xuất cải thiện."
        }
      }, (res) => {
        if (res?.success) {
          btn.innerHTML = `✅ Sent`;
          btn.classList.add("done");
          showToast("📤 Media sent! Press Ctrl+V in Gemini to paste.", 5000);
          setTimeout(() => {
             btn.classList.remove("done");
             btn.innerHTML = originalHtml;
          }, 3000);
        } else {
          btn.innerHTML = originalHtml;
          showToast("⚠️ Send failed. Check Gemini tab.", 4000);
        }
      });
    } catch (err) {
      console.error("[FB Flow]", err);
      btn.innerHTML = originalHtml;
      showToast("❌ Media capture failed.", 3000);
    }
  });

  // Position button on the media element's container
  const container = mediaEl.closest("div") || mediaEl.parentElement;
  if (container) {
    container.classList.add("fb-media-container");
    container.appendChild(btn);
  }
}

async function captureImage(img) {
  // Try canvas first
  try {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.toDataURL("image/png");
  } catch (_) {
    // CORS: fetch the source directly
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

// ── Observer ───────────────────────────────────────────────────
let tid;
const obs = new MutationObserver(() => {
  clearTimeout(tid);
  tid = setTimeout(scanMedia, 1500);
});

function init() {
  console.log("[FB Flow] v3 loaded.");
  injectStyles();
  scanMedia();
  obs.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
