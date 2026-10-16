import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { FESTIVAL_CLUBS, buildFestivalBooths } from "./utils/festivalBooths.js";

test("여섯 부스는 실제 club_id와 signature_id를 보존하고 비공개 부스는 비워둔다", () => {
  const records = FESTIVAL_CLUBS.map((club, i) => ({ club_id: `club-${i}`, signature_id: `problem-${i}`, club_name: club.name, score: i + 10 }));
  const { booths } = buildFestivalBooths(records);
  booths.forEach((booth, i) => {
    assert.equal(booth.clubId, records[i].club_id);
    assert.equal(booth.problems.length, 1);
    assert.equal(booth.problems[0].signature_id, records[i].signature_id);
    assert.equal(booth.university, FESTIVAL_CLUBS[i].university);
  });
  assert.ok(buildFestivalBooths([]).booths.every(booth => booth.problems.length === 0));
});
test("단일 공통 모달만 남고 운영 부스는 공개 문제 입장 조건을 유지한다", () => {
  for (const path of ["./components/ChallengeMenuModal.jsx", "./components/ChallengeMenuModal.module.css", "./preview/ChallengeMenuPreview.jsx"]) assert.equal(existsSync(new URL(path, import.meta.url)), false);
  const page = readFileSync(new URL("./pages/SignaturesPage.jsx", import.meta.url), "utf8");
  assert.match(page, /ready && club.problems.length > 0/);
  assert.match(page, /onPreviewClub\(club\)/);
  const route = readFileSync(new URL("./pages/SignatureClubPage.jsx", import.meta.url), "utf8");
  assert.match(route, /key=\{signatureId\}/);
  assert.match(route, /navigate\(-1\)/);
  assert.match(route, /replace: true/);
});
