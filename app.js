(() => {
  const grid=document.getElementById('anime-grid');
  const search=document.getElementById('search');
  const year=document.getElementById('year');
  if(year) year.textContent=new Date().getFullYear();
  const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR_');
  let db=null,anime=[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function posterUrl(value){try{const u=new URL(value);if(u.hostname==='dropbox.com'||u.hostname.endsWith('.dropbox.com')){u.searchParams.set('raw','1');u.searchParams.delete('dl');}return u.href;}catch(_){return '';}}
  function render(){
    const q=search.value.trim().toLowerCase();
    const rows=anime.filter(a=>(a.title||'').toLowerCase().includes(q)||(a.genre||'').toLowerCase().includes(q));
    grid.innerHTML=rows.length?rows.map(a=>`<a class="anime-card" href="anime.html?id=${encodeURIComponent(a.id)}" aria-label="Lihat daftar episode ${esc(a.title)}"><div class="poster">${a.poster_url?`<img loading="lazy" referrerpolicy="no-referrer" src="${esc(posterUrl(a.poster_url))}" alt="Poster ${esc(a.title)}" onerror="this.outerHTML='<span class=placeholder>SA</span>'">`:'<span class="placeholder">SA</span>'}<span class="poster-play"><span>▶</span> LIHAT EPISODE</span></div><div class="anime-info"><h3>${esc(a.title)}</h3><p>${esc(a.genre||'Anime')}</p></div></a>`).join(''):'<div class="empty-state">Anime belum tersedia atau tidak ditemukan.</div>';
  }
  async function load(){
    if(!configured||!window.supabase){grid.innerHTML='<div class="empty-state">Hubungkan Supabase melalui supabase-config.js.</div>';return;}
    db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    const {data,error}=await db.from('anime').select('*').order('created_at',{ascending:false});
    if(error){grid.innerHTML='<div class="empty-state">Gagal memuat katalog: '+esc(error.message)+'</div>';return;}
    anime=data||[];render();
  }
  search.addEventListener('input',render);
  load();
})();