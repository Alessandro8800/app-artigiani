# Multi-agent AI systems for building software (focus: Claude Code), 2025-2026

Research date: 2026-11-18. Source legend: [PRIMARY-Anthropic] = Anthropic blog or official Claude Code docs; [PRIMARY-other] = the vendor or authors' own publication; [ACADEMIC] = paper or research lab; [SECONDARY] = press or aggregator. The Claude Code docs at code.claude.com are living pages, read on 2026-11-18. Older sources are flagged.

## 1. What does Anthropic officially say about multi-agent systems, and when does it recommend one agent vs several?

### Takeaway
Anthropic's message is consistent: start with the simplest setup and add agents only when the work splits into independent parts. Research, review and investigating competing hypotheses benefit. Most coding, sequential work, same-file edits and tightly dependent work are better done in a single session, or with subagents that only report back.

### Cited Findings
- [PRIMARY-Anthropic, Dec 2024, older than 2025] "Building effective agents" recommends "finding the simplest solution possible, and only increasing complexity when needed", which may mean not building an agentic system at all. It warns that agentic systems "trade latency and cost for better task performance" and risk compounding errors. — [Anthropic](https://www.anthropic.com/engineering/building-effective-agents)
- [PRIMARY-Anthropic, Dec 2024] The same post defines the patterns:
  - Orchestrator-workers: a central LLM splits a task dynamically and merges the results. Its coding example is a change across several files whose number can't be predicted.
  - Parallelization, by "sectioning" (independent subtasks) or "voting" (the same task run several times). Its example is several prompts reviewing code for vulnerabilities. — [Anthropic](https://www.anthropic.com/engineering/building-effective-agents)
- [PRIMARY-Anthropic, Jun 13 2025] "How we built our multi-agent research system" names the cases where multi-agent setups fit poorly:
  - domains where all agents must share the same context, or with many dependencies between agents;
  - "most coding tasks", which have fewer parallelizable parts than research;
  - low-value tasks, because of the token cost;
  - real-time coordination, which LLM agents don't handle well yet. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- [PRIMARY-Anthropic, docs] Agent teams are **experimental and off by default** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). The page says "Before you set up a team, check whether a lighter option does the job." Teams work best for research and review, new modules each owned by one teammate, debugging with competing hypotheses, and cross-layer changes. "For sequential tasks, same-file edits, or work with many dependencies, a single session or subagents are more effective." — [Claude Code docs: agent teams](https://code.claude.com/docs/en/agent-teams)
- [PRIMARY-Anthropic, docs] Advice for people new to agent teams: "start with tasks that have clear boundaries and don't require writing code: reviewing a PR, researching a library, or investigating a bug." Suggested size is 3-5 teammates and 5-6 tasks per teammate. "Three focused teammates often outperform five scattered ones." — [Claude Code docs: agent teams](https://code.claude.com/docs/en/agent-teams)
- [PRIMARY-Anthropic, docs] Stay in the main conversation when:
  - the task needs frequent back-and-forth;
  - planning, implementation and testing share a lot of context;
  - the change is quick and targeted;
  - latency matters, because "A subagent that isn't a fork starts fresh and may need time to gather context."

  Use subagents when the output is verbose, when you want to restrict tools, or when the work is self-contained and can come back as a summary. — [Claude Code docs: subagents](https://code.claude.com/docs/en/sub-agents.md)
- [PRIMARY-Anthropic, docs] Built-in subagents: Explore (read-only search), Plan (read-only research in plan mode) and general-purpose. Subagents can nest up to 3 levels and up to 20 can run at once by default. A subagent can run in its own git worktree (`isolation: worktree`). — [Claude Code docs: subagents](https://code.claude.com/docs/en/sub-agents.md)
- [PRIMARY-Anthropic, docs] Best-practices page: subagents pay off for four things:
  - running independent pieces at the same time;
  - keeping long output out of the main conversation;
  - getting "a reviewer that hasn't seen how the code was written";
  - giving a task fewer tools than the main session has.

  It also says: "You get parallelism or a fresh pair of eyes out of it, but not a smarter answer." And: "Handing the same task to a subagent doesn't make the answer any better. A fresh reviewer does help." — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [PRIMARY-Anthropic, docs] The same page now lists "Use subagents to protect your context window" as outdated advice. Most current models have a 1M-token window and compact on their own. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [PRIMARY-Anthropic, docs] Parallel sessions: "give each its own checkout so the edits can't collide" (`claude -w <name>`). "A second session is also the easiest independent reviewer you can get." `/batch` splits one large mechanical change into 5-30 units, each with its own worktree. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [PRIMARY-Anthropic, docs] Worktrees isolate file edits only. A worktree is a fresh checkout: dependencies and gitignored files such as `.env` aren't there unless you set them up (`.worktreeinclude`). A worktree branches from the default branch, not your current HEAD, unless `worktree.baseRef: "head"` is set. — [Claude Code docs: worktrees](https://code.claude.com/docs/en/worktrees.md)

### Inferences
- In Anthropic's guidance, the order to try is: one session, then subagents (mainly for research, review and noisy output), then manual parallel sessions in worktrees, and only then agent teams. Agent teams are explicitly experimental.
- Anthropic's stated reasons to use extra agents today are parallelism, keeping the main context clean, and independent review. Answer quality is explicitly not one of them.

### Gaps
- I found no official Anthropic benchmark that compares agent teams with a single session on coding quality.

## 2. What costs and performance gains or losses have been measured?

### Takeaway
Extra agents multiply token use: about 4x for an agent vs chat, about 15x for a multi-agent system vs chat, and about 7x for an agent team in plan mode vs a standard session. Gains appear on parallel research-like tasks (+90% internal research eval, +81% on a financial task). Sequential tasks get worse by 39-70%.

### Cited Findings
- [PRIMARY-Anthropic, Jun 2025]
  - Agents use about 4x the tokens of chat; multi-agent systems use about 15x.
  - An Opus 4 lead with Sonnet 4 subagents beat single-agent Opus 4 by 90.2% on Anthropic's internal research eval.
  - On BrowseComp, token usage alone explained 80% of the performance variance; tool calls and model choice brought it to 95%. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- [PRIMARY-Anthropic, docs] "Agent teams use approximately 7x more tokens than standard sessions when teammates run in plan mode." Token use "scales with the number of active teammates." The page advises Sonnet for teammates, small teams, and shutting teammates down when they finish. — [Claude Code docs: costs](https://code.claude.com/docs/en/costs.md)
- [PRIMARY-Anthropic, docs] Baseline cost: on average about $13 per developer per active day and $150-250 per month (enterprise deployments); under $30 per active day for 90% of users. Subagents "count toward the same usage limits as your main conversation." — [Claude Code docs: costs](https://code.claude.com/docs/en/costs.md); [subagents](https://code.claude.com/docs/en/sub-agents.md)
- [PRIMARY-Anthropic, docs] A subagent can be slower than doing the task in place, because "a fresh subagent first has to gather context your conversation already had". — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [PRIMARY-Anthropic, Feb 5 2026] Case study: 16 parallel Claude Opus 4.6 agents built a C compiler in Rust of about 100,000 lines that can build Linux 6.9 on x86, ARM and RISC-V.
  - Effort: nearly 2,000 sessions over about 2 weeks.
  - Cost: just under $20,000 in API fees (2 billion input and 140 million output tokens). — [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- [ACADEMIC, Google Research, arXiv Dec 2025 / blog Jan 28 2026] The study tested 180 agent configurations, 5 architectures, 4 benchmarks and 3 model families (GPT, Gemini, Claude).
  - Centralized multi-agent coordination: +80.9% on a parallelizable financial task.
  - Every multi-agent variant: -39% to -70% on a sequential planning task (PlanCraft).
  - Coordination overhead grows as the number of tools grows; a coding agent with 16+ tools is the example. — [Google Research blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/); [arXiv 2512.08296](https://arxiv.org/abs/2512.08296)
- [PRIMARY-other, Cognition, Apr 22 2026] Devin Review (a reviewer agent with clean context) catches on average 2 bugs per PR, about 58% of them severe. This is the vendor's own number. — [Cognition](https://cognition.com/blog/multi-agents-working)
- [ACADEMIC, Jul 2025, context only, not multi-agent] METR ran a randomized trial with 16 experienced open-source developers. Allowing AI tools (mostly Cursor with Claude Sonnet) increased task time by 19%, while the developers believed it saved them about 20%. — [arXiv 2507.09089](https://arxiv.org/pdf/2507.09089)

### Inferences
- The 4x and 15x figures are for research agents vs chat, not coding. The 7x figure is the one Anthropic gives specifically for Claude Code agent teams.
- The extra tokens are mostly what buys the performance on research tasks (80% of variance). On coding, the tokens pay off only if the work is truly parallel.
- The METR result suggests perceived speed-ups from AI tools need checking against measured time.

### Gaps
- I found no measured quality comparison between Claude Code subagents or agent teams and a single session on ordinary app development.
- The 7x figure has no published method behind it.

## 3. What failure modes are documented for multi-agent coding?

### Takeaway
Failures come mostly from system design and coordination, not from the model alone. The documented ones are:
- conflicting implicit decisions;
- lost or missing context;
- duplicated work;
- agents overwriting each other's edits;
- regressions;
- weak or missing verification;
- premature stopping;
- error amplification in uncoordinated parallel agents (up to 17x).

### Cited Findings
- [PRIMARY-other, Cognition, Jun 12 2025] "Don't Build Multi-Agents" (Walden Yan) sets out two principles: "Share context, and share full agent traces, not just individual messages" and "Actions carry implicit decisions, and conflicting decisions carry bad results."
  - Flappy Bird example: one subagent built a Super Mario-style background and another built a bird that didn't fit; the final agent had to reconcile both misunderstandings.
  - Recommendation: a single-threaded, linear agent by default.
  - On Claude Code (June 2025): its subagents mostly answer well-defined questions rather than write code. — [Cognition](https://cognition.com/blog/dont-build-multi-agents)
- [PRIMARY-other, Cognition, Apr 22 2026] Follow-up "Multi-Agents: What's Actually Working". Multi-agent setups work when "writes stay single-threaded and the additional agents contribute intelligence rather than actions."
  - Parallel writers "make implicit choices about style, edge cases, and code patterns", which conflict; unstructured swarms are "mostly a distraction".
  - Communication, not capability, is the main bottleneck.
  - The large demos (100k-line compiler and others) had simple, verifiable success criteria, unlike most real software. — [Cognition](https://cognition.com/blog/multi-agents-working)
- [ACADEMIC] "Why Do Multi-Agent LLM Systems Fail?" (Cemri et al., UC Berkeley; v1 Mar 2025, v3 Oct 2025). It annotated 1,642 traces from 7 frameworks: MetaGPT, ChatDev, HyperAgent, AppWorld, AG2, Magentic-One and OpenManus. Failure rates ranged from 41% to 86.7%.
  - The MAST taxonomy has 14 failure modes in 3 groups: system design, inter-agent misalignment, and task verification.
  - Most common modes:

    | Failure mode | Share |
    | :- | :- |
    | Step repetition | 15.7% |
    | Reasoning-action mismatch | 13.2% |
    | Unaware of termination conditions | 12.4% |
    | Disobeying the task specification | 11.8% |
    | Incorrect verification | 9.1% |
    | No or incomplete verification | 8.2% |
    | Task derailment | 7.4% |
    | Failure to ask for clarification | 6.8% |
    | Premature termination | 6.2% |

  - Fixes on ChatDev: better role specifications gave +9.4% success; adding a verification step for the high-level objective gave +15.6%. Completion rates stayed low. — [arXiv 2503.13657](https://arxiv.org/html/2503.13657v3)
- [ACADEMIC, Google Research] Uncoordinated parallel agents amplified errors up to 17.2x; centralized orchestration contained this to 4.4x. — [Google Research blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)
- [PRIMARY-Anthropic, Jun 2025] Failures seen in Anthropic's own research system:
  - 50 subagents spawned for simple queries;
  - endless searching;
  - agents distracting each other with too many updates;
  - duplicated work from vague instructions (two subagents researched the same topic).

  Remedy: give each subagent an objective, an output format, tool guidance and clear task boundaries. — [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- [PRIMARY-Anthropic, Feb 2026] Problems in the C compiler project:
  - all 16 agents hit the same Linux bug, fixed it, and "overwrote each other's changes";
  - merge conflicts were frequent;
  - new features often broke existing ones, which required continuous integration;
  - "the task verifier must be nearly perfect" or Claude solves the wrong problem.

  The author warns that passing tests is not the same as the job being done. — [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- [PRIMARY-Anthropic, docs] Known problems with agent teams:
  - "Two teammates editing the same file leads to overwrites";
  - task status can lag and block dependent tasks;
  - the lead can stop early, or start implementing instead of waiting;
  - teammates may stop after errors;
  - `/resume` doesn't bring back in-process teammates;
  - teammates don't inherit the lead's conversation history;
  - permission prompts pile up in the lead session. — [Claude Code docs: agent teams](https://code.claude.com/docs/en/agent-teams)
- [PRIMARY-Anthropic, docs] A reviewer asked to find problems "will always find something"; fixing every finding adds needless abstraction. Hence the advice to tell a reviewer to "skip style". — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)

### Inferences
- The strongest single risk for code is two agents writing in parallel on shared design decisions or shared files. Cognition, the Anthropic docs and the C compiler post all flag it independently.
- Good verification (tests, a written spec) protects more than adding agents does: verification failures make up about a quarter of MAST failures.

### Gaps
- The MAST per-framework failure rates for MetaGPT and ChatDev sit in figures I couldn't extract; only the overall 41-86.7% range is confirmed.

## 4. Which software tasks parallelize well and which don't?

### Takeaway
Work that parallelizes well:
- read-only research and exploration;
- code review through independent lenses (security, performance, tests);
- competing debugging hypotheses;
- verbose jobs such as test runs and log processing;
- separate modules or files with clear ownership;
- large mechanical changes split into independent units.

Work that parallelizes poorly: sequential reasoning, tightly coupled code, same-file edits, and shared design or style decisions.

### Cited Findings
- [PRIMARY-Anthropic, docs] Good cases: parallel code review (security, performance and test coverage as separate lenses), competing debugging hypotheses (which counters anchoring on the first theory), new modules each owned by one teammate, and cross-layer work split into frontend, backend and tests. Bad cases: sequential work, same-file edits, many dependencies. — [Claude Code docs: agent teams](https://code.claude.com/docs/en/agent-teams)
- [PRIMARY-Anthropic, docs] Delegate test runs, documentation fetches and log processing to subagents so the noisy output stays out of the main context. — [Claude Code docs: costs](https://code.claude.com/docs/en/costs.md)
- [PRIMARY-Anthropic, docs] `/batch` is for "one big mechanical change across many files", split into 5-30 units, each in its own worktree. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [PRIMARY-Anthropic, Feb 2026] Parallelism worked while there were many independent failing tests. It stopped working when the task became "one large job" (the kernel build). GCC was then used as an oracle to split the work again. — [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- [ACADEMIC] Parallelizable tasks gain (+81%) and sequential tasks lose (-39% to -70%). — [Google Research blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)
- [PRIMARY-other, Cognition, 2026] What works: one writer plus reviewers, researchers and advisors. What doesn't: parallel writers. — [Cognition](https://cognition.com/blog/multi-agents-working)
- [PRIMARY-Anthropic, Dec 2024] Sectioning and voting suit work such as vulnerability review. — [Anthropic](https://www.anthropic.com/engineering/building-effective-agents)

### Inferences
- A practical rule for coding: parallelize reading and judging, not writing. Only parallelize writing when files and ownership are strictly separate and a test suite catches regressions.

### Gaps
- None significant for this question.

## 5. What does the evidence say for a very small project (a single-page PWA with one non-technical owner)?

### Takeaway
No source studies tiny projects directly. Everything above points the same way: for a small, tightly coupled app (shared data model, shared UI style, a few files), one main session is the right default. Optionally add a read-only reviewer or researcher subagent and a fresh-session review against the spec. Agent teams and parallel writers add cost (around 7x or more), merge risk and supervision load that a non-technical owner can't easily absorb.

### Cited Findings
- [PRIMARY-Anthropic] Use the main conversation for quick, targeted changes and for phases that share context. Agent teams are for complex work, and "for routine tasks, a single session is more cost-effective." — [subagents](https://code.claude.com/docs/en/sub-agents.md); [agent teams](https://code.claude.com/docs/en/agent-teams)
- [PRIMARY-Anthropic] Coordination overhead outweighs the benefit when tasks are "too small". Leaving a team "run unattended for too long increases the risk of wasted effort", which means teams need active monitoring and steering. — [agent teams](https://code.claude.com/docs/en/agent-teams)
- [PRIMARY-Anthropic] Recommended low-cost pattern: write `SPEC.md`, build in a fresh session, then have a subagent or a second session review the diff against `SPEC.md` ("report gaps that affect correctness and skip style"). — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [PRIMARY-Anthropic] A read-only reviewer can be enforced with `tools: Read, Grep, Glob` in `.claude/agents/reviewer.md`. Use `model: haiku` for simple subagent jobs to lower cost. — [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- [PRIMARY-other] Single-threaded writing is the default that works. Large multi-agent demos depended on "simple, verifiable success criteria". — [Cognition 2025](https://cognition.com/blog/dont-build-multi-agents); [Cognition 2026](https://cognition.com/blog/multi-agents-working)
- [PRIMARY-Anthropic] Agent teams are experimental, have resume and shutdown limits, and can form automatically once enabled when Claude names a subagent. Split-pane mode needs tmux or iTerm2. — [agent teams](https://code.claude.com/docs/en/agent-teams)

### Inferences
- For this app, a "team" probably means one builder session, plus specialized read-only helpers such as a spec or acceptance reviewer, a test runner, or a researcher. It does not mean several parallel writers. This matches the project's CLAUDE.md rule of committing only code that builds and passes tests: the test suite and the spec act as the verifier.
- Parallel worktree sessions only make sense here for clearly separate pieces, for example the backup/export module vs a single screen file, and each must merge back through build and test. Changes to `logica.ts` or `db.ts` are shared foundations and should stay single-threaded.
- For a non-technical owner, the harder costs are coordination and supervision: merge conflicts, permission prompts and diverging styles. That argues for the simplest setup.

### Gaps
- No study measures multi-agent setups on very small apps or with non-technical supervisors. The conclusions here are extrapolated from general guidance.
