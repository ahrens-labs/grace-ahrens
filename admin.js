function setMessage(element, text, type) {
  if (!element) return;
  element.hidden = !text;
  element.textContent = text;
  element.classList.remove("form-message--error", "form-message--success");
  if (type) element.classList.add(`form-message--${type}`);
}

function showPanel(loginVisible, composeVisible) {
  document.getElementById("login-panel").hidden = !loginVisible;
  document.getElementById("compose-panel").hidden = !composeVisible;
}

async function loadSession() {
  const response = await fetch("/api/admin/session");
  if (!response.ok) {
    showPanel(true, false);
    return;
  }

  const data = await response.json();
  if (!data.authenticated) {
    showPanel(true, false);
    return;
  }

  const countEl = document.getElementById("subscriber-count");
  if (typeof data.subscriberCount === "number") {
    countEl.textContent = `${data.subscriberCount} subscriber${data.subscriberCount === 1 ? "" : "s"} on the list`;
  } else {
    countEl.textContent = "Subscriber count unavailable";
  }

  showPanel(false, true);
}

async function initAdmin() {
  const loginForm = document.getElementById("login-form");
  const composeForm = document.getElementById("compose-form");
  const loginMessage = document.getElementById("login-message");
  const composeMessage = document.getElementById("compose-message");
  const logoutButton = document.getElementById("logout-button");
  const prepareSendButton = document.getElementById("prepare-send-button");
  const sendButton = document.getElementById("send-button");
  const sendConfirmWrap = document.getElementById("send-confirm-wrap");
  const sendConfirmInput = document.getElementById("send-confirm");

  if (!loginForm) return;

  await loadSession();

  loginForm.addEventListener("submit", async (event) => {
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
    showPanel(true, false);
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
