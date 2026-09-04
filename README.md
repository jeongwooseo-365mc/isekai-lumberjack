# 이세계로 소환되어버린 나무꾼 v1.1.2

세로 모바일 화면을 우선한 완전 오프라인 탭·방치형 게임입니다. 브라우저 미리보기와 Tauri 2 기반 Windows·Android 패키징을 지원합니다. 배포 신규 게임은 레벨 1, 체력 500, 재화·강화돌·낚시 재료·음식 0개에서 시작합니다.

## v1.1.2 Android 설치·아이콘 핫픽스

- Android 앱 식별자를 `com.isekailumberjack.release`로 변경했습니다. 휴대폰은 이전 테스트 앱과 완전히 별개의 앱으로 인식하므로 기존 앱을 삭제하지 않아도 설치할 수 있습니다.
- Android 전용 아이콘은 도끼를 74%로 축소하고 왼쪽으로 옮겨, 둥근 런처 마스크에서도 도끼날 전체가 보이도록 안전 여백을 확보했습니다. Windows 아이콘은 기존 원본을 유지합니다.
- Android와 Windows 빌드를 하나의 `Build Android and Windows` Actions 실행 안의 두 병렬 작업으로 통합했습니다.
- 앱 자체 버전만 `1.1.2`로 올리고 세이브 형식은 `1.1.0`으로 유지합니다. 단, Android 새 앱은 운영체제상 별도 앱이므로 이전 앱의 로컬 세이브를 공유하지 않습니다.

## v1.1.1 Android 핫픽스

- Android 프로젝트를 만든 뒤 도끼 아이콘을 생성하도록 순서를 수정하여 Tauri 기본 아이콘이 패키징되던 문제를 해결했습니다.
- ARM64 배포 APK와 x86_64 실행 검증 APK를 함께 빌드하고, Android 에뮬레이터에서 설치·실행·프로세스 유지·활성 화면·크래시 로그를 검사합니다.
- 앱 자체 버전만 `1.1.1`로 올리고 세이브 형식은 `1.1.0`으로 유지하여 기존 v1.1 진행 데이터를 초기화하지 않습니다.

## v1.1 변경 사항

- 모든 집의 휴식 회복 주기를 10초에서 1초로 단축했습니다. 앱 종료·백그라운드 시간도 같은 1초 규칙으로 정산합니다.
- 음식 회복량·재료와 낚싯대별 어종 가중치를 재조정했습니다.
- 요리는 즉시 회복 대신 음식 1개를 제작합니다. 음식은 마이페이지에서 장착하거나 즉시 먹을 수 있습니다.
- 장착 음식은 체력이 0이 될 때 자동으로 1개 사용하며, 수량이 0이면 장착 슬롯과 목록에서 사라집니다.
- 메인 HUD를 장비 5칸과 음식 1칸의 6칸 구성으로 변경했습니다.
- 모바일 화면 직접 탭으로 낚시가 시작되지 않던 입력 경로를 수정했습니다.
- Android는 시스템 바를 숨기는 몰입 화면으로 실행되며 스와이프로 잠시 표시할 수 있습니다.
- Android 표시 이름은 `이세계나무꾼`이며 Windows와 같은 도끼 아이콘을 사용합니다.
- Windows 릴리스 실행 시 콘솔 창이 함께 열리지 않습니다.
- 지도 던전 버튼을 우하단 암벽산에 맞춰 더 내리고 가장자리 여백을 남겼습니다.
- 상급 숲·광산·던전에서는 하급 일반 재화와 하급 강화돌이 나오지 않습니다.
- 강화돌 확률은 하급 `10%`, 중급 `하급 2%/중급 8%`, 상급 `중급 3%/상급 7%`입니다.
- 신의 장비 5종 제작 재료를 2배로 늘렸습니다.
- 1,000 이상의 경험치는 `2k`, `1234k`처럼 정수 k 표기로 축약합니다.

v0.9의 접이식 메뉴, 대상 체력 HUD, 절대 시각 방치 정산, 50% 기본 음량, 자동 저장, 전 지역 강화돌 확률은 유지합니다.

## 음식

| 음식 | 회복량 | 필요 재료 |
|---|---:|---|
| 생선 수프 | +75 | 해초 10, 민어 2 |
| 해산물 스튜 | +225 | 해초 10, 조개 10, 민어 5 |
| 구운 생선 | +150 | 숭어 1 |
| 연어 스테이크 | +350 | 연어 1 |
| 고급 랍스터 정식 | +750 | 랍스터 1 |

음식은 종류별 최대 9,999개까지 쌓이며 장비 20칸 제한에는 포함되지 않습니다.

## 빠른 미리보기

```bash
npm install
npm run prepare:web
npx serve dist
```

브라우저 미리보기에서는 `localStorage`를 사용합니다.

## Windows 빌드

필요 환경은 Node.js 20 이상, Rust stable, Visual Studio Build Tools의 Desktop development with C++, Microsoft Edge WebView2입니다.

```powershell
npm install
npm run build
```

또는 `BUILD_WINDOWS.bat`을 실행합니다. NSIS 설치 파일은 `src-tauri/target/release/bundle/nsis/`에 생성됩니다.

## Android 빌드

Tauri 2 모바일 개발 환경과 Android Studio/SDK/NDK를 준비합니다.

```powershell
npm install
npm run prepare:web
npm run android:init
node_modules\.bin\tauri.cmd icon src-tauri\icons\icon-mobile.png
python tools\patch_android.py
python tools\verify_android_package.py --generated
npm run android:build
```

또는 `BUILD_ANDROID.bat`을 실행합니다. `patch_android.py`는 Tauri가 생성한 Android 진입점에 몰입 화면을 적용하고 짧은 앱 이름을 검증합니다.

## GitHub 자동 빌드

`main` 브랜치에 코드가 올라오면 `Build Android and Windows` 워크플로 하나가 실행되고 아래 두 작업이 병렬로 진행됩니다.

- `Windows NSIS`: Windows 설치 파일 생성
- `Android APK`: Android ARM64 최적화 APK 생성, 새 앱 ID·안전 여백 도끼 아이콘 검증, 테스트 키 서명, 에뮬레이터 설치·실행 검증

GitHub Actions의 한 실행 화면에서 두 플랫폼의 진행 내역과 결과 아티팩트를 함께 확인할 수 있습니다. v1.1.2 Android는 이전 앱과 다른 식별자를 사용해 나란히 설치됩니다. 테스트 APK는 임시 키로 서명되므로 v1.1.2 이후 덮어쓰기 업데이트를 지속하려면 고정 릴리스 키를 설정해야 합니다.

## 저장과 방치 진행

- Tauri 앱: 앱 데이터 폴더의 `save.json`, 엔딩 징표용 `meta.json`
- 브라우저: `localStorage`
- 숲·광산·던전·연못은 오토 ON 상태의 경과 시간을 복귀 시 정산합니다.
- 집은 휴식 자세가 켜진 동안 1초마다 회복하며 종료·백그라운드 시간도 정산합니다.
- 장착 음식은 작업 중 체력이 0이 되면 자동 소비되어 오토 진행을 이어갑니다.
- 앱 버전과 세이브 버전이 다르면 기존 정책대로 일반 세이브를 초기화합니다.
- 엔딩 완료 시 일반 세이브는 삭제되고 이스터에그 해금 기록만 남습니다.

## 주요 파일

```text
index.html                   화면 구조
styles.css                   세로형 UI와 애니메이션
game.js                      게임 상태·밸런스·방치 시뮬레이션
assets/                      이미지·BGM·효과음
src-tauri/                   Tauri 2 네이티브 코드와 설정
tools/patch_android.py       Android 몰입 화면·짧은 앱 이름 적용
tools/prepare_dist.js        런타임 dist 생성
tools/test_game.js           핵심 게임 로직 스모크 테스트
tools/validate_project.py    에셋·UI·패키징 입력 검증
GAME_DESIGN_MASTER_v1.1.md   최신 확정 기획
HANDOFF_v1.1.md              구현·빌드 인수인계
BUILD_REPORT_v1.1.md         실제 Windows·Android 빌드 결과
BUILD_REPORT_v1.1.2.md       새 Android 앱·통합 빌드 검증 결과
```

## 검증

```bash
node --check game.js
node tools/test_game.js
npm run prepare:web
python tools/validate_project.py
```

BGM 8곡과 48kHz 스테레오 Vorbis 효과음 34개가 포함되어 있습니다.
