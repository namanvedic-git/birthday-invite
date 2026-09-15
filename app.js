const cfg = window.APP_CONFIG || {};
const STORAGE_KEY = "birthday_invite_events_v3";
const RESPONSE_KEY = "birthday_invite_response_v3";

const pages = [...document.querySelectorAll(".page")];
const icon = document.getElementById("icon");
const noBtn = document.getElementById("noBtn");
const yesBtn = document.getElementById("yesBtn");
const okayBtn = document.getElementById("okayBtn");
const acceptBtn = document.getElementById("acceptBtn");
const payBtn = document.getElementById("payBtn");
const backBtn = document.getElementById("backBtn");
const hint = document.getElementById("hint");

let noX=0, noY=0, noDodges=0, yesDodged=false, selectedPlace="", selectedFeeling="";
let locationData=null, sessionId=getSessionId();

function getSessionId(){
  let id=sessionStorage.getItem("invite_session_id");
  if(!id){id=crypto.randomUUID ? crypto.randomUUID() : "s-"+Date.now()+"-"+Math.random().toString(36).slice(2);sessionStorage.setItem("invite_session_id",id);}
  return id;
}
function logEvent(type,data={}){
  const event={session_id:sessionId,invite_id:cfg.INVITE_ID||"birthday-26-nov",type,data,timestamp:new Date().toISOString()};
  const arr=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); arr.push(event); localStorage.setItem(STORAGE_KEY,JSON.stringify(arr));
  if(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) sendCloud(event);
}
async function sendCloud(event){
  try{await fetch(cfg.SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/invite_events",{method:"POST",headers:{"Content-Type":"application/json","apikey":cfg.SUPABASE_ANON_KEY,"Authorization":"Bearer "+cfg.SUPABASE_ANON_KEY,"Prefer":"return=minimal"},body:JSON.stringify(event)});}catch(e){console.warn("Cloud event failed",e);}
}
function partyPop(){
  const layer=document.createElement("div");
  layer.className="party-rain";
  for(let i=0;i<52;i++){
    const piece=document.createElement("span");
    piece.className="party-piece";
    piece.style.left=(Math.random()*100)+"vw";
    piece.style.setProperty("--drift",((Math.random()*2-1)*90)+"px");
    piece.style.setProperty("--spin",((Math.random()*2-1)*720)+"deg");
    piece.style.animationDelay=(Math.random()*0.42)+"s";
    piece.style.animationDuration=(2.2+Math.random()*1.4)+"s";
    piece.style.width=(5+Math.random()*8)+"px";
    piece.style.height=(10+Math.random()*16)+"px";
    piece.style.background=["#df5e8e","#f3b45f","#f6d58a","#d98aa8","#e77a9b"][i%5];
    piece.style.borderRadius=(Math.random()>0.7?"2px":"1px");
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(()=>layer.remove(),4200);
}
function showPage(n){
  pages.forEach((p,i)=>p.classList.toggle("active",i===n));
  const icons=["💗","🎀","🤗","💫","💗","💳",""];
  icon.textContent=icons[n]||"";
  icon.classList.toggle("hidden",n===6);
  if(n===1 || n===3) partyPop();
  window.scrollTo({top:0,behavior:"smooth"});
}

logEvent("opened",{referrer:document.referrer||null});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")logEvent("page_visible")});

const R={push:55,radius:135,maxX:110,maxY:60};
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function moveButton(btn,x,y){btn.style.transform=`translate3d(${x}px,${y}px,0)`;}
function dodgeNo(px,py){
  const r=noBtn.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=cx-px,dy=cy-py,d=Math.hypot(dx,dy);
  if(d>R.radius)return false;
  if(d<2){dx=(noDodges%2?1:-1);dy=-.35;d=Math.hypot(dx,dy);}
  const closeness=1-d/R.radius, amount=18+closeness*R.push;
  noX=clamp(noX+(dx/d)*amount,-R.maxX,R.maxX); noY=clamp(noY+(dy/d)*amount,-R.maxY,R.maxY);
  moveButton(noBtn,noX,noY); noDodges++;
  hint.textContent="Nope… 😏";
  logEvent("no_dodge",{count:noDodges,x:Math.round(noX),y:Math.round(noY)});
  return true;
}
function dodgeYesOnce(px,py){
  if(yesDodged)return false;
  const r=yesBtn.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=cx-px,dy=cy-py,d=Math.hypot(dx,dy);
  if(d>115)return false;
  if(d<2){dx=1;dy=-.4;d=Math.hypot(dx,dy);}
  const amount=48;
  yesBtn.style.transform=`translate3d(${clamp((dx/d)*amount,-75,75)}px,${clamp((dy/d)*amount,-45,45)}px,0)`;
  yesDodged=true;
  logEvent("yes_dodge_once");
  return true;
}

document.addEventListener("pointermove",e=>{
  if(e.pointerType!=="mouse")return;
  dodgeNo(e.clientX,e.clientY);
  dodgeYesOnce(e.clientX,e.clientY);
},{passive:true});
document.addEventListener("touchmove",e=>{
  const t=e.touches[0];
  if(!t)return;
  if(dodgeNo(t.clientX,t.clientY) || dodgeYesOnce(t.clientX,t.clientY))e.preventDefault();
},{passive:false});
noBtn.addEventListener("touchstart",e=>{
  e.preventDefault();
  const t=e.touches[0],r=noBtn.getBoundingClientRect();
  let dx=r.left+r.width/2-t.clientX,dy=r.top+r.height/2-t.clientY,d=Math.hypot(dx,dy)||1;
  noX=clamp(noX+(dx/d)*55,-R.maxX,R.maxX); noY=clamp(noY+(dy/d)*55,-R.maxY,R.maxY);
  moveButton(noBtn,noX,noY); noDodges++;
  hint.textContent="Nice try 😏"; logEvent("no_attempt",{count:noDodges});
},{passive:false});
noBtn.addEventListener("click",e=>{e.preventDefault();logEvent("no_click_blocked");});

yesBtn.addEventListener("click",()=>{
  logEvent("yes_clicked",{no_dodges:noDodges,yes_dodged_once:yesDodged});
  showPage(1);
});
okayBtn.addEventListener("click",()=>{logEvent("okay_clicked");showPage(2);});

yesBtn.addEventListener("touchstart",e=>{
  if(yesDodged)return;
  e.preventDefault();
  const t=e.touches[0],r=yesBtn.getBoundingClientRect();
  let dx=r.left+r.width/2-t.clientX,dy=r.top+r.height/2-t.clientY,d=Math.hypot(dx,dy)||1;
  yesBtn.style.transform=`translate3d(${clamp((dx/d)*48,-75,75)}px,${clamp((dy/d)*48,-45,45)}px,0)`;
  yesDodged=true;
  logEvent("yes_dodge_once",{input:"touch"});
},{passive:false});

document.querySelectorAll(".place").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".place").forEach(x=>x.classList.remove("selected"));
  btn.classList.add("selected"); selectedPlace=btn.dataset.place; logEvent("place_selected",{place:selectedPlace});
}));

document.getElementById("locationBtn").addEventListener("click",()=>{
  const status=document.getElementById("locationStatus");
  if(!navigator.geolocation){status.textContent="Location is not supported by this browser.";return;}
  status.textContent="Requesting location permission…";logEvent("location_requested");
  navigator.geolocation.getCurrentPosition(pos=>{
    locationData={latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy_m:pos.coords.accuracy};
    status.textContent="Location captured ✓";logEvent("location_shared",{accuracy_m:Math.round(pos.coords.accuracy)});
  },err=>{status.textContent=err.code===1?"Location permission was not allowed.":"Could not get location.";logEvent("location_failed",{code:err.code});},{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
});

document.getElementById("submitBtn").addEventListener("click",()=>{
  const time=document.getElementById("time").value;
  const address=document.getElementById("address").value.trim();
  const error=document.getElementById("formError");
  if(!selectedPlace){error.textContent="Please choose where you'll meet.";return;}
  if(!time){error.textContent="Please pick a time.";return;}
  if(!address && !locationData){error.textContent="Please enter the address or share your location.";return;}
  const response={session_id:sessionId,invite_id:cfg.INVITE_ID,time,place:selectedPlace,address:address||null,location:locationData,submitted_at:new Date().toISOString()};
  localStorage.setItem(RESPONSE_KEY,JSON.stringify(response));
  logEvent("form_submitted",{place:selectedPlace,time,address_entered:!!address,location_shared:!!locationData});
  if(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) sendResponse(response);
  showPage(3);
});

document.querySelectorAll(".feeling").forEach(btn=>btn.addEventListener("click",()=>{
  selectedFeeling=btn.dataset.feeling;
  document.querySelectorAll(".feeling").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");
  logEvent("feeling_selected",{feeling:selectedFeeling});
  setTimeout(()=>showPage(4),220);
}));
acceptBtn.addEventListener("click",()=>{logEvent("accept_clicked");showPage(5);});
payBtn.addEventListener("click",()=>{logEvent("fee_button_clicked");showPage(6);});
let backX=0, backY=0, backDodges=0;
function dodgeBack(){
  const r=backBtn.getBoundingClientRect();
  const maxX=Math.max(70,Math.min(150,(window.innerWidth-r.width)/2));
  const maxY=55;
  backX=backX===0 ? 95 : -backX;
  backY=(backDodges%2===0 ? -28 : 28);
  backX=clamp(backX,-maxX,maxX);
  moveButton(backBtn,backX,backY);
  backDodges++;
  logEvent("back_dodge",{count:backDodges,x:Math.round(backX),y:Math.round(backY)});
}
backBtn.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse")dodgeBack();});
backBtn.addEventListener("touchstart",e=>{e.preventDefault();dodgeBack();},{passive:false});
backBtn.addEventListener("click",e=>{e.preventDefault();dodgeBack();});

async function sendResponse(response){
  try{await fetch(cfg.SUPABASE_URL.replace(/\/$/,"")+"/rest/v1/invite_responses",{method:"POST",headers:{"Content-Type":"application/json","apikey":cfg.SUPABASE_ANON_KEY,"Authorization":"Bearer "+cfg.SUPABASE_ANON_KEY,"Prefer":"return=minimal"},body:JSON.stringify(response)});}catch(e){console.warn("Cloud response failed",e);}
}
