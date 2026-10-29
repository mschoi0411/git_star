# Week 01 · Rank 10 · anthropics/claude-plugins-official 실습 보고서

- 확인일: 2026-10-23
- 원본 URL: https://github.com/anthropics/claude-plugins-official
- 기본 브랜치: `main`
- 분석한 commit SHA: `465f09344424225c25d438f2e052732c3d688d2f`
- 분석한 tree SHA: `2efc700b1430a77076a43b3b50584b5018792701`
- 선택한 내부 플러그인: `code-simplifier` `1.0.0`
- 라이선스: Apache License 2.0
- 실행 결과: 설치 없이 지침 적용 실험 성공

## 공식 목적

`claude-plugins-official`은 Claude Code 플러그인의 공식 디렉터리다. 저장소는 Anthropic이 관리하는 `/plugins`와 파트너·커뮤니티가 제공하는 `/external_plugins`를 함께 제공하며, marketplace manifest는 외부 저장소의 특정 경로와 commit SHA를 참조할 수 있다. 공식 README도 설치 전 각 플러그인을 신뢰할 수 있는지 확인해야 하며, Anthropic이 포함된 MCP 서버·파일·소프트웨어의 동작이나 향후 변경을 보증하지 않는다고 경고한다.

이번 실습은 전체 marketplace를 설치하지 않았다. 내부 플러그인 중 실행 표면이 가장 작은 `plugins/code-simplifier`만 선택했다. 고정 commit의 해당 디렉터리는 metadata, Apache-2.0 라이선스와 Markdown agent 정의 하나로 구성되며 hook, MCP 설정, script, package manifest와 binary가 없다.

## 환경

- 운영체제: Windows
- Git: `2.21.0.windows.1`
- Node.js: `v22.11.0`
- 패키지 설치: 수행하지 않음
- Claude Code plugin 설치·등록: 수행하지 않음
- API 키·외부 계정·유료 서비스: 사용하지 않음
- 실험 중 외부 네트워크: benchmark 실행에는 사용하지 않음

## Clone 전 보안 검토

GitHub API와 고정 commit의 raw 원문으로 저장소 README·LICENSE·전체 tree·marketplace·CI scan workflow와 내부 plugin 후보를 먼저 확인했다. 출력 스타일 후보 두 개는 session-start shell hook을 포함해 제외했다. `security-guidance`도 대형 Python·shell hook과 네트워크 인증 경로가 있어 제외했다.

선택한 `code-simplifier`에서는 다음 세 파일만 확인됐다.

- `plugins/code-simplifier/.claude-plugin/plugin.json`
- `plugins/code-simplifier/agents/code-simplifier.md`
- `plugins/code-simplifier/LICENSE`

| 항목 | 판정 | 근거 |
|---|---|---|
| 설치·postinstall 스크립트 | 선택 후보에는 없음 | 후보 tree는 JSON, LICENSE, Markdown만 포함 |
| 외부 다운로드·원격 코드 실행 | 저장소 전체에는 있음 | marketplace와 CI에 외부 참조가 있으나 이번 범위에서는 실행하지 않음 |
| 파일 시스템 쓰기·삭제 | 선택 지침 적용 시 가능 | agent 목적이 코드 수정이므로 실제 plugin 실행 시 작업 파일을 변경할 수 있음 |
| 환경 변수·비밀정보 접근 | 선택 후보에는 없음 | agent 정의에 환경 변수·자격 증명 접근 명령이 없음 |
| 관리자 권한·백그라운드 프로세스 | 선택 후보에는 없음 | hook, server, daemon과 설치 script가 없음 |
| 바이너리·난독화·대형 파일 | 선택 후보에는 없음 | 후보의 실행 가능 파일과 binary가 없음 |
| Git LFS·submodule | 없음 | `.gitmodules`가 없고 LFS smudge를 끈 clone으로 후보 tree를 확인 |
| 네트워크·외부 서비스·비용 | 저장소 전체에는 있음 | marketplace와 일부 plugin은 네트워크·MCP를 사용하지만 이번 실험은 사용하지 않음 |

### 개별 판정

- clone: **조건부 허용**. LFS smudge, submodule 자동 처리, credential prompt와 hook을 차단한 `--no-checkout` shallow clone으로 고정 HEAD만 확인했다.
- 설치: **보류**. marketplace 설치는 다른 plugin과 실행 표면을 활성화할 수 있어 수행하지 않았다.
- 실행: **제한 허용**. repository plugin runtime, hook, MCP와 agent process는 실행하지 않았다. 고정 Markdown의 명확성·중복 제거·동작 보존 원칙만 직접 만든 fixture에 적용하고 authored benchmark만 실행했다.

악성코드가 없다고 보증하지 않는다. 위 판정은 commit `465f0934…`, 선택한 내부 plugin tree와 실제 실험 범위에만 적용된다. `/external_plugins`와 marketplace가 참조하는 외부 저장소는 개별 보안 검토 대상이다.

## 실험 설계

가설은 “동작 보존, 중복 제거와 얕은 제어 흐름을 강조하는 `code-simplifier` 지침을 적용하면 동일한 결과를 유지하면서 코드 구조를 단순화할 수 있다”이다.

- Baseline: 중첩 조건, 반복 분기와 불필요한 임시 변수를 포함한 직접 작성 release-decision 함수
- Treatment: 같은 함수에 선택 plugin의 동작 보존, 조기 반환, 중복 제거와 명시적 이름 원칙을 적용한 버전
- 고정 입력: boolean 4개와 approval count 0~3의 모든 조합 64개
- 완료 기준: 64개 결과가 모두 일치하고 source 지표가 악화되지 않을 것
- 측정 지표: UTF-8 source bytes, 비어 있지 않은 line 수, `if`·`&&`·`||`·ternary decision token 수, 최대 brace depth, 반복 실행 중앙값

fixture와 두 구현은 이번 실험을 위해 직접 작성했다. 실제 사용자 프로젝트에서 무작위로 추출한 코드가 아니므로 일반적인 개선율을 나타내지 않는다.

## 실행 방법

먼저 checkout 없이 고정 HEAD와 후보 tree를 확인했다.

```powershell
$env:GIT_LFS_SKIP_SMUDGE='1'
git -c core.hooksPath=NUL clone --depth 1 --no-tags `
  --no-recurse-submodules --no-checkout `
  https://github.com/anthropics/claude-plugins-official.git `
  _sources/claude-plugins-official
git -C _sources/claude-plugins-official rev-parse HEAD
git -C _sources/claude-plugins-official ls-tree -r --name-only `
  HEAD plugins/code-simplifier
```

그 뒤 authored benchmark만 실행했다.

```powershell
cd weeks/week-01/repos/10-anthropics--claude-plugins-official/project
node --check benchmark.mjs
node benchmark.mjs --output ../artifacts/benchmark-result.json
```

## 직접 측정한 결과

| 지표 | Baseline | Treatment | 변화 |
|---|---:|---:|---:|
| 64개 입력 동작 일치 | 64/64 | 64/64 | mismatch 0 |
| UTF-8 source bytes | 905 | 322 | 64.42% 감소 |
| 비어 있지 않은 line | 34 | 8 | 76.47% 감소 |
| decision token | 7 | 4 | 3개 감소 |
| 최대 brace depth | 5 | 2 | 3단계 감소 |
| 128만 호출 중앙값 | 19.476ms | 18.710ms | 최초 측정 3.93% 감소, 재검증 시 반전 |

Runtime은 Node.js 한 프로세스에서 warm-up 뒤 실행 순서를 번갈아 7회 측정한 작은 synthetic microbenchmark다. 보존한 최초 결과에서는 Treatment 중앙값이 3.93% 낮았지만 최종 재검증에서는 2.74% 높아져 방향이 반전됐다. 따라서 실행 시간 차이는 측정 잡음 범위의 **결론 불가**로 판정하고, 기능 보존과 정적 구조 감소만 핵심 결과로 사용한다. 이 실험은 model API를 호출하지 않아 token 사용량은 해당 없음이다.

## 직접 만든 산출물

- [재현 benchmark](project/benchmark.mjs)
- [측정 결과 JSON](artifacts/benchmark-result.json)

원본 plugin 파일, marketplace manifest와 제3자 source 사본은 결과 폴더에 포함하지 않았다.

## 평가와 한계

- 가장 강한 결과는 64개 고정 입력에서 동작을 그대로 유지하면서 중첩과 중복을 줄였다는 점이다.
- source bytes와 line 감소는 이 synthetic fixture에만 해당하며 짧을수록 항상 더 읽기 쉽다는 뜻이 아니다.
- Treatment 작성은 자동 plugin 설치나 독립된 Claude agent 호출이 아니라 pinned Markdown 지침을 통제된 범위에서 적용한 것이다.
- agent 정의의 `model: opus` 동작, 자동 실행 성향, 실제 codebase 탐색·수정 품질과 token 비용은 검증하지 않았다.
- 전체 marketplace, 외부 plugin, MCP와 hook은 각각 별도 저장소처럼 검토해야 한다.

이번 최소 실험에서는 prompt-only 내부 plugin의 원칙이 중복된 분기 코드를 더 얕고 명시적인 형태로 바꾸는 데 유효했고, exhaustive fixture 비교로 동작 보존을 확인했다. 실제 도입 판단에는 독립된 프로젝트 표본과 model 호출 비용을 포함한 추가 평가가 필요하다.

## 정리 결과

원본 clone은 검증 후 삭제한다. package, plugin, hook, MCP, 사용자 설정과 외부 service data는 생성하지 않았다. 저장소 폴더에는 직접 작성한 benchmark, 측정 결과 JSON과 이 보고서만 남긴다.
