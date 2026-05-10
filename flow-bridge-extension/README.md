# PromptAgent Flow Bridge Extension

**PromptAgent Flow Bridge** là một tiện ích mở rộng trên Chrome được thiết kế để kết nối liền mạch Google Flow (Labs) với Gemini. Tiện ích này tạo ra một không gian làm việc chia đôi màn hình (split-view), cho phép người dùng gửi trực tiếp hình ảnh và video từ Google Flow sang giao diện chat của Gemini để phân tích hoặc chỉnh sửa tức thì.

[Tiếng Việt](#tiếng-việt) | [English](#english)

---

## Tiếng Việt

### 🚀 Tính năng

- **Tiêm nút gửi (One-Click Media Injection)**: Tự động thêm nút "Gửi đến Gemini" (✨) vào tất cả các ảnh/video được tạo ra trong Google Flow.
- **Quét DOM mạnh mẽ (Robust DOM Scanning)**: Sử dụng cơ chế quét lai (Hybrid) kết hợp `MutationObserver` và `Polling` để đảm bảo các nút luôn hiển thị chính xác khi chuyển trang hoặc tải ảnh chậm trong môi trường Single Page Application (SPA).
- **Giao diện Responsive**: Nút tiêm (✨) tự động điều chỉnh kích thước (sm/md/lg) dựa trên chiều rộng của vùng chứa media, đảm bảo tính thẩm mỹ tuyệt đối trên cả chế độ hiển thị lưới (grid) hay chế độ xem chi tiết (detail).
- **Cầu nối Cross-Origin**: Truyền an toàn chuỗi base64 của ảnh hoặc dữ liệu video từ tên miền `labs.google/fx` sang `gemini.google.com` thông qua Chrome Messaging API và Clipboard APIs.

### 🛠️ Cài đặt (Developer Mode)

Vì extension này được tối ưu cho một luồng công việc cụ thể, bạn có thể cài đặt thủ công:

1. Tải về hoặc clone kho lưu trữ này về máy cục bộ.
2. Mở Google Chrome và truy cập đường dẫn `chrome://extensions/`.
3. Bật **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
4. Nhấn nút **Tải tiện ích đã giải nén (Load unpacked)**.
5. Chọn thư mục `flow-bridge-extension`.

> **Lưu ý**: Để tắt popup cảnh báo "Tắt tiện ích ở chế độ dành cho nhà phát triển" của Chrome, bạn có thể xem xét phát hành (publish) extension này lên Chrome Web Store dưới dạng Unlisted/Private.

### 📖 Cách sử dụng

1. Mở [Google Flow](https://labs.google/fx/tools/flow).
2. Tạo một hình ảnh hoặc video bất kỳ.
3. Di chuột qua ảnh/video trong chế độ lưới (grid), hoặc click mở vào chế độ xem chi tiết (detail).
4. Nhấp vào nút ✨ xuất hiện ở góc trên bên phải của media.
5. Extension sẽ "bắt" ảnh/video và tự động hỏi để gửi tới phiên chat Gemini đang mở của bạn.

### ⚙️ Chi tiết Kỹ thuật

- **Manifest V3**: Tuân thủ các tiêu chuẩn bảo mật và hiệu năng mới nhất của Chrome extension.
- **Main World Injection**: Sử dụng `content_flow_main.js` tiêm vào môi trường `MAIN` để truy cập trạng thái DOM/React nội bộ của Flow nếu cần, rồi truyền ngược lại cho `content_flow.js` ở môi trường `ISOLATED`.
- **Cross-Origin Messaging**: Sử dụng `background.js` (service worker) để làm proxy trung chuyển tin nhắn bảo mật giữa tab Google Flow và tab Gemini.

---

## English

The **PromptAgent Flow Bridge** is a Chrome extension designed to seamlessly integrate Google Flow (Labs) with Gemini. It orchestrates a split-view workspace, enabling users to instantly send generated media (images and videos) from Google Flow directly to a Gemini chat for analysis or iteration.

### 🚀 Features

- **One-Click Media Injection**: Automatically adds a magical "Send to Gemini" (✨) button to all generated assets in Google Flow.
- **Robust DOM Scanning**: Utilizes a highly optimized hybrid `MutationObserver` + Polling mechanism to ensure buttons are reliably rendered across dynamic Single Page Application (SPA) navigation and delayed media loads.
- **Responsive UI**: The injection button dynamically scales (sm/md/lg) based on the asset container's width, maintaining perfect aesthetics regardless of grid sizing or detail view.
- **Cross-Origin Bridge**: Securely passes base64 encoded images or video metadata from the `labs.google/fx` context to the `gemini.google.com` context via Chrome's messaging API and Clipboard APIs.

### 🛠️ Installation (Developer Mode)

Since this extension is optimized for a specific workflow, you can install it manually:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the `flow-bridge-extension` directory.

> **Note**: To remove the "Disable developer mode extensions" popup, consider publishing this extension to the Chrome Web Store as a private/unlisted extension.

### 📖 Usage

1. Open [Google Flow](https://labs.google/fx/tools/flow).
2. Generate an image or video asset.
3. Hover over the asset in the grid view, or open the asset in the detail view.
4. Click the ✨ button that appears in the top right corner of the media.
5. The extension will grab the media and prompt you to send it to an active Gemini session for analysis.

### ⚙️ Technical Details

- **Manifest V3**: Compliant with the latest Chrome extension standards.
- **Main World Injection**: Uses `content_flow_main.js` injected into the `MAIN` world to access React/SPA internal states if necessary, bridging data to `content_flow.js` in the `ISOLATED` world.
- **Cross-Origin Messaging**: Uses `chrome.runtime` background workers to proxy messages between Google Flow and Gemini tabs.

## Version History
See [CHANGELOG.md](CHANGELOG.md) for detailed version history.
