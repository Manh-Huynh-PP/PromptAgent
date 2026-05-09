/**
 * background.js — PromptAgent Flow Bridge v3.1
 * Service Worker: Split View, Message Relay
 *
 * FIX: Split View — 3 root causes resolved:
 *   1. Popup closes on focus loss → use fire-and-forget pattern
 *   2. Sequential await blocks service worker → use Promise.all
 *   3. Screen dimensions wrong → use chrome.system.display API
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "OPEN_SPLIT_VIEW") {
    // Fire-and-forget: respond IMMEDIATELY before popup closes
    sendResponse({ success: true });
    // Then do the work asynchronously
    openSplitView(request.gemUrl, request.flowUrl);
    return false; // sync response already sent
  }

  if (request.action === "FORWARD_TO_FLOW") {
    console.log("[FB BG] → Flow:", request.payload?.prompt?.substring(0, 50));
    forwardToTab("*://labs.google/fx/tools/flow/*", "EXECUTE_PROMPT", request.payload, sendResponse);
    return true; // async
  }

  if (request.action === "FORWARD_TO_GEMINI") {
    console.log("[FB BG] → Gemini:", request.payload?.mediaType);
    forwardToTab("*://gemini.google.com/*", "EXECUTE_ANALYSIS", request.payload, sendResponse);
    return true; // async
  }
});

/**
 * Forward a message to the first tab matching a URL pattern.
 * Uses chrome.tabs.query first, then falls back to manual URL matching.
 */
function forwardToTab(urlPattern, action, payload, sendResponse) {
  // Extract a simple string for manual URL matching
  // e.g., "*://labs.google/fx/tools/flow/*" → "labs.google/fx/tools/flow"
  const urlFragment = urlPattern.replace(/^\*:\/\//, "").replace(/\/?\*$/, "");
  console.log("[FB BG] Looking for tab matching:", urlFragment);

  chrome.tabs.query({}, (allTabs) => {
    // First try: exact URL pattern match
    let tab = allTabs.find(t => {
      try {
        return t.url && t.url.includes(urlFragment);
      } catch (_) { return false; }
    });

    if (!tab) {
      console.warn("[FB BG] No tab found for:", urlFragment, "| Total tabs:", allTabs.length);
      sendResponse({ success: false, error: "No matching tab found" });
      return;
    }

    console.log("[FB BG] Found tab:", tab.id, tab.url?.substring(0, 60));
    chrome.windows.update(tab.windowId, { focused: true });
    chrome.tabs.update(tab.id, { active: true });

    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action, payload }, (res) => {
        if (chrome.runtime.lastError) {
          console.warn("[FB BG] Send error:", chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log("[FB BG] ✅ Message delivered:", action);
          sendResponse({ success: true, ...res });
        }
      });
    }, 300);
  });
}

/**
 * Get screen dimensions reliably.
 * Strategy: chrome.system.display → fallback to last focused window → hardcoded defaults.
 */
async function getScreenBounds() {
  // Strategy 1: system.display API (requires permission)
  try {
    const displays = await chrome.system.display.getInfo();
    if (displays && displays.length > 0) {
      const primary = displays.find(d => d.isPrimary) || displays[0];
      const wa = primary.workArea;
      console.log("[FB BG] Screen from display API:", wa);
      return { left: wa.left, top: wa.top, width: wa.width, height: wa.height };
    }
  } catch (e) {
    console.warn("[FB BG] system.display unavailable:", e.message);
  }

  // Strategy 2: Find the largest existing window as a reference
  try {
    const allWins = await chrome.windows.getAll({ windowTypes: ["normal"] });
    if (allWins.length > 0) {
      // Pick the largest window (likely maximized)
      const biggest = allWins.reduce((a, b) =>
        (a.width * a.height) > (b.width * b.height) ? a : b
      );
      if (biggest.width >= 800) {
        console.log("[FB BG] Screen from largest window:", biggest.width, "x", biggest.height);
        return {
          left: biggest.left || 0,
          top: biggest.top || 0,
          width: biggest.width,
          height: biggest.height
        };
      }
    }
  } catch (_) {}

  // Strategy 3: Hardcoded defaults
  console.log("[FB BG] Using default screen size 1920x1080");
  return { left: 0, top: 0, width: 1920, height: 1080 };
}

/**
 * Open side-by-side Split View.
 * Uses Promise.all to create both windows concurrently.
 */
async function openSplitView(gemUrl, flowUrl) {
  try {
    const screen = await getScreenBounds();
    const halfW = Math.floor(screen.width / 2);

    console.log("[FB BG] Creating Split View:", {
      screen: `${screen.width}x${screen.height}`,
      halfW,
      gemUrl: gemUrl.substring(0, 50),
      flowUrl: flowUrl.substring(0, 50)
    });

    // Create BOTH windows concurrently with Promise.all
    // This prevents the service worker from stalling between creates
    const [gemWin, flowWin] = await Promise.all([
      chrome.windows.create({
        url: gemUrl,
        left: screen.left,
        top: screen.top,
        width: halfW,
        height: screen.height,
        focused: false,
        type: "normal"
      }),
      chrome.windows.create({
        url: flowUrl,
        left: screen.left + halfW,
        top: screen.top,
        width: halfW,
        height: screen.height,
        focused: true,
        type: "normal"
      })
    ]);

    console.log("[FB BG] ✅ Split View created:", gemWin.id, "|", flowWin.id);

    // Bring Gemini window to front briefly then switch to Flow
    // This ensures both windows are visible and not stacked
    setTimeout(() => {
      chrome.windows.update(gemWin.id, { focused: true }, () => {
        setTimeout(() => {
          chrome.windows.update(flowWin.id, { focused: true });
        }, 200);
      });
    }, 500);

  } catch (err) {
    console.error("[FB BG] Split View error:", err);
    // Fallback: open as tabs in the current window
    try {
      chrome.tabs.create({ url: gemUrl });
      chrome.tabs.create({ url: flowUrl, active: true });
    } catch (e2) {
      console.error("[FB BG] Tab fallback also failed:", e2);
    }
  }
}
