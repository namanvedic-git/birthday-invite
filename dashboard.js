const KEY="birthday_invite_events_v3", RESPONSE="birthday_invite_response_v3";
const $=id=>document.getElementById(id);
function read(){return JSON.parse(localStorage.getItem(KEY)||"[]");}
function render(){
 const ev=read();
 $("opens").textContent=ev.filter(x=>x.type==="opened").length;
 $("yes").textContent=ev.filter(x=>x.type==="yes_clicked").length;
 $("dodges").textContent=ev.filter(x=>x.type==="no_dodge"||x.type==="no_attempt").length;
 $("submits").textContent=ev.filter(x=>x.type==="form_submitted").length;
 $("events").innerHTML=ev.slice().reverse().map(x=>`<div class="event"><b>${escapeHtml(x.type)}</b><small>${new Date(x.timestamp).toLocaleString()}</small><code>${escapeHtml(JSON.stringify(x.data))}</code></div>`).join("")||"<p>No activity yet.</p>";
 const r=localStorage.getItem(RESPONSE);$("response").textContent=r?JSON.stringify(JSON.parse(r),null,2):"No response yet.";
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
$("refresh").onclick=render;
$("clear").onclick=()=>{if(confirm("Clear this browser's local invite data?")){localStorage.removeItem(KEY);localStorage.removeItem(RESPONSE);render();}};
render();
