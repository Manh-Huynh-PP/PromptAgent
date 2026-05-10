# Google Flow Prompt Agent (PromptAgent)

Hệ thống Agent toàn diện chuyên dụng để xây dựng, quản lý và tự động hóa quy trình tạo Prompt chất lượng cao cho **Google Flow** (Veo 3.1 & Imagen 4/Nano Banana).

Dự án bao gồm 2 thành phần (Agent) riêng biệt, hỗ trợ lẫn nhau trong toàn bộ quy trình làm việc:
1. **IDE Prompt Agent (Core)**: Hệ thống AI Agent hoạt động trực tiếp trên môi trường IDE. Dùng để lên ý tưởng, cấu trúc prompt bằng các lệnh `/slash`, quản lý file lịch sử và versioning cục bộ.
2. **[PromptAgent Flow Bridge (Chrome Extension)](./flow-bridge-extension)**: Tiện ích mở rộng trên trình duyệt web, đóng vai trò là cầu nối giữa Google Flow và giao diện Gemini. Cung cấp nút "Gửi đến Gemini" (✨) trên các ảnh/video của Google Flow để chuyển thẳng sang Gemini phân tích.

[Tiếng Việt](#tiếng-việt) | [English](#english)

---

## Tiếng Việt

### 🚀 Tính năng chính
- **Cinematic DNA Formula**: Tự động cấu trúc prompt theo chuẩn 5 phần (Shot, Camera, Subject, Action, Style).
- **Identity Locking**: Cơ chế khóa đặc điểm nhân vật/sản phẩm để tránh biến dạng (morphing) khi tạo video.
- **Time-Series Versioning**: Quản lý phiên bản prompt theo ngày tháng, đảm bảo không mất dữ liệu lịch sử.
- **Bilingual Interface**: Thảo luận và phân tích bằng tiếng Việt, xuất prompt chuyên dụng bằng tiếng Anh.

### 🛠️ Hướng dẫn sử dụng (Commands)
Sử dụng các lệnh sau trong khung chat để kích hoạt các quy trình tự động:

- `/polish`: Chuẩn hóa prompt thô thành cấu trúc Google Flow chuyên nghiệp.
- `/concept`: Đề xuất 3 biến thể phong cách khác nhau cho một ý tưởng.
- `/ref`: Phân tích ảnh tham chiếu để tạo prompt Nano Banana tương ứng.
- `/animate`: Tạo video prompt với chuyển động camera từ ảnh gốc.
- `/storyboard`: Tạo kịch bản video phân đoạn kèm hiệu ứng âm thanh (SFX).

> [!TIP]
> **Khuyến khích**: Hãy sử dụng extension [Markdown-ext](https://github.com/manhhuynh-designer/Markdown-ext) để có trải nghiệm tốt nhất. Extension này giúp bạn xem trước định dạng Markdown và có nút "Copy" chuyên dụng để sao chép hoặc điều chỉnh prompt cực kỳ nhanh chóng.

### 📂 Quy tắc lưu trữ
Hệ thống tuân thủ nghiêm ngặt quy trình:
1. Dự án được lưu trong `Projects/` (đã được cấu hình `.gitignore` để bảo mật).
2. Mỗi ngày làm việc tạo ra một file mới `YYYY-MM-DD.md` (Clone if Outdated).
3. Mỗi file prompt đều chứa YAML Metadata để Agent dễ dàng truy xuất ngữ cảnh.

### 📚 Tài liệu tham khảo
Dự án này được xây dựng dựa trên các hướng dẫn chính thức từ Google Cloud:
- [Ultimate Prompting Guide for Nano Banana](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- [Ultimate Prompting Guide for Veo 3.1](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)

---

## English

A comprehensive Agent system designed to build, manage, and automate high-quality prompt workflows for **Google Flow** (Veo 3.1 & Imagen 4/Nano Banana).

This project consists of 2 distinct components (Agents) that complement each other throughout the workflow:
1. **IDE Prompt Agent (Core)**: An AI Agent system running directly in your IDE. Used for brainstorming, structuring prompts via `/slash` commands, and managing local version history.
2. **[PromptAgent Flow Bridge (Chrome Extension)](./flow-bridge-extension)**: A browser extension bridging Google Flow and the Gemini UI. It injects a magic "Send to Gemini" (✨) button on generated assets in Google Flow for instant analysis.

### 🚀 Key Features
- **Cinematic DNA Formula**: Automatically structures prompts according to the 5-part standard (Shot, Camera, Subject, Action, Style).
- **Identity Locking**: Mechanism to lock subject/product characteristics to prevent morphing in video generation.
- **Time-Series Versioning**: Manage prompt versions by date, ensuring no loss of historical data.
- **Bilingual Interface**: Discussion and analysis in Vietnamese, while outputting specialized prompts in English.

### 🛠️ Usage Instructions (Commands)
Use the following commands in the chat to trigger automated workflows:

- `/polish`: Standardize raw prompts into a professional Google Flow structure.
- `/concept`: Propose 3 different style variations for an idea.
- `/ref`: Analyze a reference image to generate a corresponding Nano Banana prompt.
- `/animate`: Create a video prompt with dynamic camera motion from a source image.
- `/storyboard`: Generate time-coded video prompts with sound effects (SFX).

> [!TIP]
> **Recommended**: Use the [Markdown-ext](https://github.com/manhhuynh-designer/Markdown-ext) extension for the best experience. It provides premium Markdown previews and dedicated "Copy" buttons for fast prompt adjustments.

### 📂 Storage Principles
The system strictly follows these procedures:
1. Projects are stored in `Projects/` (configured via `.gitignore` for privacy).
2. Each work day creates a new `YYYY-MM-DD.md` file (Clone if Outdated).
3. Every prompt file contains YAML Metadata for easy context retrieval by the Agent.

### ⚙️ Installation
1. Ensure required Skills are installed in the `.agents/skills/` directory.
2. Adhere to the rules defined in `.agents/Rules/Rules.md`.

### 📚 References
This project is built based on official guides from Google Cloud:
- [Ultimate Prompting Guide for Nano Banana](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- [Ultimate Prompting Guide for Veo 3.1](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)

---
*Developed by **Manh Huynh***
🌐 Website: [manhhuynh.work](https://manhhuynh.work)
📧 Email: [contact@manhhuynh.work](mailto:contact@manhhuynh.work)
