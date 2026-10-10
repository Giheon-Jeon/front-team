import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const svgUrl = new URL("../../public/assets/intro/favicon.svg", import.meta.url);
const pngUrl = new URL("../../public/assets/intro/favicon.png", import.meta.url);

test("테마 대응 SVG 파비콘을 우선 연결하고 기존 PNG는 대체 파일로 유지한다", () => {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const links = html.match(/<link rel="icon"[^>]+>/g);
  assert.equal(links.length, 2);
  assert.match(links[0], /type="image\/png"[^>]+favicon.png/);
  assert.match(links[1], /type="image\/svg\+xml" sizes="any"[^>]+favicon.svg/);
});

test("작은 파비콘은 원래 로고를 사용하고 밝은 테마와 어두운 테마의 대비를 구분한다", () => {
  const svg = readFileSync(svgUrl, "utf8");
  assert.match(svg, /viewBox="7 6 34 34"/);
  assert.match(svg, /color: #613d15/);
  assert.match(svg, /@media \(prefers-color-scheme: dark\)[\s\S]*color: #f5e7c4/);
  assert.match(svg, /fill="currentColor"/);
  assert.match(svg, /mask-type: alpha/);
  assert.match(svg, /<feFuncA type="linear" slope="1.6"/);
  assert.doesNotMatch(svg, /feGaussianBlur|feMorphology/);
  const encoded = svg.match(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/)[1];
  assert.deepEqual(Buffer.from(encoded, "base64"), readFileSync(pngUrl));
});

test("파비콘은 추가 이미지 요청과 자바스크립트 없이 작은 파일 하나로 색을 바꾼다", () => {
  const svg = readFileSync(svgUrl, "utf8");
  assert.ok(statSync(svgUrl).size < 5000);
  assert.doesNotMatch(svg, /<script|foreignObject|href="https?:|href="\//);
  assert.equal((svg.match(/<image /g) || []).length, 1);
});
