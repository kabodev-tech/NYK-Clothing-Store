// ================ AUTH ================
const ADMIN_CREDS_KEY='nyk_admin_creds';
const SESSION_KEY='nyk_admin_session';

function getCreds(){
  try{const c=localStorage.getItem(ADMIN_CREDS_KEY); 
    return c?JSON.parse(c):{user:'admin',pass:'ntwana2025'};}
  catch(e){ 
    return{user:'admin',pass:'ntwana2025'};}
}

function checkSession(){
  const s=localStorage.getItem(SESSION_KEY);
  if(s==='active'){showApp();}
}

document.getElementById('loginPass').addEventListener('keydown',(e)=>{if(e.key==='Enter')doLogin();});
document.getElementById('loginBtn').onclick=doLogin;

function doLogin(){
  const user=document.getElementById('loginUser').value.trim();
  const pass=document.getElementById('loginPass').value;
  const creds=getCreds();
  if(user===creds.user&&pass===creds.pass){
    localStorage.setItem(SESSION_KEY,'active');
    showApp();
  }else{
    document.getElementById('loginErr').style.display='block';
    document.getElementById('loginPass').value='';
  }
}

function showApp(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').classList.add('visible');
  initApp();
}

document.getElementById('logoutBtn').onclick=()=>{
  localStorage.removeItem(SESSION_KEY);
  location.reload();
};

checkSession();

// ================ DATA ================
function getProducts(){
  try{const r=localStorage.getItem('nyk_products'); 
  return r?JSON.parse(r):[];} 
  catch(e){ 
    return[];}
}
function saveProducts(p){localStorage.setItem('nyk_products',JSON.stringify(p));}

function getOrders(){
  try{const r=localStorage.getItem('nyk_orders'); 
  return r?JSON.parse(r):[];} 
  catch(e){ 
    return[];}
}
function saveOrders(o){localStorage.setItem('nyk_orders',JSON.stringify(o));}

function getSettings(){
  try{const r=localStorage.getItem('nyk_settings'); 
  return r?JSON.parse(r):{googleFormUrl:'',storeName:'Ntwana Ya Kasi',announcement:'',whatsapp:''};} 
  catch(e){ 
    return{googleFormUrl:'',storeName:'Ntwana Ya Kasi',announcement:'',whatsapp:''};}
}
function saveSettingsData(s){localStorage.setItem('nyk_settings',JSON.stringify(s));}

function genId(){ 
  return 'o'+Date.now()+Math.random().toString(36).slice(2,6);}
function genOrderNum(){ 
  return 'NYK'+Date.now().toString().slice(-6);}

// ================ INIT ================
function initApp(){
  renderDashboard();
  renderOrders();
  renderProductsTable();
  loadSettingsForm();
  updatePendingBadge();
}

// ================ PANEL NAV ================
function switchPanel(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('panel-'+name).classList.add('active');
  document.querySelector(`.nav-item[data-panel="${name}"]`).classList.add('active');
  closeSidebar();
}

document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click',()=>switchPanel(item.dataset.panel));
});

// MOBILE SIDEBAR
document.getElementById('sidebarToggle').onclick=()=>{
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
};
document.getElementById('sidebarOverlay').onclick=closeSidebar;
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ================ DASHBOARD ================
function renderDashboard(){
  const prods=getProducts();
  const orders=getOrders();
  const pending=orders.filter(o=>o.status==='Pending').length;
  const delivered=orders.filter(o=>o.status==='Delivered').length;
  document.getElementById('stat-products').textContent=prods.length;
  document.getElementById('stat-orders').textContent=orders.length;
  document.getElementById('stat-pending').textContent=pending;
  document.getElementById('stat-delivered').textContent=delivered;

  // Recent orders
  const tbody=document.getElementById('dashOrdersTable');
  const recent=orders.slice(-5).reverse();
  tbody.innerHTML=recent.length?recent.map(o=>`
    <tr>
      <td style="font-family:'Space Mono', monospace; font-size:0.7rem;">${o.orderNum}</td>
      <td class="td-name">${o.customerName}</td>
      <td>${o.product||'—'}</td>
      <td class="td-price">R ${o.amount||'—'}</td>
      <td>${statusBadge(o.status)}</td>
      <td style="font-size:0.8rem;color:var(--text-muted);">${fmtDate(o.date)}</td>
    </tr>`).join(''):`
    <tr>
      <td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;font-family:'Space Mono',monospace;font-size:0.65rem;">No orders yet</td></tr>`;

  // Top products
  const ptbody=document.getElementById('dashProductsTable');
  ptbody.innerHTML=prods.slice(0,5).map(p=>`
    <tr>
      <td><img class="td-img" src="${p.image}" alt="${p.name}"/></td>
      <td class="td-name">${p.name}</td>
      <td><span class="badge badge-blue">${p.category}</span></td>
      <td class="td-price">R ${p.price}</td>
      <td>${p.inStock?'<span class="badge badge-green">In Stock</span>':'<span class="badge badge-red">Out</span>'}</td>
    </tr>`).join('');
}

function statusBadge(s){
  const map={Pending:'yellow',Processing:'blue',Shipped:'blue',Delivered:'green',Cancelled:'red'};
  return `<span class="badge badge-${map[s]||'gray'}">${s}</span>`;
}

function fmtDate(d){
  if(!d)return '—';
  try{return new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'});}
  catch{return d;}
}

function updatePendingBadge(){
  const orders=getOrders();
  const pending=orders.filter(o=>o.status==='Pending').length;
  const badge=document.getElementById('pendingBadge');
  if(pending>0){badge.textContent=pending;badge.style.display='inline-block';}
  else{badge.style.display='none';}
}

// ================ ORDERS ================
function renderOrders(){
  const orders=getOrders();
  const search=(document.getElementById('orderSearch')?.value||'').toLowerCase();
  const statusFilter=document.getElementById('orderStatusFilter')?.value||'';

  const filtered=orders.filter(o=>{
    const matchSearch=!search||(o.customerName||'').toLowerCase().includes(search)||(o.orderNum||'').toLowerCase().includes(search)||(o.product||'').toLowerCase().includes(search);
    const matchStatus=!statusFilter||o.status===statusFilter;
    return matchSearch&&matchStatus;
  }).reverse();

  const tbody=document.getElementById('ordersTable');
  const empty=document.getElementById('ordersEmpty');

  if(!filtered.length){
    tbody.innerHTML='';
    empty.style.display='block';
    return;
  }
  empty.style.display='none';
  tbody.innerHTML=filtered.map(o=>`
    <tr>
      <td style="font-family:'Space Mono',monospace;font-size:0.7rem;">${o.orderNum}</td>
      <td class="td-name">${o.customerName}</td>
      <td>${o.product||'—'}</td>
      <td class="td-price">R ${o.amount||'—'}</td>
      <td>
        <select class="status-select" onchange="updateOrderStatus('${o.id}',this.value)">
          ${['Pending','Processing','Shipped','Delivered','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="font-size:0.8rem;color:var(--text-muted);">${fmtDate(o.date)}</td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn-sm btn-edit" onclick="openTrackModal('${o.id}')">Track</button>
          <button class="btn-sm btn-edit" onclick="openEditOrderModal('${o.id}')">Edit</button>
          <button class="btn-sm btn-del" onclick="deleteOrder('${o.id}','${o.customerName.replace(/'/g,"\\'")} — ${o.orderNum||''}')">Del</button>
        </div>
      </td>
    </tr>`).join('');
}

function updateOrderStatus(id,status){
  const orders=getOrders();
  const idx=orders.findIndex(o=>o.id===id);
  if(idx>-1){orders[idx].status=status;
    saveOrders(orders); 
    updatePendingBadge(); 
    renderDashboard(); 
    showToast('Order status updated!','success');}
}
// =================== DELETE FUNCTIONS ===================
/**
 * deleteProduct — shows confirm modal with product name, then removes from localStorage.
 * @param {string} id - product id
 * @param {string} name - product display name shown in confirm modal
 */

function deleteProduct(id, name) {
  showConfirm( 
    'Delete Product', 'You are about to permanently delete:', name, 'This action cannot be undone. The product will be removed permanently.', 
    () => { 
      const prods = getProducts().filter(p => p.id !== id); 
      saveProducts(prods); 
      renderProductsTable(); 
      renderDashboard(); 
      showToast('Product deleted.', 'success'); 
    } 
  )
}

/**
 * deleteOrder — shows confirm modal with order number + customer name, then removes from localStorage.
 * @param {string} id - order id
 * @param {string} label - human-readable identifier shown in confirm modal
 */
function deleteOrder(id,label){
  showConfirm(
    'Delete Order',
    `Are you sure you want to delete this order: ${label}? This action cannot be undone. All order data including tracking info will be lost.`,
    () => {
      const orders=getOrders().filter(o=>o.id!==id);
      saveOrders(orders);
      renderOrders();
      renderDashboard();
      updatePendingBadge();
      showToast('Order deleted.','success');
    }
  );
}

// ADD ORDER MODAL
function openAddOrderModal(){
  document.getElementById('orderModalTitle').textContent='Add Order';
  document.getElementById('om-id').value='';
  ['name','email','phone','size','notes','tracking','address'].forEach(f=>document.getElementById('om-'+f).value='');
  document.getElementById('om-qty').value=1;
  document.getElementById('om-amount').value='';
  document.getElementById('om-status').value='Pending';
  populateOrderProductSelect();
  document.getElementById('orderModal').classList.add('open');
}

function openEditOrderModal(id){
  const o=getOrders().find(o=>o.id===id);
  if(!o)return;
  document.getElementById('orderModalTitle').textContent='Edit Order';
  document.getElementById('om-id').value=o.id;
  document.getElementById('om-name').value=o.customerName||'';
  document.getElementById('om-email').value=o.email||'';
  document.getElementById('om-phone').value=o.phone||'';
  document.getElementById('om-size').value=o.size||'';
  document.getElementById('om-qty').value=o.qty||1;
  document.getElementById('om-amount').value=o.amount||'';
  document.getElementById('om-status').value=o.status||'Pending';
  document.getElementById('om-tracking').value=o.tracking||'';
  document.getElementById('om-address').value=o.address||'';
  document.getElementById('om-notes').value=o.notes||'';
  populateOrderProductSelect(o.product);
  document.getElementById('orderModal').classList.add('open');
}

function populateOrderProductSelect(selected){
  const prods=getProducts();
  const sel=document.getElementById('om-product');
  sel.innerHTML='<option value="">Select product</option>'+prods.map(p=>`<option ${p.name===selected?'selected':''}>${p.name}</option>`).join('');
}

function saveOrder(){
  const id=document.getElementById('om-id').value;
  const orders=getOrders();
  const obj={
    id:id||genId(),
    orderNum:id?orders.find(o=>o.id===id)?.orderNum||genOrderNum():genOrderNum(),
    customerName:document.getElementById('om-name').value.trim(),
    email:document.getElementById('om-email').value.trim(),
    phone:document.getElementById('om-phone').value.trim(),
    product:document.getElementById('om-product').value,
    size:document.getElementById('om-size').value.trim(),
    qty:parseInt(document.getElementById('om-qty').value)||1,
    amount:parseFloat(document.getElementById('om-amount').value)||'',
    status:document.getElementById('om-status').value,
    tracking:document.getElementById('om-tracking').value.trim(),
    address:document.getElementById('om-address').value.trim(),
    notes:document.getElementById('om-notes').value.trim(),
    date:id?orders.find(o=>o.id===id)?.date||new Date().toISOString():new Date().toISOString(),
    updatedAt:new Date().toISOString(),
  };
  if(!obj.customerName){showToast('Customer name is required!','error'); 
  return;}
  if(id){const idx=orders.findIndex(o=>o.id===id);orders[idx]=obj;}
  else{orders.push(obj);}
  saveOrders(orders);
  closeOrderModal();
  renderOrders();
  renderDashboard();
  updatePendingBadge();
  showToast(id?'Order updated!':'Order added!','success');
}

function closeOrderModal(){document.getElementById('orderModal').classList.remove('open');}

// TRACK MODAL
function openTrackModal(id){
  const o=getOrders().find(o=>o.id===id);
  if(!o) 
  return;
  document.getElementById('trackTitle').textContent=`Order ${o.orderNum}`;
  const steps=['Pending','Processing','Shipped','Delivered'];
  const ci=steps.indexOf(o.status);
  
  let timelineHtml=steps.map((s,i)=>{
    const isDone=i<ci||(o.status!=='Cancelled'&&i<=ci);
    const isActive=i===ci&&o.status!=='Cancelled';
    const descs={Pending:'Order received and awaiting processing.',Processing:'Your order is being prepared.',Shipped:`On its way! ${o.tracking?'Tracking: <b>'+o.tracking+'</b>':'No tracking number yet.'}`,Delivered:'Order successfully delivered.'};
    return `
      <div class="track-step">
        <div class="track-line-col">
          <div class="track-dot ${isActive?'active':isDone?'done':''}"></div>
          ${i<steps.length-1?`<div class="track-connector ${isDone?'done':''}"></div>`:''}
        </div>
        <div class="track-info">
          <div class="track-title ${isActive?'active':isDone?'done':''}">${s}</div>
          <div class="track-desc">${descs[s]||''}</div>
        </div>
      </div>`;
  }).join('');

  if(o.status==='Cancelled'){
    timelineHtml=`<div class="badge badge-red" style="font-size:0.8rem;padding:0.5rem 1rem;">Order Cancelled</div>`;
  }

  document.getElementById('trackBody').innerHTML=`
    <div class="order-detail-grid">
      <div class="detail-block">
        <div class="detail-block-label">Customer</div>
        <div class="detail-block-val">${o.customerName}<br/><span style="color:var(--text-muted);font-size:0.8rem;">${o.email||''}</span><br/><span style="color:var(--text-muted);font-size:0.8rem;">${o.phone||''}</span></div>
      </div>
      <div class="detail-block">
        <div class="detail-block-label">Order Details</div>
        <div class="detail-block-val">${o.product||'—'}<br/><span style="color:var(--text-muted);font-size:0.8rem;">Size: ${o.size||'—'} · Qty: ${o.qty||1}</span><br/><span style="color:var(--gold);font-family:'Space Mono',monospace;font-size:0.85rem;">R ${o.amount||'—'}</span></div>
      </div>
      ${o.address?`<div class="detail-block" style="grid-column:span 2;"><div class="detail-block-label">Delivery Address</div><div class="detail-block-val">${o.address}</div></div>`:''}
    </div>
    <div style="margin-bottom:1.5rem;">
      <div class="detail-block-label" style="font-family:'Space Mono',monospace;font-size:0.55rem;letter-spacing:0.25em;color:var(--gold);text-transform:uppercase;margin-bottom:1rem;">Tracking Timeline</div>
      <div class="track-timeline">${timelineHtml}</div>
    </div>
    ${o.notes?`<div class="detail-block"><div class="detail-block-label">Notes</div><div class="detail-block-val" style="font-size:0.85rem;">${o.notes}</div></div>`:''}
  `;
  document.getElementById('trackEditBtn').onclick=()=>{closeTrackModal();openEditOrderModal(id);};
  document.getElementById('trackModal').classList.add('open');
}
function closeTrackModal(){document.getElementById('trackModal').classList.remove('open');}

// ================ PRODUCTS ================
let currentTags=[];

function renderProductsTable(){
  const prods=getProducts();
  const search=(document.getElementById('productSearch')?.value||'').toLowerCase();
  const catFilter=document.getElementById('productCatFilter')?.value||'';
  const filtered=prods.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search)||(p.tags||[]).join(' ').toLowerCase().includes(search);
    const mc=!catFilter||p.category===catFilter;
    return ms&&mc;
  });
  const tbody=document.getElementById('productsTable');
  const empty=document.getElementById('productsEmpty');
  empty.style.display = filtered.length ? 'none' : 'block';
  tbody.innerHTML=filtered.map(p=>`
    <tr>
      <td><img class="td-img" src="${p.image}" alt="${p.name}"/></td>
      <td class="td-name">${p.name}</td>
      <td><span class="badge badge-blue">${p.category}</span></td>
      <td><div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
        ${(p.tags||[]).slice(0,3).map(t=>`<span class="badge badge-gray">${t}</span>`).join('')}</div></td>
      <td class="td-price">R ${p.price}</td>
      <td>${p.inStock?'<span class="badge badge-green">In Stock</span>':'<span class="badge badge-red">Out</span>'}</td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn-sm btn-edit" onclick="openProductModal('${p.id}')">Edit</button>
          <button class="btn-sm btn-del" onclick="deleteProduct('${p.id}')">Del</button> 
          <!--<button class="btn-sm btn-del" onclick="deleteProduct('${p.id}','${p.name.replace(/'/g,"\\'")}')">Delete</button> -->
        </div>
      </td>
    </tr>`).join('');
}

function openProductModal(id){
  currentTags=[];
  document.getElementById('productModalTitle').textContent=id?'Edit Product':'Add Product';
  document.getElementById('pm-id').value=id||'';
  document.getElementById('pm-name').value='';
  document.getElementById('pm-price').value='';
  document.getElementById('pm-category').value='';
  document.getElementById('pm-color').value='';
  document.getElementById('pm-badge').value='';
  document.getElementById('pm-sizes').value='';
  document.getElementById('pm-desc').value='';
  document.getElementById('pm-imageData').value='';
  document.getElementById('pm-inStock').checked=true;
  document.getElementById('imgPreview').style.display='none';
  document.getElementById('imgPlaceholder').style.display='block';

  if(id){
    const p=getProducts().find(p=>p.id===id);
    if(p){
      document.getElementById('pm-name').value=p.name||'';
      document.getElementById('pm-price').value=p.price||'';
      document.getElementById('pm-category').value=p.category||'';
      document.getElementById('pm-color').value=p.color||'';
      document.getElementById('pm-badge').value=p.badge||'';
      document.getElementById('pm-sizes').value=(p.sizes||[]).join(', ');
      document.getElementById('pm-desc').value=p.description||'';
      document.getElementById('pm-inStock').checked=!!p.inStock;
      currentTags=[...(p.tags||[])];
      if(p.image){
        document.getElementById('pm-imageData').value=p.image;
        document.getElementById('imgPreview').src=p.image;
        document.getElementById('imgPreview').style.display='block';
        document.getElementById('imgPlaceholder').style.display='none';
      }
    }
  }
  renderTagsUI();
  document.getElementById('productModal').classList.add('open');
}

function closeProductModal(){document.getElementById('productModal').classList.remove('open');}

function handleImgUpload(e){
  const file=e.target.files[0];
  if(!file)return;
  if(file.size>5*1024*1024){showToast('Image too large (max 5MB)','error');return;}
  const reader=new FileReader();
  reader.onload=()=>{
    const data=reader.result;
    document.getElementById('pm-imageData').value=data;
    document.getElementById('imgPreview').src=data;
    document.getElementById('imgPreview').style.display='block';
    document.getElementById('imgPlaceholder').style.display='none';
  };
  reader.readAsDataURL(file);
}

// TAGS
document.getElementById('tagInput').addEventListener('keydown',(e)=>{
  if(e.key==='Enter'||e.key===','){
    e.preventDefault();
    const val=e.target.value.trim().replace(/,$/,'');
    if(val&&!currentTags.includes(val)){currentTags.push(val);renderTagsUI();}
    e.target.value='';
  }
});

function renderTagsUI(){
  const container=document.getElementById('tagContainer');
  const input=document.getElementById('tagInput');
  container.querySelectorAll('.ftag').forEach(t=>t.remove());
  currentTags.forEach(tag=>{
    const span=document.createElement('span');
    span.className='ftag';
    span.innerHTML=`${tag}<span class="ftag-remove" onclick="removeTag('${tag}')">✕</span>`;
    container.insertBefore(span,input);
  });
}

function removeTag(tag){
  currentTags=currentTags.filter(t=>t!==tag);
  renderTagsUI();
}

function saveProduct(){
  const id=document.getElementById('pm-id').value;
  const name=document.getElementById('pm-name').value.trim();
  const price=parseFloat(document.getElementById('pm-price').value);
  const category=document.getElementById('pm-category').value;
  const imageData=document.getElementById('pm-imageData').value;

  if(!name){showToast('Product name is required!','error');return;}
  if(!price||isNaN(price)){showToast('Valid price is required!','error');return;}
  if(!category){showToast('Category is required!','error');return;}
  if(!imageData){showToast('Please upload a product image!','error');return;}

  const sizes=document.getElementById('pm-sizes').value.split(',').map(s=>s.trim()).filter(Boolean);
  const prods=getProducts();

  const obj={
    id:id||'p'+Date.now(),
    name,
    price,
    category,
    color:document.getElementById('pm-color').value.trim()||'Black',
    badge:document.getElementById('pm-badge').value.trim(),
    sizes,
    tags:currentTags,
    description:document.getElementById('pm-desc').value.trim(),
    image:imageData,
    inStock:document.getElementById('pm-inStock').checked,
    createdAt:id?prods.find(p=>p.id===id)?.createdAt||new Date().toISOString():new Date().toISOString(),
  };

  if(id){
    const idx=prods.findIndex(p=>p.id===id);prods[idx]=obj;
  }
  else{
    prods.push(obj);
  }
  saveProducts(prods);
  closeProductModal();
  renderProductsTable();
  renderDashboard();
  showToast(id?'Product updated!':'Product added!','success');
}

function deleteProduct(id){
  showConfirm('Delete Product','Are you sure you want to delete this product? This cannot be undone.',()=>{
    const prods=getProducts().filter(p=>p.id!==id);
    saveProducts(prods);
    renderProductsTable();
    renderDashboard();
    showToast(`Product ${id} deleted.`,`success`);
  });
}

// ================ SETTINGS ================
function loadSettingsForm(){
  const s=getSettings();
  document.getElementById('set-formUrl').value=s.googleFormUrl||'';
  document.getElementById('set-storeName').value=s.storeName||'Ntwana Ya Kasi';
  document.getElementById('set-whatsapp').value=s.whatsapp||'';
  document.getElementById('set-announcement').value=s.announcement||'';
}

function saveSettings(){
  const s=getSettings();
  s.googleFormUrl=document.getElementById('set-formUrl').value.trim();
  s.storeName=document.getElementById('set-storeName').value.trim();
  s.whatsapp=document.getElementById('set-whatsapp').value.trim();
  s.announcement=document.getElementById('set-announcement').value.trim();
  saveSettingsData(s);
  showToast('Settings saved!','success');
}

function changePassword(){
  const np=document.getElementById('set-newpass').value;
  const cp=document.getElementById('set-confpass').value;
  if(!np){showToast('Enter a new password','error'); 
  return;} 
  if(np!==cp){showToast('Passwords do not match!','error'); 
  return;}
  if(np.length<6){showToast('Password must be at least 6 characters','error'); 
  return;} 
  const creds=getCreds();
  creds.pass=np;
  localStorage.setItem(ADMIN_CREDS_KEY,JSON.stringify(creds));
  document.getElementById('set-newpass').value='';
  document.getElementById('set-confpass').value='';
  showToast('Password updated!','success');
}

function exportData(){
  const data={products:getProducts(),orders:getOrders(),settings:getSettings(),exported:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`nyk-data-${Date.now()}.json`;
  a.click();
  showToast('Data exported!','success');
}

function confirmReset(){
  showConfirm('Reset All Data','This will clear all products, orders, and restore defaults. This action cannot be undone.',()=>{
    localStorage.removeItem('nyk_products');
    localStorage.removeItem('nyk_orders');
    localStorage.removeItem('nyk_settings');
    showToast('Data reset. Reloading...','success');
    setTimeout(()=>location.reload(),1500);
  });
}

// ================ CONFIRM MODAL ================
let confirmCallback=null;
function showConfirm(title,msg,cb){
  document.getElementById('confirmTitle').textContent=title;
  document.getElementById('confirmMessage').textContent=msg;
  confirmCallback=cb;
  document.getElementById('confirmModal').classList.add('open');
}
document.getElementById('confirmOkBtn').onclick=()=>{
  closeConfirmModal();
  if(confirmCallback)confirmCallback();
};
function closeConfirmModal(){document.getElementById('confirmModal').classList.remove('open');confirmCallback=null;}

// Close modals on overlay click
['productModal','orderModal','trackModal','confirmModal'].forEach(id=>{
  document.getElementById(id).addEventListener('click',(e)=>{
    if(e.target===e.currentTarget)document.getElementById(id).classList.remove('open');
  });
});

// ESC to close
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape'){
    ['productModal','orderModal','trackModal','confirmModal'].forEach(id=>document.getElementById(id).classList.remove('open'));
  }
});

// ================ TOAST ================
function showToast(msg,type='success'){
  const t=document.getElementById('admToast');
  t.className='adm-toast '+type;
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}
