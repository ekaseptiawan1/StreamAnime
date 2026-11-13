(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  $('year').textContent=new Date().getFullYear();
  const id=new URLSearchParams(location.search).get('id');
  const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR_');
  function posterUrl(value){try{const u=new URL(value);if(u.hostname==='dropbox.com'||u.hostname.endsWith('.dropbox.com')){u.searchParams.set('raw','1');u.searchParams.delete('dl');}return u.href;}catch(_){return '';}}
  function showError(message){$('detail-status').textContent=message;}
  async function init(){
    if(!id){showError('Anime tidak ditemukan. Kembali ke katalog dan pilih poster.');return;}
    if(!configured||!window.supabase){showError('Konfigurasi Supabase belum tersedia.');return;}
    const db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    const {data:anime,error}=await db.from('anime').select('*').eq('id',id).single();
    if(error||!anime){showError('Anime tidak ditemukan atau gagal dimuat.');return;}
    const {data:episodes,error:episodeError}=await db.from('episodes').select('id,anime_id,episode_number,title,video_url').eq('anime_id',anime.id).order('episode_number',{ascending:true});
    let list=(!episodeError&&episodes?episodes:[]).filter(ep=>ep.video_url&&!isDrive(ep.video_url));
    if(!list.length&&anime.video_url&&!isDrive(anime.video_url))list=[{id:'legacy',episode_number:1,title:'Episode 1',video_url:anime.video_url}];
    $('detail-title').textContent=anime.title||'Anime';
    $('detail-genre').textContent=anime.genre||'Anime';
    $('detail-description').textContent=anime.description||'Pilih episode untuk mulai menonton.';
    $('detail-episode-count').textContent=list.length+' episode tersedia';
    const poster=$('detail-poster');poster.referrerPolicy='no-referrer';poster.src=posterUrl(anime.poster_url||'');poster.alt='Poster '+(anime.title||'anime');
    poster.onerror=()=>{poster.style.display='none';};
    $('detail-episode-list').innerHTML=list.length?list.map((ep,i)=>'<a class="detail-episode" href="watch.html?id='+encodeURIComponent(anime.id)+'&episode='+encodeURIComponent(ep.id)+'"><span class="episode-number">'+esc(ep.episode_number||i+1)+'</span><span class="detail-episode-name">'+esc(ep.title||('Episode '+(i+1)))+'</span><span class="episode-play">▶</span></a>').join(''):'<div class="empty-state">Episode belum ditambahkan untuk anime ini.</div>';
    $('detail-status').hidden=true;$('anime-detail').hidden=false;
    document.title=(anime.title||'Detail Anime')+' — StreamAnime';
  }
  function isDrive(url){try{const h=new URL(url).hostname;return h==='drive.google.com'||h.endsWith('.drive.google.com');}catch(_){return false;}}
  init();
})();