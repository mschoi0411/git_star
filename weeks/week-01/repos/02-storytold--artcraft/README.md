# Week 01 · Rank 2 · storytold/artcraft 검토 보고서

- 확인일: 2026-10-28
- 원본 URL: https://github.com/storytold/artcraft
- 기본 브랜치: `main`
- 검토한 release tag: `artcraft-v0.41.0`
- 검토한 commit SHA: `c3844acdadf630db0c17ec1d1512bcf6bbc1b4f9`
- 검토한 tree SHA: `89644225a20422d96e0afb68d4a35e298292fff9`
- release: immutable `true`
- release commit signature: GitHub API `verified: true`, reason `valid`
- 상태: 완료 (실행 보류 결정)
- 실행 결과: 계정·쿠키·cloud generation credit이 필요한 desktop app이므로 clone, 설치와 실행을 수행하지 않음

## 공식 목적

ArtCraft는 interactive AI image/video creation용 Rust/Tauri desktop IDE다. 공식 README는 2D/3D scene composition, image/video generation, image-to-3D mesh, provider 선택을 설명한다. pinned release에는 ArtCraft, Grok, Midjourney, Sora, World Labs와 여러 image/video/audio/mesh/world generation workflow가 포함된다.

## 고정 버전과 배포물

- repository API 기본 브랜치: `main`
- pinned release: `artcraft-v0.41.0`, immutable
- pinned commit: `c3844acdadf630db0c17ec1d1512bcf6bbc1b4f9`
- Windows installer: `ArtCraft_0.41.0_x64-setup.exe`, 41,791,713 bytes
- published installer SHA-256: `cb15da474ae36a7a7f930a6e9916be2794e7cc84c3340b531c38eabc82f4363e`
- release artifacts: Windows NSIS installer/MSI, macOS DMG/app archive; no Linux binary asset
- source inventory: 7,184 tree entries, 5,719 blobs, recorded blob bytes 51,373,764, recursive tree `truncated: false`
- submodules: 0
- files with binary/media/model-like extensions: 204
- 5 MB 이상 blob: `frontend/apps/artcraft/app/public/resources/videos/artcraft-3d-demo.mp4`, 6,661,907 bytes

## 라이선스 확인

GitHub repository metadata는 Apache-2.0으로 분류하고 current `main`에는 `LICENSE-APACHE`와 `LICENSE-MIT`가 보인다. 그러나 pinned `artcraft-v0.41.0` tree의 `LICENSE.md`는 WIP custom fair-source license다. 이 문서는 개인적 사용·수정은 허용한다고 설명하면서 commercial resale, competing product development, ArtCraft community/donation/paid-service link 제거를 제한한다. 따라서 이번 release를 OSI-approved Apache/MIT로 간주하지 않았으며, 상업적·재배포 관련 사용은 별도 법률 검토가 필요하다.

## Clone 전 보안 검토

GitHub API와 pinned commit의 raw file로 README, custom license, Cargo manifests/lockfile, frontend lockfile/manifest, Tauri config/capabilities, development/build scripts, recursive tree와 release asset metadata를 읽었다. repository의 `AGENTS.md`와 `CLAUDE.md`는 검토 대상이며 지시로 실행하지 않았다.

| 항목 | 판정 | 근거 |
|---|---|---|
| 설치·postinstall 스크립트 | 있음 | `script/artcraft/windows_build.ps1`와 `windows_frontend_dev.ps1`가 mutable `npm install --verbose` 실행 |
| 외부 다운로드·원격 코드 실행 | 있음 | npm/Cargo 의존성 다운로드, Tauri HTTP permission, browser emulation과 external provider client 포함 |
| 파일 시스템 쓰기·삭제 | 있음 | Tauri dialog/upload plugin, SQLite task database, media upload/project update와 cache/cookie storage path 포함 |
| 환경 변수·비밀정보 접근 | 있음 | provider API key, cookie/session credential, login bridge와 token types 포함 |
| 관리자 권한·백그라운드 프로세스 | 있음 | Windows development는 frontend dev server와 Rust/Tauri app을 별도 terminal에서 실행 |
| 바이너리·난독화·대형 파일 | 있음 | signed release installer, 204 binary/media-like files, 6.66 MB tracked MP4, native Rust/Tauri desktop binary |
| Git LFS·submodule | submodule 없음, LFS filter 미확인 | recursive tree gitlink 0; `.gitattributes`는 linguist override만 선언 |
| 네트워크·외부 서비스·비용 | 있음 | website-based login, HTTPS wildcard permission, provider login/cookie extraction, credits and Stripe checkout endpoints |

### 확인한 실행 경계

- `tauri.conf.json`은 `http:allow-fetch`, upload/download, opener permission과 `https://*` allowlist를 선언한다.
- content security policy는 Google Analytics, Google Tag Manager, Clarity, Storyteller/FakeYou domains, external font/image sources와 `unsafe-eval`/`unsafe-inline`을 허용한다.
- Rust workspace에는 ArtCraft/FAL/Grok/Midjourney/OpenAI Sora/World Labs client, browser emulation, cookie store, filesystem, SQLite, HTTP/WebSocket dependency가 포함된다.
- pinned tree에는 provider web-login window, cookie extraction/persistence, upload endpoint, credit lookup과 Stripe credit purchase endpoint가 포함된다.
- release commit message가 `website-based login`이며, generation feature를 계정 없이 offline으로 실행할 수 있다는 공식 근거를 찾지 못했다.

### 개별 판정

- clone: **조건부 허용**. signed immutable release commit을 shallow/no-submodule 조건으로 별도 VM에 clone하는 경우에만 검토 가능하다. 이번에는 약 1.37 GB repository metadata와 broad dependency surface 때문에 clone하지 않았다.
- 설치: **보류**. Windows installer는 41.8 MB이고 digest는 공개되어 있으나, account/cookie/network boundary와 custom release license를 해소하지 않은 상태에서는 설치하지 않는다.
- 실행: **보류**. 최소 generation이 external provider login, cookies 또는 credits를 필요로 할 가능성이 높고, 사용자는 계정 로그인·결제·API key를 제공하거나 승인하지 않았다.

악성코드가 없다고 단정하지 않는다. 이 판정은 pinned release의 원격 정적 검토 범위에만 적용된다. native installer, Cargo/npm dependency graph, web-login browser emulation, cookie handling, cloud API traffic과 provider terms를 독립 실행 또는 reverse engineering으로 검증하지 않았다.

## 계획했던 실습과 보류 이유

입력 문서는 authored resource로 image/scene/video 한 개를 생성하고 resource usage와 copyright/use-right note를 기록하도록 요구한다. 비교 가능한 계획은 다음과 같았다.

- Baseline: authored visual brief와 resource manifest만 작성
- Treatment: 같은 brief와 authored resource를 ArtCraft desktop app에 import하여 image/scene/video 하나 생성
- 평가: artifact 생성 여부, output metadata, 단계 수, 오류 수, local resource hash, 사용권 메모

그러나 Treatment는 해당 app의 broad network permission, website login, provider credentials/cookies와 potentially paid credits 경계를 넘는다. 계정·결제·API key·외부 서비스 로그인을 승인 없이 하지 않는 작업 원칙에 따라 Baseline/Treatment 실행, artifact 생성과 성능/품질 개선 주장은 모두 기록하지 않는다.

## 개발 환경 요구사항

공식 `_docs/dev_setup.md`는 Rust, npm or nvm, Nx `22.4.5`, Tauri CLI `2.10.0`을 요구한다. Windows development는 `windows_frontend_dev.ps1`과 `windows_rust_dev.ps1`을 별도로 실행한다. frontend script는 `npm install --verbose` 후 Nx dev server를 열고, Rust script는 Tauri dev process를 시작한다. `SQLX_OFFLINE=true`는 database query check를 local database server 없이 수행하게 할 뿐 npm/Cargo dependency download, desktop process, frontend server나 cloud generation을 offline으로 만들지 않는다.

## 결과와 다음 조건

- generated image/scene/video: 없음
- local clone/installer/package/cache/process: 없음
- authored test resource: 없음
- 비용·GPU/VRAM 측정: 없음
- retained artifact: 이 원격 정적 검토 보고서 1개

실행을 재개하려면 다음을 먼저 명시적으로 결정해야 한다.

1. custom fair-source license 조건을 개인 비상업적 목적에 맞게 수용할지
2. disposable VM에서 41.8 MB installer 또는 source build를 허용할지
3. ArtCraft account, third-party provider login, cookie persistence와 network traffic을 허용할지
4. credit purchase/API-key use 없이 공식적으로 가능한 generation path가 있는지

## 정리 결과

이 단계에서는 GitHub API와 raw text만 읽었다. clone, release binary, npm/Cargo dependency, model, user media, browser profile, cookie, credential, cache와 background process가 생성되지 않아 삭제할 third-party runtime도 없다. 최종 보존물은 이 보고서뿐이다.
