(() => {
  const configured = window.SUPABASE_URL && !window.SUPABASE_URL.includes('YOUR_PROJECT_ID') && window.SUPABASE_ANON_KEY && !window.SUPABASE_ANON_KEY.includes('YOUR_');
  const $ = id => document.getElementById(id);
  const loginPanel = $('login-panel'), dashboard = $('dashboard'), form = $('anime-form');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let db = null, currentUser = null, rows = [];
  let affiliateRows = [];
  function normalizeAffiliateImage(value) {
    if (!value) throw new Error('Masukkan URL foto produk.');
    const u = new URL(value);
    if (!['http:','https:'].includes(u.protocol)) throw new Error('URL foto harus HTTP atau HTTPS.');
    if (u.hostname === 'dropbox.com' || u.hostname.endsWith('.dropbox.com')) { u.searchParams.set('raw','1'); u.searchParams.delete('dl'); }
    return u.href;
  }
  function normalizeShopeeUrl(value) {
    if (!value) throw new Error('Masukkan link Shopee Affiliate.');
    const u = new URL(value);
    if (!['http:','https:'].includes(u.protocol)) throw new Error('Link tujuan harus HTTP atau HTTPS.');
    const host = u.hostname.toLowerCase();
    if (!(host === 'shopee.co.id' || host.endsWith('.shopee.co.id') || host === 'shope.ee')) throw new Error('Gunakan link Shopee Affiliate (shopee.co.id atau shope.ee).');
    return u.href;
  }
  function updateAffiliatePreview() {
    const value=$('affiliate-image').value.trim(),img=$('affiliate-preview'),note=$('affiliate-preview-message');
    img.referrerPolicy='no-referrer';
    if(!value){img.hidden=true;img.removeAttribute('src');note.hidden=false;note.textContent='Masukkan URL foto produk.';return;}
    try { const src=normalizeAffiliateImage(value);img.onload=()=>{img.hidden=false;note.hidden=true;};img.onerror=()=>{img.hidden=true;note.hidden=false;note.textContent='Foto tidak bisa dimuat. Pastikan URL gambar publik.';};img.src=src; }
    catch(err){img.hidden=true;note.hidden=false;note.textContent=err.message;}
  }
  function resetAffiliateForm() {
    $('affiliate-form').reset();$('affiliate-id').value='';$('affiliate-form-title').textContent='Tambah Produk Affiliate';$('affiliate-active').checked=true;updateAffiliatePreview();
  }
  async function loadAffiliateSettings() {
    $('affiliate-list').innerHTML='<p class="muted">Memuat produk...</p>';
    const {data,error}=await db.from('site_banners').select('*').order('created_at',{ascending:false});
    if(error){$('affiliate-list').textContent='Gagal memuat daftar. Pastikan SQL migrasi produk affiliate sudah dijalankan: '+error.message;return;}
    affiliateRows=data||[];
    $('affiliate-list').innerHTML=affiliateRows.length?affiliateRows.map(item=>'<div class="admin-item"><img class="admin-thumb" src="'+esc(normalizeAffiliateImageSafe(item.image_url))+'" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility=\'hidden\'"><div class="admin-item-info"><strong>'+esc(item.title||'Produk Shopee')+'</strong><small class="muted">'+(item.is_active?'Aktif di website':'Disembunyikan')+'</small></div><div class="admin-actions"><button class="button secondary" type="button" data-aff-edit="'+esc(item.id)+'">Edit</button><button class="button danger" type="button" data-aff-delete="'+esc(item.id)+'">Hapus</button></div></div>').join(''):'<p class="muted">Belum ada produk affiliate. Tambahkan melalui formulir.</p>';
    $('affiliate-list').querySelectorAll('[data-aff-edit]').forEach(b=>b.addEventListener('click',()=>editAffiliate(b.dataset.affEdit)));
    $('affiliate-list').querySelectorAll('[data-aff-delete]').forEach(b=>b.addEventListener('click',()=>removeAffiliate(b.dataset.affDelete)));
  }
  function normalizeAffiliateImageSafe(value){try{return normalizeAffiliateImage(value);}catch(_){return '';}}
  function editAffiliate(id) {
    const item=affiliateRows.find(x=>String(x.id)===String(id));if(!item)return;
    $('affiliate-id').value=item.id;$('affiliate-title').value=item.title||'';$('affiliate-image').value=item.image_url||'';$('affiliate-target').value=item.target_url||'';$('affiliate-active').checked=!!item.is_active;$('affiliate-form-title').textContent='Edit Produk Affiliate';updateAffiliatePreview();
    $('affiliate-message').textContent='Ubah data lalu tekan Simpan Produk Affiliate.';
    $('affiliate-form').scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function removeAffiliate(id) {
    const item=affiliateRows.find(x=>String(x.id)===String(id));if(!item||!confirm('Hapus produk affiliate "'+(item.title||'Produk Shopee')+'"?'))return;
    const {error}=await db.from('site_banners').delete().eq('id',id);
    if(error){alert('Gagal menghapus produk: '+error.message);return;}
    if(String($('affiliate-id').value)===String(id))resetAffiliateForm();
    await loadAffiliateSettings();
  }
  $('affiliate-image').addEventListener('input',updateAffiliatePreview);
  $('affiliate-reset').addEventListener('click',resetAffiliateForm);
  $('affiliate-refresh').addEventListener('click',loadAffiliateSettings);
  $('affiliate-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const button=$('affiliate-form').querySelector('[type=submit]');
    button.disabled=true;$('affiliate-message').textContent='Menyimpan produk...';
    try {
      const payload={title:$('affiliate-title').value.trim()||'Produk Shopee',image_url:normalizeAffiliateImage($('affiliate-image').value.trim()),target_url:normalizeShopeeUrl($('affiliate-target').value.trim()),is_active:$('affiliate-active').checked,updated_at:new Date().toISOString()};
      const id=$('affiliate-id').value;
      const result=id?await db.from('site_banners').update(payload).eq('id',id):await db.from('site_banners').insert(payload);
      if(result.error)throw result.error;
      $('affiliate-message').textContent='Produk affiliate berhasil disimpan.';
      resetAffiliateForm();await loadAffiliateSettings();
    } catch(err) {$('affiliate-message').textContent=err.message||'Gagal menyimpan produk.';}
    finally {button.disabled=false;}
  });
  if (!configured || !window.supabase) { $('login-message').textContent = 'Konfigurasi Supabase belum diisi. Lengkapi supabase-config.js terlebih dahulu.'; $('login-form').querySelector('button').disabled = true; return; }
  db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  function message(text, error=false) { $('form-message').textContent = text; $('form-message').style.color = error ? '#ff9aaa' : '#c4b5fd'; }
  function normalizePosterUrl(value) {
    if (!value) return null;
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL poster harus menggunakan HTTP atau HTTPS.');
    if (url.hostname === 'dropbox.com' || url.hostname.endsWith('.dropbox.com')) { url.searchParams.set('raw','1'); url.searchParams.delete('dl'); }
    return url.href;
  }
  function posterDisplayUrl(value) { try { return normalizePosterUrl(value) || ''; } catch (_) { return ''; } }
  function updatePosterPreview() {
    const input=$('poster').value.trim(), img=$('poster-preview'), note=$('poster-preview-message');
    img.referrerPolicy='no-referrer';
    if(!input){img.hidden=true;img.removeAttribute('src');note.hidden=false;note.textContent='Masukkan link gambar untuk melihat preview.';return;}
    try { const src=normalizePosterUrl(input); img.onload=()=>{img.hidden=false;note.hidden=true;}; img.onerror=()=>{img.hidden=true;note.hidden=false;note.textContent='Gambar tidak bisa dimuat. Pastikan link publik dan mengarah langsung ke file gambar.';}; img.src=src; }
    catch(err){img.hidden=true;note.hidden=false;note.textContent=err.message;}
  }
  $('poster').addEventListener('input',updatePosterPreview);
  function normalizeVideoUrl(value) {
    if (!value) return null;
    const url = new URL(value);
    if (url.hostname === 'drive.google.com' || url.hostname.endsWith('.drive.google.com')) throw new Error('Link Google Drive sudah tidak didukung. Gunakan link video Dropbox atau URL video langsung.');
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL video harus menggunakan HTTP atau HTTPS.');
    return url.href;
  }
  function reset() { form.reset(); $('anime-id').value=''; $('form-title').textContent='Tambah Anime'; $('upload-progress').textContent=''; updatePosterPreview(); }
  async function checkSession() {
    const {data:{session}} = await db.auth.getSession();
    if (!session) { currentUser=null; loginPanel.hidden=false; dashboard.hidden=true; return; }
    currentUser=session.user;
    const {data:profile,error} = await db.from('profiles').select('role').eq('id',currentUser.id).maybeSingle();
    if (error || !profile || profile.role !== 'admin') {
      await db.auth.signOut(); loginPanel.hidden=false; dashboard.hidden=true;
      $('login-message').textContent='Akun ini belum memiliki akses admin. Atur role admin melalui SQL sesuai panduan README.'; return;
    }
    loginPanel.hidden=true; dashboard.hidden=false; $('admin-email').textContent=currentUser.email || ''; await loadRows(); populateAnimeOptions(); await loadAffiliateSettings(); showAdminTab('anime');
  }
  $('login-form').addEventListener('submit', async e => {
    e.preventDefault(); $('login-message').textContent='Memeriksa akun...';
    const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
    if(error){$('login-message').textContent=error.message;return;} $('login-message').textContent=''; await checkSession();
  });
  $('logout').addEventListener('click', async()=>{await db.auth.signOut();await checkSession();});
  $('refresh').addEventListener('click',loadRows);
  $('reset-form').addEventListener('click',reset);
  async function loadRows() {
    $('admin-list').innerHTML='<p class="muted">Memuat data...</p>';
    const {data,error}=await db.from('anime').select('*').order('created_at',{ascending:false});
    if(error){$('admin-list').textContent=error.message;return;}
    rows=data||[];
    $('admin-list').innerHTML=rows.length?rows.map(a=>`<div class="admin-item"><img class="admin-thumb" src="${esc(posterDisplayUrl(a.poster_url))}" alt="" onerror="this.style.visibility='hidden'"><div class="admin-item-info"><strong>${esc(a.title)}</strong><small class="muted">${esc(a.genre||'Anime')}</small></div><div class="admin-actions"><button class="button secondary" data-edit="${esc(a.id)}">Edit</button><button class="button danger" data-delete="${esc(a.id)}">Hapus</button></div></div>`).join(''):'<p class="muted">Belum ada anime. Tambahkan melalui formulir.</p>';
    $('admin-list').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>edit(b.dataset.edit)));
    $('admin-list').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>removeAnime(b.dataset.delete)));
  }
  function edit(id) {
    const a=rows.find(x=>String(x.id)===String(id));if(!a)return;
    $('anime-id').value=a.id;$('title').value=a.title||'';$('description').value=a.description||'';$('poster').value=a.poster_url||'';updatePosterPreview();$('genre').value=a.genre||'';$('video-url').value=a.video_url||'';$('form-title').textContent='Edit Anime';message('Edit data lalu tekan Simpan Anime.');
    form.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function removeAnime(id) {
    const a=rows.find(x=>String(x.id)===String(id));if(!a||!confirm('Hapus anime "'+a.title+'"?'))return;
    const {error}=await db.from('anime').delete().eq('id',id);
    if(error){alert('Gagal menghapus: '+error.message);return;} await loadRows();
  }
  async function uploadVideo(file) {
    if(!file)return null;
    if(!['video/mp4','video/webm','video/ogg'].includes(file.type)){throw new Error('Format video harus MP4, WebM, atau OGG.');}
    const maxBytes=100*1024*1024;
    if(file.size>maxBytes)throw new Error('Ukuran file maksimal 100 MB untuk konfigurasi awal ini.');
    const ext=(file.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'');
    const path=currentUser.id+'/'+crypto.randomUUID()+'.'+ext;
    $('upload-progress').textContent='Mengunggah video...';
    const {error}=await db.storage.from(window.STORAGE_BUCKET||'anime-videos').upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw error;
    const {data}=db.storage.from(window.STORAGE_BUCKET||'anime-videos').getPublicUrl(path);
    $('upload-progress').textContent='Upload selesai.';
    return data.publicUrl;
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!currentUser)return;
    const submit=form.querySelector('[type=submit]');submit.disabled=true;message('Menyimpan...');
    try{
      let videoUrl=normalizeVideoUrl($('video-url').value.trim());
      const file=$('video-file').files[0];if(file)videoUrl=await uploadVideo(file);
      const payload={title:$('title').value.trim(),description:$('description').value.trim(),poster_url:normalizePosterUrl($('poster').value.trim()),genre:$('genre').value.trim()||null,video_url:videoUrl};
      const id=$('anime-id').value;
      const result=id?await db.from('anime').update(payload).eq('id',id):await db.from('anime').insert(payload);
      if(result.error)throw result.error;
      message('Anime berhasil disimpan.');reset();await loadRows();
    }catch(err){message(err.message||'Terjadi kesalahan.',true);}
    finally{submit.disabled=false;}
  });


  // Menu utama dashboard admin
  function showAdminTab(tab) {
    ['anime','episodes','affiliate'].forEach(name=>{
      const pane=$('admin-pane-'+name),button=document.querySelector('[data-admin-tab="'+name+'"]');
      if(pane)pane.hidden=name!==tab;
      if(button)button.classList.toggle('active',name===tab);
    });
    if(tab==='episodes') loadEpisodeRows();
  }
  document.querySelectorAll('[data-admin-tab]').forEach(button=>button.addEventListener('click',()=>showAdminTab(button.dataset.adminTab)));

  let episodeRows=[];
  function episodeMessage(text,error=false){$('episode-message').textContent=text;$('episode-message').style.color=error?'#ff9aaa':'#c4b5fd';}
  function normalizeEpisodeVideoUrl(value){
    if(!value)return null;
    const url=new URL(value);
    if(url.hostname==='drive.google.com'||url.hostname.endsWith('.drive.google.com'))throw new Error('Google Drive tidak didukung. Gunakan Dropbox atau URL video langsung.');
    if(!['http:','https:'].includes(url.protocol))throw new Error('URL video harus HTTP atau HTTPS.');
    return url.href;
  }
  function resetEpisodeForm(){
    $('episode-form').reset();$('episode-id').value='';$('episode-form-title').textContent='Tambah Episode';$('episode-upload-progress').textContent='';
  }
  function populateAnimeOptions(){
    const select=$('episode-anime'),previous=select.value;
    select.innerHTML='<option value="">Pilih anime...</option>'+rows.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.title)+'</option>').join('');
    if(rows.some(a=>String(a.id)===String(previous)))select.value=previous;
  }
  async function loadEpisodeRows(){
    populateAnimeOptions();
    const animeId=$('episode-anime').value;
    if(!animeId){$('episode-list').innerHTML='<p class="muted">Pilih anime untuk melihat episode.</p>';return;}
    $('episode-list').innerHTML='<p class="muted">Memuat episode...</p>';
    const {data,error}=await db.from('episodes').select('*').eq('anime_id',animeId).order('episode_number',{ascending:true});
    if(error){$('episode-list').textContent='Gagal memuat episode: '+error.message+' Pastikan SQL pembaruan tabel episodes sudah dijalankan.';return;}
    episodeRows=data||[];
    $('episode-list').innerHTML=episodeRows.length?episodeRows.map(ep=>'<div class="admin-item"><div class="admin-item-info"><strong>Episode '+esc(ep.episode_number)+' — '+esc(ep.title||'Tanpa judul')+'</strong><small class="muted">'+esc(ep.video_url||'')+'</small></div><div class="admin-actions"><button class="button secondary" type="button" data-ep-edit="'+esc(ep.id)+'">Edit</button><button class="button danger" type="button" data-ep-delete="'+esc(ep.id)+'">Hapus</button></div></div>').join(''):'<p class="muted">Belum ada episode untuk anime ini. Tambahkan lewat formulir.</p>';
    $('episode-list').querySelectorAll('[data-ep-edit]').forEach(b=>b.addEventListener('click',()=>editEpisode(b.dataset.epEdit)));
    $('episode-list').querySelectorAll('[data-ep-delete]').forEach(b=>b.addEventListener('click',()=>removeEpisode(b.dataset.epDelete)));
  }
  function editEpisode(id){
    const ep=episodeRows.find(x=>String(x.id)===String(id));if(!ep)return;
    $('episode-id').value=ep.id;$('episode-anime').value=ep.anime_id;$('episode-number').value=ep.episode_number;$('episode-title').value=ep.title||'';$('episode-video-url').value=ep.video_url||'';
    $('episode-form-title').textContent='Edit Episode';episodeMessage('Ubah data lalu tekan Simpan Episode.');$('episode-form').scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function removeEpisode(id){
    const ep=episodeRows.find(x=>String(x.id)===String(id));if(!ep||!confirm('Hapus Episode '+ep.episode_number+'?'))return;
    const {error}=await db.from('episodes').delete().eq('id',id);
    if(error){alert('Gagal menghapus episode: '+error.message);return;}
    if(String($('episode-id').value)===String(id))resetEpisodeForm();
    await loadEpisodeRows();
  }
  $('episode-anime').addEventListener('change',()=>{resetEpisodeForm();loadEpisodeRows();});
  $('episode-reset').addEventListener('click',resetEpisodeForm);
  $('episode-refresh').addEventListener('click',loadEpisodeRows);
  $('episode-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const animeId=$('episode-anime').value;if(!animeId){episodeMessage('Pilih anime terlebih dahulu.',true);return;}
    const button=$('episode-form').querySelector('[type=submit]');button.disabled=true;episodeMessage('Menyimpan episode...');
    try{
      let videoUrl=normalizeEpisodeVideoUrl($('episode-video-url').value.trim());
      const file=$('episode-video-file').files[0];if(file)videoUrl=await uploadVideo(file);
      if(!videoUrl)throw new Error('Masukkan link video atau pilih file video untuk di-upload.');
      const number=Number($('episode-number').value);
      if(!Number.isInteger(number)||number<1)throw new Error('Nomor episode harus bilangan bulat minimal 1.');
      const payload={anime_id:Number(animeId),episode_number:number,title:$('episode-title').value.trim()||('Episode '+number),video_url:videoUrl,drive_file_id:null};
      const id=$('episode-id').value;
      const result=id?await db.from('episodes').update(payload).eq('id',id):await db.from('episodes').insert(payload);
      if(result.error)throw result.error;
      episodeMessage('Episode berhasil disimpan.');resetEpisodeForm();await loadEpisodeRows();
    }catch(err){episodeMessage(err.message||'Gagal menyimpan episode.',true);}
    finally{button.disabled=false;}
  });

  db.auth.onAuthStateChange(()=>{setTimeout(checkSession,0);});
  checkSession();
})();
