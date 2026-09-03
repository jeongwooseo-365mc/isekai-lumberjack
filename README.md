# 이세계로 소환되어버린 나무꾼 v0.9

실제 배포용 기본값을 사용하는 빌드입니다. 신규 게임은 레벨 1·재화 0에서 시작하며, 현대 벌목장부터 이세계의 허름한 집까지 이어지는 오프닝을 재생합니다.

주요 v0.9 변경:

- 하단 HUD를 좌측 상태·장비 40%, 우측 획득 로그 60%의 좌우 배치로 변경
- 장착 장비를 최대 72px의 큰 2열 아이콘으로 배치하고 다섯 번째 슬롯은 가운데 정렬
- 로그 글자·아이콘 크기는 유지하면서 가로 공간을 늘려 줄바꿈을 줄임
- 로그·마이페이지·제작소 등 스크롤 가능한 영역의 흰 스크롤바만 숨기고 터치 스크롤은 유지
- Windows 설치 파일과 Android 범용 APK를 자동 생성하는 GitHub Actions 추가

v0.8의 접이식 메뉴, 대상 체력 HUD, 절대 시각 방치 정산, 50% 기본 음량, 자동 저장, 전 지역 강화돌 확률은 그대로 유지합니다.

세로 모바일 화면을 우선한 완전 오프라인 탭/방치형 게임입니다. 브라우저 미리보기와 Tauri 2 기반 Windows·Android 패키징을 지원하도록 구성했습니다.

## 빠른 미리보기

프로젝트 폴더에서 다음 명령을 실행한 뒤 표시되는 주소를 브라우저로 엽니다.

```bash
npm run prepare:web
npx serve dist
```

별도 서버 패키지가 없다면 VS Code Live Server 등으로 `dist/index.html`을 열어도 됩니다. 브라우저 미리보기에서는 저장에 localStorage를 사용합니다.

## Windows 개발과 빌드

필요 환경:

- Node.js 20 이상
- Rust stable
- Visual Studio Build Tools의 Desktop development with C++
- Microsoft Edge WebView2

```powershell
npm install
npm run dev
npm run build
```

또는 `BUILD_WINDOWS.bat`을 실행합니다. 결과 설치 파일은 Tauri의 `src-tauri/target/release/bundle/` 아래에 생성됩니다.

## Android 개발과 APK 빌드

Tauri 2 모바일 개발 환경과 Android Studio/SDK/NDK를 준비한 뒤 실행합니다.

```powershell
npm install
npm run android:init
npm run android:dev
npm run android:build
```

또는 `BUILD_ANDROID.bat`을 실행합니다. 최초 한 번만 Android 프로젝트를 초기화합니다. GitHub에서는 `Build Android APK` 워크플로가 범용 APK를 Actions 아티팩트로 보관합니다.

## GitHub 자동 빌드

`main` 브랜치에 코드가 올라오면 다음 워크플로가 함께 실행됩니다.

- `Build Windows`: MSI/NSIS Windows 설치 파일 생성
- `Build Android APK`: Android 7.0 이상을 대상으로 하는 범용 APK 생성

GitHub 저장소의 **Actions** 탭에서 실행 결과를 열고 **Artifacts**에서 파일을 받을 수 있습니다. 두 워크플로 모두 필요할 때 `Run workflow`로 수동 재실행할 수 있습니다.

## 저장과 종료 중 진행

- Tauri 앱: 운영체제 앱 데이터 폴더의 일반 진행 `save.json`과 엔딩 징표 `meta.json`
- 브라우저 미리보기: localStorage
- 숲·광산·던전·연못은 종료 직전 오토가 ON일 때만 다음 실행에서 경과 시간을 정산합니다.
- 체력 0이 되면 오토가 자동 해제되고 이후 시간은 진행하지 않습니다.
- 집에서 휴식을 시작한 상태라면 앱을 종료해도 10초 회복 틱을 정산합니다.
- 앱 버전과 세이브 버전이 다르면 세이브를 초기화합니다.
- 엔딩 크레딧이 완료되면 `save.json`은 삭제되지만 `meta.json`의 이스터에그 해금 기록은 유지됩니다.

## 게임 메뉴

- 지도: 집, 숲, 광산, 연못, 던전 이동
- 제작소: 도끼, 곡괭이, 낚싯대, 검, 갑옷 제작
- 부동산: 집 구입 및 휴식처 선택
- 요리: 낚시 재료로 체력 회복
- 강화: 도끼, 곡괭이, 낚싯대, 검, 갑옷 +10 강화
- 마이페이지: 보유 장비와 재화 확인 및 장착
- 오토: 작업 자동 진행
- 설정: BGM/효과음 음량, 종료, 초기화(자동 저장)

## 주요 파일

```text
index.html                  화면 구조
styles.css                  세로형 UI와 애니메이션
game.js                     게임 상태·밸런스·방치 시뮬레이션
assets/                     원본 및 전처리된 이미지·오디오
dist/                       Tauri가 패키징하는 런타임 전용 파일
src-tauri/                  Tauri 2 네이티브 코드와 설정
tools/prepare_assets.py     생성 이미지 시트 분리·정규화
tools/generate_sfx.py       48kHz 스테레오 효과음 재생성
tools/prepare_dist.js       런타임 dist 생성
tools/test_game.js          핵심 게임 로직 스모크 테스트
GAME_DESIGN_MASTER_v0.9.md  최신 확정 기획
HANDOFF_v0.9.md             구현·에셋·검증 인수인계
```

## 검증

```bash
node --check game.js
node tools/test_game.js
node tools/prepare_dist.js
python tools/validate_project.py
```

BGM은 사용자가 제공한 8곡을 연결했습니다. 효과음은 34개이며 `assets/audio/sfx/`에 OGG로 저장되어 있습니다.
