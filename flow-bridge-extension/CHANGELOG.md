# Changelog

All notable changes to the PromptAgent Flow Bridge extension will be documented in this file.

## [3.0.0] - 2026-05-10

### Added
- **Responsive UI System (✨)**: The "Send to Gemini" analyze button now dynamically scales (sm/md/lg) based on the width of the media container, ensuring an aesthetically pleasing look when users change the grid size.
- **ResizeObserver Integration**: The button size updates instantly when the container's dimensions change.
- **Hybrid DOM Scanning**: Implemented a robust scanning mechanism combining `MutationObserver` (for instant response) with a 3-second `setInterval` polling fallback to catch delayed renders or stuck animations without impacting performance.

### Fixed
- **Detail Page Injection**: Replaced `closest('div')` logic with a safer DOM traversal (while loop) checking for minimum dimensions (>= 80px), ensuring the button injects correctly on asset detail views where nested wrappers previously caused issues.
- **Media Loading Race Conditions**: Added verification for `getBoundingClientRect()` returning 0, allowing the script to properly retry attaching the button when media tags exist but haven't been fully painted by the browser.

## [2.0.0]
*(Previous versions prior to the 3.0.0 overhaul)*
- Initial release of the split-view orchestration between Gemini GEM and Google Flow.
- Clipboard and message passing infrastructure.
