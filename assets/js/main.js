const menuToggle = document.getElementById("menuToggle");
const primaryNav = document.getElementById("primaryNav");
const revealItems = document.querySelectorAll(".reveal");
const yearNode = document.getElementById("year");
const leadForms = document.querySelectorAll(".lead-form");
const ticketForm = document.getElementById("ticketForm");
const ticketFeedback = document.getElementById("ticketFeedback");
const TICKET_STORAGE_KEY = "bcs_support_tickets";
const ticketModal = document.getElementById("ticketModal");
const ticketModalClose = document.getElementById("ticketModalClose");

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

if (ticketForm) {
  let tickets = loadTickets();

  // Do not auto-open modal on page load; open only when a same-page anchor is clicked

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
    ticketForm.reset();

    if (ticketFeedback) {
      ticketFeedback.textContent = `Issue submitted successfully. Your reference number is ${reference}.`;
    }
  });
}

// Modal controls with basic focus trap
if (ticketModal && ticketModalClose) {
  const focusableSelector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openTicketModal() {
    ticketModal.hidden = false;
    document.body.style.overflow = 'hidden';
    const first = ticketModal.querySelector(focusableSelector);
    if (first) first.focus();
  }

  function closeTicketModal() {
    ticketModal.hidden = true;
    document.body.style.overflow = '';
    history.replaceState(null, "", location.pathname + location.search);
  }

  ticketModalClose.addEventListener("click", () => closeTicketModal());

  // Close on outside click
  ticketModal.addEventListener('click', (e) => {
    if (e.target === ticketModal) closeTicketModal();
  });

  // Close on Escape and trap focus
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !ticketModal.hidden) {
      closeTicketModal();
      return;
    }

    if (e.key === 'Tab' && !ticketModal.hidden) {
      const focusable = Array.from(ticketModal.querySelectorAll(focusableSelector)).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const idx = focusable.indexOf(document.activeElement);
      if (e.shiftKey) {
        if (idx === 0) {
          focusable[focusable.length - 1].focus();
          e.preventDefault();
        }
      } else {
        if (idx === focusable.length - 1) {
          focusable[0].focus();
          e.preventDefault();
        }
      }
    }
  });

  // Allow same-page anchors (href="#ticketing") to open the ticket modal
  document.querySelectorAll('a[href="#ticketing"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      // Only intercept same-page anchors (href exactly '#ticketing')
      e.preventDefault();
      openTicketModal();
    });
  });
}
