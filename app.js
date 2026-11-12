(() => {
  const grid = document.getElementById('anime-grid');
  const search = document.getElementById('search');
  const modal = document.getElementById('player-modal');
  const player = document.getElementById('player-content');
  document.getElementById('year').textContent = new Date().getFullYear();
  const configured = window.SUPABASE_URL && !window.SUPABASE_URL.includes('YOUR_PROJECT_ID') && window.SUPABASE_ANON_KEY && !window.SUPABASE_ANON_KEY.includes('YOUR_');
  let db = null, anime = [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    const q = search.value.trim().toLowerCase();
    const rows = anime.filter(a => (a.title || '').toLowerCase().includes(q) || (a.genre || '').toLowerCase().includes(q));
    grid.innerHTML = rows.length ? rows.map(a => `<article class="anime-card" data-id="${esc(a.id)}"><div class="poster">${a.poster_url ? `<img loading="lazy" src="${esc(a.poster_url)}" alt="Poster ${esc(a.title)}" onerror="this.remove()">` : '<span class="placeholder">SA</span>'}</div><div class="anime-info"><h3>${esc(a.title)}</h3><p>${esc(a.genre || 'Anime')}</p></div></article>`).join('') : '<div class="empty-state">Anime belum tersedia atau tidak ditemukan.</div>';
    grid.querySelectorAll('.anime-card').forEach(card => card.addEventListener('click', () => openPlayer(card.dataset.id)));
  }
  function openPlayer(id) {
    const a = anime.find(x => String(x.id) === String(id)); if (!a) return;
    player.innerHTML = `<h2>${esc(a.title)}</h2>${a.video_url ? `<video controls playsinline preload="metadata" src="${esc(a.video_url)}"></video>` : '<div class="empty-state">Video belum ditambahkan untuk anime ini.</div>'}<p>${esc(a.description || 'Belum ada deskripsi.')}</p><small class="muted">${esc(a.genre || '')}</small>`;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  }
  function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); player.innerHTML = ''; }
  document.getElementById('close-player').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  search.addEventListener('input', render);
  async function load() {
    if (!configured || !window.supabase) { grid.innerHTML = '<div class="empty-state">Website siap. Hubungkan Supabase dengan mengisi <b>supabase-config.js</b>, lalu jalankan SQL pada <b>supabase-schema.sql</b>.</div>'; return; }
    db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    const { data, error } = await db.from('anime').select('*').order('created_at', {ascending:false});
    if (error) { grid.innerHTML = `<div class="empty-state">Gagal memuat katalog: ${esc(error.message)}</div>`; return; }
    anime = data || []; render();
  }
  load();
})();