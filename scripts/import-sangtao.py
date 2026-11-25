#!/usr/bin/env python3
"""Nhập học liệu từ thư mục sangtaophuong (giải nén từ sangtaophuong.zip) vào site/.

Cách dùng:  python3 -I scripts/import-sangtao.py <thư-mục-sangtaophuong>
- Ảnh: đổi tên ASCII, nén JPEG (bản lớn + bản thu nhỏ) bằng `sips` của macOS.
- Video mới (Tầm nhìn ...): copy + tạo thumbnail bằng `qlmanage`.
Chạy lại được: file đích đã có thì bỏ qua.
"""
import os, shutil, subprocess, sys, tempfile, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
N = lambda s: unicodedata.normalize('NFC', s)

if len(sys.argv) != 2:
    sys.exit(__doc__)
SRC = sys.argv[1]


def find(folder, prefix):
    d = os.path.join(SRC, folder)
    for f in os.listdir(d):
        if N(f).lower().startswith(N(prefix).lower()):
            return os.path.join(d, f)
    sys.exit('Không thấy: %s/%s' % (folder, prefix))


def sub_dir(folder):
    for f in os.listdir(SRC):
        if N(f).lower() == N(folder).lower():
            return f
    sys.exit('Không thấy thư mục: ' + folder)


def jpeg(src, dst, size, quality=55):
    if os.path.exists(dst):
        return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', str(quality),
                    '-Z', str(size), src, '--out', dst],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print('img', os.path.relpath(dst, SITE))


def images(folder, out, items, full, thumb, full_q=55):
    real = sub_dir(folder)
    for prefix, slug in items:
        src = find(real, prefix)
        jpeg(src, os.path.join(SITE, 'img', out, slug + '.jpg'), full, full_q)
        jpeg(src, os.path.join(SITE, 'img', out, 't', slug + '.jpg'), thumb, 45)


# Tranh minh họa lịch sử (ngang ~3:2)
images('LỊCH SỬ ĐỒNG NAI', 'lich-su', [
    ('1698', '01-nguyen-huu-canh'), ('1715', '02-van-mieu-tran-bien'), ('1861', '03-thanh-bien-hoa'),
    ('Cuối thế kỉ XIX', '04-don-dien-cao-su'), ('28-10-1929', '05-chi-bo-phu-rieng'),
    ('3-2-1930', '06-phu-rieng-do'), ('27-8-1945', '07-quang-truong-song-pho'),
    ('Tháng 10', '08-chien-khu-d'), ('đêm 22', '09-danh-thap-canh'), ('1954', '10-hiep-dinh-geneva'),
    ('1965', '11-dong-xoai'), ('1966', '11b-dac-cong-rung-sac'), ('Sân bay Biên Hòa', '12-san-bay-bien-hoa'),
    ('Tổng kho', '13-tong-kho-long-binh'), ('Đường 14', '14-duong-14-phuoc-long'),
    ('8-4-1975', '15-san-bay-phuoc-binh'), ('Trận đánh Xuân Lộc', '15b-xuan-loc'),
    ('Đồng Nai 2026', '16-dong-nai-2026'), ('tầm nhìn', '17-tam-nhin-tuong-lai'),
], 1400, 640)

# Ảnh di tích (16:9)
images('DI TÍCH LỊCH SỬ', 'di-tich', [
    ('Văn miếu', 'van-mieu-tran-bien'), ('Thành cổ', 'thanh-co-bien-hoa'), ('Đền thờ', 'den-tho-nguyen-huu-canh'),
    ('Đình Tân Lân', 'dinh-tan-lan'), ('Nhà lao', 'nha-lao-tan-hiep'), ('Di tích Nhà Xanh', 'nha-xanh'),
], 1600, 720)

# Poster sản vật, làng nghề, thiên nhiên (dọc)
images('SẢN VẬT ĐỒNG NAI', 'san-vat', [
    ('Picture1.', 'buoi-tan-trieu'), ('Picture2.', 'chom-chom-long-khanh'), ('Picture3.', 'goi-buoi-tan-trieu'),
    ('Picture4.', 'canh-thut'), ('Picture5.', 'de-nui-chua-chan'), ('Picture6.', 'binh-gom-bien-hoa'),
    ('Picture7.', 'tui-tho-cam-stieng'), ('Picture8.', 'tranh-go-cham-khac'), ('Picture9.', 'hoa-van-khmer'),
    ('Picture10.', 'hoa-van-stieng'), ('Picture11.', 'sinh-vat-binh-phuoc'), ('Picture12.', 'vqg-cat-tien'),
    ('Picture13.', 'gom-tan-van'), ('Picture14.', 'da-buu-long'), ('Picture15.', 'tho-cam-ta-lai'),
    ('Picture16.', 'duc-gang-thanh-phu'), ('Picture17.', 'chon-nghe'),
], 1600, 520)

# Poster văn học (dọc)
images('VĂN HỌC ĐỒNG NAI', 'van-hoc', [
    ('Picture1.', 'thac-tri-an'), ('Picture2.', 'cay-lua'), ('Picture3.', 'nui-ba-ra'),
    ('Picture4.', 'tan-trieu-dai-do'), ('Picture5.', 'nho-bac'), ('Picture6.', 'mien-dat-yeu'),
    ('Picture7.', 'tran-bien-hoa'), ('Picture8.', 'vat-nang-chia-hai'), ('Picture9.', 'kon-tro'),
    ('Picture10.', 'trai-sau-rieng'), ('Picture11.', 'tuc-ngu-ca-dao'), ('Picture12.', 'ca-dao'),
    ('Picture13.', 'tuc-ngu'), ('Picture14.', 'chu-tho-su-van'), ('Picture15.', 'no-mot-loi-hen'),
], 1200, 520)

# Đồng Nai trong em: poster nghệ thuật + bản đồ khám phá có mã QR (giữ độ phân giải cao để quét được)
images('Đồng Nai trong em', 'trong-em', [
    ('1795571482268', 'net-dep-dong-nai'), ('1795571482287', 'am-nhac-dan-gian'),
    ('1795571482301', 'hoa-van-thu-cong'), ('1795571482313', 'giai-dieu-que-huong'),
    ('1795571482323', 'nghe-thuat-khmer-mnong'), ('1795571482332', 'hoi-hoa-tho-cam'),
    ('1795571482340', 'le-hoi-stieng'), ('1795571482347', 'kien-truc-dia-phuong'),
], 1448, 520)
images('Đồng Nai trong em', 'trong-em', [
    ('1.png', 'qr-mo-coi'), ('2.png', 'qr-van-hoa'), ('3.png', 'qr-con-nguoi'),
    ('4.png', 'qr-dia-chi-do'), ('5.png', 'qr-thien-nhien'),
], 2600, 520, 62)

# Video Tầm nhìn
VIDEOS = [('Tầm nhìn 2030', '17-tam-nhin-2030'), ('Tầm nhìn 2035', '18-tam-nhin-2035'),
          ('Tầm nhìn 2045', '19-tam-nhin-2045'), ('Tầm nhìn 2065', '20-tam-nhin-2065')]
vdir = sub_dir('VIDEO')
tmp = tempfile.mkdtemp()
for prefix, slug in VIDEOS:
    src = find(vdir, prefix)
    dst = os.path.join(SITE, 'videos', slug + '.mp4')
    if not (os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src)):
        shutil.copyfile(src, dst)
        print('video', slug)
    th = os.path.join(SITE, 'thumbs', slug + '.jpg')
    if not os.path.exists(th):
        subprocess.run(['qlmanage', '-t', '-s', '720', '-o', tmp, dst],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
        png = os.path.join(tmp, slug + '.mp4.png')
        if os.path.exists(png):
            jpeg(png, th, 640)
        else:
            print('!! không tạo được thumbnail', slug)
shutil.rmtree(tmp, ignore_errors=True)
print('Xong.')
