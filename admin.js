const ADMIN_EMAILS = [
  "grace@graceahrens.com",
  "caleb@ahrenslabs.com",
];

function setMessage(element, text, type) {
  if (!element) return;
  element.hidden = !text;
  element.textContent = text;
  element.classList.remove("form-message--error", "form-message--success");
  if (type) element.classList.add(`form-message--${type}`);
}

function hideAllPanels() {
  ["login-panel", "setup-panel", "pending-panel", "compose-panel"].forEach((id) => {
    document.getElementById(id).hidden = true;
  });
}

function showPanel(id) {
  hideAllPanels();
  document.getElementById(id).hidden = false;
}

function fillEmailSelect(select, selectedEmail) {
  if (!select) return;
  select.innerHTML = ADMIN_EMAILS.map((email) => {
    const label = email === "grace@graceahrens.com" ? "Grace Ahrens" : "Caleb Ahrens";
    return `<option value="${email}">${label} (${email})</option>`;
  }).join("");
  if (selectedEmail && ADMIN_EMAILS.includes(selectedEmail)) {
    select.value = selectedEmail;
  }
}

function handleSetupQuery() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("setup");
  const email = params.get("email") || "grace@graceahrens.com";
  const loginMessage = document.getElementById("login-message");
  const loginEmail = document.getElementById("login-email");

  if (status === "confirmed") {
    fillEmailSelect(loginEmail, email);
    setMessage(loginMessage, `Password confirmed for ${email}. You can sign in now.`, "success");
    showPanel("login-panel");
  } else if (status === "invalid") {
    setMessage(loginMessage, "That confirmation link is invalid or expired. Create your password again.", "error");
    showPanel("setup-panel");
  }

  if (status) {
    window.history.replaceState({}, "", "admin.html");
  }
}

async function loadSession() {
  const response = await fetch("/api/admin/session");
  const data = await response.json().catch(() => ({}));

  if (data.authenticated) {
    const countEl = document.getElementById("subscriber-count");
    const userEl = document.getElementById("admin-user");
    userEl.textContent = `Signed in as ${data.email}`;

    if (typeof data.subscriberCount === "number") {
      countEl.textContent = `${data.subscriberCount} subscriber${data.subscriberCount === 1 ? "" : "s"} on the list`;
    } else {
      countEl.textContent = "Subscriber count unavailable";
    }
    showPanel("compose-panel");
    return;
  }

  const allowed = data.allowedAdmins || ADMIN_EMAILS;
  ADMIN_EMAILS.length = 0;
  ADMIN_EMAILS.push(...allowed);

  fillEmailSelect(document.getElementById("login-email"));
  fillEmailSelect(document.getElementById("setup-email"));

  showPanel("login-panel");
}

async function initAdmin() {
  const setupForm = document.getElementById("setup-form");
  const loginForm = document.getElementById("login-form");
  const composeForm = document.getElementById("compose-form");
  const setupMessage = document.getElementById("setup-message");
  const loginMessage = document.getElementById("login-message");
  const composeMessage = document.getElementById("compose-message");
  const logoutButton = document.getElementById("logout-button");
  const prepareSendButton = document.getElementById("prepare-send-button");
  const sendButton = document.getElementById("send-button");
  const sendConfirmWrap = document.getElementById("send-confirm-wrap");
  const sendConfirmInput = document.getElementById("send-confirm");

  fillEmailSelect(document.getElementById("login-email"));
  fillEmailSelect(document.getElementById("setup-email"));

  handleSetupQuery();
  if (!new URLSearchParams(window.location.search).get("setup")) {
    await loadSession();
  }

  document.getElementById("show-setup-button")?.addEventListener("click", () => {
    const loginEmail = document.getElementById("login-email").value;
    fillEmailSelect(document.getElementById("setup-email"), loginEmail);
    setMessage(setupMessage, "");
    showPanel("setup-panel");
  });

  document.getElementById("show-login-button")?.addEventListener("click", () => {
    const setupEmail = document.getElementById("setup-email").value;
    fillEmailSelect(document.getElementById("login-email"), setupEmail);
    setMessage(loginMessage, "");
    showPanel("login-panel");
  });

  document.getElementById("pending-login-button")?.addEventListener("click", () => {
    showPanel("login-panel");
  });

  setupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(setupMessage, "");

    const email = document.getElementById("setup-email").value;
    const password = document.getElementById("setup-password").value;
    const confirmPassword = document.getElementById("setup-confirm-password").value;
    const submitButton = setupForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(setupMessage, data.error || "Could not start setup.", "error");
        return;
      }

      document.getElementById("pending-message").innerHTML =
        `${data.message || `We sent a confirmation link to <strong>${email}</strong>.`} Then come back here to sign in.`;
      sessionStorage.setItem("adminPendingEmail", email);
      showPanel("pending-panel");
    } catch {
      setMessage(setupMessage, "Network error. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(loginMessage, "");

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("admin-password").value;
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(loginMessage, data.error || "Could not sign in.", "error");
        return;
      }

      loginForm.reset();
      fillEmailSelect(document.getElementById("login-email"), email);
      await loadSession();
    } catch {
      setMessage(loginMessage, "Network error. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton?.addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    sendConfirmWrap.hidden = true;
    sendButton.hidden = true;
    prepareSendButton.hidden = false;
    sendConfirmInput.value = "";
    composeForm.reset();
    await loadSession();
  });

  prepareSendButton?.addEventListener("click", () => {
    sendConfirmWrap.hidden = false;
    sendButton.hidden = false;
    prepareSendButton.hidden = true;
    sendConfirmInput.focus();
  });

  composeForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(composeMessage, "");

    const submitter = event.submitter;
    const mode = submitter?.dataset.mode === "send" ? "send" : "draft";
    const subject = document.getElementById("email-subject").value.trim();
    const body = document.getElementById("email-body").value.trim();
    const confirm = sendConfirmInput.value.trim();
    const buttons = composeForm.querySelectorAll("button");

    buttons.forEach((button) => {
      button.disabled = true;
    });

    try {
      const response = await fetch("/api/admin/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, mode, confirm }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(composeMessage, data.error || "Could not save or send.", "error");
        return;
      }

      let message = data.message || "Done.";
      if (data.previewUrl) {
        message += ` Preview: ${data.previewUrl}`;
      }
      setMessage(composeMessage, message, "success");

      if (mode === "send") {
        composeForm.reset();
        sendConfirmWrap.hidden = true;
        sendButton.hidden = true;
        prepareSendButton.hidden = false;
      }
    } catch {
      setMessage(composeMessage, "Network error. Please try again.", "error");
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  });
}

initAdmin();
