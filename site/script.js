const dashboardData = {
  stats: {
    totalIssues: 12,
    openIssues: 3,
    closedIssues: 9,
    totalPrs: 10,
    mergedPrs: 8,
    openPrs: 2,
  },
  issues: [
    {
      date: "2026-07-10",
      title: "Issue triage baseline created",
      detail: "Initial labeling pass completed for backlog organization.",
    },
    {
      date: "2026-08-02",
      title: "Bug report cluster identified",
      detail: "Several related workflow edge cases were grouped and tracked.",
    },
    {
      date: "2026-09-14",
      title: "Documentation issue sweep",
      detail: "Docs clarity improvements captured as follow-up tasks.",
    },
  ],
  prs: [
    {
      date: "2026-07-18",
      title: "First workflow refinements merged",
      detail: "Core prompt and automation tweaks were merged into default branch.",
    },
    {
      date: "2026-08-22",
      title: "UI/content alignment PR",
      detail: "Repository messaging and examples were standardized.",
    },
    {
      date: "2026-09-29",
      title: "Maintenance batch PR",
      detail: "Minor cleanups and consistency fixes merged.",
    },
  ],
};

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = String(value);
}

function formatDate(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderTimeline(listId, events, kind) {
  const list = document.getElementById(listId);
  if (!list) return;

  list.innerHTML = "";

  events
    .slice()
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .forEach((event) => {
      const li = document.createElement("li");
      if (kind === "pr") li.classList.add("pr");

      const time = document.createElement("time");
      time.dateTime = event.date;
      time.textContent = formatDate(event.date);

      const title = document.createElement("p");
      title.className = "event-title";
      title.textContent = event.title;

      const detail = document.createElement("p");
      detail.className = "event-detail";
      detail.textContent = event.detail;

      li.append(time, title, detail);
      list.appendChild(li);
    });
}

(function init() {
  const { stats, issues, prs } = dashboardData;

  Object.entries(stats).forEach(([key, value]) => setText(key, value));
  renderTimeline("issueTimeline", issues, "issue");
  renderTimeline("prTimeline", prs, "pr");
})();
