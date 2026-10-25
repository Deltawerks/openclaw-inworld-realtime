// Host-facing types come solely from the public plugin registration contract.
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { isRecord, normalizeOptionalString } from "openclaw/plugin-sdk/string-coerce-runtime";
export type RealtimeVoiceProviderPlugin = Extract<Parameters<OpenClawPluginApi["registerRealtimeVoiceProvider"]>[0], { id: string }>;
export type RealtimeVoiceBridgeCreateRequest = Parameters<NonNullable<RealtimeVoiceProviderPlugin["createBridge"]>>[0];
export type RealtimeVoiceBridge = ReturnType<NonNullable<RealtimeVoiceProviderPlugin["createBridge"]>>;
export type RealtimeVoiceProviderConfig = RealtimeVoiceBridgeCreateRequest["providerConfig"];
export type RealtimeVoiceAudioFormat = NonNullable<RealtimeVoiceBridgeCreateRequest["audioFormat"]>;
export type RealtimeVoicePlaybackItem = ReturnType<NonNullable<RealtimeVoiceBridgeCreateRequest["getPlaybackState"]>>[number];
export type RealtimeVoiceToolResultOptions = NonNullable<Parameters<RealtimeVoiceBridge["submitToolResult"]>[2]>;
export type RealtimeVoiceCloseOptions = NonNullable<Parameters<RealtimeVoiceBridge["close"]>[0]>;
export type RealtimeVoiceBargeInOptions = NonNullable<Parameters<NonNullable<RealtimeVoiceBridge["handleBargeIn"]>>[0]>;
export type RealtimeVoiceResponseOutcome = Parameters<NonNullable<RealtimeVoiceBridgeCreateRequest["onResponseDone"]>>[0];
export { RealtimeVoiceSessionLifecycle, createRealtimeVoiceAudioQueue, type RealtimeVoiceSessionConnection } from "./session-lifecycle.js";
export { createLazyRealtimeVoiceBridgeLifecycle } from "./lazy-lifecycle.js";
export { canonicalizeBase64 } from "./base64.js";
export function realtimeVoiceAudioDurationMs(
  format: RealtimeVoiceAudioFormat,
  byteLength: number,
): number {
  const bytesPerSample = format.encoding === "pcm16" ? 2 : 1;
  return (byteLength * 1000) / (format.sampleRateHz * format.channels * bytesPerSample);
}

export type OpenAICompatibleRealtimeAudioFormat =
  | { type: "audio/pcm"; rate: 24000 }
  | { type: "audio/pcmu" };

export function toOpenAICompatibleRealtimeAudioFormat(
  format: RealtimeVoiceAudioFormat,
): OpenAICompatibleRealtimeAudioFormat {
  return format.encoding === "pcm16" ? { type: "audio/pcm", rate: 24000 } : { type: "audio/pcmu" };
}

export const REALTIME_VOICE_AUDIO_FORMAT_G711_ULAW_8KHZ: RealtimeVoiceAudioFormat = {
  encoding: "g711_ulaw",
  sampleRateHz: 8000,
  channels: 1,
};

export const REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ: RealtimeVoiceAudioFormat = {
  encoding: "pcm16",
  sampleRateHz: 24000,
  channels: 1,
};

/** Normalizes OpenAI-style realtime response status details into the shared Talk contract. */
export function normalizeRealtimeVoiceResponseOutcome(params: {
  providerLabel: string;
  response: unknown;
  responseId?: unknown;
}): RealtimeVoiceResponseOutcome {
  const response = isRecord(params.response) ? params.response : undefined;
  const details = isRecord(response?.status_details) ? response.status_details : undefined;
  const rawError = isRecord(details?.error) ? details.error : undefined;
  const code = normalizeOptionalString(rawError?.code);
  const errorMessage = normalizeOptionalString(rawError?.message);
  const errorType = normalizeOptionalString(rawError?.type);
  const error =
    code || errorMessage || errorType
      ? {
          ...(code ? { code } : {}),
          ...(errorMessage ? { message: errorMessage } : {}),
          ...(errorType ? { type: errorType } : {}),
        }
      : undefined;
  const reason = normalizeOptionalString(details?.reason);
  const responseId =
    normalizeOptionalString(response?.id) ?? normalizeOptionalString(params.responseId);
  const base = responseId ? { responseId } : {};
  switch (response?.status) {
    case "completed":
      return { ...base, status: "completed" };
    case "cancelled":
      return { ...base, status: "cancelled", ...(reason ? { reason } : {}) };
    case "failed":
    case "incomplete": {
      const status = response.status;
      const detail = [reason, errorMessage ?? code ?? errorType].filter(Boolean).join(": ");
      return {
        ...base,
        status,
        ...(reason ? { reason } : {}),
        ...(error ? { error } : {}),
        message: `${params.providerLabel} response ${status}${detail ? `: ${detail}` : ""}`,
      };
    }
    default: {
      const rawStatus = normalizeOptionalString(response?.status);
      const detail = rawStatus ? `invalid status ${rawStatus}` : "missing terminal status";
      return {
        ...base,
        status: "failed",
        reason: "invalid_response_status",
        error: { type: "invalid_response_status", message: detail },
        message: `${params.providerLabel} response failed: ${detail}`,
      };
    }
  }
}

