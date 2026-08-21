
const projects = [
  {
    id:"exposition",
    name:"NYXA Protect",
    description:"Comprendre les fuites de données, évaluer les risques et apprendre les bons réflexes face aux arnaques.",
    category:["securite"],
    tags:["Sécurité","Prévention"],
    features:["Fuites","Faux conseiller","Parcours guidé"],
    preview:"assets/previews/exposition.svg",
    url:"/exposition-numerique/",
    recommended:true
  },
  {
    id:"before",
    name:"NYXA Before",
    description:"Avant d’acheter, signer ou envoyer quelque chose : la checklist qui vous rappelle ce qu’il faut vérifier avant qu’il soit trop tard.",
    category:["quotidien"],
    tags:["Checklist","Décision"],
    features:["8 situations","Points STOP","Progression"],
    preview:"assets/previews/before.svg",
    url:"/nyxa-before/"
  },
  {
    id:"proof",
    name:"NYXA Proof",
    description:"Construire un dossier de preuves propre : dates, événements, montants et chronologie pour un litige, SAV ou assurance.",
    category:["organisation","quotidien"],
    tags:["Dossier","Preuves"],
    features:["Timeline","Export","Impression"],
    preview:"assets/previews/proof.svg",
    url:"/nyxa-proof/"
  },
  {
    id:"buycheck",
    name:"NYXA BuyCheck",
    description:"Vérifier un achat d’occasion avant de payer : téléphone, voiture, PC, console, électroménager ou vendeur en ligne.",
    category:["quotidien","securite"],
    tags:["Achat","Contrôle"],
    features:["Score","Tests STOP","6 catégories"],
    preview:"assets/previews/buycheck.svg",
    url:"/nyxa-buycheck/"
  },
  {
    id:"homebook",
    name:"NYXA HomeBook",
    description:"Le carnet numérique de la maison : équipements, garanties, factures, références et prochaines maintenances.",
    category:["organisation","quotidien"],
    tags:["Maison","Organisation"],
    features:["Garanties","Maintenance","Sauvegarde"],
    preview:"assets/previews/homebook.svg",
    url:"/nyxa-homebook/"
  },
  {
    id:"linkcheck",
    name:"NYXA LinkCheck",
    description:"Vérifiez un lien avec VirusTotal, comprenez le résultat et accédez aux bons services de signalement en quelques étapes.",
    category:["securite"],
    tags:["Sécurité","Phishing","URL","VirusTotal"],
    features:["Vérification URL","Comprendre","Signalement"],
    preview:"assets/previews/linkcheck.svg",
    url:"/nyxa-linkcheck/"
  }
];

const state = { filter:"all", search:"", online:new Map() };
const grid = document.querySelector("#projectGrid");
const liveCount = document.querySelector("#liveCount");
const emptyState = document.querySelector("#emptyState");

function cardTemplate(p){
  const online = state.online.get(p.id);
  const isLive = online === true;
  const pending = online === false;
  const statusLabel = isLive ? "Disponible" : pending ? "À publier" : "Vérification…";
  const statusClass = isLive ? "live" : "pending";
  const action = isLive
    ? `<a class="open-project" href="${p.url}">Ouvrir l’outil →</a>`
    : `<span class="disabled-project">${pending ? "Bientôt disponible" : "Vérification…"}</span>`;

  return `
    <article class="project-card ${p.recommended ? "recommended" : ""}" data-project="${p.id}">
      <div class="project-preview"><img src="${p.preview}" alt="" loading="lazy"></div>
      <div class="project-body">
        <div class="project-meta">
          <div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
          <span class="status ${statusClass}">${statusLabel}</span>
        </div>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="project-features">${p.features.map(f=>`<span>${f}</span>`).join("")}</div>
        <div class="card-actions">${action}</div>
      </div>
    </article>`;
}

function render(){
  const q = state.search.trim().toLowerCase();
  const visible = projects.filter(p=>{
    const filterOk = state.filter === "all" || p.category.includes(state.filter);
    const text = [p.name,p.description,...p.tags,...p.features].join(" ").toLowerCase();
    return filterOk && (!q || text.includes(q));
  });
  grid.innerHTML = visible.map(cardTemplate).join("");
  emptyState.hidden = visible.length > 0;
  liveCount.textContent = [...state.online.values()].filter(v => v === true).length;
}

document.querySelector("#searchInput").addEventListener("input", e=>{
  state.search = e.target.value;
  render();
});

document.querySelectorAll(".filter").forEach(btn=>{
  btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".filter").forEach(b=>{
      b.classList.remove("active");
      b.setAttribute("aria-pressed","false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed","true");
    state.filter = btn.dataset.filter;
    render();
  });
});

// Check whether each GitHub Pages project is actually online.
// This works when the portal is itself hosted on nyxalabs.github.io.
async function checkProjects(){
  if(location.protocol === "file:"){
    // Local preview: show the known public project as live and others as pending.
    state.online.set("exposition", true);
    ["before","proof","buycheck","homebook"].forEach(id=>state.online.set(id,false));
    render();
    return;
  }
  await Promise.all(projects.map(async p=>{
    try{
      const res = await fetch(p.url, {method:"GET", cache:"no-store"});
      state.online.set(p.id, res.ok);
    }catch{
      state.online.set(p.id,false);
    }
    render();
  }));
}

document.querySelector("#year").textContent = new Date().getFullYear();

// Theme
const root = document.documentElement;
const savedTheme = localStorage.getItem("nyxa-portal-theme");
if(savedTheme) root.dataset.theme = savedTheme;
document.querySelector("#themeToggle").addEventListener("click",()=>{
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  localStorage.setItem("nyxa-portal-theme", next);
});

// PWA install prompt
let deferredPrompt = null;
const installBtn = document.querySelector("#installBtn");
window.addEventListener("beforeinstallprompt", e=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

// Service worker
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
}

// Lightweight animated starfield.
const canvas = document.querySelector("#stars");
const ctx = canvas ? canvas.getContext("2d") : null;
let stars = [];
let dpr = Math.min(devicePixelRatio || 1, 2);
function resize(){
  canvas.width = innerWidth*dpr; canvas.height = innerHeight*dpr;
  canvas.style.width = innerWidth+"px"; canvas.style.height = innerHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const count = Math.min(110, Math.floor(innerWidth*innerHeight/13000));
  stars = Array.from({length:count},()=>({
    x:Math.random()*innerWidth,y:Math.random()*innerHeight,
    r:.35+Math.random()*1.05,a:.12+Math.random()*.48,
    s:.04+Math.random()*.14
  }));
}
function draw(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  const light = root.dataset.theme === "light";
  ctx.fillStyle = light ? "#55709a" : "#c9d9ff";
  stars.forEach(st=>{
    st.y += st.s;
    if(st.y>innerHeight+3){st.y=-3;st.x=Math.random()*innerWidth}
    ctx.globalAlpha=st.a;
    ctx.beginPath();ctx.arc(st.x,st.y,st.r,0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;
  requestAnimationFrame(draw);
}
if(ctx && !matchMedia("(prefers-reduced-motion: reduce)").matches){
  resize();addEventListener("resize",resize);draw();
}

render();
checkProjects();
