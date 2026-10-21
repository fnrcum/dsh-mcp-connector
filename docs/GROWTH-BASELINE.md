# Discoverability and conversion baseline

This document records a reproducible growth baseline and the monthly review protocol. Growth targets are operating goals, not product promises.

## Consolidated review — 2026-10-15

This later review does not reconstruct missing historical snapshots or claim causal marketing impact.

| Metric | Observed | Source / period |
|---|---:|---|
| First checkpoint week downloads | 6,502 | [npm API](https://api.npmjs.org/downloads/point/2026-09-26:2026-10-02/dsh-mcp-connector), Sep 26–Oct 2 |
| Second checkpoint week downloads | 6,010 | [npm API](https://api.npmjs.org/downloads/point/2026-10-03:2026-10-09/dsh-mcp-connector), Oct 3–9 |
| Weekly change | -492 / -7.6% | Equal-length adjacent windows; not unique users or campaign attribution |
| Stars / forks | 50 / 14 | Repository API snapshot Oct 15; Oct 2/9 snapshots unavailable |
| Repository views / unique visitors | 2,283 / 1,194 | GitHub Traffic API, Oct 1–14 |
| Repository clones / unique cloners | 1,314 / 329 | GitHub Traffic API, Oct 1–14; includes automation |

Local DSH Market 1.58.0, Chinese, all categories (~4.7k entries), 24/page:
both initial and final menus confirmed trailing-30-day downloads / descending /
all publication dates / all hosts. `mcp`, `MCP连接器`, `连接器`, `MCP管理`,
`MCP面板`, `MCP授权` each ranked 1. `OAuth` was right-column item 10,
rank 20 after interleaving the two columns. Evidence was live AX/DOM, not a
saved screenshot. This is not the latest-market or ecosystem-wide ranking.

The Oct 2/9 checkpoint dates below have passed. No archived scenario-call,
publication or first-party conversion evidence was found for those dates;
their placeholders mean **not verified**, not future scheduled work or zero.
Seven storefront screenshots and a 43-second GIF exist with per-asset
provenance; see [asset provenance](screenshots/README.md). Screenshots 01, 02,
04 and 07 were recaptured from the v0.2.73 credential-free harness on Oct 16.
Screenshot 03 remains a v0.2.37 historical fixture; 05, 06 and the GIF remain
v0.2.46 historical fixtures. Every asset is a Mock illustration, not real-account
runtime acceptance.

Next experiment: publish the three first-success tutorials on an explicitly
selected channel, record post URLs/date and source version, then compare
equal-length windows. Preserve the existing no-telemetry boundary. Search
leadership alone is insufficient to claim weekly download growth.

## Repeatable equal-window review procedure

Use this procedure only after an external post has an authorized platform,
account and public URL. It preserves comparable calendar windows without
adding product telemetry or reconstructing missing history.

1. Save `P`, the post's public timestamp and time zone, plus platform, account,
   language, post URL, linked tutorial commit and asset source version.
2. For npm, compare the seven complete UTC days immediately before publication
   (`P-7` through `P-1`) with the seven complete UTC days starting on the next
   complete UTC day (`P+1` through `P+7`). Record the API's returned `start`,
   `end` and `downloads`; do not mix a partial publication day into either
   window.
3. Save cumulative Stars/Forks snapshots at the two window boundaries and
   report their deltas separately. Never divide cumulative Stars by windowed
   downloads.
4. GitHub Traffic is a rolling 14-day source, not a reconstructable seven-day
   series. Archive views, clones, popular paths and referrers at a fixed local
   time before publication and every seven days; compare only snapshots with
   the same cadence and clearly label their overlapping windows.
5. Repeat the fixed Market/search query set with the same host/market version,
   locale, category, sort, date and host filters. If any condition changes,
   start a new series instead of presenting it as the old one.
6. Count connection or first-call success only from explicit, consented manual
   acceptance records. With no such evidence, retain **No data**.

Example npm requests (replace dates only after `P` is known):

```bash
curl -fsSL https://api.npmjs.org/downloads/point/YYYY-MM-DD:YYYY-MM-DD/dsh-mcp-connector
curl -fsSL https://api.npmjs.org/downloads/point/YYYY-MM-DD:YYYY-MM-DD/dsh-mcp-connector
```

For each review, report the absolute difference and `(post - pre) / pre` only
when `pre > 0`. Call it an equal-window change, not campaign attribution or a
user conversion rate. The publication checklist and missing ownership fields
are maintained in [`marketing/P1-FIRST-SUCCESS-PUBLICATION-PACK-2026-10-16.md`](../marketing/P1-FIRST-SUCCESS-PUBLICATION-PACK-2026-10-16.md).

## Historical baseline — 2026-08-30 (Asia/Shanghai)

| Metric | Baseline | Reproducible source |
|---|---:|---|
| npm downloads, trailing 30 days | 5,406 | npm downloads API, `2026-07-31` through `2026-08-29` |
| GitHub Stars | 8 | GitHub repository API |
| GitHub Forks | 2 | GitHub repository API |
| GitHub Watchers | 1 | GitHub repository API `subscribers_count` |
| Open Issues | 1 | GitHub repository API |
| Latest npm / GitHub Release | `0.2.29` / `v0.2.29` | npm registry and GitHub Releases API |
| GitHub views | 646 / 277 unique visitors | GitHub Traffic API, `2026-08-16` through `2026-08-29` |
| GitHub clones | 1,174 / 247 unique cloners | GitHub Traffic API, `2026-08-16` through `2026-08-29` |
| Popular path: Overview | 444 / 268 unique visitors | GitHub Traffic popular paths API, `2026-08-16` through `2026-08-29` |
| Natural-search visibility | npm package appeared on the first results page for `DeepSeek Harness MCP connector` | Search snapshot on 2026-08-30; rank varies by engine, locale, and personalization |

The Traffic snapshot was collected through the official GitHub API on 2026-08-30. Its referrer breakdown was:

| Referrer | Views | Unique visitors |
|---|---:|---:|
| `github.com` | 67 | 22 |
| Bing | 5 | 3 |
| `npmjs.com` | 4 | 1 |
| Baidu | 1 | 1 |
| Google | 1 | 1 |
| chatgpt | 1 | 1 |
| dshfind | 1 | 1 |
| dshmarket | 1 | 1 |
| findharness | 1 | 1 |
| 微信 | 1 | 1 |

`Open Issues = 1` is the pre-intervention baseline. The documentation-scoped [`good first issue` #29](https://github.com/duhu2000/dsh-mcp-connector/issues/29) was created afterward as part of this round, so it must be counted as a change, not folded back into the baseline. It was completed and closed on 2026-09-22; it is historical evidence, not a currently claimable task.

Recheck the quantitative baseline with:

```bash
curl -fsSL https://api.npmjs.org/downloads/point/last-month/dsh-mcp-connector
gh api repos/duhu2000/dsh-mcp-connector \
  --jq '{stargazers_count,forks_count,subscribers_count,open_issues_count}'
gh api repos/duhu2000/dsh-mcp-connector/releases/latest --jq '{tag_name,published_at}'
gh api repos/duhu2000/dsh-mcp-connector/traffic/views
gh api repos/duhu2000/dsh-mcp-connector/traffic/clones
gh api repos/duhu2000/dsh-mcp-connector/traffic/popular/paths
gh api repos/duhu2000/dsh-mcp-connector/traffic/popular/referrers
npm view dsh-mcp-connector version
```

The npm download window ends on the previous UTC day. Save its returned `start` and `end` fields with the value. GitHub counters are cumulative snapshots and should include the capture timestamp. GitHub Traffic endpoints require repository push access and expose a rolling 14-day window, so archive each response at review time.

Clones and npm downloads include automation, CI installs, cache misses, reinstalls, and repeated actions. Neither metric represents independent people, and neither may be used as the denominator or numerator of an independent-user conversion rate.

## 30-day operating goals

| Metric | Goal |
|---|---:|
| Monthly npm downloads | 7,000+ |
| GitHub Stars | 12+ |
| GitHub Forks | 4+ |

Do not treat Stars divided by monthly downloads as a true conversion rate: Stars are cumulative while the download window is not. Until first-party analytics are available, use these separate proxies:

- README → install intent: trailing npm downloads and install-command copy feedback, if the host later exposes it without user tracking.
- README → community intent: net new Stars and Forks during the same review window.
- Contributor conversion: first-time Issues/PRs opened, first-time PRs merged, and median time from `good first issue` assignment to PR.
- Search discovery: first non-personalized result-page position for the fixed query set below.

## Monthly review template

Copy this section below with a new date; never overwrite the baseline.

### YYYY-MM-DD (Asia/Shanghai)

| Metric | Previous | Current | Change | Source window / timestamp |
|---|---:|---:|---:|---|
| npm downloads, trailing 30 days |  |  |  |  |
| GitHub Stars |  |  |  |  |
| GitHub Forks |  |  |  |  |
| GitHub Watchers |  |  |  |  |
| Open Issues |  |  |  |  |
| GitHub views / unique visitors, trailing 14 days |  |  |  |  |
| GitHub clones / unique cloners, trailing 14 days |  |  |  |  |
| Popular path: Overview / unique visitors |  |  |  |  |
| Top referrers (views / unique visitors) |  |  |  |  |
| First-time PRs opened / merged |  |  |  |  |

Use a signed-out or fresh browser profile, record engine and locale, and inspect at least the first two result pages:

| Query | Engine / locale | Best project-owned result | Position | Landing page |
|---|---|---|---:|---|
| `DeepSeek Harness MCP connector` |  |  |  |  |
| `dsh MCP connector marketplace` |  |  |  |  |
| `DeepSeek MCP 连接器` |  |  |  |  |
| `model context protocol connector DeepSeek Harness` |  |  |  |  |

Record the month's changes to metadata, README CTAs, screenshots, Issues, or external listings. Note likely causes, data caveats, next experiment, owner, and review date. Never purchase or automate fake downloads, Stars, or Forks.

## 7/14-day first-use review template

Use one fixed baseline timestamp (`T0`), then review at `T+7` and `T+14`. Preserve every API's returned date window; do not compare values as if they were cohort data when the windows differ. GitHub Traffic is a rolling 14-day window, npm downloads include automation and reinstalls, and cumulative Stars/Forks need timestamped snapshots.

| Metric | T0 | T+7 | T+14 | Exact source window / evidence |
|---|---:|---:|---:|---|
| DSH Market/search impressions | No data | No data | No data | Host/market does not expose an impression metric |
| GitHub Overview views / unique visitors |  |  |  | GitHub Traffic popular paths; rolling window |
| npm downloads |  |  |  | npm downloads API; save returned `start` and `end` |
| GitHub Stars / Forks |  |  |  | Repository API snapshot timestamp |
| Search query positions |  |  |  | Same Market/Host, locale, category, sort, time and host filters |
| Saved connections | No data | No data | No data | No first-party aggregate telemetry |
| Tools discovered/registered | No data | No data | No data | No first-party aggregate telemetry |
| First successful read-only calls | No data | No data | No data | Only explicit, consented manual acceptance evidence may be counted |
| First-time Issues / PRs |  |  |  | GitHub events reviewed for the exact interval |

Do not calculate an exposure-to-install, download-to-connection, or download-to-first-call conversion rate from these proxies. If no explicit evidence exists, retain **No data** rather than replacing it with zero or an estimate. Record documentation changes and user-reported friction separately so a change in downloads is not automatically attributed to the latest copy or release.

### 0.2.59 scheduled first-use checkpoints

The fixed documentation baseline is `T0 = 2026-09-25 11:45 Asia/Shanghai`; the scheduled reviews are `T+7 = 2026-10-02` and `T+14 = 2026-10-09`. Future columns remain pending until each date. The scenario source is [`docs/tutorials/FIRST-SUCCESS-SCENARIOS.md`](tutorials/FIRST-SUCCESS-SCENARIOS.md); a saved connection or cached tool is not a successful call.

| Evidence | T0 — 2026-09-25 | T+7 — 2026-10-02 | T+14 — 2026-10-09 | Rule |
|---|---|---|---|---|
| Enterprise-information read-only call | No data / pending authorized acceptance | Fill only after due date | Fill only after due date | Require provider-authorized account, Host approval and redacted result evidence |
| Local intelligent-document call | No data / pending authorized sample | Fill only after due date | Fill only after due date | Record that the local Agent uploads the test file for remote processing |
| Authorized office document/calendar call | No data / pending test tenant | Fill only after due date | Fill only after due date | Require isolated test scope and any administrator approval |
| Draft publication | Not published | Fill only after due date | Fill only after due date | Record platform/account/post URL only after explicit channel authorization |
| Friction observed | Installation/profile path verified in published 0.2.59 docs | Fill only after due date | Fill only after due date | Separate documentation friction from product/runtime failures |

At each checkpoint record the exact npm/API window, cumulative Star/Fork timestamp, fixed Market query conditions, and explicit manual-acceptance evidence separately. Do not attribute a change in any proxy to these scenario documents without causal evidence.
