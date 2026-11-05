/**
 * app.js
 * 스마트 전자칠판 메인 컨트롤러
 * - 이미지 옵션 순서 적용: [텍스트 그룹] -> [펜 그룹] -> [제어 그룹]
 * - 분리된 텍스트/펜 색상 드롭다운 & 폰트크기(10~100px 10단위) / 선굵기 드롭다운
 * - 단일 드래그 지우개 버튼 및 일체형 보드 제어
 */

class SmartBoardApp {
    constructor() {
        // DOM 엘리먼트 캐싱 - 보드 영역
        this.boardFrame = document.getElementById('board-frame');
        this.boardContainer = document.getElementById('single-board-container');
        this.boardTextarea = document.getElementById('board-textarea');
        this.drawingBoard = document.getElementById('drawing-board');
        this.eraserCursor = document.getElementById('eraser-cursor');
        this.boardModeText = document.getElementById('board-mode-text');

        // [Group 1: 텍스트 관련 엘리먼트]
        this.btnModeText = document.getElementById('btn-mode-text');
        this.dropdownFontSize = document.getElementById('dropdown-font-size');
        this.btnFontSizeToggle = document.getElementById('btn-font-size-toggle');
        this.labelFontSize = document.getElementById('label-font-size');
        this.fontSizeItems = document.querySelectorAll('.font-size-menu .dropdown-item');

        this.dropdownTextColor = document.getElementById('dropdown-text-color');
        this.btnTextColorToggle = document.getElementById('btn-text-color-toggle');
        this.textColorPreview = document.getElementById('text-color-preview');
        this.textColorItems = document.querySelectorAll('#dropdown-text-color .color-item');
        this.inputTextColor = document.getElementById('input-text-color');

        // [Group 2: 펜 드로잉 관련 엘리먼트]
        this.btnModePen = document.getElementById('btn-mode-pen');
        this.dropdownPenWidth = document.getElementById('dropdown-pen-width');
        this.btnPenWidthToggle = document.getElementById('btn-pen-width-toggle');
        this.labelPenWidth = document.getElementById('label-pen-width');
        this.penWidthItems = document.querySelectorAll('.width-menu .dropdown-item');

        this.dropdownPenColor = document.getElementById('dropdown-pen-color');
        this.btnPenColorToggle = document.getElementById('btn-pen-color-toggle');
        this.penColorPreview = document.getElementById('pen-color-preview');
        this.penColorItems = document.querySelectorAll('#dropdown-pen-color .color-item');
        this.inputPenColor = document.getElementById('input-pen-color');

        // [Group 3: 제어 관련 엘리먼트]
        this.btnUndo = document.getElementById('btn-undo');
        this.btnEraser = document.getElementById('btn-eraser'); // 유일한 지우개 도구 버튼!
        this.btnClearDrawOnly = document.getElementById('btn-clear-draw-only');
        this.btnClearAll = document.getElementById('btn-clear-all');
        this.btnClearTextOnly = document.getElementById('btn-clear-text-only');
        this.btnDownload = document.getElementById('btn-download');

        // 하단 상태바
        this.statusMode = document.getElementById('status-mode');
        this.statusTextColorVal = document.getElementById('status-text-color-val');
        this.statusFontSizeVal = document.getElementById('status-font-size-val');
        this.statusPenColorVal = document.getElementById('status-pen-color-val');
        this.statusPenWidthVal = document.getElementById('status-pen-width-val');
        this.statusHint = document.getElementById('status-hint');

        // 상태값 (텍스트와 펜 속성 독립 분리!)
        this.currentMode = 'text'; // 'text' | 'draw'
        this.currentTool = 'text'; // 'text' | 'pen' | 'eraser'
        this.textColor = '#000000';
        this.currentFontSize = 30;
        this.penColor = '#000000';
        this.currentLineWidth = 4;

        this.init();
    }

    init() {
        this.initBoardSize();
        this.initBoardProperties();
        this.bindEvents();
        this.initDropdowns();

        // 초기 속성 적용
        this.setTextColor(this.textColor);
        this.setFontSize(this.currentFontSize);
        this.setPenColor(this.penColor);
        this.setLineWidth(this.currentLineWidth);
        this.setMode('text', 'text');
    }

    /**
     * 보드 크기 동기화 (ResizeObserver)
     */
    initBoardSize() {
        if (!this.drawingBoard || !this.boardContainer) return;

        const updateSize = () => {
            const rect = this.boardContainer.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.drawingBoard.width = Math.round(rect.width);
                this.drawingBoard.height = Math.round(rect.height);
            }
        };

        updateSize();
        setTimeout(updateSize, 100);

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => updateSize());
            ro.observe(this.boardContainer);
        }
    }

    /**
     * 드로잉 보드 기본 속성
     */
    initBoardProperties() {
        if (!this.drawingBoard) return;
        this.drawingBoard.tool = 'pen';
        this.drawingBoard.color = this.penColor;
        this.drawingBoard.lineWidth = this.currentLineWidth;
    }

    /**
     * 드롭다운 토글 및 바깥 클릭 시 닫기 초기화
     */
    initDropdowns() {
        const dropdowns = [
            { el: this.dropdownFontSize, toggle: this.btnFontSizeToggle },
            { el: this.dropdownTextColor, toggle: this.btnTextColorToggle },
            { el: this.dropdownPenWidth, toggle: this.btnPenWidthToggle },
            { el: this.dropdownPenColor, toggle: this.btnPenColorToggle }
        ];

        dropdowns.forEach(({ el, toggle }) => {
            if (!toggle || !el) return;
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = el.classList.contains('open');
                // 다른 모든 드롭다운 닫기
                dropdowns.forEach(d => d.el && d.el.classList.remove('open'));
                if (!isOpen) {
                    el.classList.add('open');
                }
            });
        });

        // 문서 어디든 클릭하면 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                dropdowns.forEach(d => d.el && d.el.classList.remove('open'));
            }
        });
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 1. [Group 1: 텍스트] '가' 버튼 클릭
        if (this.btnModeText) {
            this.btnModeText.addEventListener('click', () => {
                this.setMode('text', 'text');
            });
        }

        // 2. [Group 1: 텍스트] 폰트 크기 선택 (10px ~ 100px)
        this.fontSizeItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const val = parseInt(e.currentTarget.dataset.value, 10);
                this.setFontSize(val);
                this.dropdownFontSize.classList.remove('open');
                // 폰트 크기 변경 시 자동으로 텍스트 모드로 전환
                this.setMode('text', 'text');
            });
        });

        // 3. [Group 1: 텍스트] 텍스트 색상 프리셋 칩 선택
        this.textColorItems.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.setTextColor(color);
                this.dropdownTextColor.classList.remove('open');
                this.setMode('text', 'text');
            });
        });

        // 4. [Group 1: 텍스트] 텍스트 색상 직접 선택 인풋
        if (this.inputTextColor) {
            this.inputTextColor.addEventListener('input', (e) => {
                this.setTextColor(e.target.value);
            });
        }

        // 5. [Group 2: 펜] '✏️' 펜 모드 버튼 클릭
        if (this.btnModePen) {
            this.btnModePen.addEventListener('click', () => {
                this.setMode('draw', 'pen');
            });
        }

        // 6. [Group 2: 펜] 선 굵기 선택
        this.penWidthItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const val = parseInt(e.currentTarget.dataset.value, 10);
                this.setLineWidth(val);
                this.dropdownPenWidth.classList.remove('open');
                // 굵기 변경 시 펜 모드로 전환 (지우개 상태가 아니라면)
                if (this.currentTool !== 'eraser') {
                    this.setMode('draw', 'pen');
                }
            });
        });

        // 7. [Group 2: 펜] 펜 색상 프리셋 칩 선택
        this.penColorItems.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.setPenColor(color);
                this.dropdownPenColor.classList.remove('open');
                // 색상 변경 시 펜 모드로 전환
                this.setMode('draw', 'pen');
            });
        });

        // 8. [Group 2: 펜] 펜 색상 직접 선택 인풋
        if (this.inputPenColor) {
            this.inputPenColor.addEventListener('input', (e) => {
                this.setPenColor(e.target.value);
            });
        }

        // 9. [Group 3: 제어] 한단계 이전 (Undo)
        if (this.btnUndo) {
            this.btnUndo.addEventListener('click', () => this.handleUndo());
        }

        // 10. [Group 3: 제어] 드래그 지우개 도구 (유일한 지우개 버튼!)
        if (this.btnEraser) {
            this.btnEraser.addEventListener('click', () => {
                if (this.currentTool === 'eraser') {
                    // 이미 지우개면 펜으로 복귀
                    this.setMode('draw', 'pen');
                } else {
                    this.setMode('draw', 'eraser');
                }
            });
        }

        // 11. [Group 3: 제어] 그린 선만 모두 지우기 (🧹✏️)
        if (this.btnClearDrawOnly) {
            this.btnClearDrawOnly.addEventListener('click', () => {
                if (confirm('그린 선을 모두 지우시겠습니까? (글씨는 유지됩니다)')) {
                    if (this.drawingBoard && typeof this.drawingBoard.clear === 'function') {
                        this.drawingBoard.clear();
                    }
                }
            });
        }

        // 12. [Group 3: 제어] 모두 지우기 (🗑️ 글씨 + 선)
        if (this.btnClearAll) {
            this.btnClearAll.addEventListener('click', () => this.handleClearAll());
        }

        // 13. [미니 제어] 글씨만 지우기
        if (this.btnClearTextOnly) {
            this.btnClearTextOnly.addEventListener('click', () => {
                if (this.boardTextarea && this.boardTextarea.value.trim()) {
                    if (confirm('입력한 글씨를 모두 지우시겠습니까?')) {
                        this.boardTextarea.value = '';
                    }
                }
            });
        }

        // 14. [Group 3: 제어] 이미지 저장 (💾)
        if (this.btnDownload) {
            this.btnDownload.addEventListener('click', () => this.handleDownload());
        }

        // 15. 지우개 가이드 커서 추적
        if (this.boardContainer && this.eraserCursor) {
            this.boardContainer.addEventListener('mousemove', (e) => {
                if (this.currentMode === 'draw' && this.currentTool === 'eraser') {
                    const rect = this.boardContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    this.eraserCursor.style.left = `${x}px`;
                    this.eraserCursor.style.top = `${y}px`;
                    this.eraserCursor.style.display = 'block';
                } else {
                    this.eraserCursor.style.display = 'none';
                }
            });

            this.boardContainer.addEventListener('mouseleave', () => {
                this.eraserCursor.style.display = 'none';
            });
        }

        // 16. 단축키 Ctrl+Z
        window.addEventListener('keydown', (e) => {
            if (this.currentMode === 'text' && document.activeElement === this.boardTextarea) {
                return; // textarea 내부 기본 undo 허용
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                this.handleUndo();
            }
        });
    }

    /**
     * 모드 전환: 텍스트('text') vs 드로잉('draw': 펜/지우개)
     */
    setMode(mode, tool) {
        this.currentMode = mode;
        this.currentTool = tool;

        // 버튼 active 상태 갱신
        if (this.btnModeText) this.btnModeText.classList.toggle('active', mode === 'text');
        if (this.btnModePen) this.btnModePen.classList.toggle('active', mode === 'draw' && tool === 'pen');
        if (this.btnEraser) this.btnEraser.classList.toggle('active', mode === 'draw' && tool === 'eraser');

        if (mode === 'text') {
            // [텍스트 모드]: 보드 전체 textarea 활성화
            this.boardContainer.className = 'single-board-container mode-text';
            if (this.boardModeText) this.boardModeText.textContent = '📝 텍스트 입력 모드';
            if (this.statusMode) this.statusMode.innerHTML = '현재: <strong>📝 텍스트 모드</strong>';
            if (this.statusHint) this.statusHint.textContent = '💡 팁: [✏️] 펜 버튼을 누르면 작성한 글씨 위에 바로 필기를 할 수 있습니다.';

            setTimeout(() => {
                this.boardTextarea.focus();
            }, 50);

        } else {
            // [드로잉 모드]: 펜 또는 지우개
            this.boardContainer.className = `single-board-container mode-draw tool-${tool}`;

            if (tool === 'eraser') {
                this.drawingBoard.tool = 'eraser';
                const eraserWidth = Math.max(28, this.currentLineWidth);
                this.updateEraserCursorSize(eraserWidth);

                if (this.boardModeText) this.boardModeText.textContent = '🧹 지우개 모드';
                if (this.statusMode) this.statusMode.innerHTML = '현재: <strong>🧹 지우개 모드</strong>';
                if (this.statusHint) this.statusHint.textContent = '💡 팁: 지우고 싶은 선 위를 마우스로 드래그하세요.';
            } else {
                this.drawingBoard.tool = 'pen';
                this.drawingBoard.color = this.penColor;
                this.drawingBoard.lineWidth = this.currentLineWidth;

                if (this.boardModeText) this.boardModeText.textContent = '✏️ 펜 그리기 모드';
                if (this.statusMode) this.statusMode.innerHTML = '현재: <strong>✏️ 펜 그리기 모드</strong>';
                if (this.statusHint) this.statusHint.textContent = '💡 팁: 작성된 글씨 위에 자유롭게 그림이나 필기를 해보세요.';
            }
        }
    }

    /**
     * 텍스트 전용 색상 설정
     */
    setTextColor(color) {
        this.textColor = color;

        if (this.boardTextarea) {
            this.boardTextarea.style.color = color;
        }

        if (this.textColorPreview) {
            this.textColorPreview.style.backgroundColor = color;
        }

        if (this.inputTextColor) {
            this.inputTextColor.value = color;
        }

        // 메뉴 내 칩 active 갱신
        this.textColorItems.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.color.toLowerCase() === color.toLowerCase());
        });

        if (this.statusTextColorVal) {
            this.statusTextColorVal.textContent = color;
            this.statusTextColorVal.style.color = color;
        }
    }

    /**
     * 폰트 크기 설정 (10px ~ 100px 10단위)
     */
    setFontSize(size) {
        this.currentFontSize = size;

        if (this.boardTextarea) {
            this.boardTextarea.style.fontSize = `${size}px`;
        }

        if (this.labelFontSize) {
            this.labelFontSize.textContent = `폰트(${size}px)`;
        }

        // 드롭다운 아이템 active 갱신
        this.fontSizeItems.forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.value, 30) === size);
        });

        if (this.statusFontSizeVal) {
            this.statusFontSizeVal.textContent = `${size}px`;
        }
    }

    /**
     * 펜 전용 색상 설정
     */
    setPenColor(color) {
        this.penColor = color;

        if (this.drawingBoard) {
            this.drawingBoard.color = color;
        }

        if (this.penColorPreview) {
            this.penColorPreview.style.backgroundColor = color;
        }

        if (this.inputPenColor) {
            this.inputPenColor.value = color;
        }

        // 메뉴 내 칩 active 갱신
        this.penColorItems.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.color.toLowerCase() === color.toLowerCase());
        });

        if (this.statusPenColorVal) {
            this.statusPenColorVal.textContent = color;
            this.statusPenColorVal.style.color = color;
        }
    }

    /**
     * 선 굵기 설정
     */
    setLineWidth(width) {
        this.currentLineWidth = width;

        if (this.drawingBoard) {
            this.drawingBoard.lineWidth = width;
        }

        if (this.labelPenWidth) {
            this.labelPenWidth.textContent = `굵기(${width}px)`;
        }

        // 드롭다운 아이템 active 갱신
        this.penWidthItems.forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.value, 10) === width);
        });

        if (this.statusPenWidthVal) {
            this.statusPenWidthVal.textContent = `${width}px`;
        }

        if (this.currentTool === 'eraser') {
            this.updateEraserCursorSize(width);
        }
    }

    updateEraserCursorSize(width) {
        if (!this.eraserCursor) return;
        this.eraserCursor.style.width = `${width}px`;
        this.eraserCursor.style.height = `${width}px`;
    }

    /**
     * 한단계 이전으로 가기 (Undo)
     */
    handleUndo() {
        if (this.drawingBoard && typeof this.drawingBoard.undo === 'function') {
            this.drawingBoard.undo();
        }
    }

    /**
     * 모두 지우기 (글씨 + 드로잉 일괄 초기화)
     */
    handleClearAll() {
        if (!confirm('보드의 글씨와 드로잉을 모두 지우시겠습니까?')) {
            return;
        }

        if (this.drawingBoard && typeof this.drawingBoard.clear === 'function') {
            this.drawingBoard.clear();
        }

        if (this.boardTextarea) {
            this.boardTextarea.value = '';
            if (this.currentMode === 'text') {
                this.boardTextarea.focus();
            }
        }
    }

    /**
     * 보드 전체 이미지(PNG) 다운로드 (글씨 + 드로잉 합성)
     */
    async handleDownload() {
        try {
            const rect = this.boardContainer.getBoundingClientRect();
            const width = Math.round(rect.width);
            const height = Math.round(rect.height);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // 1. 흰색 배경
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // 2. 텍스트 렌더링
            const text = this.boardTextarea ? this.boardTextarea.value : '';
            if (text.trim()) {
                const fontSize = this.currentFontSize;
                ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                ctx.fillStyle = this.textColor;
                ctx.textBaseline = 'top';

                const lines = text.split('\n');
                const paddingX = 24;
                const paddingY = 24;
                const lineHeight = fontSize * 1.7;

                lines.forEach((line, index) => {
                    ctx.fillText(line, paddingX, paddingY + index * lineHeight);
                });
            }

            // 3. SVG 드로잉 합성
            const svgEl = this.drawingBoard.shadowRoot ? this.drawingBoard.shadowRoot.querySelector('svg') : this.drawingBoard.querySelector('svg');
            if (svgEl) {
                const svgData = new XMLSerializer().serializeToString(svgEl);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                const img = new Image();

                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, width, height);
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            }

            const a = document.createElement('a');
            a.download = `smart_board_${Date.now()}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        } catch (e) {
            console.error('Download error:', e);
            alert('이미지 저장 중 오류가 발생했습니다.');
        }
    }
}

// 애플리케이션 시작
window.addEventListener('DOMContentLoaded', () => {
    new SmartBoardApp();
});
