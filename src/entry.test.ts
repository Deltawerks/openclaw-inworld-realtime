import { describe, expect, it, vi } from "vitest";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import plugin from "./index.js";
import { normalizeInworldRealtimeProviderConfig } from "./realtime-voice-config.js";

describe("community plugin boundary", () => {
  it("registers only the independent realtime provider, preserving the official speech owner", () => {
    const realtime = vi.fn();
    const speech = vi.fn();
    plugin.register({ registerRealtimeVoiceProvider: realtime, registerSpeechProvider: speech } as unknown as OpenClawPluginApi);
    expect(plugin.id).toBe("deltawerks-inworld-realtime");
    expect(realtime).toHaveBeenCalledTimes(1);
    const provider = realtime.mock.calls[0][0];
    expect(provider.id).toBe("deltawerks-inworld-realtime");
    expect(provider.aliases).not.toContain("inworld");
    expect(speech).not.toHaveBeenCalled();
    expect(provider.isConfigured({ providerConfig: {} })).toBe(false);
  });

  it("resolves the namespaced provider map before the legacy config alias", () => {
    const c = normalizeInworldRealtimeProviderConfig({ providers: {
      "deltawerks-inworld-realtime": { voiceId: "Clive", speakingRate: 1.2 },
      inworld: { voiceId: "Sarah" },
    } });
    expect(c.voice).toBe("Clive");
    expect(c.speakingRate).toBe(1.2);
  });
});
