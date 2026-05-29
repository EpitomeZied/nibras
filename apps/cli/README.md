# @nibras/cli

Official Nibras command-line interface for hosted project setup, testing, and submission.

## Install

```bash
npm install -g @nibras/cli@2.0.0
```

## Quick start

```bash
nibras login --api-base-url https://your-nibras-instance.edu
nibras setup --project cs161/lab1
cd cs161-lab1
nibras test
nibras submit
```

## Configuration

Session and settings are stored at the platform config path (not `~/.nibras/cli.json`):

| Platform | Path |
|----------|------|
| Linux | `~/.config/nibras/config.json` |
| macOS | `~/Library/Application Support/nibras/config.json` |
| Windows | `%APPDATA%\nibras\config.json` |

```bash
nibras config path
nibras config set api-base-url https://your-instance.edu
```

Tokens are stored as JSON with file mode `0o600`. Use `nibras logout` to clear credentials.

## Commands (v2)

| Command | Description |
|---------|-------------|
| `login` | Device OAuth login |
| `logout` | Clear local session |
| `whoami` | Signed-in user (`--json`) |
| `list` | Courses and projects (`--verbose` for milestones, `--json`) |
| `status` | Recent submissions; `status show <id>` for detail |
| `milestones` | Milestones for cwd project or `milestones <projectKey>` |
| `test` | Run manifest test command |
| `submit` | Test, commit, push, verify |
| `task` | Show task instructions |
| `setup` | Bootstrap project from API |
| `config` | `path`, `get`, `set` |
| `doctor` | Local env + connectivity checks |
| `ping` | API / GitHub / project health |
| `update` | Self-update from GitHub releases |
| `legacy` | CS161-style subject/project CLI |

## Flags

- `--plain` — no colours or spinners
- `--json` — machine-readable output (where supported)
- `DEBUG=nibras:*` — debug logs on stderr

## Development

From the monorepo root:

```bash
npm run build -w @nibras/cli
node bin/nibras.js --help
```
