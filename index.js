const API = "";

let currentChatId = null;
let selectedChatId = null;
let selectedChatFile = null;

let luminaRecognition = null;
let isLuminaListening = false;
let chatInputSetupDone = false;

/* =========================
   BASIC HELPERS
========================= */

function getMessageInput() {
  return (
    document.getElementById("messageInput") ||
    document.getElementById("message")
  );
}

function getUserId() {
  let userId = localStorage.getItem("user_id");

  if (!userId && localStorage.getItem("guest_mode") === "true") {
    userId = localStorage.getItem("guest_user_id");

    if (!userId) {
      userId = "guest_" + Date.now();
      localStorage.setItem("guest_user_id", userId);
    }
  }

  return userId;
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
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }

    button.innerHTML = loadingText;
    button.disabled = true;
    button.classList.add("loading-btn");
  } else {
    button.innerHTML = button.dataset.originalText || button.innerHTML;
    button.disabled = false;
    button.classList.remove("loading-btn");
  }
}

function goToAuth() {
  localStorage.removeItem("guest_mode");
  localStorage.removeItem("guest_user_id");
  localStorage.removeItem("user_id");
  localStorage.removeItem("full_name");
  localStorage.removeItem("username");
  localStorage.removeItem("email");

  window.location.href = "/auth";
}

function goToLogin() {
  goToAuth();
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

function setupGuestModeBanner() {
  const banner = document.getElementById("guestModeBanner");

  if (isGuestUser()) {
    document.body.classList.add("guest-mode");

    if (banner) {
      banner.classList.remove("hidden");
    }
  } else {
    document.body.classList.remove("guest-mode");

    if (banner) {
      banner.classList.add("hidden");
    }
  }
}

/* =========================
   AUTH CHECK
========================= */

if (!getUserId() && !isGuestUser()) {
  window.location.href = "/auth";
}

/* =========================
   WELCOME STATE
========================= */

function getWelcomeHTML() {
  return `
    <div class="chat-welcome" id="chatWelcome">

      <h1>Welcome to Lumina AI</h1>

      <p>
        Your intelligent companion for ideas, answers, coding, creativity, and productivity.
      </p>

      <div class="welcome-cards">

        <button type="button" onclick="sendSuggestedPrompt('Explain this topic in simple words')">
          <div class="welcome-card-icon">💬</div>
          <h3>Ask anything</h3>
          <p>Get answers, explanations, and help with any topic.</p>
          <span>→</span>
        </button>

        <button type="button" onclick="openFeaturePage('/image')">
          <div class="welcome-card-icon">🖼</div>
          <h3>Create images</h3>
          <p>Turn your ideas into beautiful AI-generated visuals.</p>
          <span>→</span>
        </button>

        <button type="button" onclick="openFeaturePage('/voice')">
          <div class="welcome-card-icon">🎙</div>
          <h3>Use voice</h3>
          <p>Create natural-sounding speech and downloadable audio.</p>
          <span>→</span>
        </button>

        <button type="button" onclick="sendSuggestedPrompt('Give me creative ideas for my next project')">
          <div class="welcome-card-icon">💡</div>
          <h3>Brainstorm ideas</h3>
          <p>Generate creative ideas and solutions in seconds.</p>
          <span>→</span>
        </button>

      </div>

    </div>
  `;
}

function resetChatBoxToWelcome() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  chatBox.innerHTML = getWelcomeHTML();
}

function hideChatWelcome() {
  const welcome = document.getElementById("chatWelcome");

  if (welcome) {
    welcome.style.display = "none";
  }
}

function showChatWelcomeIfEmpty() {
  const chatBox = document.getElementById("chatBox");
  const welcome = document.getElementById("chatWelcome");

  if (!chatBox) return;

  const messages = chatBox.querySelectorAll(".message");

  if (messages.length === 0) {
    if (!welcome) {
      resetChatBoxToWelcome();
    } else {
      welcome.style.display = "flex";
    }
  } else if (welcome) {
    welcome.style.display = "none";
  }
}

function sendSuggestedPrompt(prompt) {
  const input = getMessageInput();

  if (!input) {
    showToast("Message input not found.", "error");
    return;
  }

  input.value = prompt;
  autoResizeMessageInput(input);
  sendMessage();
}

/* =========================
   MERMAID
========================= */

function initializeMermaidByTheme() {
  if (!window.mermaid) return;

  const isDark = document.body.classList.contains("dark-theme");

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    themeVariables: isDark
      ? {
          background: "transparent",
          primaryColor: "#f8fafc",
          primaryBorderColor: "#8b5cf6",
          primaryTextColor: "#111827",
          secondaryColor: "#e5e7eb",
          secondaryTextColor: "#111827",
          tertiaryColor: "#f1f5f9",
          tertiaryTextColor: "#111827",
          lineColor: "#cbd5e1",
          textColor: "#111827",
          mainBkg: "#f8fafc",
          nodeBkg: "#f8fafc",
          nodeBorder: "#8b5cf6",
          edgeLabelBackground: "#1f2937",
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "16px"
        }
      : {
          background: "transparent",
          primaryColor: "#ffffff",
          primaryBorderColor: "#3b82f6",
          primaryTextColor: "#111827",
          secondaryColor: "#eff6ff",
          secondaryTextColor: "#111827",
          tertiaryColor: "#dbeafe",
          tertiaryTextColor: "#111827",
          lineColor: "#334155",
          textColor: "#111827",
          mainBkg: "#ffffff",
          nodeBkg: "#ffffff",
          nodeBorder: "#3b82f6",
          edgeLabelBackground: "#ffffff",
          fontFamily: "Inter, Arial, sans-serif",
          fontSize: "16px"
        }
  });
}

async function renderMermaidCharts(container) {
  if (!window.mermaid || !container) return;

  initializeMermaidByTheme();

  const mermaidBlocks = container.querySelectorAll("pre code.language-mermaid");

  for (const block of mermaidBlocks) {
    const mermaidCode = block.textContent.trim();
    const pre = block.closest("pre");

    if (!mermaidCode || !pre) continue;

    const wrapper = document.createElement("div");
    wrapper.className = "mermaid";
    wrapper.textContent = mermaidCode;

    pre.replaceWith(wrapper);
  }

  const diagrams = container.querySelectorAll(".mermaid:not([data-rendered='true'])");

  for (const diagram of diagrams) {
    try {
      await mermaid.run({
        nodes: [diagram]
      });

      diagram.dataset.rendered = "true";
    } catch (err) {
      console.error("Mermaid render error:", err);

      diagram.innerHTML = `
        <pre class="mermaid-error">${escapeHTML(diagram.textContent)}</pre>
      `;
    }
  }
}

function rerenderAllMermaidInChat() {
  const aiMessages = document.querySelectorAll(".message.ai");

  aiMessages.forEach(msg => {
    const rawText = msg.dataset.rawText;
    if (!rawText) return;

    msg.innerHTML = marked.parse(rawText);
    renderMermaidCharts(msg);
    addMessageTools(msg, rawText);
  });
}

/* =========================
   MESSAGE RENDERING
========================= */

function addMessage(text, type, withTools = true) {
  const chatBox = document.getElementById("chatBox");

  if (!chatBox) {
    showToast("Chat box not found.", "error");
    return null;
  }

  hideChatWelcome();

  const div = document.createElement("div");
  div.classList.add("message", type);

  if (type === "user") {
    div.textContent = text;
  } else {
    div.dataset.rawText = text || "";
    div.innerHTML = window.marked ? marked.parse(text || "") : text || "";
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (type === "ai") {
    renderMermaidCharts(div);

    if (withTools && text) {
      addMessageTools(div, text);
    }
  }

  return div;
}

function createThinkingMessage() {
  const chatBox = document.getElementById("chatBox");

  const aiDiv = document.createElement("div");
  aiDiv.className = "message ai loading-message";

  aiDiv.innerHTML = `
    <div class="thinking-loader">
      <span></span>
      <span></span>
      <span></span>
      <p>Lumina is thinking...</p>
    </div>
  `;

  chatBox.appendChild(aiDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  return aiDiv;
}

function createSmoothWordStreamer(targetElement) {
  let queue = [];
  let visibleText = "";
  let isRunning = false;
  let finishResolver = null;

  function scrollChatToBottom() {
    const chatBox = document.getElementById("chatBox");

    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  function runQueue() {
    if (isRunning) return;

    isRunning = true;

    function step() {
      if (queue.length === 0) {
        isRunning = false;

        if (finishResolver) {
          finishResolver();
          finishResolver = null;
        }

        return;
      }

      const nextWord = queue.shift();

      visibleText += nextWord;
      targetElement.textContent = visibleText;
      targetElement.dataset.rawText = visibleText;

      scrollChatToBottom();

      const delay = nextWord.trim().length <= 2 ? 12 : 22;

      setTimeout(step, delay);
    }

    step();
  }

  return {
    push(text) {
      if (!text) return;

      const words = String(text).match(/\S+\s*/g) || [text];

      queue.push(...words);
      runQueue();
    },

    finish() {
      return new Promise(resolve => {
        if (queue.length === 0 && !isRunning) {
          resolve();
        } else {
          finishResolver = resolve;
        }
      });
    },

    getText() {
      return visibleText;
    }
  };
}

/* =========================
   FILE UPLOAD
========================= */

function handleSelectedChatFile() {
  const fileInput = document.getElementById("chatFileInput");
  const preview = document.getElementById("selectedFilePreview");

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    selectedChatFile = null;

    if (preview) {
      preview.innerHTML = "";
    }

    return;
  }

  selectedChatFile = fileInput.files[0];

  const fileName = selectedChatFile.name;
  const fileSize = (selectedChatFile.size / 1024).toFixed(1);

  if (preview) {
    preview.innerHTML = `
      <div class="file-chip">
        <span>📎 ${escapeHTML(fileName)} · ${fileSize} KB</span>
        <button type="button" onclick="removeSelectedChatFile()">×</button>
      </div>
    `;
  }
}

function removeSelectedChatFile() {
  selectedChatFile = null;

  const fileInput = document.getElementById("chatFileInput");
  const preview = document.getElementById("selectedFilePreview");

  if (fileInput) {
    fileInput.value = "";
  }

  if (preview) {
    preview.innerHTML = "";
  }
}

function triggerChatFileUpload() {
  const fileInput = document.getElementById("chatFileInput");

  if (fileInput) {
    fileInput.click();
  } else {
    showToast("File upload option not found.", "error");
  }
}

/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {
  const user_id = getUserId();
  const input = getMessageInput();

  const sendBtn =
    document.getElementById("sendMessageBtn") ||
    document.querySelector(".composer-send-btn");

  if (!input) {
    showToast("Message input not found.", "error");
    return;
  }

  const message = input.value.trim();

  if (!message && !selectedChatFile) {
    showToast("Please enter a message or upload a file.", "warning");
    return;
  }

  if (!user_id) {
    showToast("Please login or continue as guest first.", "error");
    return;
  }

  setButtonLoading(sendBtn, true, "...");

  let aiDiv = null;

  try {
    hideChatWelcome();

    if (!currentChatId) {
      const newChatId = await createNewChat(false);

      if (!newChatId) {
        throw new Error("Could not create a new chat.");
      }
    }

    const displayMessage = selectedChatFile
      ? `${message || "Analyze this file"}\n\n📎 Uploaded: ${selectedChatFile.name}`
      : message;

    addMessage(displayMessage, "user", false);
    if (typeof logLuminaActivity === "function") {
  logLuminaActivity(
    "chat",
    "Sent a chat message",
    displayMessage.slice(0, 140)
  );
}
    logActivity("chat", "Sent a chat message", displayMessage.slice(0, 100));

    input.value = "";
    autoResizeMessageInput(input);

    /*
      FILE CHAT
    */
    if (selectedChatFile) {
      aiDiv = createThinkingMessage();

      const formData = new FormData();

      formData.append("user_id", user_id);
      formData.append("chat_id", currentChatId);
      formData.append(
        "message",
        message || "Analyze this file and explain it clearly."
      );
      formData.append("file", selectedChatFile);

      const res = await fetch(`${API}/chat-with-file`, {
        method: "POST",
        body: formData
      });

      removeSelectedChatFile();

      let data = {};

      try {
        data = await res.json();
      } catch (jsonError) {
        throw new Error("Invalid backend response.");
      }

      aiDiv.classList.remove("loading-message");
      aiDiv.innerHTML = "";

      if (!res.ok) {
        throw new Error(data.detail || data.error || "File chat failed.");
      }

      const aiText =
        data.response ||
        data.reply ||
        data.answer ||
        data.message ||
        "No response from Lumina.";

      aiDiv.dataset.rawText = aiText;

      if (window.marked) {
        aiDiv.innerHTML = marked.parse(aiText);
      } else {
        aiDiv.textContent = aiText;
      }

      await renderMermaidCharts(aiDiv);
      addMessageTools(aiDiv, aiText);
      if (typeof logLuminaActivity === "function") {
  logLuminaActivity(
    "document",
    "Analyzed a file in chatbot",
    `${displayMessage.slice(0, 80)}`
  );
}

      await loadChats();

      if (typeof loadUserPlan === "function") {
        await loadUserPlan();
      }

      return;
    }

    /*
      NORMAL STREAMING CHAT
    */
    aiDiv = createThinkingMessage();

    let fullResponse = "";
    let firstChunkReceived = false;

    const res = await fetch(`${API}/chat-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id,
        chat_id: currentChatId,
        message
      })
    });

    if (!res.ok || !res.body) {
      throw new Error("Streaming response failed.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let streamDone = false;
    let wordStreamer = null;

    while (!streamDone) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop();

      for (const event of events) {
        if (!event.startsWith("data:")) continue;

        const jsonText = event.replace("data:", "").trim();

        if (!jsonText) continue;

        let data;

        try {
          data = JSON.parse(jsonText);
        } catch (parseError) {
          console.error("STREAM JSON PARSE ERROR:", parseError, jsonText);
          continue;
        }

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.done) {
          streamDone = true;
          break;
        }

        if (data.chunk) {
          if (!firstChunkReceived) {
            firstChunkReceived = true;

            aiDiv.classList.remove("loading-message");
            aiDiv.classList.add("streaming-message");
            aiDiv.innerHTML = "";

            wordStreamer = createSmoothWordStreamer(aiDiv);
          }

          fullResponse += data.chunk;

          if (wordStreamer) {
            wordStreamer.push(data.chunk);
          }
        }
      }
    }

    if (wordStreamer) {
      await wordStreamer.finish();
    }

    aiDiv.classList.remove("streaming-message");
    aiDiv.classList.remove("loading-message");

    if (!fullResponse.trim()) {
      fullResponse = "Lumina could not generate a response.";
    }

    aiDiv.dataset.rawText = fullResponse;

    if (window.marked) {
      aiDiv.innerHTML = marked.parse(fullResponse);
    } else {
      aiDiv.textContent = fullResponse;
    }

    await renderMermaidCharts(aiDiv);
    addMessageTools(aiDiv, fullResponse);
    if (typeof logLuminaActivity === "function") {
  logLuminaActivity(
    "chat",
    "Received AI response",
    fullResponse.slice(0, 140)
  );
}

    await loadChats();

    if (typeof loadUserPlan === "function") {
      await loadUserPlan();
    }

  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);

    if (aiDiv) {
      aiDiv.classList.remove("loading-message");
      aiDiv.classList.remove("streaming-message");

      aiDiv.innerHTML = `
        <p>⚠️ ${escapeHTML(err.message || "Lumina could not generate a response.")}</p>
      `;
    } else {
      addMessage(
        `⚠️ ${err.message || "Lumina could not generate a response."}`,
        "ai",
        true
      );
    }

    showToast(err.message || "Chat failed.", "error");

  } finally {
    setButtonLoading(sendBtn, false);
  }
}

/* =========================
   CHAT CRUD
========================= */

async function createNewChat(showWelcome = true) {
  const user_id = getUserId();

  if (!user_id) {
    showToast("No user found. Please login again.", "error");
    return null;
  }

  try {
    const res = await fetch(`${API}/new-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id
      })
    });

    let data = {};

    try {
      data = await res.json();
    } catch (err) {
      console.error("NEW CHAT JSON ERROR:", err);
      showToast("Invalid backend response from /new-chat.", "error");
      return null;
    }

    if (!res.ok) {
      showToast(data.detail || data.error || "Could not create chat.", "error");
      return null;
    }

    if (!data.chat_id) {
      showToast("Backend did not return chat_id.", "error");
      console.error("Missing chat_id:", data);
      return null;
    }

    currentChatId = data.chat_id;

    if (showWelcome) {
      resetChatBoxToWelcome();
    }

    await loadChats();

    return currentChatId;

  } catch (err) {
    console.error("CREATE CHAT ERROR:", err);
    showToast("Backend not reachable. Check FastAPI server.", "error");
    return null;
  }
}

async function loadChats() {
  const user_id = getUserId();

  if (!user_id) return;

  try {
    const res = await fetch(`${API}/chats/${user_id}`);
    const data = await res.json();

    if (!res.ok) {
      showToast(data.detail || "Could not load chats.", "error");
      return;
    }

    const chatList = document.getElementById("chatList");

    if (!chatList) return;

    chatList.innerHTML = "";

    data.forEach(chat => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("chat-wrapper");

      const div = document.createElement("div");
      div.classList.add("chat-item");
      div.dataset.chatId = chat._id;
      div.textContent = chat.pinned ? `📌 ${chat.title}` : chat.title;

      if (chat._id === currentChatId) {
        div.classList.add("active-chat");
      }

      div.onclick = () => {
        loadMessages(chat._id);
      };

      const menuBtn = document.createElement("button");
      menuBtn.type = "button";
      menuBtn.textContent = "⋮";
      menuBtn.classList.add("delete-btn");

      menuBtn.onclick = (e) => {
        e.stopPropagation();
        selectedChatId = chat._id;

        const modal = document.getElementById("chatOptionsModal");

        if (modal) {
          modal.style.display = "flex";
        }
      };

      wrapper.appendChild(div);
      wrapper.appendChild(menuBtn);
      chatList.appendChild(wrapper);
    });

  } catch (err) {
    console.error("LOAD CHATS ERROR:", err);
    showToast("Could not load chats.", "error");
  }
}

async function loadMessages(chat_id) {
  currentChatId = chat_id;
  localStorage.setItem("open_chat_id",chat_id);

  try {
    clearMessageSearch();

    const res = await fetch(`${API}/messages/${chat_id}`);
    const data = await res.json();

    if (!res.ok) {
      showToast(data.detail || "Could not load messages.", "error");
      return;
    }

    const chatBox = document.getElementById("chatBox");

    if (!chatBox) return;

    chatBox.innerHTML = "";

    if (!data || data.length === 0) {
      resetChatBoxToWelcome();
      await loadChats();
      return;
    }

    for (const msg of data) {
      if (msg.message) {
        addMessage(msg.message, "user", false);
      }

      if (msg.response) {
        addMessage(msg.response, "ai", true);
      }
    }

    document.querySelectorAll(".chat-item").forEach(item => {
      item.classList.remove("active-chat");

      if (item.dataset.chatId === chat_id) {
        item.classList.add("active-chat");
      }
    });

    showChatWelcomeIfEmpty();

  } catch (err) {
    console.error("LOAD MESSAGES ERROR:", err);
    showToast("Could not load messages.", "error");
  }
}

/* =========================================================
   RENAME CHAT FINAL FIX
========================================================= */

let renameTargetChatId = null;

function openRenameModal(chatId = null, currentTitle = "") {
  const modal = document.getElementById("renameModal");
  const input = document.getElementById("renameChatInput");

  if (!modal || !input) {
    showToast("Rename modal not found in /index.", "error");
    console.error("Missing renameModal or renameChatInput");
    return;
  }

  renameTargetChatId = chatId || currentChatId;

  if (!renameTargetChatId) {
    showToast("Please select a chat first.", "error");
    return;
  }

  input.value = cleanChatTitle(currentTitle);
  modal.classList.remove("hidden");
  modal.style.display = "flex";

  setTimeout(() => {
    input.focus();
    input.select();
  }, 100);
}

function closeRenameModal() {
  const modal = document.getElementById("renameModal");
  const input = document.getElementById("renameChatInput");

  if (input) {
    input.value = "";
  }

  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }

  renameTargetChatId = null;
}

function cleanChatTitle(title) {
  return String(title || "")
    .replace("📌", "")
    .replace("⋮", "")
    .replace(/\s+/g, " ")
    .trim();
}

function renameCurrentChat() {
  if (!currentChatId) {
    showToast("Please select a chat first.", "error");
    return;
  }

  let currentTitle = "";

  const activeChat = document.querySelector(".chat-item.active-chat");

  if (activeChat) {
    currentTitle = activeChat.textContent || "";
  }

  openRenameModal(currentChatId, currentTitle);
}

async function confirmRenameChat() {
  const input = document.getElementById("renameChatInput");

  if (!input) {
    showToast("Rename input not found.", "error");
    return;
  }

  const newTitle = input.value.trim();

  if (!renameTargetChatId) {
    showToast("No chat selected.", "error");
    return;
  }

  if (!newTitle) {
    showToast("Please enter a chat name.", "warning");
    input.focus();
    return;
  }

  try {
    const res = await fetch(`${API}/rename-chat/${renameTargetChatId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: newTitle
      })
    });

    let data = {};

    try {
      data = await res.json();
    } catch (err) {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.detail || data.error || "Could not rename chat.");
    }

    closeRenameModal();
    showToast("Chat renamed successfully.", "success");

    await loadChats();

  } catch (err) {
    console.error("RENAME CHAT ERROR:", err);
    showToast(err.message || "Could not rename chat.", "error");
  }
}

/* Rename modal keyboard + outside click */
document.addEventListener("DOMContentLoaded", function () {
  const renameInput = document.getElementById("renameChatInput");
  const renameModal = document.getElementById("renameModal");

  if (renameInput) {
    renameInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmRenameChat();
      }

      if (e.key === "Escape") {
        closeRenameModal();
      }
    });
  }

  if (renameModal) {
    renameModal.addEventListener("click", function (e) {
      if (e.target === renameModal) {
        closeRenameModal();
      }
    });
  }
});

/* =========================
   CLEAR / REGENERATE
========================= */

async function clearCurrentChat() {
  if (!currentChatId) {
    showToast("No chat selected.", "warning");
    return;
  }

  const confirmClear = confirm("Clear all messages in this chat?");

  if (!confirmClear) return;

  try {
    const res = await fetch(`${API}/clear-chat/${currentChatId}`, {
      method: "DELETE"
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.detail || "Could not clear chat.", "error");
      return;
    }

    resetChatBoxToWelcome();
    showToast("Chat cleared.", "success");

  } catch (err) {
    console.error("CLEAR CHAT ERROR:", err);
    showToast("Clear chat failed.", "error");
  }
}

async function regenerateResponse() {
  if (!currentChatId) {
    showToast("No chat selected.", "warning");
    return;
  }

  const chatBox = document.getElementById("chatBox");
  const userMessages = chatBox.querySelectorAll(".message.user");

  if (userMessages.length === 0) {
    showToast("No user message found to regenerate.", "warning");
    return;
  }

  const lastUserMessage =
    userMessages[userMessages.length - 1].innerText.trim();

  if (!lastUserMessage) {
    showToast("No message to regenerate.", "warning");
    return;
  }

  const aiDiv = createThinkingMessage();

  try {
    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: getUserId(),
        chat_id: currentChatId,
        message: lastUserMessage
      })
    });

    const data = await res.json();

    aiDiv.classList.remove("loading-message");
    aiDiv.innerHTML = "";

    if (!res.ok) {
      aiDiv.textContent = data.detail || "Regeneration failed.";
      return;
    }

    const aiText = data.response || "No response generated.";

    aiDiv.dataset.rawText = aiText;
    aiDiv.innerHTML = marked.parse(aiText);

    await renderMermaidCharts(aiDiv);

    addMessageTools(aiDiv, aiText);

    await loadChats();

  } catch (err) {
    console.error("REGENERATE ERROR:", err);
    aiDiv.textContent = "Regeneration failed.";
  }
}

/* =========================
   CHAT OPTIONS
========================= */

function closeChatOptions() {
  const modal = document.getElementById("chatOptionsModal");

  if (modal) {
    modal.style.display = "none";
  }
}

async function deleteSelectedChat() {
  if (!selectedChatId) return;

  const confirmDelete = confirm("Delete this chat?");

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API}/delete-chat/${selectedChatId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      showToast("Could not delete chat.", "error");
      return;
    }

    if (currentChatId === selectedChatId) {
      currentChatId = null;
      resetChatBoxToWelcome();
    }

    selectedChatId = null;
    closeChatOptions();
    await loadChats();

    showToast("Chat deleted.", "success");

  } catch (err) {
    console.error("DELETE CHAT ERROR:", err);
    showToast("Could not delete chat.", "error");
  }
}

async function pinSelectedChat() {
  if (!selectedChatId) return;

  try {
    const res = await fetch(`${API}/pin-chat/${selectedChatId}`, {
      method: "PUT"
    });

    if (!res.ok) {
      showToast("Could not pin chat.", "error");
      return;
    }

    closeChatOptions();
    await loadChats();

    showToast("Chat pin status updated.", "success");

  } catch (err) {
    console.error("PIN CHAT ERROR:", err);
    showToast("Could not pin chat.", "error");
  }
}

async function archiveSelectedChat() {
  if (!selectedChatId) return;

  try {
    const res = await fetch(`${API}/archive-chat/${selectedChatId}`, {
      method: "PUT"
    });

    if (!res.ok) {
      showToast("Could not archive chat.", "error");
      return;
    }

    if (currentChatId === selectedChatId) {
      currentChatId = null;
      resetChatBoxToWelcome();
    }

    selectedChatId = null;
    closeChatOptions();
    await loadChats();

    showToast("Chat archived.", "success");

  } catch (err) {
    console.error("ARCHIVE CHAT ERROR:", err);
    showToast("Could not archive chat.", "error");
  }
}

/* =========================================================
   EXPORT FULL CHAT FIX
   Does not refresh chatbot page
========================================================= */

async function exportCurrentChatTxt(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!currentChatId) {
    showToast("Please select a chat first.", "warning");
    return;
  }

  const exportUrl = `${API}/export-chat-txt/${currentChatId}`;

  try {
    const res = await fetch(exportUrl);

    if (!res.ok) {
      throw new Error("Could not export TXT.");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lumina-chat-${currentChatId}.txt`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    showToast("Chat exported as TXT.", "success");
  } catch (err) {
    console.error("EXPORT TXT ERROR:", err);
    showToast("TXT export failed.", "error");
  }
}

async function exportCurrentChatPdf(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!currentChatId) {
    showToast("Please select a chat first.", "warning");
    return;
  }

  const exportUrl = `${API}/export-chat-pdf/${currentChatId}`;

  try {
    const res = await fetch(exportUrl);

    if (!res.ok) {
      throw new Error("Could not export PDF.");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lumina-chat-${currentChatId}.pdf`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    showToast("Chat exported as PDF.", "success");
  } catch (err) {
    console.error("EXPORT PDF ERROR:", err);
    showToast("PDF export failed.", "error");
  }
}
/* =========================
   MESSAGE TOOLS
========================= */

function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast("Copied to clipboard.", "success");
    })
    .catch(() => {
      showToast("Could not copy text.", "error");
    });
}

function addMessageTools(messageDiv, text) {
  if (!messageDiv || messageDiv.querySelector(".ai-bottom-tools")) return;

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "ai-copy-btn";
  copyBtn.innerHTML = "⧉";
  copyBtn.title = "Copy response";

  copyBtn.onclick = function () {
    copyText(text);
  };

  messageDiv.appendChild(copyBtn);

  const bottomTools = document.createElement("div");
  bottomTools.className = "ai-bottom-tools";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "save-note-btn";
  saveBtn.innerHTML = "⭐ Save to Notes";
  saveBtn.title = "Save this response to Notes";

  saveBtn.onclick = function () {
    saveResponseToNotes(text);
  };

  bottomTools.appendChild(saveBtn);

  const exportTxtBtn = document.createElement("button");
  exportTxtBtn.type = "button";
  exportTxtBtn.className = "export-answer-btn";
  exportTxtBtn.innerHTML = "📄 Export TXT";
  exportTxtBtn.title = "Download this answer as TXT";

  exportTxtBtn.onclick = function () {
    exportSingleAnswerTXT(text);
  };

  bottomTools.appendChild(exportTxtBtn);

  const exportPdfBtn = document.createElement("button");
  exportPdfBtn.type = "button";
  exportPdfBtn.className = "export-answer-btn";
  exportPdfBtn.innerHTML = "📕 Export PDF";
  exportPdfBtn.title = "Download this answer as PDF";

  exportPdfBtn.onclick = function () {
    exportSingleAnswerPDF(text);
  };

  bottomTools.appendChild(exportPdfBtn);

  if (looksLikeImagePrompt(text)) {
    const imageBtn = document.createElement("button");
    imageBtn.type = "button";
    imageBtn.className = "send-image-studio-btn";
    imageBtn.innerHTML = "🖼 Send to Image Studio";
    imageBtn.title = "Open this prompt in Image Studio";

    imageBtn.onclick = function () {
      sendPromptToImageStudio(text);
    };

    bottomTools.appendChild(imageBtn);
  }

  messageDiv.appendChild(bottomTools);
}

function cleanMarkdownForExport(text) {
  return String(text || "")
    .replace(/```mermaid/g, "Mermaid Flowchart:\n")
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/\|/g, " | ")
    .trim();
}

function createAnswerFileName(extension) {
  const now = new Date();

  const datePart = now
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-");

  return `lumina-answer-${datePart}.${extension}`;
}

function exportSingleAnswerTXT(text) {
  if (!text || !text.trim()) {
    showToast("Nothing to export.", "warning");
    return;
  }

  const cleanText = cleanMarkdownForExport(text);

  const fileContent = `Lumina AI - Exported Answer

Generated on: ${new Date().toLocaleString()}

----------------------------------------

${cleanText}
`;

  const blob = new Blob([fileContent], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = createAnswerFileName("txt");
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  showToast("Answer exported as TXT.", "success");
}

function exportSingleAnswerPDF(text) {
  if (!text || !text.trim()) {
    showToast("Nothing to export.", "warning");
    return;
  }

  const cleanText = cleanMarkdownForExport(text);
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    showToast("Popup blocked. Please allow popups to export PDF.", "error");
    return;
  }

  const safeText = escapeHTML(cleanText).replace(/\n/g, "<br>");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lumina Answer Export</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 36px;
          color: #111827;
          line-height: 1.65;
        }

        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 14px;
          margin-bottom: 24px;
        }

        .logo {
          font-size: 26px;
          font-weight: 900;
          color: #2563eb;
        }

        .meta {
          margin-top: 6px;
          color: #64748b;
          font-size: 13px;
        }

        .answer-box {
          font-size: 15px;
          white-space: normal;
        }

        @media print {
          button {
            display: none;
          }
        }

        .print-btn {
          margin-bottom: 24px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-weight: 800;
          cursor: pointer;
        }
      </style>
    </head>

    <body>
      <button class="print-btn" onclick="window.print()">Download / Print PDF</button>

      <div class="header">
        <div class="logo">✨ Lumina AI</div>
        <div class="meta">Exported on ${new Date().toLocaleString()}</div>
      </div>

      <div class="answer-box">
        ${safeText}
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();

  showToast("PDF export opened.", "success");
}

/* =========================
   NOTES
========================= */

async function saveResponseToNotes(text) {
  if (isGuestUser()) {
    showLoginRequiredModal("Please login to save notes.");
    return;
  }

  const user_id = getUserId();

  if (!user_id) {
    showToast("Please login first.", "error");
    return;
  }

  if (!text || !text.trim()) {
    showToast("Nothing to save.", "warning");
    return;
  }

  const title = createNoteTitle(text);
  const category = detectNoteCategory(text);

  try {
    const res = await fetch(`${API}/save-note`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id,
        title,
        content: text,
        category
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not save note.");
    }

    showToast("Saved to Notes.", "success");

  } catch (err) {
    console.error("SAVE NOTE ERROR:", err);
    showToast(err.message || "Could not save note.", "error");
  }
}

function createNoteTitle(text) {
  const cleanText = String(text || "")
    .replace(/[#*_`>\-\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleanText.split(" ").slice(0, 8).join(" ") || "Saved Note";
}

function detectNoteCategory(text) {
  const lower = String(text || "").toLowerCase();

  if (
    lower.includes("```") ||
    lower.includes("function") ||
    lower.includes("class") ||
    lower.includes("python") ||
    lower.includes("javascript") ||
    lower.includes("html") ||
    lower.includes("css")
  ) {
    return "Code";
  }

  if (
    lower.includes("image prompt") ||
    lower.includes("cinematic") ||
    lower.includes("photorealistic") ||
    lower.includes("anime") ||
    lower.includes("style suggestions")
  ) {
    return "Image Prompt";
  }

  if (
    lower.includes("exam") ||
    lower.includes("viva") ||
    lower.includes("definition") ||
    lower.includes("advantages") ||
    lower.includes("disadvantages")
  ) {
    return "Study";
  }

  return "General";
}

/* =========================
   IMAGE STUDIO SEND
========================= */

function looksLikeImagePrompt(text) {
  if (!text) return false;

  const lowerText = String(text).toLowerCase();

  const imageKeywords = [
    "image prompt",
    "poster prompt",
    "logo prompt",
    "generate an image",
    "create an image",
    "visual prompt",
    "style suggestions",
    "aspect ratio",
    "cinematic lighting",
    "ultra detailed",
    "photorealistic",
    "anime style",
    "3d render",
    "watercolor"
  ];

  return imageKeywords.some(keyword => lowerText.includes(keyword));
}

function extractImagePrompt(text) {
  if (!text) return "";

  const imagePromptMatch = String(text).match(
    /(?:##|###)?\s*Image Prompt\s*[:\-]?\s*([\s\S]*?)(?=\n##|\n###|\n\*\*Style|\nStyle Suggestions|\nAspect Ratio|$)/i
  );

  if (imagePromptMatch && imagePromptMatch[1]) {
    return imagePromptMatch[1].replace(/```/g, "").trim();
  }

  const quotedMatch = String(text).match(/["“](.*?)["”]/s);

  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1].trim();
  }

  return String(text)
    .replace(/#+\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/Style Suggestions[\s\S]*/i, "")
    .replace(/Recommended Aspect Ratio[\s\S]*/i, "")
    .replace(/Aspect Ratio[\s\S]*/i, "")
    .trim();
}

function sendPromptToImageStudio(text) {
  if (isGuestUser()) {
    showLoginRequiredModal("Please login to use Image Studio.");
    return;
  }

  const prompt = extractImagePrompt(text);

  if (!prompt) {
    showToast("No image prompt found.", "warning");
    return;
  }

  localStorage.setItem("lumina_image_prompt", prompt);

  showToast("Prompt sent to Image Studio.", "success");

  setTimeout(() => {
    window.location.href = "/imagel";
  }, 500);
}

/* =========================
   FEATURE NAVIGATION
========================= */

function openFeaturePage(page) {
  if (isGuestUser() && (page === "/image" || page === "/voice")) {
    showLoginRequiredModal("Please login to use Image Studio and Voice Studio.");
    return;
  }

  window.location.href = page;
}

function showLoginRequiredModal(message) {
  const modal = document.getElementById("guestLockModal");
  const messageBox = document.getElementById("guestLockMessage");

  if (messageBox) {
    messageBox.textContent = message || "Please login to use this feature.";
  }

  if (modal) {
    modal.style.display = "flex";
  }
}

function closeLoginRequiredModal() {
  const modal = document.getElementById("guestLockModal");

  if (modal) {
    modal.style.display = "none";
  }
}

/* =========================
   SEARCH
========================= */

function setupChatSearch() {
  const searchInput = document.getElementById("searchChat");

  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    const value = searchInput.value.toLowerCase();
    const chats = document.querySelectorAll(".chat-wrapper");

    chats.forEach(wrapper => {
      const text = wrapper.innerText.toLowerCase();
      wrapper.style.display = text.includes(value) ? "flex" : "none";
    });
  });
}

function searchInsideMessages() {
  const searchInput = document.getElementById("messageSearchInput");
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const messages = document.querySelectorAll(".message");

  messages.forEach(message => {
    message.classList.remove("search-match");
    message.classList.remove("search-hidden");

    const text = message.innerText.toLowerCase();

    if (!query) {
      return;
    }

    if (text.includes(query)) {
      message.classList.add("search-match");
    } else {
      message.classList.add("search-hidden");
    }
  });

  scrollToFirstMatch();
}

function scrollToFirstMatch() {
  const firstMatch = document.querySelector(".message.search-match");

  if (firstMatch) {
    firstMatch.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

function clearMessageSearch() {
  const searchInput = document.getElementById("messageSearchInput");

  if (searchInput) {
    searchInput.value = "";
  }

  const messages = document.querySelectorAll(".message");

  messages.forEach(message => {
    message.classList.remove("search-match");
    message.classList.remove("search-hidden");
  });
}

/* =========================
   SIGN OUT
========================= */

function signOut() {
  const savedTheme = localStorage.getItem("lumina_theme");

  localStorage.removeItem("guest_mode");
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("full_name");
  localStorage.removeItem("email");
  localStorage.removeItem("username");
  localStorage.removeItem("avatar");
  localStorage.removeItem("open_chat_id");
  localStorage.removeItem("open_archived_chat");

  if (savedTheme) {
    localStorage.setItem("lumina_theme", savedTheme);
  }

  window.location.href = "/auth";
}

/* =========================
   VOICE INPUT / SPEECH TO TEXT
========================= */

function startVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const messageInput = getMessageInput();
  const micButton = document.querySelector(".mic-btn");

  if (!messageInput) {
    showToast("Message input not found.", "error");
    return;
  }

  if (!SpeechRecognition) {
    showToast("Speech recognition is not supported in this browser.", "error");
    return;
  }

  if (isLuminaListening && luminaRecognition) {
    luminaRecognition.stop();
    return;
  }

  luminaRecognition = new SpeechRecognition();

  luminaRecognition.lang = "en-IN";
  luminaRecognition.continuous = false;
  luminaRecognition.interimResults = true;

  isLuminaListening = true;

  if (micButton) {
    micButton.classList.add("listening");
    micButton.title = "Listening...";
  }

  showVoiceListeningUI();

  const baseText = messageInput.value.trim();
  let finalTranscript = "";

  luminaRecognition.onresult = function (event) {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }

    messageInput.value = [baseText, finalTranscript, interimTranscript]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    autoResizeMessageInput(messageInput);
  };

  luminaRecognition.onerror = function (event) {
    console.error("VOICE INPUT ERROR:", event.error);

    if (event.error === "not-allowed") {
      showToast("Microphone permission denied.", "error");
    } else if (event.error === "no-speech") {
      showToast("No speech detected. Try again.", "warning");
    } else {
      showToast("Voice input failed. Try again.", "error");
    }

    stopLuminaVoiceInput();
  };

  luminaRecognition.onend = function () {
    stopLuminaVoiceInput();
  };

  try {
    luminaRecognition.start();
  } catch (err) {
    console.error("VOICE START ERROR:", err);
    stopLuminaVoiceInput();
  }
}

function stopLuminaVoiceInput() {
  const micButton = document.querySelector(".mic-btn");

  isLuminaListening = false;

  if (micButton) {
    micButton.classList.remove("listening");
    micButton.title = "Voice input";
  }

  hideVoiceListeningUI();
}

/* Safe alias because older HTML/code may call toggleVoiceInput() */
function toggleVoiceInput() {
  startVoiceInput();
}

function showVoiceListeningUI() {
  let voiceBox = document.getElementById("voiceListeningBox");

  if (!voiceBox) {
    voiceBox = document.createElement("div");
    voiceBox.id = "voiceListeningBox";
    voiceBox.className = "voice-listening-box";

    voiceBox.innerHTML = `
      <div class="voice-wave">▮▮▮</div>
      <div class="voice-mic">🎙</div>
      <div>
        <strong>Listening...</strong>
        <span>Speak now</span>
      </div>
    `;

    document.querySelector(".main")?.appendChild(voiceBox);
  }

  voiceBox.classList.add("show");
}

function hideVoiceListeningUI() {
  const voiceBox = document.getElementById("voiceListeningBox");

  if (voiceBox) {
    voiceBox.classList.remove("show");
  }
}

/* =========================
   CHAT INPUT BEHAVIOR
========================= */

function setupChatInputBehavior() {
  if (chatInputSetupDone) return;

  const messageInput = getMessageInput();

  if (!messageInput) {
    console.error("messageInput not found.");
    return;
  }

  messageInput.addEventListener("input", function () {
    autoResizeMessageInput(messageInput);
  });

  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      const message = messageInput.value.trim();

      if (!message && !selectedChatFile) return;

      sendMessage();
      return;
    }

    if (event.key === "Enter" && event.shiftKey) {
      setTimeout(function () {
        autoResizeMessageInput(messageInput);
      }, 0);
    }
  });

  autoResizeMessageInput(messageInput);
  chatInputSetupDone = true;
}

function autoResizeMessageInput(textarea) {
  if (!textarea) return;

  textarea.style.height = "42px";

  const newHeight = Math.min(textarea.scrollHeight, 120);
  textarea.style.height = newHeight + "px";

  textarea.style.overflowY = "hidden";
}

/*
  Do NOT delete this.
  Some older code expects setupEnterKeySend() to exist.
  Now it safely runs the new input behavior.
*/
function setupEnterKeySend() {
  setupChatInputBehavior();
}

/* =========================
   MOBILE SIDEBAR + OPTIONS
========================= */

function toggleChatSidebar() {
  const sidebar =
    document.querySelector(".chat-sidebar") ||
    document.querySelector(".sidebar") ||
    document.getElementById("chatSidebar");

  const overlay = document.getElementById("chatSidebarOverlay");

  if (!sidebar) {
    console.error("Chat sidebar not found.");
    return;
  }

  sidebar.classList.toggle("open");

  if (overlay) {
    overlay.classList.toggle("show");
  }
}

function closeChatSidebar() {
  const sidebar =
    document.querySelector(".chat-sidebar") ||
    document.querySelector(".sidebar") ||
    document.getElementById("chatSidebar");

  const overlay = document.getElementById("chatSidebarOverlay");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  if (overlay) {
    overlay.classList.remove("show");
  }
}

/* =========================================================
   MOBILE OPTIONS PANEL FINAL FIX
========================================================= */

function toggleMobileChatOptions() {
  const panel = document.getElementById("mobileChatOptions");

  if (!panel) {
    console.error("mobileChatOptions panel not found.");
    showToast("Mobile options panel not found.", "error");
    return;
  }

  const isOpen = panel.classList.contains("show");

  if (isOpen) {
    panel.classList.remove("show");
    panel.classList.add("hidden");
  } else {
    panel.classList.remove("hidden");
    panel.classList.add("show");
  }
}

function closeMobileChatOptions() {
  const panel = document.getElementById("mobileChatOptions");

  if (!panel) return;

  panel.classList.remove("show");
  panel.classList.add("hidden");
}

/* =========================
   USER PLAN
========================= */

async function loadUserPlan() {
  const userId = localStorage.getItem("user_id");

  if (!userId) return;

  try {
    const res = await fetch(`${API}/user-plan/${userId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Could not load plan.");
    }

    const creditsBox =
      document.getElementById("userCredits") ||
      document.getElementById("chatUserCredits");

    const planBox =
      document.getElementById("userPlanName") ||
      document.getElementById("chatUserPlanName");

    if (creditsBox) {
      creditsBox.textContent = `${data.credits} / ${data.monthly_credit_limit}`;
    }

    if (planBox) {
      planBox.textContent = `${capitalizePlan(data.plan)} Plan`;
    }

  } catch (err) {
    console.error("LOAD USER PLAN ERROR:", err);
  }
}

function capitalizePlan(plan) {
  const value = String(plan || "free");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* =========================
   PAGE LOAD + EVENT BINDINGS
========================= */

document.addEventListener("DOMContentLoaded", function () {
  const renameInput = document.getElementById("renameChatInput");
  const renameModal = document.getElementById("renameModal");

  if (renameInput) {
    renameInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmRenameChat();
      }

      if (e.key === "Escape") {
        closeRenameModal();
      }
    });
  }

  if (renameModal) {
    renameModal.addEventListener("click", function (e) {
      if (e.target === renameModal) {
        closeRenameModal();
      }
    });
  }
});

window.addEventListener("resize", function () {
  if (window.innerWidth > 900) {
    closeChatSidebar();
    closeMobileChatOptions();
  }
});

window.addEventListener("load", async function () {
  applyLuminaTheme();
  initializeMermaidByTheme();
  setupGuestModeBanner();

  /*
    setupEnterKeySend is intentionally kept.
    It now calls setupChatInputBehavior safely.
  */
  setupEnterKeySend();

  setupChatSearch();

  const fileInput = document.getElementById("chatFileInput");

  if (fileInput) {
    fileInput.addEventListener("change", handleSelectedChatFile);
  }

  await loadChats();
  await loadUserPlan();
  showChatWelcomeIfEmpty();

  const archivedChatToOpen = localStorage.getItem("open_archived_chat");

  if (archivedChatToOpen) {
    localStorage.removeItem("open_archived_chat");
    loadMessages(archivedChatToOpen);
    return;
  }

  const chatToOpen = localStorage.getItem("open_chat_id");

  if (chatToOpen) {
    localStorage.removeItem("open_chat_id");
    loadMessages(chatToOpen);
  }
});

  const pendingPrompt = localStorage.getItem("lumina_pending_prompt");

if (pendingPrompt) {
  localStorage.removeItem("lumina_pending_prompt");

  const input = getMessageInput();

  if (input) {
    input.value = pendingPrompt;
    autoResizeMessageInput(input);
    input.focus();
  }
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

  const limitedActivities = oldActivities.slice(0, 200);

  localStorage.setItem("lumina_activity_history", JSON.stringify(limitedActivities));
}