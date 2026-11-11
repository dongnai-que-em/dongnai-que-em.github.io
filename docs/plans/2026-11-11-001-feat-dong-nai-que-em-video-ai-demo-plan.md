---
title: "feat: Đồng Nai Quê Em — web demo xem video + AI hỏi đáp"
type: feat
status: completed
date: 2026-11-11
origin: docs/brainstorms/2026-11-11-dong-nai-que-em-demo-requirements.md
---

# ✨ feat: Đồng Nai Quê Em — web demo xem video + AI hỏi đáp

## Overview
Trang web tĩnh, không cần build, dựng lại từ mockup `Dong_Nai_6_9_AI_Internet_V4.html`. Có sẵn 16 video lịch sử lớp 8 và AI hỏi đáp chạy bằng Claude Haiku, gọi thẳng từ trình duyệt bằng key người dùng tự nhập. Chạy được trên laptop và trên GitHub Pages, không mất phí (see origin: docs/brainstorms/2026-11-11-dong-nai-que-em-demo-requirements.md).

## Thông tin đã kiểm tra
- Cả 16 MP4 đều là **H.264 + AAC** và đã **faststart** (moov đứng trước mdat), nên phát/tua trên mọi trình duyệt mà không phải chuyển mã.
- **Video dọc 9:16** (kiểu Shorts, có phụ đề cứng). Trình phát và thẻ video phải hợp khung dọc. `phát triển.mp4` có thể khác tỉ lệ nên cần kiểm tra lại.
- `qlmanage -t -s 640` tạo được thumbnail PNG. Sau đó dùng `sips` đổi sang JPG cho nhẹ.
- Docx có 5 chương (Mở cõi; Hào khí Đồng Nai; Chiến khu Đ; Dưới tán lá trung quân; Tiếng sóng Đồng Nai), khoảng 21K ký tự, khớp với nội dung video. 2 PDF là ảnh scan, không có text, nên **không** đưa vào AI (see origin).
- Không có ffmpeg/ffprobe/pandoc. Dùng `textutil` (macOS) để lấy text từ docx.

## Proposed Solution

### Cấu trúc thư mục (chỉ deploy `site/`)
```
site/
  index.html          # dựng từ mockup: giữ CSS, viết lại các section
  app.js              # điều hướng, video, chat, TTS
  data/videos.js      # window.VIDEOS = [{id, title, year, chapter, file, thumb, excerpt}]
  data/kien-thuc.js   # window.KNOWLEDGE = "...text docx..."
  videos/NN-slug.mp4  # bản sao, tên ASCII
  thumbs/NN-slug.jpg
  tai-lieu/*.pdf|docx # bản sao, tên ASCII
scripts/prepare-assets.sh  # copy + đổi tên + thumbnail + trích docx (chạy lại được)
.github/workflows/pages.yml
.gitignore            # bỏ qua file gốc tên tiếng Việt, mockup, *.mp4 ngoài site/
README.md             # hướng dẫn chạy và deploy bằng tiếng Việt
```
**Vì sao đổi sang tên ASCII:** macOS lưu tên file dạng Unicode NFD, còn URL trong HTML dạng NFC. Trên server Linux (GitHub Pages) hai dạng này lệch nhau là 404. Dùng slug ASCII thì tránh được hẳn lỗi này.

**Vì sao dùng `data/*.js` thay cho JSON + fetch:** để mở thẳng `index.html` (file://) vẫn chạy, đúng khi trình diễn offline.

### Danh sách video và chương (agent đối chiếu lại với docx)
| # | File gốc | Chương |
|---|---|---|
| 01 | 1698 Nguyễn Hữu Cảnh | 1 Mở cõi |
| 02 | 1715 Văn Miếu Trấn Biên | 1 |
| 03 | 1861 Thành Biên Hòa | 2 Hào khí Đồng Nai |
| 04 | Cuối thế kỷ XIX Đồn điền cao su | 2 |
| 05 | 28-10-1929 Chi Bộ Phú Riềng | 2 |
| 06 | 3-2-1930 Phú Riềng Đỏ | 2 |
| 07 | 27-8-1945 Quảng Trường Sông Phố | 2 |
| 08 | Tháng 10-1945 Chiến khu D | 3 Chiến khu Đ |
| 09 | Đêm 22 rạng 23-3-1950 Đánh tháp canh | 3 |
| 10 | 1954 sau hiệp định Giơ ne vơ | 3 |
| 11 | 1965 Chiến thắng Đồng Xoài | 4 Dưới tán lá trung quân |
| 12 | Sân Bay Biên Hòa | 4 |
| 13 | Tổng Kho Long Bình | 4 |
| 14 | 13-12-1974 đến 6-1-1975 Đường 14 Phước Long | 4 |
| 15 | 8-4-1975 Sân bay Phước Bình | 4 |
| 16 | phát triển | 5 Tiếng sóng Đồng Nai |

Tên hiển thị làm gọn từ tên file, ví dụ "1698 · Nguyễn Hữu Cảnh kinh lược phương Nam". `excerpt` là 1–3 câu thuyết minh tương ứng, chép nguyên văn từ docx.

### Các trang (giữ sidebar và topbar của mockup, bỏ trang "Quản trị mẫu")
1. **Tổng quan:** hero; thẻ lớp 6–9 (lớp 8 bật, các lớp khác ghi "Đang cập nhật"); thống kê 16 video / 3 tài liệu / 5 chương; nút "Xem video" và "Hỏi trợ lý".
2. **Video minh họa** (R1–R4): nhóm theo 5 chương, lưới thẻ có thumbnail dọc, năm và tiêu đề. Bấm thẻ thì mở modal phát video: `<video controls autoplay playsinline>` khung dọc (max-height 80vh), bên cạnh hoặc bên dưới là tiêu đề, chương và đoạn thuyết minh, có nút ◀ Trước / Tiếp ▶ và phím mũi tên. Đóng modal thì dừng video. Hết video thì gợi ý video kế. Có ô lọc theo từ khóa trong tiêu đề.
3. **Kho học liệu** (R6): 3 dòng gồm docx (tải về), PDF Đồng Nai cũ và PDF Bình Phước cũ (mở tab mới). Kèm link tham khảo THCS Long Phước như trong mockup.
4. **Hỏi đáp** (R7–R10): giữ UI chat của mockup; bỏ thanh "Nguồn trả lời web/local"; có bộ chọn lớp 6–9 để chỉnh độ khó lời giải thích; giữ panel giọng đọc TTS (Web Speech API, code mockup đã có); có thể bỏ mic nếu port tốn công.

### AI hỏi đáp (gọi thẳng Anthropic API từ trình duyệt)
- Nút "⚙ Cài đặt AI" mở modal để nhập API key và model (mặc định `claude-haiku-5-5`, sửa được). Lưu vào `localStorage` (khóa `dnqe_api_key`, `dnqe_model`). Có nút "Xóa key". Key hiển thị dạng che.
- Chưa có key: khung chat hiện thẻ hướng dẫn kèm nút mở Cài đặt, không gọi API (R8).
- Request: `POST https://api.anthropic.com/v1/messages`, headers `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`, `content-type: application/json`; `max_tokens` 1024. Không dùng streaming cho đơn giản.
- `system` = 1 block text có `cache_control: {type: "ephemeral"}`, gồm:
  - vai trò: trợ lý GDĐP Đồng Nai cho học sinh lớp {grade}, trả lời tiếng Việt, ngắn gọn, dễ hiểu; **chỉ dựa trên tài liệu**, nếu tài liệu không có thì nói rõ "tài liệu chưa đề cập" rồi mới bổ sung kiến thức chung, có ghi chú.
  - danh sách video `id — tiêu đề — năm`, kèm chỉ dẫn: khi liên quan thì thêm cuối câu trả lời dòng `[[video:ID]]` (tối đa 2).
  - `<tai_lieu>` KNOWLEDGE `</tai_lieu>`.
- Lịch sử hội thoại gửi kèm 6 lượt gần nhất.
- Phía client tách `[[video:ID]]` khỏi văn bản và hiện nút "▶ Xem video: …" để mở modal phát.
- Lỗi: 401 → "API key không đúng"; 429/529/5xx → "AI đang bận, thử lại sau ít giây"; lỗi mạng → "Không kết nối được Internet". Gặp lỗi thì không xóa câu hỏi đã gõ.
- Hiển thị text bằng `textContent` (giữ cách `safeText` của mockup), không dùng innerHTML với output AI.
- Câu hỏi gợi ý: "Nguyễn Hữu Cảnh vào Đồng Nai năm nào để làm gì?", "Phong trào Phú Riềng Đỏ diễn ra thế nào?", "Vì sao Chiến khu Đ quan trọng?", "Kể về chiến thắng Đồng Xoài 1965".

## Implementation Phases
**Phase 1 — Assets** (`scripts/prepare-assets.sh`): copy và đổi tên 16 video, 3 tài liệu; tạo thumbnail JPG (qlmanage + sips, rộng khoảng 360px); trích docx thành `data/kien-thuc.js`. Viết `data/videos.js` (tiêu đề, chương, excerpt) bằng tay dựa trên text docx.
**Phase 2 — Site + video** (ưu tiên 1): `index.html` + `app.js` đủ 3 trang Tổng quan / Video / Học liệu, modal trình phát; responsive tới 375px.
**Phase 3 — AI chat** (ưu tiên 2): trang Hỏi đáp, Cài đặt AI, gọi API, gắn nút video, TTS.
**Phase 4 — Deploy prep:** `.gitignore`, workflow GitHub Pages (`actions/upload-pages-artifact` với `path: site`), README tiếng Việt (chạy local bằng `python3 -m http.server -d site 8000`, cách bật Pages, cách nhập key).

## Acceptance Criteria
- [ ] `python3 -m http.server -d site 8000` → mở `localhost:8000` thì thấy đủ 16 video theo 5 chương, có thumbnail, phát và tua được, nút Trước/Tiếp chạy đúng.
- [ ] Đóng modal là video dừng, không còn tiếng chạy nền.
- [ ] Ở chiều rộng 375px không bị cuộn ngang, video dọc vừa màn hình.
- [ ] Trang Học liệu mở hoặc tải được 3 tài liệu.
- [ ] Chưa có key thì Hỏi đáp hiện hướng dẫn; key sai thì hiện lỗi tiếng Việt (test bằng key giả, nhận 401).
- [ ] Có key thật thì "Nguyễn Hữu Cảnh vào Đồng Nai năm nào?" trả lời 1698 kèm nút xem video 01 (kiểm tra khi user cung cấp key).
- [ ] Không có API key trong mã nguồn; tên file trong `site/` toàn ASCII.
- [ ] Console không có lỗi JS khi chuyển qua lại các trang.

## Dependencies & Risks
- **Dung lượng repo khoảng 325MB.** Mọi file đều < 100MB nên không cần LFS, nhưng GitHub sẽ cảnh báo 2 file trên 50MB (60MB, 47MB). Vẫn trong giới hạn Pages 1GB, băng thông 100GB/tháng.
- **Key nằm trong localStorage:** chỉ phù hợp demo trên máy của giáo viên. Đã chấp nhận ở bước brainstorm (see origin: Key Decisions).
- **Model id:** nếu `claude-haiku-5-5` không chạy được thì người dùng sửa trong Cài đặt AI.
- **Giọng TTS tiếng Việt** tùy thiết bị; mockup đã có cơ chế báo trạng thái.
- Phần deploy lên GitHub cần tài khoản của người dùng. Bước work chỉ chuẩn bị file, không push.

## Sources & References
- **Origin document:** [docs/brainstorms/2026-11-11-dong-nai-que-em-demo-requirements.md](../brainstorms/2026-11-11-dong-nai-que-em-demo-requirements.md). Các quyết định mang sang: tự host video trên GitHub Pages; key nhập trên trang, lưu localStorage; không OCR/RAG, chỉ nhồi docx; bỏ upload/admin và tìm kiếm Internet.
- Mockup: `Dong_Nai_6_9_AI_Internet_V4.html` (CSS dòng 8–45; UI chat dòng 70–90; TTS và helper `safeText`/`node` trong script khoảng từ dòng 118).
