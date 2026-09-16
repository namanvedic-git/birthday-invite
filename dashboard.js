const cfg = window.APP_CONFIG || {};
const STORAGE_KEY = "birthday_invite_events_v3";
const RESPONSE_KEY = "birthday_invite_response_v3";
const INVITE_ID = cfg.INVITE_ID || "birthday-26-nov";

const $ = (id) => document.getElementById(id);

let client = null;
let eventsCache = [];
let responsesCache = [];

function localEvents(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function localResponse(){
  try { return JSON.parse(localStorage.getItem(RESPONSE_KEY) || "null"); }
  catch { return null; }
}

function setLoggedIn(show){
  $("loginPanel").hidden = show;
  $("appContent").hidden = !show;
}

function formatTime(value){
  if(!value) return "";
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString([], {dateStyle:"medium", timeStyle:"short"});
}

function prettyData(data){
  if(data == null) return "";
  if(typeof data === "string") return data;
  try { return JSON.stringify(data); } catch { return String(data); }
}

function render(){
  const ev = eventsCache.length ? eventsCache : localEvents();
  $("opens").textContent = ev.filter(x => x.type === "opened").length;
  $("yes").textContent = ev.filter(x => x.type === "yes_clicked").length;
  $("dodges").textContent = ev.filter(x => x.type === "no_dodge" || x.type === "no_attempt").length;
  $("submits").textContent = ev.filter(x => x.type === "form_submitted").length;

  if(!ev.length){
    $("events").textContent = "No activity yet.";
  } else {
    $("events").innerHTML = ev.slice(0,50).map(x => `
      <div class="event" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)">
        <strong>${escapeHtml(x.type || "event")}</strong>
        <small style="display:block;opacity:.65">${escapeHtml(formatTime(x.timestamp))} • ${escapeHtml(x.session_id || "")}</small>
        ${x.data && Object.keys(x.data).length ? `<div style="margin-top:4px;opacity:.85">${escapeHtml(prettyData(x.data))}</div>` : ""}
      </div>`).join("");
  }

  const latest = responsesCache[0] || localResponse();
  if(!latest){
    $("response").textContent = "No response yet.";
  } else {
    const out = {
      place: latest.place,
      date: latest.date,
      time: latest.time,
      address: latest.address || "",
      location: latest.location || null,
      session_id: latest.session_id || "",
      submitted_at: latest.submitted_at || ""
    };
    $("response").textContent = JSON.stringify(out, null, 2);
  }
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadCloud(){
  if(!client) return;

  const { data: { session } } = await client.auth.getSession();
  if(!session){
    setLoggedIn(false);
    return;
  }

  const [eventResult, responseResult] = await Promise.all([
    client.from("invite_events")
      .select("id,invite_id,session_id,type,data,timestamp")
      .eq("invite_id", INVITE_ID)
      .order("timestamp", {ascending:false})
      .limit(100),
    client.from("invite_responses")
      .select("id,invite_id,session_id,place,date,time,address,location,submitted_at")
      .eq("invite_id", INVITE_ID)
      .order("submitted_at", {ascending:false})
      .limit(50)
  ]);

  if(eventResult.error) throw eventResult.error;
  if(responseResult.error) throw responseResult.error;

  eventsCache = eventResult.data || [];
  responsesCache = responseResult.data || [];
  render();
}

async function signIn(e){
  e.preventDefault();
  $("loginError").textContent = "";

  if(!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY){
    $("loginError").textContent = "Supabase config is missing.";
    return;
  }

  const email = $("email").value.trim();
  const password = $("password").value;
  const { error } = await client.auth.signInWithPassword({email, password});

  if(error){
    $("loginError").textContent = error.message;
    return;
  }

  $("password").value = "";
  setLoggedIn(true);
  await refresh();
}

async function refresh(){
  $("events").textContent = "Loading…";
  try {
    await loadCloud();
  } catch(error) {
    console.error(error);
    $("events").textContent = "Could not load cloud activity: " + (error.message || error);
    render();
  }
}

async function signOut(){
  if(client) await client.auth.signOut();
  eventsCache = [];
  responsesCache = [];
  setLoggedIn(false);
}

$("loginForm").addEventListener("submit", signIn);
$("refresh").addEventListener("click", refresh);
$("logout").addEventListener("click", signOut);
async function clearCloud(){
  if(!client) return;

  const { data:{session} } = await client.auth.getSession();
  if(!session){
    setLoggedIn(false);
    return;
  }

  const ok = confirm("⚠️ Delete all cloud activity and responses for this invite?");
  if(!ok) return;

  const [eventResult, responseResult] = await Promise.all([
    client.from("invite_events").delete().eq("invite_id", INVITE_ID),
    client.from("invite_responses").delete().eq("invite_id", INVITE_ID)
  ]);

  if(eventResult.error) throw eventResult.error;
  if(responseResult.error) throw responseResult.error;

  eventsCache = [];
  responsesCache = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RESPONSE_KEY);
  render();

  alert("Cloud data cleared successfully.");
}

$("clearCloud").addEventListener("click", async () => {
  try {
    await clearCloud();
  } catch(error) {
    console.error(error);
    alert("Could not clear cloud data: " + (error.message || error));
  }
});

if(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase){
  client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  client.auth.onAuthStateChange((_event, session) => {
    setLoggedIn(!!session);
    if(session) refresh();
  });
  client.auth.getSession().then(({data:{session}}) => {
    setLoggedIn(!!session);
    if(session) refresh();
  });
} else {
  setLoggedIn(false);
  $("loginError").textContent = "Supabase config is missing. Check config.js.";
}

render();
