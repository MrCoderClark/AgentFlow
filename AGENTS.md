<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Read Before Anything Else

Read in this exact order before any implementation:

1. context/project-overview.md
2. context/architecture.md
3. context/ui-tokens.md
4. context/ui-rules.md
5. context/ui-registry.md
6. context/code-standards.md
7. context/library-docs.md
8. context/build-plan.md
9. context/progress-tracker.md

## Rules That Never Change

- Never use hardcoded hex values or raw Tailwind color classes
- Update `progress-tracker.md` and `ui-registry.md` after every feature
- Before any third party library — load its installed skill first,
  then read `context/library-docs.md` for project-specific rules
- **Design Image Fidelity (CRITICAL):** Before building ANY UI component,
  read the design images in `context/designs/`. Match them exactly —
  every element, spacing, color, icon, layout, and interaction visible in
  the design MUST appear in the implementation. After building, re-read the
  design and compare. Never claim a UI task is done without verifying against
  the design image. Available designs:
  - `context/designs/Design-Backend.webp` — Agent inbox (3-panel)
  - `context/designs/Design-Flow.png` — Bot flow builder + widget preview
- If the same problem persists after one corrective prompt —
  stop immediately and run /recover

## Available Skills

- `/architect` — choosing between approaches, designing a feature or page, picking a tech stack, or when a load bearing decision is unmade.
- `/audit` — bootstrap AI context on a greenfield project, existing codebase with missing docs, or one area.
- `/check` — before merge. `/check verify` proves behavior against the spec; `/check review` runs a senior code review.
- `/debug` — find and fix root cause of a bug. Reproduce, localize, hypothesize, fix, verify.
- `/develop` — build a feature (UI or backend) from an approved design or spec.
- `/document` — write human facing prose: `pr`, `changelog`, `release-note`, or `postmortem`.
- `/scope` — turn a product idea into a living scope; plan next slice or reconcile after shipping.
- `/sync` — after a change is complete. Updates AGENTS.md, reconciles scope, flags stale specs.
- `/test` — write a test suite for code you just built or changed.
