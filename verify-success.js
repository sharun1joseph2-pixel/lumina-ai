document.addEventListener("DOMContentLoaded", function () {
  renderVerificationResult();
});

function renderVerificationResult() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "success";

  const icon = document.getElementById("verifyIcon");
  const title = document.getElementById("verifyTitle");
  const message = document.getElementById("verifyMessage");
  const statusText = document.getElementById("verifyStatusText");

  if (!icon || !title || !message || !statusText) return;

  if (status === "success") {
    localStorage.setItem("email_verified", "true");

    icon.className = "verify-icon success";
    icon.textContent = "✅";

    title.textContent = "Gmail Verified Successfully";
    message.textContent =
      "Your Lumina account is now verified. You can now purchase Starter, Creator, or Pro plans.";
    statusText.textContent = "Verified";
    return;
  }

  if (status === "expired") {
    localStorage.setItem("email_verified", "false");

    icon.className = "verify-icon warning";
    icon.textContent = "⏳";

    title.textContent = "Verification Link Expired";
    message.textContent =
      "This verification link has expired. Please open Lumina and request a new verification link.";
    statusText.textContent = "Expired";
    return;
  }

  if (status === "invalid") {
    localStorage.setItem("email_verified", "false");

    icon.className = "verify-icon error";
    icon.textContent = "⚠️";

    title.textContent = "Invalid Verification Link";
    message.textContent =
      "This verification link is invalid or already used. Please request a new verification link from Lumina.";
    statusText.textContent = "Invalid";
    return;
  }
}

function goToHome() {
  window.location.href = "/home";
}

function goToPlans() {
  window.location.href = "/plans";
}