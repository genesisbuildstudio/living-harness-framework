# Branch Protection Proof

Live proof requires a published GitHub repository.

After creating the public repository and enabling repository rulesets for
`main`, run:

```bash
pnpm lhf:check-branch-protection --repo <owner>/<repo>
```

Required live rules:

- active branch ruleset
- pull request requirement
- required status checks
- required checks: `CI`, `LHF Health`, `CodeQL`

This local template cannot complete live proof until a GitHub remote exists.
