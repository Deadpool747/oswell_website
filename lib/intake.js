export const TOTAL_STEPS = 8;

export const PROJECT_TYPES = [
  { value: "Website", description: "Marketing sites, portals, and high-conversion web experiences." },
  { value: "Mobile App", description: "Native-feeling products for iOS, Android, or both." },
  { value: "SaaS Platform", description: "Subscription products, dashboards, and multi-role systems." },
  { value: "AI Tool", description: "Automation, copilots, agents, and intelligent workflows." },
];

export const TARGET_USER_SUGGESTIONS = [
  "Founders",
  "Operations teams",
  "Enterprise clients",
  "Consumers",
  "Internal staff",
  "Sales teams",
];

export const DEVICE_OPTIONS = ["Mobile", "Desktop", "Both"];

export const FEATURE_OPTIONS = [
  "Authentication",
  "Dashboard",
  "Payments",
  "Admin Panel",
  "Notifications",
];

export const DESIGN_OPTIONS = [
  { value: "Minimal", description: "Quiet, premium, and detail-focused." },
  { value: "Bold", description: "High-contrast, energetic, and launch-ready." },
  { value: "Corporate", description: "Structured, trustworthy, and stakeholder-friendly." },
  { value: "Playful", description: "Expressive, warm, and personality-led." },
];

export const DEFAULT_STATE = {
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
};

const FEATURE_COSTS = {
  Authentication: 30000,
  Dashboard: 45000,
  Payments: 40000,
  "Admin Panel": 35000,
  Notifications: 20000,
};

const PROJECT_BASE_COSTS = {
  Website: 90000,
  "Mobile App": 160000,
  "SaaS Platform": 240000,
  "AI Tool": 210000,
};

export function clampBudget(value) {
  return Math.max(50000, Math.min(500000, Number(value) || 50000));
}

export function estimateProjectCost(formData) {
  const base = PROJECT_BASE_COSTS[formData.projectType] || 120000;
  const featureCost = formData.features.reduce(
    (sum, feature) => sum + (FEATURE_COSTS[feature] || 0),
    0
  );
  const urgencyCost = formData.deadline ? 20000 : 0;
  return base + featureCost + urgencyCost;
}

export function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDeadline(value) {
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

export function validateStep(step, formData) {
  switch (step) {
    case 2:
      return formData.projectType ? {} : { projectType: "Choose the type of product you want to build." };
    case 3:
      return formData.targetUsers.trim()
        ? {}
        : { targetUsers: "Tell us who this product is for." };
    case 4:
      return formData.features.length
        ? {}
        : { features: "Pick at least one core feature so we can scope the project." };
    case 5:
      return formData.designPreference
        ? {}
        : { designPreference: "Choose the visual direction you prefer." };
    case 6:
      return formData.deadline
        ? {}
        : { deadline: "Select a target deadline to help us plan delivery." };
    case 7: {
      const errors = {};
      if (!formData.name.trim()) {
        errors.name = "Your name helps us personalize the proposal.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Enter a valid email address.";
      }
      if (!formData.phone.trim()) {
        errors.phone = "Add a phone number or WhatsApp contact.";
      }
      return errors;
    }
    default:
      return {};
  }
}
