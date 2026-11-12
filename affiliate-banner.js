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
      const {data,error}=await db.from('site_banners').select('id,title,image_url,target_url,is_active').eq('is_active',true).order('created_at',{ascending:false});
      if(error||!data||!data.length)return;
      const products=data.map(item=>({title:item.title||'Produk Shopee',image:imageUrl(item.image_url),target:validShopee(item.target_url)})).filter(item=>item.image&&item.target);
      if(!products.length)return;
      slot.innerHTML='<div class="affiliate-banner-heading"><span>REKOMENDASI PRODUK</span><small>Belanja melalui Shopee</small></div><div class="affiliate-products">'+products.map(item=>'<a class="affiliate-product" href="'+esc(item.target)+'" target="_blank" rel="sponsored nofollow noopener noreferrer"><img src="'+esc(item.image)+'" alt="'+esc(item.title)+'" loading="lazy" referrerpolicy="no-referrer"><span class="affiliate-product-info"><strong>'+esc(item.title)+'</strong><small>Lihat di Shopee ↗</small></span></a>').join('')+'</div>';
      slot.hidden=false;
      slot.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.closest('.affiliate-product')?.remove();if(!slot.querySelector('.affiliate-product'))slot.hidden=true;},{once:true}));
    }catch(_){}
  }
  load();
})();