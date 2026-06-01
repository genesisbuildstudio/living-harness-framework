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

Current npm trusted publishing requires npm CLI 11.5.1+ and Node 22.14.0+; the
`npm trust` CLI additionally requires account-level 2FA and an existing package.
Source: <https://docs.npmjs.com/cli/v11/commands/npm-trust/>.
The GitHub Actions release workflow uses Node 24 and installs npm 11.16.0 before
publishing.

An authenticated npm owner with account-level 2FA must configure GitHub Actions
as a trusted publisher before normal releases can be published. If
`create-living-harness` does not exist yet, do not pretend the trusted publisher
is ready. Bootstrap the first package version explicitly, then configure trusted
publishing, then publish the next version through GitHub Actions so provenance is
attached by the trusted publisher flow. Source:
<https://docs.npmjs.com/trusted-publishers/>.

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

## First Package Bootstrap

Use this only when `npm view create-living-harness version` returns 404 and
`pnpm lhf:publication-status --json` reports
`readyForInitialPackageBootstrap: true`.

1. Enable account-level 2FA on the npm owner account and save recovery codes
   outside the repository.
2. Dry-run the exact package:

   ```bash
   pnpm --dir packages/create-living-harness pack --pack-destination /tmp/lhf-pack
   (cd packages/create-living-harness && npm publish --access public --dry-run)
   ```

3. Publish the bootstrap version only after owner confirmation:

   ```bash
   (cd packages/create-living-harness && npm publish --access public)
   ```

4. Configure trusted publishing with the command below.
5. Bump the package to the next patch version and publish that version through
   `.github/workflows/release-npm.yml`; this is the first fully trusted
   publishing release.

## Pre-Publish Proof

```bash
pnpm install --frozen-lockfile
pnpm lhf:check-npm-release
pnpm typecheck
pnpm build
pnpm test
pnpm lhf:session-close --changed --check
pnpm --dir packages/create-living-harness pack --pack-destination /tmp/lhf-pack
pnpm lhf:publication-status --json
```

## Post-Publish Proof

```bash
npm view create-living-harness version
pnpm lhf:publication-status --require-published --json
tmpdir="$(mktemp -d)"
cd "$tmpdir"
pnpm dlx create-living-harness@latest lhf-smoke --name "LHF Smoke"
cd lhf-smoke
pnpm install
pnpm lhf:session-close --changed --check
```

Record the workflow run, npm version, source commit, and smoke-test output in a
release note or live-proof receipt.
