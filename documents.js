const API = "";

/* =========================
   BASIC HELPERS
========================= */

function formatDocumentTaskLabel(task) {
  const labels = {
    summary: "Document summary",
    explain: "Document explanation",
    keypoints: "Document key points",
    questions: "Document Q&A",
    notes: "Document notes",
    analysis: "Document analysis"
  };

  return labels[task] || "Document analysis";
}

function getUserId() {
  return localStorage.getItem("user_id");
}

function isGuestUser() {
  return localStorage.getItem("guest_mode") === "true";
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyLuminaTheme() {
  const theme = localStorage.getItem("lumina_theme") || "light";

  document.body.classList.remove("light-theme", "dark-theme");

  if (theme === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.add("light-theme");
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

function setButtonLoading(button, isLoading, loadingText = "Analyzing...") {
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

function blockGuestAccess() {
  const userId = getUserId();

  if (isGuestUser() || !userId) {
    alert("Please login to use Document Studio.");
    window.location.href = "/auth";
  }
}

/* =========================
   FILE SELECT
========================= */

function showSelectedFile() {
  const fileInput = document.getElementById("documentFile");
  const content = document.getElementById("fileDropContent");

  if (!fileInput || !content) return;

  if (!fileInput.files || fileInput.files.length === 0) {
    content.innerHTML = `
      <span>📎</span>
      <h3>Choose PDF, DOCX, or TXT</h3>
      <p>Click here to upload a document</p>
    `;
    return;
  }

  const file = fileInput.files[0];

  content.innerHTML = `
    <span>✅</span>
    <h3>${escapeHTML(file.name)}</h3>
    <p>${(file.size / 1024).toFixed(1)} KB selected</p>
  `;
}

/* =========================
   ANALYZE DOCUMENT
========================= */

async function analyzeDocument(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log("Analyze Document clicked");

  const user_id = getUserId();
  const fileInput = document.getElementById("documentFile");
  const taskSelect = document.getElementById("documentTask");
  const btn = document.getElementById("analyzeDocumentBtn");
  const resultBox = document.getElementById("analysisResult");

  if (!resultBox) {
    alert("analysisResult box not found in /documents");
    return false;
  }

  if (!user_id || isGuestUser()) {
    resultBox.classList.add("empty");
    resultBox.innerHTML = `
      <span>⚠️</span>
      <p>Please login first to use Document Studio.</p>
    `;

    showToast("Please login first.", "error");
    return false;
  }

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    resultBox.classList.add("empty");
    resultBox.innerHTML = `
      <span>⚠️</span>
      <p>Please select a PDF, DOCX, or TXT file first.</p>
    `;

    showToast("Please select a document first.", "warning");
    return false;
  }

  const file = fileInput.files[0];
  const fileName = file.name.toLowerCase();

  const allowedExtensions = [".pdf", ".docx", ".txt"];
  const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));

  if (!isAllowed) {
    resultBox.classList.add("empty");
    resultBox.innerHTML = `
      <span>⚠️</span>
      <p>Only PDF, DOCX, and TXT files are supported.</p>
    `;

    showToast("Only PDF, DOCX, and TXT files are supported.", "error");
    return false;
  }

  const selectedTask = taskSelect ? taskSelect.value : "summary";

  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("task", selectedTask);
  formData.append("file", file);

  setButtonLoading(btn, true, "Analyzing...");

  resultBox.classList.add("empty");
  resultBox.innerHTML = `
    <span>⏳</span>
    <p>Lumina is reading and analyzing your document. Please wait...</p>
  `;

  try {
    const res = await fetch(`${API}/upload-document`, {
      method: "POST",
      body: formData
    });

    const rawText = await res.text();
    console.log("RAW DOCUMENT RESPONSE:", rawText);

    let data;

    try {
      data = JSON.parse(rawText);
    } catch (jsonError) {
      throw new Error("Backend did not return valid JSON:\n" + rawText);
    }

    console.log("PARSED DOCUMENT RESPONSE:", data);

    if (!res.ok) {
      const errorMessage =
        typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail || data, null, 2);

      throw new Error(errorMessage);
    }

    const analysis = data.analysis || "No analysis returned from backend.";

    sessionStorage.setItem("last_document_analysis", analysis);

    resultBox.classList.remove("empty");

    if (window.marked) {
      resultBox.innerHTML = marked.parse(analysis);
    } else {
      resultBox.innerHTML = `<pre>${escapeHTML(analysis)}</pre>`;
    }

    showToast("Document analyzed successfully.", "success");

    /* ✅ ACTIVITY HISTORY LOG */
    if (typeof logLuminaActivity === "function") {
      const taskLabel = formatDocumentTaskLabel(selectedTask);

      logLuminaActivity(
        "document",
        `${taskLabel} generated`,
        `${file.name} was analyzed in Document Studio.`
      );
    } else {
      console.warn("logLuminaActivity() not found. Make sure lumina-activity.js is loaded before documents.js.");
    }

    await loadDocumentHistory();

    resultBox.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  } catch (err) {
    console.error("DOCUMENT ANALYSIS ERROR:", err);

    resultBox.classList.add("empty");
    resultBox.innerHTML = `
      <span>⚠️</span>
      <p><strong>Document analysis failed:</strong></p>
      <pre>${escapeHTML(err.message || "Unknown error")}</pre>
    `;

    showToast("Document analysis failed.", "error");

  } finally {
    setButtonLoading(btn, false);
  }

  return false;
}

/* =========================
   HISTORY
========================= */

async function loadDocumentHistory() {
  const user_id = getUserId();

  if (!user_id || isGuestUser()) return;

  const container = document.getElementById("documentHistory");

  if (!container) return;

  try {
    const res = await fetch(`${API}/document-history/${user_id}`);
    const docs = await res.json();

    if (!res.ok) {
      throw new Error("Could not load document history.");
    }

    container.innerHTML = "";

    if (!docs || docs.length === 0) {
      container.innerHTML = `<p>No documents analyzed yet.</p>`;
      return;
    }

    docs.forEach(doc => {
      const card = document.createElement("div");
      card.className = "document-history-card";

      const previewText = (doc.analysis || "").slice(0, 260);

      card.innerHTML = `
        <h3>📄 ${escapeHTML(doc.original_filename || "Document")}</h3>

        <p>
          <strong>Task:</strong> ${escapeHTML(doc.task || "analysis")}
        </p>

        <p>
          ${escapeHTML(previewText)}${previewText.length >= 260 ? "..." : ""}
        </p>

        <div class="document-history-actions">
          <button type="button" onclick="viewDocumentAnalysis('${doc._id}')">
            View Analysis
          </button>

          <button type="button" class="delete-doc-btn" onclick="deleteDocument('${doc._id}')">
            Delete
          </button>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("DOCUMENT HISTORY ERROR:", err);
    showToast("Could not load document history.", "error");
  }
}

async function viewDocumentAnalysis(documentId) {
  const user_id = getUserId();

  if (!user_id) {
    showToast("Please login first.", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/document-history/${user_id}`);
    const docs = await res.json();

    if (!res.ok) {
      throw new Error("Could not load document.");
    }

    const doc = docs.find(item => item._id === documentId);

    if (!doc) {
      showToast("Document not found.", "error");
      return;
    }

    const resultBox = document.getElementById("analysisResult");

    if (!resultBox) {
      showToast("Analysis result box not found.", "error");
      return;
    }

    const analysis = doc.analysis || "No analysis saved.";

    sessionStorage.setItem("last_document_analysis", analysis);

    resultBox.classList.remove("empty");

    if (window.marked) {
      resultBox.innerHTML = marked.parse(analysis);
    } else {
      resultBox.innerHTML = `<pre>${escapeHTML(analysis)}</pre>`;
    }

    resultBox.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  } catch (err) {
    console.error("VIEW DOCUMENT ERROR:", err);
    showToast("Could not open document analysis.", "error");
  }
}

async function deleteDocument(documentId) {
  const confirmDelete = confirm("Delete this document analysis?");

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API}/delete-document/${documentId}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not delete document.");
    }

    showToast("Document deleted.", "success");
    await loadDocumentHistory();

  } catch (err) {
    console.error("DELETE DOCUMENT ERROR:", err);
    showToast(err.message || "Could not delete document.", "error");
  }
}

async function deleteAllDocuments() {
  const user_id = getUserId();

  if (!user_id) {
    showToast("Please login first.", "error");
    return;
  }

  const confirmDelete = confirm("Delete all document history?");

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API}/delete-all-documents/${user_id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not delete all documents.");
    }

    sessionStorage.removeItem("last_document_analysis");

    showToast("All documents deleted.", "success");

    await loadDocumentHistory();

    const resultBox = document.getElementById("analysisResult");

    if (resultBox) {
      resultBox.classList.add("empty");
      resultBox.innerHTML = `
        <span>📄</span>
        <p>Your document analysis will appear here.</p>
      `;
    }

  } catch (err) {
    console.error("DELETE ALL DOCUMENTS ERROR:", err);
    showToast(err.message || "Could not delete documents.", "error");
  }
}

/* =========================
   PAGE INIT
========================= */

document.addEventListener("submit", function (event) {
  event.preventDefault();
  event.stopPropagation();
  console.log("Blocked accidental form submit");
  return false;
});

window.addEventListener("DOMContentLoaded", function () {
  applyLuminaTheme();
  blockGuestAccess();
  loadDocumentHistory();

  const savedAnalysis = sessionStorage.getItem("last_document_analysis");
  const resultBox = document.getElementById("analysisResult");

  if (savedAnalysis && resultBox) {
    resultBox.classList.remove("empty");

    if (window.marked) {
      resultBox.innerHTML = marked.parse(savedAnalysis);
    } else {
      resultBox.innerHTML = `<pre>${escapeHTML(savedAnalysis)}</pre>`;
    }
  }

  const fileInput = document.getElementById("documentFile");
  const fileDropBox = document.getElementById("fileDropBox");

  if (fileDropBox && fileInput) {
    fileDropBox.addEventListener("click", function () {
      fileInput.click();
    });

    fileDropBox.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput.click();
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", showSelectedFile);
  }

  const deleteAllBtn = document.getElementById("deleteAllDocumentsBtn");

  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", function () {
      deleteAllDocuments();
    });
  }
});