# Đồng Nai Quê Em

Web demo tĩnh (không cần build) cho môn Giáo dục địa phương Đồng Nai: xem 16 video lịch sử lớp 8 theo 5 chương, kho học liệu, và trợ lý AI hỏi đáp (Claude) trả lời dựa trên tài liệu của thầy cô, kèm nút mở video liên quan và đọc thành tiếng.

## Chạy trên máy

```bash
python3 -m http.server -d site 8000
```

Mở http://localhost:8000. Cũng có thể bấm đúp `site/index.html` (chạy được từ file://, nhưng nên dùng server để video tua mượt).

## Đưa lên GitHub Pages

1. Tạo repo mới trên GitHub, rồi `git init`, `git add .`, `git commit`, `git remote add origin ...`, `git push -u origin main`.
2. Vào Settings → Pages → Source: chọn **GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` sẽ tự deploy thư mục `site/` mỗi lần push vào `main` (hoặc chạy tay ở tab Actions).

Lưu ý: có 2 video nặng hơn 50MB nên GitHub sẽ cảnh báo khi push, nhưng vẫn được vì mỗi file dưới 100MB. File gốc (PDF, DOCX, thư mục video gốc, mockup) đã được `.gitignore` bỏ qua.

## Bật trợ lý AI

1. Vào https://console.anthropic.com, tạo API key (dạng `sk-ant-...`).
2. Trên web, mở trang **Hỏi đáp** → **⚙ Cài đặt AI**, dán key vào, bấm Lưu. Model mặc định `claude-haiku-5-5`, có thể sửa tại đây.

Key chỉ lưu trong trình duyệt (localStorage) của máy đang dùng và gửi thẳng tới Anthropic. **Không dán key vào mã nguồn và không commit key lên GitHub.** Chỉ nên dùng cho demo trên máy của giáo viên.

## Khi đổi video hoặc tài liệu

Chạy lại `scripts/prepare-assets.sh` để sao chép, đổi tên file, tạo ảnh thu nhỏ và trích lại nội dung cho AI, rồi cập nhật `site/data/videos.js` nếu cần.
