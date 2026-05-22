/* =========================================================
   LUMINA GLOBAL ACTIVITY LOGGER
   Use this file on every Lumina page
========================================================= */

function logLuminaActivity(type, title, description = "") {
  try {
    if (localStorage.getItem("guest_mode") === "true") return;

    const activity = {
      id: crypto.randomUUID ? crypto.randomUUID() : "activity_" + Date.now(),
      type,
      title,
      description,
      page: window.location.pathname.split("/").pop() || "unknown",
      created_at: new Date().toISOString()
    };

    const oldActivities = JSON.parse(
      localStorage.getItem("lumina_activity_history") || "[]"
    );

    oldActivities.unshift(activity);

    localStorage.setItem(
      "lumina_activity_history",
      JSON.stringify(oldActivities.slice(0, 300))
    );

    console.log("Activity logged:", activity);

  } catch (err) {
    console.error("ACTIVITY LOG ERROR:", err);
  }
}
