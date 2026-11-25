# Failures and Troubleshooting Log

This file records technical blockers, failed API or GPU runs, unsatisfactory generations, and how each issue was resolved or worked around.

## Guidelines
- Document failures honestly as they happen (quotas, VRAM/OOM, rate limits, pronunciation issues, character drift, FFmpeg filter errors, etc.).
- Record what you tried and what fixed or bypassed the issue.
- Never include API keys, tokens, or secrets in error snippets.
- Do not invent failures.

---

## Failure Summary

| Failure ID | Date | Stage / Tool | Symptom | Resolution / Workaround | Status |
| --- | --- | --- | --- | --- | --- |
| *None yet* | — | — | — | — | — |

---

## Failure Entry Template

Copy this template whenever something breaks:

```markdown
### FAIL-XXX: <Short Description of Problem>
- **Date:** YYYY-MM-DD
- **Stage / Component:** <setup | schema | narration | keyframes | video | music | assembly>
- **Tool / Model:** <Provider, CLI, or script name>
- **Error / Symptom:** <Sanitized error message or visual/audio defect observed>
- **Root Cause:** <Why it happened, if known>
- **What Was Tried:** <Steps attempted to diagnose or fix>
- **Resolution / Workaround:** <Final fix or fallback used>
- **Status:** <Open | Resolved | Mitigated>
```

---

## Logged Failures

*(No failures recorded yet.)*
