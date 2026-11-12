(() => {
  const configured = window.SUPABASE_URL && !window.SUPABASE_URL.includes('YOUR_PROJECT_ID') && window.SUPABASE_ANON_KEY && !window.SUPABASE_ANON_KEY.includes('YOUR_');
  const $ = id => document.getElementById(id);
  const loginPanel = $('login-panel'), dashboard = $('dashboard'), form = $('anime-form');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let db = null, currentUser = null, rows = [];
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
    loginPanel.hidden=true; dashboard.hidden=false; $('admin-email').textContent=currentUser.email || ''; await loadRows();
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

  db.auth.onAuthStateChange(()=>{setTimeout(checkSession,0);});
  checkSession();
})();
