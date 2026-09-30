# Undangan Khawaritzmi & Mariani

Situs undangan berbahasa Indonesia, responsif, tanpa Node.js atau framework. Nama lengkap mempelai sudah dipasang:

- Khawaritzmi Abdallah Ahmad S.Si., M.Eng.
- Mariani, S.Si., M.Si.

## Coba sekarang

Di terminal pada folder proyek, jalankan:

```powershell
python scripts/preview.py
```

Browser membuka **http://localhost:8000/**. Jangan membuka `public/index.html` langsung sebagai `file://`: pemuatan undangan personal memerlukan server HTTP.

Untuk mengelola tamu, buka **tools/guests.html** dengan klik ganda, lalu pilih **data/guests.csv**. Ada tepat **800 tamu contoh**, masing-masing dengan token acak 128-bit yang berbeda. Editor dapat mencari, mengubah nama dan batas jumlah tamu, menambah tamu, menyalin tautan, dan mengekspor seluruh tautan.

## Fitur

- Nama penerima personal melalui `?guest=TOKEN`; tidak menampilkan daftar tamu lain.
- Nama lengkap mempelai, tanggal, hitung mundur, akad, resepsi, peta, dan unduhan kalender `.ics`.
- Galeri dengan tampilan foto besar, tombol sebelumnya/selanjutnya, serta dukungan keyboard dan Escape.
- Rekening Mariani langsung terlihat dan dapat disalin. Rekening awal **0000000000** adalah dummy, **jangan ditransfer**.
- Nomor **082194905095** dengan tombol salin untuk mengirim ucapan dan konfirmasi melalui aplikasi pesan.
- Situs sepenuhnya statis: tanpa database, Supabase, atau layanan formulir.
- Tiga tema: sage, rose, midnight; font lokal, foto lokal, navigasi mobile, dukungan reduced motion.
- Musik opsional milik Anda, diputar hanya setelah tombol musik ditekan.
- Alur deployment GitHub Pages yang hanya mengunggah folder `public`.

## Ganti konten dan tema

Edit **public/config.js**. Tidak perlu mengubah HTML atau JavaScript aplikasi:

| Pengaturan | Fungsi |
| --- | --- |
| `theme` | `sage`, `rose`, atau `midnight` |
| `couple` | Nama pendek dan nama lengkap |
| `date`, `endDate` | Tanggal ISO dengan zona waktu, misalnya `2027-06-20T09:00:00+07:00` |
| `timeZone`, `timeZoneLabel` | Zona tampilan, misalnya `Asia/Jakarta`, `WIB` |
| `events` | Jam, nama tempat, alamat, dan URL Google Maps tiap acara |
| `heroPhoto`, `gallery` | Lokasi foto, deskripsi, dan keterangan |
| `photosAreSamples` | `false` sesudah memasukkan foto asli |
| `bank` | Bank, nomor rekening sebagai **teks**, pemilik, dan `isDummy: false` |
| `music` | Berkas MP3, misalnya `assets/music.mp3`; kosong berarti tanpa musik |
| `sample` | `false` setelah seluruh detail contoh diganti |
| `contact.phone` | Nomor telepon tujuan ucapan, sebagai teks |

Taruh foto Anda di **public/assets/** (JPG/WebP, disarankan di bawah 500 KB per foto). Kemudian ganti jalurnya di `config.js`. Tiga foto awal hanya foto inspirasi dekorasi, **bukan foto mempelai**. Jangan memakai `/assets/...` dengan garis miring di awal, agar tetap berfungsi pada alamat proyek GitHub Pages seperti `/wedding/`.

Warna, ukuran, dan tata letak lebih lanjut ada di **public/styles.css**. Semua warna utama memakai variabel CSS di bagian atas.

## Ganti 800 tamu dan bagikan tautan

1. Buka `tools/guests.html`, impor `data/guests.csv`.
2. Ubah nama dan `max_party` (1–10). Token jangan diganti jika tautan sudah dibagikan. Daftar juga bisa diedit di spreadsheet; pertahankan format token sebagai teks.
3. Unduh daftar, lalu simpan sebagai `data/guests.csv` menggantikan berkas sebelumnya.
4. Jalankan `python scripts/build.py` untuk membuat JSON undangan. Setiap tamu akan mendapat berkas undangan sendiri di `public/invitations/`.
5. Unggah ulang `public/`, masukkan alamat situs pada editor tamu, dan ekspor atau salin tautannya.

Untuk menghapus tamu, hapus barisnya di CSV dan bangun ulang. Build mengganti JSON undangan yang dihasilkan sebelumnya. Jangan mengganti token setelah tautan dibagikan.

Daftar tamu asli bisa diisi nanti. Buka `tools/guests.html`, impor CSV, ubah atau tambah nama, lalu simpan hasilnya ke `data/guests.csv`. Jalankan `python scripts/build.py` dan unggah ulang situs. Editor dapat mengekspor tautan unik untuk setiap orang, berbentuk `https://USERNAME.github.io/REPOSITORY/?guest=TOKEN`.

`python scripts/build.py --generate` hanya untuk menghasilkan daftar contoh pertama kali dan menolak menimpa daftar yang sudah ada.

**Privasi:** nama dalam JSON undangan yang dipublikasikan bukan data rahasia. Berkas repositori publik dapat dilihat siapa saja, dan tautan personal dapat diteruskan. Jangan masukkan alamat rumah atau data sensitif dalam daftar tamu. CSV sumber tetap lokal; hanya JSON hasil build yang diperlukan situs.

## Ucapan dan konfirmasi

Tamu menyalin nomor **082194905095**, lalu mengirim pesan melalui aplikasi pesan mereka dengan menyertakan nama. Situs tidak menyimpan atau mengirim RSVP maupun ucapan. Tidak diperlukan akun database atau API key.

Nomor dapat diubah pada `contact.phone` di `public/config.js`. `backend/schema.sql` dan `scripts/test_database.cjs` adalah berkas backend lama yang tidak digunakan dalam versi GitHub-only ini. Build tidak lagi menghasilkan SQL seed dan tidak memakai opsi `--live`.

## Hosting gratis di GitHub Pages

1. Buat repositori GitHub. Paket GitHub Free mendukung Pages untuk repositori publik.
2. Unggah folder **public/** dan berkas **.github/workflows/pages.yml**, dengan struktur folder tetap sama. Jangan mengunggah `data`, `.tools`, atau hasil pengujian. Jika memakai Git, `.gitignore` sudah membantu mengecualikannya.
3. Gunakan branch **main**. Buka **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Jalankan workflow **Deploy wedding invitation**, atau push perubahan ke `main`.
5. Setelah berhasil, alamatnya biasanya `https://USERNAME.github.io/REPOSITORY/`. Masukkan alamat itu ke editor tamu untuk mengekspor tautan yang benar.

Workflow hanya menerbitkan `public/`; tidak menjalankan build tamu. Selalu jalankan build lokal setelah perubahan CSV sebelum mengunggah.

## Pemeriksaan sebelum membagikan

- Ganti tanggal, akhir acara, jam, lokasi dan tautan peta; pastikan kalender benar.
- Ganti foto inspirasi dengan foto Anda, kemudian nonaktifkan label contoh.
- Verifikasi nomor rekening dan pemiliknya sebelum `isDummy: false`.
- Ganti nama contoh, bangun ulang JSON, dan ekspor tautan personal dari editor.
- Uji satu undangan personal, satu tautan salah, tombol salin nomor telepon dan rekening, kalender, serta galeri pada ponsel.
- Nomor kontak dan semua detail acara harus benar sebelum tautan dibagikan.

## Pengujian pengembang

`scripts/test_site.py` menguji undangan personal, tombol salin, galeri, kalender, tampilan ponsel, path GitHub Pages, dan editor tamu memakai Python Playwright dan Chrome lokal. Dependensi pengujian tidak diperlukan oleh situs. Screenshot disimpan di `test-results/` dan tidak dipublikasikan.

```powershell
python -m pip install --target .tools -r scripts/requirements-test.txt
python scripts/test_site.py
```

## Referensi dan aset

- [GitHub Pages: hosting situs statis](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- Foto dekorasi awal: [sumber gambar 1](https://images.unsplash.com/photo-1519741497674-611481863552), [sumber gambar 2](https://images.unsplash.com/photo-1519225421980-715cb0215aed), [sumber gambar 3](https://images.unsplash.com/photo-1523438885200-e635ba2c371e). Mengikuti [lisensi Unsplash](https://unsplash.com/license). Ganti dengan foto milik Anda sebelum membagikan.
- Font: Cormorant Garamond dan DM Sans, disertakan lokal beserta lisensi OFL di `public/assets/fonts/`.
- Ornamen botanical dan monogram berupa SVG lokal yang bisa diedit.
