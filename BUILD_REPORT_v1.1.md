# 이세계로 소환되어버린 나무꾼 v1.1 빌드 보고서

## 소스 검증

- JavaScript 구문 검사: 통과
- 게임 로직 스모크 테스트: 통과
- 런타임 `dist` 생성: 통과
- 이미지·오디오·UI·패키징 입력 검사: 633개 통과
- Android 몰입 화면 패치 fixture 검사: 통과
- GitHub Actions YAML 파싱: 통과
- 원격 모바일형 화면 검수: 던전 마커 여백, 음식 수치, `EXP 1k` 표시 통과

## 배포 빌드

- 기준 소스 커밋: `c856d85316937de1d52172f17e38cb0bf9c42246`
- Windows 빌드 실행: `33794036487` — 성공
- Android 빌드 실행: `33794036611` — 성공

| 배포 파일 | 크기 | SHA-256 | 검증 |
|---|---:|---|---|
| `isekai-lumberjack-v1.1-windows-x64-setup.exe` | 83,499,720 bytes | `bedfbd497154d0bb4968d75818a29f0fd4162b60d6d2195a9f9b4dc25859433b` | Windows NSIS 빌드 성공 |
| `isekai-lumberjack-v1.1-android-arm64.apk` | 94,041,494 bytes | `aaa24d11c26c544c4661e150b34b8169d76101dec85bfbd80a45c9df6dcbefbf` | APK 무결성·테스트 서명 검증 성공 |

Android 파일은 ARM64 기기용 설치·QA APK이며 테스트 키로 서명했습니다. 스토어 제출본은 배포자 키로 다시 서명해야 합니다.

## 실기기 확인 필요

1. Android 상태·내비게이션 바 숨김과 스와이프 임시 표시
2. Android 런처 이름 `이세계나무꾼` 및 공용 도끼 아이콘
3. 수동 탭 낚시 시작
4. 강제 종료·백그라운드 뒤 1초 휴식 및 음식 자동 섭취 포함 방치 정산
5. Windows 릴리스 실행 시 콘솔 창 미표시
