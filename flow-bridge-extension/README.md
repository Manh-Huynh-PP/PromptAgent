# PromptAgent Flow Bridge Extension

The **PromptAgent Flow Bridge** is a Chrome extension designed to seamlessly integrate Google Flow (Labs) with Gemini. It orchestrates a split-view workspace, enabling users to instantly send generated media (images and videos) from Google Flow directly to a Gemini chat for analysis or iteration.

## Features

- **One-Click Media Injection**: Automatically adds a magical "Send to Gemini" (✨) button to all generated assets in Google Flow.
- **Robust DOM Scanning**: Utilizes a highly optimized hybrid `MutationObserver` + Polling mechanism to ensure buttons are reliably rendered across dynamic Single Page Application (SPA) navigation and delayed media loads.
- **Responsive UI**: The injection button dynamically scales (sm/md/lg) based on the asset container's width, maintaining perfect aesthetics regardless of grid sizing or detail view.
- **Cross-Origin Bridge**: Securely passes base64 encoded images or video metadata from the `labs.google/fx` context to the `gemini.google.com` context via Chrome's messaging API and Clipboard APIs.

## Installation (Developer Mode)

Since this extension is optimized for a specific workflow, you can install it manually:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the `flow-bridge-extension` directory.

> **Note**: To remove the "Disable developer mode extensions" popup, consider publishing this extension to the Chrome Web Store as a private/unlisted extension.

## Usage

1. Open [Google Flow](https://labs.google/fx/tools/flow).
2. Generate an image or video asset.
3. Hover over the asset in the grid view, or open the asset in the detail view.
4. Click the ✨ button that appears in the top right corner of the media.
5. The extension will grab the media and prompt you to send it to an active Gemini session for analysis.

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history, including the recent robust v3.0.0 updates.

## Technical Details

- **Manifest V3**: Compliant with the latest Chrome extension standards.
- **Main World Injection**: Uses `content_flow_main.js` injected into the `MAIN` world to access React/SPA internal states if necessary, bridging data to `content_flow.js` in the `ISOLATED` world.
- **Cross-Origin Messaging**: Uses `chrome.runtime` background workers to proxy messages between Google Flow and Gemini tabs.
