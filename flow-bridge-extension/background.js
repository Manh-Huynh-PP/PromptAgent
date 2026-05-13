/**
 * background.js — PromptAgent Flow Bridge v3.5
 * Service Worker: Split View orchestrator, Message Relay
 *
 * Core responsibilities:
 *   - OPEN_SPLIT_VIEW: creates Gemini + Flow side-by-side windows
 *   - FORWARD_TO_FLOW / FORWARD_TO_GEMINI: relay messages between tabs
 *   - INJECT_MAIN_SCRIPT: on-demand MAIN world injection for Flow
 *   - Tab lifecycle: track active pairs, clean up on tab close
 */

let activePairs = [];

chrome.storage.local.get(['activePairs'], (result) => {
  if (result.activePairs) {
    activePairs = result.activePairs;
  }
});

function saveActivePairs() {
  chrome.storage.local.set({ activePairs });
}

// ── Tab Lifecycle ────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  const index = activePairs.findIndex(p => p.gemTabId === tabId || p.flowTabId === tabId);
  if (index !== -1) {
    console.log("[FB BG] Cleaning up active pair due to tab close:", activePairs[index]);
    activePairs.splice(index, 1);
    saveActivePairs();
  }
});

// ── Message Router ────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ── Split View Launch ──
  if (request.action === "OPEN_SPLIT_VIEW") {
    sendResponse({ success: true });
    openSplitView(request.gemUrl, request.flowUrl, request.projectId);
    return false;
  }

  // ── Credit Tracking ──
  if (request.action === "RECORD_USAGE") {
    const cost = parseInt(request.cost, 10) || 0;
    const senderTabId = sender?.tab?.id;

    if (cost <= 0) {
      sendResponse({ success: true });
      return false;
    }

    // Always read fresh from storage to avoid SW race condition
    chrome.storage.local.get(['activePairs', 'credits_by_project'], (res) => {
      const pairs = res.activePairs || activePairs;
      // Sync in-memory cache if it was empty
      if (activePairs.length === 0 && pairs.length > 0) activePairs = pairs;

      const pair = senderTabId
        ? pairs.find(p => p.gemTabId === senderTabId || p.flowTabId === senderTabId)
        : null;
      const projectId = pair?.projectId || "__global__";

      const map = res.credits_by_project || {};
      map[projectId] = (map[projectId] || 0) + cost;
      chrome.storage.local.set({ credits_by_project: map }, () => {
        console.log(`[FB BG] ✅ RECORD_USAGE: +${cost} → project "${projectId}" (tab ${senderTabId})`);
        sendResponse({ success: true });
      });
    });

    return true; // async
  }


  if (request.action === "GET_ACTIVE_PAIRS") {
    sendResponse({ activePairs });
    return false;
  }

  if (request.action === "FOCUS_TABS") {
    const { gemTabId, flowTabId } = request;
    sendResponse({ success: true });
    restoreSplitLayout(gemTabId, flowTabId);
    return false;
  }

  if (request.action === "INJECT_MAIN_SCRIPT") {
    const tabId = request.tabId || sender?.tab?.id;
    if (!tabId) {
      sendResponse({ success: false, error: "No tabId" });
      return false;
    }
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content_flow_main.js"],
      world: "MAIN"
    }).then(() => {
      console.log("[FB BG] ✅ MAIN world script injected on-demand for tab:", tabId);
      sendResponse({ success: true });
    }).catch(err => {
      console.error("[FB BG] MAIN script injection failed:", err);
      sendResponse({ success: false, error: err.message });
    });
    return true; // async
  }

  if (request.action === "FORWARD_TO_FLOW") {
    // Always read fresh from storage to avoid SW race condition
    chrome.storage.local.get(['activePairs'], (result) => {
      const pairs = result.activePairs || activePairs;
      const senderTabId = sender?.tab?.id;
      const pair = pairs.find(p => p.gemTabId === senderTabId);
      if (pair) {
        console.log("[FB BG] → Flow (Paired):", request.payload?.prompt?.substring(0, 50));
        chrome.tabs.sendMessage(pair.flowTabId, { action: "EXECUTE_PROMPT", payload: request.payload }, (res) => {
          if (chrome.runtime.lastError) {
            console.warn("[FB BG] Send error (Paired Flow):", chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse(res);
          }
        });
      } else {
        console.log("[FB BG] → Flow (Fallback):", request.payload?.prompt?.substring(0, 50));
        forwardToTab("*://labs.google/fx/tools/flow/*", "EXECUTE_PROMPT", request.payload, sendResponse);
      }
    });
    return true; // async
  }

  if (request.action === "FORWARD_TO_GEMINI") {
    // Always read fresh from storage to avoid SW race condition
    chrome.storage.local.get(['activePairs'], (result) => {
      const pairs = result.activePairs || activePairs;
      const senderTabId = sender?.tab?.id;
      const pair = pairs.find(p => p.flowTabId === senderTabId);
      if (pair) {
        console.log("[FB BG] → Gemini (Paired) tabId:", pair.gemTabId, "type:", request.payload?.mediaType);
        chrome.tabs.sendMessage(pair.gemTabId, { action: "EXECUTE_ANALYSIS", payload: request.payload }, (res) => {
          if (chrome.runtime.lastError) {
            console.warn("[FB BG] Send error (Paired Gemini):", chrome.runtime.lastError.message);
            // Paired tab failed — try fallback
            forwardToTab("*://gemini.google.com/*", "EXECUTE_ANALYSIS", request.payload, sendResponse);
          } else {
            sendResponse(res);
          }
        });
      } else {
        console.log("[FB BG] → Gemini (Fallback) — no pair for flowTabId:", senderTabId);
        forwardToTab("*://gemini.google.com/*", "EXECUTE_ANALYSIS", request.payload, sendResponse);
      }
    });
    return true; // async
  }

});

/**
 * Forward a message to the first tab matching a URL pattern.
 * Uses chrome.tabs.query with a URL pattern for reliable detection
 * (requires host_permissions; avoids the need to filter t.url manually).
 */
function forwardToTab(urlPattern, action, payload, sendResponse) {
  // Match both https and http in a single query
  const queryPatterns = [
    urlPattern.replace(/^\*:\/\//, "https://"),
    urlPattern.replace(/^\*:\/\//, "http://")
  ];

  console.log("[FB BG] forwardToTab querying:", queryPatterns);

  chrome.tabs.query({ url: queryPatterns }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.warn("[FB BG] No tab found for:", queryPatterns);
      sendResponse({ success: false, error: "No matching tab found" });
      return;
    }
    sendToFoundTab(tabs[0], action, payload, sendResponse);
  });
}

function sendToFoundTab(tab, action, payload, sendResponse) {
  console.log("[FB BG] Found tab:", tab.id, tab.url?.substring(0, 80));
  chrome.windows.update(tab.windowId, { focused: true });
  chrome.tabs.update(tab.id, { active: true });

  // Brief delay to let the tab receive focus before sending message
  setTimeout(() => {
    chrome.tabs.sendMessage(tab.id, { action, payload }, (res) => {
      if (chrome.runtime.lastError) {
        console.warn("[FB BG] sendToFoundTab error:", chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log("[FB BG] ✅ Message delivered:", action);
        sendResponse({ success: true, ...res });
      }
    });
  }, 300);
}



// ── Split View: 2 side-by-side windows ────────────
async function getScreenBounds() {
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

  try {
    const allWins = await chrome.windows.getAll({ windowTypes: ["normal"] });
    if (allWins.length > 0) {
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

  console.log("[FB BG] Using default screen size 1920x1080");
  return { left: 0, top: 0, width: 1920, height: 1080 };
}

/**
 * Restore split-view layout for existing tabs without reopening them.
 * Repositions Gem window to left half, Flow window to right half.
 */
async function restoreSplitLayout(gemTabId, flowTabId) {
  try {
    const screen = await getScreenBounds();
    const halfW = Math.floor(screen.width / 2);

    const [gemTab, flowTab] = await Promise.all([
      chrome.tabs.get(gemTabId).catch(() => null),
      chrome.tabs.get(flowTabId).catch(() => null)
    ]);

    if (!gemTab || !flowTab) {
      console.warn("[FB BG] restoreSplitLayout: one or both tabs missing.");
      return;
    }

    // Activate both tabs in their respective windows
    await Promise.all([
      chrome.tabs.update(gemTabId, { active: true }).catch(() => {}),
      chrome.tabs.update(flowTabId, { active: true }).catch(() => {})
    ]);

    // Reposition windows side-by-side
    await Promise.all([
      chrome.windows.update(gemTab.windowId, {
        left: screen.left,
        top: screen.top,
        width: halfW,
        height: screen.height,
        state: "normal"
      }).catch(() => {}),
      chrome.windows.update(flowTab.windowId, {
        left: screen.left + halfW,
        top: screen.top,
        width: halfW,
        height: screen.height,
        state: "normal"
      }).catch(() => {})
    ]);

    // Focus Flow last so it's on top (Gemini is passive viewer)
    setTimeout(() => {
      chrome.windows.update(gemTab.windowId, { focused: true }).catch(() => {});
      setTimeout(() => {
        chrome.windows.update(flowTab.windowId, { focused: true }).catch(() => {});
      }, 150);
    }, 300);

    console.log("[FB BG] ✅ Split layout restored:", gemTabId, "<->", flowTabId);
  } catch (err) {
    console.error("[FB BG] restoreSplitLayout error:", err);
  }
}

async function openSplitView(gemUrl, flowUrl, projectId) {
  try {
    const screen = await getScreenBounds();
    const halfW = Math.floor(screen.width / 2);

    console.log("[FB BG] Creating Split View:", {
      screen: `${screen.width}x${screen.height}`,
      halfW,
      gemUrl: gemUrl.substring(0, 50),
      flowUrl: flowUrl.substring(0, 50)
    });

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

    const gemTabId = gemWin.tabs && gemWin.tabs.length > 0 ? gemWin.tabs[0].id : null;
    const flowTabId = flowWin.tabs && flowWin.tabs.length > 0 ? flowWin.tabs[0].id : null;
    
    if (gemTabId && flowTabId) {
      activePairs = activePairs.filter(p => p.projectId !== projectId);
      
      activePairs.push({ gemTabId, flowTabId, projectId });
      saveActivePairs();
      console.log("[FB BG] Registered active pair:", gemTabId, flowTabId, projectId);
    }

    setTimeout(() => {
      chrome.windows.update(gemWin.id, { focused: true }, () => {
        setTimeout(() => {
          chrome.windows.update(flowWin.id, { focused: true });
        }, 200);
      });
    }, 500);

  } catch (err) {
    console.error("[FB BG] Split View error:", err);
    try {
      chrome.tabs.create({ url: gemUrl });
      chrome.tabs.create({ url: flowUrl, active: true });
    } catch (e2) {
      console.error("[FB BG] Tab fallback also failed:", e2);
    }
  }
}
