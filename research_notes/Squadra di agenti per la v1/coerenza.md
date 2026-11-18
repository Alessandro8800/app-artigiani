# Keeping multiple AI agents (and humans) consistent while building one app

Context: small Vite + Preact + TypeScript + Dexie PWA, non-technical owner, existing `CLAUDE.md` + `SPEC.md`, pure logic in `src/logica.ts` with tests. Research date: 2026-11-18.

## 1. Which shared files are recommended for agent coordination, and is there evidence they reduce drift?

### Takeaway
Anthropic and practitioners converge on a small set of files: a short instruction file (CLAUDE.md / AGENTS.md), a spec as a "definition of done", a progress log, a machine-checkable feature/task list, git history with small commits, and tests/CI as the enforcement. Evidence they reduce drift is mostly first-party engineering reports and practitioner anecdote, not controlled studies. The strongest signal is that written files plus deterministic checks (tests, CI) work, while prose instructions on their own get only partial compliance.

### Cited Findings
**Instruction files (CLAUDE.md / AGENTS.md)**
- Anthropic's Claude Code docs: CLAUDE.md files are "loaded at the start of every conversation." Claude treats them "as context, not enforced configuration," and "the more specific and concise your instructions, the more consistently Claude follows them." To block an action regardless of what the model decides, use a hook instead. — [Claude Code docs: memory](https://code.claude.com/docs/en/memory)
- Size guidance: "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." `@path` imports organize a file but don't reduce context cost. — [Claude Code docs: memory](https://code.claude.com/docs/en/memory)
- On contradictions: "if two instructions contradict each other, Claude may pick one arbitrarily." Review files periodically. `/doctor prompt-audit` finds conflicting or outdated instructions. — [Claude Code docs: memory](https://code.claude.com/docs/en/memory)
- Path-scoped rules (`.claude/rules/*.md` with a `paths:` glob) load only when working on matching files, for example UI rules only for `src/schermate/**`. — [Claude Code docs: memory](https://code.claude.com/docs/en/memory)
- Claude Code can read a repo's AGENTS.md in place of CLAUDE.md. — [Claude Code docs: memory](https://code.claude.com/docs/en/memory)
- What belongs in CLAUDE.md is what Claude can't learn from the code: exact test/typecheck commands, and "Decisions that aren't in the repo." Current models already infer layout and conventions from the code. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- AGENTS.md was contributed to the Linux Foundation's Agentic AI Foundation (co-founded by OpenAI and Anthropic, 9 Dec 2025). Commonly cited adoption is 60,000+ open-source projects, but that figure is repeated by secondary sources without an independent count. — [InfoQ](https://www.infoq.com/news/2025/12/agentic-ai-foundation); [OpenAI](https://openai.com/index/agentic-ai-foundation/)
- Kiro's equivalent is "steering" files in `.kiro/steering/`: default `product.md` (purpose, users, features), `tech.md` (stack, constraints) and `structure.md` (file layout, naming, architecture). Inclusion modes are always, fileMatch, manual and auto. Kiro also reads AGENTS.md. Its advice: one domain per file, explain *why* decisions were made, review changes like code. — [Kiro docs: steering](https://kiro.dev/docs/steering/)

**Spec + progress log + feature list + git (long-running agents)**
- Anthropic's "effective harnesses" post uses an initializer agent that writes `claude-progress.txt`, `feature_list.json` (200+ features, all `"passes": false`) and `init.sh`, plus an initial git commit. Later coding sessions read the progress file and git log, run a basic end-to-end test, then work on one feature and commit. — [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Failure modes these files address:
  - Agents "declare victory on the entire project too early."
  - Sessions leave features "half-implemented and undocumented," so the next agent has to "guess at what had happened."
  - New work piles on top of existing bugs.
  — [Anthropic: Effective harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Format choice: JSON was used for the feature list because "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files." Agents may only flip the `passes` field, and "It is unacceptable to remove or edit tests." — [Anthropic: Effective harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Claude Code best practices describe the spec workflow. Have Claude "Interview me until you could write the spec, then write it to SPEC.md." Then "start a fresh session to build from it," so the build begins with "a written definition of done." The same SPEC.md is what a reviewer subagent checks the diff against. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Review prompts should say "skip style." "A reviewer that's asked to find problems will always find *something*," and fixing every finding adds needless abstraction. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Ask agents for *evidence* (the command and its output, or a screenshot), not "all tests pass." — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Structured note-taking (to-do lists, a `NOTES.md`) persists state outside the context window. Subagents return condensed summaries of about 1,000–2,000 tokens. — [Anthropic: Effective context engineering (29 Sep 2025)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

**Parallel agents (closest evidence on multi-agent drift)**
- Anthropic's C compiler project: 16 parallel Claude agents and about 2,000 sessions over two weeks, costing just under $20,000. There was no orchestrator. An agent claimed a task by writing a lock file in `current_tasks/`, and git sync forced a second claimant to pick another task. "Merge conflicts are frequent, but Claude is smart enough to figure that out." Agents kept "extensive READMEs and progress files" so each fresh container could orient itself. — [Anthropic: Building a C compiler with parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)
- Drift evidence from the same project: late on, Claude "started to frequently break existing functionality each time it implemented a new feature." The fix was a stricter CI pipeline. Dedicated role agents handled deduplication ("LLM-written code often re-implements existing functionality"), documentation and design critique. — [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- In Anthropic's multi-agent research system, vague delegation caused duplicated and misread work: two subagents covered the same 2025 supply-chain topic. Each subagent needs an objective, an output format, tool guidance and task boundaries. Multi-agent runs used about 15× the tokens of chat and suit parallelizable tasks, "not tasks needing shared context." — [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- Counterpoint: Cognition (Walden Yan, 12 Jun 2025) argues "actions carry implicit decisions, and conflicting decisions carry bad results." In their Flappy Bird example, two subagents produced a Mario-style background and a mismatched bird. They recommend single-threaded agents and narrow, question-answering subagents over agents writing code in parallel. — [Cognition: Don't Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents)

### Inferences
- For this project, the minimal set would be:
  - CLAUDE.md, already present and short. Keep it under about 200 lines and in Italian, as it is now.
  - SPEC.md / product doc for the "what" and "why".
  - A decision log (see Q5).
  - A progress/handoff file.
  - Possibly a JSON checklist of v1 features, each marked `passes` true or false.
  - `npm run build && npm test` as the gate before commits. Existing CLAUDE.md rule 5 already does this.
- The Flappy Bird failure is about visual style, which is exactly the risk when several agents build different screens from one HTML prototype. Shared tokens and components (Q2) are the direct mitigation.
- The evidence suggests parallel agents work best on separable tasks with a hard test gate. UI work that shares "feel" is better done sequentially, or by one agent owning shared components.

### Gaps
- No controlled or quantitative study found that measures drift with vs. without CLAUDE.md/AGENTS.md. All evidence is first-party engineering reports or anecdote.
- No source found on how well such files work when the human owner is non-technical and reads them in another language (Italian).

## 2. Design consistency: tokens and component libraries as a single source of truth; extracting tokens from a single-file HTML prototype

### Takeaway
The standard is now a stable W3C Community Group format (DTCG 2025.10). In a small Preact app, though, the practical single source of truth is one CSS file of custom properties (`:root { --color-…; --space-…; --font-size-… }`) plus a few shared components. Extraction starts from the prototype's existing `:root` variables, then finds any remaining hard-coded values and has a human review them.

### Cited Findings
- The Design Tokens Community Group published its first stable spec, "Design Tokens Format Module 2025.10," on 28 Oct 2025, with a companion Resolver Module for theming such as light/dark. It is a Community Group report, "not a W3C Standard nor is it on the W3C Standards Track." — [W3C DTCG announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/); [Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/); [designtokens.org FAQ](https://www.designtokens.org/faq/)
- Adoption by Style Dictionary, Tokens Studio, Figma and others is claimed by secondary sources and not verified here. — [designtokens.org](https://designtokens.org/)
- Extraction tools and agent skills usually treat `:root` CSS custom properties as the primary token source ("intentional design tokens"). They fill gaps from computed or inline styles, then normalize into colors, typography, spacing, radii and elevation. Output is CSS variables, Tailwind theme or DTCG JSON, keeping aliases such as `--color-primary: var(--color-blue-500)`. — [CSS Extraction Playbook (design-mirror skill)](https://cdn.jsdelivr.net/npm/claude-code-skills@0.5.0/data/skills/design-mirror/references/css-extraction.md); [css-token-extractor](https://github.com/naveen-ithappu/css-token-extractor); [design-token-bridge MCP](https://glama.ai/mcp/servers/kenneives/design-token-bridge-mcp/tools/extract_tokens_from_css)
- Screenshot-only extraction gives approximate colors. Values found from computed styles should be treated as candidates, not confirmed tokens. — [CSS Extraction Playbook](https://cdn.jsdelivr.net/npm/claude-code-skills@0.5.0/data/skills/design-mirror/references/css-extraction.md)
- Spec Kit's announcement lists "design-system requirements" as something to put in the spec and plan so agents apply them. — [GitHub blog: Spec Kit (2 Sep 2025)](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- Duplicated components are a known LLM failure. Anthropic's compiler project needed a dedicated agent to remove re-implemented functionality. — [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- Path-scoped rules can enforce a UI convention only where it matters, for example a `.claude/rules/ui.md` with `paths: src/schermate/**`. — [Claude Code docs: memory](https://code.claude.com/docs/en/memory)

### Inferences
- Suggested workflow for turning the single-file HTML prototype into Preact components:
  1. Copy the prototype's `:root` variables (or create them from the repeated literal values) into one `src/stile.css` / `tokens.css`. Keep it small: about 5 colors, a spacing scale, 3–4 font sizes, a minimum tap-target size.
  2. Have the owner approve the visual result on a real phone. This matches the user's memory rule "provare su telefono vero".
  3. Build the shared components (button, list row, big input, bottom sheet, nav) in `src/ui.tsx` *before* parallel screen work.
  4. Add a CLAUDE.md rule: "use only `var(--…)` tokens and `ui.tsx` components, no new colors or hard-coded px."
  5. Optionally, add a cheap check (a grep or test that fails on hex colors outside the tokens file) so the rule is enforced and not just requested.
- DTCG JSON plus Style Dictionary is overkill for one app with one theme. Plain CSS variables are enough and can be converted to DTCG later if needed.

### Gaps
- No primary source found measuring whether tokens or component libraries reduce visual drift in agent-generated UI specifically. The claims are practitioner and tool-vendor reasoning.
- No authoritative (non-vendor) guide found specifically on "single-file HTML prototype → component library" with agents.

## 3. Data consistency: types, data-access layer and pure tested calculations before UI ("contract-first")

### Takeaway
Practitioners recommend settling the TypeScript interfaces and data layer first, because the compiler and tests then act as fast, deterministic guardrails for every agent. Anthropic's guidance agrees in spirit: give the agent "a check to run," and enforce things that must always hold with tests and CI rather than prose. The evidence is practitioner experience, and some widely quoted statistics are unverifiable.

### Cited Findings
- Claude Code best practices: when an agent "had no way to check its own work," it stops when the work "looks done." Recommended checks include a test file, the typecheck, `/goal` conditions, and a review by a fresh subagent. Deterministic enforcement (tests, typecheck, Stop hook, CI) is for rules that "always" must hold. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- Anthropic harness post: the feature list plus end-to-end tests stopped agents from marking features done untested. Browser automation testing "dramatically improved performance." — [Anthropic: Effective harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Anthropic compiler project: progress depended on high-quality tests, and agents broke existing features until CI enforcement was tightened. — [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- Practitioner advice:
  - "ask the AI to generate the TypeScript interfaces/types before generating the code that uses them."
  - Make the type checker "a first-class gate", run in CI and pre-commit, with its output fed back to agents.
  - One team reports agents passing type-check on the first attempt more often with precise types.
  — [DEV: Why your AI coding agent keeps breaking TypeScript](https://dev.to/naelawadallah/why-your-ai-coding-agent-keeps-breaking-typescript-and-how-to-fix-it-2623); [Types are the guardrails](https://ramesh.pages.dev/posts/types-are-the-guardrails/); [Obvious.ai build blog](https://obvious.ai/build-blog/type-safety)
- The often-repeated "62% fewer AI-generated runtime errors with TypeScript" figure could not be traced to a primary survey. Treat it as unverified and do not cite it.
- Dexie 4 typing pattern: define a row interface per table, then `const db = new Dexie('…') as Dexie & { clienti: EntityTable<Cliente, 'id'> }` and `db.version(1).stores({ clienti: '++id, …' })`. Typings ship with the package. — [Dexie docs: TypeScript](https://dexie.org/docs/Typescript)

### Inferences
- The project already follows contract-first: types and calculations live in `src/logica.ts` with tests, and persistence lives in `src/db.ts`. For a multi-agent v1, these steps would help:
  - (a) Freeze `logica.ts` types and `db.ts` function signatures before splitting screen work. Screens may only call `db.ts`/`logica.ts`, never Dexie directly.
  - (b) Have changes to types/schema go through one owner or agent at a time, with a Dexie `version(n)` bump. Every schema change is a shared contract change.
  - (c) Keep money in integer cents and dates as `AAAA-MM-GG` in the types, as CLAUDE.md already says, ideally with branded or alias types (e.g. `type Centesimi = number`) so intent is visible to agents.
  - (d) Keep `npm run build && npm test` as the gate. Type errors are the fastest drift detector across agents.

### Gaps
- No rigorous study found comparing contract-first vs. UI-first with AI agents.
- Dexie schema-migration guidance was not covered by the fetched page. See Dexie's versioning docs.

## 4. Spec-driven development (Spec Kit, Kiro, Anthropic): what it is, pros and cons for a tiny project

### Takeaway
Spec-driven development (SDD) means a written spec (requirements, then plan, then tasks) drives the agent, with a human checkpoint at each phase. Spec Kit and Kiro formalize this. Independent review (Böckeler, Thoughtworks, Oct 2025) finds the full workflows heavy for small tasks and verbose to review, and agents still don't reliably follow specs. For a tiny app, a lightweight "spec-first + living product doc" (Anthropic's interview → SPEC.md → fresh session → review against SPEC.md) gives most of the benefit.

### Cited Findings
- Spec Kit (GitHub, Den Delimarsky, 2 Sep 2025) is an open-source toolkit used with Copilot, Claude Code and Gemini CLI. The spec is "a contract for how your code should behave." Its phases are Specify (what and why, user journeys), Plan (stack, constraints), Tasks (small testable units) and Implement, with a checkpoint after each. To change course, update the spec and regenerate. The post positions "vibe-coding" for quick prototypes. — [GitHub blog: Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- Spec Kit also has a "constitution" (persistent project principles). Böckeler calls it a "very powerful rules file" applied to every change. The announcement post itself doesn't mention it. — [Böckeler, martinfowler.com (15 Oct 2025)](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- Kiro specs live in `.kiro/specs/<feature>/requirements.md` (user stories and acceptance criteria), `design.md` (architecture) and `tasks.md`. You can edit requirements, then "Sync Files" to regenerate tasks. There are Requirements-First, Design-First and Bugfix variants. — [Kiro docs: specs](https://kiro.dev/docs/specs/); [Kiro blog: From chat to specs](https://kiro.dev/blog/from-chat-to-specs-deep-dive/)
- Böckeler's taxonomy: spec-first (written before the task), spec-anchored (kept and maintained with the feature), and spec-as-source (humans edit only specs). Most tools are only spec-first. Spec-as-source risks "Inflexibility *and* non-determinism." — [Böckeler](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- Böckeler's critiques:
  - Kiro on a small bug was "like using a sledgehammer to crack a nut."
  - Spec Kit felt like overkill for a 3–5 point feature.
  - Its markdown was "very verbose and tedious to review": "I'd rather review code than all these markdown files."
  - "I frequently saw the agent ultimately not follow all the instructions," including duplicating existing classes, or over-applying a constitution rule.
  — [Böckeler](https://www.martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- Anthropic's lighter version: interview → SPEC.md → fresh session builds → subagent reviews the diff "against SPEC.md." — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)

### Inferences
- For a non-technical owner, the SDD artifacts must be readable by them. Spec Kit's verbose English markdown would burden the owner. A short Italian product doc plus a decision log is a better fit.
- A reasonable hybrid for v1:
  - Keep `SPEC.md` as the living, spec-anchored product doc.
  - For each feature, write a short section with acceptance criteria in plain Italian, which can double as test cases for `logica.test.ts`.
  - Skip full Spec Kit/Kiro tooling.
- The cons (agents ignoring parts of specs, review burden) argue for converting key spec items into tests or checks wherever possible.

### Gaps
- Böckeler's tests were run in Sept 2025. Spec Kit and Kiro evolve fast and may have changed by Nov 2026, and I did not verify later versions.
- No data found on SDD outcomes for solo or tiny projects specifically.

## 5. Recording decisions with a non-technical owner so agents don't re-decide them, and handling conflicts between agents' proposals

### Takeaway
Use a short decision log (ADR-style, or a `PRODOTTO.md` "Decisioni" section) that the instruction file points to. Accepted decisions are binding, and changing one means writing a new entry that supersedes it, not a silent edit. Agents may draft entries and flag conflicts, but only the human owner decides. When agents' proposals conflict, the agent must stop and ask rather than pick one, because contradictory instructions lead the model to choose arbitrarily.

### Cited Findings
- Duncan Davidson (O'Reilly Radar, 2 Oct 2026):
  - ADRs are Markdown files in `docs/decisions/`.
  - AGENTS.md tells agents to propose new or updated ADRs when a change introduces a durable decision.
  - Accepted ADRs are binding: if a task conflicts with one, the agent should stop and discuss whether the task or the ADR should change.
  - Proposed ADRs are non-binding context. Superseded ADRs are historical only.
  - One rule per ADR, with cross-references instead of restating.
  — [O'Reilly: Coding agents love decision records](https://www.oreilly.com/radar/coding-agents-love-decision-records/)
- Problems Davidson observed:
  - Agents "overfit" to accepted but obsolete decisions. One agent added a compatibility layer instead of flagging the mismatch, so he gives agents explicit permission to question decisions that no longer fit.
  - Agents asked to update ADRs pad them with deliberation, so he needed brevity rules.
  - Evidence is anecdotal.
  — [O'Reilly: Coding agents love decision records](https://www.oreilly.com/radar/coding-agents-love-decision-records/)
- Other practitioners:
  - Rejections that live only in chat or review threads are invisible to agents.
  - Add a pointer such as "Before proposing architectural changes, check docs/adr/ for prior decisions."
  - Treat merged records as immutable and supersede them instead, because silent edits were a real problem.
  - With many records, keep an index of decisions in force.
  - "An agent can draft a record, keep the index, and flag a contradiction. A human decides."
  — [Tian Pan: The ADR your agent never read (Jul 2026)](https://tianpan.co/blog/2026-07-02-the-adr-your-agent-never-read); [Brief: Decision capture is a write-path problem](https://briefhq.ai/blog/decision-capture-ai-coding-agents-write-path/); [Codeminer42: Stale docs are prompt injection you wrote yourself](https://blog.codeminer42.com/stale-docs-are-prompt-injection-you-wrote-yourself/)
- Anthropic: put "Decisions that aren't in the repo" in CLAUDE.md. Contradictory instructions mean Claude "may pick one arbitrarily." User-level and project-level rules don't override each other, so keep them consistent. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices); [Claude Code docs: memory](https://code.claude.com/docs/en/memory)
- Kiro steering advice: record "why decisions were made" and review steering changes like code changes. — [Kiro docs: steering](https://kiro.dev/docs/steering/)
- Conflicting parallel outputs:
  - Cognition: conflicting implicit decisions from subagents had to be reconciled at the end, and passing the original task to each subagent did not fix it.
  - Anthropic's research system: clear boundaries and output formats per subagent prevented duplicate or overlapping work.
  - Anthropic's compiler: lock files claim tasks, and git merges resolve code-level collisions.
  — [Cognition](https://cognition.com/blog/dont-build-multi-agents); [Anthropic multi-agent research](https://www.anthropic.com/engineering/multi-agent-research-system); [Anthropic C compiler](https://www.anthropic.com/engineering/building-c-compiler)

### Inferences
- Concrete pattern for this project:
  1. Add a `## Decisioni` section (or `DECISIONI.md`, imported or referenced from CLAUDE.md). Each entry is numbered, dated and in plain Italian: "D-07 (2026-11-18): il pagamento parziale si registra come importo, non come percentuale. Deciso da: titolare. Sostituisce: —".
  2. Add a CLAUDE.md rule: "Prima di proporre un cambiamento, controlla le Decisioni. Se un compito va contro una decisione, fermati e chiedi al titolare; non decidere da solo."
  3. To change a decision, add a new entry marked "Sostituisce D-07" and never edit old ones silently.
  4. Agents' alternative proposals go into a "Proposte aperte" list with options explained simply. The owner picks one, and the pick becomes a Decisione.
- For parallel agents:
  - Assign each agent separate files or screens.
  - Reserve shared files (`logica.ts`, `db.ts`, tokens, `ui.tsx`) to one owner at a time, or to a sequential "foundation" step.
  - Have each agent write a short handoff note (done / not done / open questions) to a progress file.
  - Have a coordinator, or the human, merge the open questions into "Proposte aperte" instead of letting agents resolve them among themselves.
- This fits the user's standing memory rule ("decidere insieme il prodotto"). The decision log is the durable form of "deciding together."

### Gaps
- No source found specifically on decision logs co-maintained with *non-technical* owners. The ADR guidance assumes technical teams. Plain-language adaptation is an inference.
- No empirical comparison found of conflict-resolution strategies (human arbiter vs. judge agent vs. voting) for coding agents' design proposals.
