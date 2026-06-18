const API = "";

document.addEventListener("DOMContentLoaded", function () {
  setupSettingsTabs();
  loadLocalSettings();
  loadProfileSettings();
  loadCreditsSettings();
});

/* =========================
   TABS
========================= */

function setupSettingsTabs() {
  const tabs = document.querySelectorAll(".settings-tab");
  const panels = document.querySelectorAll(".settings-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", function () {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");

      const panel = document.getElementById(target);

      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}

/* =========================
   THEME / APPEARANCE
========================= */

function setLuminaTheme(theme) {
  if (theme !== "light" && theme !== "dark") return;

  localStorage.setItem("lumina_theme", theme);

  document.documentElement.classList.remove("light-theme", "dark-theme");
  document.body.classList.remove("light-theme", "dark-theme");

  document.documentElement.classList.add(theme + "-theme");
  document.body.classList.add(theme + "-theme");

  updateThemeButtons();
  showToast(`${theme === "dark" ? "Dark" : "Light"} theme applied.`, "success");
}

function updateThemeButtons() {
  const theme = localStorage.getItem("lumina_theme") || "dark";

  document.getElementById("lightThemeBtn")?.classList.toggle("active", theme === "light");
  document.getElementById("darkThemeBtn")?.classList.toggle("active", theme === "dark");
}

function setAccentColor(color) {
  localStorage.setItem("lumina_accent", color);
  document.body.dataset.accent = color;

  showToast("Accent color updated.", "success");
}

function setFontSize(size) {
  localStorage.setItem("lumina_font_size", size);
  document.body.dataset.fontSize = size;

  showToast("Font size updated.", "success");
}

function loadLocalSettings() {
  const theme = localStorage.getItem("lumina_theme") || "dark";
  const accent = localStorage.getItem("lumina_accent") || "blue";
  const fontSize = localStorage.getItem("lumina_font_size") || "normal";

  document.documentElement.classList.remove("light-theme", "dark-theme");
  document.body.classList.remove("light-theme", "dark-theme");

  document.documentElement.classList.add(theme + "-theme");
  document.body.classList.add(theme + "-theme");

  document.body.dataset.accent = accent;
  document.body.dataset.fontSize = fontSize;

  const fontSelect = document.getElementById("fontSizeSelect");

  if (fontSelect) {
    fontSelect.value = fontSize;
  }

  updateThemeButtons();

  const aiPrefs = JSON.parse(localStorage.getItem("lumina_ai_preferences") || "{}");

  document.getElementById("responseStyleSelect").value = aiPrefs.responseStyle || "simple";
  document.getElementById("answerLengthSelect").value = aiPrefs.answerLength || "medium";
  document.getElementById("creativityRange").value = aiPrefs.creativity ?? 50;
  document.getElementById("typingAnimationToggle").checked = aiPrefs.typingAnimation !== false;

  document.getElementById("lowCreditToggle").checked =
    localStorage.getItem("lumina_low_credit_warning") !== "false";

  document.getElementById("highCreditToggle").checked =
    localStorage.getItem("lumina_high_credit_confirmation") !== "false";
}

/* =========================
   PROFILE
========================= */

function loadProfileSettings() {
  const fullName = localStorage.getItem("full_name") || "";
  const username = localStorage.getItem("username") || "";
  const email = localStorage.getItem("email") || "";
  const occupation = localStorage.getItem("occupation") || "";
  const bio = localStorage.getItem("bio") || "";

  document.getElementById("fullNameInput").value = fullName;
  document.getElementById("usernameInput").value = username;
  document.getElementById("emailInput").value = email;
  document.getElementById("occupationInput").value = occupation;
  document.getElementById("bioInput").value = bio;

  const avatar = document.getElementById("settingsAvatar");

  if (avatar) {
    avatar.textContent = getInitials(fullName || username || "Lumina User");
  }
}

function getInitials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join("") || "LU";
}

async function saveProfileSettings() {
  const userId = localStorage.getItem("user_id");

  const fullName = document.getElementById("fullNameInput").value.trim();
  const username = document.getElementById("usernameInput").value.trim();
  const occupation = document.getElementById("occupationInput").value.trim();
  const bio = document.getElementById("bioInput").value.trim();

  localStorage.setItem("full_name", fullName);
  localStorage.setItem("username", username);
  localStorage.setItem("occupation", occupation);
  localStorage.setItem("bio", bio);

  const avatar = document.getElementById("settingsAvatar");

  if (avatar) {
    avatar.textContent = getInitials(fullName || username || "Lumina User");
  }

  if (!userId || localStorage.getItem("guest_mode") === "true") {
    showToast("Profile saved locally for guest mode.", "success");
    return;
  }

  try {
    const res = await fetch(`${API}/update-profile/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        full_name: fullName,
        username,
        occupation,
        bio
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not update profile.");
    }

    showToast("Profile updated successfully.", "success");

  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    showToast("Saved locally. Backend profile update failed.", "warning");
  }
}

/* =========================
   AI PREFERENCES
========================= */

function saveAIPreferences() {
  const preferences = {
    responseStyle: document.getElementById("responseStyleSelect").value,
    answerLength: document.getElementById("answerLengthSelect").value,
    creativity: Number(document.getElementById("creativityRange").value),
    typingAnimation: document.getElementById("typingAnimationToggle").checked
  };

  localStorage.setItem("lumina_ai_preferences", JSON.stringify(preferences));

  showToast("AI preferences saved.", "success");
}

/* =========================
   CREDITS
========================= */

async function loadCreditsSettings() {
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    document.getElementById("settingsPlanName").textContent = "Guest Mode";
    document.getElementById("settingsMonthlyCredits").textContent = "--";
    document.getElementById("settingsDailyCredits").textContent = "--";
    return;
  }

  try {
    const res = await fetch(`${API}/user-plan/${userId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not load credits.");
    }

    document.getElementById("settingsPlanName").textContent =
      `${capitalize(data.plan)} Plan`;

    document.getElementById("settingsMonthlyCredits").textContent =
      `${data.credits} / ${data.monthly_credit_limit}`;

    const dailyUsed = data.daily_credits_used || 0;
    const dailyLimit = data.daily_credit_limit || 300;

    document.getElementById("settingsDailyCredits").textContent =
      `${dailyUsed} / ${dailyLimit}`;

  } catch (err) {
    console.error("CREDITS ERROR:", err);
    showToast("Could not load credits.", "warning");
  }
}

function capitalize(value) {
  const text = String(value || "free");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* =========================
   PRIVACY
========================= */

async function changePassword() {
  const userId = localStorage.getItem("user_id");

  const currentPassword = document.getElementById("currentPasswordInput").value;
  const newPassword = document.getElementById("newPasswordInput").value;

  if (!userId) {
    showToast("Please login first.", "error");
    return;
  }

  if (!currentPassword || !newPassword) {
    showToast("Please fill both password fields.", "warning");
    return;
  }

  if (newPassword.length < 8) {
    showToast("New password must be at least 8 characters.", "warning");
    return;
  }

  try {
    const res = await fetch(`${API}/change-password/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not change password.");
    }

    document.getElementById("currentPasswordInput").value = "";
    document.getElementById("newPasswordInput").value = "";

    showToast("Password changed successfully.", "success");

  } catch (err) {
    console.error("PASSWORD ERROR:", err);
    showToast(err.message || "Could not change password.", "error");
  }
}

function logoutAllDevices() {
  localStorage.clear();
  window.location.href = "/auth";
}

async function deleteAccount() {
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    showToast("No account found.", "error");
    return;
  }

  const confirmed = confirm("Are you sure you want to delete your account? This cannot be undone.");

  if (!confirmed) return;

  try {
    const res = await fetch(`${API}/delete-account/${userId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Could not delete account.");
    }

    localStorage.clear();
    window.location.href = "/auth";

  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    showToast("Delete account failed.", "error");
  }
}

/* =========================
   STORAGE
========================= */

async function clearAllChats() {
  const userId = localStorage.getItem("user_id");

  if (!confirm("Clear all chats?")) return;

  try {
    const res = await fetch(`${API}/clear-all-chats/${userId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Could not clear chats.");
    }

    showToast("All chats cleared.", "success");

  } catch (err) {
    console.error("CLEAR CHATS ERROR:", err);
    showToast("Clear chats failed.", "error");
  }
}

async function clearAllNotes() {
  const userId = localStorage.getItem("user_id");

  if (!confirm("Clear all notes?")) return;

  try {
    const res = await fetch(`${API}/clear-all-notes/${userId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Could not clear notes.");
    }

    showToast("All notes cleared.", "success");

  } catch (err) {
    console.error("CLEAR NOTES ERROR:", err);
    showToast("Clear notes failed.", "error");
  }
}

function clearDownloads() {
  localStorage.removeItem("lumina_downloads");
  showToast("Downloads history cleared.", "success");
}

function exportUserData() {
  const data = {
    full_name: localStorage.getItem("full_name"),
    username: localStorage.getItem("username"),
    email: localStorage.getItem("email"),
    occupation: localStorage.getItem("occupation"),
    bio: localStorage.getItem("bio"),
    ai_preferences: JSON.parse(localStorage.getItem("lumina_ai_preferences") || "{}"),
    theme: localStorage.getItem("lumina_theme"),
    accent: localStorage.getItem("lumina_accent")
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "lumina-user-data.json";

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  showToast("User data exported.", "success");
}

/* =========================
   TOAST
========================= */

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
  }, 3200);
}