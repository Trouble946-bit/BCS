const menuToggle = document.getElementById("menuToggle");
const primaryNav = document.getElementById("primaryNav");
const revealItems = document.querySelectorAll(".reveal");
const yearNode = document.getElementById("year");
const leadForms = document.querySelectorAll(".lead-form");
const ticketForm = document.getElementById("ticketForm");
const ticketFeedback = document.getElementById("ticketFeedback");
const ticketList = document.getElementById("ticketList");
const ticketEmpty = document.getElementById("ticketEmpty");
const clearTicketsButton = document.getElementById("clearTickets");
const trackTicketForm = document.getElementById("trackTicketForm");
const ticketReferenceInput = document.getElementById("ticketReferenceInput");
const ticketTrackerFeedback = document.getElementById("ticketTrackerFeedback");
const TICKET_STORAGE_KEY = "bcs_support_tickets";

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    primaryNav.classList.toggle("is-open");
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      primaryNav.classList.remove("is-open");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  }
);

revealItems.forEach((item) => observer.observe(item));

leadForms.forEach((form) => {
  const feedback = form.querySelector(".form-feedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      if (feedback) {
        feedback.textContent = "Please complete all required fields before submitting.";
      }
      return;
    }

    if (feedback) {
      feedback.textContent = "Thank you. Your inquiry has been captured and the BCS team will contact you shortly.";
    }

    form.reset();
  });
});

const loadTickets = () => {
  try {
    const saved = window.localStorage.getItem(TICKET_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveTickets = (tickets) => {
  window.localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(tickets));
};

const normalizeReference = (value) => String(value || "").trim().toUpperCase();

const getTicketReference = (ticket) => normalizeReference(ticket.reference || ticket.id);

const generateTicketReference = (tickets) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const datePart = `${year}${month}${day}`;
  const prefix = `BCS-${datePart}-`;

  const sequenceForToday = tickets.filter((ticket) => getTicketReference(ticket).startsWith(prefix)).length + 1;
  const serial = String(sequenceForToday).padStart(4, "0");

  return `${prefix}${serial}`;
};

const createTicketMarkup = (ticket, isTracked) => {
  const item = document.createElement("article");
  item.className = isTracked ? "ticket-item ticket-item-tracked" : "ticket-item";
  item.dataset.ticketId = getTicketReference(ticket);

  const title = document.createElement("h4");
  title.textContent = `${ticket.category} Issue`;

  const description = document.createElement("p");
  description.textContent = ticket.issue;

  const meta = document.createElement("div");
  meta.className = "ticket-meta";

  const status = document.createElement("span");
  status.className = ticket.status === "Resolved" ? "is-resolved" : "is-open";
  status.textContent = ticket.status;

  const reference = document.createElement("span");
  reference.textContent = `Ref: ${getTicketReference(ticket)}`;

  const priority = document.createElement("span");
  priority.className = `priority-${ticket.priority.toLowerCase()}`;
  priority.textContent = `${ticket.priority} Priority`;

  const requester = document.createElement("span");
  requester.textContent = ticket.requester;

  const created = document.createElement("span");
  created.textContent = new Date(ticket.createdAt).toLocaleString();

  meta.append(status, reference, priority, requester, created);

  const actions = document.createElement("div");
  actions.className = "ticket-actions";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle-status";
  toggleButton.textContent = ticket.status === "Resolved" ? "Reopen" : "Mark Resolved";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.dataset.action = "delete-ticket";
  removeButton.textContent = "Delete";

  actions.append(toggleButton, removeButton);
  item.append(title, description, meta, actions);

  return item;
};

const renderTickets = (tickets, trackedReference = "") => {
  if (!ticketList || !ticketEmpty) {
    return;
  }

  ticketList.innerHTML = "";

  if (!tickets.length) {
    ticketEmpty.hidden = false;
    return;
  }

  ticketEmpty.hidden = true;
  tickets.forEach((ticket) => {
    const isTracked = trackedReference !== "" && getTicketReference(ticket) === trackedReference;
    ticketList.append(createTicketMarkup(ticket, isTracked));
  });
};

if (ticketForm && ticketList && ticketEmpty && clearTicketsButton) {
  let tickets = loadTickets();
  renderTickets(tickets);

  ticketForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!ticketForm.checkValidity()) {
      ticketForm.reportValidity();
      if (ticketFeedback) {
        ticketFeedback.textContent = "Please complete all required contact fields.";
      }
      return;
    }

    const formData = new FormData(ticketForm);
    const reference = generateTicketReference(tickets);

    const ticket = {
      id: reference,
      reference,
      requester: String(formData.get("requester") || "").trim(),
      organization: String(formData.get("organization") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      priority: String(formData.get("priority") || ""),
      category: String(formData.get("category") || ""),
      issue: String(formData.get("issue") || "").trim(),
      status: "Open",
      createdAt: new Date().toISOString(),
    };

    tickets = [ticket, ...tickets];
    saveTickets(tickets);
    renderTickets(tickets);
    ticketForm.reset();

    if (ticketFeedback) {
      ticketFeedback.textContent = `Issue submitted successfully. Your reference number is ${reference}.`;
    }

    if (ticketReferenceInput) {
      ticketReferenceInput.value = reference;
    }
  });

  ticketList.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const ticketItem = target.closest(".ticket-item");

    if (!ticketItem) {
      return;
    }

    const ticketId = normalizeReference(ticketItem.dataset.ticketId);

    if (!ticketId) {
      return;
    }

    if (target.dataset.action === "toggle-status") {
      tickets = tickets.map((ticket) => {
        if (getTicketReference(ticket) !== ticketId) {
          return ticket;
        }

        return {
          ...ticket,
          status: ticket.status === "Resolved" ? "Open" : "Resolved",
        };
      });
    }

    if (target.dataset.action === "delete-ticket") {
      tickets = tickets.filter((ticket) => getTicketReference(ticket) !== ticketId);
    }

    saveTickets(tickets);
    renderTickets(tickets);
  });

  if (trackTicketForm) {
    trackTicketForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const queryReference = normalizeReference(ticketReferenceInput ? ticketReferenceInput.value : "");

      if (!queryReference) {
        if (ticketTrackerFeedback) {
          ticketTrackerFeedback.textContent = "Enter a reference number to track your query.";
        }
        renderTickets(tickets);
        return;
      }

      const foundTicket = tickets.find((ticket) => getTicketReference(ticket) === queryReference);

      if (!foundTicket) {
        if (ticketTrackerFeedback) {
          ticketTrackerFeedback.textContent = `No issue found for reference ${queryReference}.`;
        }
        renderTickets(tickets);
        return;
      }

      renderTickets(tickets, queryReference);

      if (ticketTrackerFeedback) {
        ticketTrackerFeedback.textContent = `Reference ${queryReference} found. Status: ${foundTicket.status}.`;
      }

      const matchedCard = Array.from(ticketList.children).find(
        (element) => element instanceof HTMLElement && normalizeReference(element.dataset.ticketId) === queryReference
      );

      if (matchedCard instanceof HTMLElement) {
        matchedCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  clearTicketsButton.addEventListener("click", () => {
    tickets = [];
    saveTickets(tickets);
    renderTickets(tickets);

    if (ticketFeedback) {
      ticketFeedback.textContent = "All issue reports have been cleared.";
    }
  });
}

// Floating FAB and modal handling (Create Ticket)
const createTicketFab = document.getElementById("createTicketFab");
const ticketModal = document.getElementById("ticketModal");
const ticketModalClose = document.getElementById("ticketModalClose");
const ticketModalForm = document.getElementById("ticketModalForm");
const ticketModalFeedback = document.getElementById("ticketModalFeedback");
const ticketSubmittedSection = document.getElementById("ticketSubmittedSection");
const ticketModalRefDisplay = document.getElementById("ticketModalRefDisplay");
const copyTicketRefBtn = document.getElementById("copyTicketRefBtn");
const ticketModalDoneBtn = document.getElementById("ticketModalDoneBtn");
const ticketModalCopyFeedback = document.getElementById("ticketModalCopyFeedback");
let ticketReenableTimer = null;

let _lastFocusedEl = null;

const getFocusableElements = (container) => {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null);
};

const handleModalKeyDown = (e) => {
  if (!ticketModal || ticketModal.hidden) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeTicketModal();
    return;
  }

  if (e.key === "Tab") {
    const focusable = getFocusableElements(ticketModal);
    if (!focusable.length) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || document.activeElement === ticketModal) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
};

const openTicketModal = () => {
  if (!ticketModal) return;
  _lastFocusedEl = document.activeElement;
  ticketModal.hidden = false;
  ticketModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleModalKeyDown);
  const focusable = getFocusableElements(ticketModal);
  if (focusable.length) focusable[0].focus();
};

const closeTicketModal = () => {
  if (!ticketModal) return;
  if (ticketReenableTimer) {
    clearTimeout(ticketReenableTimer);
    ticketReenableTimer = null;
  }
  ticketModal.hidden = true;
  ticketModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleModalKeyDown);
  // reset and re-enable form
  if (ticketModalForm) {
    // enable any disabled inputs/buttons
    ticketModalForm.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = false));
    ticketModalForm.reset();
  }
  if (ticketModalFeedback) ticketModalFeedback.textContent = "";
  if (ticketSubmittedSection) ticketSubmittedSection.hidden = true;
  if (ticketModalRefDisplay) ticketModalRefDisplay.textContent = "-";
  if (ticketModalCopyFeedback) ticketModalCopyFeedback.textContent = "";
  try {
    if (_lastFocusedEl && typeof _lastFocusedEl.focus === "function") _lastFocusedEl.focus();
  } catch (err) {
    /* ignore */
  }
};

if (createTicketFab) {
  createTicketFab.addEventListener("click", openTicketModal);
}

if (ticketModalClose) {
  ticketModalClose.addEventListener("click", closeTicketModal);
}

if (ticketModal) {
  ticketModal.addEventListener("click", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.action === "close") {
      closeTicketModal();
    }
  });
}

if (ticketModalForm) {
  ticketModalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!ticketModalForm.checkValidity()) {
      ticketModalForm.reportValidity();
      if (ticketModalFeedback) ticketModalFeedback.textContent = "Please complete all required fields.";
      return;
    }

    // Reuse existing ticket storage logic
    const tickets = loadTickets();
    const formData = new FormData(ticketModalForm);
    const reference = generateTicketReference(tickets);

    const ticket = {
      id: reference,
      reference,
      requester: String(formData.get("requester") || "").trim(),
      organization: String(formData.get("organization") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      priority: String(formData.get("priority") || ""),
      category: String(formData.get("category") || ""),
      issue: String(formData.get("issue") || "").trim(),
      status: "Open",
      createdAt: new Date().toISOString(),
    };

    const all = [ticket, ...tickets];
    saveTickets(all);
    // Show submitted section with reference and keep modal open so client can copy
    if (ticketModalFeedback) ticketModalFeedback.textContent = "";
    if (ticketModalRefDisplay) ticketModalRefDisplay.textContent = reference;
    if (ticketSubmittedSection) ticketSubmittedSection.hidden = false;

    // disable form inputs to prevent duplicate submissions while keeping reference visible
    if (ticketModalForm) {
      ticketModalForm.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = true));
    }

    // Update any visible ticket board (if present)
    if (typeof renderTickets === "function") renderTickets(all);

    // wire copy and done buttons (assign to avoid duplicate listeners)
    if (copyTicketRefBtn) {
      copyTicketRefBtn.onclick = async () => {
        try {
          if (navigator.clipboard && reference) {
            await navigator.clipboard.writeText(reference);
            if (ticketModalCopyFeedback) ticketModalCopyFeedback.textContent = "Reference copied to clipboard.";
            copyTicketRefBtn.textContent = "Copied";
            setTimeout(() => (copyTicketRefBtn.textContent = "Copy"), 1500);
          } else {
            // fallback: select the code element and prompt
            if (ticketModalRefDisplay) {
              const range = document.createRange();
              range.selectNodeContents(ticketModalRefDisplay);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
        } catch (err) {
          if (ticketModalCopyFeedback) ticketModalCopyFeedback.textContent = "Unable to copy automatically. Select and copy manually.";
        }
      };
    }

    if (ticketModalDoneBtn) ticketModalDoneBtn.onclick = () => closeTicketModal();

    // after a short delay, re-enable the form so user can submit another ticket without closing modal
    if (ticketReenableTimer) {
      clearTimeout(ticketReenableTimer);
      ticketReenableTimer = null;
    }
    ticketReenableTimer = setTimeout(() => {
      try {
        if (ticketModalForm) {
          ticketModalForm.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = false));
          ticketModalForm.reset();
          const first = ticketModalForm.querySelector("input, select, textarea");
          if (first && typeof first.focus === "function") first.focus();
        }
        if (ticketSubmittedSection) ticketSubmittedSection.hidden = true;
        if (ticketModalRefDisplay) ticketModalRefDisplay.textContent = "-";
        if (ticketModalCopyFeedback) ticketModalCopyFeedback.textContent = "";
      } catch (err) {
        /* ignore */
      }
      ticketReenableTimer = null;
    }, 5000);
  });
}

// Ticket search / track modal (find by reference, view details, add updates)
const trackTicketFab = document.getElementById("trackTicketFab");
const ticketSearchModal = document.getElementById("ticketSearchModal");
const ticketSearchForm = document.getElementById("ticketSearchForm");
const ticketSearchInput = document.getElementById("ticketSearchInput");
const ticketSearchClear = document.getElementById("ticketSearchClear");
const ticketSearchResult = document.getElementById("ticketSearchResult");
const resultRef = document.getElementById("resultRef");
const resultStatus = document.getElementById("resultStatus");
const resultRequester = document.getElementById("resultRequester");
const resultCategory = document.getElementById("resultCategory");
const resultPriority = document.getElementById("resultPriority");
const resultCreated = document.getElementById("resultCreated");
const resultIssueText = document.getElementById("resultIssueText");
const resultUpdatesList = document.getElementById("resultUpdatesList");
const addUpdateSection = document.getElementById("addUpdateSection");
const addUpdateForm = document.getElementById("addUpdateForm");
const addUpdateText = document.getElementById("addUpdateText");
const closeSearchResult = document.getElementById("closeSearchResult");
const toggleStatusBtn = document.getElementById("toggleStatusBtn");

let _lastFocusedSearchEl = null;

const openTicketSearchModal = () => {
  if (!ticketSearchModal) return;
  _lastFocusedSearchEl = document.activeElement;
  ticketSearchModal.hidden = false;
  ticketSearchModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const first = ticketSearchModal.querySelector("input, button, textarea, select");
  if (first) first.focus();
};

const closeTicketSearchModal = () => {
  if (!ticketSearchModal) return;
  ticketSearchModal.hidden = true;
  ticketSearchModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (_lastFocusedSearchEl && typeof _lastFocusedSearchEl.focus === "function") _lastFocusedSearchEl.focus();
  // reset UI
  if (ticketSearchForm) ticketSearchForm.reset();
  if (ticketSearchResult) ticketSearchResult.hidden = true;
  if (addUpdateSection) addUpdateSection.hidden = true;
  if (resultUpdatesList) resultUpdatesList.innerHTML = "";
};

const renderTicketDetails = (ticket) => {
  if (!ticket) return;
  if (resultRef) resultRef.textContent = getTicketReference(ticket);
  if (resultStatus) resultStatus.textContent = ticket.status;
  if (resultRequester) resultRequester.textContent = ticket.requester || "-";
  if (resultCategory) resultCategory.textContent = ticket.category || "-";
  if (resultPriority) resultPriority.textContent = ticket.priority || "-";
  if (resultCreated) resultCreated.textContent = new Date(ticket.createdAt).toLocaleString();
  if (resultIssueText) resultIssueText.textContent = ticket.issue || "-";

  // render updates
  if (resultUpdatesList) {
    resultUpdatesList.innerHTML = "";
    const updates = Array.isArray(ticket.updates) ? ticket.updates : [];
    if (!updates.length) {
      resultUpdatesList.innerHTML = "<li>No updates yet</li>";
    } else {
      updates.forEach((u) => {
        const li = document.createElement("li");
        li.textContent = `${new Date(u.createdAt).toLocaleString()}: ${u.text}`;
        resultUpdatesList.append(li);
      });
    }
  }

  if (addUpdateSection) addUpdateSection.hidden = ticket.status === "Resolved";
  if (ticketSearchResult) ticketSearchResult.hidden = false;
};

const findTicketByRef = (ref) => {
  const tickets = loadTickets();
  const q = normalizeReference(ref);
  return tickets.find((t) => getTicketReference(t) === q);
};

if (trackTicketFab) trackTicketFab.addEventListener("click", openTicketSearchModal);

if (ticketSearchModal) {
  ticketSearchModal.addEventListener("click", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.action === "close") {
      closeTicketSearchModal();
    }
    if (e.target && e.target.classList && e.target.classList.contains("ticket-modal-close")) {
      closeTicketSearchModal();
    }
  });
}

if (ticketSearchForm) {
  ticketSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const ref = ticketSearchInput ? ticketSearchInput.value : "";
    if (!ref) return;
    const found = findTicketByRef(ref);
    if (!found) {
      if (ticketSearchResult) {
        ticketSearchResult.hidden = false;
        if (resultRef) resultRef.textContent = "Not found";
        if (resultIssueText) resultIssueText.textContent = `No ticket found for ${ref}`;
        if (resultStatus) resultStatus.textContent = "-";
      }
      return;
    }
    renderTicketDetails(found);
  });
}

// Inline track form (above Contact) should open the same search result modal
if (trackTicketForm) {
  trackTicketForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const ref = ticketReferenceInput ? String(ticketReferenceInput.value || "").trim() : "";
    if (!ref) {
      if (ticketTrackerFeedback) ticketTrackerFeedback.textContent = "Enter a reference number to track your query.";
      return;
    }
    const found = findTicketByRef(ref);
    if (!found) {
      if (ticketTrackerFeedback) ticketTrackerFeedback.textContent = `No issue found for reference ${ref}.`;
      return;
    }
    // populate the modal search input and open the modal with details
    if (ticketSearchInput) ticketSearchInput.value = normalizeReference(ref);
    renderTicketDetails(found);
    openTicketSearchModal();
    if (ticketTrackerFeedback) ticketTrackerFeedback.textContent = `Reference ${normalizeReference(ref)} found.`;
  });
}

const ticketReferenceClearBtn = document.getElementById("ticketReferenceClear");
if (ticketReferenceClearBtn) {
  ticketReferenceClearBtn.addEventListener("click", () => {
    if (ticketReferenceInput) ticketReferenceInput.value = "";
    if (ticketTrackerFeedback) ticketTrackerFeedback.textContent = "";
  });
}

if (ticketSearchClear) {
  ticketSearchClear.addEventListener("click", () => {
    if (ticketSearchForm) ticketSearchForm.reset();
    if (ticketSearchResult) ticketSearchResult.hidden = true;
  });
}

if (addUpdateForm) {
  addUpdateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const ref = ticketSearchInput ? ticketSearchInput.value : "";
    if (!ref) return;
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => getTicketReference(t) === normalizeReference(ref));
    if (idx === -1) return;
    const text = addUpdateText ? String(addUpdateText.value || "").trim() : "";
    if (!text) return;
    const update = { text, createdAt: new Date().toISOString() };
    tickets[idx].updates = Array.isArray(tickets[idx].updates) ? tickets[idx].updates : [];
    tickets[idx].updates.push(update);
    saveTickets(tickets);
    renderTicketDetails(tickets[idx]);
    if (typeof renderTickets === "function") renderTickets(tickets);
    addUpdateForm.reset();
  });
}

if (toggleStatusBtn) {
  toggleStatusBtn.addEventListener("click", () => {
    const ref = ticketSearchInput ? ticketSearchInput.value : "";
    if (!ref) return;
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => getTicketReference(t) === normalizeReference(ref));
    if (idx === -1) return;
    tickets[idx].status = tickets[idx].status === "Resolved" ? "Open" : "Resolved";
    saveTickets(tickets);
    renderTicketDetails(tickets[idx]);
    if (typeof renderTickets === "function") renderTickets(tickets);
  });
}
