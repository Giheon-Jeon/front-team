import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("부스 미리보기는 실제 컴포넌트와 로컬 fixture만 사용한다", () => {
  const page = readFileSync(new URL("./BoothMenuPreviewPage.jsx", import.meta.url), "utf8");
  assert.match(page, /<BoothMenuModal/);
  assert.match(page, /<SignatureFestivalScreen/);
  assert.match(page, /FESTIVAL_CLUBS.map/);
  assert.match(page, /onPreviewClub=\{show\}/);
  assert.match(page, /useState\(null\)/);
  assert.doesNotMatch(page, /selectedId|onSelect=|onPreviewMjsec/);
  assert.doesNotMatch(page, /fetch\(|from ["'].*\/api\//);
  const routes = readFileSync(new URL("../../../routes/AppRoutes.jsx", import.meta.url), "utf8");
  assert.match(routes, /import.meta.env.DEV && <Route path="\/dev\/booth-menu-preview"/);
});
