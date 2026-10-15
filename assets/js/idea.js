(function () {
  const TOTAL_STEPS = 8;
  const STORAGE_KEY = "oswell-project-intake-static";
  const SUBMISSION_KEY = "oswell-project-intake-submissions-static";
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/mreojvlz";

  const stepCopy = {
    1: {
      eyebrow: "Project Intake",
      title: "Let's Build Your Project",
      description:
        "A premium onboarding flow for product discovery. Share what you want to launch and we will shape it into a clearer execution plan.",
    },
    2: {
      eyebrow: "Project Type",
      title: "What are we building together?",
      description:
        "Choose the closest product type so we can calibrate architecture, effort, and delivery shape from the start.",
    },
    3: {
      eyebrow: "Audience",
      title: "Who is this product for?",
      description:
        "Describe the people using it, the context they work in, and which device experience matters most.",
    },
    4: {
      eyebrow: "Features",
      title: "Pick the core capabilities",
      description:
        "Select the foundations you know you need. We use these to estimate complexity and the right build sequence.",
    },
    5: {
      eyebrow: "Design Direction",
      title: "Which visual tone fits your brand?",
      description:
        "This helps us align product decisions with the feeling you want users to have the first time they open it.",
    },
    6: {
      eyebrow: "Budget And Timeline",
      title: "Set the business constraints",
      description:
        "Give us the budget zone and preferred deadline so we can shape a realistic scope and rollout plan.",
    },
    7: {
      eyebrow: "Contact",
      title: "Where should we send the next steps?",
      description:
        "Add your contact details so this brief can become an actual conversation and proposal.",
    },
    8: {
      eyebrow: "Review",
      title: "Review your project brief",
      description:
        "Make sure everything looks right before submitting. You can still go back and fine-tune any step.",
    },
  };

  const projectTypes = [
    ["Website", "Marketing sites, portals, and high-conversion web experiences."],
    ["Mobile App", "Native-feeling products for iOS, Android, or both."],
    ["SaaS Platform", "Subscription products, dashboards, and multi-role systems."],
    ["AI Tool", "Automation, copilots, agents, and intelligent workflows."],
  ];

  const audienceTags = ["Founders", "Operations teams", "Enterprise clients", "Consumers", "Internal staff", "Sales teams"];
  const featureOptions = ["Authentication", "Dashboard", "Payments", "Admin Panel", "Notifications"];
  const designOptions = [
    ["Minimal", "Quiet, premium, and detail-focused."],
    ["Bold", "High-contrast, energetic, and launch-ready."],
    ["Corporate", "Structured, trustworthy, and stakeholder-friendly."],
    ["Playful", "Expressive, warm, and personality-led."],
  ];
  const featureCosts = {
    Authentication: 30000,
    Dashboard: 45000,
    Payments: 40000,
    "Admin Panel": 35000,
    Notifications: 20000,
  };
  const projectCosts = {
    Website: 90000,
    "Mobile App": 160000,
    "SaaS Platform": 240000,
    "AI Tool": 210000,
  };

  const state = Object.assign(
    {
      step: 1,
      projectType: "",
      targetUsers: "",
      selectedUsers: [],
      device: "Both",
      features: [],
      designPreference: "",
      budget: 180000,
      deadline: "",
      name: "",
      email: "",
      phone: "",
      submitted: false,
    },
    readStorage()
  );

  const refs = {
    stepLabel: document.getElementById("stepLabel"),
    progressLabel: document.getElementById("progressLabel"),
    progressFill: document.getElementById("progressFill"),
    stepEyebrow: document.getElementById("stepEyebrow"),
    stepTitle: document.getElementById("stepTitle"),
    stepDescription: document.getElementById("stepDescription"),
    stepContent: document.getElementById("stepContent"),
    backButton: document.getElementById("backButton"),
    nextButton: document.getElementById("nextButton"),
    estimateValue: document.getElementById("estimateValue"),
    summaryProduct: document.getElementById("summaryProduct"),
    summaryFeatures: document.getElementById("summaryFeatures"),
    summaryBudget: document.getElementById("summaryBudget"),
    summaryDeadline: document.getElementById("summaryDeadline"),
    toast: document.getElementById("toast"),
  };

  const startedAt = Date.now();
  let toastTimer = null;

  refs.backButton.addEventListener("click", onBack);
  refs.nextButton.addEventListener("click", onNext);

  render();

  function readStorage() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  function persist() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function currency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDeadline(value) {
    if (!value) {
      return "Not selected";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function estimateCost() {
    const base = projectCosts[state.projectType] || 120000;
    const featureCost = state.features.reduce(function (sum, item) {
      return sum + (featureCosts[item] || 0);
    }, 0);
    const urgency = state.deadline ? 20000 : 0;
    return base + featureCost + urgency;
  }

  function validateStep(step) {
    if (step === 2 && !state.projectType) {
      return { projectType: "Choose the type of product you want to build." };
    }
    if (step === 3 && !state.targetUsers.trim()) {
      return { targetUsers: "Tell us who this product is for." };
    }
    if (step === 4 && state.features.length === 0) {
      return { features: "Pick at least one core feature so we can scope the project." };
    }
    if (step === 5 && !state.designPreference) {
      return { designPreference: "Choose the visual direction you prefer." };
    }
    if (step === 6 && !state.deadline) {
      return { deadline: "Select a target deadline to help us plan delivery." };
    }
    if (step === 7) {
      const errors = {};
      if (!state.name.trim()) {
        errors.name = "Your name helps us personalize the proposal.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
        errors.email = "Enter a valid email address.";
      }
      if (!state.phone.trim()) {
        errors.phone = "Add a phone number or WhatsApp contact.";
      }
      return errors;
    }
    return {};
  }

  function setStep(step) {
    state.step = step;
    persist();
    render();
  }

  function onBack() {
    if (state.step > 1) {
      setStep(state.step - 1);
    }
  }

  async function onNext() {
    if (state.submitted) {
      resetAll();
      return;
    }

    const errors = validateStep(state.step);
    clearErrors();
    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      return;
    }

    if (state.step === TOTAL_STEPS) {
      await submitState();
      return;
    }

    setStep(state.step + 1);
  }

  async function submitState() {
    const estimate = estimateCost();
    const previous = JSON.parse(window.localStorage.getItem(SUBMISSION_KEY) || "[]");
    const submission = Object.assign({}, state, {
      estimate: estimate,
      submittedAt: new Date().toISOString(),
      hp_field: "",
    });

    if (Date.now() - startedAt < 2500) {
      showToast("Please take a moment to review the form before submitting.", "error");
      return;
    }

    if (hasRealFormspreeEndpoint()) {
      try {
        setSubmitting(true, "Submitting...");
        await submitToFormspree(submission);
        trackSubmission(submission, "formspree");
        showToast("Submission sent successfully.", "success");
      } catch (error) {
        setSubmitting(false, "Submit Project Brief");
        showToast("Automatic submission failed, so we opened an email draft instead.", "error");
        trackSubmission(submission, "mailto_fallback");
        openEmailDraft(estimate);
      }
    } else {
      trackSubmission(submission, "mailto_fallback");
      showToast("Formspree is not configured yet, so we opened an email draft instead.", "success");
      openEmailDraft(estimate);
    }

    previous.unshift(submission);
    window.localStorage.setItem(SUBMISSION_KEY, JSON.stringify(previous));
    state.submitted = true;
    persist();
    setSubmitting(false, "Start Another Intake");
    render();
  }

  function hasRealFormspreeEndpoint() {
    return FORMSPREE_ENDPOINT.indexOf("REPLACE_WITH_YOUR_FORM_ID") === -1;
  }

  async function submitToFormspree(submission) {
    const data = new FormData();
    data.append("name", submission.name);
    data.append("email", submission.email);
    data.append("phone", submission.phone);
    data.append("project_type", submission.projectType || "Not selected");
    data.append("target_users", [submission.targetUsers, submission.selectedUsers.join(", ")].filter(Boolean).join(" | ") || "Not provided");
    data.append("device", submission.device);
    data.append("features", submission.features.join(", ") || "No features selected");
    data.append("design_preference", submission.designPreference || "Not selected");
    data.append("budget", currency(submission.budget));
    data.append("deadline", formatDeadline(submission.deadline));
    data.append("estimated_cost", currency(submission.estimate));
    data.append("message", buildSubmissionMessage(submission));
    data.append("_subject", "New project intake submission - Oswell Technologies");
    data.append("_gotcha", submission.hp_field);

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
  }

  function openEmailDraft(estimate) {
    const subject = "New project intake submission - Oswell Technologies";
    const body = buildSubmissionMessage(
      Object.assign({}, state, {
        estimate: estimate,
      })
    );

    window.location.href =
      "mailto:fareez@oswelltechnologies.com?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);
  }

  function buildSubmissionMessage(submission) {
    return [
      "New project intake submission",
      "",
      "Project Type: " + (submission.projectType || "Not selected"),
      "Target Users: " + ([submission.targetUsers, submission.selectedUsers.join(", ")].filter(Boolean).join(" | ") || "Not provided"),
      "Device: " + submission.device,
      "Features: " + (submission.features.join(", ") || "No features selected"),
      "Design Preference: " + (submission.designPreference || "Not selected"),
      "Budget: " + currency(submission.budget),
      "Deadline: " + formatDeadline(submission.deadline),
      "Estimated Cost: " + currency(submission.estimate),
      "",
      "Contact Details",
      "Name: " + (submission.name || ""),
      "Email: " + (submission.email || ""),
      "Phone: " + (submission.phone || ""),
    ].join("\n");
  }

  function setSubmitting(disabled, label) {
    refs.backButton.disabled = disabled || state.step === 1;
    refs.nextButton.disabled = disabled;
    refs.nextButton.textContent = label;
  }

  function trackSubmission(submission, deliveryMethod) {
    const detail = {
      projectType: submission.projectType || "Not selected",
      featureCount: submission.features.length,
      budget: submission.budget,
      deadline: submission.deadline || "",
      deliveryMethod: deliveryMethod,
      estimate: submission.estimate,
    };

    window.dispatchEvent(new CustomEvent("oswell:idea-submitted", { detail: detail }));

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: "idea_submitted",
        idea_submission: detail,
      });
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", "idea_submitted", {
        project_type: detail.projectType,
        feature_count: detail.featureCount,
        budget: detail.budget,
        delivery_method: detail.deliveryMethod,
        estimate: detail.estimate,
      });
    }
  }

  function showToast(message, type) {
    if (!refs.toast) {
      return;
    }

    refs.toast.textContent = message;
    refs.toast.className = "toast visible " + (type || "success");

    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }

    toastTimer = window.setTimeout(function () {
      refs.toast.className = "toast";
    }, 3200);
  }

  function resetAll() {
    Object.assign(state, {
      step: 1,
      projectType: "",
      targetUsers: "",
      selectedUsers: [],
      device: "Both",
      features: [],
      designPreference: "",
      budget: 180000,
      deadline: "",
      name: "",
      email: "",
      phone: "",
      submitted: false,
    });
    persist();
    render();
  }

  function render() {
    updateChrome();

    if (state.submitted) {
      refs.stepContent.innerHTML =
        '<div class="success-state">' +
        '<div class="success-mark">✓</div>' +
        "<p class=\"eyebrow\">Project brief captured</p>" +
        "<h3>Your idea is in motion</h3>" +
        "<p>Your submission has been saved locally and sent through the configured delivery method. If Formspree is not configured yet, an email draft is opened for fareez@oswelltechnologies.com instead.</p>" +
        "</div>";
      refs.backButton.disabled = true;
      refs.nextButton.textContent = "Start Another Intake";
      return;
    }

    const copy = stepCopy[state.step];
    refs.stepEyebrow.textContent = copy.eyebrow;
    refs.stepTitle.textContent = copy.title;
    refs.stepDescription.textContent = copy.description;
    refs.backButton.disabled = state.step === 1;
    refs.nextButton.textContent = state.step === 1 ? "Start" : state.step === TOTAL_STEPS ? "Submit Project Brief" : "Next";

    switch (state.step) {
      case 1:
        renderWelcome();
        break;
      case 2:
        renderProjectType();
        break;
      case 3:
        renderAudience();
        break;
      case 4:
        renderFeatures();
        break;
      case 5:
        renderDesign();
        break;
      case 6:
        renderBudget();
        break;
      case 7:
        renderContact();
        break;
      case 8:
        renderReview();
        break;
      default:
        renderWelcome();
    }
  }

  function updateChrome() {
    const progress = Math.round(((state.step - 1) / (TOTAL_STEPS - 1)) * 100);
    refs.stepLabel.textContent = "Step " + state.step + " of " + TOTAL_STEPS;
    refs.progressLabel.textContent = progress + "% complete";
    refs.progressFill.style.width = progress + "%";
    refs.estimateValue.textContent = currency(estimateCost());
    refs.summaryProduct.textContent = state.projectType || "Not selected";
    refs.summaryFeatures.textContent = state.features.length + " selected";
    refs.summaryBudget.textContent = currency(state.budget);
    refs.summaryDeadline.textContent = formatDeadline(state.deadline);
  }

  function renderWelcome() {
    refs.stepContent.innerHTML =
      '<div class="summary-grid">' +
      '<div class="summary-item"><h4>Interactive scoping</h4><p>Not a static questionnaire. This flow feels like modern SaaS onboarding.</p></div>' +
      '<div class="summary-item"><h4>Clear output</h4><p>Get product direction, feature scope, budget, timeline, and contact details in one place.</p></div>' +
      '<div class="summary-item"><h4>Built for conversion</h4><p>A sharper intake experience than a generic form, with smooth pacing and instant context.</p></div>' +
      "</div>";
  }

  function renderProjectType() {
    refs.stepContent.innerHTML =
      '<div class="card-grid">' +
      projectTypes
        .map(function (entry) {
          const active = state.projectType === entry[0] ? " active" : "";
          return (
            '<button class="option-card' +
            active +
            '" type="button" data-project-type="' +
            entry[0] +
            '">' +
            "<h3>" +
            entry[0] +
            "</h3><p>" +
            entry[1] +
            "</p></button>"
          );
        })
        .join("") +
      "</div>" +
      '<p class="error" data-error="projectType"></p>';

    bindClick("[data-project-type]", function (button) {
      state.projectType = button.getAttribute("data-project-type");
      persist();
      render();
    });
  }

  function renderAudience() {
    refs.stepContent.innerHTML =
      '<div class="field-grid">' +
      '<div><label class="field-label">Who will use this product?</label><textarea class="textarea" id="targetUsersInput" placeholder="Example: Small retail teams who need to track orders, assign staff, and follow up with customers.">' +
      escapeHtml(state.targetUsers) +
      '</textarea><p class="error" data-error="targetUsers"></p></div>' +
      '<div><label class="field-label">Quick audience tags</label><div class="chips">' +
      audienceTags
        .map(function (item) {
          return (
            '<button type="button" class="chip' +
            (state.selectedUsers.indexOf(item) > -1 ? " active" : "") +
            '" data-audience-tag="' +
            item +
            '">' +
            item +
            "</button>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div><label class="field-label">Primary device experience</label><div class="device-row">' +
      ["Mobile", "Desktop", "Both"]
        .map(function (item) {
          return (
            '<button type="button" class="device-pill' +
            (state.device === item ? " active" : "") +
            '" data-device="' +
            item +
            '">' +
            item +
            "</button>"
          );
        })
        .join("") +
      "</div></div>" +
      "</div>";

    document.getElementById("targetUsersInput").addEventListener("input", function (event) {
      state.targetUsers = event.target.value;
      persist();
    });

    bindClick("[data-audience-tag]", function (button) {
      const value = button.getAttribute("data-audience-tag");
      const index = state.selectedUsers.indexOf(value);
      if (index > -1) {
        state.selectedUsers.splice(index, 1);
      } else {
        state.selectedUsers.push(value);
      }
      persist();
      render();
    });

    bindClick("[data-device]", function (button) {
      state.device = button.getAttribute("data-device");
      persist();
      render();
    });
  }

  function renderFeatures() {
    refs.stepContent.innerHTML =
      '<div class="field-grid"><div class="chips">' +
      featureOptions
        .map(function (item) {
          return (
            '<button type="button" class="chip' +
            (state.features.indexOf(item) > -1 ? " active" : "") +
            '" data-feature="' +
            item +
            '">' +
            item +
            "</button>"
          );
        })
        .join("") +
      '</div><p class="error" data-error="features"></p></div>';

    bindClick("[data-feature]", function (button) {
      const value = button.getAttribute("data-feature");
      const index = state.features.indexOf(value);
      if (index > -1) {
        state.features.splice(index, 1);
      } else {
        state.features.push(value);
      }
      persist();
      updateChrome();
      render();
    });
  }

  function renderDesign() {
    refs.stepContent.innerHTML =
      '<div class="tone-grid">' +
      designOptions
        .map(function (item) {
          return (
            '<button class="option-card' +
            (state.designPreference === item[0] ? " active" : "") +
            '" type="button" data-design="' +
            item[0] +
            '">' +
            "<h3>" +
            item[0] +
            "</h3><p>" +
            item[1] +
            "</p></button>"
          );
        })
        .join("") +
      '</div><p class="error" data-error="designPreference"></p>';

    bindClick("[data-design]", function (button) {
      state.designPreference = button.getAttribute("data-design");
      persist();
      render();
    });
  }

  function renderBudget() {
    const today = new Date().toISOString().split("T")[0];
    refs.stepContent.innerHTML =
      '<div class="field-grid">' +
      '<div><div class="range-label"><label class="field-label">Target budget</label><span class="range-value" id="budgetValue">' +
      currency(state.budget) +
      '</span></div><input class="range" id="budgetInput" type="range" min="50000" max="500000" step="10000" value="' +
      state.budget +
      '" /><p class="helper">Use this as a rough investment range, not a strict final quote.</p></div>' +
      '<div><label class="field-label">Preferred launch deadline</label><input class="input" id="deadlineInput" type="date" min="' +
      today +
      '" value="' +
      state.deadline +
      '" /><p class="error" data-error="deadline"></p></div>' +
      "</div>";

    document.getElementById("budgetInput").addEventListener("input", function (event) {
      state.budget = Number(event.target.value);
      document.getElementById("budgetValue").textContent = currency(state.budget);
      persist();
      updateChrome();
    });

    document.getElementById("deadlineInput").addEventListener("input", function (event) {
      state.deadline = event.target.value;
      persist();
      updateChrome();
    });
  }

  function renderContact() {
    refs.stepContent.innerHTML =
      '<div class="field-grid">' +
      inputField("name", "Name", "text", "Your full name", state.name) +
      inputField("email", "Email", "email", "you@company.com", state.email) +
      inputField("phone", "Phone", "tel", "+447442256653", state.phone) +
      "</div>";

    ["name", "email", "phone"].forEach(function (key) {
      document.getElementById(key + "Input").addEventListener("input", function (event) {
        state[key] = event.target.value;
        persist();
      });
    });
  }

  function renderReview() {
    const targetUsers = [state.targetUsers, state.selectedUsers.join(", ")].filter(Boolean).join(" | ") || "Not provided";
    refs.stepContent.innerHTML =
      '<div class="summary-grid">' +
      summaryItem("Project Type", state.projectType || "Not selected") +
      summaryItem("Target Users", targetUsers) +
      summaryItem("Devices", state.device) +
      summaryItem("Features", state.features.join(", ") || "No features selected") +
      summaryItem("Design Preference", state.designPreference || "Not selected") +
      summaryItem("Budget", currency(state.budget)) +
      summaryItem("Deadline", formatDeadline(state.deadline)) +
      summaryItem("Estimate", currency(estimateCost())) +
      summaryItem("Contact", [state.name, state.email, state.phone].filter(Boolean).join(" | ") || "Missing contact details") +
      "</div>";
  }

  function inputField(key, label, type, placeholder, value) {
    return (
      '<div><label class="field-label" for="' +
      key +
      'Input">' +
      label +
      '</label><input class="input" id="' +
      key +
      'Input" type="' +
      type +
      '" placeholder="' +
      placeholder +
      '" value="' +
      escapeAttribute(value) +
      '" /><p class="error" data-error="' +
      key +
      '"></p></div>'
    );
  }

  function summaryItem(label, value) {
    return '<div class="summary-item"><h4>' + label + "</h4><p>" + escapeHtml(value) + "</p></div>";
  }

  function bindClick(selector, handler) {
    Array.prototype.forEach.call(refs.stepContent.querySelectorAll(selector), function (node) {
      node.addEventListener("click", function () {
        handler(node);
      });
    });
  }

  function clearErrors() {
    Array.prototype.forEach.call(refs.stepContent.querySelectorAll("[data-error]"), function (node) {
      node.textContent = "";
    });
  }

  function showErrors(errors) {
    Object.keys(errors).forEach(function (key) {
      const node = refs.stepContent.querySelector('[data-error="' + key + '"]');
      if (node) {
        node.textContent = errors[key];
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
