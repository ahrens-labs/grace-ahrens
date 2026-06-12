function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function between(rng, min, max) {
  return min + rng() * (max - min);
}

function initStars() {
  const container = document.querySelector(".page-stars");
  if (!container) return;

  const rng = createRng(20260612);
  const count = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 38 : 62;
  const types = [
    { kind: "dot", weight: 5 },
    { kind: "star-4", weight: 3 },
    { kind: "star-8", weight: 2 },
    { kind: "flare", weight: 2 },
  ];

  const weighted = [];
  types.forEach((entry) => {
    for (let i = 0; i < entry.weight; i += 1) weighted.push(entry.kind);
  });

  for (let i = 0; i < count; i += 1) {
    const kind = pick(rng, weighted);
    const el = document.createElement("span");
    el.setAttribute("aria-hidden", "true");

    const top = between(rng, 1.5, 98.5);
    const left = between(rng, 1.5, 98.5);
    const rotate = between(rng, -28, 28) + between(rng, 0, 4) * 90;
    const scale = between(rng, 0.45, 1.35);
    const opacity = between(rng, 0.25, 0.85);
    const twinkle = rng() > 0.62;
    const float = !twinkle && rng() > 0.78;

    el.style.top = `${top}%`;
    el.style.left = `${left}%`;
    el.style.opacity = opacity.toFixed(2);
    el.style.setProperty("--star-rotate", `${rotate.toFixed(1)}deg`);
    el.style.setProperty("--star-scale", scale.toFixed(2));
    el.style.transform = `rotate(var(--star-rotate)) scale(var(--star-scale))`;

    if (kind === "dot") {
      el.className = "sparkle sparkle--dot";
      const size = between(rng, 2, 4.5);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    } else if (kind === "flare") {
      el.className = "sparkle sparkle--flare";
      el.style.height = `${between(rng, 10, 22).toFixed(1)}px`;
      el.style.width = `${between(rng, 1.2, 2.4).toFixed(1)}px`;
    } else {
      el.className = `star star--${kind === "star-8" ? "8" : "4"}`;
      const width = between(rng, 4.5, kind === "star-8" ? 11 : 9);
      const height = width * between(rng, 2.4, 3.4);
      el.style.width = `${width.toFixed(1)}px`;
      el.style.height = `${height.toFixed(1)}px`;
    }

    if (twinkle) {
      el.classList.add("twinkle");
      el.style.animationDuration = `${between(rng, 3.2, 7.5).toFixed(1)}s`;
      el.style.animationDelay = `${between(rng, 0, 6).toFixed(1)}s`;
    }

    if (float) {
      el.classList.add("float");
      el.style.animationDuration = `${between(rng, 8, 16).toFixed(1)}s`;
      el.style.animationDelay = `${between(rng, 0, 5).toFixed(1)}s`;
    }

    container.appendChild(el);
  }
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

const turnstileWidgets = new WeakMap();
let turnstileRequired = false;

async function loadTurnstileConfig() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) return { siteKey: "", required: false };
    const data = await response.json();
    return {
      siteKey: data.turnstileSiteKey || "",
      required: Boolean(data.turnstileRequired),
    };
  } catch {
    return { siteKey: "", required: false };
  }
}

function renderTurnstileWidgets(siteKey) {
  if (!siteKey || !window.turnstile) return;

  document.querySelectorAll("[data-turnstile]").forEach((container) => {
    if (turnstileWidgets.has(container)) return;

    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      theme: "light",
    });
    turnstileWidgets.set(container, widgetId);
  });
}

function waitForTurnstile() {
  return new Promise((resolve) => {
    if (window.turnstile) {
      resolve(true);
      return;
    }

    const interval = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(interval);
        resolve(true);
      }
    }, 100);

    window.setTimeout(() => {
      window.clearInterval(interval);
      resolve(false);
    }, 10000);
  });
}

function setFormMessage(form, text, type) {
  const message = form.querySelector(".form-message");
  if (!message) return;

  message.hidden = !text;
  message.textContent = text;
  message.classList.remove("form-message--error", "form-message--success");
  if (type) message.classList.add(`form-message--${type}`);
}

function initSignupForms() {
  document.querySelectorAll(".signup-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFormMessage(form, "");

      const submitButton = form.querySelector('button[type="submit"]');
      const nameInput = form.querySelector('input[name="name"]');
      const emailInput = form.querySelector('input[name="email"]');
      const companyInput = form.querySelector('input[name="company"]');
      const turnstileContainer = form.querySelector("[data-turnstile]");
      const widgetId = turnstileContainer ? turnstileWidgets.get(turnstileContainer) : null;

      const name = nameInput?.value.trim() || "";
      const email = emailInput?.value.trim() || "";
      const company = companyInput?.value.trim() || "";
      const turnstileToken = widgetId != null ? window.turnstile.getResponse(widgetId) : "";

      if (!name) {
        setFormMessage(form, "Please enter your name.", "error");
        nameInput?.focus();
        return;
      }

      if (!email) {
        setFormMessage(form, "Please enter your email address.", "error");
        emailInput?.focus();
        return;
      }

      if (turnstileRequired && !turnstileToken) {
        setFormMessage(form, "Please complete the security check below.", "error");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Signing up…";

      try {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, company, turnstileToken }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setFormMessage(form, data.error || "Something went wrong. Please try again.", "error");
          if (widgetId != null) window.turnstile.reset(widgetId);
          return;
        }

        setFormMessage(form, data.message || "You are on the list. Thank you!", "success");
        form.reset();
        if (widgetId != null) window.turnstile.reset(widgetId);
      } catch {
        setFormMessage(form, "Network error. Please try again.", "error");
        if (widgetId != null) window.turnstile.reset(widgetId);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Sign up";
      }
    });
  });
}

async function initNewsletter() {
  initSignupForms();

  const config = await loadTurnstileConfig();
  turnstileRequired = config.required;

  if (!config.siteKey) {
    document.querySelectorAll(".turnstile-wrap").forEach((element) => {
      element.hidden = true;
    });
    return;
  }

  const loaded = await waitForTurnstile();
  if (!loaded) {
    document.querySelectorAll(".signup-form").forEach((form) => {
      setFormMessage(
        form,
        "Security check failed to load. Please refresh the page and try again.",
        "error"
      );
    });
    return;
  }

  renderTurnstileWidgets(config.siteKey);
}

initStars();
initNav();
initYear();
initNewsletter();
