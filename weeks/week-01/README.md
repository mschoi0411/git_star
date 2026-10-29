# Week 01

- 대상 기간: 2026-10-10 ~ 2026-10-17
- 입력 문서 작성일: 2026-10-20
- 원본 목록: [source.md](source.md)
- 등록 저장소: 10개
- 완료: 10개

## 목록과 진행 상태

| 원본 순위 | Repository | Stack | 보안·실행 상태 | 실습 상태 | 결과 |
|---:|---|---:|---|---|---|
| 1 | [morluto/rea](https://github.com/morluto/rea) | 1 | signed release·npm provenance 검토, scripts-disabled 격리 실행 | 완료 | [보고서](repos/01-morluto--rea/) |
| 2 | [storytold/artcraft](https://github.com/storytold/artcraft) | 1 | signed immutable release 원격 검토, account·cloud generation 실행 보류 결정 | 완료 | [보고서](repos/02-storytold--artcraft/) |
| 3 | [boykopovar/AnyPS5](https://github.com/boykopovar/AnyPS5) | 1 | 고정 commit 원격 검토, native 실행·입력 binary 수정 경계로 미실행 | 완료 | [보고서](repos/03-boykopovar--anyps5/) |
| 4 | [mattpocock/skills](https://github.com/mattpocock/skills) | 1 | 원격 정적 검토, clone·설치 안 함 | 완료 | [보고서](repos/04-mattpocock--skills/) |
| 5 | [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | 1 | 고정 commit 검토·제한 실행 | 완료 | [보고서](repos/05-cathrynlavery--diagram-design/) |
| 6 | [NationalSecurityAgency/ghidra](https://github.com/NationalSecurityAgency/ghidra) | 1 | 고정 release 검토·격리 headless 실행 | 완료 | [보고서](repos/06-nationalsecurityagency--ghidra/) |
| 7 | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | 1 | 고정 commit 검토·격리 실행 | 완료 | [보고서](repos/07-heygen-com--hyperframes/) |
| 8 | [mksglu/context-mode](https://github.com/mksglu/context-mode) | 1 | 고정 commit 검토·제한 실행 | 완료 | [보고서](repos/08-mksglu--context-mode/) |
| 9 | [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) | 1 | signed release·verified wheel 검토, offline 격리 실행 | 완료 | [보고서](repos/09-earthtojake--text-to-cad/) |
| 10 | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | 1 | 고정 commit 검토·설치 없는 제한 실습 | 완료 | [보고서](repos/10-anthropics--claude-plugins-official/) |

## 이번 주 결과

### morluto/rea · 완료

검증된 `rea-agents@6.7.0`의 lifecycle과 optional dependency를 차단하고 authored .NET assembly만 static analysis했다. Baseline과 동일하게 type 2/2, method 3/3과 marker를 찾으면서 assembly identity, exact CIL 구조와 call edge를 추가 복원해 고정 품질 점수가 6/9에서 9/9로 증가했다.

### mattpocock/skills · 완료

원격 문서와 설치 위험을 검토하고, 제3자 저장소를 안전하게 조사하는 독자적인 `safe-repo-lab` 스킬을 작성했다. 적용 전·후 시간·품질·오류 비교는 수행하지 않았지만, 문서 중심 실습으로 검토·작성 범위가 완료됐다.

### storytold/artcraft · 완료

immutable `artcraft-v0.41.0` release와 signed commit을 원격 검토했다. Rust/Tauri desktop app은 website login, provider cookies, HTTPS/upload/download permission, analytics와 generation credit/Stripe endpoint를 포함한다. custom fair-source license와 account·결제·external provider 경계가 현재 실습 조건을 넘으므로 installer, source, media를 내려받거나 실행하지 않는 것으로 검토를 완료했다.

### boykopovar/AnyPS5 · 완료

GitHub가 검증한 pinned commit과 GPL-2.0-only license, 23개 submodule 및 release/build surface를 원격 검토했다. relinker는 입력 executable의 byte patch와 format conversion을 지원하고, converted title은 host 사용자 권한으로 동작한다. 합법적인 공개 test input을 확보하지 않았으므로 source, release binary, submodule, title input을 내려받거나 실행하지 않고 검토 결과만 보존했다.

### cathrynlavery/diagram-design · 완료

원본의 설계 규칙을 참고해 HTML+SVG 아키텍처 다이어그램을 직접 만들었다. 오프라인 검사, 데스크톱·모바일 렌더링과 접근성을 검증했다.

### heygen-com/hyperframes · 완료

8초짜리 HTML 기반 소개 영상을 직접 제작해 H.264 MP4로 렌더링했다. 정적 검사 0건, 브라우저 검사 통과, 대비 75/75, 최종 영상 프레임과 메타데이터를 검증했다.

### mksglu/context-mode · 완료

일반 설치와 MCP·훅 실행을 피하고 실제 `PolyglotExecutor`만 Bun으로 제한 실행했다. 같은 194,381바이트 입력에서 119바이트 집계를 반환해 99.94%의 바이트 감소를 측정했으며, 사전 정의한 사실 5개를 모두 보존했다.

### earthtojake/text-to-cad · 완료

verified `cadgen==0.7.26` wheel set을 offline 설치하고 authored 40 × 30 × 4 mm mounting plate를 STEP·STL로 생성했다. Baseline은 요구사항 6/6만 추출해 6/10이었고, Treatment는 동일 요구를 geometry로 build한 뒤 bounding box, analytic volume, 단일 solid와 796개 STL triangle을 검증해 10/10을 기록했다.

### anthropics/claude-plugins-official · 완료

전체 marketplace 설치를 피하고 내부 `code-simplifier`의 prompt-only 지침만 직접 만든 함수에 적용했다. 64개 입력에서 동작을 모두 보존하면서 함수 크기 64.42%, 비어 있지 않은 줄 76.47%와 최대 중괄호 깊이 3단계를 줄였다.

### NationalSecurityAgency/ghidra · 완료

공식 Ghidra 12.2와 portable JDK 25의 SHA-256을 검증하고 직접 만든 Windows PE만 격리된 headless 환경에서 분석했다. Baseline과 동일하게 함수 이름 2/2와 marker 1/1을 찾았고, 추가로 438개 함수와 `param_1 * 3 + 7`의 고수준 의미를 PDB 없이 복원했다.

## 이번 주 종료

10개 저장소의 결과 정리를 완료했다. 각 항목은 원격 보안 검토 뒤 안전·법적 경계 안에서 제한 실습을 하거나, 실행하지 않는 검토 결과로 완료했다.
