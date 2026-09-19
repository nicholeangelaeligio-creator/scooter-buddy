const KEY="scooterBuddyDataV1"; // Keep V1 key so existing garage data is preserved
let data=JSON.parse(localStorage.getItem(KEY)||'{"scooters":[],"active":null,"history":[]}');
const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const fmt=n=>Math.round(n).toLocaleString()+" km";
function activeBike(){return data.scooters.find(x=>x.id===data.active)}
function populateBrands(){
 brand.innerHTML=Object.keys(PH_SCOOTERS).map(x=>`<option>${x}</option>`).join("");
 populateModels();
}
function populateModels(){model.innerHTML=PH_SCOOTERS[brand.value].map(x=>`<option>${x}</option>`).join("")}
function render(){
 const bike=activeBike(), empty=$("#empty"), dash=$("#dashboard");
 $("#tabs").innerHTML=data.scooters.map(b=>`<button class="tab ${b.id===data.active?'active':''}" data-id="${b.id}">${b.model}</button>`).join("");
 document.querySelectorAll(".tab").forEach(x=>x.onclick=()=>{data.active=x.dataset.id;save();render()});
 empty.hidden=!!bike;dash.hidden=!bike;
 if(!bike)return renderHistory();
 $("#bikeBrand").textContent=bike.brand;$("#bikeName").textContent=bike.model;$("#bikeYear").textContent="Model year "+bike.year;$("#odoValue").textContent=bike.odometer.toLocaleString();
 let due=0,soon=0,good=0;
 $("#maintenance").innerHTML=SERVICE_RULES.map(r=>{
   const hasServiceRecord = bike.services[r.id] !== undefined;
   const last = hasServiceRecord ? bike.services[r.id] : 0;
   const next = last + r.interval, remain = next - bike.odometer;
   let status,cls;if(remain<=0){status="DUE NOW";cls="due";due++}else if(remain<=Math.min(1000,r.interval*.2)){status="DUE SOON";cls="soon";soon++}else{status="GOOD";cls="good";good++}
   const pct=Math.max(3,Math.min(100,((bike.odometer-last)/r.interval)*100));
   const detail=remain<=0?fmt(Math.abs(remain))+" overdue":fmt(remain)+" remaining";
   return `<div class="maintenanceCard"><div class="maintTop"><div><h3>${r.name}</h3><span class="muted">${r.action} every ${fmt(r.interval)}</span></div><span class="badge ${cls}">${status}</span></div><div class="progress"><div class="bar" style="width:${pct}%"></div></div><div class="muted">Next: ${fmt(next)} · ${detail}</div><button class="service" data-service="${r.id}">Mark ${r.action} Done</button></div>`;
 }).join("");
 $("#summary").innerHTML=`<div class="stat"><strong>${due}</strong><span>DUE NOW</span></div><div class="stat"><strong>${soon}</strong><span>DUE SOON</span></div><div class="stat"><strong>${good}</strong><span>GOOD</span></div>`;
 document.querySelectorAll(".service").forEach(btn=>btn.onclick=()=>completeService(btn.dataset.service));
 renderHistory();
}
function completeService(id){
 const bike=activeBike(), rule=SERVICE_RULES.find(x=>x.id===id);if(!bike||!rule)return;
 bike.services[id]=bike.odometer;
 data.history.unshift({id:Date.now(),scooterId:bike.id,name:rule.name,action:rule.action,odometer:bike.odometer,date:new Date().toLocaleDateString()});
 save();render();
}
function renderHistory(){
 const bike=activeBike(), list=$("#history");
 if(!bike){list.innerHTML='<div class="card"><p>Add a scooter to start a service history.</p></div>';return}
 const rows=data.history.filter(x=>x.scooterId===bike.id);
 list.innerHTML=rows.length?rows.map(x=>`<div class="historyItem"><strong>${x.name} · ${x.action}</strong><span class="muted">${fmt(x.odometer)} · ${x.date}</span></div>`).join(""):'<div class="card"><p>No service records yet.</p></div>';
}
function openAdd(){populateBrands();$("#modal").hidden=false}
$("#addBtn").onclick=openAdd;$("#emptyAdd").onclick=openAdd;$("#closeModal").onclick=()=>$("#modal").hidden=true;
brand.onchange=populateModels;
$("#scooterForm").onsubmit=e=>{
 e.preventDefault();const odo=Math.round(Number(startOdo.value));if(!Number.isFinite(odo)||odo<0)return;
 const b={id:String(Date.now()),brand:brand.value,model:model.value,year:Number(year.value),odometer:odo,startOdo:odo,services:{}};
 data.scooters.push(b);data.active=b.id;save();$("#modal").hidden=true;e.target.reset();render();
};
$("#updateOdo").onclick=()=>{const b=activeBike();newOdo.value=b.odometer;$("#odoModal").hidden=false};
$("#closeOdo").onclick=()=>$("#odoModal").hidden=true;
$("#odoForm").onsubmit=e=>{e.preventDefault();const b=activeBike(),n=Math.round(Number(newOdo.value));if(!Number.isFinite(n)||n<b.odometer){alert("Odometer cannot be lower than the saved reading.");return}b.odometer=n;save();$("#odoModal").hidden=true;render()};
document.querySelectorAll(".nav").forEach(btn=>btn.onclick=()=>{document.querySelectorAll("main>section").forEach(v=>v.hidden=true);$("#"+btn.dataset.view).hidden=false;document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));btn.classList.add("active");renderHistory()});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
render();
