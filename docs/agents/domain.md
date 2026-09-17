# Domain docs

Read root `CONTEXT.md` before naming domain concepts. Read relevant ADRs under `docs/adr/` before changing their area.

This repository is single-context:

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

Use glossary terms in issues, tests, plans, and code. Avoid synonyms explicitly rejected by the glossary. Surface any conflict with an ADR instead of silently overriding it.

Missing domain files are created lazily through domain-modeling work.
