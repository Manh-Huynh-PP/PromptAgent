# Utility Prompts Library (Công cụ hỗ trợ)

File này lưu trữ các prompt chuyên dụng để xử lý hình ảnh, tạo tài nguyên thiết kế, hoặc các tác vụ đặc thù ngoài việc tạo hình ảnh/video thông thường.

## 1. Mở rộng hình ảnh (Outpainting / Expand)
**Mục đích**: Yêu cầu AI mở rộng bối cảnh của một bức ảnh gốc.
**Formula**: `Based on the reference image, expand the scene to [direction]. Seamlessly extend the [environment/background elements], maintaining the exact same lighting, color palette, and texture as the original.`
**Example**:
> "Based on the reference image of the cozy cabin, expand the scene to the left to show a dense pine forest and a winding dirt path. Seamlessly extend the snowy environment, maintaining the exact same warm golden-hour lighting, color palette, and oil-painting texture as the original."

## 2. Tạo ảnh phác thảo (Sketch / Concept Drawing)
**Mục đích**: Chuyển đổi ý tưởng hoặc ảnh gốc thành dạng phác thảo thô, sketch chì, hoặc concept art.
**Formula**: `[Subject] drawn in a rough pencil sketch style. [Specific detail focus]. Monochromatic, sketchy lines, unfinished concept art aesthetic, white paper background.`
**Example**:
> "A futuristic cybernetic arm drawn in a rough graphite pencil sketch style. Focus on the mechanical joints and wiring details. Monochromatic, sketchy dynamic lines, unfinished Da Vinci notebook concept art aesthetic, off-white textured paper background."

## 3. Tạo/Tách hình ảnh Vector (Vector Illustration)
**Mục đích**: Tạo hình ảnh phẳng, ít chi tiết thừa để dễ dàng trace thành vector trong Illustrator/Figma.
**Formula**: `Flat vector illustration of [Subject]. Clean crisp lines, minimalist, limited flat color palette (no gradients, no shading), white background, UI design asset style.`
**Example**:
> "Flat vector illustration of a modern smartphone with a chat bubble. Clean crisp lines, minimalist UI design asset style, limited flat color palette using only blue and orange, no gradients, no shading, pure white background."

## 4. Typography / Tách Text
**Mục đích**: Nhấn mạnh vào việc tạo chữ rõ ràng hoặc phong cách typography cụ thể trên hình ảnh (Google Imagen 4 làm rất tốt việc này).
**Formula**: `[Background/Subject context], featuring the text "[EXACT TEXT]" written in [Typography Style]. [Lighting/Texture of the text].`
**Example**:
> "A neon sign hanging on a dark brick wall in a cyberpunk alleyway, featuring the text 'OPEN LATE' written in bright pink cursive glowing neon typography. Sharp focus on the letters, cinematic lighting."
