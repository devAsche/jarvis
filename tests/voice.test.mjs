import test from "node:test";
import assert from "node:assert/strict";
import { VoiceSessionController } from "../src/lib/voice/VoiceSessionController.ts";
import { MockVoiceAdapter } from "../src/lib/voice/providers/MockVoiceAdapter.ts";

test("VoiceProvider: MockVoiceAdapter provides expected capabilities with zero cost", () => {
  const adapter = new MockVoiceAdapter();
  assert.equal(adapter.id, "mock");
  const caps = adapter.capabilities();
  assert.equal(caps.realtimeDuplex, false);
  assert.equal(caps.interruption, true);
  assert.equal(caps.voiceCustomization, false);
});

test("VoiceSessionController: initializes with MockVoiceAdapter as default", () => {
  const controller = new VoiceSessionController();
  const state = controller.getCurrentState();
  assert.equal(state.providerId, "mock");
  assert.equal(state.isMuted, false);
});

test("VoiceSessionController: prevents unauthorized switch to paid provider without budget approval", async () => {
  const controller = new VoiceSessionController();
  await controller.selectProvider("openai_gpt_live");
  const state = controller.getCurrentState();
  // Must remain on mock or display rejection message, no external connection
  assert.equal(state.providerId, "mock");
  assert.match(state.currentSubtitle, /未接続|月次予算/);
});

test("VoiceSessionController: handles mute and unmute safely", async () => {
  const controller = new VoiceSessionController();
  const isMuted = await controller.toggleMute();
  assert.equal(isMuted, true);
  assert.equal(controller.getCurrentState().isMuted, true);

  const isUnmuted = await controller.toggleMute();
  assert.equal(isUnmuted, false);
  assert.equal(controller.getCurrentState().isMuted, false);
});

test("VoiceSessionController: interruption halts active scenario", async () => {
  const controller = new VoiceSessionController();
  const events = [];
  controller.onUIEvent((evt) => events.push(evt));

  await controller.triggerMorningBriefing();
  await controller.interrupt();

  const state = controller.getCurrentState();
  assert.match(state.currentSubtitle, /中断/);
  assert.equal(state.audioLevel, 0);
});

test("VoiceSessionController drops missing-task, duplicate and out-of-order events", async () => {
  const controller = new VoiceSessionController();
  const accepted = [];
  controller.onUIEvent((event) => accepted.push(event));
  const mock = controller.providers.get("mock");
  const base = { eventId: "one", occurredAt: "2026-09-28T10:00:00Z", source: "mock", state: "thinking", demo: true, sessionId: "session-1", taskId: "task-1" };
  mock.emitEvent({ ...base, taskId: undefined });
  mock.emitEvent(base);
  mock.emitEvent(base);
  mock.emitEvent({ ...base, eventId: "older", occurredAt: "2026-09-28T09:00:00Z" });
  mock.emitEvent({ ...base, eventId: "fake-live", demo: false });
  assert.deepEqual(accepted.map((event) => event.eventId), ["one"]);
  await controller.dispose();
});

test("voice scenario timers stop on controller disposal", async () => {
  const controller = new VoiceSessionController();
  const accepted = [];
  controller.onUIEvent((event) => accepted.push(event));
  await controller.triggerMorningBriefing();
  const mock = controller.providers.get("mock");
  assert.notEqual(mock.currentTimer, null);
  await controller.dispose();
  assert.equal(mock.currentTimer, null);
  const count = accepted.length;
  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.equal(accepted.length, count);
});

test("mock offline state is explicit and reconnects only for a new demo scenario", async () => {
  const controller = new VoiceSessionController();
  const states = [];
  controller.onUIEvent((event) => states.push(event.state));
  await controller.triggerOffline();
  assert.equal(states.at(-1), "offline");
  await controller.triggerMorningBriefing();
  assert.equal(states.at(-1), "idle");
  await controller.dispose();
});
