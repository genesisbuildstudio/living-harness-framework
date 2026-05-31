# Publication Checklist

Use this before publishing LHF as a public GitHub template.

## Required

- Confirm `.github/CODEOWNERS` points at an actual maintainer.
- Confirm `SECURITY.md` has a working private reporting path.
- Enable branch protection or repository rulesets for `main`.
- Require the live GitHub Actions check contexts `ci`, `lhf-health`, and
  `analyze` on pull requests.
- Keep all third-party GitHub Actions pinned to full commit SHAs.
- Enable Dependabot alerts and security updates.
- Confirm `pnpm test` and `pnpm lhf:session-close --changed --check` pass.
- Confirm `pnpm lhf:check-branch-protection --repo <owner>/<repo>` passes.
- Confirm the GitHub Pages documentation site returns HTTP 200.
- Confirm `npm view create-living-harness version` returns 404 before the first
  public publish, or the intended previous version after publish.
- Tag the release from the exact commit being published and write release notes.
- Publish only through `.github/workflows/release-npm.yml`.
- Verify the published package from a clean external install.

## Recommended

- Enable OpenSSF Scorecard.
- Publish npm packages with npm trusted publishing. npm currently requires npm
  CLI 11.10.0+, Node 22.14.0+, an existing package, and account-level 2FA for
  trusted publishing, and automatically generates provenance for public
  packages published from public repositories.
- Enable GitHub Pages and confirm the Pages workflow deploys `docs-site/`.
- Add a demo video or GIF.
- Add a one-command template setup example.
- Publish a compatibility policy before accepting external plugins.
