(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  $('year').textContent=new Date().getFullYear();
  const id=new URLSearchParams(location.search).get('id');
  const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR_');
  function videoMarkup(title,url){
    let driveId=null;
    try{const u=new URL(url);if(/(^|\.)drive\.google\.com$/.test(u.hostname)){const m=u.pathname.match(/\/file\/d\/([\w-]+)/);driveId=(m&&m[1])||u.searchParams.get('id');}}catch(_){}
    const media=driveId
      ? '<iframe src="https://drive.google.com/file/d/'+encodeURIComponent(driveId)+'/preview" title="'+esc(title)+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'
      : '<video controls playsinline autoplay preload="metadata" src="'+esc(url)+'"></video>';
    return '<div class="player-stage">'+media+'<button class="fullscreen-button" type="button" aria-label="Perbesar video" title="Layar penuh">⛶ <span>Layar penuh</span></button></div>';
  }
  function showEpisode(ep,index){
    $('watch-player').innerHTML=videoMarkup(ep.title,ep.video_url);
    const stage=$('watch-player').querySelector('.player-stage');
    const fullButton=stage.querySelector('.fullscreen-button');
    fullButton.addEventListener('click',async()=>{
      const media=stage.querySelector('video,iframe');
      try{
        if(document.fullscreenElement){await document.exitFullscreen();}
        else if(stage.requestFullscreen){await stage.requestFullscreen();}
        else if(media&&media.webkitEnterFullscreen){media.webkitEnterFullscreen();}
        else{alert('Mode layar penuh tidak didukung browser ini. Coba buka melalui Chrome.');}
      }catch(error){
        if(media&&media.webkitEnterFullscreen)media.webkitEnterFullscreen();
        else alert('Tidak bisa membuka layar penuh. Coba putar video langsung dari pemutar.');
      }
    });
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