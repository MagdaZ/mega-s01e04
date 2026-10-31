---
name: preview-netlify
description: Put a rig page on a public Netlify link for review, and later upload it again without the lane marker (ADR 0003). Use for a plan's "Preview for review" and "Clean up" issues when the host is Netlify.
---

# preview-netlify

A preview is one HTML file, saved from a running rig by a command, on a public HTTPS link we can
upload over (ADR 0003). The file never goes into the repo, an issue or a chat attachment. Keep it
in a folder outside the repo.

Every step here that publishes, changes or deletes something on the human's Netlify account needs
their yes first: say what, why, where, who can see it and how to undo it.

## Save the page

```sh
PORT=8799 npx tsx --env-file=.env src/server.ts &        # with LANE_MARKER set
curl -sf http://localhost:8799/digest/<night> -o <outside-repo>/preview/index.html
env -u LANE_MARKER PORT=8798 npx tsx src/server.ts &     # for the clean-up copy
curl -sf http://localhost:8798/digest/<night> -o <outside-repo>/preview-clean/index.html
```

Check the banner (`grep -o '<header>.*</header>'`) and stop both servers.

## First upload

1. `npx netlify-cli login`: the human signs in and authorizes in the browser. Never create an
   account for them.
2. Team slug: `npx netlify-cli api listAccountsForUser` and read `slug`. It is not the team's
   display name (`--account-slug <name>` gives `404: Not Found`).
3. Create the site from a folder outside the repo, so `.netlify/` never lands in it:
   `npx netlify-cli sites:create --name <site> --account-slug <slug> --disable-linking`.
4. `npx netlify-cli deploy --prod --dir preview --site <site-id> --no-build`.
5. **Check the link as an outsider would**: `curl -sI https://<site>.netlify.app/`. A new site can
   sit behind team login (`401`, "Login Redirect"). Turning that off is a site setting, so ask first:
   `npx netlify-cli api updateSite --data '{"site_id":"<id>","body":{"sso_login":false}}'`.
6. Diff the served page against the file. The free plan adds an HTML comment and a
   `/.netlify/scripts/hud` script (`built_with_badge_enabled`; the API refuses to turn it off).
   That breaks "no client JS" (ADR 0001) on the copy. Tell the human, and let them choose the host.

The preview issue stays open until the reviewer has looked. Sent is not reviewed.

## Clean up (after the review is in)

1. With a yes: `npx netlify-cli deploy --prod --dir preview-clean --site <site-id> --no-build`.
2. `curl` the main link without cache (`?v=$RANDOM`): no marker, banner reads "no marker set".
3. Netlify keeps every deploy public at `https://<deploy-id>--<site>.netlify.app`. The first deploy
   still shows the marker there. With a yes (it can't be undone):
   `npx netlify-cli api deleteDeploy --data '{"deploy_id":"<old-id>"}'`, then check it gives 404.
