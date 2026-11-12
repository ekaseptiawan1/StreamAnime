(() => {
  const grid=document.getElementById('anime-grid');
  const search=document.getElementById('search');
  const year=document.getElementById('year');
  if(year) year.textContent=new Date().getFullYear();
  const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR_');
  let db=null,anime=[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(){
    const q=search.value.trim().toLowerCase();
    const rows=anime.filter(a=>(a.title||'').toLowerCase().includes(q)||(a.genre||'').toLowerCase().includes(q));
    grid.innerHTML=rows.length?rows.map(a=>`<a class="anime-card" href="watch.html?id=${encodeURIComponent(a.id)}" aria-label="Tonton ${esc(a.title)}"><div class="poster">${a.poster_url?`<img loading="lazy" src="${esc(a.poster_url)}" alt="Poster ${esc(a.title)}" onerror="this.remove()">`:'<span class="placeholder">SA</span>'}<span class="poster-play"><span>▶</span> TONTON</span></div><div class="anime-info"><h3>${esc(a.title)}</h3><p>${esc(a.genre||'Anime')}</p></div></a>`).join(''):'<div class="empty-state">Anime belum tersedia atau tidak ditemukan.</div>';
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