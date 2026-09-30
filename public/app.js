/* Static, dependency-free invitation. Owner settings: config.js. */
(() => {
  'use strict';
  const c = window.WEDDING;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const setText = (s, value) => $$(s).forEach(el => { el.textContent = value; });
  const token = new URLSearchParams(location.search).get('guest') || '';
  const validToken = /^[a-f0-9]{32}$/.test(token);
  let galleryIndex = 0, toastTimer;
  const safeUrl = (value) => { const u = new URL(value, location.href); if (!['http:', 'https:'].includes(u.protocol)) throw new Error('URL tidak valid'); return u.href; };
  const make = (tag, className, content) => { const el = document.createElement(tag); if (className) el.className = className; if (content !== undefined) el.textContent = content; return el; };
  function notify(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4000); }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { const box = make('textarea'); box.value = text; box.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.append(box); box.select(); const ok = document.execCommand('copy'); box.remove(); return ok; }
  }
  function download(filename, content, type) { const url = URL.createObjectURL(new Blob([content], { type })); const a = make('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function imageFallback(img) { img.addEventListener('error', () => { const fallback = make('div', 'image-fallback', 'Foto akan segera hadir'); img.replaceWith(fallback); }, { once: true }); }
  function formatDate(options) { return new Intl.DateTimeFormat('id-ID', { timeZone: c.timeZone, ...options }).format(new Date(c.date)); }
  document.documentElement.dataset.theme = ['sage','rose','midnight'].includes(c.theme) ? c.theme : 'sage';
  document.title = `${c.couple.groomShort} & ${c.couple.brideShort} — Undangan Pernikahan`;
  setText('[data-groom-short]', c.couple.groomShort); setText('[data-bride-short]', c.couple.brideShort);
  setText('#groom-full', c.couple.groom); setText('#bride-full', c.couple.bride);
  setText('.date-day', formatDate({ day: '2-digit' }));
  setText('.date-month', formatDate({ month: 'long', year: 'numeric' }).toUpperCase());
  setText('.date-weekday', formatDate({ weekday: 'long' }) + ' · ' + c.timeZoneLabel);
  setText('.monogram i', formatDate({ day: '2-digit', month: '2-digit', year: '2-digit' }).replaceAll('/', ' · '));
  setText('.footer-year', formatDate({ year: 'numeric' }));
  $('#sample-notice').hidden = !c.sample;
  $('#hero-photo').src = safeUrl(c.heroPhoto);
  $('#hero-photo').alt = c.photosAreSamples ? 'Foto inspirasi dekorasi pernikahan, bukan foto mempelai' : `Foto ${c.couple.groomShort} dan ${c.couple.brideShort}`;
  imageFallback($('#hero-photo'));
  $('#gallery-note').textContent = c.photosAreSamples ? 'Foto inspirasi · akan diganti dengan foto kami.' : 'Kenangan yang akan selalu kami simpan.';
  c.events.forEach((event, index) => {
    const card = make('article', 'event-card');
    card.append(make('span', 'event-number', `0${index + 1}`), make('span','small-label', index === 0 ? 'JANJI SUCI' : 'RAYAKAN BERSAMA'), make('h3','',event.title), make('p','event-date',formatDate({ weekday:'long', day:'numeric',month:'long',year:'numeric' })), make('p','event-time',event.time));
    const place = make('div','event-location'); const link = make('a','text-link','Petunjuk arah');
    link.href = safeUrl(event.mapUrl); link.target = '_blank'; link.rel = 'noopener noreferrer'; link.append(make('span','','↗'));
    place.append(make('strong','',event.venue),make('p','',event.address),link);card.append(place);$('#events').append(card);
  });
  function tick() {
    let remaining = Math.max(0, Math.floor((new Date(c.date).getTime() - Date.now()) / 1000));
    if (!remaining) $('#countdown-label').textContent = Date.now() > new Date(c.endDate).getTime() ? 'Terima kasih atas doa dan cinta Anda.' : 'Hari bahagia kami telah tiba!';
    for (const [id, divisor] of [['days',86400],['hours',3600],['minutes',60],['seconds',1]]) { $(`#${id}`).textContent = String(Math.floor(remaining / divisor)).padStart(2,'0'); remaining %= divisor; }
  }
  tick(); setInterval(tick, 1000);
  $('#calendar-button').addEventListener('click', () => {
    const esc = s => String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
    const utc = d => new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    // Fold by UTF-8 octets so long Indonesian names remain valid iCalendar.
    const fold = line => { const parts=[]; let current=''; let size=0; for (const ch of line) { const bytes=new TextEncoder().encode(ch).length; if(size+bytes>73){parts.push(current);current=' ';size=1;}current+=ch;size+=bytes;}parts.push(current);return parts.join('\r\n'); };
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//KM Wedding//ID','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:km-wedding-${utc(c.date)}@invitation.local`,`DTSTAMP:${utc(new Date())}`,`DTSTART:${utc(c.date)}`,`DTEND:${utc(c.endDate)}`,`SUMMARY:${esc(`Pernikahan ${c.couple.groomShort} & ${c.couple.brideShort}${c.sample ? ' (CONTOH)' : ''}`)}`,`LOCATION:${esc(c.events[0].venue+', '+c.events[0].address)}`,`DESCRIPTION:${esc(c.sample ? 'Acara contoh. Konfirmasikan tanggal dan lokasi dengan mempelai.' : 'Kami menantikan kehadiran dan doa Anda.')}`,'END:VEVENT','END:VCALENDAR'];
    download('pernikahan-khawaritzmi-mariani.ics',lines.map(fold).join('\r\n')+'\r\n','text/calendar;charset=utf-8'); notify(c.sample ? 'Kalender contoh diunduh.' : 'Undangan kalender diunduh.');
  });
  c.gallery.forEach((photo,index) => { const button = make('button','gallery-item'); button.type='button'; button.setAttribute('aria-label',`Lihat foto: ${photo.caption}`); const img=make('img'); img.src=safeUrl(photo.src); img.alt=photo.alt;img.loading='lazy';imageFallback(img);const caption=make('span','',photo.caption);caption.append(make('i','',`0${index+1} ↗`));button.append(img,caption);button.addEventListener('click',()=>openPhoto(index));$('#gallery').append(button); });
  const lightbox=$('#lightbox');
  function openPhoto(index) { galleryIndex=(index+c.gallery.length)%c.gallery.length;const photo=c.gallery[galleryIndex];$('#lightbox-image').src=safeUrl(photo.src);$('#lightbox-image').alt=photo.alt;$('#lightbox-caption').textContent=photo.caption;if(!lightbox.open){lightbox.showModal();document.body.style.overflow='hidden';} }
  $('.lightbox-close').addEventListener('click',()=>lightbox.close());$('.lightbox-prev').addEventListener('click',()=>openPhoto(galleryIndex-1));$('.lightbox-next').addEventListener('click',()=>openPhoto(galleryIndex+1));lightbox.addEventListener('close',()=>{document.body.style.overflow='';});lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')openPhoto(galleryIndex-1);if(e.key==='ArrowRight')openPhoto(galleryIndex+1);});
  setText('#bank-name',c.bank.name);setText('#bank-number',c.bank.number);setText('#bank-holder',c.bank.holder);$('#bank-warning').hidden=!c.bank.isDummy;
  $('#copy-account').addEventListener('click',async()=>{try{notify(await copy(c.bank.number) ? (c.bank.isDummy?'Nomor dummy disalin — jangan transfer.':'Nomor rekening berhasil disalin.'):'Tidak dapat menyalin. Silakan salin nomor secara manual.');}catch{notify('Silakan salin nomor rekening secara manual.');}});
  if(c.music){const audio=new Audio(safeUrl(c.music));audio.loop=true;const button=$('#music-toggle');button.hidden=false;button.addEventListener('click',async()=>{try{if(audio.paused){await audio.play();button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','Jeda musik');}else{audio.pause();button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Putar musik');}}catch{notify('Musik belum dapat diputar.');}});}
  setText('#contact-phone', c.contact.phone);
  $('#copy-phone').addEventListener('click', async () => {
    try { notify(await copy(c.contact.phone) ? 'Nomor telepon berhasil disalin.' : 'Silakan salin nomor telepon secara manual.'); }
    catch { notify('Silakan salin nomor telepon secara manual.'); }
  });
  async function loadGuest() {
    if (!token) return;
    try {
      if (!validToken) throw new Error('Invalid token');
      const response = await fetch(`invitations/${token}.json`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Not found');
      const guest = await response.json();
      if (!guest || typeof guest.name !== 'string' || !guest.name.trim()) throw new Error('Invalid invitation');
      $('#guest-name').textContent = guest.name;
      $('#guest-note').textContent = 'Undangan ini kami persembahkan khusus untuk Anda.';
    } catch {
      $('#guest-name').textContent = 'Tautan undangan tidak ditemukan';
      $('#guest-note').textContent = 'Mohon hubungi mempelai untuk mendapatkan tautan yang benar.';
    }
  }
  loadGuest();
})();
