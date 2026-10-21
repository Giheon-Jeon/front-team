# 3D·가변 한글 글꼴·모바일 배경 추가 최적화

기준은 PR #123의 이전 커밋 0f17280
처음 main과 비교한 결과는 frontend-performance-2026-10-20.md에 있으며, 이 문서는 그 이후의 추가 변경과 검증 결과임

## 변경과 자산 크기

| 대상 | 이전 | 현재 | 감소 |
|---|---:|---:|---:|
| 3D 공통 JavaScript 청크 | 684,482B | 555,104B | 18.9% |
| Dice3D JavaScript 청크 | 196,611B | 185,390B | 5.7% |
| 가변 한글 글꼴의 일반 문구 첫 파일 | 2,057,688B | 171,636B | 91.7% |
| 세로 화면 광장 배경 | 2,207,288B | 1,328,042B | 39.8% |
| 1100px 이하에서 숨긴 순위표 원화 | 1,279,922B | 요청 없음 | 100% |
| 1100px 이하에서 숨긴 KoTH 원화 | 1,789,782B | 요청 없음 | 100% |

### 3D

React Three Fiber의 기본 Canvas는 전체 Three.js 객체를 등록해 사용하지 않는 객체까지 번들에 남겼음
공식 createRoot·extend API로 주사위 장면의 JSX 객체 7개만 등록함
렌더러·색 공간·톤 매핑·조명·그림자·픽셀 비율 상한·demand 렌더링은 기존 설정을 유지함
원래 GLTFLoader와 dice.glb, 눈 방향·물리 계산·물리 워커는 수정하지 않음
화면 크기 변경은 ResizeObserver와 resize 이벤트로 반영하며, React 18의 실제 DOM 수명에 맞춰 root를 정리함
서버 렌더링의 canvas 마크업과 pointer-events:none을 유지함
렌더러·모델 오류는 기존 BoardTrack의 대체 주사위로 전달함

구현 근거: [React Three Fiber의 Custom Canvas·Tree-shaking API](https://r3f.docs.pmnd.rs/api/canvas#tree-shaking)
큰 청크 경고는 555KB로 남아 있으며 경고 기준이나 번들 분할 설정은 변경하지 않음

### 가변 글꼴

MyPage Pretendard·Detail Pretendard·Board Tooltip Pretendard·MSG Payment의 원본 가변 글꼴을 나눔
현재 소스와 기본 문자·기호의 941자를 공통 파일에 두고, 나머지는 유니코드 구간별로 제공함
49개 조각의 cmap은 서로 겹치지 않고 원본 14,336자를 전부 포함함
100·400·700·900 굵기에서 모든 원본 문자의 보간 윤곽과 폭을 비교해 일치를 확인함
원본 가변 축과 레이아웃 기능도 유지함
드문 완성형 문자는 해당 구간을 읽고, 복합 문자 조합이나 조각 다운로드 실패에는 기존 전체 글꼴 대체 경로를 유지함
문구를 수정한 뒤 재생성하지 않아도 원래 글꼴에 있던 문자를 표시할 수 있음
재생성 시 해시 쿼리로 조각의 캐시 버전을 구분함

전체 조각의 저장 용량 합계는 2,769,436B이고 원본 대체 파일도 보관함
이는 전체 배포 파일의 저장 용량 감소가 아니라 화면에 필요한 글꼴 다운로드 감소임
이미 설치된 글꼴을 우선하는 기존 공통 CDN Pretendard 설정은 유지함
공식 동적 CSS도 조사했으나 479,146B·828 face 정의이며 이 환경에서는 기존 공통 글꼴 파일의 추가 요청이 관찰되지 않아 일률적인 교체를 적용하지 않음
공식 배포 방식 참고: [Pretendard 문서](https://github.com/orioncactus/pretendard/blob/main/packages/pretendard/README.md)

### 모바일 배경

광장 배경은 1536×1024의 가운데 922×1024를 무손실로 잘라냄
화면 폭 1100px 이하이고 화면 비율이 9:10 이하일 때만 이 파일을 사용함
기존 cover가 보여주던 중앙 영역의 원본 픽셀과 높이를 유지해 확대나 새 손실 압축을 추가하지 않음
넓은 창·가로 화면에서는 원래 전체 배경을 선택함
순위표·KoTH에서 CSS로 숨긴 원화는 picture가 투명한 작은 데이터 이미지를 선택해 실제 다운로드도 막음
다시 넓어지면 원래 원화를 자동으로 선택함
배경의 넓은 장면과 함께 가로로 스크롤·확대하는 게임 보드 배경은 같은 파일과 좌표를 유지함

## 페이지별 추가 절감

프로덕션 빌드·같은 로컬 API fixture·Chromium에서 비교함
PC는 1440×900, 모바일은 390×844
아래 값은 화면 진입 후 Resource Timing decodedBodySize 합계이며 HTTP 압축 후 전송량이나 로딩 시간 개선율이 아님
교차 출처 리소스의 공개되지 않은 크기와 일부 메모리 캐시 항목은 이 합계에 포함되지 않을 수 있음
CSS 배경·지연 모듈 요청이 마친 뒤 측정하도록 networkidle 대기를 추가함

| 화면 | 크기 | 이전 → 현재 | 추가 감소 |
|---|---|---:|---:|
| 보드 | PC·모바일 | 5.071MB → 4.953MB | 2.3% |
| 마이페이지 | PC | 5.141MB → 3.278MB | 36.2% |
| 마이페이지 | 모바일 | 3.186MB → 1.322MB | 58.5% |
| 문제 상세 | PC | 4.233MB → 2.369MB | 44.0% |
| 문제 상세 | 모바일 | 3.277MB → 1.414MB | 56.9% |
| 순위표 | 모바일 | 4.633MB → 2.475MB | 46.6% |
| KoTH | 모바일 | 9.866MB → 7.198MB | 27.0% |
| 규칙 | 모바일 | 3.493MB → 2.614MB | 25.2% |
| 관리자 대시보드 | 모바일 | 3.412MB → 2.555MB | 25.1% |

일반 문구의 페이지에서는 전체 가변 글꼴 요청 없이 공통 조각을 사용하는 것을 확인함
관리자 PC는 공유 CSS에 글꼴 정의가 추가되어 3.412MB → 3.435MB로 약 22.4KB 증가함
같은 화면의 모든 리소스가 줄었다고 판단하지 않으며, 실제 시간·네트워크 성능은 따로 측정해야 함

## QA

- npm test 514개와 프로덕션 빌드, git diff --check 통과
- 12개 화면·PC와 모바일 24개 조건에서 런타임 예외·깨진 이미지·가로 넘침·예상하지 않은 화면 오류 안내 없음
- 320·390·768·1440px의 59개 화면 상태를 같은 날짜·난수·API 응답으로 기준 빌드와 비교함
- 표시 텍스트 차이 0개, 비교 대상 좌표·크기 10,828개 차이 0개
- 기존 보드·황금열쇠·룰렛·공항·문제 선택·부스 흐름에 마이페이지·문제 상세·규칙·관리자 화면을 추가함
- 세로·가로·1100/1101px 경계·9:10 경계 양쪽·DPR 1/2의 32개 추가 화면 조건에서 배치 차이 0개
- 추가 32개 조건에서 세로 배경·숨긴 원화의 선택과 요청 유무를 검증함
- 32개 비교 화면의 RGB 채널 차이 32 초과 픽셀은 0개이며 최대 평균 절대 차이는 0.346/255
- 권한·주사위 검사는 기준·현재 빌드 각각 27개 시나리오 통과
- PC·모바일에서 1~6 눈과 상보 눈, 일반 애니메이션, 화면 크기 변경, 실행 중 이탈, JavaScript·모델 다운로드 실패, WebGL 불가를 포함함
- 실행 중 앱 내 규칙 버튼으로 이탈해 캔버스 0개를 확인하고, 돌아온 뒤 캔버스 1개와 재실행을 확인함
- 주사위의 14개 전후 캡처에서 크기가 같고 평균 절대 차이는 0.041~0.334/255이며 직접 화면도 확인함
- 개발 서버의 React StrictMode에서도 주사위 실행·버튼 복구·시간 경과 후 캔버스 1개 유지를 확인함
- 네 글꼴 별칭·네 굵기·세 문구의 48개 조합에서 문자 폭과 전체 샘플 캔버스의 픽셀 SHA-256이 원본과 같음
- 공통 조각 다운로드를 실패시킨 경우에도 원본 대체로 같은 폭·픽셀 결과를 확인함

처리하지 않은 pageerror는 없었음
503·401·다운로드 실패·WebGL 불가 재현의 네트워크·ErrorBoundary 콘솔 오류는 예상한 결과임
이 검증은 Windows Chromium과 로컬 fixture 기준이며 실제 운영 API·실기기·Safari/WebKit·모바일 GPU 성능 검증을 대신하지 않음

## 재현

Python은 글꼴·이미지 생성과 픽셀 비교에만 필요하며 일반 빌드에는 필요하지 않음
생성한 자산과 CSS는 저장소에 포함함

```sh
npm test
npm run build -- --manifest
python scripts/subset-game-fonts.py
python scripts/optimize-mobile-backdrop.py
```

자산 생성은 원본·문구가 바뀔 때만 수행하고, 생성 후에는 다시 빌드함
기준 0f17280 빌드를 4173, 현재 빌드를 4174에서 제공함
output/playwright/phase3 폴더를 만든 뒤 다음처럼 각 검사를 새 브라우저 세션에서 실행함

```sh
npx --yes --package @playwright/cli playwright-cli -s=phase3-current open "http://127.0.0.1:4174/?qaOutput=output/playwright/phase3"
npx --yes --package @playwright/cli playwright-cli -s=phase3-current run-code --filename scripts/qa-frontend-interactions.js
```

qa-frontend-performance.js·qa-frontend-responsive.js·qa-frontend-access.js·qa-frontend-fonts.js도 같은 방식으로 실행함
상호작용 실행 결과를 interactions-baseline.log·interactions-current.log로 저장한 뒤 비교함

```sh
python scripts/compare-frontend-interactions.py output/playwright/phase3
```

글꼴 대체 검사는 최초 URL에 failSubset=1을 더해 별도 세션에서 실행함
StrictMode 검사는 Vite 개발 서버를 열고 최초 URL에 strictOnly=1을 더해 qa-frontend-access.js를 실행함
가상 시계를 설치한 브라우저는 다운로드 용량 측정에 사용하지 않음
캡처와 JSON·실행 로그는 output/playwright/phase3에 보관하고 저장소에서는 제외함
