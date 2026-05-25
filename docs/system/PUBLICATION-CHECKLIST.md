# Publication Checklist

Use this before publishing LHF as a public GitHub template.

## Required

- Replace placeholder owners in `.github/CODEOWNERS`.
- Replace the security contact in `SECURITY.md`.
- Enable branch protection or repository rulesets for `main`.
- Require `CI`, `LHF Health`, and `CodeQL` on pull requests.
- Enable Dependabot alerts and security updates.
- Confirm `pnpm test` and `pnpm lhf:session-close --changed --check` pass.
- Tag the first release and write release notes.

## Recommended

- Enable OpenSSF Scorecard.
- Add a demo video or GIF.
- Add a one-command template setup example.
- Publish a compatibility policy before accepting external plugins.
