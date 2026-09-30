// Semua pengaturan utama undangan ada di sini. Setelah mengubah, unggah ulang situs.
window.WEDDING = {
  theme: 'sage', // sage | rose | midnight
  sample: true, // Ubah ke false setelah tanggal, lokasi, foto, dan rekening benar.
  couple: {
    groom: 'Khawaritzmi Abdallah Ahmad S.Si., M.Eng.',
    bride: 'Mariani, S.Si., M.Si.',
    groomShort: 'Khawaritzmi', brideShort: 'Mariani'
  },
  date: '2027-01-23T09:00:00+08:00',
  endDate: '2027-01-23T14:00:00+08:00',
  timeZone: 'Asia/Makassar', timeZoneLabel: 'WITA',
  events: [
    { title: 'Akad Nikah', time: '09.00 – 10.00 WITA', venue: 'Hotel Unhas', address: 'Jl. Perintis Kemerdekaan KM 10 (Kampus UNHAS), Makassar, Sulawesi Selatan', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Hotel+Unhas+Makassar' },
    { title: 'Resepsi', time: '11.00 – 14.00 WITA', venue: 'Hotel Unhas', address: 'Jl. Perintis Kemerdekaan KM 10 (Kampus UNHAS), Makassar, Sulawesi Selatan', mapUrl: 'https://www.google.com/maps/search/?api=1&query=Hotel+Unhas+Makassar' }
  ],
  bank: { name: 'BANK CONTOH', number: '0000000000', holder: 'Mariani', isDummy: true },
  heroPhoto: 'assets/venue.jpg',
  gallery: [
    { src: 'assets/venue.jpg', alt: 'Inspirasi dekorasi pernikahan di taman', caption: 'Sebuah awal yang indah' },
    { src: 'assets/table.jpg', alt: 'Inspirasi meja perjamuan pernikahan', caption: 'Merayakan kebersamaan' },
    { src: 'assets/flowers.jpg', alt: 'Inspirasi bunga dan dekorasi pernikahan', caption: 'Detail penuh cinta' }
  ],
  photosAreSamples: true,
  // Opsional: berkas musik milik Anda, mis. assets/music.mp3. Tidak diputar otomatis.
  music: '',
  // Nomor tujuan ucapan dan konfirmasi, disimpan sebagai teks agar nol awal tetap ada.
  contact: { phone: '082194905095' }
};
