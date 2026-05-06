# Google Flow Prompt Agent (PromptAgent)

Hệ thống Agent chuyên dụng để xây dựng và quản lý Prompt chất lượng cao cho **Google Flow** (Veo 3.1 & Imagen 4/Nano Banana).

## 🚀 Tính năng chính
- **Cinematic DNA Formula**: Tự động cấu trúc prompt theo chuẩn 5 phần (Shot, Camera, Subject, Action, Style).
- **Identity Locking**: Cơ chế khóa đặc điểm nhân vật/sản phẩm để tránh biến dạng (morphing) khi tạo video.
- **Time-Series Versioning**: Quản lý phiên bản prompt theo ngày tháng, đảm bảo không mất dữ liệu lịch sử.
- **Bilingual Interface**: Thảo luận và phân tích bằng tiếng Việt, xuất prompt chuyên dụng bằng tiếng Anh.

## 🛠️ Hướng dẫn sử dụng (Slash Commands)
Sử dụng các lệnh sau trong khung chat để kích hoạt các quy trình tự động:

- `/slash-polish`: Chuẩn hóa prompt thô thành cấu trúc Google Flow chuyên nghiệp.
- `/slash-concept`: Đề xuất 3 biến thể phong cách khác nhau cho một ý tưởng.
- `/slash-ref`: Phân tích ảnh tham chiếu để tạo prompt Nano Banana tương ứng.
- `/slash-animate`: Tạo video prompt với chuyển động camera từ ảnh gốc.
- `/slash-storyboard`: Tạo kịch bản video phân đoạn kèm hiệu ứng âm thanh (SFX).

> [!TIP]
> **Khuyến khích**: Hãy sử dụng extension [Markdown-ext](https://github.com/manhhuynh-designer/Markdown-ext) để có trải nghiệm tốt nhất. Extension này giúp bạn xem trước định dạng Markdown và có nút "Copy" chuyên dụng để sao chép hoặc điều chỉnh prompt cực kỳ nhanh chóng.

## 📂 Quy tắc lưu trữ
Hệ thống tuân thủ nghiêm ngặt quy trình:
1. Dự án được lưu trong `Projects/` (đã được cấu hình `.gitignore` để bảo mật).
2. Mỗi ngày làm việc tạo ra một file mới `YYYY-MM-DD.md` (Clone if Outdated).
3. Mỗi file prompt đều chứa YAML Metadata để Agent dễ dàng truy xuất ngữ cảnh.

## ⚙️ Cài đặt
1. Đảm bảo bạn đã cài đặt các Skill cần thiết trong thư mục `.agents/skills/`.
2. Tuân thủ các quy tắc trong `.agents/Rules/Rules.md`.

---
*Developed by **Manh Huynh***
🌐 Website: [manhhuynh.work](https://manhhuynh.work)
📧 Email: [contact@manhhuynh.work](mailto:contact@manhhuynh.work)
