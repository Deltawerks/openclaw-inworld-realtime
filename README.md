# DeltaWerks Inworld Realtime

A community OpenClaw plugin for Inworld realtime voice in Talk and Voice Call. It registers `deltawerks-inworld-realtime` as both its plugin ID and realtime provider ID. It can coexist with the official `inworld` speech plugin; it does not register a speech/TTS provider or replace that plugin.

## Requirements

- OpenClaw **2026.10.7**. The plugin SDK is experimental; this initial package targets that release only.
- Node.js 24.22.1+ on the 24.x line, or 26.12.1+.
- An Inworld account with Realtime API access and an API key. Inworld service usage and any routed model usage are subject to your account's access and billing.
- Gateway network access to `api.inworld.ai` over HTTPS/WSS. Talk needs a microphone/audio client; phone calls additionally need OpenClaw's separately configured Voice Call plugin and telephony service.

[Inworld's Realtime API](https://docs.inworld.ai/realtime/overview) combines speech recognition, a routed language model and speech output over a session connection. This plugin uses its server-side WebSocket API. Audio, text and tool results needed for the conversation leave the Gateway for Inworld and its configured model service. Review those services' data policies before using sensitive information.

## Install

After a release becomes public on ClawHub:

```sh
openclaw plugins install clawhub:@deltawerks/inworld-realtime
```

For a locally built package, use OpenClaw's managed npm install path:

```sh
npm ci
npm test
npm run build
npm pack
openclaw plugins install npm-pack:./deltawerks-inworld-realtime-0.1.1.tgz --force --accept-capabilities
openclaw plugins inspect deltawerks-inworld-realtime --runtime --json
```

The local tarball is a development install. Inspect the requested capabilities before accepting them, then restart the Gateway if OpenClaw requests it.

## Configure Talk

Provide `INWORLD_API_KEY` securely to the Gateway process, or replace the example SecretRef with a reference in your configured OpenClaw secret store. The key is the Base64 dashboard credential accepted by Inworld's `Authorization: Basic` authentication; do not decode it or put it in a public config example.

Merge this into your Gateway configuration, preserving existing settings:

```json5
{
  plugins: {
    entries: {
      "deltawerks-inworld-realtime": { enabled: true },
    },
  },
  talk: {
    realtime: {
      provider: "deltawerks-inworld-realtime",
      mode: "realtime",
      transport: "gateway-relay",
      brain: "agent-consult",
      consultRouting: "provider-direct",
      providers: {
        "deltawerks-inworld-realtime": {
          apiKey: { source: "env", provider: "default", id: "INWORLD_API_KEY" },
          voiceId: "Sarah",
          ttsModel: "inworld-tts-2",
          speakingRate: 1.0,
          deliveryMode: "BALANCED",
        },
      },
    },
  },
}
```

If you use `plugins.allow`, retain its existing entries and add `deltawerks-inworld-realtime`. Provider settings belong under `talk.realtime.providers`, not under this plugin's empty `plugins.entries.*.config` object. After applying config through OpenClaw's documented configuration workflow, check Gateway health and select realtime Talk in your client.

For Voice Call, configure the same provider ID and provider map under `plugins.entries.voice-call.config.realtime`. Voice Call installation, phone numbers and call routing are separate requirements. Tool permissions and agent consultation remain controlled by OpenClaw.

## Options and limits

The adapter defaults to voice `Sarah`, TTS model `inworld-tts-2` and model ID `google-ai-studio/gemini-2.5-flash`. Set `model` explicitly to a model available to your Inworld account; access can vary.

| Setting | Meaning |
| --- | --- |
| `model`, `voiceId`, `ttsModel`, `sttModel` | Inworld model and voice selections |
| `speakingRate` | Speech rate from 0.5 to 1.5 |
| `deliveryMode` | `STABLE`, `BALANCED` or `CREATIVE` |
| `turnDetection` | `semantic_vad` (default) or `server_vad` |
| `eagerness` | `low`, `medium` or `high` for semantic VAD |
| `vadThreshold`, `prefixPaddingMs`, `silenceDurationMs` | Server VAD controls |
| `steeringHandling`, `segmenterStrategy`, `responsiveness` | Inworld speech-generation controls |
| `providerData` | Bounded passthrough of `stt`, `tts`, `memory` and `responsiveness` sections; at most 8 KiB |
| `baseUrl` | Operator-selected API origin; defaults to `https://api.inworld.ai`. Credentials and conversation data are sent to this origin. Use HTTPS and a service you trust; an HTTP override uses an unencrypted WebSocket connection. |

Audio uses mono PCM16 at 24 kHz or G.711 µ-law at 8 kHz, through `gateway-relay`. Inworld owns automatic turn responses and interruption; forced transcript routing and disabling input-audio interruption are rejected. A disconnected session ends; there is no session resumption. Back-channel interjections are not supported because the host playback contract lacks an out-of-band audio channel. Unsupported backchannel configuration is rejected.

Debug capture can retain conversation content locally. Treat logs, transcripts, audio and tool results as private and review them before sharing.

## Development and support

```sh
npm ci
npm run check
npm test
npm run build
npm pack --dry-run
```

Tests exercise protocol events, interruption/playback accounting, connection lifecycle, lazy queues, malformed audio and tool-result handling with simulated sockets. They do not replace a real account/session check.

Maintainer: DeltaWerks. Report reproducible problems in this repository's issue tracker, with your OpenClaw/plugin versions and redacted logs. Never include API keys or private recordings. This community package is not an official OpenClaw or Inworld product.

## License

MIT. Adapted from the OpenClaw Inworld provider; upstream copyright and license are retained in `LICENSE` and `NOTICE`. OpenClaw dependencies use public `openclaw/plugin-sdk/*` entry points. Connection, queue and audio helpers needed by the standalone provider are included locally rather than imported from private host modules.
