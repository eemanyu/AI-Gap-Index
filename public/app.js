(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const scoreNumber = $("#score-number");
  const scoreStatus = $("#score-status");
  const scoreInterpretation = $("#score-interpretation");
  const scoreSummary = $("#score-summary");
  const gaugeNeedle = $("#gauge-needle");
  const gaugeTitle = $("#gauge-svg-title");
  const gaugeDesc = $("#gauge-svg-desc");

  const labelForScore = (score) => {
    if (score >= 70) return "Clear Anthropic edge";
    if (score > 50) return "Slight Anthropic edge";
    if (score === 50) return "Editorial parity";
    if (score >= 30) return "Slight OpenAI edge";
    return "Clear OpenAI edge";
  };

  function updateGauge(score, label, summary) {
    const safeScore = Math.max(0, Math.min(100, Number(score) || 50));
    const scoreText = String(safeScore);
    if (scoreNumber) scoreNumber.textContent = scoreText;
    if (scoreStatus) scoreStatus.innerHTML = '<span class="status-dot" aria-hidden="true"></span> ' + labelForScore(safeScore);
    if (scoreInterpretation) scoreInterpretation.textContent = label || (safeScore === 50 ? "The race is at parity." : safeScore > 50 ? "Anthropic holds a narrow relative edge." : "OpenAI holds a narrow relative edge.");
    if (scoreSummary && summary) scoreSummary.textContent = summary;
    if (gaugeNeedle) gaugeNeedle.style.transform = `rotate(${(safeScore * 1.8) - 180}deg)`;
    if (gaugeTitle) gaugeTitle.textContent = `GAP Index score: ${safeScore} out of 100`;
    if (gaugeDesc) gaugeDesc.textContent = `A semicircular gauge from OpenAI edge at zero, through parity at fifty, to Anthropic edge at one hundred. Current reading: ${safeScore}.`;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }).format(date).toUpperCase();
  }

  function safeExternalLink(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  function renderNews(items) {
    const root = $("#news-grid");
    if (!root || !Array.isArray(items) || items.length < 3) return;
    const selection = items.slice(0, 3);
    const fragment = document.createDocumentFragment();

    selection.forEach((item, index) => {
      const safeUrl = safeExternalLink(item.url);
      if (!safeUrl) return;
      const card = document.createElement("article");
      card.className = "news-card" + (index === 0 ? " news-featured" : "");

      const top = document.createElement("div");
      top.className = "news-card-top";
      const tag = document.createElement("span");
      tag.className = "news-tag " + (/anthropic|claude/i.test(item.publisher + " " + item.title) ? "tag-anthropic" : "tag-openai");
      tag.textContent = String(item.publisher || "AI NEWS").slice(0, 28).toUpperCase();
      const date = document.createElement("time");
      if (item.publishedAt) date.dateTime = new Date(item.publishedAt).toISOString();
      date.textContent = formatDate(item.publishedAt);
      top.append(tag, date);

      const heading = document.createElement("h3");
      const link = document.createElement("a");
      link.href = safeUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = String(item.title || "AI industry update").slice(0, 180);
      heading.append(link);

      const description = document.createElement("p");
      description.textContent = String(item.summary || "Open the source for the full report.").slice(0, 240);

      const bottom = document.createElement("div");
      bottom.className = "news-card-bottom";
      const category = document.createElement("span");
      category.textContent = String(item.category || "AI NEWS").slice(0, 40).toUpperCase();
      const sourceLink = document.createElement("a");
      sourceLink.href = safeUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      sourceLink.textContent = "READ STORY ↗";
      sourceLink.setAttribute("aria-label", "Read " + String(item.publisher || "source") + " story");
      bottom.append(category, sourceLink);
      card.append(top, heading, description, bottom);
      fragment.append(card);
    });

    if (fragment.childNodes.length >= 3) root.replaceChildren(fragment);
    const indicator = $("#news-refresh");
    if (indicator) indicator.lastChild.textContent = " LIVE RSS + CURATED";
  }

  function renderSelectedMonth(point) {
    const root = $("#selected-month");
    if (!root || !point) return;
    const main = $(".selected-month-main", root);
    const score = $(".selected-month-score", root);
    const sources = $(".selected-month-sources", root);
    if (!main || !score || !sources) return;

    const selectedDate = $(".selected-kicker", main);
    if (selectedDate) selectedDate.textContent = "SELECTED MONTH · " + String(point.label || "").toUpperCase();
    const title = $("h3", main);
    if (title) title.textContent = point.phase || labelForScore(point.score);
    const copy = $("p", main);
    if (copy) copy.textContent = point.summary || "";

    const scoreNumber = $("strong", score);
    if (scoreNumber) {
      scoreNumber.replaceChildren();
      scoreNumber.append(document.createTextNode(String(point.score)));
      const small = document.createElement("small");
      small.textContent = "/100";
      scoreNumber.append(small);
    }
    const status = $(".mini-status", score);
    if (status) status.textContent = labelForScore(point.score);

    const titleLabel = $(".selected-kicker", sources);
    sources.replaceChildren();
    const label = document.createElement("span");
    label.className = "selected-kicker";
    label.textContent = titleLabel?.textContent || "KEY SOURCES";
    sources.append(label);
    (point.sources || []).slice(0, 3).forEach((source) => {
      const url = safeExternalLink(source.url);
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = source.title + " ↗";
      sources.append(link);
    });

    $$(".history-bar").forEach((bar) => {
      const active = bar.dataset.month === point.month;
      bar.classList.toggle("is-selected", active);
      bar.setAttribute("aria-pressed", active ? "true" : "false");
    });
    $$(".timeline-entry").forEach((entry) => {
      const active = entry.id === "history-" + point.month;
      entry.classList.toggle("is-current", active);
      const details = $("details", entry);
      if (details) details.open = active;
    });
  }

  async function loadIndexData() {
    try {
      const response = await fetch("/api/index.json", { headers: { accept: "application/json" }, cache: "no-cache" });
      if (!response.ok) return;
      const payload = await response.json();
      if (Number.isFinite(payload.score)) {
        updateGauge(payload.score, labelForScore(payload.score), payload.history?.at(-1)?.summary ? payload.history.at(-1).summary.slice(0, 210) : "");
      }
      if (Array.isArray(payload.history)) {
        const current = payload.history.at(-1);
        payload.history.forEach((point) => {
          const bar = $('.history-bar[data-month="' + point.month + '"]');
          if (bar) {
            $(".bar-value", bar).textContent = String(point.score);
            const fill = $(".bar-track i", bar);
            if (fill) fill.style.height = Math.max(0, Math.min(100, point.score)) + "%";
            bar.setAttribute("aria-label", point.label + ", score " + point.score);
          }
        });
        $$(".history-bar").forEach((bar) => {
          bar.addEventListener("click", () => {
            const point = payload.history.find((item) => item.month === bar.dataset.month);
            if (point) renderSelectedMonth(point);
          });
        });
        if (current) renderSelectedMonth(current);
      }
    } catch {
      // The server-rendered score and monthly history remain usable offline.
    }
  }

  async function loadNews() {
    try {
      const response = await fetch("/api/news.json", { headers: { accept: "application/json" }, cache: "no-cache" });
      if (!response.ok) return;
      const payload = await response.json();
      renderNews(payload.items);
    } catch {
      // Keep the source-linked headlines rendered in the HTML.
    }
  }

  const menuToggle = $(".menu-toggle");
  const mobileNav = $("#mobile-nav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      mobileNav.hidden = isOpen;
    });
    $$("a", mobileNav).forEach((link) => link.addEventListener("click", () => {
      mobileNav.hidden = true;
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
    }));
  }

  const newsletterForm = $("#newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailInput = $("#newsletter-email");
      const consentInput = $('input[name="consent"]', newsletterForm);
      const honeypot = $('input[name="company"]', newsletterForm);
      const submit = $("#newsletter-submit");
      const message = $("#form-message");
      if (!(emailInput instanceof HTMLInputElement) || !(consentInput instanceof HTMLInputElement) || !(honeypot instanceof HTMLInputElement) || !submit || !message) return;

      submit.disabled = true;
      submit.textContent = "Submitting…";
      message.classList.remove("is-success", "is-error");
      message.textContent = "Submitting your signup securely…";
      try {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            consent: consentInput.checked,
            company: honeypot.value
          })
        });
        const result = await response.json();
        message.textContent = result.message || (result.ok ? "Signup received." : "Unable to submit the signup.");
        message.classList.add(result.ok ? "is-success" : "is-error");
        if (result.ok) {
          if (result.delivery === "resend") {
            newsletterForm.reset();
          } else {
            // This server has recorded the address locally, but no mailing provider has been configured.
            emailInput.value = "";
            consentInput.checked = false;
          }
        }
      } catch {
        message.textContent = "The signup service is unavailable right now. Please try again later.";
        message.classList.add("is-error");
      } finally {
        submit.disabled = false;
        submit.innerHTML = 'Get the brief <span aria-hidden="true">↗</span>';
      }
    });
  }

  const unsubscribeForm = $("#unsubscribe-form");
  if (unsubscribeForm) {
    unsubscribeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailInput = $("#unsubscribe-email");
      const honeypot = $('input[name="company"]', unsubscribeForm);
      const submit = $("#unsubscribe-submit");
      const message = $("#unsubscribe-message");
      if (!(emailInput instanceof HTMLInputElement) || !(honeypot instanceof HTMLInputElement) || !submit || !message) return;
      submit.disabled = true;
      submit.textContent = "Submitting…";
      message.classList.remove("is-success", "is-error");
      message.textContent = "Updating your subscription…";
      try {
        const response = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ email: emailInput.value.trim(), company: honeypot.value })
        });
        const result = await response.json();
        message.textContent = result.message || (result.ok ? "The request was received." : "Unable to update this subscription.");
        message.classList.add(result.ok ? "is-success" : "is-error");
        if (result.ok) emailInput.value = "";
      } catch {
        message.textContent = "The subscription service is unavailable right now. Please try again later.";
        message.classList.add("is-error");
      } finally {
        submit.disabled = false;
        submit.innerHTML = 'Unsubscribe <span aria-hidden="true">↗</span>';
      }
    });
  }

  const footerYear = $("#footer-year");
  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  // Core Web Vitals can be inspected in DevTools; this page deliberately avoids analytics payloads.
  void loadIndexData();
  void loadNews();
})();
