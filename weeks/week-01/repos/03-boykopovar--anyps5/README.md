# Week 01 · Rank 03 · boykopovar/AnyPS5 검토 보고서

- 확인일: 2026-10-29
- 원본 URL: https://github.com/boykopovar/AnyPS5
- 확인한 기본 브랜치: `main`
- 분석 기준 commit: `3a2b91981651569163768854a1fcdc7193b6667b` (2026-10-28)
- 기준 tree: `edba1504b30160aa1c6187e5df93c78056381e03`
- 확인한 최신 릴리스: `v0.1.3` (2026-10-20, mutable release)
- 라이선스: GPL-2.0-only
- 상태: 완료 (실행하지 않음)

## 프로젝트 성격

AnyPS5는 PS5 형식의 실행 파일과 모듈을 Linux, Windows 또는 macOS용 native executable로 재링크하는 C++20 도구다. 원격 README는 독립 실행 런타임이나 에뮬레이터가 아니라 relinker와 system PRX library 구현을 제공한다고 설명한다.

## 원격 보안 검토

공식 GitHub API와 기준 commit의 raw 파일만 읽었다. `main`의 최신 commit은 GitHub가 검증한 서명을 가진 merge commit이지만, 최신 `v0.1.3` release 자체는 immutable이 아니다. 기준 tree에는 23개의 third-party Git submodule이 있고, full build는 submodule 초기화와 CMake/Ninja/C++ toolchain을 요구한다. Windows full build 문서는 FFmpeg binary 다운로드, Git for Windows Bash 실행, PowerShell script 실행을 명시한다.

공식 release에는 `relinker-v0.1.3.exe`와 Linux/Windows PRX archives가 포함되어 있지만, 이 검토에서는 release asset, source archive, submodule, build dependency를 내려받거나 실행하지 않았다.

## 실행 경계와 판단

Usage 문서는 입력으로 clean ELF를 요구하고, decrypted SELF container를 unwrap하는 Python 도구와 입력 executable/module의 byte patch 적용 기능을 안내한다. 변환된 title은 host의 일반 사용자 권한으로 실행되어 사용자 계정이 접근할 수 있는 파일을 읽고 쓸 수 있으며, 문서도 별도 사용자·container·VM에서 신뢰 가능한 title만 실행하라고 명시한다.

원본 README는 firmware, cryptographic key, proprietary library를 포함·배포·요구하지 않는다고 밝히지만, 실제 변환 대상은 사용자가 법적으로 취득하고 사용할 책임이 있는 binary다. 이번 실습에는 저작권·DRM 우회와 무관한 검증 가능한 입력 executable이 없고, 임의 release binary를 실행하는 것은 현재 안전 경계를 넘는다. 따라서 clone, build, binary download, relinking, patching, title 실행은 하지 않았다.

## 직접 작성한 결과

이 보고서는 remote provenance, release/build surface, native code-execution boundary 및 실행 보류 판단을 정리한 직접 작성 결과다. 제3자 source, binary, game data, firmware, key, decrypted container, cache 또는 runtime artifact는 보관하지 않는다.

## 재개 조건

향후에는 다음 조건을 모두 만족할 때만 별도 실습을 검토한다.

1. 소유·사용 권한이 명확한 homebrew 또는 공개 허가 test input을 사용한다.
2. clone·submodule·build 전 revision과 dependency hash를 고정하고 격리 환경을 사용한다.
3. relinker가 만든 실행 파일을 사용자 파일과 분리된 VM 또는 별도 계정에서 실행한다.
4. 복호화·키·firmware·상용 title·우회 도구·patch catalog는 입력 또는 산출물로 사용하지 않는다.

## 확인 근거

- Repository metadata: https://api.github.com/repos/boykopovar/AnyPS5
- Pinned commit: https://api.github.com/repos/boykopovar/AnyPS5/commits/3a2b91981651569163768854a1fcdc7193b6667b
- Tree: https://api.github.com/repos/boykopovar/AnyPS5/git/trees/edba1504b30160aa1c6187e5df93c78056381e03?recursive=1
- README: https://raw.githubusercontent.com/boykopovar/AnyPS5/3a2b91981651569163768854a1fcdc7193b6667b/README.md
- Usage: https://raw.githubusercontent.com/boykopovar/AnyPS5/3a2b91981651569163768854a1fcdc7193b6667b/docs/user/USAGE.md
- Build: https://raw.githubusercontent.com/boykopovar/AnyPS5/3a2b91981651569163768854a1fcdc7193b6667b/docs/dev/BUILD.md
- Submodules: https://raw.githubusercontent.com/boykopovar/AnyPS5/3a2b91981651569163768854a1fcdc7193b6667b/.gitmodules
- Release: https://api.github.com/repos/boykopovar/AnyPS5/releases/tags/v0.1.3
