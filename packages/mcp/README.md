# @brionmario/opencv-mcp

An [MCP](https://modelcontextprotocol.io) server that lets an agent build, read
and revise opencv résumés.

opencv is a static site with no backend, which would normally mean there is
nothing for an agent to call. What makes this work is that a résumé lives
entirely inside its own URL: minting one is a pure function, so the whole
build-and-share loop runs in this process, and the link it hands back is served
by the same static site a person uses.

Documents are spoken in [JSON Resume](https://jsonresume.org/schema) rather than
opencv's internal shape — an agent already knows that schema, and the internal
one is full of editor bookkeeping that would be noise to generate.

## Tools

| Tool | What it does |
| --- | --- |
| `list_templates` | The four templates and what each suits. |
| `get_sample_resume` | A complete JSON Resume to start from or copy the shape of. |
| `create_resume` | JSON Resume → a read-only share link. |
| `read_resume` | A share link → JSON Resume, plus its template. |
| `update_resume` | A share link + changes → a new link. |

## Using it

Build it first — the server runs from `dist`, and it depends on
`@brionmario/opencv-core`, so let nx build them in order:

```bash
npx nx run @brionmario/opencv-mcp:build
```

The repo's `.mcp.json` already registers it, so Claude Code picks it up in this
workspace. For another client, point it at the built entry:

```json
{
  "mcpServers": {
    "opencv": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/opencv/packages/mcp/dist/index.js"]
    }
  }
}
```

### Pointing at a different deployment

Links default to `https://brionmario.github.io/opencv`. Set `OPENCV_BASE_URL` to
mint links for a local dev server or a staging deploy instead:

```bash
OPENCV_BASE_URL=http://localhost:3000 node packages/mcp/dist/index.js
```

## What to know about the links

A link **is** the document. Nothing is stored anywhere, so:

- It works for anyone, with no account, for as long as the site is up.
- It cannot be revoked. Sharing one is giving out the résumé itself.
- `update_resume` returns a *new* link. The old one keeps resolving to the old
  version, because it still contains it.
- It is long — a few KB — and it breaks if truncated. An embedded photo makes it
  much longer; `create_resume` says so when the result crosses the point where
  some clients start shortening links.
- The payload sits in the URL fragment, which browsers never send to a server.
  That is what keeps it off access logs and out of `Referer` headers — and also
  why a plain `fetch` of a share link sees an empty page. Only a JavaScript
  client renders it.
