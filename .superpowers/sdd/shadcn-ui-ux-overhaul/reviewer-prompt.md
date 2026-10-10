# Task Reviewer Prompt (per-task gate)

You are reviewing Task {N} of the shadcn UI overhaul. Three inputs:

1. Brief (requirements, verbatim): {BRIEF_PATH}
2. Implementer report (evidence): {REPORT_PATH}
3. Review package (commit list + stat + full diff -U10 for the range): {PACKAGE_PATH}

Read all three. Verify TWO verdicts:

## A. Spec compliance (❌/✅)
Every requirement in the brief's Requirements/Acceptance sections is met by the diff. Flag anything missing, extra-but-unrequested, or done differently than the brief's verbatim values (exact names, exact commands, exact commit message, exact staging rules).

## B. Task quality (Approve / issues)
- Code correctness, no dead code, no placeholders/TODOs.
- Test hygiene if tests present (they assert behavior, not implementation).
- No scope creep, no unrelated file churn.
- YAGNI: nothing speculative added.

## Report format
Return: Spec verdict, quality verdict, then findings list. Each finding tagged:
- Severity: Critical | Important | Minor
- Location: file:line
- Description
If something cannot be verified from the diff (lives in unchanged code or spans tasks), tag it `⚠️ Cannot verify from diff: <what> <where it would show>` — these do not block but must be listed.

Do not re-run tests the implementer already ran (report carries evidence). Do not edit files.
