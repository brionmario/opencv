### Purpose
<!-- What problem, feature or change does this PR introduce? Add screenshots or a short clip if anything about the UI changes. -->

<!-- If this PR contains breaking changes, uncomment and fill in the section below -->
<!--

---
### ⚠️ Breaking Changes

#### 🔧 Summary of Breaking Changes
_What is changing_

#### 💥 Impact
_What will break, and for whom. Saved documents and existing share links count: both are read back from storage and from URLs that are already out in the world._

#### 🔄 Migration Guide
_How should people adapt? Include examples where it helps._

---

-->

### Approach
<!-- How you implemented it, and the design decisions worth knowing about. -->

### Related Issues
- N/A

### Related PRs
- N/A

### Checklist
- [ ] Ran it and verified the change by hand.
- [ ] Checked it in the editor **and** in an export — the canvas, the PDF and the print
      path render from different code, so a change can look right in one and break another.
- [ ] Checked the templates the change touches (Professional, Modern, Classic, Minimal).
- [ ] Documentation updated, if behaviour changed. (README, `docs/`, `llms.txt`)
- [ ] Breaking changes. (Fill in the section above if applicable)

### Security
- [ ] No keys, passwords, tokens or other secrets are committed.
- [ ] No real résumé data is committed — sample content only. Share links and fixtures
      carry a whole document, so it is easy to include one without noticing.
