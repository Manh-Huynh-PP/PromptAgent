# Advanced Prompting Techniques

Để đạt kết quả tốt nhất trên Google Flow, hãy áp dụng các kỹ thuật sau:

## 1. Kỹ thuật "Anchor & Layer" (Neo và Lớp)
Đừng viết một câu dài lộn xộn. Hãy chia lớp:
- **Lớp 1 (Neo)**: Chủ thể chính (Ví dụ: Một quả cầu pha lê).
- **Lớp 2 (Chi tiết)**: Chất liệu và bề mặt (Ví dụ: Thủy tinh mờ, có bọt khí bên trong).
- **Lớp 3 (Môi trường)**: Ánh sáng và không gian (Ví dụ: Ánh sáng Rim light màu tím, đặt trên mặt bàn gỗ).
- **Lớp 4 (Kỹ thuật)**: Camera và phong cách (Ví dụ: Macro shot, bokeh cực mạnh).

## 2. Kỹ thuật "Material Specification" (Chuyên biệt hóa vật liệu)
Thay vì dùng "metallic" (kim loại), hãy dùng các thuật ngữ chính xác của 3D/PBR:
- `Brushed aluminum` (Nhôm xước)
- `Anodized metal` (Kim loại sơn tĩnh điện)
- `Oxidized copper` (Đồng oxy hóa)
- `Polished chrome` (Crom bóng)
- `Subsurface scattering` (Dùng cho da người, sáp, nhựa để ánh sáng xuyên qua).

## 3. Kỹ thuật "Motion Prompting" cho Veo 3.1
Để video không bị biến dạng, hãy mô tả hành động bằng các động từ mạnh và đơn giản:
- **Tốt**: `Fluidly flowing`, `Slowly rotating`, `Merging`, `Disintegrating`.
- **Nên tránh**: Các hành động quá phức tạp trong một câu (Ví dụ: "Chạy sau đó nhảy rồi biến thành chim"). Hãy chia nhỏ thành các "Scene" (Phân cảnh).

## 4. Kỹ thuật "Negative Prompting" (Mô tả cái không muốn)
Mặc dù Flow chủ yếu dùng Positive prompt, bạn có thể hướng dẫn Agent loại bỏ các lỗi phổ biến:
- `Avoid plastic look` (Tránh nhìn giống nhựa)
- `No motion blur on the subject` (Không nhòe chuyển động trên chủ thể)
- `No flickering` (Không nhấp nháy ánh sáng).

## 5. Kỹ thuật "Ingredient Consistency"
Khi dùng ảnh làm đầu vào cho video:
- Luôn bắt đầu prompt bằng cụm từ: `Based on the attached image...`
- Chỉ mô tả **sự thay đổi**, đừng mô tả lại toàn bộ bức ảnh để tránh AI tự ý sáng tạo sai lệch.
## 6. Kỹ thuật "Multimodal Briefing" (Dùng ảnh tham chiếu)
Khi bạn gửi ảnh cho tôi, hãy đi kèm với các yêu cầu cụ thể để tôi tập trung vào đúng thứ bạn cần:
- **"Lấy style ánh sáng"**: Tôi sẽ tập trung phân tích nguồn sáng, màu sắc của bóng đổ và độ tương phản.
- **"Giữ nguyên chủ thể"**: Tôi sẽ mô tả chi tiết nhân vật/vật thể trong ảnh để tạo thành một "Ingredient" nhất quán.
- **"Mô phỏng texture"**: Tôi sẽ soi kỹ bề mặt (vải, kim loại, da) để dùng các thuật ngữ PBR tương ứng.

**Lệnh đề xuất**: `!ref tạo video từ ảnh này, cho camera quay xung quanh`

## 7. Kỹ thuật "Timecode Prompting" (Storyboarding)
Để điều khiển nội dung video thay đổi theo thời gian trong một clip (thường từ 4-8 giây), hãy dùng cú pháp phân đoạn thời gian:
- **Nguyên lý**: Google Veo hiểu tốt các trình tự thời gian nếu bạn đặt chúng trong ngoặc vuông hoặc mô tả theo thứ tự First/Then/Finally.
- **Cách viết**: `[00:00-00:02: Hành động 1] + [00:02-00:05: Hành động 2]`.
- **Ứng dụng**: Rất hiệu quả để tạo các cảnh quay có sự biến đổi (ví dụ: một bông hoa nở rồi héo, hoặc camera dolly-in rồi xoay ngang).

**Lưu ý**: Đừng nhồi nhét quá 3 hành động trong một clip 8 giây để tránh AI bị "loạn" và tạo ra các biến dạng hình ảnh.
