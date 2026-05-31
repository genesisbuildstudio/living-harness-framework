# create-living-harness

Create a Living Harness Framework starter monorepo.

```bash
pnpm create living-harness my-app --name "My App"
```

What you get:

- AI coding instructions for Codex, Claude Code, Copilot, and Cursor.
- Cloudflare Worker and Supabase starter structure.
- Living Monorepo laws, specs, graph truth, and proof gates.
- Full System Tester-lite tasks and receipt writing.
- CI, security, release, branch-protection, and drift checks.

For local testing or private forks, pass `--source <path>` to copy from a local
LHF template checkout.

```bash
pnpm create living-harness my-app --source /path/to/living-harness-framework
```

After creation:

```bash
cd my-app
pnpm install
pnpm lhf:session-close --changed --check
```
