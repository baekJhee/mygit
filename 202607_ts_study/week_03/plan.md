# Jihui week_03 EPUB 웹 뷰어 및 드로잉 보드 구현 플랜

## 1. 개요
`Jihui/week_03/` 경로에 웹 브라우저 환경에서 동작하는 심플한 HTML, CSS, JavaScript 기반의 **압축 해제된 EPUB 뷰어** 및 **스마트 드로잉 보드(필기) 라이브러리 연동** 기능입니다.
URL 파라미터로 압축 해제된 EPUB 폴더 경로를 전달받아 메타데이터 파싱, 목차 탐색, 페이지 네비게이션을 제공하며, `lib-drawing-board` 라이브러리를 통해 EPUB 문서 위에 자유로운 필기 및 스크롤 동기화, 새로고침 기록 유지를 제공합니다.

---

## 2. 주요 요구사항 및 설계를 위한 방침

1. **디자인 및 HTML 구조: 심플함 (Minimal & Clean)**
   - 군더더기 없는 미니멀하고 직관적인 레이아웃
   - 읽기 환경에 집중할 수 있는 깔끔한 상단 헤더, 본문 뷰어, 플로팅 드로잉 툴바, 하단 이동 바

2. **JS 모듈화: 기능별 파일 분리 (Maintainable JS Modules)**
   - 나중에 코드를 살펴보고 수정하기 쉽도록 기능 단위로 JS 파일을 분리
   - `js/epub-parser.js` : `container.xml`, `content.opf`, TOC XML/HTML 파싱 전담
   - `js/toc.js` : 목차 리스트 생성, 토글 및 이동 관리 전담
   - `js/navigation.js` : 이전/다음 페이지 이동, 하단 바 카운터(`1 / 4`), 키보드 단축키 관리 전담
   - `js/drawing.js` : 드로잉 보드 툴 제어, 색상/굵기/지우기, LocalStorage 자동 저장 및 스크롤 동기화 전담
   - `js/main.js` : URL 파라미터 수신 및 전체 모듈 조율 (Main Entrypoint)

3. **EPUB 압축 해제 폴더 URL 파라미터 로딩**
   - URL 예시: `index.html?path=./sample_epub` 또는 `index.html?folder=./sample_epub`
   - `fetch()` API로 `${path}/META-INF/container.xml`을 읽어 OPF 경로 추출
   - OPF 파일의 `<manifest>` 및 `<spine>` 파싱하여 읽기 순서(Spine) 및 문서 리소스 파싱

4. **스마트 드로잉 보드 기능 (`lib-drawing-board` 연동)**
   - ✏️ **펜 쓰기 (Pen)**: 선 그리기 기능
   - 🖌️ **형광펜 (Highlighter)**: 텍스트가 투명하게 강조되는 반투명 `multiply` 블렌드 필기 (20px)
   - 🧹 **지우개 (Eraser)**: 작성된 스트로크 삭제
   - 🎨 **색상 변경**: 색상 칩(파랑, 검정, 빨강, 초록, 노랑) 및 커스텀 Color Picker
   - 📏 **선 굵기 조절 (Line Width)**: `1px ~ 50px` 조절 슬라이더 및 수치 표시
   - 🗑️ **모두 지우기 (Clear All)**: 현재 페이지 필기 전체 삭제
   - 💾 **새로고침 & 페이지별 기록 유지 (LocalStorage)**: `drawing-end` 이벤트 시 `localStorage`에 자동 저장되어 새로고침(F5)이나 챕터 이동 후 복원
   - 📜 **스크롤 동기화 (Scroll Sync)**: EPUB 본문 문서 길이 및 스크롤 위치(`scrollTop`)와 드로잉 레이어(`translate3d`) 동기화로 본문 스크롤 시 필기 내용도 함께 이동
   - ⚖️ **스크롤바 위치 흔들림 방지**: `html { overflow-y: scroll; scrollbar-gutter: stable; }` 적용으로 페이지 간 가로 위치 고정

---

## 3. 디렉토리 구조

```
Jihui/week_03/
├── plan.md                    # 구현 플랜 문서 (본 파일)
├── prompt.md                  # 프롬프트 요청 기록 문서
├── index.html                 # 심플한 HTML 레이아웃 및 툴바
├── css/
│   └── style.css              # 깔끔하고 미니멀한 CSS 스타일 및 툴바 오버레이
├── js/
│   ├── lib-drawing-board.umd.js # [0] 드로잉 보드 UMD 번들 라이브러리
│   ├── epub-parser.js         # [1] EPUB XML 및 구조 파서
│   ├── toc.js                 # [2] 목차(TOC) 생성 및 제어
│   ├── navigation.js          # [3] 페이지 이동 및 하단 바 카운터 제어
│   ├── drawing.js             # [4] 드로잉 보드, 저장/복원 및 스크롤 동기화 매니저
│   └── main.js                # [5] URL 파라미터 수신 및 앱 전체 초기화 (Main Entry)
└── sample_epub/               # 테스트용 압축 해제된 예시 EPUB 폴더
    ├── META-INF/
    │   └── container.xml
    └── OEBPS/
        ├── content.opf
        ├── nav.xhtml
        ├── cover.xhtml
        ├── chapter1.xhtml
        ├── chapter2.xhtml
        ├── chapter3.xhtml
        └── css/
            └── epub.css
```

---

## 4. 상세 구현 및 완료 단계

- [x] **Step 1: 샘플 EPUB 데이터 작성 (`sample_epub/`)**
  - 표준 EPUB 구조인 `container.xml`, `content.opf`, `nav.xhtml`, 커버 및 챕터 XHTML 파일 생성

- [x] **Step 2: 기능별 JS 모듈 분리 작성 (`js/`)**
  - `epub-parser.js`: XML DOMParser 기반 container.xml, OPF, Spine, TOC 파싱 클래스
  - `toc.js`: 목차 메뉴 DOM 생성 및 클릭 이벤트 리스너 등록
  - `navigation.js`: Prev/Next 이동, 하단 카운터(`1 / 4`) 갱신, 키보드 화살표 연동
  - `drawing.js`: 드로잉 툴, 색상/굵기, LocalStorage 자동 저장 및 스크롤 동기화 매니저
  - `main.js`: `URLSearchParams`를 통한 `path` 수신 및 전체 모듈 조율

- [x] **Step 3: 드로잉 보드 UI & Clean CSS 작성 (`index.html`, `css/style.css`)**
  - 펜, 형광펜, 지우개, 색상 칩, 굵기 슬라이더, 모두 지우기 버튼 및 오버레이 CSS 레이아웃

- [x] **Step 4: 검증 및 동작 확인**
  - `index.html?path=./sample_epub` 접속 테스트
  - 첫 페이지 자동 로드, 목차 클릭 이동, 하단 바 이전/다음 버튼 및 페이지 수 표시 동작 검증
  - 드로잉 펜/형광펜/지우개, 색상 및 굵기 조절, 새로고침 시 기록 유지, 스크롤 동기화 동작 검증 완료
