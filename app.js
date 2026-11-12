(() => {
  const grid=document.getElementById('anime-grid'), search=document.getElementById('search'), modal=document.getElementById('player-modal'), player=document.getElementById('player-content');
  document.getElementById('year').textContent=new Date().getFullYear();
  const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR_');
  let db=null,anime=[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function drivePreview(value){try{const u=new URL(value);if(!/(^|\\.)drive\\.google\\.com$/.test(u.hostname))return null;const m=u.pathname.match(/\\/file\\/d\\/([a-zA-Z0-9_-]+)/);const id=(m&&m[1])||u.searchParams.get('id');return id?'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview':null;}catch(_){return null;}}
  function render(){const q=search.value.trim().toLowerCase(),rows=anime.filter(a=>(a.title||'').toLowerCase().includes(q)||(a.genre||'').toLowerCase().includes(q));grid.innerHTML=rows.length?rows.map(a=>`<article class="anime-card" data-id="${esc(a.id)}"><div class="poster">${a.poster_url?`<img loading="lazy" src="${esc(a.poster_url)}" alt="Poster ${esc(a.title)}" onerror="this.remove()">`:'<span class="placeholder">SA</span>'}</div><div class="anime-info"><h3>${esc(a.title)}</h3><p>${esc(a.genre||'Anime')}</p></div></article>`).join(''):'<div class="empty-state">Anime belum tersedia atau tidak ditemukan.</div>';grid.querySelectorAll('.anime-card').forEach(c=>c.addEventListener('click',()=>openPlayer(c.dataset.id)));}
  function playMarkup(title,url){const drive=drivePreview(url);return drive?`<iframe src="${esc(drive)}" title="Pemutar ${esc(title)}" width="100%" height="360" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border:0;border-radius:12px"></iframe><small class="muted">Jika video tidak muncul, pastikan akses Drive disetel "Siapa saja yang memiliki link".</small>`:`<video controls playsinline preload="metadata" src="${esc(url)}"></video>`;}
  async function openPlayer(id){
    const a=anime.find(x=>String(x.id)===String(id));if(!a)return;
    player.innerHTML='<h2>'+esc(a.title)+'</h2><p class="muted">Memuat episode...</p>';modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    const {data:episodes,error}=await db.from('episodes').select('*').eq('anime_id',a.id).order('episode_number',{ascending:true});
    if(error){player.innerHTML='<h2>'+esc(a.title)+'</h2>'+ (a.video_url?playMarkup(a.title,a.video_url):'<div class="empty-state">Belum ada episode. Admin perlu menjalankan SQL migrasi episode.</div>')+'<p>'+esc(a.description||'')+'</p>';return;}
    if(episodes&&episodes.length){
      const first=episodes[0];player.innerHTML='<h2>'+esc(a.title)+'</h2><div id="episode-player">'+playMarkup(first.title,first.video_url)+'</div><div class="episode-list"><h3>Daftar Episode</h3><div class="episode-buttons">'+episodes.map((ep,i)=>`<button class="button secondary small" data-episode="${i}">Episode ${esc(ep.episode_number)} — ${esc(ep.title)}</button>`).join('')+'</div></div><p>'+esc(a.description||'')+'</p>';
      player.querySelectorAll('[data-episode]').forEach(b=>b.addEventListener('click',()=>{const ep=episodes[Number(b.dataset.episode)];player.querySelector('#episode-player').innerHTML=playMarkup(ep.title,ep.video_url);}));
    }else{
      const fallback=a.video_url?playMarkup(a.title,a.video_url):'<div class="empty-state">Episode belum tersedia.</div>';
      player.innerHTML='<h2>'+esc(a.title)+'</h2>'+fallback+'<p>'+esc(a.description||'Belum ada deskripsi.')+'</p><small class="muted">'+esc(a.genre||'')+'</small>';
    }
  }
  function close(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');player.innerHTML='';}
  document.getElementById('close-player').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});search.addEventListener('input',render);
  async function load(){if(!configured||!window.supabase){grid.innerHTML='<div class="empty-state">Hubungkan Supabase melalui supabase-config.js.</div>';return;}db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);const {data,error}=await db.from('anime').select('*').order('created_at',{ascending:false});if(error){grid.innerHTML='<div class="empty-state">Gagal memuat katalog: '+esc(error.message)+'</div>';return;}anime=data||[];render();}
  load();
})();