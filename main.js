function initStars() {
  const container = document.querySelector(".page-stars");
  if (!container) return;

  const items = [
    { type: "star--4", top: "8%", left: "6%", opacity: 0.45 },
    { type: "star--8", top: "14%", left: "88%", opacity: 0.55 },
    { type: "star--4", top: "28%", left: "92%", opacity: 0.35 },
    { type: "sparkle sparkle--flare", top: "22%", left: "4%", opacity: 0.5, rotate: 12 },
    { type: "star--8", top: "42%", left: "3%", opacity: 0.4 },
    { type: "sparkle sparkle--dot", top: "38%", left: "95%", opacity: 0.6 },
    { type: "star--4", top: "55%", left: "8%", opacity: 0.3 },
    { type: "sparkle sparkle--flare", top: "62%", left: "90%", opacity: 0.45, rotate: -8 },
    { type: "star--8", top: "72%", left: "5%", opacity: 0.5 },
    { type: "star--4", top: "78%", left: "93%", opacity: 0.38 },
    { type: "sparkle sparkle--dot", top: "85%", left: "12%", opacity: 0.55 },
    { type: "star--8", top: "90%", left: "82%", opacity: 0.42 },
    { type: "sparkle sparkle--flare", top: "48%", left: "96%", opacity: 0.35, rotate: 5 },
    { type: "sparkle sparkle--dot", top: "18%", left: "72%", opacity: 0.4 },
    { type: "star--4", top: "66%", left: "78%", opacity: 0.32 },
  ];

  items.forEach((item) => {
    const el = document.createElement("span");
    el.className = item.type.includes("sparkle") ? item.type : `star ${item.type}`;
    el.style.top = item.top;
    el.style.left = item.left;
    el.style.opacity = item.opacity;
    if (item.rotate) el.style.transform = `rotate(${item.rotate}deg)`;
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

initStars();
initNav();
initYear();
