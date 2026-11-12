(() => {
  const slot=document.getElementById('affiliate-banner');
  if(!slot)return;
  const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR_PROJECT_ID')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR_');
  if(!configured||!window.supabase)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function imageUrl(value){
    try{const u=new URL(value);if(u.protocol!=='https:'&&u.protocol!=='http:')return '';if(u.hostname==='dropbox.com'||u.hostname.endsWith('.dropbox.com')){u.searchParams.set('raw','1');u.searchParams.delete('dl');}return u.href;}catch(_){return '';}
  }
  function validShopee(value){
    try{const u=new URL(value),h=u.hostname.toLowerCase();return (u.protocol==='https:'||u.protocol==='http:')&&(h==='shopee.co.id'||h.endsWith('.shopee.co.id')||h==='shope.ee')?u.href:'';}catch(_){return '';}
  }
  async function load(){
    try{
      const db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
      const {data,error}=await db.from('site_banners').select('image_url,target_url,is_active').eq('id',1).eq('is_active',true).maybeSingle();
      if(error||!data)return;
      const image=imageUrl(data.image_url),target=validShopee(data.target_url);
      if(!image||!target)return;
      slot.innerHTML='<a class="affiliate-banner-link" href="'+esc(target)+'" target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label="Lihat produk di Shopee"><img src="'+esc(image)+'" alt="Produk rekomendasi Shopee Affiliate" loading="lazy" referrerpolicy="no-referrer"><span class="affiliate-banner-label">LIHAT PRODUK DI SHOPEE ↗</span></a>';
      slot.hidden=false;
      const img=slot.querySelector('img');
      img.addEventListener('error',()=>{slot.hidden=true;},{once:true});
    }catch(_){}
  }
  load();
})();