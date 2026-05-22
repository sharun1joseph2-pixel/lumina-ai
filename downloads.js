const API = "http://127.0.0.1:8000";

let allImages = [];
let allAudio = [];
let currentSection = "images";

window.onload = function () {
  applyLuminaTheme();
  loadDownloads();
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

async function loadDownloads() {
  const user_id = getUserId();

  if (!user_id) {
    showToast("Please login first.", "error");
    setTimeout(() => {
      window.location.href = "auth.html";
    }, 800);
    return;
  }

  await Promise.all([
    loadImages(user_id),
    loadAudio(user_id)
  ]);

  updateStats();
}

async function loadImages(user_id) {
  const imagesGrid = document.getElementById("imagesGrid");

  try {
    const res = await fetch(`${API}/image-history/${user_id}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not load images.");
    }

    allImages = data || [];
    renderImages(allImages);

  } catch (err) {
    console.error("LOAD IMAGES ERROR:", err);
    imagesGrid.innerHTML = `<div class="empty-state">Could not load images.</div>`;
  }
}

async function loadAudio(user_id) {
  const audioGrid = document.getElementById("audioGrid");

  try {
    const res = await fetch(`${API}/audio-history/${user_id}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not load audio.");
    }

    allAudio = data || [];
    renderAudio(allAudio);

  } catch (err) {
    console.error("LOAD AUDIO ERROR:", err);
    audioGrid.innerHTML = `<div class="empty-state">Could not load audio.</div>`;
  }
}

function renderImages(images) {
  const imagesGrid = document.getElementById("imagesGrid");
  imagesGrid.innerHTML = "";

  if (!images.length) {
    imagesGrid.innerHTML = `<div class="empty-state">No generated images yet.</div>`;
    return;
  }

  images.forEach(item => {
    const imageUrl = item.image_url?.startsWith("http")
      ? item.image_url
      : `${API}${item.image_url}`;

    const card = document.createElement("div");
    card.className = "download-card download-item";
    card.dataset.search = `${item.prompt || ""} ${item.style || ""}`.toLowerCase();

    card.innerHTML = `
      <img src="${imageUrl}" alt="Generated Image">

      <div class="download-card-content">
        <h4>${escapeHTML(item.style || "Generated Image")}</h4>
        <p>${escapeHTML(item.prompt || "No prompt available")}</p>

        <div class="card-actions">
          <a href="${imageUrl}" download target="_blank">Download</a>
          <button onclick="deleteImage('${item._id}')">Delete</button>
        </div>
      </div>
    `;

    imagesGrid.appendChild(card);
  });
}

function renderAudio(audios) {
  const audioGrid = document.getElementById("audioGrid");
  audioGrid.innerHTML = "";

  if (!audios.length) {
    audioGrid.innerHTML = `<div class="empty-state">No generated audio yet.</div>`;
    return;
  }

  audios.forEach(item => {
    const audioUrl = item.audio_url?.startsWith("http")
      ? item.audio_url
      : `${API}${item.audio_url}`;

    const card = document.createElement("div");
    card.className = "download-card audio-card download-item";
    card.dataset.search = `${item.title || ""} ${item.text || ""} ${item.voice || ""}`.toLowerCase();

    card.innerHTML = `
      <div class="audio-icon">🎙</div>

      <div class="download-card-content">
        <h4>${escapeHTML(item.title || "Lumina Audio")}</h4>
        <p>${escapeHTML(item.text || "No text available")}</p>

        <audio controls src="${audioUrl}"></audio>

        <div class="card-actions">
          <a href="${audioUrl}" download target="_blank">Download</a>
          <button onclick="deleteAudio('${item._id}')">Delete</button>
        </div>
      </div>
    `;

    audioGrid.appendChild(card);
  });
}

function showSection(section) {
  currentSection = section;

  const imagesSection = document.getElementById("imagesSection");
  const audioSection = document.getElementById("audioSection");

  const imagesTab = document.getElementById("imagesTab");
  const audioTab = document.getElementById("audioTab");

  if (section === "images") {
    imagesSection.classList.remove("hidden");
    audioSection.classList.add("hidden");

    imagesTab.classList.add("active");
    audioTab.classList.remove("active");
  } else {
    audioSection.classList.remove("hidden");
    imagesSection.classList.add("hidden");

    audioTab.classList.add("active");
    imagesTab.classList.remove("active");
  }

  filterDownloads();
}

function filterDownloads() {
  const query = document.getElementById("downloadsSearch").value.toLowerCase().trim();

  const activeSection = currentSection === "images"
    ? document.getElementById("imagesSection")
    : document.getElementById("audioSection");

  const items = activeSection.querySelectorAll(".download-item");

  items.forEach(item => {
    const searchText = item.dataset.search || "";

    if (!query || searchText.includes(query)) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });
}

function updateStats() {
  document.getElementById("imageCount").textContent = allImages.length;
  document.getElementById("audioCount").textContent = allAudio.length;
  document.getElementById("totalCount").textContent = allImages.length + allAudio.length;
}

async function deleteImage(image_id) {
  const yes = confirm("Delete this image?");
  if (!yes) return;

  try {
    const res = await fetch(`${API}/delete-image/${image_id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not delete image.");
    }

    showToast("Image deleted.", "success");
    await loadDownloads();

  } catch (err) {
    console.error("DELETE IMAGE ERROR:", err);
    showToast(err.message || "Could not delete image.", "error");
  }
}

async function deleteAudio(audio_id) {
  const yes = confirm("Delete this audio?");
  if (!yes) return;

  try {
    const res = await fetch(`${API}/delete-audio/${audio_id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not delete audio.");
    }

    showToast("Audio deleted.", "success");
    await loadDownloads();

  } catch (err) {
    console.error("DELETE AUDIO ERROR:", err);
    showToast(err.message || "Could not delete audio.", "error");
  }
}

async function deleteAllImages() {
  const user_id = getUserId();

  const yes = confirm("Delete all generated images?");
  if (!yes) return;

  try {
    const res = await fetch(`${API}/delete-all-images/${user_id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not delete all images.");
    }

    showToast("All images deleted.", "success");
    await loadDownloads();

  } catch (err) {
    console.error("DELETE ALL IMAGES ERROR:", err);
    showToast(err.message || "Could not delete all images.", "error");
  }
}

async function deleteAllAudio() {
  const user_id = getUserId();

  const yes = confirm("Delete all generated audio?");
  if (!yes) return;

  try {
    const res = await fetch(`${API}/delete-all-audio/${user_id}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not delete all audio.");
    }

    showToast("All audio deleted.", "success");
    await loadDownloads();

  } catch (err) {
    console.error("DELETE ALL AUDIO ERROR:", err);
    showToast(err.message || "Could not delete all audio.", "error");
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