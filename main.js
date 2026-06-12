function initConstellation() {
  const container = document.querySelector(".page-stars");
  if (!container) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "constellation");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `
    <line x1="12%" y1="18%" x2="22%" y2="28%" stroke="rgba(210,218,232,0.2)" stroke-width="1"/>
    <line x1="22%" y1="28%" x2="18%" y2="42%" stroke="rgba(210,218,232,0.15)" stroke-width="1"/>
    <line x1="78%" y1="22%" x2="88%" y2="32%" stroke="rgba(210,218,232,0.2)" stroke-width="1"/>
    <line x1="88%" y1="32%" x2="84%" y2="48%" stroke="rgba(210,218,232,0.15)" stroke-width="1"/>
    <line x1="6%" y1="68%" x2="14%" y2="78%" stroke="rgba(210,218,232,0.12)" stroke-width="1"/>
    <line x1="86%" y1="72%" x2="94%" y2="82%" stroke="rgba(210,218,232,0.12)" stroke-width="1"/>
  `;
  container.appendChild(svg);
}

function initStars() {
  const container = document.querySelector(".page-stars");
  if (!container) return;

  const items = [
    { type: "star--4", top: "6%", left: "5%", opacity: 0.5, twinkle: true, delay: 0 },
    { type: "star--8", top: "12%", left: "90%", opacity: 0.65, twinkle: true, delay: 1.2, float: true },
    { type: "star--4", top: "24%", left: "94%", opacity: 0.4, delay: 2.1 },
    { type: "sparkle sparkle--flare", top: "20%", left: "3%", opacity: 0.55, rotate: 14, twinkle: true, delay: 0.8 },
    { type: "star--8", top: "38%", left: "2%", opacity: 0.45, float: true, delay: 1.5 },
    { type: "sparkle sparkle--dot", top: "34%", left: "96%", opacity: 0.7, twinkle: true, delay: 2.4 },
    { type: "star--4", top: "52%", left: "7%", opacity: 0.35, delay: 0.4 },
    { type: "sparkle sparkle--flare", top: "58%", left: "91%", opacity: 0.5, rotate: -10, twinkle: true, delay: 1.8 },
    { type: "star--8", top: "70%", left: "4%", opacity: 0.55, float: true, delay: 2.8 },
    { type: "star--4", top: "76%", left: "92%", opacity: 0.42, twinkle: true, delay: 0.6 },
    { type: "sparkle sparkle--dot", top: "84%", left: "10%", opacity: 0.6, delay: 1.1 },
    { type: "star--8", top: "88%", left: "80%", opacity: 0.48, twinkle: true, delay: 2.2 },
    { type: "sparkle sparkle--flare", top: "46%", left: "97%", opacity: 0.38, rotate: 6, delay: 1.4 },
    { type: "sparkle sparkle--dot", top: "16%", left: "70%", opacity: 0.45, twinkle: true, delay: 2.6 },
    { type: "star--4", top: "64%", left: "76%", opacity: 0.36, float: true, delay: 0.9 },
    { type: "star--8", top: "30%", left: "48%", opacity: 0.2, twinkle: true, delay: 3.1 },
    { type: "sparkle sparkle--dot", top: "44%", left: "52%", opacity: 0.18, delay: 1.7 },
    { type: "star--4", top: "92%", left: "45%", opacity: 0.22, twinkle: true, delay: 2.9 },
  ];

  items.forEach((item) => {
    const el = document.createElement("span");
    el.className = item.type.includes("sparkle") ? item.type : `star ${item.type}`;
    if (item.twinkle) el.classList.add("twinkle");
    if (item.float) el.classList.add("float");
    el.style.top = item.top;
    el.style.left = item.left;
    el.style.opacity = item.opacity;
    if (item.rotate) el.style.transform = `rotate(${item.rotate}deg)`;
    if (item.delay != null) el.style.animationDelay = `${item.delay}s`;
    el.setAttribute("aria-hidden", "true");
    container.appendChild(el);
  });
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    });
  });
}

function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

initConstellation();
initStars();
initNav();
initYear();
