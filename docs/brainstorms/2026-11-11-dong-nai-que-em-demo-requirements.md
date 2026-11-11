---
date: 2026-11-11
topic: dong-nai-que-em-demo
---

# Đồng Nai Quê Em — web demo thi giáo viên giỏi (GDĐP Đồng Nai)

## Problem Frame
Một giáo viên THCS cần một trang web đơn giản để trình diễn khi thi giáo viên giỏi môn Giáo dục địa phương Đồng Nai. Đã có sẵn mockup giao diện (`Dong_Nai_6_9_AI_Internet_V4.html`), 16 video lịch sử (`VIDEO NHÚNG LINK/`), một file thuyết minh (`Lịch sử đồng nai.docx`) và 2 sách PDF lớp 8 dạng ảnh scan. Chỉ cần bản demo chạy được, miễn phí, không cần hoàn chỉnh.

## Requirements
**Video (ưu tiên 1)**
- R1. Giữ phong cách giao diện của mockup: thanh bên, trang Tổng quan, Video minh họa, Kho học liệu, Hỏi đáp.
- R2. Cả 16 video có sẵn khi mở trang, giáo viên không phải tải lên gì. Danh sách sắp theo mốc thời gian (1698 → 1975 → "phát triển"), tên lấy theo tên file đã làm gọn.
- R3. Bấm vào video là phát ngay trong trang (trình phát có tua, toàn màn hình). Nếu tốn ít công thì kèm một đoạn thuyết minh ngắn lấy từ docx cho video đó.
- R4. Gắn nội dung với Lớp 8 (cả hai sách đều là lớp 8). Mặc định chọn lớp 8; lớp 6/7/9 hiện thông báo "đang cập nhật".
- R5. Trang chạy được trên laptop (mở bằng server tĩnh tại máy) và đưa lên được hosting tĩnh miễn phí (GitHub Pages) để có link công khai.

**Kho học liệu**
- R6. Liệt kê các tài liệu nguồn (docx, 2 PDF) kèm link mở hoặc tải.

**AI hỏi đáp (ưu tiên 2)**
- R7. Trang Hỏi đáp gọi Claude Haiku, trả lời bằng tiếng Việt theo lứa tuổi THCS, dựa trên nội dung docx được nhồi nguyên vào prompt (không làm RAG).
- R8. API key nhập một lần ở trang cài đặt hoặc quản trị, chỉ lưu trong trình duyệt của máy đó. Không có key thì trang hiện hướng dẫn, không báo lỗi.
- R9. Có các câu hỏi gợi ý về nội dung Đồng Nai. Nếu câu trả lời khớp với một video thì gợi ý video đó (làm được thì làm).
- R10. Giữ nút đọc to câu trả lời bằng giọng tiếng Việt của trình duyệt như trong mockup, nếu tốn ít công.

## Success Criteria
- Mở link (hoặc chạy trên laptop) thì xem ngay được cả 16 video, không mất phí.
- Sau khi nhập key, hỏi kiểu "Nguyễn Hữu Cảnh vào Đồng Nai năm nào?" thì nhận được câu trả lời đúng theo tài liệu.

## Scope Boundaries
- Không làm đăng nhập, phân quyền, upload hay quản trị nội dung thật (bỏ phần IndexedDB upload của mockup).
- Không OCR 2 file PDF và không làm RAG.
- Không lưu API key trong mã nguồn hay trên repo.
- Không tìm kiếm Internet (mockup có "AI Internet", bỏ phần này).

## Key Decisions
- Hosting: trang tĩnh với video tự host, đưa lên GitHub Pages (mỗi file < 100MB nên vừa giới hạn). Miễn phí, không phụ thuộc YouTube.
- AI key: người dùng nhập trên trang, lưu ở localStorage, trình duyệt gọi thẳng Anthropic API. Chấp nhận việc AI chỉ chạy trên máy đã nhập key.

## Outstanding Questions
### Deferred to Planning
- [R3][Technical] Ghép đoạn thuyết minh docx với từng video, làm thủ công hay tự động.
- [R5][Technical] Video 60MB có thể bị GitHub cảnh báo (>50MB) nhưng vẫn đẩy lên được. Cần kiểm tra tốc độ tải trên GitHub Pages.

## Next Steps
→ /ce:plan
