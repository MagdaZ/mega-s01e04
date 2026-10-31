---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Every issue carries the shape in [What every issue carries](#what-every-issue-carries).
   Ask the human only about anything the plan needs beyond it.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --label "plan:<plan>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## What every issue carries

Approved by the human on the morning-digest plan (2026-10-31). The body, in this order:

```
Source: plan.md § <n>

Scope: <what to change, which files>
Done when: <the plan's check, word for word>
Blocked by: <#n or —>
Worker model: <strongest for logic, cheaper for views and tests>
```

- The first line is always `Source: plan.md § <n>`, and every issue has the label
  `plan:<plan>` (the plan's `plan:` frontmatter, e.g. `plan:morning-digest`). The reviewer sorts
  by those two.
- A step that waits on someone outside the repo (a reviewer's look, a sign-off) says so in
  `Blocked by` or `Done when`, and its issue stays open until they have acted. Sending a link is
  not the same as it being reviewed.
- A pushed `closes #n` (styleguide) shuts the issue on push, before its closing comment exists.
  Workers on their own branch commit with `(#n)`; whoever merges closes the issue by hand with the
  closing comment once its "Done when" holds on the default branch.

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
