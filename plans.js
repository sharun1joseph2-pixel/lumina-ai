const API = "";

const PLAN_LABELS = {
  free: "Free",
  starter: "Starter",
  creator: "Creator",
  pro: "Pro",
  guest: "Guest"
};

function getUserId() {
  return localStorage.getItem("user_id");
}

function isGuestUser() {
  const userId = localStorage.getItem("user_id") || "";
  return localStorage.getItem("guest_mode") === "true" || userId.startsWith("guest_");
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");

  if (!container) {
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3400);
}

function applyTheme() {
  const theme = localStorage.getItem("lumina_theme") || "light";

  document.body.classList.remove("light-theme", "dark-theme");

  if (theme === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.add("light-theme");
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function planLabel(plan) {
  return PLAN_LABELS[String(plan || "free").toLowerCase()] || "Free";
}

async function loadCurrentPlan() {
  const userId = getUserId();

  const currentPlanName = document.getElementById("currentPlanName");
  const currentCredits = document.getElementById("currentCredits");
  const dailyUsageText = document.getElementById("dailyUsageText");
  const dailyUsageFill = document.getElementById("dailyUsageFill");

  if (!userId) {
    if (currentPlanName) currentPlanName.textContent = "Not logged in";
    if (currentCredits) currentCredits.textContent = "Please login to view credits.";
    return;
  }

  try {
    const res = await fetch(`${API}/user-plan/${userId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not load plan.");
    }

    const plan = data.plan || "free";

    const credits = Number(data.credits || 0);
    const monthlyLimit = Number(data.monthly_credit_limit || 0);
    const dailyUsed = Number(data.daily_used_credits || 0);
    const dailyLimit = Number(data.daily_credit_limit || 0);

    const dailyPercent =
      dailyLimit > 0
        ? Math.min((dailyUsed / dailyLimit) * 100, 100)
        : 0;

    if (currentPlanName) {
      currentPlanName.textContent = `${planLabel(plan)} Plan`;
    }

    if (currentCredits) {
      currentCredits.textContent =
        `Monthly Credits: ${formatNumber(credits)} / ${formatNumber(monthlyLimit)}`;
    }

    if (dailyUsageText) {
      dailyUsageText.textContent =
        `${formatNumber(dailyUsed)} / ${formatNumber(dailyLimit)}`;
    }

    if (dailyUsageFill) {
      dailyUsageFill.style.width = `${dailyPercent}%`;
    }

    updateCurrentPlanButtons(plan);

  } catch (err) {
    console.error("LOAD CURRENT PLAN ERROR:", err);

    if (currentPlanName) currentPlanName.textContent = "Could not load plan";
    if (currentCredits) currentCredits.textContent = "Backend not reachable.";

    showToast(err.message || "Could not load plan.", "error");
  }
}

function updateCurrentPlanButtons(currentPlan) {
  const buttons = document.querySelectorAll("[data-plan-button]");

  buttons.forEach(button => {
    const plan = button.dataset.planButton;

    if (plan === currentPlan) {
      button.textContent = "Current Plan";
      button.disabled = true;
    } else {
      button.disabled = false;

      if (plan === "free") button.textContent = "Use Free";
      if (plan === "starter") button.textContent = "Choose Starter";
      if (plan === "creator") button.textContent = "Choose Creator";
      if (plan === "pro") button.textContent = "Choose Pro";
    }
  });
}
async function checkEmailBeforePurchase(planName) {
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    showToast("Please login first.", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/user-profile/${userId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not check account.");
    }

    if (!data.email_verified) {
      showEmailVerificationModal(data.email);
      return;
    }

    startPlanPurchase(planName);

  } catch (err) {
    console.error("EMAIL CHECK ERROR:", err);
    showToast("Could not verify account status.", "error");
  }
}

async function upgradePlan(plan) {
  const userId = getUserId();

  if (!userId || isGuestUser()) {
    showToast("Please login to upgrade your Lumina plan.", "warning");

    setTimeout(() => {
      window.location.href = "/auth";
    }, 900);

    return;
  }

  const confirmUpgrade = confirm(
    `Upgrade to ${planLabel(plan)} plan?\n\nFor now this is demo mode. Real payment will be added later.`
  );

  if (!confirmUpgrade) return;

  try {
    const res = await fetch(`${API}/demo-upgrade-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: userId,
        plan: plan
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not upgrade plan.");
    }

    showToast(data.message || "Plan upgraded successfully.", "success");

    await loadCurrentPlan();

  } catch (err) {
    console.error("UPGRADE PLAN ERROR:", err);
    showToast(err.message || "Could not upgrade plan.", "error");
  }
}

window.addEventListener("load", function () {
  applyTheme();
  loadCurrentPlan();
});

let pendingVerificationEmail = "";

function showEmailVerificationModal(email) {
  pendingVerificationEmail =
    email ||
    localStorage.getItem("email") ||
    localStorage.getItem("user_email") ||
    "";

  const modal = document.getElementById("emailVerificationModal");
  const emailText = document.getElementById("verificationEmailText");

  if (emailText) {
    emailText.textContent = pendingVerificationEmail || "your registered Gmail";
  }

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeVerificationModal() {
  const modal = document.getElementById("emailVerificationModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

async function resendVerificationEmail() {
  if (!pendingVerificationEmail) {
    showToast("Email not found. Please login again.", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: pendingVerificationEmail
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not send verification link.");
    }

    if (data.already_verified) {
      showToast("Your Gmail is already verified.", "success");
      closeVerificationModal();
      return;
    }

    showToast("Verification link sent to your Gmail.", "success");

  } catch (err) {
    console.error("RESEND VERIFICATION ERROR:", err);
    showToast(err.message || "Could not send verification link.", "error");
  }
}