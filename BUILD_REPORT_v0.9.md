# 이세계로 소환되어버린 나무꾼 v0.9 빌드 보고서

## 확정 빌드

- 빌드 소스 커밋: `4f2b8a178cc75c7e422e0c88f2ff52fa146939d0`
- Windows Actions 실행: `33738403961` — 성공
- Android Actions 실행: `33738403733` — 성공
- 빌드 일시: 2026-09-03 UTC

| 대상 | 최종 파일 | 크기 | SHA-256 |
|---|---|---:|---|
| Windows x64 | `isekai-lumberjack-v0.9-windows-x64-setup.exe` | 83,510,187 bytes | `ec61b8b9c720ea6746a225858a5a839e226619661be3706740b503ec78727c9a` |
| Android ARM64 | `isekai-lumberjack-v0.9-android-arm64.apk` | 94,041,494 bytes | `0d2d36caf35a984a02adbf61c074e9e65c5f4a79fab512ad20909ee2cfc88a2c` |

Windows 결과는 NSIS 자체 압축 해제 설치 프로그램이며 ZIP 무결성과 PE 실행 파일 형식을 확인했습니다. Android 결과는 릴리스 최적화 ARM64 APK이며, 빌드 워크플로에서 `zipalign` 후 테스트 키로 서명하고 `apksigner verify --verbose --print-certs`를 통과했습니다. APK ZIP 구조 검사도 오류 없이 통과했고 네이티브 라이브러리가 `arm64-v8a`에만 포함됨을 확인했습니다.

Android 테스트 키는 Actions 실행마다 새로 생성됩니다. 이전 테스트 APK와 서명이 다르면 덮어쓰기가 거부될 수 있으므로 기존 테스트 앱을 제거한 뒤 설치합니다. 실제 스토어 배포 전에는 소유자가 보관하는 고정 릴리스 키로 교체해야 합니다.

## 소스·UI 검증

- `node --check game.js`: 통과
- `node tools/test_game.js`: 통과
- `node tools/prepare_dist.js`: 통과
- `python3 tools/validate_project.py`: 613개 검사 통과
- GitHub Actions의 Windows·Android 게임 로직 테스트: 모두 통과
- 360×640, 390×700, 430×932, 560×900 모바일 레이아웃 정적 검사: 통과
- 실제 브라우저 560px HUD 측정: 좌측 상태·장비 224px, 우측 로그 336px
- 장비 슬롯: 최대 72px 2열 배치, 다섯 번째 슬롯 가운데 정렬
- 로그·오버레이·메뉴 내부: 터치 스크롤 유지, 시각적 스크롤바 숨김

## 남은 실기기 QA

설치 파일 생성과 구조 검사는 완료됐습니다. 실제 Windows PC와 Android 기기에서는 설치 후 오디오 자동 재생, 시스템 뒤로가기, 강제 종료 후 방치 정산, 백그라운드 복귀, 기기별 안전 영역을 최종 확인합니다.
