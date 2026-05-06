# Workflow: PromptAgent Command Execution

Quy trình này định nghĩa cách Agent xử lý các lệnh điều khiển đặc biệt để đảm bảo chất lượng prompt đạt chuẩn Google Flow.

## 🔄 Tổng quan quy trình

Khi nhận được lệnh bắt đầu bằng `/`, Agent sẽ thực hiện theo các bước:
1. **Phân tích lệnh**: Xác định loại tác vụ (Ref, Concept, Animate, v.v.)
2. **Thu thập dữ liệu**: Đọc ảnh tham chiếu (nếu có) hoặc bối cảnh trong file ngày hiện tại.
3. **Áp dụng DNA Formula**: Xây dựng prompt theo cấu trúc 5 phần (Shot + Motion + Subject + Action + Style).
4. **Kiểm định**: Đối soát với các ràng buộc (không dùng từ chung chung, khóa danh tính nhân vật).
5. **Đầu ra**: Xuất prompt trong block code và cập nhật vào file ngày tương ứng trong `Projects/<project-name>/YYYY-MM-DD.md`.

---

## 🛠 Chi tiết các lệnh (Command Logic)

### 1. `/ref [yêu cầu]` (Reference Analysis)
- **Bước 1**: Phân tích sâu các lớp (layers) của ảnh đính kèm: Ánh sáng, Màu sắc, Chất liệu.
- **Bước 2**: Trích xuất từ khóa kỹ thuật (ví dụ: "Leica color science", "24mm lens").
- **Bước 3**: Tạo prompt Nano Banana duy trì phong cách của ảnh.

### 2. `/concept [idea]` (Ideation)
- **Bước 1**: Tạo ra 3 biến thể phong cách khác nhau (ví dụ: Cinematic, Minimalist, Cyberpunk).
- **Bước 2**: Trình bày dưới dạng bảng so sánh hoặc Carousel.
- **Bước 3**: Lưu phương án được chọn vào file dự án ngày hiện tại.

### 3. `/animate [image_desc]` (Video Motion)
- **Bước 1**: Xác định điểm bắt đầu (Start Frame) từ mô tả hoặc ảnh.
- **Bước 2**: Gán chuyển động máy quay (Dolly, Pan, Zoom) bằng động từ mạnh.
- **Bước 3**: Thêm các ràng buộc vật lý (Rigid body, No morphing).

### 4. `/storyboard [ý tưởng]` (Timeline)
- **Bước 1**: Phân tách ý tưởng thành các mốc thời gian `[00:00-00:xx]`.
- **Bước 2**: Gán SFX và Ambient noise cho từng phân đoạn.
- **Bước 3**: Đảm bảo tính nhất quán giữa các mốc thời gian.

### 5. `/polish [prompt]` (Optimization)
- **Bước 1**: Nhận prompt thô của người dùng.
- **Bước 2**: Tái cấu trúc thành 5 phần chuẩn Google.
- **Bước 3**: Thay thế các tính từ yếu bằng thuật ngữ chuyên môn.

---

## ⚠️ Ràng buộc thực thi (Execution Constraints)

- **Không tự ý sáng tạo**: Luôn bám sát ảnh Start/End Frame nếu có.
- **Khóa danh tính**: Luôn tự động thêm "Identity Lock" cho nhân vật.
- **Policy-Safe**: Tự động thay thế các từ khóa nhạy cảm (bia, rượu, bạo lực) bằng mô tả hình ảnh tương đương.
