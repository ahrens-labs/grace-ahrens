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

function formatSubscriberDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderSubscriberList(subscribers) {
  const body = document.getElementById("subscriber-list-body");
  const summary = document.getElementById("subscriber-list-summary");
  if (!body || !summary) return;

  const list = Array.isArray(subscribers) ? subscribers : [];

  summary.textContent = list.length
    ? `${list.length} subscriber${list.length === 1 ? "" : "s"}`
    : "No subscribers yet.";

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="4" class="admin-subscribers__empty">No subscribers yet.</td></tr>`;
    return;
  }

  body.innerHTML = list
    .map((entry) => {
      const joined = entry.confirmedAt ? formatSubscriberDate(entry.confirmedAt) : "—";
      const emailAttr = escapeHtml(entry.email);

      return `<tr>
        <td>${escapeHtml(entry.name || "—")}</td>
        <td><a href="mailto:${emailAttr}">${emailAttr}</a></td>
        <td>${escapeHtml(joined)}</td>
        <td class="admin-subscribers__actions">
          <button
            type="button"
            class="btn btn-danger btn-small delete-subscriber-button"
            data-email="${emailAttr}"
            data-name="${escapeHtml(entry.name || "")}"
          >Remove</button>
        </td>
      </tr>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let deleteSubscriberTarget = null;

function openDeleteSubscriberModal(email, name) {
  const modal = document.getElementById("delete-subscriber-modal");
  const nameEl = document.getElementById("delete-subscriber-name");
  const emailEl = document.getElementById("delete-subscriber-email");
  const confirmInput = document.getElementById("delete-subscriber-confirm");
  const messageEl = document.getElementById("delete-subscriber-message");

  if (!modal || !email) return;

  deleteSubscriberTarget = { email, name: name || "" };
  nameEl.textContent = name || "—";
  emailEl.textContent = email;
  confirmInput.value = "";
  setMessage(messageEl, "");
  modal.hidden = false;
  document.body.classList.add("admin-modal-open");
  confirmInput.focus();
}

function closeDeleteSubscriberModal() {
  const modal = document.getElementById("delete-subscriber-modal");
  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("admin-modal-open");
  deleteSubscriberTarget = null;
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

    if (data.draft) {
      const subjectInput = document.getElementById("email-subject");
      const bodyInput = document.getElementById("email-body");
      if (subjectInput && !subjectInput.value) subjectInput.value = data.draft.subject || "";
      if (bodyInput && !bodyInput.value) bodyInput.value = data.draft.body || "";
    }

    renderSubscriberList(data.subscribers);

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

function wrapTextareaSelection(textarea, before, after) {
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const inner = selected || "text";
  const replacement = before + inner + after;

  textarea.value = value.slice(0, start) + replacement + value.slice(end);
  textarea.focus();
  textarea.setSelectionRange(start + before.length, start + before.length + inner.length);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function initComposeFormatting() {
  const bodyInput = document.getElementById("email-body");
  const boldButton = document.getElementById("format-bold");
  const italicButton = document.getElementById("format-italic");

  boldButton?.addEventListener("click", () => {
    wrapTextareaSelection(bodyInput, "**", "**");
  });

  italicButton?.addEventListener("click", () => {
    wrapTextareaSelection(bodyInput, "*", "*");
  });

  bodyInput?.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;

    if (event.key === "b" || event.key === "B") {
      event.preventDefault();
      wrapTextareaSelection(bodyInput, "**", "**");
    } else if (event.key === "i" || event.key === "I") {
      event.preventDefault();
      wrapTextareaSelection(bodyInput, "*", "*");
    }
  });
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
  const previewButton = document.getElementById("preview-button");
  const sendButton = document.getElementById("send-button");
  const sendConfirmWrap = document.getElementById("send-confirm-wrap");
  const sendConfirmInput = document.getElementById("send-confirm");
  const deleteSubscriberForm = document.getElementById("delete-subscriber-form");
  const deleteSubscriberMessage = document.getElementById("delete-subscriber-message");
  const deleteSubscriberModal = document.getElementById("delete-subscriber-modal");

  fillEmailSelect(document.getElementById("login-email"));
  fillEmailSelect(document.getElementById("setup-email"));
  initComposeFormatting();

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

      setupForm.reset();
      fillEmailSelect(document.getElementById("login-email"), email);
      setMessage(
        loginMessage,
        data.message || `Password saved for ${email}. You can sign in now.`,
        "success"
      );
      showPanel("login-panel");
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

  previewButton?.addEventListener("click", async () => {
    setMessage(composeMessage, "");

    const subject = document.getElementById("email-subject").value.trim();
    const body = document.getElementById("email-body").value.trim();

    if (!subject) {
      setMessage(composeMessage, "Please enter a subject line.", "error");
      document.getElementById("email-subject").focus();
      return;
    }

    if (!body) {
      setMessage(composeMessage, "Please enter a message.", "error");
      document.getElementById("email-body").focus();
      return;
    }

    const buttons = composeForm.querySelectorAll("button");
    buttons.forEach((button) => {
      button.disabled = true;
    });

    try {
      const response = await fetch("/api/admin/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, mode: "preview" }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(composeMessage, data.error || "Could not send preview.", "error");
        return;
      }

      setMessage(composeMessage, data.message || "Preview sent.", "success");
    } catch {
      setMessage(composeMessage, "Network error. Please try again.", "error");
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  });

  document.getElementById("subscriber-list-body")?.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-subscriber-button");
    if (!button) return;
    openDeleteSubscriberModal(button.dataset.email, button.dataset.name);
  });

  deleteSubscriberModal?.querySelectorAll("[data-close-delete-modal]").forEach((element) => {
    element.addEventListener("click", closeDeleteSubscriberModal);
  });

  deleteSubscriberModal?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDeleteSubscriberModal();
  });

  deleteSubscriberForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(deleteSubscriberMessage, "");

    if (!deleteSubscriberTarget?.email) {
      setMessage(deleteSubscriberMessage, "No subscriber selected.", "error");
      return;
    }

    const confirm = document.getElementById("delete-subscriber-confirm").value.trim();
    const submitButton = document.getElementById("delete-subscriber-submit");
    submitButton.disabled = true;

    try {
      const response = await fetch("/api/admin/delete-subscriber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: deleteSubscriberTarget.email,
          confirm,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(deleteSubscriberMessage, data.error || "Could not remove subscriber.", "error");
        return;
      }

      closeDeleteSubscriberModal();
      setMessage(composeMessage, data.message || "Subscriber removed.", "success");
      await loadSession();
    } catch {
      setMessage(deleteSubscriberMessage, "Network error. Please try again.", "error");
    } finally {
      submitButton.disabled = false;
    }
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

      setMessage(composeMessage, data.message || "Done.", "success");

      if (mode === "send") {
        composeForm.reset();
        sendConfirmWrap.hidden = true;
        sendButton.hidden = true;
        prepareSendButton.hidden = false;
      }

      await loadSession();
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
