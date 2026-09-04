# 이세계로 소환되어버린 나무꾼 v1.1.2 재배포 보고서

## 변경 사항

- Android 전용 앱 식별자를 `com.isekailumberjack.release`로 변경하여 기존 `com.isekailumberjack.game` 설치본과 완전히 분리했습니다.
- 모바일 런처 도끼를 원본 대비 74%로 축소하고 왼쪽으로 이동해 도끼날 쪽 안전 여백을 더 확보했습니다.
- Windows는 기존 앱 식별자와 원본 아이콘을 그대로 유지합니다.
- Android와 Windows 자동 빌드를 한 Actions 워크플로의 병렬 작업으로 통합했습니다.
- 앱 버전은 `1.1.2`, 세이브 형식은 `1.1.0`입니다.

## 설치 동작

- v1.1.2 Android APK는 기존 앱을 삭제하지 않고 별도로 설치할 수 있습니다.
- 기존 앱과 표시 이름이 같으므로 두 앱을 함께 두면 런처에 `이세계나무꾼`이 두 개 표시될 수 있습니다.
- Android가 별도 앱 저장 공간을 부여하므로 이전 앱의 세이브는 새 앱으로 자동 이전되지 않습니다.

## 빌드·검증 결과

- 프로젝트 로직·자산·설정 검사: 652개 통과
- Android 런처 아이콘: 일반·전경 리소스 10개 생성 및 APK 포함 검사 통과
- Android 앱: ARM64 네이티브 라이브러리, 버전 `1.1.2`, 새 앱 ID, 짧은 이름 확인
- Android API 29 에뮬레이터: 설치 성공, MainActivity 콜드 스타트 성공, 충돌 로그 없음
- Android 앱 시작 시간: 408ms
- 실제 첫 화면: 1080×1920, 경계 비율 0.2357, 양자화 색상 783개로 빈 화면 아님
- APK ZIP 무결성 검사: 오류 없음
- Windows: 콘솔 없는 GUI 형식의 NSIS 설치 프로그램 생성 및 ZIP 무결성 검사 통과

## 빌드 이력

- 기준 커밋: `046b79337e866e6e94ea4fc07fa284fe889f4e7d`
- 통합 Actions 실행: `33840289062`
- Android 작업: 성공
- Windows 작업: 성공

## 최종 파일

| 파일 | 크기 | SHA-256 |
|---|---:|---|
| `isekai-lumberjack-v1.1.2-android-arm64.apk` | 94,078,414 bytes | `9d33266e71f46955c6fa51a6bbfe8537f40a81fd126028bb311f1a391056b620` |
| `isekai-lumberjack-v1.1.2-windows-x64-setup.exe` | 83,503,687 bytes | `c4bf146e0650f167dd060eecee7c1a73d6f206c8db94b9cf88c2d23f4c9e1114` |
| `android-launch.png` | 2,398,997 bytes | `df4e3f18eadf412f04ce6720f6100d8bd71002ec111618fb7913c7e097a33170` |
| `android-launcher-preview.png` | 243,674 bytes | `17860e6f62fac37198ffa1a395fd76a673532fa1013c6b11902ce082a172609c` |
