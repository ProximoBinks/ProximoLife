document.querySelectorAll<HTMLFormElement>("[data-json-form]").forEach(form => {
  let pending = false;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (pending) return;
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    const status = form.querySelector<HTMLElement>("[data-status]")!;
    const values: Record<string, unknown> = Object.fromEntries(new FormData(form));
    if (form.id === "new-post-form") {
      values.tags = String(values.tags ?? "").split(",").map(t => t.trim()).filter(Boolean);
      values.isPublic = values.private !== "on"; delete values.private;
    }
    const label = button.innerHTML;
    pending = true; button.disabled = true; button.textContent = "Sending…"; form.setAttribute("aria-busy", "true"); status.textContent = "";
    try {
      const response = await fetch(form.action, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Couldn’t send this. Please try again.");
      status.dataset.error = "false";
      if (form.id === "new-post-form") { window.location.assign(`/blog/${encodeURIComponent(result.slug)}`); return; }
      status.textContent = "Message sent. Thanks for getting in touch."; form.reset();
    } catch (error) { status.dataset.error = "true"; status.textContent = error instanceof Error ? error.message : "Couldn’t send this. Please try again."; }
    finally { pending = false; button.disabled = false; button.innerHTML = label; form.removeAttribute("aria-busy"); }
  });
});
