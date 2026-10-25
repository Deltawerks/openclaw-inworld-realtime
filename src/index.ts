import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createLazyInworldRealtimeVoiceProvider } from "./realtime-voice-lazy-provider.js";
export default definePluginEntry({
  id: "deltawerks-inworld-realtime",
  name: "DeltaWerks Inworld Realtime",
  description: "Inworld realtime voice for OpenClaw Talk and Voice Call.",
  register(api) { api.registerRealtimeVoiceProvider(createLazyInworldRealtimeVoiceProvider()); },
});
