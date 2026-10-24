/* ============================================================
 *  tra-cuu.js : TAB "SINH VIÊN" (tra cứu chi tiết nghỉ của một sinh viên trong lớp)
 * ============================================================
 *  File này chạy SAU đoạn mã chính trong index.html và dùng lại các hàm có sẵn của nó
 *  ($, h, xoaNoiDung, boDau, ngayHienThi, tenThuCuaNgay, tenBuoiHoa, goiMayChu, yeuCauDangNhapLai,
 *  xuLyLoiDangNhap, chuyenTab, batDauPhien, dangXuat và biến trạng thái S).
 *  Không chứa dữ liệu nào. Mọi chữ do máy chủ trả về đều đưa vào trang bằng textContent (qua h()).
 *  Tên mới đều bắt đầu bằng "tra" hoặc "TRA" để không trùng mã chính.
 * ============================================================ */
(function () {
  'use strict';

  // ---------- Kiểu dáng bổ sung ----------
  const css =
    '.tra-luoi{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}' +
    '.tra-o{border:1px solid var(--vien);border-radius:10px;padding:10px;background:var(--the)}' +
    '.tra-o b{display:block;font-size:1.35rem;line-height:1.2}' +
    '.tra-o span{display:block;font-size:.85rem;color:var(--chu-phu)}' +
    '.tra-luot{border-left:4px solid var(--vien);padding:6px 10px;margin:8px 0;background:var(--the);border-radius:0 8px 8px 0}' +
    '.tra-luot.khong-phep{border-left-color:var(--loi)}' +
    '.tra-luot.co-phep{border-left-color:var(--ok)}' +
    '.tra-nhom{margin:14px 0 4px;font-weight:600}' +
    '.tra-hang{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}';
  const the = document.createElement('style');
  the.textContent = css;
  document.head.appendChild(the);

  // ---------- Trạng thái của tab ----------
  const TRA = { tuKhoa: '', maSV: '', hoTen: '', du: null, dangTai: false, loi: '', yc: 0, luc: 0 };
  const SO_KET_QUA_TOI_DA = 40;

  function datLaiTraCuu() {
    TRA.tuKhoa = ''; TRA.maSV = ''; TRA.hoTen = ''; TRA.du = null;
    TRA.dangTai = false; TRA.loi = ''; TRA.yc++; TRA.luc = 0;
  }

  // ---------- Gắn vào mã chính ----------
  const chuyenTabGoc = window.chuyenTab;
  window.chuyenTab = function (ten) {
    chuyenTabGoc(ten);
    $('khuSinhVien').hidden = (ten !== 'sinhvien');
    $('tabSinhVien').setAttribute('aria-selected', ten === 'sinhvien' ? 'true' : 'false');
    if (ten === 'sinhvien') {
      veTraCuu();
      // Đang xem một sinh viên và dữ liệu đã cũ hơn 1 phút thì tải lại
      if (TRA.maSV && !TRA.dangTai && Date.now() - TRA.luc > 60000) taiChiTiet();
    }
  };

  const batDauPhienGoc = window.batDauPhien;
  window.batDauPhien = function (du) { datLaiTraCuu(); batDauPhienGoc(du); };

  const dangXuatGoc = window.dangXuat;
  window.dangXuat = function () { dangXuatGoc(); datLaiTraCuu(); $('khuSinhVien').hidden = true; };

  $('tabSinhVien').addEventListener('click', function () { window.chuyenTab('sinhvien'); });

  // ---------- Vẽ tab ----------
  function veTraCuu() {
    const khung = $('khuSinhVien');
    xoaNoiDung(khung);
    if (!S.du) return;
    if (TRA.maSV) veChiTiet(khung); else veTimKiem(khung);
  }

  // --- Màn hình tìm sinh viên ---
  function veTimKiem(khung) {
    const oTim = h('input', {
      type: 'text', value: TRA.tuKhoa, autocomplete: 'off',
      placeholder: 'Gõ mã SV hoặc tên (không cần gõ dấu)', 'aria-label': 'Tìm sinh viên'
    });
    const ketQua = h('div', { class: 'ket-qua-tim', style: 'max-height:none' });
    oTim.addEventListener('input', function () { TRA.tuKhoa = oTim.value; veKetQuaTim(ketQua); });

    khung.appendChild(h('div', { class: 'the' },
      h('h2', { text: 'Tra cứu sinh viên của lớp' }),
      h('p', { class: 'phu', text: 'Chọn một sinh viên để xem chi tiết các buổi vắng của em đó.' }),
      oTim, ketQua));
    veKetQuaTim(ketQua);
  }

  function veKetQuaTim(ketQua) {
    xoaNoiDung(ketQua);
    const cacTu = boDau(TRA.tuKhoa).split(/\s+/).filter(Boolean);
    const khop = S.du.sinhVien.filter(function (sv) {
      const chu = boDau(sv.hoTen + ' ' + sv.maSV);
      return cacTu.every(function (tu) { return chu.indexOf(tu) >= 0; });
    });
    if (!S.du.sinhVien.length) {
      ketQua.appendChild(h('p', { class: 'phu', text: 'Lớp chưa có sinh viên nào đang học.' }));
      return;
    }
    if (!khop.length) {
      ketQua.appendChild(h('div', { class: 'bang bang-canhbao' }, 'Không thấy sinh viên nào khớp. Thử gõ ít ký tự hơn.'));
      return;
    }
    khop.slice(0, SO_KET_QUA_TOI_DA).forEach(function (sv) {
      ketQua.appendChild(h('button', { class: 'muc-tim', type: 'button', onclick: function () { chonSinhVien(sv); } },
        sv.hoTen, h('small', { text: sv.maSV })));
    });
    if (khop.length > SO_KET_QUA_TOI_DA) {
      ketQua.appendChild(h('p', { class: 'phu', text: 'Còn ' + (khop.length - SO_KET_QUA_TOI_DA) + ' sinh viên nữa. Gõ thêm để thu hẹp.' }));
    }
  }

  function chonSinhVien(sv) {
    TRA.maSV = sv.maSV; TRA.hoTen = sv.hoTen; TRA.du = null; TRA.loi = '';
    taiChiTiet();
  }

  // --- Tải chi tiết từ máy chủ ---
  async function taiChiTiet() {
    const yc = ++TRA.yc;
    TRA.dangTai = true; TRA.loi = '';
    if (S.tab === 'sinhvien') veTraCuu();
    const kq = await goiMayChu({ hanhDong: 'chiTietSinhVien', maSV: TRA.maSV });
    if (yc !== TRA.yc) return;               // đã chọn người khác hoặc quay lại, bỏ kết quả cũ
    TRA.dangTai = false;
    if (kq.ok) {
      TRA.du = kq; TRA.luc = Date.now();
    } else {
      TRA.loi = kq.thongBao || 'Không tải được dữ liệu.';
      if (kq.maLoi === 'CHUA_DANG_NHAP') { yeuCauDangNhapLai(kq.thongBao); }
      else if (kq.maLoi === 'KHONG_CO_QUYEN') { xuLyLoiDangNhap(kq); return; }
    }
    if (S.tab === 'sinhvien') veTraCuu();
  }

  // --- Màn hình chi tiết một sinh viên ---
  function veChiTiet(khung) {
    khung.appendChild(h('div', { class: 'tra-hang' },
      h('button', { class: 'nut', type: 'button', onclick: function () { datLaiTraCuuGiuTuKhoa(); veTraCuu(); } }, '← Chọn sinh viên khác'),
      h('button', { class: 'nut', type: 'button', disabled: TRA.dangTai, onclick: taiChiTiet }, 'Làm mới')));

    const d = TRA.du;
    const ten = d ? d.sinhVien.hoTen : TRA.hoTen;
    const ma = d ? d.sinhVien.maSV : TRA.maSV;
    khung.appendChild(h('div', { class: 'the' },
      h('h2', { text: ten }),
      h('p', { class: 'phu' }, 'Mã SV ', h('strong', { text: ma }),
        (d && d.sinhVien.trangThai !== 'đang học') ? h('span', { class: 'chip chip-canhbao', text: d.sinhVien.trangThai, style: 'margin-left:8px' }) : null)));

    if (TRA.dangTai && !d) {
      khung.appendChild(h('p', { class: 'phu', role: 'status', text: 'Đang tải...' }));
      return;
    }
    if (TRA.loi && !d) {
      khung.appendChild(h('div', { class: 'bang bang-loi', role: 'alert' }, TRA.loi));
      khung.appendChild(h('button', { class: 'nut nut-chinh', type: 'button', onclick: taiChiTiet }, 'Thử lại'));
      return;
    }
    if (!d) return;
    if (TRA.loi) khung.appendChild(h('div', { class: 'bang bang-canhbao' }, 'Chưa làm mới được: ' + TRA.loi));

    const t = d.tongHop;
    khung.appendChild(h('p', { class: 'phu', text: 'Các buổi điểm danh của lớp bạn còn hiệu lực, từ ' + ngayHienThi(d.tuNgay) + ' đến ' + ngayHienThi(d.denNgay) + '.' }));

    if (t.canhBao) {
      khung.appendChild(h('div', { class: 'bang bang-canhbao', role: 'status' },
        h('strong', { text: 'Đạt ngưỡng cảnh báo' }),
        'Sinh viên đã vắng ' + t.soBuoiVang + ' buổi (ngưỡng cảnh báo là từ ' + d.nguongCanhBao + ' buổi).'));
    }

    const tyLe = (t.tyLeChuyenCan === null) ? '—' : (t.tyLeChuyenCan * 100).toFixed(1).replace('.', ',') + '%';
    function o(so, nhan) { return h('div', { class: 'tra-o' }, h('b', { text: String(so) }), h('span', { text: nhan })); }
    khung.appendChild(h('div', { class: 'tra-luoi' },
      o(t.soBuoiVang, 'buổi vắng'),
      o(t.soLuotVang, 'lượt vắng (theo môn)'),
      o(t.tongTietVang, 'tổng tiết vắng'),
      o(tyLe, 'tỷ lệ chuyên cần'),
      o(t.tietKhongPhep, 'tiết không phép'),
      o(t.tietCoPhep, 'tiết có phép')));
    khung.appendChild(h('p', { class: 'phu', text: 'Tỷ lệ chuyên cần = 1 − tổng tiết vắng ÷ tổng tiết lớp đã học (' + t.tongTietLop + ' tiết).' }));

    if (!d.cacLuot.length) {
      khung.appendChild(h('div', { class: 'bang bang-ok' }, 'Sinh viên chưa vắng buổi nào trong khoảng thời gian này.'));
      return;
    }

    khung.appendChild(h('h2', { text: 'Chi tiết từng lượt vắng' }));
    let nhomHienTai = '';
    d.cacLuot.forEach(function (l) {
      const khoaNhom = l.ngay + '|' + l.buoi;
      if (khoaNhom !== nhomHienTai) {
        nhomHienTai = khoaNhom;
        khung.appendChild(h('div', { class: 'tra-nhom', text: tenThuCuaNgay(l.ngay) + ' ' + ngayHienThi(l.ngay) + ' · ' + tenBuoiHoa(l.buoi) }));
      }
      khung.appendChild(h('div', { class: 'tra-luot ' + (l.coPhep ? 'co-phep' : 'khong-phep') },
        h('strong', { text: l.tenMon }), h('span', { class: 'phu', text: ' (tiết ' + l.tuTiet + '-' + l.denTiet + ')' }),
        h('div', null,
          'Vắng ' + l.soTietVang + ' tiết · ',
          h('span', { class: 'chip ' + (l.coPhep ? 'chip-ok' : 'chip-canhbao'), text: l.coPhep ? 'có phép' : 'không phép' }),
          l.trangThai === 'đã sửa tay' ? h('span', { class: 'chip chip-xam', text: 'đã sửa tay', style: 'margin-left:6px' }) : null),
        l.coPhep && l.lyDo ? h('div', { class: 'phu', text: 'Lý do: ' + l.lyDo }) : null));
    });
    if (d.biCatBot) {
      khung.appendChild(h('p', { class: 'phu', text: 'Chỉ hiện ' + d.cacLuot.length + ' lượt mới nhất. Số liệu tổng hợp ở trên đã tính đủ.' }));
    }
  }

  // Quay lại danh sách nhưng giữ chữ đang tìm
  function datLaiTraCuuGiuTuKhoa() {
    const tuKhoa = TRA.tuKhoa;
    datLaiTraCuu();
    TRA.tuKhoa = tuKhoa;
  }
})();
