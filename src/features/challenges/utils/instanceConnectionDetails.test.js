import test from "node:test";
import assert from "node:assert/strict";
import { endpointCopyText } from "./instanceConnectionDetails.js";

test("connection copy includes public TLS/SNI details and never uses the internal port", () => {
  assert.equal(endpointCopyText({
    url: "tls://i-example.ctf.example:443", hostname: "i-example.ctf.example",
    connection_port: 443, port: 31337, tls: true, server_name: "route-example.ctf.example",
  }), "tls://i-example.ctf.example:443\n호스트: i-example.ctf.example\n연결 포트: 443\nTLS: 사용\nSNI: route-example.ctf.example");
});

test("legacy copy stays URL-only and explicit null/false stays explicit", () => {
  assert.equal(endpointCopyText({ url: "tcp://old.example:31000" }), "tcp://old.example:31000");
  assert.equal(endpointCopyText({ url: "https://web.example", tls: false, server_name: null }),
    "https://web.example\nTLS: 사용 안 함\nSNI: 미제공");
});
