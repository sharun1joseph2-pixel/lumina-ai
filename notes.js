const API = "http://127.0.0.1:8000";

let allNotes = [];

window.onload = function () {
  applyLuminaTheme();
  loadNotes();
};

function getUserId() {
  return localStorage.getItem("user_id");
}

function applyLuminaTheme() {
  const theme = localStorage.getItem("lumina_theme") || "light";

  document.body.classList.remove("light-theme", "dark-theme");

  if (theme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.add("dark-theme");
  }
}

async function loadNotes() {
  const user_id = getUserId();
  const notesGrid = document.getElementById("notesGrid");

  if (!user_id) {
    showToast("Please login first.", "error");

    setTimeout(() => {
      window.location.href = "auth.html";
    }, 800);

    return;
  }

  try {
    const res = await fetch(`${API}/notes/${user_id}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not load notes.");
    }

    allNotes = data || [];

    renderNotes(allNotes);
    updateStats();

  } catch (err) {
    console.error("LOAD NOTES ERROR:", err);
    notesGrid.innerHTML = `<div class="empty-state">Could not load notes.</div>`;
  }
}

function renderNotes(notes) {
  const notesGrid = document.getElementById("notesGrid");
  notesGrid.innerHTML = "";

  if (!notes.length) {
    notesGrid.innerHTML = `<div class="empty-state">No notes saved yet.</div>`;
    return;
  }

  notes.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-card";
    card.dataset.search = `${note.title || ""} ${note.content || ""} ${note.category || ""}`.toLowerCase();
    card.dataset.category = note.category || "General";

    card.innerHTML = `
      <div class="note-top">
        <h3>${escapeHTML(note.title || "Saved Note")}</h3>
        <span class="note-category">${escapeHTML(note.category || "General")}</span>
      </div>

      <div class="note-content">
        ${marked.parse(note.content || "")}
      </div>

      <div class="note-actions">
        <button class="copy-note-btn" onclick="copyNote('${note._id}')">Copy</button>
        <button class="download-note-btn" onclick="downloadNote('${note._id}')">Download TXT</button>
        <button class="delete-note-btn" onclick="deleteNote('${note._id}')">Delete</button>
      </div>
    `;

    notesGrid.appendChild(card);
  });
}

function filterNotes() {
  const query = document.getElementById("notesSearch").value.toLowerCase().trim();
  const category = document.getElementById("categoryFilter").value;

  const filtered = allNotes.filter(note => {
    const searchText = `${note.title || ""} ${note.content || ""} ${note.category || ""}`.toLowerCase();

    const matchesSearch = !query || searchText.includes(query);
    const matchesCategory = category === "All" || note.category === category;

    return matchesSearch && matchesCategory;
  });

  renderNotes(filtered);
}

function updateStats() {
  document.getElementById("totalNotes").textContent = allNotes.length;

  document.getElementById("studyNotes").textContent =
    allNotes.filter(note => note.category === "Study").length;

  document.getElementById("codeNotes").textContent =
    allNotes.filter(note => note.category === "Code").length;

  document.getElementById("promptNotes").textContent =
    allNotes.filter(note => note.category === "Image Prompt").length;
}

function getNoteById(note_id) {
  return allNotes.find(note => note._id === note_id);
}

function copyNote(note_id) {
  const note = getNoteById(note_id);

  if (!note) {
    showToast("Note not found.", "error");
    return;
  }

  navigator.clipboard.writeText(note.content || "")
    .then(() => showToast("Note copied.", "success"))
    .catch(() => showToast("Could not copy note.", "error"));
}

function downloadNote(note_id) {
  const note = getNoteById(note_id);

  if (!note) {
    showToast("Note not found.", "error");
    return;
  }

  const text = `Lumina Note\n\nTitle: ${note.title}\nCategory: ${note.category}\nCreated: ${note.created_at || ""}\n\n${note.content}`;

  const blob = new Blob([text], {
    type: "text/plain"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFileName(note.title || "lumina-note")}.txt`;
  a.click();

  URL.revokeObjectURL(url);
}

async function deleteNote(note_id) {
  const yes = confirm("Delete this note?");
  if (!yes) return;

  try {
    const res = await fetch(`${API}/delete-note/${note_id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not delete note.");
    }

    showToast("Note deleted.", "success");
    await loadNotes();

  } catch (err) {
    console.error("DELETE NOTE ERROR:", err);
    showToast(err.message || "Could not delete note.", "error");
  }
}

async function deleteAllNotes() {
  const user_id = getUserId();

  const yes = confirm("Delete all saved notes?");
  if (!yes) return;

  try {
    const res = await fetch(`${API}/delete-all-notes/${user_id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not delete notes.");
    }

    showToast("All notes deleted.", "success");
    await loadNotes();

  } catch (err) {
    console.error("DELETE ALL NOTES ERROR:", err);
    showToast(err.message || "Could not delete notes.", "error");
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

function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeFileName(name) {
  return String(name || "lumina-note")
    .replace(/[^a-z0-9_\-]/gi, "_")
    .toLowerCase();
}