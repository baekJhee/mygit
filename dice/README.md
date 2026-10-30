# 🎲 3D 주사위 던지기 (Interactive 3D Game)

순수 HTML5, CSS3, Vanilla JavaScript 및 Web Audio API를 활용한 실감나는 3D 인터랙티브 주사위 게임입니다.

---

## 📖 문서 바로가기
- **상세 기획서 및 요구사항 명세서**: [DICE_PROJECT_PLAN.md](DICE_PROJECT_PLAN.md)

---

## 🚀 주요 특징 (Key Features)

- **Pure Web 3D**: 외부 그래픽 라이브러리(Three.js 등) 없이 CSS `perspective` 및 `transform-style: preserve-3d`만으로 입체 정육면체 구현
- **Zero-Dependency Sound**: 외부 음원 파일(mp3/wav) 없이 Web Audio API 신시사이저로 롤링음 및 바닥 안착음 실시간 절차적 합성
- **1개 / 2개 주사위 모드**: 주사위 개수 전환 및 2개 모드 시 눈금 합계 + 개별 분해 표기
- **럭키 더블(Lucky Double) 시스템**: 두 눈금이 일치할 때 화려한 배지 연출 및 히스토리 강조
- **히스토리 기록 관리**: 최근 8회의 결과를 칩 형태로 저장 및 원클릭 초기화
- **3-Way 테마 시스템**: 시스템 설정 동기화 / 라이트 모드 / 다크 모드 전환 (LocalStorage 연동)
- **키보드 단축키 지원**: <kbd>Space</kbd> 키를 통한 간편 롤링
- **SVG 벡터 에셋 적용**: 모든 해상도에서 선명한 주사위 눈금 렌더링 (`images/dice_1.svg` ~ `dice_6.svg`)

---

## 📂 파일 구조

```plaintext
dice/
├── dice_index.html        # 메인 웹 페이지 마크업
├── css/
│   └── style.css          # 3D Transform, 글래스모피즘, 반응형 스타일시트
├── js/
│   └── main.js            # 주사위 롤링 로직, Web Audio SFX, 상태 관리
├── images/
│   ├── dice_1.svg ~ dice_6.svg  # 주사위 눈금 SVG 파일
├── DICE_PROJECT_PLAN.md   # 상세 프로젝트 기획서 및 요구사항 명세서
└── README.md              # 프로젝트 안내 문서
```

---

## 💻 실행 방법

1. 브라우저(Chrome, Edge, Safari 등)에서 `dice_index.html` 파일을 바로 엽니다.
2. [주사위 던지기] 버튼을 클릭하거나 키보드 <kbd>Space</kbd> 키를 눌러 주사위를 굴립니다.
