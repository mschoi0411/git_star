# Week 01 · Rank 08 · mksglu/context-mode 실습 보고서

- 확인일: 2026-10-23
- 원본 URL: https://github.com/mksglu/context-mode
- 기본 브랜치: `main`
- 분석한 commit SHA: `90af14e34bf35120c3310f7a75f54fa99d2cabba`
- 확인한 버전·릴리스: `1.0.169` / `v1.0.169`
- 라이선스: Elastic License 2.0 (ELv2)
- 실행 결과: 제한 실행 성공

## 공식 목적

`context-mode`는 MCP와 에이전트 훅을 이용해 큰 도구 출력을 모델의 대화 컨텍스트에 그대로 넣지 않고, 격리 실행·FTS5 색인·검색으로 필요한 결과만 돌려주는 컨텍스트 관리 도구다. 세션 이벤트를 로컬 SQLite에 기록해 압축이나 재시작 뒤 필요한 상태를 검색하는 기능도 제공한다.

README의 최대 98% 절감 수치는 프로젝트가 제시한 벤치마크 주장이다. 이번 보고서의 결과는 별도로 만든 입력과 평가 기준으로 직접 측정한 값만 사용한다.

## 환경

- 운영체제: Windows
- Bun: `1.3.14`
- 시스템 Node.js: `22.11.0`
- 프로젝트 요구 Node.js: `>=22.5.0`
- 패키지 설치: 수행하지 않음
- API 키·외부 계정·유료 서비스: 사용하지 않음
- 실험 중 외부 네트워크: 사용하지 않음

시스템 Node.js가 선언된 최소 버전보다 낮지만 Bun 실행 경로를 사용할 수 있었다. 일반 설치나 MCP·플러그인 등록은 하지 않고, 고정 commit의 TypeScript `PolyglotExecutor`만 Bun으로 불러왔다.

## Clone 전 보안 검토

다음 원격 원문과 고정 commit의 파일 트리를 확인했다.

- `README.md`, `LICENSE`, `BENCHMARK.md`
- `package.json`, `bun.lock`
- `scripts/postinstall.mjs`
- `scripts/heal-better-sqlite3.mjs`
- `scripts/heal-installed-plugins.mjs`
- `start.mjs`
- `src/server.ts`, `src/executor.ts`, `src/runtime.ts`, `src/security.ts`
- `.github/workflows/`
- 플러그인·훅·플랫폼 설정 파일 목록

| 항목 | 판정 | 근거 |
|---|---|---|
| 설치·postinstall 스크립트 | 있음 | `package.json`이 `scripts/postinstall.mjs`를 자동 실행 |
| 외부 다운로드·원격 코드 실행 | 있음 | 네이티브 SQLite 복구 시 npm 설치 가능, 서버 시작 시 npm 최신 버전 조회 |
| 파일 시스템 쓰기·삭제 | 있음 | 홈 설정·플러그인 캐시·훅·SQLite·통계 파일을 생성·수정·정리할 수 있음 |
| 환경 변수·비밀정보 접근 | 있음 | 여러 에이전트 설정 경로와 환경 변수를 읽음. 이번 실험에는 비밀정보를 제공하지 않음 |
| 관리자 권한·백그라운드 프로세스 | 확인 필요 | 관리자 권한은 필수가 아니지만 자식 프로세스와 백그라운드 npm 설치 경로가 존재 |
| 바이너리·난독화·대형 파일 | 있음 | `better-sqlite3` 네이티브 바인딩과 큰 minified bundle 포함 |
| Git LFS·submodule | 없음 | `.gitmodules` 없음, LFS smudge를 끈 clone에서 필요한 소스 확인 |
| 네트워크·외부 서비스·비용 | 있음 | npm registry, URL fetch, Insight 대시보드 기능이 있으나 이번 실행에서는 사용하지 않음 |

### 개별 판정

- clone: **허용**. LFS 자동 다운로드를 차단하고 고정 commit을 얕게 복제했다.
- 설치: **보류**. 일반 설치는 lifecycle script와 홈 설정 변경을 수반한다. 별도 HOME에서 `--ignore-scripts`를 사용하는 조건부 설치는 가능하지만 이번 실험에는 필요하지 않아 수행하지 않았다.
- 실행: **제한 허용**. MCP 서버, CLI, 훅, 플러그인과 제공 스크립트는 실행하지 않고 `src/executor.ts`의 `PolyglotExecutor.executeFile`만 Bun으로 호출했다.

악성코드가 없다고 보증하지 않는다. 위 판정은 commit `90af14e…`에서 확인한 파일과 이번 제한 실행 범위에만 적용된다.

## 실험 설계

가설은 “큰 구조화 입력을 원문 그대로 컨텍스트에 넣는 대신 sandbox에서 집계하면, 필요한 사실을 보존하면서 반환 바이트를 줄일 수 있다”이다.

- Baseline: 직접 생성한 1,000개 JSON 이벤트 원문 전체를 반환한다고 가정
- Treatment: 같은 JSON을 실제 `PolyglotExecutor.executeFile`로 처리하고 집계 JSON만 반환
- 고정 입력: 상태 코드, 지연 시간, 25개 경로를 결정적으로 생성한 1,000개 이벤트
- 품질 기준: 레코드 수, 오류 수, 상태별 수, 평균 지연, 고유 경로 수가 모두 기준값과 정확히 일치
- 측정 지표: UTF-8 바이트, 바이트 기준 절감률, 실행 시간, 사실 보존 검사

## 실행 방법

원본은 게시 대상에서 제외되는 `_sources/context-mode`에 복제하고 고정 commit을 확인했다.

```powershell
$env:GIT_LFS_SKIP_SMUDGE='1'
git clone --depth 1 --filter=blob:none --no-tags `
  https://github.com/mksglu/context-mode.git _sources/context-mode
git -C _sources/context-mode checkout --detach `
  90af14e34bf35120c3310f7a75f54fa99d2cabba
```

의존성을 설치하지 않고 직접 작성한 벤치마크를 실행했다.

```powershell
cd weeks/week-01/repos/08-mksglu--context-mode/project
bun run benchmark.ts
```

## 직접 측정한 결과

| 지표 | Baseline | Treatment | 변화 |
|---|---:|---:|---:|
| 컨텍스트로 반환될 UTF-8 바이트 | 194,381 | 119 | 99.94% 감소 |
| 바이트÷4 단순 토큰 추정 | 48,596 | 30 | 48,566 감소 |
| 사전 정의 사실 보존 | 5/5 | 5/5 | 동일 |
| 실행 시간 | 해당 없음 | 801.43ms | 비교 대상 아님 |

토큰 값은 실제 tokenizer 측정이 아니라 크기 비교를 위한 `ceil(bytes / 4)` 추정치다. 99.94%는 이 입력과 집계 방식의 반환 바이트 감소율이며, 모든 작업이나 전체 에이전트 세션에 일반화할 수 없다.

Treatment는 다음 값을 기준과 정확히 동일하게 반환했다.

- 레코드 1,000개
- 오류 100개
- 상태 코드: 200=900, 404=50, 500=50
- 평균 지연: 496.62ms
- 고유 경로: 25개

## 직접 만든 산출물

- [재현 벤치마크](project/benchmark.ts)
- [측정 결과 JSON](artifacts/benchmark-result.json)

벤치마크와 입력 생성 로직은 직접 작성했다. 제3자 fixture, bundle, 소스 사본은 결과 폴더에 포함하지 않았다.

## 한계와 평가

- 전체 MCP 등록, 훅 라우팅, FTS5 검색, 세션 복구와 Insight 기능은 실행하지 않았다.
- 원문 전체와 작은 집계의 비교이므로 처리 목적에 맞는 질문을 미리 정의해야 한다. 세부 원문이 필요한 작업에는 검색·색인 방식의 별도 평가가 필요하다.
- ELv2는 사용과 파생 작업을 허용하지만 실질 기능을 제3자에게 hosted/managed service로 제공하는 행위를 제한한다.
- 자동 설치와 서버 시작의 쓰기 범위가 넓어 실제 도입 전에는 별도 사용자 HOME, 컨테이너 또는 VM이 적합하다.

이번 최소 실험에서는 실제 실행기의 sandbox 처리 경로가 큰 원문을 작은 집계로 바꾸면서 목표 사실을 보존하는 것을 확인했다. 정해진 집계·분석 작업에는 효과가 명확했지만, 전체 제품의 98% 절감 주장이나 장기 세션 품질은 검증하지 않았다.

## 정리 결과

원본 clone은 검증 후 삭제한다. 의존성, 전역 패키지, 플러그인, 훅, 사용자 설정과 외부 서비스 데이터는 생성하지 않았다. 저장소 폴더에는 직접 작성한 벤치마크, 측정 결과 JSON과 이 보고서만 남긴다.
