# Week 01 · Rank 05 · cathrynlavery/diagram-design 실습 보고서

- 확인일: 2026-10-20
- 원본 URL: https://github.com/cathrynlavery/diagram-design
- 기본 브랜치: `main`
- 분석한 commit SHA: `f2f4d49ea8d632f17cf196ba26599277a93f767b`
- commit 일시: 2026-10-20 00:01:03 UTC
- 라이선스: MIT License
- 실행 결과: 성공

## 공식 목적

`diagram-design`은 AI 코딩 에이전트가 편집 디자인 스타일의 다이어그램을 만들도록 안내하는 스킬이다. 결과물은 CSS와 SVG를 포함한 단일 HTML 파일이며, README 기준으로 아키텍처, 흐름도, 시퀀스, 데이터 모델 등 45개 시각 유형을 지원한다.

Claude Code, Codex, GitHub Copilot, Cursor, Gemini CLI, OpenCode 등 여러 에이전트용 설치 방법을 제공한다. 이번 실습에서는 에이전트 플러그인을 설치하지 않고 고정 commit의 문서와 검사 도구만 참고했다.

## 환경

- 운영체제: Windows
- Git: 2.21.0.windows.1
- 브라우저 검증: Playwright가 제공하는 Chromium
- 결과 형식: 정적 HTML + 인라인 SVG
- 네트워크 의존성: 없음
- 추가 패키지 설치: 없음

## 검토한 파일

- `README.md`
- `LICENSE`
- `PRIVACY.md`
- `skills/diagram-design/SKILL.md`
- `skills/diagram-design/references/type-architecture.md`
- `skills/diagram-design/references/style-guide.md`
- `skills/diagram-design/references/output-spec.md`
- `skills/diagram-design/assets/template.html`
- `skills/diagram-design/scripts/self_check.py`
- 루트 `scripts/` 파일 목록

## 위험 검토

- 공식 설치 명령은 플러그인 또는 에이전트 설정 경로에 파일을 추가할 수 있다.
- 자동 업데이트를 사용하면 이후 원격 변경이 로컬 환경에 반영될 수 있다.
- 기본 글꼴 설정은 브라우저에서 Google Fonts로 요청을 보낸다.
- 웹사이트 기반 브랜드 온보딩은 대상 사이트에 네트워크 요청을 보낸다.
- PNG 내보내기는 Python Playwright와 Chromium 설치가 필요하다.
- 저장소에는 여러 Python 생성·검사 스크립트가 있으므로 검토 없이 전체 실행하지 않았다.

이 실습에서는 플러그인 설치, 자동 업데이트, 브랜드 온보딩, PNG 내보내기를 사용하지 않았다. 시스템 글꼴만 사용하고 외부 이미지, JavaScript와 원격 스타일시트를 제외했다.

## 실습 설계

다음 네 가지 결정을 먼저 고정했다.

- 시각 유형: Architecture
- 크기: `doc-inline` (`960 × 600`)
- 상세도: balanced
- 독자: mixed

주제는 “원본을 배우고, 내 작업만 남기는 흐름”이다. 공식 소스 조사에서 개인 GitHub 게시까지 이어지는 일곱 단계를 하나의 왼쪽→오른쪽 흐름으로 표현했다.

## 실제 명령

원본은 게시 대상에서 제외되는 `_sources/` 아래에 복제했다.

```powershell
git clone --depth 1 https://github.com/cathrynlavery/diagram-design.git _sources/diagram-design
git -C _sources/diagram-design checkout --detach f2f4d49ea8d632f17cf196ba26599277a93f767b
git -C _sources/diagram-design rev-parse HEAD
```

오프라인 안전성과 접근성 계약은 원본에 포함된 검사기로 확인했다.

```powershell
python _sources/diagram-design/skills/diagram-design/scripts/self_check.py `
  --offline weeks/week-01/repos/05-cathrynlavery--diagram-design/project/github-top10-lab.html
```

검사 결과:

```text
OK ...\projects\02-diagram-design\github-top10-lab.html
```

브라우저 검증을 위해 작업 폴더를 `127.0.0.1`에만 임시 제공했다.

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

검증을 마친 뒤 임시 서버를 종료하고 원본 clone과 브라우저 자동화 임시 로그를 삭제했다. 다시 검증할 때는 위의 고정 commit으로 원본을 재복제한다.

## 직접 만든 산출물

- [HTML+SVG 다이어그램](project/github-top10-lab.html)
- [데스크톱 검증 화면](artifacts/desktop.png)
- [모바일 검증 화면](artifacts/mobile.png)

HTML과 SVG 마크업은 직접 작성했다. 원본 템플릿과 예제 파일을 복사하지 않았으며, 원본의 아키텍처 선택 기준, 접근성 계약, 색상 역할, 연결선과 모바일 스크롤 규칙을 학습 기준으로 사용했다.

## 검증 결과

- 원본 고정 commit 확인: 성공
- 원본 `self_check.py --offline`: 통과
- SVG 접근성 이름과 설명 노출: 성공
- 데스크톱 1280px: 페이지 가로 넘침 없음
- 모바일 390px: 페이지 가로 넘침 없음
- 모바일 다이어그램: 전용 영역에서 수평 스크롤
- 외부 글꼴, 이미지, 스크립트 요청: 없음
- 브라우저 콘솔: 문서 동작 오류 없음. 개발 서버에 `favicon.ico`가 없어 404 한 건 발생

HTML용 LSP로 설정된 Biome 실행 파일이 로컬에 없어 LSP 진단은 수행하지 못했다. 새 패키지를 설치하지 않는다는 실습 범위를 유지하고 원본 검사기와 브라우저 렌더링으로 검증했다.

## 배운 점

- SVG의 의미 구조와 접근성 정보도 시각적 완성도만큼 중요하다.
- 색상을 많이 쓰기보다 초점 산출물에만 한 가지 강조색을 쓰면 흐름이 명확하다.
- 모바일에서는 SVG를 축소해 글자를 작게 만드는 대신 다이어그램 영역에만 스크롤을 제공할 수 있다.
- 외부 글꼴을 제거하면 재현성이 높아지고 불필요한 네트워크 요청을 막을 수 있다.
- 참고 저장소의 코드를 복제하지 않아도 설계 규칙을 학습해 독자적인 결과물을 만들 수 있다.

## 유지보수·비용·안전성 평가

단일 정적 HTML이라 실행 비용과 유지보수 부담이 낮다. 인라인 SVG는 텍스트 diff가 길어질 수 있으므로 자주 변경되는 운영 문서에는 Mermaid가 더 적합할 수 있다. 게시용 다이어그램이나 포트폴리오 결과물에는 현재 방식이 적합하다.

## 정리 결과

실습과 용량 정리를 완료했다. 저장소 폴더에는 직접 작성한 HTML+SVG, 검증 스크린샷과 이 보고서만 남겼다.
