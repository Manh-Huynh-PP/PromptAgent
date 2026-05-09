/**
 * content_flow_main.js — PromptAgent Flow Bridge v4
 * Injected on: labs.google/fx/tools/flow/* (world: MAIN)
 *
 * Runs in the PAGE's own JavaScript context (not isolated world).
 * This gives direct access to React Fiber internals (__reactFiber$, __reactProps$)
 * allowing us to invoke React event handlers directly — bypassing isTrusted checks.
 *
 * Communication with content_flow.js (isolated world) via window.postMessage().
 */

(function () {
  "use strict";

  const TAG = "[FB Main]";

  // ── React Fiber Utilities ──────────────────────────────────────

  /**
   * Find the React Props object on a DOM element.
   * React attaches props as `__reactProps$<random>` on DOM nodes.
   */
  function getReactProps(el) {
    if (!el) return null;
    const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
    return key ? el[key] : null;
  }

  /**
   * Find the React Fiber node on a DOM element.
   */
  function getReactFiber(el) {
    if (!el) return null;
    const key = Object.keys(el).find(
      (k) =>
        k.startsWith("__reactFiber$") ||
        k.startsWith("__reactInternalInstance$")
    );
    return key ? el[key] : null;
  }

  /**
   * Walk up the Fiber tree to find a state node with a specific handler.
   */
  function findFiberHandler(fiber, handlerName, maxDepth = 15) {
    let current = fiber;
    let depth = 0;
    while (current && depth < maxDepth) {
      if (current.memoizedProps && typeof current.memoizedProps[handlerName] === "function") {
        return current.memoizedProps[handlerName];
      }
      // Also check stateNode
      if (current.stateNode && typeof current.stateNode[handlerName] === "function") {
        return current.stateNode[handlerName];
      }
      current = current.return;
      depth++;
    }
    return null;
  }

  // ── Prompt Input Finder ────────────────────────────────────────

  function findPromptInput() {
    // Strategy 1: Slate.js editor (Google Flow uses this)
    const slateEditor = document.querySelector('[data-slate-editor="true"]');
    if (slateEditor && isVisible(slateEditor)) return slateEditor;

    // Strategy 2: contenteditable with placeholder
    const divs = document.querySelectorAll('div[contenteditable="true"]');
    for (const d of divs) {
      const ph =
        d.getAttribute("data-placeholder") ||
        d.getAttribute("aria-placeholder") ||
        "";
      if (ph.length > 0) return d;
    }

    // Strategy 3: role=textbox (usually Lexical or Draft.js)
    const textboxes = document.querySelectorAll('div[role="textbox"]');
    for (const tb of textboxes) {
      if (isVisible(tb)) return tb;
    }

    // Strategy 4: any visible contenteditable near the bottom
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

    // Strategy 5: textarea fallback
    const tas = document.querySelectorAll("textarea");
    for (const ta of tas) {
      if (isVisible(ta)) return ta;
    }

    return null;
  }

  // ── Prompt Injection ───────────────────────────────────────────

  // Rate limiting & dedup: prevent rapid successive or duplicate injections
  let lastInjectTime = 0;
  let lastPromptHash = "";
  const MIN_INJECT_INTERVAL = 3000; // 3s minimum between injections

  /**
   * Human-like random delay (adds jitter so timing is not perfectly uniform).
   */
  function humanDelay(base = 100, jitter = 80) {
    return delay(base + Math.random() * jitter);
  }

  /**
   * Simple hash for dedup — prevents the same prompt from being injected twice.
   */
  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return String(h);
  }

  /**
   * Inject prompt text into Flow's React-controlled input.
   * Primary: execCommand (works without document focus).
   * Fallback: clipboard paste (requires focus).
   */
  async function injectPrompt(text) {
    // Dedup: reject identical prompt within short window
    const hash = simpleHash(text);
    const now = Date.now();
    if (hash === lastPromptHash && now - lastInjectTime < MIN_INJECT_INTERVAL) {
      console.warn(TAG, "⚠️ Duplicate prompt rejected (same content within 3s)");
      return { success: true, method: "dedup_skipped" };
    }
    lastPromptHash = hash;

    // Rate limit check
    if (now - lastInjectTime < MIN_INJECT_INTERVAL) {
      console.warn(TAG, "⚠️ Rate limited — waiting...");
      await delay(MIN_INJECT_INTERVAL - (now - lastInjectTime));
    }
    lastInjectTime = Date.now();

    const input = findPromptInput();
    if (!input) {
      console.error(TAG, "❌ Prompt input not found");
      return { success: false, error: "Input not found" };
    }

    console.log(TAG, "Found input:", input.tagName, input.className?.substring(0, 60));
    
    // Step 1: Focus with human-like delay
    input.focus();
    await humanDelay(80, 60);

    // Step 2: Select all existing content
    try {
      document.execCommand("selectAll", false, null);
    } catch (e) {
      console.warn(TAG, "selectAll failed", e);
    }
    await humanDelay(50, 40);

    let injected = false;
    let method = "";

    // Method 1: beforeinput + execCommand + input (Slate.js requires all 3)
    // - beforeinput: Slate intercepts this to update its internal model
    // - execCommand: Actually modifies the DOM
    // - input: Signals completion to React reconciliation
    console.log(TAG, "Attempting execCommand injection...");
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
        console.log(TAG, "✅ execCommand + Slate events completed.");
        injected = true;
        method = "execcommand";
      }
    } catch (e) {
      console.warn(TAG, "execCommand failed:", e);
    }

    // Method 2: Clipboard Paste fallback (requires document focus)
    if (!injected && document.hasFocus()) {
      console.log(TAG, "Attempting clipboard paste fallback...");
      try {
        await navigator.clipboard.writeText(text);
        await humanDelay(30, 20);

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
          console.log(TAG, "✅ Clipboard paste accepted.");
          injected = true;
          method = "clipboard_paste";
        }
      } catch (e) {
        console.warn(TAG, "Clipboard paste failed:", e);
      }
    }

    // Method 3: Direct innerHTML (last resort)
    if (!injected) {
      console.log(TAG, "Falling back to direct innerHTML...");
      input.innerHTML = `<span data-slate-string="true">${text}</span>`;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      injected = true;
      method = "innerhtml";
    }

    // Force cursor to end
    try {
      const sel = window.getSelection();
      sel.collapseToEnd();
    } catch (e) {}

    // Final human-like pause before returning
    await humanDelay(100, 80);

    console.log(TAG, `✅ Prompt injection completed via ${method}`);
    return { success: injected, method };
  }

  // ── Utils ─────────────────────────────────────────

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  /**
   * Check if an element is visible on screen.
   */
  function isVisible(el) {
    if (!el || el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  /**
   * Find the submit/generate button on Flow.
   * Looks for the arrow_forward icon nearest to the active prompt input,
   * ensuring we click the correct button for the current mode (Image/Video).
   */
  function findSubmitButton() {
    // Find the currently active prompt input first
    const activeInput = findPromptInput();
    
    // Collect all visible arrow_forward buttons
    const candidates = [];
    const icons = document.querySelectorAll('i.google-symbols');
    for (const icon of icons) {
      if (icon.textContent.trim() === 'arrow_forward') {
        const btn = icon.closest('button');
        const target = btn && isVisible(btn) ? btn : (isVisible(icon) ? icon : null);
        if (target) candidates.push(target);
      }
    }

    if (candidates.length === 0) {
      // Fallback: aria-label selectors
      const selectors = ['button[aria-label*="Send"]', 'button[aria-label*="Generate"]', 'button[aria-label*="Submit"]'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && isVisible(el)) return el;
      }
      return null;
    }

    if (candidates.length === 1) return candidates[0];

    // Multiple candidates: pick the one sharing the closest common ancestor with the input,
    // or the one nearest by vertical position.
    if (activeInput) {
      const inputRect = activeInput.getBoundingClientRect();
      candidates.sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        const aDist = Math.abs(aRect.top - inputRect.top) + Math.abs(aRect.left - inputRect.left);
        const bDist = Math.abs(bRect.top - inputRect.top) + Math.abs(bRect.left - inputRect.left);
        return aDist - bDist;
      });
    }

    return candidates[0];
  }

  // ── Message Handler (from isolated-world content_flow.js) ──────

  window.addEventListener("message", async (event) => {
    // Only accept messages from the same window (our isolated-world script)
    if (event.source !== window) return;
    const data = event.data;
    if (!data || !data.type?.startsWith("FB_")) return;

    console.log(TAG, "Received:", data.type);

    if (data.type === "FB_INJECT_PROMPT") {
      let promptResult = { success: false };
      let autoSubmitSuccess = false;

      if (data.prompt) {
        promptResult = await injectPrompt(data.prompt);
      } else {
        console.error(TAG, "❌ Received empty prompt payload in FB_INJECT_PROMPT");
        promptResult = { success: false, error: "Empty prompt payload" };
      }

      // Auto-submit: click the Generate button from MAIN world (React context)
      if (data.autoSubmit && promptResult.success) {
        await humanDelay(1200, 500); // Human-like pause before clicking Generate
        const submitBtn = findSubmitButton();
        if (submitBtn) {
          try {
            // Flow's onClick handler checks event.isTrusted which is always false
            // for programmatic events. Use Proxy to intercept and return true.
            const rect = submitBtn.getBoundingClientRect();
            const nativeEvent = new MouseEvent('click', {
              bubbles: true, cancelable: true, view: window,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            });

            // Create a trusted-looking event via Proxy
            const createTrustedProxy = (evt) => new Proxy(evt, {
              get(target, prop) {
                if (prop === 'isTrusted') return true;
                if (prop === 'nativeEvent') return createTrustedProxy(target);
                if (prop === 'isDefaultPrevented') return () => false;
                if (prop === 'isPropagationStopped') return () => false;
                if (prop === 'persist') return () => {};
                const val = Reflect.get(target, prop);
                return typeof val === 'function' ? val.bind(target) : val;
              }
            });

            const trustedEvent = createTrustedProxy(nativeEvent);

            // Call React onClick directly via fiber props
            const props = getReactProps(submitBtn);
            if (props && typeof props.onClick === 'function') {
              props.onClick(trustedEvent);
              console.log(TAG, "✅ Auto-submit via React onClick with trusted Proxy");
              autoSubmitSuccess = true;
            } else {
              // Walk up to find onClick on a parent fiber
              const fiber = getReactFiber(submitBtn);
              const handler = fiber ? findFiberHandler(fiber, 'onClick') : null;
              if (handler) {
                handler(trustedEvent);
                console.log(TAG, "✅ Auto-submit via Fiber handler with trusted Proxy");
                autoSubmitSuccess = true;
              } else {
                // Last resort: dispatch event on the element
                submitBtn.dispatchEvent(nativeEvent);
                console.log(TAG, "⚠️ Auto-submit fallback: dispatchEvent (may not work)");
                autoSubmitSuccess = true;
              }
            }
          } catch (e) {
            console.error(TAG, "❌ Auto-submit click failed:", e);
          }
        } else {
          console.warn(TAG, "⚠️ Submit button not found for auto-submit");
        }
      }

      window.postMessage(
        {
          type: "FB_RESULT",
          action: "prompt",
          prompt: promptResult,
          autoSubmitSuccess,
        },
        "*"
      );
    }
  });

  console.log(TAG, "✅ MAIN world script loaded (React Fiber access enabled, Settings injection removed)");
})();
