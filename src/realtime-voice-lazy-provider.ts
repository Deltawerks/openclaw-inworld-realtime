import type { RealtimeVoiceProviderPlugin } from "./voice-contract.js";
import { createLazyInworldRealtimeVoiceBridge } from "./realtime-voice-lazy.js";
import { createInworldRealtimeVoiceProviderMetadata } from "./realtime-voice-metadata.js";

export function createLazyInworldRealtimeVoiceProvider(): RealtimeVoiceProviderPlugin {
  return {
    ...createInworldRealtimeVoiceProviderMetadata(),
    createBridge: createLazyInworldRealtimeVoiceBridge,
  };
}
