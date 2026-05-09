/**
 * content_gemini.js — PromptAgent Flow Bridge v3.2
 * Injected on: gemini.google.com
 *
 * FIX v3.2:
 *   - extractBridgeJSON uses balanced-brace counting instead of broken regex
 *   - scan() pierces shadow DOM of code-block web components
 *   - Added extensive logging for debugging
 */

const MARKER = "flow_bridge_prompt";
const TAGGED = "data-fb-tagged";

// ── Styles ─────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById("fb-css")) return;
  const s = document.createElement("style");
  s.id = "fb-css";
  s.textContent = `
    .fb-flow-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      margin-right: 8px;
      margin-bottom: 8px;
      background: #242424;
      color: #F5F5F5;
      border: 1px solid #333333;
      border-radius: 100px;
      font-family: 'Google Sans', Inter, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .fb-flow-btn:hover { 
      background: #333333; 
      border-color: #444444;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    .fb-flow-btn:active { 
      transform: translateY(1px) scale(0.98); 
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    .fb-flow-btn.sent { 
      background: #EBEBEB; 
      color: #121212; 
      border: 1px solid #EBEBEB; 
      pointer-events: none; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transform: none;
    }
    .fb-flow-btn svg {
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .fb-flow-btn:hover svg {
      transform: translateX(2px);
    }
    .fb-flow-btn.sent svg {
      transform: scale(1.1);
    }

    .fb-toast-gem {
      position: fixed;
      bottom: 32px;
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
    .fb-toast-gem.show { 
      opacity: 1; 
      transform: translateX(-50%) translateY(0) scale(1); 
    }
  `;
  document.head.appendChild(s);
}

function showToast(msg, ms = 4000) {
  let t = document.querySelector(".fb-toast-gem");
  if (!t) { t = document.createElement("div"); t.className = "fb-toast-gem"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove("show"), ms);
}

// ── JSON Detection (v3.3 — extract all payloads) ──────────────
/**
 * Extract ALL bridge JSON payloads from text using balanced-brace matching.
 * Supports multiple JSON blocks within the same text element.
 */
function extractAllBridgeJSON(text) {
  const results = [];
  let searchIdx = 0;
  
  while (true) {
    const markerIdx = text.indexOf("flow_bridge_prompt", searchIdx);
    if (markerIdx === -1) break;

    // Walk backwards from marker to find the opening {
    let start = -1;
    let depth = 0;
    for (let i = markerIdx; i >= 0; i--) {
      if (text[i] === '}') depth++;
      if (text[i] === '{') {
        if (depth === 0) { start = i; break; }
        depth--;
      }
    }

    if (start === -1) {
      searchIdx = markerIdx + 1;
      continue;
    }

    // Walk forward from start to find the matching closing }
    depth = 0;
    let end = -1;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++;
      if (text[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          const candidate = text.substring(start, i + 1);
          try {
            const o = JSON.parse(candidate);
            if (o?._type === MARKER) {
              console.log("[FB Gem] ✅ Found bridge JSON:", o.prompt_text?.substring(0, 60));
              results.push(o);
            }
          } catch (e) {
            console.warn("[FB Gem] JSON parse failed:", e.message);
          }
          break;
        }
      }
    }

    if (end !== -1) {
      searchIdx = end + 1;
    } else {
      searchIdx = markerIdx + 1;
    }
  }

  return results;
}

// ── Text Extraction (handles shadow DOM) ───────────────────────
/**
 * Get all text from an element, including shadow DOM content.
 */
function deepText(el) {
  let text = "";

  // Light DOM text
  text += el.textContent || "";

  // Pierce shadow DOM
  if (el.shadowRoot) {
    text += " " + el.shadowRoot.textContent;
  }

  // Check child code-block and other web components with shadow roots
  const shadowHosts = el.querySelectorAll("code-block, message-content, model-response");
  for (const host of shadowHosts) {
    if (host.shadowRoot) {
      text += " " + host.shadowRoot.textContent;
    }
  }

  return text;
}

// ── Scan Responses ─────────────────────────────────────────────
function scan() {
  // Target code elements directly.
  const candidates = document.querySelectorAll("code-block, pre");

  for (const el of candidates) {
    if (el.getAttribute(TAGGED)) continue;

    // Skip if this element contains another candidate to avoid processing wrappers
    if (el.querySelector("code-block, pre")) continue;

    const text = deepText(el);
    if (!text.includes("flow_bridge_prompt")) continue;

    const payloads = extractAllBridgeJSON(text);
    if (payloads.length === 0) {
      el.setAttribute(TAGGED, "invalid"); // mark so we don't keep re-parsing invalid json
      continue;
    }

    // Tag the specific code block AND its children to prevent re-processing
    el.setAttribute(TAGGED, "1");
    el.querySelectorAll("*").forEach(c => c.setAttribute(TAGGED, "1"));

    // Inject a button for each payload!
    payloads.forEach((payload, index) => {
      injectFlowButton(el, payload, index + 1, payloads.length);
    });
    console.log(`[FB Gem] ✅ Injected ${payloads.length} button(s) for code block`);
  }
}

function injectFlowButton(el, payload, index = 1, total = 1) {
  // Normalize: ensure payload has "prompt" field for content_flow.js
  const normalizedPayload = {
    ...payload,
    prompt: payload.prompt_text || payload.prompt
  };
  console.log("[FB Gem] Injecting button, prompt:", normalizedPayload.prompt?.substring(0, 60));

  const btn = document.createElement("button");
  btn.className = "fb-flow-btn";
  
  const label = total > 1 ? `Send to Flow (${index}/${total})` : `Send to Flow`;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg> ${label}`;

  btn.addEventListener("click", () => {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Sent!`;
    btn.classList.add("sent");

    chrome.runtime.sendMessage({
      action: "FORWARD_TO_FLOW",
      payload: normalizedPayload
    }, (res) => {
      if (chrome.runtime.lastError) {
        console.warn("[FB Gem] Send error:", chrome.runtime.lastError.message);
        showToast("⚠️ Extension error. Reload extension.", 5000);
        resetBtn();
        return;
      }
      if (res?.success) {
        showToast("✅ Prompt sent to Flow!");
        // Reset after 3s so user can re-send if needed
        setTimeout(resetBtn, 3000);
      } else {
        showToast("⚠️ Flow tab not found. Launch project first.", 5000);
        resetBtn();
      }
    });

    function resetBtn() {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg> ${label}`;
      btn.classList.remove("sent");
    }
  });

  // Insert button RIGHT AFTER the code block element
  if (el.parentElement) {
    let container = el.nextElementSibling;
    if (!container || !container.classList.contains("fb-btn-container")) {
      container = document.createElement("div");
      container.className = "fb-btn-container";
      container.style.display = "flex";
      container.style.gap = "8px";
      container.style.flexWrap = "wrap";
      container.style.justifyContent = "flex-end";
      container.style.width = "100%";
      container.style.marginTop = "16px";
      container.style.marginBottom = "16px";
      container.style.paddingRight = "40px";
      el.parentElement.insertBefore(container, el.nextSibling);
    }
    container.appendChild(btn);
  } else {
    el.appendChild(btn);
  }
}

// ── Gemini Input Finder ────────────────────────────────────────
function findGeminiInput() {
  const strategies = [
    () => document.querySelector("rich-textarea .ql-editor"),
    () => document.querySelector("rich-textarea [contenteditable='true']"),
    () => document.querySelector(".ql-editor[contenteditable='true']"),
    () => document.querySelector("[contenteditable='true'][role='textbox']"),
    () => document.querySelector(".input-area [contenteditable='true']"),
    () => document.querySelector("div[contenteditable='true']"),
    () => document.querySelector("textarea"),
  ];
  for (const fn of strategies) {
    try { const el = fn(); if (el) return el; } catch (_) {}
  }
  return null;
}

// ── Receive Media from Flow ────────────────────────────────────
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "EXECUTE_ANALYSIS") {
    console.log("[FB Gem] EXECUTE_ANALYSIS:", req.payload?.mediaType);
    handleAnalysis(req.payload);
    sendResponse({ success: true });
    return true;
  }
});

async function handleAnalysis(payload) {
  const { mediaDataUrl, mediaType, analysisPrompt } = payload;
  const prompt = analysisPrompt || "Phân tích hình ảnh này: composition, lighting, color, đề xuất cải thiện.";

  // Step 1: Copy image to clipboard is now handled in content_flow.js to ensure user gesture focus!
  // But we still receive mediaDataUrl to try automatic injection.

  // Step 2: Focus input and prepare for paste
  await new Promise(r => setTimeout(r, 600));
  const input = findGeminiInput();

  if (input) {
    input.focus();
    
    // Step 3: Try to automatically paste the image using a synthetic ClipboardEvent
    let autoPasted = false;
    if (mediaType === "image" && mediaDataUrl) {
      try {
        await new Promise(r => setTimeout(r, 200)); // give React a moment to process the text
        const res = await fetch(mediaDataUrl);
        const blob = await res.blob();
        const uniqueFilename = `flow_image_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
        const file = new File([blob], uniqueFilename, { type: "image/png" });
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        // Method A: Dispatch synthetic paste event directly to the input
        const pasteEvent = new ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          clipboardData: dataTransfer
        });
        input.dispatchEvent(pasteEvent);
        autoPasted = true;
        console.log("[FB Gem] Dispatched synthetic paste event with image.");

        // Method B: Find file input and trigger change (backup)
        if (!autoPasted) {
          setTimeout(() => {
            const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
            const imgInput = fileInputs.find(i => i.accept && i.accept.includes('image')) || fileInputs[0];
            if (imgInput) {
               imgInput.files = dataTransfer.files;
               imgInput.dispatchEvent(new Event('change', { bubbles: true }));
               console.log("[FB Gem] Injected file into file input.");
            }
          }, 100);
        }

      } catch (err) {
        console.warn("[FB Gem] Synthetic paste failed:", err);
      }
    }

    if (autoPasted) {
       showToast("✅ Image auto-pasted successfully!", 5000);
    } else {
       showToast("📝 Please press Ctrl+V to paste the image!", 5000);
    }
  } else {
    showToast("⚠️ Chat input not found for pasting.", 5000);
  }
}

// ── Observer ───────────────────────────────────────────────────
let tid;
const obs = new MutationObserver(() => {
  clearTimeout(tid);
  tid = setTimeout(scan, 800);
});

function init() {
  console.log("[FB Gem] v3.2 loaded on:", window.location.href);
  injectStyles();
  scan();
  obs.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
