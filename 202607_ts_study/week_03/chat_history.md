# 백지희 week_03 EPUB 웹 뷰어 개발 대화 기록 (Chat History)

- **작성일**: 2026-08-25
- **프로젝트 경로**: `202607_ts_study/week_03/`
- **주요 주제**: EPUB 웹 뷰어 개발, UMD 번들 모듈 분리, 형광펜/드로잉 제어, 북마크 기능 추가 및 로컬 스토리지 연동

---

## 1. 대화 및 개발 진행 타임라인

### 💬 1차 요청 (초기 요구사항 전달 및 플랜 작성)
- **사용자**:
  > week_03/ 경로에 EPUB 만들거야.  
  > 웹으로 서비스 할 수 있도록 html, js, css 베이스로 해주고, EPUB 압축이 풀린 상태의 폴더 경로를 URL 파라미터로 받아서 첫 페이지가 로드 되도록 해줘.  
  > 목차도 만들거야 클릭시 해당 페이지 이동이 가능하도록.  
  > 하단에는 이동 바 만들건데 버튼으로 앞, 뒤 페이지 이동이 가능하고 총 페이지 수와 현재 페이지가 표기 되면 좋겠어.  
  > 플랜 작성해주라.

- **AI 작업**:
  - `implementation_plan.md` 및 `plan.md` 플랜 파일 작성
  - EPUB `container.xml`, `content.opf`, `nav.xhtml` 파싱 구조 및 UI 구성 계획 제시

---

### 💬 2차 요청 (디자인 및 코드 모듈화 지침)
- **사용자**:
  > html 과 디자인은 가능한 심플하게  
  > js는 기능에 따라 분리해줘 나중에 보기 편하게

- **AI 작업**:
  - 디자인 시스템을 미니멀 & 클린 독서 테마 스타일로 반영
  - JS 코드를 4개의 전담 모듈로 분리 계획 수립:
    1. `js/epub-parser.js` : EPUB XML 구조 해석
    2. `js/toc.js` : 목차 드로어 렌더링 및 클릭 이동
    3. `js/navigation.js` : 이전/다음 이동, 하단 바 카운터(`1 / 4`)
    4. `js/main.js` : URL 파라미터 수신 및 앱 초기화 엔트리포인트

---

### 💬 3차 요청 (구현 승인 및 개발 완료)
- **사용자**:
  > 굿 만들어줘

- **AI 작업**:
  - `sample_epub/` 폴더에 테스트용 표준 EPUB 데이터 구축 (`container.xml`, `content.opf`, `nav.xhtml`, 챕터 XHTML 파일들)
  - `index.html`, `css/style.css`, `js/epub-parser.js`, `js/toc.js`, `js/navigation.js`, `js/main.js` 작성 완료

---

### 💬 4차 요청 (하단 네비게이션 기능 확장)
- **사용자**:
  > 좋아 여기서 버튼 추가하자  
  > 하단 이동 버튼에 맨 첫 페이지 버튼과 맨 마지막 버튼 이동 가능하게 만들어줘

- **AI 작업**:
  - `index.html` 하단 바에 `⏮ 처음` (`#btn-first`), `마지막 ⏭` (`#btn-last`) 버튼 추가
  - `js/navigation.js`에 `first()`, `last()` 메서드 구현
  - `Home` 키(첫 페이지 이동) 및 `End` 키(마지막 페이지 이동) 키보드 단축키 지원 추가

---

### 💬 5차 요청 (UMD 라이브러리 상단 코드 설명)
- **사용자**:
  > 202607_ts_study/week_03/lib-drawing-board.umd 제일 상단에 있는 3줄까지 있는건 뭐야? 왤케 길어

- **AI 답변**:
  - `lib-drawing-board.umd.js` 번들 파일이 배포 용량을 줄이기 위해 압축(Minify)되어 한 줄로 길게 이어져 있음을 설명.
  - 상단 코드가 UMD(Universal Module Definition) 래퍼 패턴이며, Lit Element 웹 컴포넌트 프레임워크 및 Lodash 유틸리티가 함께 포함되어 있음을 해설.

---

### 💬 6차 요청 (드로잉 라이브러리 모듈 분리 작업)
- **사용자**:
  > 흠 3줄 아래 있는건 분리 가능해?  
  > 분리해줘

- **AI 작업**:
  - 번들 내부의 핵심 클래스들을 독립 ES 모듈 3개로 분리 생성:
    1. [`js/drawing-board/DrawingIO.js`](file:///c:/Users/qorgg/Desktop/git/mygit/202607_ts_study/week_03/js/drawing-board/DrawingIO.js): 스트로크 데이터 변환, 2분할(양면) 모드 정밀 컷팅/스케일 유틸리티
    2. [`js/drawing-board/DrawingController.js`](file:///c:/Users/qorgg/Desktop/git/mygit/202607_ts_study/week_03/js/drawing-board/DrawingController.js): 보드 상태(펜/지우개), Undo/Redo 히스토리, 드래그/지우개 영역 충돌 판정
    3. [`js/drawing-board/DrawingBoard.js`](file:///c:/Users/qorgg/Desktop/git/mygit/202607_ts_study/week_03/js/drawing-board/DrawingBoard.js): LitElement 기반 `<lib-drawing-board>` Web Component 렌더링 클래스
  - 기존 [`js/lib-drawing-board.umd.js`](file:///c:/Users/qorgg/Desktop/git/mygit/202607_ts_study/week_03/js/lib-drawing-board.umd.js) 파일에도 주석 구분(`[섹션 1]`~`[섹션 4]`)을 적용하여 가독성 개선.

---

### 💬 7차 요청 (형광펜 기본 색상 설정 및 툴바 선택 인터랙션 수정)
- **사용자**:
  > 형광펜 기본 색 조절은 어디서해?  
  > 형관펜 클릭시 active 가 data-color="#eab308" 에 붙으면 좋겠어

- **AI 작업**:
  - `DrawingController.js`의 `DEFAULT_TOOL_CONFIGS` 내 `highlighter.color` 설정 위치 안내.
  - `js/drawing.js`의 `setTool` 함수를 수정하여 형광펜 클릭 시 노란색 칩(`data-color="#eab308"`)에 `active` 클래스가 자동으로 추가되고 선택되도록 개선.

---

### 💬 8차 요청 (드로잉 데이터 저장 위치 질문)
- **사용자**:
  > 드롱잉 한건 어디에 저장 되는거야?

- **AI 답변**:
  - 브라우저 `localStorage`에 `epub_drawing_data_${bookId}_${pageKey}` 키 형식으로 JSON 텍스트 형태로 자동 저장됨을 설명.
  - 크롬 개발자 도구(F12) ➔ `Application` ➔ `Local Storage`에서 데이터를 조회 및 관리하는 방법 안내.

---

### 💬 9차 요청 (북마크 기능 신규 추가)
- **사용자**:
  > 북마크 기능 추가하고 싶어

- **AI 작업**:
  - [`js/bookmark.js`](file:///c:/Users/qorgg/Desktop/git/mygit/202607_ts_study/week_03/js/bookmark.js) (`BookmarkManager` 클래스) 신규 생성 및 `localStorage` (`epub_bookmarks_${bookId}`) 연동.
  - [`index.html`](file:///c:/Users/qorgg/Desktop/git/mygit/202607_ts_study/week_03/index.html) 상단 헤더에 `북마크` 토글 버튼(`btn-bookmark-toggle`) 추가 (현재 페이지 북마크 등록 시 "북마크됨" 강조 표시).
  - 사이드바 drawer 상단에 **📁 목차** 및 **북마크 (개수)** 탭 버튼 추가.
  - 북마크 항목 클릭 시 해당 챕터로 즉시 이동 및 개별 삭제(`✕`) 버튼 추가.
  - [`css/style.css`](file:///c:/Users/qorgg/Desktop/git/mygit/202607_ts_study/week_03/css/style.css)에 북마크 탭 및 항목 스타일 정의.

---

### 💬 10차 요청 (대화 기록 정리 .md 파일 생성)
- **사용자**:
  > 했던 대화 .md 파일로 만드어주라

- **AI 작업**:
  - 본 `chat_history.md` 파일 업데이트 완료.

---

## 2. 프로젝트 파일 구조 요약

```
202607_ts_study/week_03/
├── chat_history.md             # 대화 기록 및 개발 과정 정리 (본 문서)
├── plan.md                     # 초기 구현 플랜 문서
├── prompt.md                   # 프롬프트 가이드 문서
├── index.html                  # EPUB 뷰어 메인 HTML (페이지 제목: EPUB 웹 뷰어_백지희)
├── css/
│   └── style.css               # 심플 & 클린 독서 테마 및 북마크/드로잉 스타일 CSS
├── js/
│   ├── main.js                 # 메인 초기화 및 모듈 통합 관리 엔트리포인트
│   ├── epub-parser.js          # EPUB OPF/NAV XML 파서
│   ├── toc.js                  # 목차 UI 및 사이드바 탭 제어 모듈
│   ├── navigation.js           # 하단 네비게이션 및 키보드 단축키 모듈
│   ├── drawing.js              # 드로잉 매니저 및 localStorage 연동 모듈
│   ├── bookmark.js             # [신규] 북마크 등록/해제/목록 관리 모듈
│   ├── lib-drawing-board.umd.js # 드로잉 보드 UMD 번들 (주석 정돈 완료)
│   └── drawing-board/          # [신규] UMD 분리 원본 ES 모듈
│       ├── DrawingIO.js         # 드로잉 데이터 변환 및 2분할 컷팅 유틸리티
│       ├── DrawingController.js # 드로잉 보드 툴/상태 제어 클래스
│       └── DrawingBoard.js      # <lib-drawing-board> Web Component 클래스
└── sample_epub/                # 테스트용 샘플 EPUB 데이터
    └── OEBPS/
        ├── content.opf
        ├── nav.xhtml
        ├── chapter1.xhtml
        ├── chapter2.xhtml
        ├── chapter3.xhtml (이동 버튼)
        ├── chapter4.xhtml (북마크, 드로잉 안내)
        └── css/
            └── epub.css
```

---

## 3. 실행 및 서비스 확인 방법

웹 서버(VS Code Live Server 등)를 통해 아래 URL로 접속하여 전체 기능(EPUB 파싱, 네비게이션, 드로잉, 북마크)을 테스트할 수 있습니다:

```
http://localhost:5500/202607_ts_study/week_03/index.html?path=./sample_epub
```
