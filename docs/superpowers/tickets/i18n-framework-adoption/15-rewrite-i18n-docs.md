# 15: Rewrite `docs/I18N.md`

**What to build:** A developer reading `docs/I18N.md` gets an accurate description of the setup:
- the files and the session-first resolution order;
- how saving and the cookie sync work;
- the two env variables;
- the feature translation recipe, `lint:i18n` and the ignore marker;
- the test helpers.

Anything the framework owns links to the template's doc.

**Blocked by:** 04, 14

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (story 29 · Plan: Task 15)

- [ ] Every file, script and env variable named in the doc exists in the repo.
- [ ] Nothing removed in tickets 03, 04 or 14 is referenced.
- [ ] The resolution order reads: session, then cookie, then Accept-Language, then pt.
