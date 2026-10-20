# 모바일 원본 디자인 유지 검수

2026-10-20 로컬 프로덕션 빌드 확인

## 변경 범위

모바일에서 원화를 숨기거나 일반 카드·목록으로 바꾸던 게임 화면을 원래 와이드 구성으로 통일
보드, KoTH, 규칙, 마이페이지, 문제 상세, 동아리 축제장에 공통 GameSceneViewport 적용
기존에 같은 방식으로 수정한 스코어보드는 그대로 유지

- 너비 1100px 이하 또는 높이 620px 미만이면 원본 1920×1080 캔버스를 균일하게 축소
- 확대 보기에서는 원래 읽기 크기를 열고 가로·세로로 이동
- 화면 맞춤으로 전체 구성 복원, 와이드 화면으로 돌아오면 확대 상태 해제
- 화면 좌표를 계산하는 CSS는 공통 캔버스의 크기를 기준으로 평가
- 모바일 메뉴·별도 카드로 원화 패널을 대체하지 않음
- 동아리 축제장의 중복 모바일 목록 제거, 여섯 부스와 실제 입장 링크만 유지
- 보드 배경은 한 장만 그리고 바닥 기준점 (917, 630)을 원판 무대에 고정
- 확대 상태에서 입력창의 시작 부분과 선택한 KoTH 설명창이 보이도록 이동
- KoTH 팀 토큰과 인스턴스 확인창은 실제 화면에 맞춰 버튼과 입력창 접근 보장

배경·원판·패널·글꼴 파일과 런타임 의존성은 추가하거나 변경하지 않음
규칙 페이지의 모바일 배경은 기존 원본에서 만든 세로 소스를 사용
로그인·안내·관리자·타이머는 원화와 색·패널을 유지하는 기존 반응형 흐름 확인

## 화면 검수

수정 전후 12개 경로를 1440×900과 390×844에서 캡처
와이드 화면의 KoTH, 문제 상세, 동아리 축제장, 관리자, 소개, 참가 안내, 타이머 캡처는 픽셀 일치
보드의 3D 표시와 나머지 화면의 글꼴 렌더링 등 작은 차이는 원본 좌표 검사와 함께 확인

다음 12개 조건에서 보드·KoTH·규칙·마이페이지·문제 상세·동아리 축제장·스코어보드·관리자 등 8개 경로 검사

| 크기 | DPR |
| --- | --- |
| 1920×1080 | 1 |
| 320×568 | 1 |
| 390×844 | 1, 2 |
| 844×390 | 1 |
| 768×1024 | 1 |
| 1024×768 | 1 |
| 1100×900 | 1 |
| 1101×900 | 1 |
| 1440×900 | 1, 2 |
| 1600×600 | 1 |

96개 화면 검사 통과
가로 넘침·깨진 이미지·오류 알림·브라우저 실행 오류 없음
원본 1920×1080의 원화·원판·부스 좌표와 모바일 화면을 역산한 좌표의 최대 차이는 0.000256 CSS px
배경의 중복 표시·화면 틈·바닥 기준점·동아리 여섯 부스의 클릭 영역 확인
스코어보드의 14열 순위표와 원래 16:9 구성 유지 확인

## 기능 검수

320·390·768·1440px에서 92개 기능 화면 확인

- 열린 문제 검색과 닫기
- 보드 확대와 화면 맞춤
- 황금열쇠, 룰렛 돌리기와 결과 확인
- 기차 목적지 선택과 취소, 문제 후보 선택과 닫기
- 동아리 메뉴 입장과 닫기, 스크롤 잠금 복구
- 마이페이지 QR 발급
- 플래그 입력과 제출 후 해결 상태 반영
- 인스턴스 종료 확인창과 취소
- KoTH 문제 접속 정보와 팀 토큰 열기·닫기

추가 터치·이동 검수 40개 기록 통과

- 여섯 게임 화면에서 실제 Chrome 터치 입력으로 가로·세로 이동
- 세로에서 가로로 회전한 뒤 읽기 상태와 터치 이동 유지
- 화면 맞춤 복귀 후 스크롤 위치 초기화와 전체 원화 범위 확인
- 와이드 화면 복귀와 다시 모바일로 전환한 뒤 기본 보기 확인
- 320·390·768·844px에서 입력창 앞부분, 긴 본문 스크롤, KoTH 설명창의 위치 확인
- 같은 크기에서 팀 토큰 창과 닫기 버튼이 실제 화면 안에 있는지 확인
- 원화 아래에 추가 동아리가 있어도 링크까지 이동 가능
- 별도 부스 문제 상세도 390·1440px에서 원래 패널 재질과 내용 유지

전체 자동 테스트 518개와 프로덕션 빌드 통과
기하 계산에는 화면 비율·원본 크기·배경 덮임·바닥 기준점의 속성 검사 추가

## 재현

각 검사는 독립된 Playwright 세션에서 실행
이전 검사에서 사용한 CDP 장치 설정이 다음 검사에 남지 않게 분리

```powershell
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4391 --strictPort
```

```powershell
npx --offline --yes --package @playwright/cli playwright-cli -s=responsive open http://127.0.0.1:4391/ --headed
npx --offline --yes --package @playwright/cli playwright-cli -s=responsive run-code --filename scripts/qa-frontend-responsive.js
npx --offline --yes --package @playwright/cli playwright-cli -s=interactions open http://127.0.0.1:4391/ --headed
npx --offline --yes --package @playwright/cli playwright-cli -s=interactions run-code --filename scripts/qa-frontend-interactions.js
npx --offline --yes --package @playwright/cli playwright-cli -s=navigation open 'http://127.0.0.1:4391/?qaScope=scene' --headed
npx --offline --yes --package @playwright/cli playwright-cli -s=navigation run-code --filename scripts/qa-frontend-interactions.js
```

검수는 명시적인 API fixture를 사용한 로컬 프로덕션 빌드 기준
실제 계정이나 대회 데이터를 수정하지 않았으며 운영 배포 결과를 의미하지 않음
캡처와 상세 측정값은 gitignore 대상 output/playwright/mobile-design-before와 mobile-design-after에 저장
