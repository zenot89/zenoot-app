-- ═══════════════════════════════════════════════════════════════════════════
-- zenoot-akun-pribadi.sql  (6 Nov 2026)
-- Struktur akun PRIBADI awal (buku Pribadi), terpisah dari akun usaha. Jalankan SESUDAH zenoot-pisah-pribadi-usaha.sql.
-- Aman dijalankan ulang (akun yang kodenya sudah ada dilewati). Nama/kode/akun boleh diubah atau dihapus di Kelola Akun.
-- Kode berawalan "P-" supaya tidak bentrok dengan kode akun usaha. 4 akun lama (EUMA, UDUD, KOPI, TUANG) tetap dengan kodenya.
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.kas_akun (kode, nama, kelompok, sub_kelompok, entitas)
SELECT v.kode, v.nama, v.kelompok, v.sub_kelompok, 'pribadi'
FROM (VALUES
  ('P-101', 'Kas Pribadi',                      'aset',       'Kas & Bank'),
  ('P-102', 'Tabungan',                         'aset',       'Tabungan'),
  ('P-201', 'Paylater / Kartu Kredit Pribadi',  'kewajiban',  'Hutang Pribadi'),
  ('P-401', 'Penghasilan Lain',                 'pendapatan', 'Penghasilan Pribadi'),
  ('P-501', 'Makan & Minum',                    'beban',      'Biaya Sehari-hari'),
  ('P-502', 'Transportasi',                     'beban',      'Biaya Sehari-hari'),
  ('P-503', 'Tagihan Rutin (listrik, internet, pulsa)', 'beban', 'Biaya Sehari-hari'),
  ('P-504', 'Belanja Kebutuhan',                'beban',      'Biaya Sehari-hari'),
  ('P-505', 'Kesehatan',                        'beban',      'Biaya Sehari-hari'),
  ('P-506', 'Hiburan',                          'beban',      'Biaya Sehari-hari'),
  ('P-507', 'Lain-lain (pribadi)',              'beban',      'Biaya Sehari-hari')
) AS v(kode, nama, kelompok, sub_kelompok)
WHERE NOT EXISTS (SELECT 1 FROM public.kas_akun a WHERE a.kode = v.kode);

SELECT kode, nama, kelompok, sub_kelompok, entitas FROM public.kas_akun WHERE entitas = 'pribadi' ORDER BY kelompok, kode;
