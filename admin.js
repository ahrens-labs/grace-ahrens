function setMessage(element, text, type) {
  if (!element) return;
  element.hidden = !text;
  element.textContent = text;
  element.classList.remove("form-message--error", "form-message--success");
  if (type) element.classList.add(`form-message--${type}`);
}

function hideAllPanels() {
  ["setup-panel", "pending-panel", "login-panel", "compose-panel"].forEach((id) => {
    document.getElementById(id).hidden = true;
  });
}

function showPanel(id) {
  hideAllPanels();
  document.getElementById(id).hidden = false;
}

function handleSetupQuery() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("setup");
  const loginMessage = document.getElementById("login-message");

  if (status === "confirmed") {
    setMessage(loginMessage, "Admin password confirmed. You can sign in now.", "success");
  } else if (status === "invalid") {
    setMessage(loginMessage, "That confirmation link is invalid or expired. Request a new one.", "error");
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
    if (typeof data.subscriberCount === "number") {
      countEl.textContent = `${data.subscriberCount} subscriber${data.subscriberCount === 1 ? "" : "s"} on the list`;
    } else {
      countEl.textContent = "Subscriber count unavailable";
    }
    showPanel("compose-panel");
    return;
  }

  if (data.needsSetup) {
    if (data.setupPending) {
      showPanel("pending-panel");
    } else {
      showPanel("setup-panel");
    }
    return;
  }

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

  handleSetupQuery();
  await loadSession();

  setupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(setupMessage, "");

    const password = document.getElementById("setup-password").value;
    const confirmPassword = document.getElementById("setup-confirm-password").value;
    const submitButton = setupForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(setupMessage, data.error || "Could not start setup.", "error");
        return;
      }

      if (data.message) {
        document.getElementById("pending-message").innerHTML =
          `${data.message} Then come back here to sign in.`;
      }
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

    const password = document.getElementById("admin-password").value;
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(loginMessage, data.error || "Could not sign in.", "error");
        return;
      }

      loginForm.reset();
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
