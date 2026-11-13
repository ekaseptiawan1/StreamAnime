(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  $('year').textContent=new Date().getFullYear();
  const params=new URLSearchParams(location.search);
  const id=params.get('id');
  const requestedEpisode=params.get('episode');
  const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR_');
  const fmt=t=>{if(!Number.isFinite(t))return '0:00';const s=Math.floor(t);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
  function isDriveUrl(url){try{const host=new URL(url).hostname;return host==='drive.google.com'||host.endsWith('.drive.google.com');}catch(_){return false;}}
  function dropboxDirectUrl(url){try{const u=new URL(url);if(!(u.hostname==='dropbox.com'||u.hostname.endsWith('.dropbox.com')))return url;u.searchParams.set('raw','1');u.searchParams.delete('dl');return u.toString();}catch(_){return url;}}
  function videoMarkup(title,url){
    const playableUrl=dropboxDirectUrl(url);
    return '<div class="player-stage custom-stage"><video class="stream-video" playsinline preload="auto" fetchpriority="high" src="'+esc(playableUrl)+'"></video><div class="player-loading" role="status"><span class="loading-spinner"></span><span>Menyiapkan video...</span></div><p class="player-error" hidden style="padding:12px;color:#ffb4b4;text-align:center">Video gagal dimuat. Pastikan link Dropbox dapat diakses publik dan file berformat MP4/WebM yang didukung browser.</p><button class="center-play" type="button" aria-label="Putar video">▶</button><div class="custom-controls"><div class="seek-row"><input class="seek-bar" type="range" min="0" max="1000" value="0" aria-label="Posisi video"><span class="time-display">0:00 / 0:00</span></div><div class="control-row"><button class="control-play" type="button" aria-label="Putar atau jeda">▶</button><button class="skip-back" type="button" aria-label="Mundur 10 detik">↶ 10</button><button class="skip-forward" type="button" aria-label="Maju 10 detik">10 ↷</button><button class="mute-button" type="button" aria-label="Bisukan">🔊</button><input class="volume-bar" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume"><select class="speed-select" aria-label="Kecepatan video"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select><button class="fullscreen-button" type="button" aria-label="Layar penuh">⛶</button></div></div></div>';
  }
  function setupCustom(stage){
    const video=stage.querySelector('video');if(!video)return;
    const play=stage.querySelector('.control-play'),center=stage.querySelector('.center-play'),seek=stage.querySelector('.seek-bar'),time=stage.querySelector('.time-display'),mute=stage.querySelector('.mute-button'),volume=stage.querySelector('.volume-bar'),speed=stage.querySelector('.speed-select');
    const loading=stage.querySelector('.player-loading');
    const showLoading=()=>{if(loading)loading.classList.remove('is-hidden');};
    const hideLoading=()=>{if(loading)loading.classList.add('is-hidden');};
    const toggle=()=>{
      if(!video.paused){video.pause();return;}
      showLoading();
      video.play().catch(()=>{hideLoading();});
    };
    play.addEventListener('click',toggle);center.addEventListener('click',toggle);video.addEventListener('click',toggle);
    const update=()=>{const playing=!video.paused;play.textContent=playing?'❚❚':'▶';center.textContent=playing?'':'▶';center.hidden=playing;time.textContent=fmt(video.currentTime)+' / '+fmt(video.duration);seek.value=video.duration?String(video.currentTime/video.duration*1000):'0';mute.textContent=video.muted||video.volume===0?'🔇':'🔊';};
    ['play','pause','timeupdate','loadedmetadata','durationchange','volumechange','ended'].forEach(e=>video.addEventListener(e,update));
    video.addEventListener('waiting',showLoading);
    video.addEventListener('stalled',showLoading);
    video.addEventListener('seeking',showLoading);
    ['playing','canplay','seeked'].forEach(e=>video.addEventListener(e,hideLoading));
    video.addEventListener('error',()=>{const note=stage.querySelector('.player-error');if(note){note.hidden=false;note.textContent='Video tidak dapat diputar (kode '+(video.error?.code||'tidak diketahui')+'). Coba link Dropbox publik dengan raw=1, atau gunakan URL MP4 langsung.';}});
    seek.addEventListener('input',()=>{if(video.duration)video.currentTime=Number(seek.value)/1000*video.duration;});
    stage.querySelector('.skip-back').addEventListener('click',()=>video.currentTime=Math.max(0,video.currentTime-10));
    stage.querySelector('.skip-forward').addEventListener('click',()=>video.currentTime=Math.min(video.duration||Infinity,video.currentTime+10));
    mute.addEventListener('click',()=>video.muted=!video.muted);
    volume.addEventListener('input',()=>{video.volume=Number(volume.value);video.muted=video.volume===0;});
    speed.addEventListener('change',()=>{video.playbackRate=Number(speed.value);});
    update();
  }
  async function toggleFullscreen(stage){
    try{
      if(document.fullscreenElement){await document.exitFullscreen();if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();}
      else if(stage.requestFullscreen){await stage.requestFullscreen();if(screen.orientation&&screen.orientation.lock){try{await screen.orientation.lock('landscape');}catch(_){}}}
    }catch(_){const v=stage.querySelector('video');if(v&&v.webkitEnterFullscreen)v.webkitEnterFullscreen();else alert('Layar penuh tidak didukung browser ini.');}
  }
  let episodeList=[];
  let currentIndex=0;
  function showEpisode(ep,index,autoplay=false){
    currentIndex=index;
    $('watch-player').innerHTML=videoMarkup(ep.title,ep.video_url);
    const stage=$('watch-player').querySelector('.player-stage');
    stage.querySelector('.fullscreen-button').addEventListener('click',()=>toggleFullscreen(stage));
    setupCustom(stage);
    const nextButton=$('next-episode');
    if(nextButton){nextButton.disabled=index>=episodeList.length-1;nextButton.textContent=nextButton.disabled?'Episode Terakhir':'Episode Selanjutnya  →';}
    const video=stage.querySelector('video');
    if(video){video.load();video.addEventListener('ended',()=>{if(currentIndex<episodeList.length-1)showEpisode(episodeList[currentIndex+1],currentIndex+1,true);});if(autoplay)video.play().catch(()=>{});}
    $('watch-title').textContent=ep.title||('Episode '+(index+1));
    document.querySelectorAll('.watch-episode').forEach((b,i)=>b.classList.toggle('active',i===index));
    document.title=(ep.title||'Menonton')+' — StreamAnime';
  }
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&screen.orientation&&screen.orientation.unlock){try{screen.orientation.unlock();}catch(_){}}});
  async function init(){
    if(!id){$('watch-status').textContent='Anime tidak ditemukan. Kembali ke katalog dan pilih thumbnail.';return;}
    if(!configured||!window.supabase){$('watch-status').textContent='Konfigurasi Supabase belum tersedia.';return;}
    const db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    const {data:anime,error}=await db.from('anime').select('*').eq('id',id).single();
    if(error||!anime){$('watch-status').textContent='Anime tidak ditemukan atau gagal dimuat.';return;}
    const {data:episodes,error:episodeError}=await db.from('episodes').select('*').eq('anime_id',anime.id).order('episode_number',{ascending:true});
    let list=(!episodeError&&episodes&&episodes.length)?episodes.filter(ep=>!isDriveUrl(ep.video_url)):[];
    if(!list.length&&anime.video_url&&!isDriveUrl(anime.video_url))list=[{title:anime.title,video_url:anime.video_url,episode_number:1}];
    episodeList=list;
    if(!list.length){$('watch-status').textContent='Video belum tersedia untuk anime ini.';return;}
    $('watch-status').hidden=true;$('watch-layout').hidden=false;
    $('watch-episodes').innerHTML=list.map((ep,i)=>'<button class="watch-episode" type="button" data-index="'+i+'"><span class="episode-number">'+esc(ep.episode_number||i+1)+'</span><span>'+esc(ep.title||('Episode '+(i+1)))+'</span><span class="episode-play">▶</span></button>').join('');
    $('watch-episodes').querySelectorAll('button').forEach((button,i)=>button.addEventListener('click',()=>showEpisode(list[i],i)));
    $('next-episode').addEventListener('click',()=>{if(currentIndex<episodeList.length-1)showEpisode(episodeList[currentIndex+1],currentIndex+1,true);});
    $('watch-title').textContent=anime.title;$('watch-description').textContent=anime.description||anime.genre||'';
    const selectedIndex=requestedEpisode?list.findIndex(ep=>String(ep.id)===String(requestedEpisode)):0;\n    showEpisode(list[selectedIndex>=0?selectedIndex:0],selectedIndex>=0?selectedIndex:0);
  }
  init();
})();