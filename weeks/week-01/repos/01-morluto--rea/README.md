# Week 01 · Rank 1 · morluto/rea 실습 보고서

- 확인일: 2026-10-26
- 원본 URL: https://github.com/morluto/rea
- 기본 브랜치: `main`
- 분석한 tag: `rea-agents-6.7.0`
- 분석한 commit SHA: `27dc42d10249f0410904a75c0997842eb03b931c`
- 분석한 tree SHA: `49c830e2726a20a59970b73684ff9fad43ebdb83`
- npm package: `rea-agents@6.7.0`
- npm integrity: `sha512-yhIx2ioJYYT1C/tONfYeitC6LhnKmCh+ZwRUOgYuhSc733lGhkkt73zhug9WmLgxoMdKuqIYGCoBfD4fXkOhFw==`
- 라이선스: MIT
- 실행 결과: lifecycle과 optional dependency를 차단한 설치 후 authored .NET assembly의 read-only 정적 분석 성공

## 공식 목적

REA는 terminal과 MCP server에서 binary, managed assembly, JavaScript application, mobile package와 실행 중인 target을 여러 provider로 분석하는 reverse-engineering 도구다. 이번 실습은 넓은 기능 중 target code를 load하거나 execute하지 않는 built-in .NET metadata/CIL static analyzer만 사용했다. MCP 등록, setup, Frida, debugger, browser, Ghidra·IDA·Hopper bridge와 bundled native provider는 실행하지 않았다.

## 환경과 고정 버전

- 운영체제: Windows
- REA: `6.7.0`, tag `rea-agents-6.7.0`
- release commit 서명: GitHub API `verified: true`, reason `valid`
- Node.js: 공식 portable `24.22.1`
- Node archive SHA-256: `d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5`
- .NET SDK: `5.0.408`
- authored fixture target: `.NETCoreApp,Version=v5.0`
- 외부 계정·API key·유료 서비스: 사용하지 않음

로컬 Node.js `22.11.0`은 package가 요구하는 `^22.19.0 || ^24.11.0 || >=26.0.0`을 만족하지 않았다. Node 공식 `SHASUMS256.txt`와 일치하는 portable ZIP을 임시 위치에 풀어 사용했다. npm registry의 SHA-512 integrity와 SHA-1 shasum을 모두 확인한 뒤 package를 압축 해제했다. npm provenance는 package subject digest를 release branch `release/6.7.0`의 commit `27dc42d…`와 연결한다.

## Clone 전 보안 검토

GitHub API와 pinned commit의 raw 원문으로 README, LICENSE, SECURITY, `package.json`, `.gitmodules`, `.gitattributes`, CLI dispatcher, prepare script, managed analysis 문서와 recursive tree를 확인했다. npm tarball도 digest 검증 후 inventory와 lifecycle을 별도로 확인했다.

- recursive tree: 4,706 entries, `truncated: false`
- source tree executable artifact: 확장자 기준 0개
- submodule: 5개 (`binwalk`, `ghidra-nativeaot`, `jadx-headless-mcp`, `unblob`, `wakaru`)
- Git LFS: `.gitattributes`에 LFS filter 없음
- npm tarball: 1,775 files, 28,575,703 bytes
- bundled binary: `native/windows/build/rea-windows-x64.node`, 881,284 bytes
- published lifecycle: `prepare` 존재
- optional dependency: `frida@17.23.2`, install script 허용 선언 존재
- 공개 repository security advisory API: 확인 시 0건

published `prepare.mjs`는 source tree와 Husky dependency가 함께 있을 때만 Husky를 설치하도록 작성됐지만, 자동 실행 경로 자체는 존재한다. `install.sh`, update/setup 기능, 다수의 bridge와 process/debug/browser provider도 filesystem·network·child process 접근을 지원한다. 따라서 일반 설치나 전체 CLI 실행을 안전하다고 확대 해석하지 않았다.

| 항목 | 판정 | 근거 |
|---|---|---|
| 설치·postinstall 스크립트 | 있음 | package에 `prepare`, optional Frida install 허용 선언 존재 |
| 외부 다운로드·원격 코드 실행 | 있음 | setup, update, provider 설치와 여러 외부 tool integration 지원 |
| 파일 시스템 쓰기·삭제 | 있음 | setup, evidence export, extraction, update, uninstall 기능 지원 |
| 환경 변수·비밀정보 접근 | 있음 | provider와 integration 설정을 위한 환경 변수·사용자 설정 경로 사용 |
| 관리자 권한·백그라운드 프로세스 | 기능에 따라 가능 | debugger, browser, device, process provider는 자식 process나 외부 tool 사용 |
| 바이너리·난독화·대형 파일 | 있음 | npm package에 881,284-byte native Node addon 포함 |
| Git LFS·submodule | submodule 있음 | pinned tree에 5개 gitlink, LFS filter는 없음 |
| 네트워크·외부 서비스·비용 | 있음 | install, update, browser/device/provider 경로가 network 또는 외부 service를 사용할 수 있음 |

### 개별 판정

- clone: **조건부 허용**. signed release commit을 고정하고 submodule을 초기화하지 않는 조건이다. 이번 실험은 clone 없이 attested npm package만 사용했다.
- 설치: **조건부 허용**. verified package를 disposable directory에 두고 `--ignore-scripts --omit=optional`로 lifecycle과 Frida를 차단했다. 499개 production dependency가 설치됐으며 source package에 lockfile이 없어 transitive dependency resolution은 완전히 고정되지 않았다.
- 실행: **격리 범위에서 허용**. authored assembly에 built-in `inspect-managed-artifact`와 filtered `inspect-managed-members`만 실행했다. target assembly는 REA가 load 또는 execute하지 않았다.

악성코드가 없다고 단정하지 않는다. 위 판정은 pinned release와 이번 두 static operation에만 적용된다. REA command 자체의 network activity를 packet capture로 독립 측정하지는 않았지만, 검토한 managed static implementation은 local bytes와 PE/CLI metadata를 읽는 경로이며 외부 provider나 credential을 제공하지 않았다.

## 실험 설계

가설은 “단순 byte scan도 metadata name과 고정 문자열은 찾을 수 있지만, REA의 managed static analyzer는 target을 실행하지 않고 assembly identity, CIL 구조와 call edge를 추가로 복원할 수 있다”이다.

- 입력: 직접 작성한 .NET 5 console assembly
- fixture 동작: `ComputeScore(5)`로 22를 계산하고 `REA_LAB_MARKER:analysis-ready:22` 출력
- Baseline: authored Node.js byte scan으로 2개 type, 3개 method와 marker 존재 검사
- Treatment: REA `inspect-managed-artifact`와 `inspect-managed-members`, type filter 2개
- 고정 품질 rubric: type 2점 + method 3점 + marker 1점 + assembly identity 1점 + CIL 1점 + call edge 1점 = 9점
- 완료 기준: fixture와 두 analyzer exit code 0, digest 일치, 기대 name·marker 검출, Treatment에서 identity·CIL·call edge 복원, 오류 0건

## 실행 방법

fixture와 baseline은 다음 범위로 실행했다.

```powershell
dotnet build project/ReaLab.csproj -c Release -o <temp>/fixture --nologo
dotnet <temp>/fixture/ReaLab.dll
node project/baseline.mjs <temp>/fixture/ReaLab.dll <temp>/baseline.json
```

verified Node 24와 scripts-disabled npm install을 사용한 Treatment 명령은 다음과 같다.

```powershell
npm install --ignore-scripts --omit=optional --no-audit --no-fund --package-lock=false
node scripts/rea.mjs inspect-managed-artifact <temp>/fixture/ReaLab.dll `
  --format json --full-output
node scripts/rea.mjs inspect-managed-members <temp>/fixture/ReaLab.dll `
  --type ReaLab.ScoreEngine --type ReaLab.Program `
  --format json --full-output
node project/summarize.mjs <baseline> <artifact> <members> `
  artifacts/benchmark-result.json <artifact-ms> <members-ms>
```

## 직접 측정한 결과

| 지표 | Baseline | Treatment | 변화 |
|---|---:|---:|---|
| 기대 type | 2/2 | 2/2 | 동일 |
| 기대 method | 3/3 | 3/3 | 동일 |
| marker 문자열 | 1/1 | 1/1 | 동일 |
| assembly identity | 불가 | `ReaLab`, AnyCPU, .NET 5 | 기능 추가 |
| `ComputeScore` CIL 구조 | 불가 | `ldarg.0`, `3`, `mul`, `7`, `add`, `ret` | 기능 추가 |
| `Main` call edge | 불가 | 4개, 핵심 authored call 2개 포함 | 기능 추가 |
| 고정 품질 점수 | 6/9 | 9/9 | 3점 증가 |
| 오류 | 0 | 0 | 동일 |
| wall time | 4.658 ms | artifact 15,877.914 ms + members 7,862.106 ms | 직접 비교 불가 |

Baseline은 byte 존재만 검사하고 Treatment는 PE/CLI metadata와 method body를 구조적으로 decode한다. 수행 작업이 다르므로 시간 차이를 성능 향상 또는 저하율로 해석하지 않는다. 유효한 개선은 동일한 name과 marker 탐지에 assembly identity, exact opcode counts와 static call graph가 추가된 것이다.

## 결과와 증거

- fixture 출력: `REA_LAB_MARKER:analysis-ready:22`
- fixture exit code: 0
- assembly 크기: 5,120 bytes
- assembly SHA-256: `5dc998a5ffaaf36696477649fca1379f6f8a648bc15dcf93a9e952b190588acc`
- REA provider: `rea-dotnet-static`, version `1`
- metadata coverage: `complete`
- selected type unmatched count: 0
- target code execution: false
- [authored .NET fixture](project/Program.cs)
- [fixture project](project/ReaLab.csproj)
- [Baseline analyzer](project/baseline.mjs)
- [결과 검증·요약 script](project/summarize.mjs)
- [최소 측정 증거](artifacts/benchmark-result.json)

첫 fixture build에서 .NET 5 first-run이 current-user certificate store에 ASP.NET Core HTTPS development certificate를 생성했다. 생성 시각과 exact thumbprint로 이번 run의 certificate임을 확인한 뒤 해당 thumbprint만 제거했다. REA 실행을 위한 PowerShell 변수 이름 `$home`은 read-only `$HOME`과 충돌해 intended override가 적용되지 않았지만, 명시한 user-profile/cache 후보 경로는 모두 생성되지 않은 것을 확인했다. raw REA JSON에는 absolute local path가 포함돼 게시 대상에서 제외하고 path-free 요약만 보존한다.

## 평가와 한계

- 이름과 marker 검색만 필요하면 authored byte scan이 훨씬 작고 빠르다.
- REA는 target을 실행하지 않고 assembly identity, framework, MVID, exact CIL digest/opcode와 call edge를 제공해 구조 검토에 추가 가치가 있었다.
- 결과는 작은 non-obfuscated .NET 5 assembly 하나에 한정되며 packed, ReadyToRun, mixed-mode, malformed PE와 다른 runtime에 일반화할 수 없다.
- REA는 1,775 files와 499개 installed dependencies를 사용하는 큰 도구이며 bundled native addon과 광범위한 provider surface가 있다. untrusted artifact와 전체 기능은 VM/container가 더 적합하다.
- source package에 lockfile이 없어 이번 npm dependency graph 전체의 재현성을 digest 하나로 보장할 수 없다.
- full REA setup, MCP workflow, agent quality, decompilation과 dynamic instrumentation은 검증하지 않았다.

## 정리 결과

npm tarball, package source, 499개 dependencies, portable Node, npm/NuGet caches, compiled assembly와 build output, raw REA JSON, isolated home과 temporary logs를 삭제했다. 최종 폴더에는 직접 작성한 source와 scripts, 이 보고서와 path-free summary JSON만 남긴다.