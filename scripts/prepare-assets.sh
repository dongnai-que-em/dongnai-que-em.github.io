#!/usr/bin/env bash
# Chuẩn bị tài nguyên cho site/: copy + đổi tên ASCII, tạo thumbnail, trích docx. Chạy lại được (idempotent).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ROOT
cd "$ROOT"
mkdir -p site/videos site/thumbs site/tai-lieu site/data

python3 - <<'PY'
import os, shutil, subprocess, tempfile, unicodedata, sys, glob
root = os.environ['ROOT']
N = lambda s: unicodedata.normalize('NFC', s)
src_dir = os.path.join(root, 'VIDEO NHÚNG LINK')
# (tiền tố tên file gốc, slug)
VIDEOS = [
 ('1698 Nguyễn Hữu Cảnh', '01-nguyen-huu-canh-1698'),
 ('1715 Văn Miếu Trấn Biên', '02-van-mieu-tran-bien-1715'),
 ('1861 Thành Biên Hòa', '03-thanh-bien-hoa-1861'),
 ('Cuối thế kỷ XIX Đồn điền cao su', '04-don-dien-cao-su'),
 ('28-10-1929 Chi Bộ Phú Riềng', '05-chi-bo-phu-rieng-1929'),
 ('3-2-1930 Phú Riềng Đỏ', '06-phu-rieng-do-1930'),
 ('27-8-1945 Quảng Trường Sông Phố', '07-quang-truong-song-pho-1945'),
 ('Tháng 10-1945 Chiến khu D', '08-chien-khu-d-1945'),
 ('Đêm 22 rạng 23-3-1950 Đánh tháp canh', '09-danh-thap-canh-1950'),
 ('1954 sau hiệp định Giơ ne vơ', '10-hiep-dinh-geneva-1954'),
 ('1965 Chiến thắng Đồng Xoài', '11-dong-xoai-1965'),
 ('Sân Bay Biên Hòa', '12-san-bay-bien-hoa'),
 ('Tổng Kho Long Bình', '13-tong-kho-long-binh'),
 ('13-12-1974 đến 6-1-1975 Đường 14 Phước Long', '14-duong-14-phuoc-long'),
 ('8-4-1975 Sân bay Phước Bình', '15-san-bay-phuoc-binh-1975'),
 ('phát triển', '16-phat-trien'),
]
files = {N(f): f for f in os.listdir(src_dir)}
def find(base, ext):
    key = N(base + ext)
    if key not in files: sys.exit('Không thấy file: ' + base + ext)
    return os.path.join(src_dir, files[key])

tmp = tempfile.mkdtemp()
for base, slug in VIDEOS:
    src = find(base, '.mp4')
    dst = os.path.join(root, 'site/videos', slug + '.mp4')
    if not (os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src)):
        shutil.copyfile(src, dst); print('copy', slug + '.mp4')
    th = os.path.join(root, 'site/thumbs', slug + '.jpg')
    if not os.path.exists(th):
        subprocess.run(['qlmanage', '-t', '-s', '640', '-o', tmp, dst], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
        png = os.path.join(tmp, slug + '.mp4.png')
        if not os.path.exists(png): print('!! không tạo được thumbnail', slug); continue
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '70', '--resampleWidth', '360', png, '--out', th], stdout=subprocess.DEVNULL, check=True)
        print('thumb', slug + '.jpg')
shutil.rmtree(tmp, ignore_errors=True)

# Tài liệu
DOCS = [
 (os.path.join(root, 'Lịch sử đồng nai.docx'), 'lich-su-dong-nai.docx'),
 (None, 'gddp8-dong-nai-cu.pdf', 'ĐỒNG NAI CŨ.pdf'),
 (None, 'gddp8-binh-phuoc-cu.pdf', 'BÌNH PHƯỚC CŨ.pdf'),
]
rootfiles = {N(f): f for f in os.listdir(root)}
def rootfind(pred):
    for k, f in rootfiles.items():
        if pred(k): return os.path.join(root, f)
    sys.exit('Không thấy tài liệu')
docs = [
 (rootfind(lambda k: k.lower().startswith('lịch sử đồng nai') and k.endswith('.docx')), 'lich-su-dong-nai.docx'),
 (rootfind(lambda k: k.endswith('.pdf') and 'ĐỒNG NAI' in k), 'gddp8-dong-nai-cu.pdf'),
 (rootfind(lambda k: k.endswith('.pdf') and 'BÌNH PHƯỚC' in k), 'gddp8-binh-phuoc-cu.pdf'),
]
for src, name in docs:
    dst = os.path.join(root, 'site/tai-lieu', name)
    if not (os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src)):
        shutil.copyfile(src, dst); print('copy', name)

# Kiến thức từ docx
import json
txt = subprocess.run(['textutil', '-convert', 'txt', '-stdout', docs[0][0]], capture_output=True, check=True).stdout.decode('utf-8')
txt = unicodedata.normalize('NFC', txt).strip()
with open(os.path.join(root, 'site/data/kien-thuc.js'), 'w', encoding='utf-8') as f:
    f.write('window.KNOWLEDGE = ' + json.dumps(txt, ensure_ascii=False) + ';\n')
print('kien-thuc.js:', len(txt), 'ký tự')
PY
# kiểm tra tên ASCII
if find site -name '.DS_Store' -prune -o -print | LC_ALL=C grep -q '[^ -~]'; then echo "!! Có tên file không phải ASCII trong site/"; exit 1; fi
echo "Xong."
