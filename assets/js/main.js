const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const assessmentLinks = [
  { label: "Healthcare", href: "/healthcare-ai-assessment/" },
  { label: "Accounting", href: "/accounting-ai-assessment/" },
  { label: "Logistics", href: "/logistics-ai-assessment/" },
  { label: "Manufacturing", href: "/manufacturing-ai-assessment/" },
  { label: "Education", href: "/education-ai-assessment/" },
  { label: "Legal", href: "/legal-ai-assessment/" },
  { label: "Recruitment", href: "/recruitment-ai-assessment/" },
  { label: "Retail", href: "/retail-ai-assessment/" },
];

function normalizePathname(value) {
  const normalized = String(value || "")
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/\/index\.html$/i, "/")
    .replace(/index\.html$/i, "")
    .replace(/\/{2,}/g, "/");

  if (!normalized) {
    return "/";
  }

  return normalized.endsWith("/") ? normalized.toLowerCase() : `${normalized.toLowerCase()}/`;
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}

const revealItems = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const yearTarget = document.querySelector("[data-year]");
if (yearTarget) {
  yearTarget.textContent = String(new Date().getFullYear());
}

const assessmentDropdown = document.querySelector("[data-assessment-dropdown]");
const assessmentToggle = document.querySelector("[data-assessment-toggle]");

function createAssessmentDropdown() {
  const wrapper = document.createElement("div");
  wrapper.className = "nav-assessment";
  wrapper.setAttribute("data-assessment-dropdown", "true");
  wrapper.innerHTML = `
    <button type="button" class="nav-assessment-toggle" data-assessment-toggle aria-expanded="false">
      <span>Industry</span>
      <i class="bi bi-chevron-down" aria-hidden="true"></i>
    </button>
    <div class="nav-assessment-menu" role="menu" aria-label="Industry">
      ${assessmentLinks.map((item) => `<a href="${item.href}" role="menuitem">${item.label}</a>`).join("")}
    </div>
  `;
  return wrapper;
}

function createResearchLink() {
  const link = document.createElement("a");
  link.href = "/research.html";
  link.textContent = "Research";
  return link;
}

function ensureFooterResearchLink() {
  const footer = document.querySelector(".site-footer");
  const resourcesHeading = Array.from(footer?.querySelectorAll("h4") || []).find(
    (heading) => heading.textContent.trim() === "Resources"
  );
  const resourcesList = resourcesHeading?.nextElementSibling;

  if (!resourcesList) {
    return;
  }

  const hasResearchLink = Array.from(resourcesList.querySelectorAll("a")).some(
    (link) => normalizePathname(link.getAttribute("href")) === normalizePathname("/research.html")
  );

  if (hasResearchLink) {
    return;
  }

  const listItem = document.createElement("li");
  const link = document.createElement("a");
  link.href = "/research.html";
  link.textContent = "Research";
  listItem.appendChild(link);
  resourcesList.insertBefore(listItem, resourcesList.firstChild || null);
}

if (navLinks && !navLinks.querySelector("[data-assessment-dropdown]")) {
  const contactLink = navLinks.querySelector('a[href$="contact.html"]');
  const assessmentNode = createAssessmentDropdown();
  navLinks.insertBefore(assessmentNode, contactLink || null);
}

if (navLinks && !navLinks.querySelector('a[href$="research.html"]')) {
  const assessmentNode = navLinks.querySelector("[data-assessment-dropdown]");
  const contactLink = navLinks.querySelector('a[href$="contact.html"]');
  navLinks.insertBefore(createResearchLink(), assessmentNode || contactLink || null);
}


if (navLinks) {
  navLinks.querySelectorAll("a").forEach((link) => {
    if (link.textContent.trim() === "Blog") {
      link.remove();
    }
  });
}

ensureFooterResearchLink();

const injectedAssessmentDropdown = document.querySelector("[data-assessment-dropdown]");
const injectedAssessmentToggle = document.querySelector("[data-assessment-toggle]");

if (injectedAssessmentDropdown && injectedAssessmentToggle) {
  injectedAssessmentDropdown.classList.remove("is-open");
  injectedAssessmentToggle.classList.remove("active");
  injectedAssessmentToggle.setAttribute("aria-expanded", "false");
  const label = injectedAssessmentToggle.querySelector("span");
  if (label) {
    label.textContent = "Industry";
  }
  const menu = injectedAssessmentDropdown.querySelector(".nav-assessment-menu");
  if (menu) {
    menu.setAttribute("aria-label", "Industry");
  }
  const normalizedLabels = {
    "Healthcare AI Assessment": "Healthcare",
    "Accounting AI Assessment": "Accounting",
    "Logistics AI Assessment": "Logistics",
    "Manufacturing AI Assessment": "Manufacturing",
    "Education AI Assessment": "Education",
    "Legal AI Assessment": "Legal",
    "Recruitment AI Assessment": "Recruitment",
    "Retail AI Assessment": "Retail",
  };
  const currentPathname = normalizePathname(window.location.pathname);
  let activeAssessmentLabel = "";

  injectedAssessmentDropdown.querySelectorAll('[role="menuitem"]').forEach((link) => {
    const text = link.textContent.trim();
    if (normalizedLabels[text]) {
      link.textContent = normalizedLabels[text];
    }

    if (normalizePathname(link.getAttribute("href")) === currentPathname) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
      activeAssessmentLabel = link.textContent.trim();
    }
  });

  if (label && activeAssessmentLabel) {
    label.textContent = activeAssessmentLabel;
    injectedAssessmentToggle.classList.add("active");
  }
}

function closeAssessmentDropdown() {
  if (!injectedAssessmentDropdown || !injectedAssessmentToggle) {
    return;
  }

  injectedAssessmentDropdown.classList.remove("is-open");
  injectedAssessmentToggle.setAttribute("aria-expanded", "false");
}

if (injectedAssessmentDropdown && injectedAssessmentToggle) {
  injectedAssessmentToggle.addEventListener("click", (event) => {
    event.preventDefault();
    const isOpen = injectedAssessmentDropdown.classList.toggle("is-open");
    injectedAssessmentToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", (event) => {
    if (!injectedAssessmentDropdown.contains(event.target)) {
      closeAssessmentDropdown();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAssessmentDropdown();
    }
  });
}

const voiceToggle = document.querySelector("[data-voice-toggle]");
const voicePanel = document.querySelector("[data-voice-panel]");
const voiceOffPanel = document.querySelector("[data-voice-off-panel]");
const voiceStateLabel = document.querySelector("[data-voice-state]");
const voiceStatusDot = document.querySelector("[data-voice-status-dot]");
const voiceCallKey = "oswell-voice-call-enabled";

function readVoiceCallState() {
  try {
    return window.localStorage.getItem(voiceCallKey);
  } catch {
    return null;
  }
}

function writeVoiceCallState(enabled) {
  try {
    window.localStorage.setItem(voiceCallKey, enabled ? "1" : "0");
  } catch {
    // Ignore storage failures so the toggle still works in restricted browsers.
  }
}

function setVoiceCallEnabled(enabled) {
  if (!voiceToggle || !voicePanel || !voiceOffPanel) {
    return;
  }

  voiceToggle.setAttribute("aria-checked", enabled ? "true" : "false");
  voiceToggle.classList.toggle("is-on", enabled);
  voicePanel.hidden = !enabled;
  voiceOffPanel.hidden = enabled;

  if (voiceStateLabel) {
    voiceStateLabel.textContent = enabled ? "On" : "Off";
  }

  if (voiceStatusDot) {
    voiceStatusDot.classList.toggle("is-live", enabled);
  }

  writeVoiceCallState(enabled);
}

if (voiceToggle && voicePanel && voiceOffPanel) {
  const storedVoiceState = readVoiceCallState();
  const initialEnabled = storedVoiceState === null ? true : storedVoiceState === "1";

  setVoiceCallEnabled(initialEnabled);

  voiceToggle.addEventListener("click", () => {
    const nextEnabled = voiceToggle.getAttribute("aria-checked") !== "true";
    setVoiceCallEnabled(nextEnabled);
  });
}

const productToggles = document.querySelectorAll("[data-product-toggle]");
const productModal = document.querySelector("[data-product-modal]");
const productModalTitle = document.querySelector("[data-product-modal-title]");
const productModalSummary = document.querySelector("[data-product-modal-summary]");
const productModalBody = document.querySelector("[data-product-modal-body]");
const productModalCloseButtons = document.querySelectorAll("[data-product-modal-close]");
let activeProductToggle = null;

function closeProductModal() {
  if (!productModal) {
    return;
  }

  productModal.hidden = true;
  document.body.classList.remove("modal-open");

  if (activeProductToggle) {
    activeProductToggle.setAttribute("aria-expanded", "false");
    activeProductToggle.focus();
    activeProductToggle = null;
  }
}

if (productModal && productModalTitle && productModalSummary && productModalBody) {
  productToggles.forEach((toggle) => {
    const productCard = toggle.closest(".product-card");
    const productTitle = productCard?.querySelector("h3");
    const productSummary = productCard?.querySelector("p");
    const productDetails = productCard?.querySelector("[data-product-details]");

    if (!productCard || !productTitle || !productSummary || !productDetails) {
      return;
    }

    toggle.addEventListener("click", () => {
      productModalTitle.textContent = productTitle.textContent.trim();
      productModalSummary.textContent = productSummary.textContent.trim();
      productModalBody.innerHTML = productDetails.innerHTML;
      productModal.hidden = false;
      document.body.classList.add("modal-open");

      if (activeProductToggle && activeProductToggle !== toggle) {
        activeProductToggle.setAttribute("aria-expanded", "false");
      }

      activeProductToggle = toggle;
      toggle.setAttribute("aria-expanded", "true");

      const closeButton = productModal.querySelector(".product-modal-close");
      if (closeButton) {
        closeButton.focus();
      }
    });
  });

  productModalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeProductModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !productModal.hidden) {
      closeProductModal();
    }
  });
}

function initOrbitalScene() {
  const scene = document.querySelector("[data-orbital-scene]");
  const stage = document.querySelector("[data-orbital-stage]");

  if (!scene || !stage || scene.dataset.orbitalReady === "true") {
    return;
  }

  scene.dataset.orbitalReady = "true";

  const viewportWidth = window.innerWidth;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const particleCount = prefersReducedMotion
    ? 0
    : viewportWidth <= 520
      ? 0
      : viewportWidth <= 760
        ? 10
        : viewportWidth <= 1080
          ? 22
          : 54;

  if (viewportWidth <= 760) {
    scene.classList.add("orbital-mobile-lite");
  } else if (viewportWidth <= 1080) {
    scene.classList.add("orbital-tablet-lite");
  }

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    const size = (Math.random() * 2.4 + 1.2).toFixed(2);
    const duration = (Math.random() * 12 + 10).toFixed(2);
    const delay = (Math.random() * -18).toFixed(2);

    particle.className = "orbital-particle";
    particle.style.left = `${(Math.random() * 100).toFixed(2)}%`;
    particle.style.bottom = `${(-6 + Math.random() * 28).toFixed(2)}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.opacity = (Math.random() * 0.55 + 0.18).toFixed(2);
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;

    scene.insertBefore(particle, stage);
  }

  const supportsPointerTilt = window.matchMedia("(pointer: fine)").matches;

  if (!supportsPointerTilt) {
    return;
  }

  const resetStage = () => {
    stage.style.setProperty("--orbital-shift-x", "0px");
    stage.style.setProperty("--orbital-shift-y", "0px");
    stage.style.setProperty("--orbital-tilt-x", "0deg");
    stage.style.setProperty("--orbital-tilt-y", "0deg");
  };

  scene.addEventListener("pointermove", (event) => {
    const bounds = scene.getBoundingClientRect();
    const ratioX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const ratioY = (event.clientY - bounds.top) / bounds.height - 0.5;

    stage.style.setProperty("--orbital-shift-x", `${(ratioX * 16).toFixed(2)}px`);
    stage.style.setProperty("--orbital-shift-y", `${(ratioY * 16).toFixed(2)}px`);
    stage.style.setProperty("--orbital-tilt-x", `${(-ratioY * 7).toFixed(2)}deg`);
    stage.style.setProperty("--orbital-tilt-y", `${(ratioX * 9).toFixed(2)}deg`);
  });

  scene.addEventListener("pointerleave", resetStage);
  resetStage();
}

initOrbitalScene();

