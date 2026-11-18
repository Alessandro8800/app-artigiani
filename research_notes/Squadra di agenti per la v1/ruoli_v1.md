# Ruoli per la v1 — which roles (human and AI-agent) matter most, and in what order

Case: Italian-language Android PWA for a solo gardener (calendar, clients/debts, job costs/profit, "Conti", settings, rain forecast). Vite + Preact + TS + Dexie, vitest, GitHub Pages. Approved single-file HTML prototype to convert. Owner decides product/design, does not code. Server/accounts/subscription after beta.

## 1. In small MVP teams, which roles exist and which are essential vs later?

### Takeaway
Industry sources (mostly agency blogs, so weak evidence) converge on a minimal core of product decision-maker + designer + full-stack/frontend developer, with QA often folded into development; dedicated back-end, DevOps, security and separate QA are added as complexity grows. For this case the "product owner" and "designer" roles are already filled by the owner plus the approved prototype.

### Cited Findings
- A lean MVP setup is described as three people: product manager, full-stack developer, designer; a fuller seven-person version adds separate backend, frontend, mobile, QA and DevOps, "for well-funded startups building complex products" — [Space-O Technologies, 2026 guide](https://www.spaceotechnologies.com/blog/mvp-development-team.txt)
- Example 6-person iOS MVP team: PM, UX/UI designer, solution architect, two engineers, QA engineer — [Creole Studios](https://www.creolestudios.com/mvp-development-team-roles-structure-hiring/)
- On small teams one person often covers two or three roles — [Kanerika](https://kanerika.com/blogs/software-development-team-roles-and-responsibilities/)
- Poor composition can skew validation and turn an MVP experiment into a failed prototype — [Edana, 2026](https://edana.ch/en/2026/04/06/mvp-development-team-which-roles-to-bring-together-which-structure-to-choose-and-how-to-recruit-without-mistakes/)
- Other MVP team guides with similar role lists — [DBB Software](https://dbbsoftware.com/insights/mvp-development-team-guide), [Leanware](https://leanware.co/insights/mvp-development-team-guide), [Metalamp](https://metalamp.io/magazine/article/who-should-be-hired-on-the-team-to-launch-an-mvp)
- Caveat: these are vendor/agency blogs selling team services; numbers (e.g., a CB Insights "14% fail for lack of right team" figure cited by Space-O) are secondhand — [Space-O](https://www.spaceotechnologies.com/blog/mvp-development-team.txt)

### Inferences
- Mapping to this project: Product owner = the gardener-owner (human, not delegable). UX/UI design = largely done (approved prototype); what remains is "design fidelity" checking, not new design. Frontend dev = the main build role. Data/back-end = in v1 only a local data layer (Dexie schema, calculations, backup/restore), no server. QA = essential, but split into automated tests (vitest) and manual test on the real phone. Security = checklist-level in v1, dedicated role later.
- "Back-end developer" and "DevOps" roles are effectively "later" here: GitHub Pages deploy already exists (commit 4e2cd01 in repo history).

### Gaps
- No peer-reviewed or survey-based study (2024–2026) found on MVP team composition; evidence is practitioner/vendor opinion.

## 2. How do role-based agent frameworks assign roles, and what evidence exists on which roles add value?

### Takeaway
MetaGPT and ChatDev mimic a software company (PM -> architect -> engineer -> QA; design -> coding -> testing) and report that extra roles and executable test feedback improve results on their benchmarks; but independent analysis (MAST, NeurIPS 2025) shows multi-agent systems fail often, mainly from system-design/role-spec problems, inter-agent misalignment and weak verification. Anthropic and Cognition both say coding is a poor fit for many parallel writer agents; the roles with best-supported value are (a) a single main builder holding full context, (b) an independent reviewer/verifier with fresh context, and (c) read-only investigators.

### Cited Findings
- MetaGPT roles: Product Manager, Architect, Project Manager, Engineer, QA Engineer, in a sequential SOP pipeline (requirements -> design -> code -> test) — [MetaGPT, ICLR 2024 slides](https://iclr.cc/media/iclr-2024/Slides/19756_GyeFksR.pdf); [alphaXiv overview of arXiv 2308.00352](https://www.alphaxiv.org/overview/2308.00352)
- MetaGPT ablation (per conference slides, check paper tables for exact numbers): adding roles beyond Engineer improves revisions/executability; executable feedback raised score 3.67 -> 3.75 and cut human revision cost 2.25 -> 0.83 — [ICLR 2024 slides](https://iclr.cc/media/iclr-2024/Slides/18491.pdf)
- ChatDev: specialized LLM agents "actively contribute to the design, coding, and testing phases"; natural language helps system design, programming language helps debugging — [ChatDev, arXiv 2307.07924](https://arxiv.org/abs/2307.07924) (role names CEO/CTO/programmer/reviewer/tester are in the full paper, not verified in the abstract fetched)
- MAST taxonomy: 14 failure modes in 3 categories — "system design issues", "inter-agent misalignment", "task verification"; built from 150 traces, kappa = 0.88 — [Cemri et al., "Why Do Multi-Agent LLM Systems Fail?", arXiv 2503.13657](https://arxiv.org/abs/2503.13657)
- MetaGPT's SOPs reduce system-design and inter-agent failures vs ChatDev but MetaGPT shows more task-verification failures; improved ChatDev role specs gave ~+9.4 pp success in one intervention (secondary summaries; confirm in paper) — [alphaXiv overview](https://www.alphaxiv.org/overview/2503.13657v3)
- Anthropic: multi-agent research beat single-agent by 90.2% on breadth-first research, but uses ~15x more tokens than chat; domains needing shared context or many dependencies "are not a good fit"; "most coding tasks involve fewer truly parallelizable tasks than research" — [Anthropic Engineering, multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Anthropic: each delegated subagent needs "an objective, an output format, guidance on the tools and sources to use, and clear task boundaries" — [same](https://www.anthropic.com/engineering/multi-agent-research-system)
- Anthropic: "finding the simplest solution possible, and only increasing complexity when needed"; evaluator-optimizer pattern (one generates, another evaluates in a loop) suits tasks with clear evaluation criteria — [Building effective agents, Dec 2024](https://www.anthropic.com/engineering/building-effective-agents)
- Cognition (June 2025): "share context, and share full agent traces"; actions carry implicit decisions; Flappy Bird example where two parallel subagents built mismatched styles; recommends a single-threaded linear agent; observes Claude Code uses subagents mainly to answer well-defined questions, not to write code in parallel — [Cognition, "Don't Build Multi-Agents"](https://cognition.com/blog/dont-build-multi-agents)
- Claude Code docs: subagents run in own context with custom prompt and tool restrictions; examples `code-reviewer` (tools: Read, Glob, Grep) and `debugger`; use main conversation when task needs back-and-forth, phases share context, or latency matters; use subagents for verbose self-contained work, tool restrictions — [Claude Code subagents docs](https://code.claude.com/docs/en/sub-agents)
- Claude Code best practices: subagents pay off for parallel work, noisy output, and "a reviewer that hasn't seen how the code was written"; "Handing the same task to a subagent doesn't make the answer any better. A fresh reviewer does help"; a read-only reviewer (`tools: Read, Grep, Glob`) is enforced by the harness; a fresh subagent can be slower because it must regather context — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Same doc: reviewers asked to find problems "will always find something"; tell them to check against SPEC.md and "skip style", otherwise you get extra abstraction and needless tests — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Same doc: give the agent a pass/fail check (tests, build exit code, browser screenshot vs mockup) and ask for evidence (command + output, screenshot) — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Community collection VoltAgent awesome-claude-code-subagents: ~100–170 role files (ui-designer, frontend-developer, code-reviewer, test-automator, security-auditor, accessibility-tester, architect-reviewer, product-manager, mobile-developer; no PWA-specific agent); no benchmarks; maintainers "do not audit or guarantee the security or correctness of any subagent" — [GitHub VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)

### Inferences
- The evidence supports few roles with clear verification, not many roles. The value-adding agent roles for this case: one builder (main session, full context), one fresh-context reviewer against SPEC.md/prototype, one tester/verifier that runs build + tests + browser screenshot at phone width. Parallel writing agents (e.g., one per screen) risk the Flappy Bird style mismatch unless shared components/tokens (src/ui.tsx) exist first.
- Large community role catalogs are unvalidated; use them only as templates for prompts.

### Gaps
- No controlled study found comparing specific Claude Code subagent role sets (e.g., ui-designer vs no ui-designer) on real app projects.
- Exact MetaGPT/ChatDev per-role ablation numbers and MAST per-framework failure rates not verified from the PDFs.

## 3. Converting an approved prototype into production code: recommended roles/steps?

### Takeaway
Sources support an order of: (1) write the definition of done (spec + prototype as reference), (2) data model and calculations with tests first, (3) shared UI components then screens, built in one context to keep consistency, (4) automated checks plus screenshot comparison with the prototype, (5) PWA quality (offline, installable, fast), accessibility (target size, contrast) and real-device testing, (6) independent review. Real-device testing by the owner is a human role that cannot be delegated.

### Cited Findings
- Write SPEC.md, then start a fresh session to build from it "so the build begins with a clean context and a written definition of done"; it is also what the reviewer is pointed at — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Paste design screenshots; use a browser screenshot next to the mockup as a check; `/verify` builds and runs the app to catch what tests miss — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- MetaGPT/ChatDev pipelines put design/architecture before coding and testing after, with executable feedback improving outcomes — [ICLR 2024 slides](https://iclr.cc/media/iclr-2024/Slides/18491.pdf); [ChatDev](https://arxiv.org/abs/2307.07924)
- web.dev core PWA checklist: starts fast/stays fast (Core Web Vitals), works in any browser, responsive to any screen size, custom offline page, installable; optimal: offline experience for key features, fully accessible (WCAG), works with any input, context for permission requests, healthy tested code — [web.dev PWA checklist](https://web.dev/articles/pwa-checklist)
- WCAG 2.2 SC 2.5.8 (AA): pointer targets at least 24x24 CSS px (with exceptions); for important controls aim for SC 2.5.5's 44x44 — [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Persistent storage: call `navigator.storage.persist()` when saving critical data; Chrome grants silently by heuristics (engagement, installed/bookmarked, notification permission); without it IndexedDB can be evicted under storage pressure — [web.dev persistent storage](https://web.dev/articles/persistent-storage)
- Human testers "find edge cases that evals miss" — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)

### Inferences
- Suggested order for this project: (a) architecture/data step: types and money/state calculations in `src/logica.ts` with vitest, Dexie schema with `owner_id`, backup/restore (data loss is the biggest real risk for a phone-only app); (b) shared UI pieces in `src/ui.tsx` matching the prototype's tokens; (c) screens one at a time (calendar, clients/debts, job, Conti, settings, rain); (d) PWA layer (manifest, service worker, offline, persist()); (e) checks: build + tests + screenshot at ~375px vs prototype + tap-target size/contrast; (f) owner tests on his real Android phone in the field (gloves, sunlight, one hand) — matches the user's memory rule "provare su telefono vero".
- Rain forecast is the only network feature: needs offline fallback and a clear message when no connection; location is a permission that needs context before asking (per web.dev "context for permission requests").

### Gaps
- No 2024–2026 source found specifically on "single-file HTML prototype to structured Preact app" conversion; steps above are assembled from general guidance.
- Sunlight readability/gloves usability guidance for outdoor workers not researched.

## 4. What stays with the coordinator/lead vs delegated?

### Takeaway
Keep with the lead (main session) everything that needs shared context or carries implicit decisions: architecture, shared components, integration, merging/commits, and translating the owner's product choices. Keep with the human owner: product scope, design approval, real-phone acceptance. Delegate self-contained, verifiable or read-only work: code review against spec, test running/verification, research questions, file searches.

### Cited Findings
- Use main conversation when the task needs back-and-forth, phases share significant context, or for quick changes; subagents for self-contained work returning a summary — [Claude Code subagents docs](https://code.claude.com/docs/en/sub-agents)
- Subagents in Claude Code mainly answer well-defined questions rather than write code in parallel; conflicting implicit decisions break parallel builders — [Cognition](https://cognition.com/blog/dont-build-multi-agents)
- Multi-agent fit is poor when agents must share context or have many dependencies — [Anthropic Engineering](https://www.anthropic.com/engineering/multi-agent-research-system)
- Independent reviewer value comes from not having seen the reasoning; it is "a different thing from delegating" — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Product owner/PM decides scope in MVP teams — [Space-O](https://www.spaceotechnologies.com/blog/mvp-development-team.txt)

### Inferences
- Project rule "save with git only when build and tests pass" (CLAUDE.md) means the lead should own commits after the verifier reports evidence.
- The owner should only receive decisions phrased in plain Italian with 2–3 options (project rule 1), never raw review output.

### Gaps
- No source quantifies the cost/benefit of a coordinator-only lead vs a lead that also writes code for apps of this size.

## 5. When should security become a dedicated role, and what minimal checks apply to a local-only PWA?

### Takeaway
For a local-only PWA with no accounts, a checklist run by the reviewer is enough; a dedicated security role (agent or human audit) becomes justified when adding a server, accounts/authentication, sync of client data, or payments/subscriptions. Minimal v1 checks: no XSS (data from IndexedDB and imports treated as untrusted), no secrets in client storage or repo, validation of imported backup files, dependency audit, HTTPS (GitHub Pages), permission prompts with context, and data-loss protection (persist + export).

### Cited Findings
- XSS can "read or write any data in IndexedDB"; do not assume IndexedDB provides confidentiality; not encrypted by default; keep tokens/credentials/secrets out; treat stored data as untrusted input and validate it — [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- Anyone with access to the browser profile can read/modify stored data — [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- "Follows best practices for healthy code": dependencies, APIs and code current, safe and tested; permission prompts only when needed with explanation — [web.dev PWA checklist](https://web.dev/articles/pwa-checklist)
- Eviction risk and persistent storage — [web.dev persistent storage](https://web.dev/articles/persistent-storage)
- Community catalogs offer a `security-auditor` agent but with no correctness guarantees — [VoltAgent collection](https://github.com/VoltAgent/awesome-claude-code-subagents)
- Claude Code ships a built-in `security-review` command for pending changes (observed in this environment's skill list; not fetched from docs).

### Inferences
- Trigger points for a dedicated security role: first server endpoint, login/accounts, multi-device sync, storing client personal data off-device (GDPR applies since clients are Italian individuals), payments/subscription. At that point also add back-end/data and possibly DevOps roles.
- In v1 the main privacy issue is the phone itself (lost/unlocked phone) and backup files containing client names/debts: exported JSON/CSV should be described to the owner as sensitive.
- Rain forecast: sending location to a weather API is the only off-device data flow; prefer a city/coarse location and say so in settings.

### Gaps
- No specific source found on GDPR obligations for a solo artisan's local-only app; not researched.
- Did not verify Content-Security-Policy feasibility on GitHub Pages (meta-tag CSP only, no headers) from a source.
