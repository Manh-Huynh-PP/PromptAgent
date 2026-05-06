# Google Flow Prompt Agent (PromptAgent)

Hệ thống Agent chuyên dụng để xây dựng và quản lý Prompt chất lượng cao cho **Google Flow** (Veo 3.1 & Imagen 4/Nano Banana).

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

---

## English

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

---
*Developed by **Manh Huynh***
🌐 Website: [manhhuynh.work](https://manhhuynh.work)
📧 Email: [contact@manhhuynh.work](mailto:contact@manhhuynh.work)
