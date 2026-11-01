# Contributing to OpenCV

Thanks for taking an interest. This file covers everything on the development
side: getting the workspace running, how the code is laid out, the commands you
will use, and what a good pull request looks like.

If you are here to *use* the app rather than work on it, the [README](README.md)
is the better starting point.

## Table of contents

- [Prerequisites](#prerequisites)
- [Getting the source running](#getting-the-source-running)
- [Workspace layout](#workspace-layout)
- [Commands](#commands)
- [Environment variables](#environment-variables)
- [Working on the MCP server](#working-on-the-mcp-server)
- [Building the static site](#building-the-static-site)
- [Things to know before you change code](#things-to-know-before-you-change-code)
- [Writing style](#writing-style)
- [Pull requests](#pull-requests)
- [Reporting bugs and requesting features](#reporting-bugs-and-requesting-features)
- [License](#license)

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| [Node.js](https://nodejs.org) | 20 LTS or newer | CI runs on `lts/*`. |
| [pnpm](https://pnpm.io) | 9 or newer | The workspace uses pnpm workspaces; npm and yarn will not resolve `workspace:*` deps. |
| Git | any recent version | |

Nx drives every task. You do not need it installed globally: `npx nx` resolves
the version pinned in the repo.

## Getting the source running

```bash
git clone https://github.com/brionmario/opencv.git
```

```bash
cd opencv && pnpm install
```

```bash
npx nx run @brionmario/opencv:dev
```

The app comes up on [http://localhost:3000](http://localhost:3000). Next.js
picks the next free port if 3000 is taken, so check the terminal output.

`pnpm dev` from the root does the same thing through `nx run-many`, which is
useful once you are touching more than one project at a time.

Nothing else is required for a first run: there is no database, no API keys and
no accounts. Résumés live in the browser's `localStorage` and in share links,
so a fresh checkout is immediately usable.

## Workspace layout

```
apps/
  opencv/              Next.js 16 app (App Router, React 19, Tailwind 4)
    app/               Routes: / (dashboard), /editor, /templates, /view
    components/
      dashboard/       Document library: create, open, duplicate, delete
      cv-builder/      The editor shell: toolbar, canvas, export, share, versions
      cv-editor/       Editing surfaces: inline editor, panels, pickers, theming
      cv-templates/    The four print layouts
      ui/              shadcn/ui primitives
    lib/               Storage, versioning, share URLs, PDF/HTML/Markdown export
packages/
  core/                Framework-free résumé model shared by app and MCP server
    src/types.ts            CVData and the section model
    src/layouts.ts          The four layouts and their metadata
    src/share.ts            Share-link codec (deflate + base64url)
    src/json-resume.ts      JSON Resume <-> CVData conversion
    src/starter-templates.ts  Sample documents
  mcp/                 MCP server: build, read and revise résumés from an agent
docs/assets/           Images used by the docs
```

The important boundary is `packages/core`. Anything that both the web app and
the MCP server need to agree on, above all the share-link format and the
JSON Resume mapping, belongs there and must stay free of React, Next and
browser-only globals.

## Commands

Run tasks through Nx rather than the underlying tool, so dependent projects get
built in the right order.

| Command | What it does |
| --- | --- |
| `npx nx run @brionmario/opencv:dev` | Dev server for the web app. |
| `npx nx build @brionmario/opencv` | Production build (static export by default). |
| `npx nx run @brionmario/opencv-mcp:build` | Build the MCP server and, first, `core`. |
| `npx nx run-many --target=typecheck --all` | Typecheck every project. |
| `npx nx run-many --target=lint --all` | Lint every project. |
| `npx nx run-many --target=build --all` | Build everything. |
| `npx nx graph` | Open the project graph in a browser. |

The root `package.json` wraps the common ones as `pnpm dev`, `pnpm build`,
`pnpm lint`, `pnpm typecheck` and `pnpm test`.

There is no automated test suite yet. The `test` target is wired up and waiting
for the first suite, so a PR that adds tests alongside a change is very welcome.

Before opening a pull request, run at minimum:

```bash
npx nx run-many --target=typecheck --all
```

## Environment variables

None are required for local development. All of these are optional.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_PATH` | web app | Sub-path the site is served from. CI sets `/opencv` for GitHub Pages; empty locally. |
| `NEXT_OUTPUT` | web app | Next.js `output` mode. Defaults to `export`. Set it to `standalone` or unset it when you need a server runtime. |
| `NEXT_PUBLIC_SITE_URL` | web app | Absolute origin used for canonical URLs, sitemap and structured data. |
| `OPENCV_BASE_URL` | MCP server | Origin the minted share links point at. Defaults to the public deployment. |

The AI suggestion endpoint at `app/api/ai/suggestions/route.ts` calls the
[AI SDK](https://sdk.vercel.ai) with a gateway model id, so it needs an
`AI_GATEWAY_API_KEY` in the environment and a non-`export` build to run as a
real route. The rest of the app does not depend on it.

## Working on the MCP server

`packages/mcp` runs from `dist`, and it depends on `@brionmario/opencv-core`, so
build through Nx and let it order the two:

```bash
npx nx run @brionmario/opencv-mcp:build
```

The repo's `.mcp.json` already registers the built server, so Claude Code picks
it up inside this workspace. Point it at a local dev server while you work:

```bash
OPENCV_BASE_URL=http://localhost:3000 node packages/mcp/dist/index.js
```

See [`packages/mcp/README.md`](packages/mcp/README.md) for the tool list and the
details of how links are minted.

## Building the static site

The deployed site is a static export. To reproduce what CI publishes:

```bash
NEXT_OUTPUT=export NEXT_PUBLIC_BASE_PATH=/opencv npx nx build @brionmario/opencv
```

The result lands in `apps/opencv/out`. Serve it with any static file server to
check it, remembering that the base path has to match what you built with.

Deployment itself is automatic: every push to `main` runs
[`.github/workflows/deploy-gh-pages.yaml`](.github/workflows/deploy-gh-pages.yaml)
and publishes to GitHub Pages. A manual run from the Actions tab is the only way
to deploy under a different base path.

## Things to know before you change code

**Share links are a public format.** A link carries the entire document in its
URL fragment, so a link someone saved last month must still decode today. The
payload is versioned (`v: 1`); change the shape by adding a version and keeping
the old path readable, never by redefining the current one.

**Saved documents are a public format too.** The editor reads `localStorage` on
every load. A change to the stored shape needs a migration, in the same spirit
as the theme migration already in `cv-builder/index.tsx`.

**There is no server.** No database, no accounts, no analytics beyond what is
already in place. A feature that needs to store something on a machine other
than the visitor's own is a change of direction for the project, not an
implementation detail: open an issue first.

**Templates are print-tested.** The canvas renders A4 at true scale, and PDF
export measures against the same geometry. If you touch a layout, check it both
on the canvas and in an exported PDF, across two pages.

## Writing style

These apply to UI strings, metadata, docs, commit messages and code comments:

- No em dashes or en dashes in prose. Use a colon, a comma, a full stop or
  parentheses instead. A spaced hyphen is not a substitute either. The one
  exception is a numeric or date range, where an en dash is correct
  typography: `2020 – 2024`, a `1–5` scale.
- Hyphens in compound modifiers are fine: `print-tested`, `open-source`.
- The brand is **OpenCV**, capital O and capital CV. In running prose the
  package and repo name stays lowercase (`opencv`, `@brionmario/opencv-core`)
  because those are identifiers.
- Page titles separate with `|` (`Resume templates | OpenCV`); a title pairing
  the name with the tagline uses a colon.

## Pull requests

1. Fork the repository and branch off `main`.
2. Keep the change focused. A refactor bundled with a feature is two PRs.
3. Follow [Conventional Commits](https://www.conventionalcommits.org) for commit
   messages, matching the existing history: `feat(editor): …`, `fix(export): …`,
   `docs: …`, `chore(deps): …`.
4. Typecheck and lint before pushing.
5. Fill in the pull request template. The Purpose and Approach sections carry
   the review; screenshots or a short clip are expected for anything visual.
6. Call out breaking changes explicitly, and remember that saved documents and
   share links already out in the world count as things that can break.

## Reporting bugs and requesting features

Use the issue templates: there is one each for bugs, features, improvements and
documentation. For a bug, the most useful thing you can include is the exact
steps, the browser, and, when the document itself matters, a share link that
reproduces it.

Do not paste a share link containing a real résumé into a public issue. A link
is the document: anyone who can read the issue can read the résumé. Reproduce
with sample content instead.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE) that covers this project.
