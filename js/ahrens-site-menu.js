// Ahrens Labs site drawer on graceahrens.com — same nav as ahrenslabs.com app pages.
(function () {
  if (typeof window === "undefined") return;

  const AHRENS_ORIGIN = "https://ahrenslabs.com";

  const NAV_MENU = [
    { id: "home", label: "Home", href: "index.html" },
    {
      id: "chessEngine",
      label: "Chess Engine",
      href: "chess_engine.html",
      children: [
        { id: "play", label: "Play", href: "chess_engine.html" },
        { id: "trifangxDetails", label: "TrifangX details", href: "trifangx.html" },
        { id: "seasonTrack", label: "Season track", href: "chess-season-track.html" },
        { id: "leaderboard", label: "Leaderboard", href: "chess-leaderboard.html" },
        { id: "gameHistory", label: "Game history", href: "chess_engine/game_history/" },
        { id: "achievements", label: "Achievements", href: "achievements.html" },
        { id: "chessShop", label: "Chess shop", href: "chess-shop.html" },
      ],
    },
    {
      id: "labs",
      label: "Labs",
      href: "labs.html",
      children: [
        { id: "labsOverview", label: "All labs", href: "labs.html" },
        { id: "codingLab", label: "Coding Lab", href: "coding-lab.html" },
        { id: "roboticsLab", label: "Robotics Lab", href: "robotics-lab.html" },
        { id: "musicLab", label: "Music Lab", href: "music-lab.html" },
        { id: "languageLab", label: "Language Lab", href: "language-lab.html" },
        { id: "writingLab", label: "Writing Lab", href: "writing-lab.html" },
      ],
    },
    {
      id: "projects",
      label: "Projects",
      href: "coding-lab.html",
      children: [
        { id: "dungeonGame", label: "Dungeon Game", href: "dungeon_game.html" },
        { id: "classify", label: "Classify Planner", href: "classify.html" },
        { id: "tether", label: "Tether", href: "tether.html" },
        { id: "link", label: "Link", href: "/link/dashboard" },
        { id: "digest", label: "Digest", href: "digest.html" },
        { id: "kyrachyng", label: "Kyrachyng", href: "kyrachyng.html" },
        { id: "spud", label: "Spud", href: "spud.html" },
        { id: "lotr", label: "LOTR", href: "lotr.html" },
      ],
    },
    { id: "account", label: "Account", href: "account-dashboard.html" },
    { id: "contact", label: "Contact", href: "contact.html" },
  ];

  function escHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function resolveNavHref(href) {
    const raw = String(href || "").trim();
    if (!raw) return AHRENS_ORIGIN + "/";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/")) return AHRENS_ORIGIN + raw;
    return AHRENS_ORIGIN + "/" + raw.replace(/^\.\//, "");
  }

  function renderNavEntry(ul, entry) {
    const li = document.createElement("li");
    const children = entry.children && entry.children.length ? entry.children : [];

    if (children.length) {
      li.className = "nav-dropdown";

      const trigger = document.createElement("a");
      trigger.href = resolveNavHref(entry.href);
      trigger.className = "nav-dropdown-trigger";
      trigger.textContent = entry.label;
      li.appendChild(trigger);

      const menu = document.createElement("ul");
      menu.className = "nav-dropdown-menu";
      for (const child of children) {
        const childLi = document.createElement("li");
        const childA = document.createElement("a");
        childA.href = resolveNavHref(child.href);
        childA.textContent = child.label;
        childLi.appendChild(childA);
        menu.appendChild(childLi);
      }
      li.appendChild(menu);
    } else {
      const link = document.createElement("a");
      link.href = resolveNavHref(entry.href);
      link.textContent = entry.label;
      li.appendChild(link);
    }

    ul.appendChild(li);
  }

  function renderSiteMenuNav() {
    const ul = document.querySelector("#th-site-menu nav ul");
    if (!ul) return;
    ul.innerHTML = "";
    for (const entry of NAV_MENU) {
      renderNavEntry(ul, entry);
    }
  }

  function portalSiteMenuToBody() {
    const backdrop = document.getElementById("th-site-menu-backdrop");
    const menu = document.getElementById("th-site-menu");
    if (backdrop && backdrop.parentElement !== document.body) {
      document.body.appendChild(backdrop);
    }
    if (menu && menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }
  }

  function wireSiteMenu() {
    const btn = document.getElementById("th-site-menu-btn");
    const menu = document.getElementById("th-site-menu");
    const backdrop = document.getElementById("th-site-menu-backdrop");
    const closeBtn = document.getElementById("th-site-menu-close");
    if (!btn || !menu || btn.dataset.siteMenuWired === "1") return;
    btn.dataset.siteMenuWired = "1";

    function closeMenu() {
      menu.classList.remove("open");
      menu.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      if (backdrop) backdrop.hidden = true;
      document.body.classList.remove("th-site-menu-open");
    }

    function openMenu() {
      menu.classList.add("open");
      menu.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      if (backdrop) backdrop.hidden = false;
      document.body.classList.add("th-site-menu-open");
    }

    btn.addEventListener("click", () => {
      if (menu.classList.contains("open")) closeMenu();
      else openMenu();
    });

    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    if (backdrop) backdrop.addEventListener("click", closeMenu);

    menu.querySelectorAll("nav a, .al-site-menu-signout").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) closeMenu();
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    portalSiteMenuToBody();
    renderSiteMenuNav();
    wireSiteMenu();
  });
})();
