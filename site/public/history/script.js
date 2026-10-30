function recordStatus(record) {
  return record.merged_at ? "merged" : record.state;
}

function snapshotCounts(data) {
  return {
    totalIssues: data.issues.length,
    openIssues: data.issues.filter((record) => recordStatus(record) === "open").length,
    closedIssues: data.issues.filter((record) => recordStatus(record) === "closed").length,
    totalPrs: data.prs.length,
    mergedPrs: data.prs.filter((record) => recordStatus(record) === "merged").length,
    openPrs: data.prs.filter((record) => recordStatus(record) === "open").length,
  };
}

function filterRecords(records, query, status) {
  const search = query.trim().toLowerCase();
  return records.filter((record) => {
    const text = [`#${record.number}`, record.title, record.author, record.summary, ...record.labels].join(" ").toLowerCase();
    return (status === "all" || recordStatus(record) === status) && text.includes(search);
  }).sort((a, b) => (a.created_at || "").localeCompare(b.created_at || "") || a.number - b.number);
}

function historyEvents(records) {
  return records.flatMap((record) => {
    const events = [];
    if (record.created_at) events.push({ record, action: "Opened", date: record.created_at });
    if (record.merged_at) events.push({ record, action: "Merged", date: record.merged_at });
    else if (record.closed_at) events.push({ record, action: "Closed", date: record.closed_at });
    return events;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.record.number - b.record.number);
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function sourceLink(record, kind, text, fragment = "") {
  const link = element("a", text);
  link.href = `https://github.com/${dashboardData.repository}/${kind === "issue" ? "issues" : "pull"}/${record.number}${fragment}`;
  return link;
}

function dateElement(date) {
  const time = element("time", new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC",
  }).format(new Date(date)) + " UTC");
  time.dateTime = date;
  return time;
}

function renderHistory(kind, records) {
  const list = document.getElementById(`${kind}Records`);
  const timeline = document.getElementById(`${kind}Timeline`);
  list.replaceChildren();
  timeline.replaceChildren();
  if (!records.length) {
    list.append(element("li", "No matching records. Try another search or choose All statuses.", "empty"));
    timeline.append(element("li", "No events for the current filters.", "empty"));
    return;
  }
  for (const record of records) {
    const item = element("li", undefined, "record");
    const status = recordStatus(record);
    const statusLabel = { open: "Open", closed: kind === "pr" ? "Closed without merge" : "Closed", merged: "Merged" }[status];
    const heading = element("h3");
    heading.append(sourceLink(record, kind, `#${record.number} · ${record.title}`));
    item.append(element("span", statusLabel + (record.draft ? " · Draft" : ""), `pill ${status}`), heading);
    item.append(element("p", `By ${record.author}${kind === "issue" ? ` · ${record.comments} comments` : ""}`, "metadata"));
    const labels = element("p", undefined, "metadata");
    labels.append(document.createTextNode("Labels: "));
    if (!record.labels.length) labels.append(document.createTextNode("None"));
    for (const label of record.labels) labels.append(element("span", label, "label"));
    item.append(labels, element("p", record.summary));
    const citation = element("p", `Summary source: ${record.summarySource}. `, "metadata");
    citation.append(sourceLink(record, kind, "Full discussion", record.discussion));
    item.append(citation);
    const dates = element("dl", undefined, "dates");
    for (const [field, label] of [["created_at", "Opened"], ["updated_at", "Updated"], ["closed_at", "Closed"], ["merged_at", "Merged"]]) {
      if (!record[field]) continue;
      const value = element("dd");
      value.append(dateElement(record[field]));
      dates.append(element("dt", label), value);
    }
    item.append(dates);
    list.append(item);
  }
  for (const event of historyEvents(records)) {
    const item = element("li");
    item.append(dateElement(event.date), element("span", `${event.action} · `));
    item.append(sourceLink(event.record, kind, `#${event.record.number} · ${event.record.title}`));
    timeline.append(item);
  }
}

function initDashboard() {
  for (const [id, count] of Object.entries(snapshotCounts(dashboardData))) {
    document.getElementById(id).textContent = String(count);
  }
  document.getElementById("snapshot-source").textContent =
    `${dashboardData.source} Not live activity. ${dashboardData.scope}`;
  for (const [kind, records] of [["issue", dashboardData.issues], ["pr", dashboardData.prs]]) {
    const search = document.getElementById(`${kind}Search`);
    const status = document.getElementById(`${kind}Status`);
    const update = () => {
      const matches = filterRecords(records, search.value, status.value);
      document.getElementById(`${kind}Results`).textContent =
        `Showing ${matches.length} of ${records.length} snapshot ${kind === "issue" ? "issues" : "pull requests"}.`;
      renderHistory(kind, matches);
    };
    search.disabled = false;
    status.disabled = false;
    search.addEventListener("input", update);
    status.addEventListener("change", update);
    update();
  }
}

if (typeof document !== "undefined") initDashboard();
