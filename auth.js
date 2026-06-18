const API = "";

/* SWITCH FORMS */
function showLogin() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");

  if (loginForm) loginForm.classList.remove("hidden");
  if (signupForm) signupForm.classList.add("hidden");

  if (loginTab) loginTab.classList.add("active");
  if (signupTab) signupTab.classList.remove("active");

  handleAuthResponsiveState();

  if (window.innerWidth <= 650) {
    document.querySelector(".auth-container")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function showSignup() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");

  if (loginForm) loginForm.classList.add("hidden");
  if (signupForm) signupForm.classList.remove("hidden");

  if (loginTab) loginTab.classList.remove("active");
  if (signupTab) signupTab.classList.add("active");

  handleAuthResponsiveState();

  if (window.innerWidth <= 650) {
    document.querySelector(".auth-container")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}
/* LOGIN */
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.detail || "Login failed");
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user_id", data.user_id);
  localStorage.setItem("full_name", data.full_name || "");
  localStorage.setItem("email", data.email || "");
  localStorage.setItem("username", data.username || "");
  localStorage.setItem("profile_photo", data.profile_photo || "");

  window.location.href = "/home";
}
/* SIGNUP */
async function signup() {
  const full_name = document.getElementById("signupName").value.trim();
const email = document.getElementById("signupEmail").value.trim();
const username = document.getElementById("signupUsername").value.trim();
const password = document.getElementById("signupPassword").value;

  const res = await fetch(`${API}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      full_name,
      email,
      username,
      password
    })
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.detail && data.detail.suggestions) {
      document.getElementById("usernameSuggestions").innerHTML =
        "Username taken. Try: " + data.detail.suggestions.join(", ");
    } else {
      alert(data.detail || "Signup failed");
    }
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user_id", data.user_id);
  localStorage.setItem("full_name", data.full_name);
  localStorage.setItem("email", data.email);
  localStorage.setItem("username", data.username);

  window.location.href = "/home";
}

async function handleGoogleLogin(response) {
  try {
    console.log("Google credential received:", response);

    if (!response || !response.credential) {
      alert("Google credential missing");
      return;
    }

    const res = await fetch(`${API}/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        credential: response.credential
      })
    });

    const data = await res.json();

    console.log("Google login backend response:", data);

    if (!res.ok) {
      alert(data.detail || "Google login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("full_name", data.full_name || "");
    localStorage.setItem("email", data.email || "");
    localStorage.setItem("username", data.username || "");
    localStorage.setItem("profile_photo", data.profile_photo || "");

    window.location.href = "/home";

  } catch (err) {
    console.error("GOOGLE LOGIN FRONTEND ERROR:", err);
    alert("Google login error");
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");

  if (!container) {
    console.log(message);
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
function setButtonLoading(button, isLoading, loadingText = "Loading...") {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = loadingText;
    button.disabled = true;
    button.classList.add("loading-btn");
  } else {
    button.innerHTML = button.dataset.originalText || button.innerHTML;
    button.disabled = false;
    button.classList.remove("loading-btn");
  }
}
function applyLuminaTheme() {
  const theme = localStorage.getItem("lumina_theme") || "light";

  document.body.classList.remove("light-theme");
  document.body.classList.remove("dark-theme");

  if (theme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.add("dark-theme");
  }
}

window.addEventListener("load", function () {
  applyLuminaTheme();

  setTimeout(function () {
    const loginPassword = document.getElementById("loginPassword");
    const signupPassword = document.getElementById("signupPassword");

    if (loginPassword) {
      loginPassword.value = "";
    }

    if (signupPassword) {
      signupPassword.value = "";
    }
  }, 300);
});

function continueAsGuest() {
  localStorage.setItem("guest_mode", "true");
  localStorage.setItem("user_id", "guest_" + Date.now());
  localStorage.setItem("full_name", "Guest User");
  localStorage.setItem("username", "guest");
  localStorage.setItem("email", "");

  window.location.href = "/home";
}

function handleAuthResponsiveState() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  document.body.classList.toggle("auth-mobile", width <= 650);
  document.body.classList.toggle("auth-tablet", width > 650 && width <= 1100);
  document.body.classList.toggle("auth-short-height", height <= 760);
}

window.addEventListener("load", handleAuthResponsiveState);
window.addEventListener("resize", handleAuthResponsiveState);

function checkVerificationResult() {
  const params = new URLSearchParams(window.location.search);
  const result = params.get("verified");

  if (result === "success") {
    showToast("Gmail verified successfully. You can now purchase plans.", "success");
  }

  if (result === "expired") {
    showToast("Verification link expired. Please request a new one.", "warning");
  }

  if (result === "invalid") {
    showToast("Invalid verification link.", "error");
  }
}

document.addEventListener("DOMContentLoaded", checkVerificationResult);