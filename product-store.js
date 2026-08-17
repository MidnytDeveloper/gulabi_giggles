/* Gulabi Giggles product store. Uses IndexedDB so the lightweight product manager
   can add/replace/remove images and descriptions without changing the public design. */
const GG_DEFAULT_PRODUCTS = [
  {id:'midnight-bloom-lehanga-choli', name:'Midnight bloom Lehenga choli', description:'A graceful midnight-blue lehenga choli crafted for little celebrations, with delicate floral detailing and a comfortable silhouette. Thoughtful finishing keeps the outfit easy to move in while giving festive occasions a beautifully dressed, timeless feel.', images:['images/products/midnight-bloom-lehanga-choli-1.JPG','images/products/midnight-bloom-lehanga-choli-2.JPG','images/products/midnight-bloom-lehanga-choli-3.JPG','images/products/midnight-bloom-lehanga-choli-4.JPG','images/products/midnight-bloom-lehanga-choli-5.JPG'], defaultIndex:0,flipkartUrl:'',amazonUrl:''},
  {id:'embroidered-mul-cotton-lehenga', name:'Embroidered Mul Cotton Lehenga Choli', description:'A soft mul-cotton lehenga choli designed for comfort and effortless festive charm. Its pretty embroidery, easy movement and breathable feel make it a lovely choice for family gatherings, celebrations and those little moments when comfort matters just as much as style.', images:['images/products/embroidered-mul-cotton-lehenga-1.JPG','images/products/embroidered-mul-cotton-lehenga-2.JPG','images/products/embroidered-mul-cotton-lehenga-3.JPG','images/products/embroidered-mul-cotton-lehenga-4.JPG','images/products/embroidered-mul-cotton-lehenga-5.JPG'], defaultIndex:0,flipkartUrl:'',amazonUrl:''},
  {id:'floral-coord', name:'Floral Co-ord Set', description:'A cheerful floral co-ord set that brings together playful prints and a polished silhouette. Designed for little girls who love to move, explore and celebrate, it blends everyday comfort with a festive touch that feels fresh, pretty and effortlessly stylish.', images:['images/products/floral-coord-1.JPG','images/products/floral-coord-2.JPG','images/products/floral-coord-3.JPG','images/products/floral-coord-4.JPG','images/products/floral-coord-5.JPG'], defaultIndex:0,flipkartUrl:'',amazonUrl:''},
  {id:'red-sharara-set', name:'Red Sharara set', description:'A vibrant red sharara set with delicate white motifs, a graceful kurta and flowing dupatta. Festive yet comfortable, it is designed for little celebrations, family occasions and special photographs while keeping her free to move, play and enjoy every moment.', images:['images/products/red-sharara-set-1.JPG','images/products/red-sharara-set-2.JPG','images/products/red-sharara-set-3.JPG','images/products/red-sharara-set-4.JPG','images/products/red-sharara-set-5.JPG'], defaultIndex:0,flipkartUrl:'',amazonUrl:''}
];

const GG_DB_NAME='GulabiGigglesDB', GG_DB_VERSION=2;
function ggOpenDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(GG_DB_NAME,GG_DB_VERSION);
    req.onupgradeneeded=()=>{ const db=req.result; if(!db.objectStoreNames.contains('products')) db.createObjectStore('products',{keyPath:'id'}); };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function ggGetStored(){
  const db=await ggOpenDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction('products','readonly');const req=tx.objectStore('products').getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});
}
async function ggSaveProduct(product){
  const db=await ggOpenDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction('products','readwrite');tx.objectStore('products').put(product);tx.oncomplete=()=>resolve(product);tx.onerror=()=>reject(tx.error);});
}
async function ggDeleteProduct(id){
  const db=await ggOpenDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction('products','readwrite');tx.objectStore('products').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
}
async function ggGetProducts(){
  try{
    const stored=await ggGetStored();
    const map=new Map(stored.map(p=>[p.id,p]));
    const merged=GG_DEFAULT_PRODUCTS.map(p=>map.get(p.id)||p);
    stored.filter(p=>!GG_DEFAULT_PRODUCTS.some(d=>d.id===p.id)).forEach(p=>merged.push(p));
    return merged;
  }catch(e){ return [...GG_DEFAULT_PRODUCTS]; }
}
function ggImageSrc(image){
  if(typeof image==='string') return Promise.resolve(image);
  if(image instanceof Blob) return Promise.resolve(URL.createObjectURL(image));
  if(image && image.blob instanceof Blob) return Promise.resolve(URL.createObjectURL(image.blob));
  return Promise.resolve('');
}
function ggOrderedImages(product){
  const imgs=[...(product.images||[])];
  if(!imgs.length) return imgs;
  let idx=Math.max(0,Math.min(product.defaultIndex||0,imgs.length-1));
  if(idx===0) return imgs;
  return [imgs[idx],...imgs.slice(0,idx),...imgs.slice(idx+1)];
}
window.GGStore={defaults:GG_DEFAULT_PRODUCTS,openDB:ggOpenDB,getProducts:ggGetProducts,saveProduct:ggSaveProduct,deleteProduct:ggDeleteProduct,imageSrc:ggImageSrc,orderedImages:ggOrderedImages};
