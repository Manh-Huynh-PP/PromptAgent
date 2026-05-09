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

  /**
   * Inject prompt text into Flow's React-controlled input.
   * Uses native DOM events to trigger Slate.js/React's built-in handlers instantly.
   */
  async function injectPrompt(text) {
    const input = findPromptInput();
    if (!input) {
      console.error(TAG, "❌ Prompt input not found");
      return { success: false, error: "Input not found" };
    }

    console.log(TAG, "Found input:", input.tagName, input.className?.substring(0, 60));
    
    // Ensure the input is focused so Slate registers it as active
    input.focus();

    // Select all existing content using execCommand so the new text replaces it instantly.
    // Using selectNodeContents manually destroys Slate's internal block structure, causing React removeChild errors.
    try {
      document.execCommand("selectAll", false, null);
    } catch (e) {
      console.warn(TAG, "selectAll failed", e);
    }

    let injected = false;
    let method = "";

    // Method 1: Native Paste Event
    // Slate.js heavily relies on the onPaste event to parse and insert data safely.
    console.log(TAG, "Attempting Native Paste event...");
    try {
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      input.dispatchEvent(pasteEvent);
      
      // If default was prevented, React/Slate handled the paste successfully
      if (pasteEvent.defaultPrevented) {
        console.log(TAG, "✅ Native paste handled by framework.");
        injected = true;
        method = "native_paste";
      }
    } catch (e) {
      console.warn(TAG, "Native paste failed:", e);
    }

    // Method 2: InputEvent + execCommand
    // If paste didn't work (or wasn't prevented), we fallback to simulating user typing.
    if (!injected) {
      console.log(TAG, "Attempting InputEvent + execCommand...");
      try {
        input.dispatchEvent(new InputEvent("beforeinput", {
          inputType: "insertText",
          data: text,
          bubbles: true,
          cancelable: true,
        }));
        document.execCommand("insertText", false, text);
        input.dispatchEvent(new InputEvent("input", {
          inputType: "insertText",
          data: text,
          bubbles: true,
          cancelable: true,
        }));
        console.log(TAG, "✅ execCommand sequence completed.");
        injected = true;
        method = "execcommand";
      } catch (e) {
        console.warn(TAG, "execCommand failed:", e);
      }
    }

    // Force cursor to end
    try {
      const sel = window.getSelection();
      sel.collapseToEnd();
    } catch (e) {}

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

  // ── Message Handler (from isolated-world content_flow.js) ──────

  window.addEventListener("message", async (event) => {
    // Only accept messages from the same window (our isolated-world script)
    if (event.source !== window) return;
    const data = event.data;
    if (!data || !data.type?.startsWith("FB_")) return;

    console.log(TAG, "Received:", data.type);

    if (data.type === "FB_INJECT_PROMPT") {
      let promptResult = { success: false };

      if (data.prompt) {
        promptResult = await injectPrompt(data.prompt);
      }

      window.postMessage(
        {
          type: "FB_RESULT",
          action: "prompt",
          prompt: promptResult,
        },
        "*"
      );
    }
  });

  console.log(TAG, "✅ MAIN world script loaded (React Fiber access enabled, Settings injection removed)");
})();
