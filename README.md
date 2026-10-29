# GitHub Weekly Repository Lab

매주 전달받은 GitHub 저장소 목록을 안전하게 검토하고, 직접 실습한 결과와 측정 가능한 효과를 기록하는 아카이브다. 제3자 원본 저장소는 게시하지 않으며, 직접 만든 코드·문서·미디어와 최소 검증 증거만 남긴다.

## Repository Index

`Stack`은 해당 저장소가 주간 목록에 등장한 **누적 주차 수**다. 같은 주에 URL이 중복되어도 1회만 계산하고, 이후 주에 다시 등장하면 실습을 반복하지 않고 Stack과 최근 등장 주차만 갱신한다.

| Repository | 한 줄 정리 | Stack | 결과 |
|---|---|---:|---|
| [morluto/rea](https://github.com/morluto/rea) | target을 실행하지 않는 .NET metadata·CIL·call-edge 정적 분석 | 1 | [보기](weeks/week-01/repos/01-morluto--rea/) |
| [storytold/artcraft](https://github.com/storytold/artcraft) | cloud provider·계정 경계로 실행을 보류한 AI 시각 창작 desktop app | 1 | [보기](weeks/week-01/repos/02-storytold--artcraft/) |
| [boykopovar/AnyPS5](https://github.com/boykopovar/AnyPS5) | native 실행·입력 binary 수정 경계로 실행하지 않은 PS5 relinker | 1 | [보기](weeks/week-01/repos/03-boykopovar--anyps5/) |
| [mattpocock/skills](https://github.com/mattpocock/skills) | 코딩 에이전트 작업 지침 모음 | 1 | [보기](weeks/week-01/repos/04-mattpocock--skills/) |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | 편집 디자인 스타일 다이어그램 스킬 | 1 | [보기](weeks/week-01/repos/05-cathrynlavery--diagram-design/) |
| [NationalSecurityAgency/ghidra](https://github.com/NationalSecurityAgency/ghidra) | headless 정적 분석과 PDB 없는 함수 의미 복원 | 1 | [보기](weeks/week-01/repos/06-nationalsecurityagency--ghidra/) |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | HTML·CSS 기반 재현 가능한 영상 렌더링 | 1 | [보기](weeks/week-01/repos/07-heygen-com--hyperframes/) |
| [mksglu/context-mode](https://github.com/mksglu/context-mode) | 에이전트 도구 출력·컨텍스트 관리 | 1 | [보기](weeks/week-01/repos/08-mksglu--context-mode/) |
| [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) | authored Python model의 STEP·STL 생성과 geometry 검증 | 1 | [보기](weeks/week-01/repos/09-earthtojake--text-to-cad/) |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Claude 플러그인 디렉터리와 prompt-only 코드 단순화 지침 | 1 | [보기](weeks/week-01/repos/10-anthropics--claude-plugins-official/) |

> 아직 조사하지 않은 저장소의 설명은 Week 01 입력 문서의 후보 설명이며, 공식 사실로 확정하지 않는다.

## Weekly Archive

- [Week 01](weeks/week-01/) · 10개 등장 · 완료 10

## 운영 원칙

1. 주간 MD를 원문 그대로 `weeks/week-NN/source.md`에 보존한다.
2. URL을 `github.com/<owner>/<repo>` 기준으로 정규화하고 [`catalog/repositories.yaml`](catalog/repositories.yaml)에서 중복과 Stack을 확인한다.
3. 신규 저장소는 GitHub 원격 원문으로 악성 행위 가능성을 먼저 검토한다. clone, 설치, 실행 판정은 서로 분리한다.
4. 안전 범위가 확인된 고정 commit만 임시 clone하고, 적용 전·후를 같은 입력과 평가 기준으로 비교한다.
5. 토큰, 시간, 성공률, 오류 수, 결과물 품질 등 저장소 성격에 맞는 지표를 기록한다. 측정하지 않은 개선 수치는 만들지 않는다.
6. 실습 후 원본 clone, 의존성, 캐시와 중간 산출물을 삭제한다.
7. 저장소 폴더에는 보고서, 직접 만든 `project/`, 최소 `artifacts/`만 남긴다.

보안 검토는 악성코드 부재를 보증하는 절차가 아니다. 확인한 commit과 실행 범위에서 발견한 위험을 기록하고, 불확실하면 실행을 보류하는 위험 기반 판정이다.

## 상태 기준

| 상태 | 의미 |
|---|---|
| 대기 | 주간 목록에만 등록됐으며 보안 검토를 시작하지 않음 |
| 검토 중 | 원격 소스·라이선스·스크립트를 조사 중이며 아직 실행하지 않음 |
| 부분 완료 | 조사 또는 파생 작업은 끝났지만 합의한 실험·측정 일부가 없음 |
| 완료 | 합의한 보안 검토·실습 또는 명시적 미실행 결정·검증·보고·정리를 모두 완료 |
| 보류 | 위험, 법적 조건, 비용 또는 환경 제약으로 실행하지 않기로 결정 |

새 저장소 실습은 [저장소 보고서 템플릿](templates/repository-report.md)과 Week 01에서 만든 [Safe Repository Lab](weeks/week-01/repos/04-mattpocock--skills/project/safe-repo-lab/SKILL.md)을 따른다.
