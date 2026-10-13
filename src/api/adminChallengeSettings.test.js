import assert from "node:assert/strict";
import test from "node:test";
import apiClient from "./client.js";
import { getAdminChallenge, updateAdminChallenge, getAdminChallengeFlag, revealAdminChallengeFlag, getAdminChallengeFiles } from "./admin.js";
import { challengeDetailsDraft, challengeDetailsChanges } from "../features/admin/utils/adminChallengeSettings.js";

test("editing a statement sends only changed basic fields and keeps grading and runtime settings out", () => {
  const challenge = { title: "Example", description: null, category: "WEB", difficulty: "EASY", flag_hash: "hidden", current_score: 500 };
  const draft = challengeDetailsDraft(challenge);
  assert.deepEqual(challengeDetailsChanges(challenge, draft), {});
  assert.deepEqual(challengeDetailsChanges(challenge, { ...draft, title: " Example ", description: "첫 문단\n\n둘째 문단" }), { description: "첫 문단\n\n둘째 문단" });
  assert.deepEqual(challengeDetailsChanges({ ...challenge, description: "이전 지문" }, draft), { description: "" });
});

test("challenge settings use admin routes, explicit flag reveal, and cancellation", async () => {
  const originalAdapter = apiClient.defaults.adapter;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } });
  const requests = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: { code: "SUCCESS" }, status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    const signal = new AbortController().signal;
    await getAdminChallenge("challenge-a", { signal });
    await getAdminChallengeFlag("challenge-a", { signal });
    await getAdminChallengeFiles("challenge-a", { signal });
    await revealAdminChallengeFlag("challenge-a", { signal });
    await updateAdminChallenge("challenge-a", { title: "새 제목", description: "새 지문" });
    assert.deepEqual(requests.map(({ method, url }) => [method, url]), [
      ["get", "/admin/challenges/challenge-a"], ["get", "/admin/challenges/challenge-a/flag"],
      ["get", "/admin/challenges/challenge-a/files"], ["post", "/admin/challenges/challenge-a/flag/reveal"],
      ["patch", "/admin/challenges/challenge-a"],
    ]);
    assert.ok(requests.slice(0, 4).every((request) => request.signal === signal));
    assert.deepEqual(JSON.parse(requests[3].data), {});
    assert.deepEqual(JSON.parse(requests[4].data), { title: "새 제목", description: "새 지문" });
    assert.equal(requests[3].timeout, 15000);
    assert.equal(requests[4].timeout, 15000);
  } finally {
    apiClient.defaults.adapter = originalAdapter;
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else delete globalThis.localStorage;
  }
});
