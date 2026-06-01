# Release Playbook

This repository publishes two surfaces:

1. GitHub template repository.
2. `create-living-harness` npm package.

## Release Rules

- Release from a clean `main` commit that already passed CI, CodeQL, Pages, and
  `lhf-health`.
- Use a new immutable semver tag. Do not reuse a tag that points at an older
  commit.
- The release tag must match `packages/create-living-harness/package.json`.
- The npm publish workflow must use OIDC trusted publishing, not long-lived npm
  tokens.
- The release workflow must not use dependency caching.

## npm Trusted Publishing

Current npm trusted publishing requires npm CLI 11.5.1+ and Node 22.14.0+.
The GitHub Actions release workflow uses Node 24 and installs npm 11.16.0 before
publishing.

An authenticated npm owner with account-level 2FA must configure GitHub Actions
as a trusted publisher before the release can be published. For a first-time
package publish, npm 11.16 reports the trust grant as `createPackage`; after the
package exists, the same relationship authorizes `npm publish`.

Configure the trust relationship with:

```bash
npm trust github create-living-harness \
  --repo genesisbuildstudio/living-harness-framework \
  --file release-npm.yml \
  --env npm-publish \
  --allow-publish \
  --yes
```

If configured through npmjs.com instead of the CLI, use these exact fields:
package `create-living-harness`, repository
`genesisbuildstudio/living-harness-framework`, workflow file
`release-npm.yml`, environment `npm-publish`, and allowed action `npm publish`.

After the first successful trusted publish, restrict token publishing for the
package and publish future releases only through GitHub Actions.

## Pre-Publish Proof

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
pnpm lhf:session-close --changed --check
pnpm --dir packages/create-living-harness pack --pack-destination /tmp/lhf-pack
```

## Post-Publish Proof

```bash
npm view create-living-harness version
tmpdir="$(mktemp -d)"
cd "$tmpdir"
pnpm dlx create-living-harness@latest lhf-smoke --name "LHF Smoke"
cd lhf-smoke
pnpm install
pnpm lhf:session-close --changed --check
```

Record the workflow run, npm version, source commit, and smoke-test output in a
release note or live-proof receipt.
