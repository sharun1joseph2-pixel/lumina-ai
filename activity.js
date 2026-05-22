let allActivities = [];
let currentFilter = "all";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", function () {
  applyTheme();
  loadActivityHistory();
  setupActivitySearch();
  setupActivityFilter();
});

function applyTheme() {
  const theme = localStorage.getItem("lumina_theme") || "dark";

  document.documentElement.classList.remove("light-theme", "dark-theme");
  document.body.classList.remove("light-theme", "dark-theme");

  document.documentElement.classList.add(theme + "-theme");
  document.body.classList.add(theme + "-theme");
}

function loadActivityHistory() {
  allActivities = JSON.parse(localStorage.getItem("lumina_activity_history") || "[]");

  if (allActivities.length === 0) {
    seedDemoActivities();
    allActivities = JSON.parse(localStorage.getItem("lumina_activity_history") || "[]");
  }

  renderActivitySummary();
  renderActivityTimeline();
}

function seedDemoActivities() {
  const demo = [
    {
      id: crypto.randomUUID(),
      type: "chat",
      title: "Started using Lumina Chatbot",
      description: "Created or opened a chat workspace.",
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      type: "system",
      title: "Activity History enabled",
      description: "Lumina will now track important workspace actions locally.",
      created_at: new Date().toISOString()
    }
  ];

  localStorage.setItem("lumina_activity_history", JSON.stringify(demo));
}

function setupActivitySearch() {
  const input = document.getElementById("activitySearchInput");

  if (!input) return;

  input.addEventListener("input", function () {
    currentSearch = input.value.trim().toLowerCase();
    renderActivityTimeline();
  });
}

function setupActivityFilter() {
  const filter = document.getElementById("activityFilter");

  if (!filter) return;

  filter.addEventListener("change", function () {
    currentFilter = filter.value;
    renderActivityTimeline();
  });
}

function getFilteredActivities() {
  return allActivities.filter(activity => {
    const matchesFilter =
      currentFilter === "all" || activity.type === currentFilter;

    const searchText = `
      ${activity.type}
      ${activity.title}
      ${activity.description}
    `.toLowerCase();

    const matchesSearch =
      !currentSearch || searchText.includes(currentSearch);

    return matchesFilter && matchesSearch;
  });
}

function renderActivitySummary() {
  const chatCount = allActivities.filter(a => a.type === "chat").length;
  const imageCount = allActivities.filter(a => a.type === "image").length;
  const voiceCount = allActivities.filter(a => a.type === "voice").length;
  const documentCount = allActivities.filter(a => a.type === "document").length;

  setText("chatActivityCount", chatCount);
  setText("imageActivityCount", imageCount);
  setText("voiceActivityCount", voiceCount);
  setText("documentActivityCount", documentCount);
}

function renderActivityTimeline() {
  const timeline = document.getElementById("activityTimeline");

  if (!timeline) return;

  const filtered = getFilteredActivities().sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (filtered.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <h3>No activity found</h3>
        <p>Try another search or filter.</p>
      </div>
    `;
    return;
  }

  const grouped = groupActivitiesByDay(filtered);

  timeline.innerHTML = Object.keys(grouped).map(day => `
    <div class="activity-day-group">
      <h2 class="activity-day-title">${day}</h2>

      ${grouped[day].map(activity => `
        <article class="activity-item">
          <div class="activity-icon">${getActivityIcon(activity.type)}</div>

          <div class="activity-info">
            <h3>${escapeHTML(activity.title)}</h3>
            <p>${escapeHTML(activity.description || "No description available.")}</p>
          </div>

          <div class="activity-time">
            ${formatTime(activity.created_at)}
          </div>
        </article>
      `).join("")}
    </div>
  `).join("");
}

function groupActivitiesByDay(activities) {
  return activities.reduce((groups, activity) => {
    const day = formatDay(activity.created_at);

    if (!groups[day]) {
      groups[day] = [];
    }

    groups[day].push(activity);
    return groups;
  }, {});
}

function formatDay(dateValue) {
  const date = new Date(dateValue);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatTime(dateValue) {
  const date = new Date(dateValue);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getActivityIcon(type) {
  const icons = {
    chat: "💬",
    image: "🖼",
    voice: "🎙",
    document: "📄",
    note: "⭐",
    download: "⬇",
    system: "✨",
    project: "📁",
    search: "🔍",
    template: "🧩"
  };

  return icons[type] || "✨";
}

function clearActivityHistory() {
  const confirmed = confirm("Clear all activity history?");

  if (!confirmed) return;

  localStorage.removeItem("lumina_activity_history");

  allActivities = [];
  renderActivitySummary();
  renderActivityTimeline();

  showToast("Activity history cleared.", "success");
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  }, 3000);
}