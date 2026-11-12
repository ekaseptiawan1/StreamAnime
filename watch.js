(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  $('year').textContent=new Date().getFullYear();
  const id=new URLSearchParams(location.search).get('id');
  const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR_');
  function videoMarkup(title,url){
    let driveId=null;
    try{const u=new URL(url);if(/(^|\.)drive\.google\.com$/.test(u.hostname)){const m=u.pathname.match(/\/file\/d\/([\w-]+)/);driveId=(m&&m[1])||u.searchParams.get('id');}}catch(_){}
    if(driveId)return '<iframe src="https://drive.google.com/file/d/'+encodeURIComponent(driveId)+'/preview" title="'+esc(title)+'" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    return '<video controls playsinline autoplay preload="metadata" src="'+esc(url)+'"></video>';
  }
  function showEpisode(ep,index){
    $('watch-player').innerHTML=videoMarkup(ep.title,ep.video_url);
    $('watch-title').textContent=ep.title||('Episode '+(index+1));
    document.querySelectorAll('.watch-episode').forEach((b,i)=>b.classList.toggle('active',i===index));
    document.title=(ep.title||'Menonton')+' — StreamAnime';
  }
  async function init(){
    if(!id){$('watch-status').textContent='Anime tidak ditemukan. Kembali ke katalog dan pilih thumbnail.';return;}
    if(!configured||!window.supabase){$('watch-status').textContent='Konfigurasi Supabase belum tersedia.';return;}
    const db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    const {data:anime,error}=await db.from('anime').select('*').eq('id',id).single();
    if(error||!anime){$('watch-status').textContent='Anime tidak ditemukan atau gagal dimuat.';return;}
    const {data:episodes,error:episodeError}=await db.from('episodes').select('*').eq('anime_id',anime.id).order('episode_number',{ascending:true});
    let list=(!episodeError&&episodes&&episodes.length)?episodes:[];
    if(!list.length&&anime.video_url)list=[{title:anime.title,video_url:anime.video_url,episode_number:1}];
    if(!list.length){$('watch-status').textContent='Video belum tersedia untuk anime ini.';return;}
    $('watch-status').hidden=true;$('watch-layout').hidden=false;
    $('watch-episodes').innerHTML=list.map((ep,i)=>'<button class="watch-episode" type="button" data-index="'+i+'"><span class="episode-number">'+esc(ep.episode_number||i+1)+'</span><span>'+esc(ep.title||('Episode '+(i+1)))+'</span><span class="episode-play">▶</span></button>').join('');
    $('watch-episodes').querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>showEpisode(list[i],i)));
    $('watch-layout').querySelector('.watch-heading').insertAdjacentHTML('beforeend','');
    $('watch-title').textContent=anime.title;
    $('watch-description').textContent=anime.description||anime.genre||'';
    showEpisode(list[0],0);
  }
  init();
})();