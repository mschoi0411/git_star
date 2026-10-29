# Week 01 · Rank 6 · NationalSecurityAgency/ghidra 실습 보고서

- 확인일: 2026-10-24
- 원본 URL: https://github.com/NationalSecurityAgency/ghidra
- 기본 브랜치: `master`
- 분석한 tag: `Ghidra_12.2_build`
- 분석한 commit SHA: `8ca9077040cc43cd790babcfccf19475622a3e9a`
- 공식 배포 파일: `ghidra_12.2_PUBLIC_20261016.zip`
- 배포 파일 SHA-256: `2c2cd776db3c1f6a097ba418922378ac3649cadd5e844a6f5f088ae628a7be67`
- 라이선스: Apache License 2.0, 배포물 내부 구성요소별 추가 라이선스 포함
- 실행 결과: checksum을 검증한 공식 배포물로 제한된 headless 정적 분석 성공

## 공식 목적

Ghidra는 NSA Research Directorate가 개발한 소프트웨어 리버스 엔지니어링 프레임워크다. 실행 파일을 여러 플랫폼과 형식에서 분석하며 disassembly, decompilation, graphing, scripting과 headless 분석 기능을 제공한다. 이번 실습은 직접 작성한 Windows PE 하나의 로컬 정적 분석에만 범위를 제한했다.

## 환경과 고정 버전

- 운영체제: Windows
- Ghidra: `12.2`, tag `Ghidra_12.2_build`
- Ghidra release 크기: `569,712,708` bytes
- JDK: Eclipse Temurin `25.0.4.1+1`, portable ZIP
- JDK archive SHA-256: `00c847d804f4a78e9f04f2683faf14fed898535b177b7fc704486cb0284e9283`
- 컴파일러: Microsoft Visual C++ `19.29.30136`, x64
- Node.js: baseline과 결과 검증에만 사용
- Ghidra heap 상한: 1 GB
- Ghidra CPU 상한: 2 cores
- 외부 계정·API key·Ghidra server: 사용하지 않음

GitHub release API가 게시한 Ghidra digest와 Adoptium API가 게시한 JDK digest를 다운로드 후 각각 `Get-FileHash`로 검증했다. Ghidra release tag는 위 commit을 직접 가리키지만 commit은 GitHub API에서 `unsigned`로 표시되고 release는 `immutable: false`다. 따라서 보고서에는 URL뿐 아니라 파일 digest도 함께 고정한다.

## Clone 전 보안 검토

GitHub API와 tag의 raw 원문으로 README, LICENSE, Getting Started, Developer Guide, 전체 recursive tree, runtime launcher, headless 문서, Gradle dependency script와 공개 security advisory를 확인했다.

- recursive tree: 25,091 entries, `truncated: false`
- `.gitmodules`: 고정 tree에 없음
- `.gitattributes`: Git LFS filter 없음
- source build: Gradle과 외부 dependency 다운로드가 필요해 수행하지 않음
- official release install: 관리자 권한이나 registry 변경 없이 ZIP 압축 해제
- headless launcher: Java foreground process를 시작하고 local project, logs, preferences와 caches를 기록
- headless option: server URL, pre/post scripts, library search와 destructive project deletion 기능을 지원하므로 입력과 옵션을 제한해야 함

공개 advisory API에는 64건이 있었다. 최신 12.2 관련 공개 항목은 12.2를 patched version으로 표시했고, 조회 시점에 12.2를 취약 버전으로 명시한 공개 항목은 없었다. 주요 수정 범위에는 command injection, path traversal, parser resource exhaustion, unsafe deserialization과 archive handling 문제가 포함된다. 이는 12.2가 안전하다는 보증이 아니며, 임의의 비신뢰 binary·project·script·server를 열지 않을 이유다.

| 항목 | 판정 | 근거 |
|---|---|---|
| 설치·postinstall 스크립트 | release 설치에는 없음 | checksum 검증 후 ZIP만 압축 해제 |
| 외부 다운로드·원격 코드 실행 | source build·일부 기능에는 있음 | Gradle dependency, extensions, PyGhidra와 server 기능은 사용하지 않음 |
| 파일 시스템 쓰기·삭제 | 있음 | project, logs, preferences, caches 생성과 `-deleteProject` 기능 지원 |
| 환경 변수·비밀정보 접근 | 실행 범위에서 제한 | isolated home/temp 사용, API key와 credential 미제공 |
| 관리자 권한·백그라운드 프로세스 | 실행 범위에는 없음 | foreground headless process만 실행, service·debugger 미사용 |
| 바이너리·난독화·대형 파일 | 있음 | 공식 배포물 569,712,708 bytes와 native components 포함 |
| Git LFS·submodule | 고정 source tree에는 없음 | complete recursive tree와 attributes 확인 |
| 네트워크·외부 서비스·비용 | 기능상 가능 | local project만 사용하고 server, extension, debugger, update 경로 미사용 |

### 개별 판정

- clone: **조건부 허용**, 그러나 이번 실험에는 불필요해 수행하지 않음. source build도 수행하지 않았다.
- 설치: **조건부 허용**. 공식 release와 portable JDK의 SHA-256을 확인한 뒤 ignored `_tooling`에만 압축 해제했다.
- 실행: **격리 범위에서 허용**. 직접 만든 PE 하나를 local read-only project로 headless 분석했다. debugger, server, GUI, extension, PyGhidra와 bundled user script는 실행하지 않았다.

악성코드가 없다고 단정하지 않는다. 위 판정은 고정 tag, 검토한 공식 배포물과 실제 headless 옵션에만 적용된다.

## 실험 설계

가설은 “단순 byte scan도 export 이름과 고정 문자열은 찾을 수 있지만, Ghidra headless 분석은 debug symbol 없이 함수 구조와 고수준 연산 의미를 추가로 복원할 수 있다”이다.

- 입력: 직접 작성하고 MSVC x64로 컴파일한 `lab_sample.c`
- fixture 동작: `compute_score(5)`로 22를 계산하고 `GHIDRA_LAB_MARKER:analysis-ready:22` 출력
- Baseline: authored Node.js byte scan으로 두 export 이름과 marker 존재 검사
- Treatment: Ghidra 12.2 PE loader, auto-analysis와 authored `ExportAnalysis.java`
- 고정 기대값: `choose_message`, `compute_score`, `GHIDRA_LAB_MARKER`
- 완료 기준: 실행 exit code 0, 양쪽에서 기대 이름·marker 검출, Treatment에서 `compute_score` decompilation 성공

실행 파일에는 PDB 정보가 없었다. Ghidra log도 `Skipping PDB processing: missing PDB information`을 기록했다.

## 실행 방법

fixture를 컴파일하고 동작을 먼저 확인했다.

```powershell
cl.exe /TC /Od /guard:cf /Fo:lab_sample.obj /Fe:lab_sample.exe `
  project/lab_sample.c /link /INCREMENTAL:NO /DYNAMICBASE /NXCOMPAT
./lab_sample.exe
node project/baseline.mjs lab_sample.exe baseline-result.json
```

검증된 portable JDK 25를 `JAVA_HOME`과 축소한 `PATH`에 지정하고, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`를 임시 lab 디렉터리로 격리한 뒤 다음 범위로 실행했다.

```powershell
support/analyzeHeadless.bat projects GhidraLab `
  -import lab_sample.exe `
  -loader PeLoader -loader-loadLibraries false `
  -scriptPath project -postScript ExportAnalysis.java treatment-result.json `
  -readOnly -analysisTimeoutPerFile 180 -max-cpu 2
```

`-readOnly`로 import 결과를 폐기했고 최종 log에서 `Analysis succeeded`, `Discarded file import due to readOnly option`, `Import succeeded`와 error 0건을 확인했다.

## 직접 측정한 결과

| 지표 | Baseline | Treatment | 변화 |
|---|---:|---:|---|
| 기대 함수 이름 | 2/2 | 2/2 | 동일 |
| marker 문자열 | 1/1 | 1/1 | 동일 |
| 전체 복원 함수 | 해당 없음 | 438 | 추가 구조 발견 |
| 고수준 decompilation | 불가 | 성공 | 기능 추가 |
| 핵심 산술 의미 | 불가 | `param_1 * 3 + 7` | 원본 의미 복원 |
| wall time | 6.238 ms | 120,523.796 ms | 직접 비교 불가 |

Baseline은 byte 존재만 검사하고 Treatment는 loader, auto-analysis와 decompiler를 실행한다. 수행 작업이 달라 시간 차이를 속도 저하율이나 성능 개선율로 해석하지 않는다. 이 실험의 유효한 개선은 같은 이름·문자열 검출에 더해 고수준 함수 의미를 복원한 것이다.

## 결과와 증거

- fixture 실행 출력: `GHIDRA_LAB_MARKER:analysis-ready:22`
- fixture exit code: 0
- fixture executable SHA-256: `0e5bb415a5d05462cdbb3096bf4f43d01dde50e90f6ab990b3ba31eeb9a5de22`
- Ghidra 최종 exit code: 0
- Ghidra final log error count: 0
- [직접 작성한 C fixture](project/lab_sample.c)
- [Baseline analyzer](project/baseline.mjs)
- [Ghidra export script](project/ExportAnalysis.java)
- [결과 검증·요약 script](project/summarize.mjs)
- [최소 측정 증거](artifacts/benchmark-result.json)

첫 격리 시도에서는 PowerShell의 read-only `$HOME` 변수와 이름이 충돌해 Ghidra 12.2 preferences와 caches가 실제 user profile에 생성됐다. 생성 시각과 경로를 확인하고 이번 실행이 만든 version-specific directory만 삭제했다. 이후 `$isolatedHome`으로 수정하고 축소한 `PATH`에서 재실행해 preferences, symbols, caches, projects와 logs가 모두 임시 lab 경로에 생성되는 것을 확인했다. 120초 제한 run은 analysis timeout이 발생해 증거에서 제외하고 180초 제한으로 성공한 run만 최종 결과에 사용했다.

## 평가와 한계

- export 이름과 marker 검색은 단순 scan도 가능했지만 함수 본문 의미 복원은 Ghidra가 제공한 추가 가치였다.
- Ghidra는 PDB 없이 authored 산술식과 438개 함수 경계를 복원했다.
- 작은 MSVC executable 하나의 결과이므로 다른 compiler, architecture, stripped binary와 난독화 입력에 일반화할 수 없다.
- Ghidra는 분석 input을 파싱하는 대형 native/Java application이다. 비신뢰 input은 parser 취약점과 resource exhaustion 위험 때문에 별도 VM 또는 container가 더 적절하다.
- release commit은 unsigned이고 release metadata는 immutable하지 않아 digest 검증이 중요하다.
- 공식 배포물과 JDK download가 커서 일상적인 단일 문자열 검색에는 과도하지만 구조 복원과 decompilation에는 명확한 가치가 있다.

## 정리 결과

Ghidra ZIP, portable JDK, 압축 해제한 runtime, compiled PE/PDB/object/import library, temporary project, preferences, caches와 logs를 삭제했다. 최종 폴더에는 직접 작성한 source와 scripts, 이 보고서와 하나의 요약 JSON만 남겼다.
