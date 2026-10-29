# Week 01 · Rank 9 · earthtojake/text-to-cad 실습 보고서

- 확인일: 2026-10-27
- 원본 URL: https://github.com/earthtojake/text-to-cad
- 기본 브랜치: `main`
- 분석한 tag: `v0.7.26`
- 분석한 commit SHA: `2f793659fb7bab537e2f00836e06448fc4087cb2`
- 분석한 tree SHA: `5557781b52b5127af4156312fb92623ea7ce0cc1`
- Python package: `cadgen==0.7.26`
- wheel SHA-256: `112b8b3a385127b88909255f9d50fd6ed353d087ffae5906de800836da894b48`
- 라이선스: MIT
- 실행 결과: authored Python model에서 STEP·STL 생성과 geometry 검증 성공

## 공식 목적

text-to-cad는 Python으로 parametric CAD model을 작성하고 STEP, STL 등으로 build하며 viewer와 MCP integration도 제공하는 도구다. 이번 실습은 전체 plugin, MCP, viewer, browser snapshot과 외부 AI를 사용하지 않고 `cadgen`의 authored model decorator와 bundled build123d interface로 local STEP·STL만 생성했다. Model 실행 중 cadgen이 disposable venv에서 local build daemon을 자동 시작했으며, 결과 검증 후 해당 process를 종료했다.

## 환경과 고정 버전

- 운영체제: Windows
- Python: `3.12`
- cadgen: `0.7.26`
- build123d: `0.11.1`
- cadquery-ocp-novtk: `7.9.3.1.1`
- release commit 서명: GitHub API `verified: true`, reason `valid`
- release asset: `cadgen-0.7.26-py3-none-any.whl`, 5,437,395 bytes
- offline inventory: package 포함 59개 wheel, 191,517,611 bytes
- 외부 계정·API key·유료 서비스·GPU: 사용하지 않음
- telemetry: `DO_NOT_TRACK=1`, `CADGEN_TELEMETRY=0`
- update check: `CI=1`, `CADGEN_UPDATE_CHECK=0`

## Clone 전 보안 검토

GitHub API와 pinned commit의 raw 원문으로 README, LICENSE, SECURITY, package manifests, workflow, recursive tree와 release asset을 확인했다. 검증한 wheel과 dependency wheels도 설치 전에 archive inventory했다.

- recursive tree: 3,344 entries, `truncated: false`
- blobs: 3,023개, 합계 36,034,767 bytes
- 5 MB 이상 source blob: 0개
- source tree CAD fixture: `tests/fixtures/cad/import-smoke.step` 1개, 5,215 bytes
- submodule: 0개
- 공개 repository security advisory API: 확인 시 0건
- wheel dependency inventory: 59개 wheel, native entry 323개
- cadgen wheel bundled platform tracer: 5개 native binary

공식 `SECURITY.md`는 viewer가 기본적으로 `127.0.0.1`에 bind되지만 authentication이 없고, local process가 열린 directory 아래 파일을 읽거나 STEP build/export를 요청할 수 있다고 설명한다. 따라서 viewer, MCP와 server path는 실행하지 않았다.

| 항목 | 판정 | 근거 |
|---|---|---|
| 설치·postinstall 스크립트 | 이번 경로에서는 없음 | sdist와 source build 없이 verified wheel만 `pip --no-index`로 설치 |
| 외부 다운로드·원격 코드 실행 | 기능에는 있음 | update feed, browser runtime과 integration surface가 있으나 이번 실행에서는 모두 차단·미사용 |
| 파일 시스템 쓰기·삭제 | 있음 | STEP·STL과 content-addressed local cache를 쓰며 disposable path로 제한 |
| 환경 변수·비밀정보 접근 | 있음 | telemetry, update, state, daemon 설정을 읽으며 credential은 제공하지 않음 |
| 관리자 권한·백그라운드 프로세스 | 있음 | 관리자 권한은 불필요했지만 model decorator가 disposable venv의 local build daemon을 자동 시작함 |
| 바이너리·난독화·대형 파일 | 있음 | OCP native DLL/PYD와 cadgen platform tracer 포함 |
| Git LFS·submodule | 없음 | recursive tree에서 gitlink 0개 |
| 네트워크·외부 서비스·비용 | 기능에는 있음 | telemetry·update를 source-confirmed environment gate로 차단하고 local authored build만 실행 |

### 개별 판정

- clone: **조건부 허용**. signed tag를 고정하고 submodule이 없는 tree만 대상으로 한다. 이번 실험은 repository clone 없이 verified release wheel을 사용했다.
- 설치: **조건부 허용**. digest를 검증하고 dependencies를 wheel-only로 확보한 뒤 disposable Python 3.12 venv에 offline 설치했다.
- 실행: **격리 범위에서 허용**. authored model의 local STEP·STL build와 read-back verification만 요청했지만 cadgen이 local build daemon을 자동 시작하므로 disposable process와 state 경계가 필요하다.

악성코드가 없다고 단정하지 않는다. 판정은 pinned release와 이번 local authoring path에만 적용된다. native OCP와 bundled tracer를 독립 reverse engineering하지 않았고, packet capture로 network absence를 측정하지도 않았다.

## 실험 설계

가설은 “text requirement parser는 치수와 feature를 추출할 수 있지만, cadgen을 적용하면 같은 요구를 실제 CAD로 build해 export와 geometry correctness까지 자동 검증할 수 있다”이다.

- 고정 입력: 40 × 30 × 4 mm rectangular plate, edge에서 5 mm인 위치에 Ø3 mm through-hole 4개
- Baseline: authored Node.js parser로 요구사항 6개를 추출하되 CAD를 생성하지 않음
- Treatment: authored Python/build123d model을 `cadgen==0.7.26` decorator로 STEP·STL export
- 고정 품질 rubric: 요구사항 6점 + STEP 1점 + STL 1점 + bounding box 1점 + volume/topology 1점 = 10점
- 완료 기준: 두 path exit code 0, 요구사항 6/6, 두 format 생성, 40 × 30 × 4 mm bounding box, 단일 solid와 analytic volume 일치, STL triangle 존재, 오류 0건

## 실행 방법

verified wheel set을 disposable venv에 offline 설치하고 profile, state와 cache를 임시 lab 아래로 제한했다.

```powershell
python -m pip install --no-index --find-links <verified-wheels> cadgen==0.7.26
$env:CI = '1'
$env:DO_NOT_TRACK = '1'
$env:CADGEN_TELEMETRY = '0'
$env:CADGEN_UPDATE_CHECK = '0'
$env:CADGEN_STATE_DIR = '<temp>/state'
$env:LOCALAPPDATA = '<temp>/local-app-data'
node project/baseline.mjs project/design-prompt.txt <temp>/baseline.json
python project/mounting_plate.py
python project/verify_treatment.py <step> <stl> <temp>/treatment.json <elapsed-ms>
node project/summarize.mjs <baseline> <treatment> artifacts/benchmark-result.json
```

## 직접 측정한 결과

| 지표 | Baseline | Treatment | 변화 |
|---|---:|---:|---|
| 요구사항 추출 | 6/6 | 6/6 | 동일 |
| STEP 생성 | 불가 | 성공, 31,419 bytes | 기능 추가 |
| STL 생성 | 불가 | 성공, 39,884 bytes | 기능 추가 |
| bounding box | 검증 불가 | 40 × 30 × 4 mm | 검증 추가 |
| volume·topology | 검증 불가 | 4,686.902664 mm³, solid 1개 | 검증 추가 |
| STL triangle | 검증 불가 | 796개 | 검증 추가 |
| 고정 품질 점수 | 6/10 | 10/10 | 4점 증가 |
| 오류 | 0 | 0 | 동일 |
| wall time | 2.912 ms | 46,446.094 ms | 직접 비교 불가 |

Treatment 시간에는 native geometry kernel의 최초 import, boolean operation, meshing과 두 format export가 포함된다. Baseline은 text regex만 수행하므로 시간 차이를 성능 저하율로 해석하지 않는다. 유효한 개선은 실제 CAD artifact와 independent read-back geometry validation이 추가된 것이다.

## 결과와 증거

- bounding box: 정확히 `40 × 30 × 4 mm`
- 실제 volume: `4,686.902664470765 mm³`
- analytic expected volume: `4,686.902664470767 mm³`
- STEP SHA-256: `a2969b754d9227dda141da159855ac5dfa04e4fbc229fa886009ded2e3e58ed7`
- STL SHA-256: `f6d2fe71572131caf82b8e55ee8065a3542ec795b74686536a7dcfc888efd9c3`
- [고정 자연어 요구문](project/design-prompt.txt)
- [authored CAD model](project/mounting_plate.py)
- [Baseline analyzer](project/baseline.mjs)
- [Treatment verifier](project/verify_treatment.py)
- [결과 검증·요약 script](project/summarize.mjs)
- [path-free benchmark](artifacts/benchmark-result.json)
- [STEP 결과](artifacts/mounting_plate.step)
- [STL 결과](artifacts/mounting_plate.stl)

첫 smoke test에서 PowerShell 변수 `$home`이 read-only `$HOME`과 충돌해 intended profile override가 적용되지 않았다. cadgen command와 model은 실행하기 전이었으며 telemetry와 update environment gate는 이미 설정돼 있었다. current-user의 `.cache`, `.cadgen`, Local/Roaming cadgen 후보 경로가 생성되지 않은 것을 확인하고, 실제 실험에서는 `$isolatedHome`, `CADGEN_STATE_DIR`와 `LOCALAPPDATA`를 disposable lab에 명시했다.

## 평가와 한계

- 단순 요구사항 추출만 필요하면 Baseline이 훨씬 작고 빠르다.
- cadgen Treatment는 동일 요구를 editable Python model과 교환 가능한 STEP·STL로 만들고, 예상 치수·volume·topology를 자동 검증하는 추가 가치가 있었다.
- 결과는 simple prismatic part 하나에 한정되며 complex assemblies, constraints, drawings, free-form surfaces와 natural-language-to-code generation 품질에 일반화할 수 없다.
- 이번 실험의 model code는 사람이 직접 작성했다. 외부 AI가 자연어에서 model을 자동 생성하는 능력은 측정하지 않았다.
- package graph가 크고 native geometry kernel을 포함하며 authored model도 local build daemon을 자동 시작했다. untrusted model이나 viewer/MCP 전체 기능은 VM 또는 container가 더 적합하다.
- release는 immutable로 표시되지 않았으므로 wheel digest와 commit을 함께 고정해야 한다.

## 정리 결과

자동 시작된 disposable cadgen daemon을 exact executable path와 PID로 확인해 종료한 뒤 verified wheels, 59개 package의 venv, cadgen cache/state, isolated profile, temporary JSON과 Python bytecode를 삭제했다. 최종 폴더에는 직접 작성한 요구문·scripts, 이 보고서, path-free summary와 직접 생성한 소형 STEP·STL만 남긴다.