# Android 업데이트 서명 기준

- Android 앱 ID: `com.isekailumberjack.stable`
- 릴리스 키 별칭: `isekai_lumberjack_release`
- 인증서 SHA-256: `f477923fc8ac5d9180c24ae8541680d9910894ac7463e4126fd7cb1d18c33a7d`
- 최초 안정 서명 버전: `1.1.4`
- 인증서 유효 기간: 2026-09-06 ~ 2126-08-13

`v1.1.4`부터 Android APK는 GitHub Actions Secrets에 보관한 동일한 JKS 키로 서명합니다. 워크플로는 완성 APK의 인증서 지문이 위 값과 정확히 일치하지 않으면 실패합니다.

앞으로 Android 앱 ID와 이 인증서를 모두 유지해야 기존 설치본 위에 업데이트할 수 있습니다. `v1.1.3`까지의 APK는 실행마다 만들어진 임시 키로 서명되어 있으므로, `v1.1.4` 안정 서명판을 처음 설치할 때만 기존 앱 삭제 후 재설치가 필요할 수 있습니다. 이후 버전은 같은 키를 사용해 덮어쓰기 업데이트합니다.

비밀번호와 JKS 원본은 저장소에 커밋하지 않습니다. 복구용 원본은 별도로 보관하고, 자동 빌드는 다음 저장소 Secret을 사용합니다.

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
