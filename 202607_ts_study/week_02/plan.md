# 웹 기반 EPUB 뷰어 기획 및 구현 플랜 (Web-based EPUB Viewer Plan)

이 문서는 웹 서비스에 연동 가능한 압축 해제(Uncompressed) EPUB 뷰어의 제품 기획, 기능 명세 및 기술 구현 플랜을 정의합니다.

---

## 1. 제품 핵심 목표 (Core Goal)

- 사용자가 별도의 앱 설치 없이 웹 브라우저만으로 EPUB 책(압축 해제된 디렉터리 포맷)을 즉시 열람할 수 있는 웹 뷰어 제공.
- URL 파라미터(`?url=`, `?path=`, `?epub=`)를 통해 EPUB 폴더 위치를 동적으로 전달받아 **첫 번째 페이지(Spine Item)**를 자동으로 분석 및 로드.

---

## 2. 사용자 경험 시나리오 (User Flow)

1. **진입 (URL Entry)**:
   - 사용자가 `viewer.html?url=./sample-book` 과 같은 파라미터를 포함한 링크에 접속합니다.
2. **로딩 & 파싱 (Loading & Parsing)**:
   - 화면에 심플하고 세련된 로딩 스피너가 표시됩니다.
   - 백그라운드 엔진이 `META-INF/container.xml` → OPF 파일(`content.opf`) → `<spine>` 읽기 순서를 순차적으로 탐색합니다.
3. **첫 페이지 자동 렌더링 (First Page Load)**:
   - 분석된 첫 번째 챕터(또는 표지) XHTML 문서를 `iframe` 내부에 안전하게 렌더링합니다.
4. **독서 및 조작 (Reading & Navigation)**:
   - 이전/다음 버튼, 키보드 화살표 키, 목차(TOC) 사이드바 드로어, 테마(Light/Sepia/Dark) 변경 기능을 활용해 자유롭게 도서를 감상합니다.

---

## 3. 핵심 기능 명세 (Feature Specifications)

| 구분 | 기능 명 | 상세 설명 |
|---|---|---|
| **URL 파라미터 연동** | Dynamic EPUB Path | `?url=`, `?path=`, `?epub=` 파라미터를 통해 대상 EPUB 폴더 위치 수신 |
| **자동 구조 분석** | EPUB Standard Parser | `container.xml` 파싱 후 OPF 위치 추적, Manifest 및 Spine 파싱하여 첫 페이지 자동 도출 |
| **독립 렌더링** | Isolated `iframe` | 본문 XHTML과 CSS를 `iframe` 내부에 격리하여 메인 UI 스타일과의 충돌 방지 |
| **페이지 네비게이션** | Page & Progress Control | 이전/다음 챕터 이동, 진행률 퍼센트 바 표시, 전체 챕터 카운터 출력 |
| **목차 사이드바** | TOC Drawer | 좌측 슬라이딩 목차 메뉴로 원하는 챕터로 직관적 이동 |
| **다중 테마 지원** | Multi-Theme Switcher | Light, Sepia, Dark 모드를 제공하여 읽기 편의성 제공 |
| **예외 처리 UI** | Error Handler Overlay | 유효하지 않은 경로 접속 시 친절한 안내 문구 및 경로 재입력 창 제공 |

---

## 4. 기술 아키텍처 (Technical Architecture)

- **프론트엔드 스택**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **디렉터리 구조 (`Jihui/week_02/`)**:
  - `viewer.html` / `viwer.html`: 뷰어 레이아웃 마크업
  - `style.css`: 테마, 반응형 뷰어 UI 디자인
  - `app.js`: EPUB DOMParser 엔진, URL 파라미터 제어, iframe 렌더링
  - `sample-book/`: 검증용 샘플 EPUB 디렉터리 (`container.xml`, `content.opf`, `cover.xhtml`, `chapter1.xhtml`, `chapter2.xhtml`, `style.css`)

---

## 5. 검증 계획 (Verification Plan)

- **정상 경로 접속 검증**: `viewer.html?url=./sample-book` 접속 시 로딩 오버레이 후 `cover.xhtml`이 첫 페이지로 정상 로드되는지 확인
- **페이지 이동 검증**: 다음 버튼(`>`) 및 키보드 우측 화살표(`→`) 클릭 시 `chapter1.xhtml`로 부드럽게 전환되는지 확인
- **목차 선택 검증**: 목차 사이드바에서 특정 챕터 클릭 시 해당 위치로 즉시 이동하는지 확인
- **예외 처리 검증**: `viewer.html?url=invalid-path` 로 접속 시 오류 안내 카드 및 경로 재입력 폼이 노출되는지 확인
