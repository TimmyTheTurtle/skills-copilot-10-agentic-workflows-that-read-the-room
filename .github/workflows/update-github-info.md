---
name: update-github-info
on:
  schedule: daily
  workflow_dispatch:

permissions:
  contents: read
  pull-requests: read

tools:
  edit:
  web-fetch:

network:
  allowed:
    - github.blog
    - github.com
    - awesome-copilot.github.com

safe-outputs:
  create-pull-request:
    title-prefix: "[GitHub Info] "
    draft: true
---

# Update GitHub Info

Keep `site/content/github-info.md` current with useful, practical GitHub guidance for Mona's website. Propose updates through a pull request for Mona to review; never write directly to the default branch.

## Instructions

1. Read `notes/mona-notes.md` and `site/content/github-info.md` before researching.
2. Use the web-fetch tool to fetch https://github.blog/latest/, https://github.blog/changelog/, and https://awesome-copilot.github.com/workflows/.
3. Identify recent official updates that are useful to developers learning GitHub. Prefer concise, practical items that fit the site's existing editorial angle. Skip items that are speculative, redundant, or not useful to the audience.
4. Edit only `site/content/github-info.md`. Preserve its existing structure and tone. Include a short, accurate summary and a direct source link for every item based on the GitHub Blog, Changelog, or Awesome Copilot workflows catalog. Do not invent details or present old items as new.
5. If there are worthwhile updates, open one draft pull request with a clear summary for Mona to review. If there is nothing worthwhile to change, do not open an empty pull request.