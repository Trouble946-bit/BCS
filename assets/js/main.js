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

const openTicketModal = () => {
  if (!ticketModal) return;
  ticketModal.hidden = false;
  ticketModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const firstInput = ticketModal.querySelector("input, textarea, select");
  if (firstInput) firstInput.focus();
};

const closeTicketModal = () => {
  if (!ticketModal) return;
  ticketModal.hidden = true;
  ticketModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (ticketModalForm) ticketModalForm.reset();
  if (ticketModalFeedback) ticketModalFeedback.textContent = "";
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

    if (ticketModalFeedback) ticketModalFeedback.textContent = `Issue submitted successfully. Your reference number is ${reference}.`;

    // Update any visible ticket board (if present)
    if (typeof renderTickets === "function") {
      renderTickets(all);
    }

    setTimeout(() => closeTicketModal(), 900);
  });
}
