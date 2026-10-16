<p align="center">
  <h1 align="center">dsh-agy-safe</h1>
</p>

<p align="center">
  <strong>Antigravity CLI model provider plugin</strong>
</p>

<p align="center">
  A local Antigravity CLI headless-session bridge for DeepSeek Harness
</p>

<p align="center">
  <a href="https://github.com/phucnd0604/dsh-agy-safe/releases"><img src="https://img.shields.io/badge/version-v0.1.9-blue" alt="Version 0.1.9" /></a>
  <img src="https://img.shields.io/badge/platform-DSH%20%7C%20Node.js%20ESM-2F5D50" alt="Platform" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-5B6C8F" alt="MIT License" /></a>
  <a href="https://github.com/topics/dsh-plugin"><img src="https://img.shields.io/badge/topic-dsh--plugin-E8B25C" alt="dsh-plugin" /></a>
</p>

<p align="center">
  <a href="#in-30-seconds">In 30 seconds</a> ·
  <a href="#key-features">Key features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#repository-layout">Repository layout</a> ·
  <a href="LICENSE">License</a>
</p>

## In 30 seconds

**dsh-agy-safe plugs a headless session of the Antigravity CLI (`agy`) already logged in on this machine into DeepSeek Harness as a first-class model provider. Both the main conversation and subagents can use that provider, with the same streaming generation and tool dispatch experience.**

The plugin only reuses the official Antigravity CLI session that your own account logged in locally. Credentials and usage stay with your account, so your Antigravity quota is used inside dsh legitimately — no shared accounts and no third-party relay.

What the plugin adds so a local CLI fits the Harness platform:

- **Headless session bridge** — drives agy's streaming interaction over a child-process pipe, with the Harness owning the agent loop.
- **Subagent support** — the main conversation and subagents both select agy models and share one session bridge and tool-dispatch path.
- **Tool-call adaptation** — injects the tool contract, parses the structured markers, and returns execution results to the model.
- **History fingerprinting** — keeps a session hash chain, detects context forks, and replays the full history when needed.
- **Accurate TPS accounting** — per-session usage deltas exclude hidden thinking, so streaming speed reflects visible output.
- **Native terminal launch** — the settings section guides credential setup and opens a real terminal for the login flow.

## Key features

| Dimension | Native HTTP provider | dsh-agy-safe |
| --- | --- | --- |
| Authentication | Relies on a remote API key | Reuses the local CLI login |
| Execution | Remote model service | Local sandboxed child process |
| Tool dispatch | Native platform support | Structured marker parsing and two-way translation |
| Session handling | Stateless HTTP round trips | Long-lived process plus hash-based fork rebuild |

The main conversation can spawn an agy subagent directly; the task manager on the right shows subagent state and model in real time:

![Main conversation spawning an agy subagent](assets/screenshot-subagent.png)

## Architecture

The plugin is a modular, layered adapter for the DeepSeek Harness ecosystem:

```text
┌─────────────────────────────────────────────┐
│ DSH Agent Runtime / Subagents / Web UI      │  Top layer: model selection and agent call loop
├─────────────────────────────────────────────┤
│ AgyAdapter (LlmAdapter implementation)      │  Adapter core: unified streaming dispatch and usage
├─────────────────────────────────────────────┤
│ ToolCallProtocol / TranscriptFlattener      │  Protocol: structured tool markers and history hash chain
├─────────────────────────────────────────────┤
│ AgySessionManager / ChildProcess Pool       │  Processes: lifecycle and fork/replay handling
├─────────────────────────────────────────────┤
│ Antigravity CLI (agy 1.1.26)                │  Model layer: local headless streaming session
└─────────────────────────────────────────────┘
```

### Request flow

1. **Session resolution** — on each generation request, the incoming messages are compared against the resident process's history hash chain.
2. **Incremental dispatch** — a matching history prefix sends only the delta; a context fork resets the child process and replays the full transcript.
3. **Output translation** — output events are parsed line by line and turned into standard text deltas and tool-call blocks.
4. **State reporting** — on completion, the per-session usage baseline folds this turn's input, output, and thinking tokens into the terminal status returned to the caller.

## Getting started

**Compatibility**: the plugin targets dsh **v0.2.0-rc.2** (Web and desktop profiles) and needs Node.js 20 or newer.

> dsh 0.2 removed the old `settings.installSection`; this fork has migrated (see step 3 in `src/index.ts`). The host no longer generates a settings form from the plugin Config, so `agyPath`, `defaultEffort`, and the timeouts are configured in the profile's `cordis.patch.yml`; the settings page only offers install detection, the login terminal, and credential verification.

### One-line install

Run the install command inside DeepSeek Harness:

```bash
dsh plugin --profile desktop add github:phucnd0604/dsh-agy-safe
```

This repository commits the compiled `lib/` output, so a `github:` install works as-is and needs no pnpm build-script opt-in.

To develop against a local checkout instead:

```bash
dsh plugin --profile desktop add <local-repo-path>
```

> To drop `lib/` from version control and build on install instead: remove the `lib/` commit, allow the build script with `dsh-agy-safe: true` under `allowBuilds` in the profile's `pnpm-workspace.yaml`, then reinstall.

Restart the service after installing:

```bash
dsh web
```

### Install the official Antigravity CLI (first run)

The plugin reuses the Antigravity CLI (`agy`) session logged in on this machine. Install the CLI from the official source first (PowerShell):

```powershell
irm https://antigravity.google/cli/install.ps1 | iex
```

Once installed, run `agy --version` in a terminal to confirm it works, then continue with the login setup below.

### Login and credentials

1. Open the Web control panel and go to the **Antigravity CLI** page under Settings.
2. Click **Open login terminal**; a desktop terminal opens running the login command.
3. After logging in, click **Verify credentials** to confirm the session state.
4. Pick a model under the `agy` group in the model list and start chatting.

The settings page detects the install, probes the credential directory, opens the login terminal, and verifies credentials:

![Antigravity CLI settings page](assets/screenshot-settings.png)

The Antigravity CLI group in the model list, covering the available Gemini, Claude, and GPT-OSS models:

![Antigravity CLI group in the model list](assets/screenshot-model-picker.png)

## Repository layout

| Path | Description |
| --- | --- |
| `src/adapter.ts` | Extends `LlmAdapter`; model routing and streaming translation. |
| `src/session.ts` | Child-process pool, fork detection, and lifecycle. |
| `src/tool-protocol.ts` | Incremental state machine parsing the tool-call marker syntax. |
| `src/flatten.ts` | Transcript flattening and state hashing. |
| `src/models.ts` | Model catalog definitions and reasoning-effort mapping. |
| `src/chunks.ts` | Maps the process event stream onto Harness stream chunks. |
| `src/usage.ts` | Per-session usage baseline producing this turn's token delta. |
| `src/login.ts` | Native terminal launch and credential probing. |
| `src/client.ts` | The interactive component behind the front-end settings panel. |
| `lib/` | Compiled output (`npm run build`), committed so `github:` installs work directly. |
| `scripts/` | Real-agy integration tooling: usage-semantics probes and increment verification. |
| `test/` | Unit tests for the protocol state machine and pure functions. |

## Contributing

Issues and pull requests are welcome. Run the test suite locally:

```powershell
npm test
```

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Jonah Wu.
