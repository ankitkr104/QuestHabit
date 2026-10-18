# Contributing to QuestHabit

Thank you for your interest in contributing to QuestHabit! QuestHabit is a
frontend-only, local-first habit tracker. Contributions are welcome from
**[Nexus Spring of Code (NSoC)](https://www.nsoc.in/)** participants and the
wider open source community.

Please read the [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Nexus Spring of Code (NSoC)

If you are contributing through NSoC:

- Check existing issues before starting work and choose a task that matches
  your experience.
- Comment on the issue with your intended approach so work can be coordinated.
- Prefer small, focused pull requests; they are easier to review and merge.
- Reference the issue in your pull request when one exists.
- Use the `good first issue` and `help wanted` labels when available.
- Ask questions in the issue discussion or the official NSoC community
  channels rather than sending unsolicited direct messages.
- Follow the project's [Code of Conduct](./CODE_OF_CONDUCT.md) in all
  repository and community interactions.

## Contribution levels and badges

Every accepted contribution is reviewed and assigned a level based on the
scope and complexity of the change. Contributors receive the corresponding
level badge after their pull request is merged:

### Level 1 badge — Documentation and small improvements

For documentation updates, typo fixes, copy changes, examples, and other
small, low-risk improvements that do not change application behavior.

### Level 2 badge — UI/UX and frontend work

For layouts, React components, styling, responsive behavior, accessibility
improvements, page-level changes, themes, and other frontend experience work.

### Level 3 badge — Core logic and complex features

For game rules, XP and streak calculations, scheduling, persistence and
storage behavior, import/export, data-model changes, and complex features
that require deeper architectural or regression consideration.

The level is assigned by maintainers after review, based on the actual merged
change rather than only the issue category. A single contribution should
receive the highest applicable level badge, and contributors can earn more
than one level badge through separate contributions.

## Project boundaries

QuestHabit is intentionally frontend-only and local-first:

- The UI is built with React, TypeScript, Vite, and CSS.
- Application code lives in `src/`.
- Game rules belong in `src/lib/game.ts`.
- Browser persistence belongs in `src/lib/storage.ts`.
- User data is stored in the browser under `questhabit.state`.
- The project must not add a backend, cloud database, authentication provider,
  server API, serverless function, automatic synchronization, or external
  service that receives private habit data without prior maintainer discussion.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the data flow and
responsibilities of each source file.

## Getting started

### Prerequisites

- Node.js 20 or a current Node.js LTS release
- npm
- Git

### Local setup

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/QuestHabit.git
   cd QuestHabit
   ```

2. Create a branch from `main`:

   ```bash
   git checkout -b feature/short-description
   ```

   Use one of these prefixes where appropriate:
   `feature/`, `fix/`, `docs/`, `test/`, or `chore/`.

3. Install dependencies:

   ```bash
   npm ci
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Make your change, keeping it focused on the issue or improvement being
   addressed.

## How to contribute

### Bug reports

Open a bug report using the repository's **Bug report** issue form. Include:

- Reproduction steps
- Expected behavior
- Actual behavior
- Browser, operating system, and whether the problem occurs locally or on a
  deployment

For logic bugs, include the smallest reproducible example you can. Do not
include private habit data or exported storage files.

### Feature requests

Use the **Feature request** issue form. Explain:

- The user problem or opportunity
- Your proposed solution
- Alternatives considered
- UX, accessibility, performance, and local-first implications

For substantial changes, discuss the approach in an issue before coding.
Please wait for coordination on features that affect the data model,
persistence format, or application architecture.

Category-specific issue forms are also available for:

- **Documentation and small improvements** — Level 1 work
- **UI/UX and frontend** — Level 2 work
- **Core logic and complex features** — Level 3 work

Choose the most specific form when opening an issue. The level is a guide for
triage; maintainers make the final badge assignment after the contribution is
merged.

### Implementation guidance

- Look for an existing helper or rule before adding new logic.
- Keep XP, level, streak, scheduling, achievement, and import/export rules in
  `src/lib/game.ts` or the appropriate existing boundary.
- Use `src/lib/storage.ts` for persistence instead of accessing
  `localStorage` directly from UI components.
- Prefer immutable state updates and precise TypeScript types.
- Use semantic HTML, labels, visible focus states, keyboard-friendly controls,
  sufficient contrast, and responsive layouts.
- Keep components and styles consistent with the existing patterns.
- Add or update tests when changing business rules, persistence, or edge-case
  behavior.
- Update related documentation when the behavior or architecture changes.

## Testing and required checks

GitHub Actions runs these checks on every push and pull request:

| Check | Command |
| --- | --- |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests | `npm test` |
| Production build | `npm run build` |

Run the checks locally before opening a pull request:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Visual changes should be checked at desktop and mobile widths. Include
screenshots or a short recording in the pull request when they help reviewers
understand the change. Test behavior that affects dates, scheduling, streaks,
storage, import/export, or progression rather than relying only on visual
inspection.

## Branches, commits, and rebasing

Keep branches focused and use descriptive names such as:

- `feature/quest-filters`
- `fix/streak-calculation`
- `docs/contributing-guide`
- `test/xp-progression`

Write concise, imperative commit subjects:

```text
Add weekday quest scheduling test
Fix local date conversion
Document Vercel deployment
```

There is no required Conventional Commits automation, but clear commit
messages make review and release history easier to understand.

Before opening a pull request, and again when your branch falls behind `main`,
update it with a rebase:

```bash
git fetch origin
git rebase origin/main
```

If conflicts occur, resolve each file, stage the resolution, and continue:

```bash
git add <resolved-file>
git rebase --continue
```

If the branch has already been pushed, update it safely with:

```bash
git push --force-with-lease
```

Never use plain `git push --force` on a shared branch.

## Pull requests

Open a pull request against `main` and use the repository
[pull request template](./.github/PULL_REQUEST_TEMPLATE.md). Category-specific
templates are available in
[`.github/PULL_REQUEST_TEMPLATE/`](./.github/PULL_REQUEST_TEMPLATE/) for
documentation, UI/UX, and core logic work. Use the template matching the main
focus of your pull request. A useful pull request includes:

- A concise summary of what changed and why
- A related issue or discussion, when applicable
- Important implementation decisions or tradeoffs
- Screenshots or recordings for visual changes
- The exact validation commands that were run
- Accessibility considerations for interactive or visual changes
- Documentation updates or an explanation of why none were needed

Before requesting review, confirm that:

- [ ] The change is focused and avoids unrelated formatting.
- [ ] Relevant tests or validation were added and run.
- [ ] Existing behavior is preserved unless the change intentionally updates it.
- [ ] Interactive UI is keyboard-usable, labeled, and responsive.
- [ ] Documentation was updated where needed.
- [ ] No secrets, environment files, browser exports, `node_modules/`, or
      generated `dist/` files are committed.
- [ ] No backend, cloud database, authentication provider, remote habit-data
      persistence, or serverless function was introduced.

Push follow-up changes to the same branch instead of opening a second pull
request. CI will run again automatically.

## AI-assisted contributions

AI tools may be used to assist with contributions, but the contributor is
responsible for every line submitted. AI-assisted pull requests must:

1. Address a real issue or clearly described improvement.
2. Include a test plan with commands that were actually run.
3. Be understandable and explainable by the contributor during review.
4. Stay within the scope of the issue and avoid speculative rewrites.
5. Preserve QuestHabit's privacy and local-first boundaries.

## Security and privacy

Never commit API keys, credentials, tokens, private browser exports, or
environment files. Do not log or upload user habit data. If you discover a
security or privacy concern, do not include sensitive details in a public
issue; contact the project maintainer privately and provide only the minimum
information needed to investigate.

## License

By contributing to QuestHabit, you agree that your contributions are licensed
under the [MIT License](./LICENSE).
