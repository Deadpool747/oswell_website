const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mreojvlz";

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

const contactForms = document.querySelectorAll("[data-contact-form]");
contactForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.querySelector('input[name="name"]')?.value?.trim() || "";
    const email = form.querySelector('input[name="email"]')?.value?.trim() || "";
    const idea = form.querySelector('textarea[name="idea"]')?.value?.trim() || "";

    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton?.textContent || "Submit";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    try {
      const data = new FormData();
      data.append("name", name);
      data.append("email", email);
      data.append("project_idea", idea);
      data.append("message", [
        "New consultation request",
        "",
        "Name: " + name,
        "Email: " + email,
        "",
        "Project Idea:",
        idea,
      ].join("\n"));
      data.append("_subject", "New consultation request - Oswell Technologies");

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Formspree submission failed");
      }

      form.reset();
      alert("Your request has been submitted successfully.");
    } catch (error) {
      const subject = "New consultation request - Oswell Technologies";
      const body = [
        "Name: " + name,
        "Email: " + email,
        "",
        "Project Idea:",
        idea,
      ].join("\n");

      alert("Automatic submission failed, so your email app will open instead.");
      window.location.href =
        "mailto:fareez@oswelltechnologies.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
});

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

const tiltTargets = document.querySelectorAll("[data-tilt-shell]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

tiltTargets.forEach((target) => {
  if (!window.matchMedia("(pointer: fine)").matches || reduceMotion.matches) {
    target.style.setProperty("--mx", "0.5");
    target.style.setProperty("--my", "0.5");
    return;
  }

  let frameId = null;

  function applyPosition(clientX, clientY) {
    const rect = target.getBoundingClientRect();
    const rawX = (clientX - rect.left) / rect.width;
    const rawY = (clientY - rect.top) / rect.height;
    const clampedX = Math.min(1, Math.max(0, rawX));
    const clampedY = Math.min(1, Math.max(0, rawY));

    target.style.setProperty("--mx", String(clampedX));
    target.style.setProperty("--my", String(clampedY));
  }

  function resetPosition() {
    target.style.setProperty("--mx", "0.5");
    target.style.setProperty("--my", "0.5");
  }

  target.addEventListener("mousemove", (event) => {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }

    frameId = window.requestAnimationFrame(() => {
      applyPosition(event.clientX, event.clientY);
      frameId = null;
    });
  });

  target.addEventListener("mouseleave", resetPosition);
  target.addEventListener("blur", resetPosition);
});

