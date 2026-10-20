import test from "node:test";
import assert from "node:assert/strict";
import { startVisiblePolling } from "./visiblePolling.js";

class PageVisibility extends EventTarget {
  hidden = false;
  change(hidden) {
    this.hidden = hidden;
    this.dispatchEvent(new Event("visibilitychange"));
  }
}

async function drain() {
  for (let index = 0; index < 8; index++) await Promise.resolve();
}

test("hidden tabs stop polling and refresh once immediately on return", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const document = new PageVisibility();
  let requests = 0;
  const stop = startVisiblePolling(() => { requests++; }, { document });
  await drain();
  assert.equal(requests, 1);
  t.mock.timers.tick(30000);
  await drain();
  assert.equal(requests, 2);
  document.change(true);
  t.mock.timers.tick(120000);
  await drain();
  assert.equal(requests, 2);
  document.change(false);
  await drain();
  assert.equal(requests, 3);
  stop();
  t.mock.timers.tick(120000);
  document.change(false);
  await drain();
  assert.equal(requests, 3);
});

test("visibility changes during a slow request serialize a single fresh request", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const document = new PageVisibility();
  const pending = [];
  let requests = 0;
  const stop = startVisiblePolling(() => {
    requests++;
    return new Promise(resolve => pending.push(resolve));
  }, { document });
  await drain();
  document.change(true);
  document.change(false);
  document.change(true);
  document.change(false);
  t.mock.timers.tick(90000);
  await drain();
  assert.equal(requests, 1);
  pending.shift()();
  await drain();
  assert.equal(requests, 2);
  stop();
  pending.shift()();
  await drain();
  t.mock.timers.tick(90000);
  await drain();
  assert.equal(requests, 2);
});

test("a hidden initial mount waits for visibility before its first request", async () => {
  const document = new PageVisibility();
  document.hidden = true;
  let requests = 0;
  const stop = startVisiblePolling(() => { requests++; }, { document });
  await drain();
  assert.equal(requests, 0);
  document.change(false);
  await drain();
  assert.equal(requests, 1);
  stop();
});

test("cleanup before the first microtask prevents a StrictMode stale request", async () => {
  const document = new PageVisibility();
  let requests = 0;
  const stop = startVisiblePolling(() => { requests++; }, { document });
  stop();
  await drain();
  document.change(false);
  await drain();
  assert.equal(requests, 0);
});

test("a request finishing in a hidden tab cannot schedule another request", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const document = new PageVisibility();
  let finish;
  let requests = 0;
  const stop = startVisiblePolling(() => {
    requests++;
    return new Promise(resolve => { finish = resolve; });
  }, { document });
  await drain();
  document.change(true);
  finish();
  await drain();
  t.mock.timers.tick(90000);
  await drain();
  assert.equal(requests, 1);
  stop();
});

test("polling resumes after a failed request instead of locking or overlapping", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const document = new PageVisibility();
  let requests = 0;
  const stop = startVisiblePolling(() => {
    requests++;
    if (requests === 1) throw new Error("network error handled by the screen");
  }, { document });
  await drain();
  t.mock.timers.tick(30000);
  await drain();
  assert.equal(requests, 2);
  stop();
});

test("an already-loaded dashboard waits one interval without duplicating initial reads", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const document = new PageVisibility();
  let requests = 0;
  const stop = startVisiblePolling(() => { requests++; }, { document, immediate: false });
  await drain();
  assert.equal(requests, 0);
  t.mock.timers.tick(29999);
  await drain();
  assert.equal(requests, 0);
  t.mock.timers.tick(1);
  await drain();
  assert.equal(requests, 1);
  document.change(true);
  document.change(false);
  await drain();
  assert.equal(requests, 2);
  stop();
});
