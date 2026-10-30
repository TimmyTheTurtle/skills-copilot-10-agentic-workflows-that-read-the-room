import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = vm.createContext({});
for (const file of ["snapshot.js", "script.js"]) {
  vm.runInContext(readFileSync(new URL(`./public/history/${file}`, import.meta.url), "utf8"), context);
}
const evaluate = (expression) => JSON.parse(JSON.stringify(vm.runInContext(expression, context)));

test("snapshot separates all six issues from five PRs and derives totals", () => {
  assert.deepEqual(evaluate("dashboardData.issues.map(r => r.number)"), [1, 5, 7, 8, 9, 11]);
  assert.deepEqual(evaluate("dashboardData.prs.map(r => r.number)"), [2, 3, 4, 6, 10]);
  assert.deepEqual(evaluate("snapshotCounts(dashboardData)"), {
    totalIssues: 6, openIssues: 4, closedIssues: 2,
    totalPrs: 5, mergedPrs: 4, openPrs: 1,
  });
});

test("search handles case, whitespace, numbers, authors, labels and summaries", () => {
  assert.equal(evaluate('filterRecords(dashboardData.issues, " MISSING ", "all").length'), 4);
  assert.deepEqual(evaluate('filterRecords(dashboardData.issues, "#11", "open").map(r => r.number)'), [11]);
  assert.equal(evaluate('filterRecords(dashboardData.issues, "agentic-workflows", "open").length'), 4);
  assert.equal(evaluate('filterRecords(dashboardData.prs, "timmytheturtle", "merged").length'), 3);
  assert.equal(evaluate('filterRecords(dashboardData.issues, "parse_error", "all").length'), 1);
  assert.equal(evaluate('filterRecords(dashboardData.prs, "not-in-any-record", "all").length'), 0);
});

test("filters distinguish merged, unmerged closed, and open drafts", () => {
  assert.equal(evaluate('filterRecords(dashboardData.prs, "", "closed").length'), 0);
  assert.equal(evaluate('filterRecords(dashboardData.prs, "", "merged").length'), 4);
  assert.deepEqual(evaluate('filterRecords(dashboardData.prs, "", "open").map(r => [r.number, r.draft])'), [[10, true]]);
  assert.equal(evaluate('filterRecords(dashboardData.issues, "", "closed").length'), 2);
  assert.equal(evaluate('recordStatus({state: "closed", merged_at: null})'), "closed");
});

test("timelines are chronological, omit unknown dates, and do not double-count merges", () => {
  for (const kind of ["issues", "prs"]) {
    const events = evaluate(`historyEvents(dashboardData.${kind})`);
    assert.equal(events.length, kind === "issues" ? 8 : 9);
    assert.deepEqual(events.map(e => e.date), events.map(e => e.date).sort());
    for (const event of events) assert.ok(Number.isFinite(Date.parse(event.date)));
  }
  assert.deepEqual(evaluate('historyEvents([{number: 99, state: "closed"}])'), []);
  assert.deepEqual(evaluate('historyEvents(dashboardData.prs).filter(e => e.record.number === 6).map(e => e.action)'), ["Opened", "Merged"]);
  assert.equal(evaluate('dashboardData.issues.find(r => r.number === 5).closed_at'), "2026-10-01T21:09:26Z");
});

test("all records retain verified timestamp fields and sourced context", () => {
  for (const record of evaluate("[...dashboardData.issues, ...dashboardData.prs]")) {
    assert.ok(record.author && record.title && record.summary && record.summarySource);
    assert.ok(Array.isArray(record.labels));
    for (const field of ["created_at", "updated_at", "closed_at", "merged_at"]) {
      if (!record[field]) continue;
      assert.equal(new Date(record[field]).toISOString().replace(".000", ""), record[field]);
      assert.ok(record[field] <= "2026-10-08T23:59:59Z");
    }
    assert.ok(record.updated_at >= record.created_at);
  }
});
