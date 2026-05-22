const templates = [
  {
    id: 1,
    title: "Explain Topic Simply",
    category: "study",
    icon: "📘",
    description: "Understand any topic in easy student-friendly language.",
    prompt: "Explain this topic in simple words with examples, key points, and a short summary: "
  },
  {
    id: 2,
    title: "Create Viva Questions",
    category: "study",
    icon: "🎓",
    description: "Generate viva questions and answers for exams.",
    prompt: "Create important viva questions and answers from this topic. Keep answers simple and exam-friendly: "
  },
  {
    id: 3,
    title: "Make Exam Notes",
    category: "study",
    icon: "📝",
    description: "Turn a topic into clean exam notes.",
    prompt: "Create detailed exam notes for this topic with headings, definitions, examples, advantages, disadvantages, and conclusion: "
  },
  {
    id: 4,
    title: "Debug My Code",
    category: "coding",
    icon: "🐞",
    description: "Find and explain bugs in your code.",
    prompt: "Debug this code. Explain the problem, why it happens, and give the corrected code:\n\n"
  },
  {
    id: 5,
    title: "Explain Code",
    category: "coding",
    icon: "💻",
    description: "Understand code line-by-line.",
    prompt: "Explain this code line by line in simple language:\n\n"
  },
  {
    id: 6,
    title: "Create Project Report",
    category: "project",
    icon: "📄",
    description: "Generate a structured college project report.",
    prompt: "Create a complete college project report for this project. Include introduction, objectives, features, technology used, modules, future scope, and conclusion:\n\n"
  },
  {
    id: 7,
    title: "Project Presentation Points",
    category: "project",
    icon: "📊",
    description: "Prepare speaking points for project presentation.",
    prompt: "Create presentation points for my college project. Include problem statement, solution, features, technology stack, working, and future scope:\n\n"
  },
  {
    id: 8,
    title: "Create Image Prompt",
    category: "image",
    icon: "🖼",
    description: "Generate a high-quality AI image prompt.",
    prompt: "Create a detailed AI image generation prompt for this idea. Include style, lighting, mood, camera angle, colors, and aspect ratio:\n\n"
  },
  {
    id: 9,
    title: "Logo Prompt",
    category: "image",
    icon: "✨",
    description: "Create a professional logo prompt.",
    prompt: "Create a professional logo design prompt for this brand. Include color palette, style, symbol idea, typography, and background:\n\n"
  },
  {
    id: 10,
    title: "Instagram Caption",
    category: "content",
    icon: "📱",
    description: "Generate engaging social captions.",
    prompt: "Write 10 creative Instagram captions for this topic. Include emojis and hashtags:\n\n"
  },
  {
    id: 11,
    title: "Professional Email",
    category: "content",
    icon: "✉️",
    description: "Write clean professional emails.",
    prompt: "Write a professional email for this situation. Keep it polite, clear, and concise:\n\n"
  },
  {
    id: 12,
    title: "Resume Summary",
    category: "career",
    icon: "📌",
    description: "Create a resume summary from your skills.",
    prompt: "Create a strong resume summary for me based on these skills and projects:\n\n"
  },
  {
    id: 13,
    title: "Interview Preparation",
    category: "career",
    icon: "💼",
    description: "Prepare questions and answers for interviews.",
    prompt: "Prepare interview questions and answers for this role/topic. Include beginner and intermediate level questions:\n\n"
  },
  {
    id: 14,
    title: "Roadmap Generator",
    category: "career",
    icon: "🛣",
    description: "Create a learning roadmap.",
    prompt: "Create a step-by-step learning roadmap for this goal. Include skills, tools, projects, and timeline:\n\n"
  }
];

let currentCategory = "all";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", function () {
  applyTheme();
  renderTemplates();
  setupSearch();
  setupCategories();
});

function applyTheme() {
  const theme = localStorage.getItem("lumina_theme") || "dark";

  document.documentElement.classList.remove("light-theme", "dark-theme");
  document.body.classList.remove("light-theme", "dark-theme");

  document.documentElement.classList.add(theme + "-theme");
  document.body.classList.add(theme + "-theme");
}

function setupSearch() {
  const searchInput = document.getElementById("templateSearchInput");

  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    currentSearch = searchInput.value.trim().toLowerCase();
    renderTemplates();
  });
}

function setupCategories() {
  const buttons = document.querySelectorAll(".category-pill");

  buttons.forEach(button => {
    button.addEventListener("click", function () {
      buttons.forEach(btn => btn.classList.remove("active"));

      button.classList.add("active");
      currentCategory = button.dataset.category || "all";

      renderTemplates();
    });
  });
}

function getFilteredTemplates() {
  return templates.filter(template => {
    const matchesCategory =
      currentCategory === "all" || template.category === currentCategory;

    const searchableText = `
      ${template.title}
      ${template.category}
      ${template.description}
      ${template.prompt}
    `.toLowerCase();

    const matchesSearch =
      !currentSearch || searchableText.includes(currentSearch);

    return matchesCategory && matchesSearch;
  });
}

function renderTemplates() {
  const grid = document.getElementById("templatesGrid");

  if (!grid) return;

  const filteredTemplates = getFilteredTemplates();

  if (filteredTemplates.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No templates found</h3>
        <p>Try another category or search keyword.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredTemplates.map(template => `
    <article class="template-card">
      <div class="template-top">
        <div class="template-icon">${template.icon}</div>
        <div class="template-category">${template.category}</div>
      </div>

      <h3>${escapeHTML(template.title)}</h3>

      <p>${escapeHTML(template.description)}</p>

      <div class="template-prompt-preview">
        ${escapeHTML(template.prompt)}
      </div>

      <div class="template-actions">
        <button class="use-template-btn" onclick="useTemplate(${template.id})">
          Use Prompt
        </button>

        <button class="copy-template-btn" onclick="copyTemplate(${template.id})">
          Copy
        </button>
      </div>
    </article>
  `).join("");
}

function useTemplate(templateId) {
  const template = templates.find(item => item.id === templateId);

  if (!template) {
    showToast("Template not found.", "error");
    return;
  }

  localStorage.setItem("lumina_pending_prompt", template.prompt);

  logActivity("template", "Used a prompt template", template.title);

  showToast("Template sent to chatbot.", "success");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 400);
}

function copyTemplate(templateId) {
  const template = templates.find(item => item.id === templateId);

  if (!template) {
    showToast("Template not found.", "error");
    return;
  }

  navigator.clipboard.writeText(template.prompt)
    .then(() => {
      showToast("Prompt copied.", "success");
    })
    .catch(() => {
      showToast("Could not copy prompt.", "error");
    });
}

function sendCustomPromptToChat() {
  const input = document.getElementById("customPromptInput");

  if (!input) return;

  const prompt = input.value.trim();

  if (!prompt) {
    showToast("Write a custom prompt first.", "warning");
    return;
  }

  localStorage.setItem("lumina_pending_prompt", prompt);

  showToast("Custom prompt sent to chatbot.", "success");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 400);
}

function clearCustomPrompt() {
  const input = document.getElementById("customPromptInput");

  if (input) {
    input.value = "";
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

function logActivity(type, title, description = "") {
  if (localStorage.getItem("guest_mode") === "true") return;

  const activity = {
    id: crypto.randomUUID(),
    type,
    title,
    description,
    created_at: new Date().toISOString()
  };

  const oldActivities = JSON.parse(localStorage.getItem("lumina_activity_history") || "[]");

  oldActivities.unshift(activity);

  localStorage.setItem("lumina_activity_history", JSON.stringify(oldActivities.slice(0, 200)));
}