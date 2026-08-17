let products=[];

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function words(t=''){return t.trim()?t.trim().split(/\s+/).length:0;}
function slugify(s){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'product';}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2200);}

function chooseImage(){
  return new Promise(resolve=>{
    const input=document.createElement('input');
    input.type='file'; input.accept='image/*'; input.style.display='none';
    document.body.appendChild(input);
    input.addEventListener('change',()=>{const file=input.files&&input.files[0]?input.files[0]:null;input.remove();resolve(file);},{once:true});
    input.click();
  });
}
function updateCount(el){
  const n=words($('.desc-input',el).value), c=$('.word-count',el);
  c.textContent=`${n} words`; c.className='word-count '+(n>=30&&n<=50?'word-ok':'word-warn');
}
function safeUrl(value){
  const v=String(value||'').trim();
  if(!v) return '';
  try{const u=new URL(v); return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}
}

async function buildImageItem(editor,product,index){
  const item=document.createElement('div');
  item.className='image-item'+(index===Number(product.defaultIndex||0)?' is-default':'');
  item.draggable=true;
  const src=await GGStore.imageSrc(product.images[index]);
  item.innerHTML=`
    <div class="thumb-wrap"><img src="${escapeHtml(src)}" alt="${escapeHtml(product.name)} image ${index+1}">
      ${index===Number(product.defaultIndex||0)?'<span class="default-badge">DEFAULT</span>':''}
    </div>
    <div class="image-order">Photo ${index+1} of ${product.images.length}</div>
    <div class="image-actions">
      <div class="move-buttons">
        <button class="move-up" title="Move photo left / earlier" ${index===0?'disabled':''}>←</button>
        <button class="move-down" title="Move photo right / later" ${index===product.images.length-1?'disabled':''}>→</button>
      </div>
      <button class="default-btn">${index===Number(product.defaultIndex||0)?'✓ Default':'☆ Set Default'}</button>
      <button class="replace-btn">↻ Replace</button>
      <button class="remove-image">✕ Remove</button>
    </div>`;
  const move=async(delta)=>{
    const ni=index+delta;if(ni<0||ni>=product.images.length)return;
    [product.images[index],product.images[ni]]=[product.images[ni],product.images[index]];
    if(Number(product.defaultIndex)===index) product.defaultIndex=ni;
    else if(Number(product.defaultIndex)===ni) product.defaultIndex=index;
    await GGStore.saveProduct(product); products=await GGStore.getProducts(); await render();
    showToast('Photo sequence updated');
  };
  $('.move-up',item).addEventListener('click',()=>move(-1));
  $('.move-down',item).addEventListener('click',()=>move(1));
  $('.default-btn',item).addEventListener('click',async()=>{
    product.defaultIndex=index; await GGStore.saveProduct(product); products=await GGStore.getProducts(); await render(); showToast('Default image updated');
  });
  $('.replace-btn',item).addEventListener('click',async()=>{
    const file=await chooseImage(); if(!file)return;
    product.images[index]=file; await GGStore.saveProduct(product); products=await GGStore.getProducts(); await render(); showToast('Image replaced');
  });
  $('.remove-image',item).addEventListener('click',async()=>{
    if(product.images.length<=1){alert('A product needs at least one image.');return;}
    product.images.splice(index,1);
    if(Number(product.defaultIndex)>=product.images.length) product.defaultIndex=product.images.length-1;
    else if(index<Number(product.defaultIndex)) product.defaultIndex--;
    await GGStore.saveProduct(product); products=await GGStore.getProducts(); await render(); showToast('Image removed');
  });
  item.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(index));item.classList.add('dragging');});
  item.addEventListener('dragend',()=>item.classList.remove('dragging'));
  item.addEventListener('dragover',e=>{e.preventDefault();item.classList.add('drag-over');});
  item.addEventListener('dragleave',()=>item.classList.remove('drag-over'));
  item.addEventListener('drop',async e=>{
    e.preventDefault();item.classList.remove('drag-over');
    const from=Number(e.dataTransfer.getData('text/plain')); if(from===index||Number.isNaN(from))return;
    const [moved]=product.images.splice(from,1); product.images.splice(index,0,moved);
    const d=Number(product.defaultIndex||0);
    if(d===from) product.defaultIndex=index;
    else if(from<d&&index>=d) product.defaultIndex=d-1;
    else if(from>d&&index<=d) product.defaultIndex=d+1;
    await GGStore.saveProduct(product); products=await GGStore.getProducts(); await render(); showToast('Photo sequence updated');
  });
  return item;
}

async function buildEditor(product){
  const el=document.createElement('article');el.className='product-editor';el.dataset.id=product.id;
  el.innerHTML=`
    <div class="editor-top"><h2>${escapeHtml(product.name)}</h2><button class="danger-btn delete-product">Delete Product</button></div>
    <div class="fields">
      <div class="field"><label>Product name</label><input class="name-input" value="${escapeHtml(product.name)}"></div>
      <div class="field"><label>Short product description · 30–50 words recommended</label><textarea class="desc-input" maxlength="500">${escapeHtml(product.description||'')}</textarea><div class="description-meta"><span class="word-count"></span><span>Shown through the small info button on Collection</span></div></div>
    </div>
    <div class="marketplace-links">
      <div class="field"><label>Flipkart product link</label><input class="flipkart-input" type="url" placeholder="https://www.flipkart.com/..." value="${escapeHtml(product.flipkartUrl||'')}"></div>
      <div class="field"><label>Amazon product link</label><input class="amazon-input" type="url" placeholder="https://www.amazon.in/..." value="${escapeHtml(product.amazonUrl||'')}"></div>
    </div>
    <div class="image-label">Product images <span class="helper">Drag photos or use ← → to change sequence</span></div>
    <div class="image-grid"></div>
    <div class="editor-actions"><button class="secondary-btn add-image-btn">＋ Add Image</button><button class="save-btn">Save Product</button></div>`;
  const grid=$('.image-grid',el);
  for(let i=0;i<(product.images||[]).length;i++)grid.appendChild(await buildImageItem(el,product,i));
  updateCount(el); $('.desc-input',el).addEventListener('input',()=>updateCount(el));
  $('.add-image-btn',el).addEventListener('click',async()=>{
    const file=await chooseImage(); if(!file)return;
    product.images=product.images||[]; product.images.push(file);
    await GGStore.saveProduct(product); products=await GGStore.getProducts(); await render(); showToast('Image added');
  });
  $('.save-btn',el).addEventListener('click',async()=>{
    product.name=$('.name-input',el).value.trim()||'Untitled Product';
    product.description=$('.desc-input',el).value.trim();
    product.flipkartUrl=safeUrl($('.flipkart-input',el).value);
    product.amazonUrl=safeUrl($('.amazon-input',el).value);
    await GGStore.saveProduct(product); products=await GGStore.getProducts(); await render(); showToast('Product saved');
  });
  $('.delete-product',el).addEventListener('click',async()=>{
    if(!confirm(`Delete “${product.name}”? This removes it from the website on this browser.`))return;
    await GGStore.deleteProduct(product.id); products=await GGStore.getProducts(); await render(); showToast('Product deleted');
  });
  return el;
}

async function render(){
  const list=$('#productList');list.innerHTML='';
  if(!products.length){list.innerHTML='<div class="empty">No products yet. Click “Add Product” to create your first one.</div>';return;}
  for(const product of products)list.appendChild(await buildEditor(product));
}

function openAddModal(){
  const modal=$('#addProductModal'); modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); setTimeout(()=>$('#newProductName').focus(),50);
}
function closeAddModal(){const modal=$('#addProductModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');$('#newProductForm').reset();}
$('#addProductBtn').addEventListener('click',openAddModal);
$('#cancelAddProduct').addEventListener('click',closeAddModal);
$('#addProductModal').addEventListener('click',e=>{if(e.target.id==='addProductModal')closeAddModal();});

$('#newProductForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=$('#newProductName').value.trim();
  const file=$('#newProductImage').files?.[0];
  if(!name){alert('Please enter a product name.');return;}
  if(!file){alert('Please select the first product image.');return;}
  const id=slugify(name)+'-'+Date.now().toString(36);
  const product={id,name,description:$('#newProductDescription').value.trim(),images:[file],defaultIndex:0,flipkartUrl:safeUrl($('#newProductFlipkart').value),amazonUrl:safeUrl($('#newProductAmazon').value)};
  try{
    await GGStore.saveProduct(product);
    products=await GGStore.getProducts(); closeAddModal(); await render(); showToast('New product added successfully');
    document.querySelector(`.product-editor[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(err){console.error(err);alert('The product could not be saved. Please try again.');}
});
(async()=>{try{products=await GGStore.getProducts();await render();}catch(err){console.error(err);showToast('Could not load products');}})();
