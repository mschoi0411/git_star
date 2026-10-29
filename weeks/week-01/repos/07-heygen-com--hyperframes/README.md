# Week 01 · Rank 07 · heygen-com/hyperframes 실습 보고서

- 확인일: 2026-10-21
- 원본 URL: https://github.com/heygen-com/hyperframes
- 기본 브랜치: `main`
- 분석한 commit SHA: `087451837b16cb9ae74f7932a4a18af86e3a012d`
- commit 일시: 2026-10-21 11:38:21 UTC
- 실습한 CLI 버전: `0.8.183`
- 라이선스: Apache License 2.0
- 실행 결과: 성공

## 공식 목적

`HyperFrames`는 HTML과 CSS로 화면을 만들고 seek 가능한 GSAP 타임라인을 연결해 동영상으로 렌더링하는 오픈소스 프레임워크다. CLI는 정적 검사, Chrome 기반 런타임 검사, 프레임 캡처와 FFmpeg 인코딩을 제공한다.

이번 실습에서는 플러그인이나 에이전트 스킬을 사용자 설정 경로에 설치하지 않았다. 고정 commit에 포함된 `/hyperframes`, `/motion-graphics`, `/hyperframes-core` 지침과 CLI 소스를 직접 검토한 뒤, 별도의 독창적인 8초 소개 영상을 만들었다.

## 환경

- 운영체제: Windows
- HyperFrames: `0.8.183`
- 격리 Node.js: `22.12.0`
- Chrome: 시스템에 설치된 Chrome
- FFmpeg: `@ffmpeg-installer/win32-x64`의 임시 바이너리
- FFprobe: `@ffprobe-installer/win32-x64`의 임시 바이너리
- 출력: H.264 MP4, yuv420p, 1280 × 720, 30fps, 8초
- API 키: 사용하지 않음

시스템 Node.js `22.11.0`은 최신 전이 의존성이 요구하는 `22.12.0`보다 낮았다. 시스템 설치를 변경하지 않고 `_tooling/` 아래에 Node.js와 렌더 도구를 임시 설치했으며, 검증 후 폴더 전체를 삭제했다.

## 검토한 파일

- `README.md`
- `LICENSE`
- `package.json`
- `docs/quickstart.mdx`
- `packages/cli/package.json`
- `packages/cli/README.md`
- `packages/cli/src/browser/ffmpeg.ts`
- `packages/cli/src/browser/manager.ts`
- `packages/cli/src/commands/render.ts`
- `skills/hyperframes/SKILL.md`
- `skills/motion-graphics/SKILL.md`
- `skills/hyperframes-core/SKILL.md`

## 위험 검토

- `skills update`와 플러그인 설치는 에이전트 설정 경로를 변경할 수 있어 실행하지 않았다.
- 로컬 렌더는 Chrome, FFmpeg와 FFprobe 실행 권한이 필요하다.
- Chrome Headless Shell 자동 설치는 사용자 홈 캐시에 큰 파일을 내려받을 수 있다. 기존 시스템 Chrome을 명시해 자동 다운로드를 피했다.
- CLI는 익명 사용 데이터 수집 안내를 표시한다. 파일 경로와 composition 내용은 수집하지 않는다고 명시하지만, 네트워크가 완전히 차단된 실습은 아니다.
- GSAP 스크립트는 버전을 `3.14.2`로 고정했지만, 첫 컴파일 시 jsDelivr에서 받아 결과물에 인라인한다.
- CLI는 글꼴 별칭을 결정적인 웹폰트로 바꾸기 위해 Google Fonts 데이터를 캐시했다. 이 캐시는 실습 후 삭제했다.
- 원본 저장소는 LFS 다운로드를 막은 얕은 clone도 약 394MB였다. 게시 대상에 포함하지 않고 검증 후 삭제했다.
- 사용 가능 메모리가 약 0.6GB로 낮아 CLI가 저메모리 screenshot capture를 자동 선택했다.

## 실습 설계

주제는 “HTML에서 MP4까지”다. 8초 동안 세 가지 메시지를 순서대로 보여준다.

1. HTML로 화면과 시간을 선언한다.
2. paused GSAP 타임라인을 프레임 단위로 seek한다.
3. 로컬 환경에서 MP4로 렌더링한다.

외부 이미지, 음원, 영상과 API를 사용하지 않았다. 색상은 어두운 작업 화면 위에 lime, cyan, orange를 기능별로 제한해 사용했고, 모든 움직임은 하나의 paused GSAP 타임라인에 등록했다.

## 실제 명령

원본은 LFS 객체와 전체 이력을 제외하고 임시 복제했다.

```powershell
$env:GIT_LFS_SKIP_SMUDGE='1'
git clone --depth 1 --filter=blob:none --no-tags `
  https://github.com/heygen-com/hyperframes.git _sources/hyperframes
git -C _sources/hyperframes rev-parse HEAD
```

임시 도구는 `_tooling/`에만 설치했다.

```powershell
npm install --prefix _tooling --no-save --no-audit --no-fund `
  node@22.12.0 hyperframes@0.8.183 `
  @ffmpeg-installer/ffmpeg@1.1.0 `
  @ffprobe-installer/ffprobe@2.1.2
```

FFmpeg, FFprobe와 Chrome 경로를 환경 변수로 지정한 뒤 다음 검증을 실행했다.

```powershell
hyperframes lint . --json
hyperframes check . --json
hyperframes snapshot . --at 1.4,4.0,7.5 --no-end
hyperframes render . --workers 1 --quality high `
  --skill motion-graphics `
  --output renders/hyperframes-repo-intro.mp4
```

실제 명령에서는 전역 `hyperframes` 대신 `_tooling/`의 고정 CLI와 Node.js 실행 파일을 사용했다.

## 직접 만든 산출물

- [재현 설정](project/hyperframes.json)
- [HyperFrames composition](project/index.html)
- [렌더링한 MP4](project/renders/hyperframes-repo-intro.mp4)
- [검증 contact sheet](artifacts/contact-sheet.jpg)

HTML, CSS와 GSAP 타임라인은 직접 작성했다. 원본 예제와 템플릿을 복사하지 않았으며, 원본 저장소의 composition 구조, 결정적 렌더링 규칙과 검사 절차만 학습 기준으로 사용했다.

## 검증 결과

- 고정 commit SHA 확인: 성공
- `hyperframes lint`: 오류 0, 경고 0
- `hyperframes check`: 성공
- 런타임 오류·경고: 0
- 레이아웃 오류·경고: 0
- 대비 검사: 75/75 통과
- 1.4초, 4.0초, 7.5초 source snapshot 육안 확인: 성공
- 렌더된 MP4의 같은 시점 프레임 육안 확인: 성공
- FFprobe: H.264, yuv420p, 1280 × 720, 30fps, 8.000초
- 파일 크기: 810,362 bytes
- SHA-256: `32FC96359339B5DFF91A24E687330C3998E2D9D5A70FCFCC4CC6F42CB7C450B6`
- 렌더 방식: screenshot capture, hardware GPU, 1 worker

HTML용 LSP로 설정된 Biome 실행 파일이 로컬에 없어 LSP 진단은 수행하지 못했다. 대신 HyperFrames 자체 정적 검사와 실제 Chrome 런타임 검사, snapshot, MP4 렌더와 FFprobe 검증을 모두 수행했다.

## 배운 점

- 웹 기술로 만든 모션도 paused timeline과 고정된 시간 입력이 있으면 프레임 단위로 재현할 수 있다.
- `lint`는 구조와 부드럽지 않은 속성 tween을 잡고, `check`는 실제 브라우저의 레이아웃과 대비 문제를 추가로 찾는다.
- 시스템 도구를 바꾸지 않고도 실행 파일 경로 환경 변수를 이용해 실습을 격리할 수 있다.
- 고품질 영상 렌더는 짧은 composition도 브라우저와 인코더 자원을 사용하므로 worker 수와 메모리 상태를 먼저 확인해야 한다.
- source snapshot뿐 아니라 최종 MP4에서 프레임을 다시 추출해야 인코딩 이후 결과까지 검증할 수 있다.

## 정리 결과

원본 clone, 임시 Node.js·CLI·FFmpeg 도구, HyperFrames 내부 검사 상태, 글꼴 캐시와 중복 프레임 이미지를 삭제했다. 작업공간에는 재현 설정, 직접 작성한 composition, 최종 MP4, 한 장의 contact sheet와 이 보고서만 남겼다.
