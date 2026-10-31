<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->

# Writing style

These apply to everything you write in this repo: UI strings, metadata,
structured data, `llms.txt`, exports, commit messages, docs and code comments.

- **Never use em dashes (`—`) or en dashes (`–`) in prose.** Reach for what the
  sentence actually wants instead: a colon before an expansion or a list, a
  comma for an aside, a full stop for two separate thoughts, or parentheses for
  a true aside. Do not substitute a spaced hyphen (` - `) either; pick real
  punctuation.
- Hyphens are fine where they belong: compound modifiers (`print-tested`,
  `open-source`).
- The one exception to the dash ban is a numeric or date range, where an en
  dash is correct typography: `2020 – 2024`, a `1–5` scale. Never use one as
  sentence punctuation.
- The brand is **OpenCV**, capital O and capital CV. Not `openCV`, not
  `Opencv`. In running prose the package and repo name stays lowercase
  (`opencv`, `@brionmario/opencv-core`) because those are identifiers.
- Page titles separate with `|` (`Resume templates | OpenCV`); a title that
  pairs the name with the tagline uses a colon (`OpenCV: The resume builder
  that stores nothing`).
