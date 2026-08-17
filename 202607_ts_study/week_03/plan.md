# Jihui week_03 EPUB 웹 뷰어 구현 플랜

## 1. 개요
`Jihui/week_03/` 경로에 웹 브라우저 환경에서 동작하는 심플한 HTML, CSS, JavaScript 기반의 **압축 해제된 EPUB 뷰어**를 제작합니다.
URL 파라미터로 압축 해제된 EPUB 폴더 경로를 전달받아 `META-INF/container.xml` 및 OPF 메타데이터를 직접 파싱하여 첫 페이지 자동 로드, 목차(TOC) 탐색, 하단 네비게이션 바(이동 버튼 및 페이지 정보 표기)를 제공합니다.

---

## 2. 주요 요구사항 및 설계를 위한 방침

1. **디자인 및 HTML 구조: 심플함 (Minimal & Clean)**
   - 군더더기 없는 미니멀하고 직관적인 레이아웃
   - 읽기 환경에 집중할 수 있는 깔끔한 상단 헤더, 본문 뷰어, 하단 이동 바

2. **JS 모듈화: 기능별 파일 분리 (Maintainable JS Modules)**
   - 나중에 코드를 살펴보고 수정하기 쉽도록 기능 단위로 JS 파일을 분리
   - `js/epub-parser.js` : `container.xml`, `content.opf`, TOC XML/HTML 파싱 전담
   - `js/toc.js` : 목차 리스트 생성, 토글 및 이동 관리 전담
   - `js/navigation.js` : 이전/다음 페이지 이동, 하단 바 카운터(`1 / 4`), 키보드 단축키 관리 전담
   - `js/main.js` : URL 파라미터 수신 및 전체 모듈 조율 (Main Entrypoint)

3. **EPUB 압축 해제 폴더 URL 파라미터 로딩**
   - URL 예시: `index.html?path=./sample_epub` 또는 `index.html?folder=./sample_epub`
   - `fetch()` API로 `${path}/META-INF/container.xml`을 읽어 OPF 경로 추출
   - OPF 파일의 `<manifest>` 및 `<spine>` 파싱하여 읽기 순서(Spine) 및 문서 리소스 파싱

4. **첫 페이지 자동 로드 & 반응형 뷰어**
   - Spine의 0번째 항목(커버 또는 첫 챕터)을 `<iframe>` 내에 안전하게 로드

5. **목차 (Table of Contents - TOC)**
   - EPUB 3 (`nav.xhtml`) 및 EPUB 2 (`toc.ncx`) 지원
   - 심플한 사이드바 목차 메뉴 제공 (클릭 시 해당 챕터로 이동)

6. **하단 이동 바 (Bottom Navigation Bar)**
   - 이전 페이지 (`<`), 다음 페이지 (`>`) 버튼
   - 현재 페이지 번호 및 전체 페이지 수 표시 (예: `1 / 4`)
   - 키보드 좌/우 화살표 탐색 지원

---

## 3. 디렉토리 구조

```
Jihui/week_03/
├── plan.md                # 구현 플랜 문서 (본 파일)
├── index.html             # 심플한 HTML 레이아웃
├── css/
│   └── style.css          # 깔끔하고 미니멀한 CSS 스타일
├── js/
│   ├── epub-parser.js     # [1] EPUB XML 및 구조 파서
│   ├── toc.js             # [2] 목차(TOC) 생성 및 제어
│   ├── navigation.js      # [3] 페이지 이동 및 하단 바 카운터 제어
│   └── main.js            # [4] URL 파라미터 수신 및 앱 초기화 (Main Entry)
└── sample_epub/           # 테스트용 압축 해제된 예시 EPUB 폴더
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
            └── main.css
```

---

## 4. 상세 구현 단계

- [ ] **Step 1: 샘플 EPUB 데이터 작성 (`sample_epub/`)**
  - 표준 EPUB 구조인 `container.xml`, `content.opf`, `nav.xhtml`, 커버 및 챕터 XHTML 파일 생성

- [ ] **Step 2: 기능별 JS 모듈 분리 작성 (`js/`)**
  - `epub-parser.js`: XML DOMParser 기반 container.xml, OPF, Spine, TOC 파싱 클래스
  - `toc.js`: 목차 메뉴 DOM 생성 및 클릭 이벤트 리스너 등록
  - `navigation.js`: Prev/Next 이동, 하단 카운터(`1 / 4`) 갱신, 키보드 화살표 연동
  - `main.js`: `URLSearchParams`를 통한 `path` 수신 및 전체 모듈 조율

- [ ] **Step 3: 심플 HTML & Clean CSS 작성 (`index.html`, `css/style.css`)**
  - 가독성 높은 폰트와 간결한 버튼, 깔끔한 헤더/뷰어/하단바 UI

- [ ] **Step 4: 검증 및 동작 확인**
  - `index.html?path=./sample_epub` 접속 테스트
  - 첫 페이지 자동 로드, 목차 클릭 이동, 하단 바 이전/다음 버튼 및 페이지 수 표시 동작 검증
