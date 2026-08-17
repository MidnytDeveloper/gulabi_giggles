const INTERVAL = 3000;

async function setupHomepage(){
  const products = await GGStore.getProducts();
  const track = document.querySelector('#homepage-products');
  if(!track) return;

  // Home and Collection use the exact same product order and photo order
  // from Product Manager.
  track.innerHTML = '';
  const cards = [];

  for(const product of products){
    const card = document.createElement('article');
    card.className = 'product-card carousel-card';
    card.dataset.product = product.id;
    card.innerHTML = `
      <div class="product-image">
        <div class="image-stage"></div>
        <button class="carousel-control prev" type="button" aria-label="Previous image">‹</button>
        <button class="carousel-control next" type="button" aria-label="Next image">›</button>
        <div class="dots" aria-hidden="true"></div>
      </div>
      <h3></h3>`;
    card.querySelector('h3').textContent = product.name || 'Untitled product';
    track.appendChild(card);
    cards.push(card);
  }

  await Promise.all(cards.map((card, i) => setupCarousel(card, products[i])));
  setupHomepageProductScroller(products.length);
}

function setupHomepageProductScroller(total){
  const viewport = document.querySelector('.products-viewport');
  const track = document.querySelector('#homepage-products');
  const prev = document.querySelector('.collection-prev');
  const next = document.querySelector('.collection-next');
  if(!viewport || !track || !prev || !next) return;

  let startIndex = 0;

  // Keep the responsive behaviour, but ALWAYS move exactly one product.
  const visibleCount = () => {
    if(window.innerWidth <= 600) return 2;
    if(window.innerWidth <= 900) return 2;
    return 4;
  };

  const getGap = () => window.innerWidth <= 600 ? 10 : 21;
  const maxStart = () => Math.max(0, total - visibleCount());

  const update = (animate=true) => {
    const visible = visibleCount();
    const gap = getGap();

    startIndex = Math.min(startIndex, maxStart());

    // Calculate the actual card width from the visible viewport.
    // Using pixels here prevents the 5th product from squeezing into view
    // when the product count changes.
    const viewportWidth = viewport.clientWidth;
    const cardWidth = Math.max(
      0,
      (viewportWidth - gap * (visible - 1)) / visible
    );

    track.style.setProperty('--home-gap', `${gap}px`);
    track.style.setProperty('--home-card-width', `${cardWidth}px`);
    track.style.width = `${Math.max(viewportWidth, total * cardWidth + Math.max(0,total-1) * gap)}px`;
    track.classList.toggle('no-transition', !animate);

    // One click = exactly one product-card shift.
    const step = cardWidth + gap;
    track.style.transform = `translate3d(-${startIndex * step}px,0,0)`;

    // Re-enable the transition after a non-animated layout update.
    if(!animate){
      requestAnimationFrame(() => track.classList.remove('no-transition'));
    }

    const canScroll = total > visible;
    prev.hidden = !canScroll;
    next.hidden = !canScroll;
    prev.disabled = startIndex <= 0;
    next.disabled = startIndex >= maxStart();
    prev.setAttribute('aria-disabled', String(prev.disabled));
    next.setAttribute('aria-disabled', String(next.disabled));
  };

  prev.onclick = () => {
    if(startIndex > 0){
      startIndex -= 1;
      update(true);
    }
  };

  next.onclick = () => {
    if(startIndex < maxStart()){
      startIndex += 1;
      update(true);
    }
  };

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => update(false), 80);
  });

  // Initial layout.
  requestAnimationFrame(() => update(false));
}

async function setupCarousel(card, product){
  if(!product) return;
  const images=GGStore.orderedImages(product);
  const stage=card.querySelector('.image-stage'), dots=card.querySelector('.dots');
  const prev=card.querySelector('.carousel-control.prev'), next=card.querySelector('.carousel-control.next');
  if(!images.length) return;

  let current=0,timer;
  const resolved=[];
  for(const src of images){ resolved.push(await GGStore.imageSrc(src)); }

  resolved.forEach((src,i)=>{
    const img=document.createElement('img');
    img.className='slide'+(i===0?' active':'');
    img.src=src;
    img.alt=`${product.name} — image ${i+1}`;
    img.loading=i===0?'eager':'lazy';
    stage.appendChild(img);

    const dot=document.createElement('span');
    dot.className='dot'+(i===0?' active':'');
    dots.appendChild(dot);
  });

  const slides=[...stage.querySelectorAll('.slide')];
  const dotEls=[...dots.querySelectorAll('.dot')];

  const show=index=>{
    slides[current].classList.remove('active');
    dotEls[current].classList.remove('active');
    current=(index+slides.length)%slides.length;
    slides[current].classList.add('active');
    dotEls[current].classList.add('active');
  };

  const restart=()=>{
    clearInterval(timer);
    timer=setInterval(()=>show(current+1),INTERVAL);
  };

  prev.addEventListener('click',e=>{
    e.stopPropagation();
    show(current-1);
    restart();
  });

  next.addEventListener('click',e=>{
    e.stopPropagation();
    show(current+1);
    restart();
  });

  restart();
}

window.addEventListener('DOMContentLoaded',setupHomepage);
