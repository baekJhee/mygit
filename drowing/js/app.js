/**
 * app.js
 * 단일 공간 일체형 스마트 전자칠판 컨트롤러 (텍스트 + 드로잉 중첩 레이어)
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

        // 미니 제어 버튼
        this.btnClearTextOnly = document.getElementById('btn-clear-text-only');
        this.btnClearDrawOnly = document.getElementById('btn-clear-draw-only');

        // 툴바 엘리먼트
        this.toolBtns = document.querySelectorAll('.tool-btn');
        this.colorChips = document.querySelectorAll('.color-chip');
        this.colorPicker = document.getElementById('color-picker');
        this.colorPickerPreview = document.getElementById('color-picker-preview');

        this.fontSizeSection = document.getElementById('font-size-section');
        this.fontSizeSlider = document.getElementById('font-size-slider');
        this.fontSizeVal = document.getElementById('font-size-val');

        this.penWidthSection = document.getElementById('pen-width-section');
        this.lineWidthSlider = document.getElementById('line-width-slider');
        this.lineWidthVal = document.getElementById('line-width-val');

        this.btnUndo = document.getElementById('btn-undo');
        this.btnEraserToggle = document.getElementById('btn-eraser-toggle');
        this.btnClearAll = document.getElementById('btn-clear-all');
        this.btnDownload = document.getElementById('btn-download');

        // 하단 상태 표시줄
        this.statusMode = document.getElementById('status-mode');
        this.statusColorVal = document.getElementById('status-color-val');
        this.statusFontSize = document.getElementById('status-font-size');
        this.statusPenSize = document.getElementById('status-pen-size');
        this.statusHint = document.getElementById('status-hint');

        // 상태값
        this.currentMode = 'text'; // 'text' | 'draw'
        this.currentTool = 'text'; // 'text' | 'pen' | 'highlighter' | 'eraser'
        this.currentColor = '#000000';
        this.currentFontSize = 24;
        this.currentLineWidth = 4;

        this.init();
    }

    init() {
        this.initBoardSize();
        this.initBoardProperties();
        this.bindEvents();
        this.setMode('text', 'text');
        this.setColor(this.currentColor);
        this.setFontSize(this.currentFontSize);
        this.setLineWidth(this.currentLineWidth);
    }

    /**
     * 보드 크기 동기화
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
        this.drawingBoard.color = this.currentColor;
        this.drawingBoard.lineWidth = this.currentLineWidth;
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 1. 도구 버튼 선택 (텍스트, 펜, 형광펜, 지우개)
        this.toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                const tool = e.currentTarget.dataset.tool;
                this.setMode(mode, tool);
            });
        });

        // 2. 색상 칩 선택 (선 & 텍스트 글자색 동시 적용)
        this.colorChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.setColor(color);
            });
        });

        // 3. 커스텀 컬러 피커
        if (this.colorPicker) {
            this.colorPicker.addEventListener('input', (e) => {
                this.setColor(e.target.value);
            });
        }

        // 4. 폰트 크기 슬라이더 (textarea 글자 크기 변경)
        if (this.fontSizeSlider) {
            this.fontSizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value, 10);
                this.setFontSize(size);
            });
        }

        // 5. 선 굵기 슬라이더 (드로잉 선/지우개 굵기 변경)
        if (this.lineWidthSlider) {
            this.lineWidthSlider.addEventListener('input', (e) => {
                const width = parseInt(e.target.value, 10);
                this.setLineWidth(width);
            });
        }

        // 6. 작업 제어: 한단계 이전(Undo)
        if (this.btnUndo) {
            this.btnUndo.addEventListener('click', () => this.handleUndo());
        }

        // 7. 작업 제어: 지우개 토글
        if (this.btnEraserToggle) {
            this.btnEraserToggle.addEventListener('click', () => {
                if (this.currentTool === 'eraser') {
                    this.setMode('draw', 'pen');
                } else {
                    this.setMode('draw', 'eraser');
                }
            });
        }

        // 8. 작업 제어: 모두 지우기 (텍스트 + 드로잉)
        if (this.btnClearAll) {
            this.btnClearAll.addEventListener('click', () => this.handleClearAll());
        }

        // 9. 미니 제어: 텍스트만 지우기
        if (this.btnClearTextOnly) {
            this.btnClearTextOnly.addEventListener('click', () => {
                if (this.boardTextarea && this.boardTextarea.value.trim()) {
                    if (confirm('입력한 글씨를 모두 지우시겠습니까?')) {
                        this.boardTextarea.value = '';
                    }
                }
            });
        }

        // 10. 미니 제어: 선만 지우기
        if (this.btnClearDrawOnly) {
            this.btnClearDrawOnly.addEventListener('click', () => {
                if (confirm('그린 선을 모두 지우시겠습니까?')) {
                    if (this.drawingBoard && typeof this.drawingBoard.clear === 'function') {
                        this.drawingBoard.clear();
                    }
                }
            });
        }

        // 11. 이미지 다운로드 (저장)
        if (this.btnDownload) {
            this.btnDownload.addEventListener('click', () => this.handleDownload());
        }

        // 12. 지우개 가이드 커서 추적
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

        // 13. 단축키 Ctrl+Z
        window.addEventListener('keydown', (e) => {
            if (this.currentMode === 'text' && document.activeElement === this.boardTextarea) {
                // 텍스트 모드에서 textarea 입력 중에는 브라우저 기본 textarea undo 허용
                return;
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                this.handleUndo();
            }
        });
    }

    /**
     * 모드 및 도구 전환
     * @param {'text' | 'draw'} mode 
     * @param {'text' | 'pen' | 'highlighter' | 'eraser'} tool 
     */
    setMode(mode, tool) {
        this.currentMode = mode;
        this.currentTool = tool;

        // 툴바 버튼 활성화 갱신
        this.toolBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });

        if (this.btnEraserToggle) {
            this.btnEraserToggle.classList.toggle('active', tool === 'eraser');
        }

        if (mode === 'text') {
            // [텍스트 모드]: 보드 전체가 메모장 textarea로 동작
            this.boardContainer.className = 'single-board-container mode-text';
            this.fontSizeSection.classList.add('highlighted');
            this.penWidthSection.classList.remove('highlighted');

            if (this.boardModeText) this.boardModeText.textContent = '📝 텍스트 입력 모드';
            if (this.statusMode) this.statusMode.innerHTML = '현재: <strong>📝 텍스트 모드 (글씨 입력 가능)</strong>';
            if (this.statusHint) this.statusHint.textContent = '💡 팁: [펜] 모드로 전환하면 작성한 글씨 위에 바로 필기를 할 수 있습니다.';

            // textarea 포커스
            setTimeout(() => {
                this.boardTextarea.focus();
            }, 50);

        } else {
            // [드로잉 모드]: 펜, 형광펜, 지우개
            this.boardContainer.className = `single-board-container mode-draw tool-${tool}`;
            this.penWidthSection.classList.add('highlighted');
            this.fontSizeSection.classList.remove('highlighted');

            if (tool === 'eraser') {
                this.drawingBoard.tool = 'eraser';
                const eraserWidth = Math.max(28, this.currentLineWidth);
                this.setLineWidth(eraserWidth);
                this.updateEraserCursorSize(eraserWidth);

                if (this.boardModeText) this.boardModeText.textContent = '🧹 지우개 모드';
                if (this.statusMode) this.statusMode.innerHTML = '현재: <strong>🧹 지우개 모드</strong>';
                if (this.statusHint) this.statusHint.textContent = '💡 팁: 지우고 싶은 선 위를 마우스로 드래그하세요.';
            } else if (tool === 'highlighter') {
                this.drawingBoard.tool = 'highlighter';
                this.setLineWidth(24);

                if (this.boardModeText) this.boardModeText.textContent = '🖌️ 형광펜 모드';
                if (this.statusMode) this.statusMode.innerHTML = '현재: <strong>🖌️ 형광펜 모드</strong>';
                if (this.statusHint) this.statusHint.textContent = '💡 팁: 글씨 위에 반투명하게 강조 표시할 수 있습니다.';
            } else {
                this.drawingBoard.tool = 'pen';
                this.setLineWidth(4);

                if (this.boardModeText) this.boardModeText.textContent = '✏️ 펜 그리기 모드';
                if (this.statusMode) this.statusMode.innerHTML = '현재: <strong>✏️ 펜 그리기 모드</strong>';
                if (this.statusHint) this.statusHint.textContent = '💡 팁: 작성된 글씨 위에 자유롭게 그림이나 필기를 해보세요.';
            }
        }
    }

    /**
     * 색상 변경 (텍스트 글자색 & 드로잉 선 색상 동시 반영)
     */
    setColor(color) {
        this.currentColor = color;

        // 1. 드로잉보드 색상 적용
        if (this.drawingBoard) {
            this.drawingBoard.color = color;
        }

        // 2. textarea 글자 색상 적용!
        if (this.boardTextarea) {
            this.boardTextarea.style.color = color;
        }

        // 3. UI 갱신
        this.colorChips.forEach(chip => {
            chip.classList.toggle('active', chip.dataset.color.toLowerCase() === color.toLowerCase());
        });

        if (this.colorPicker) {
            this.colorPicker.value = color;
        }
        if (this.colorPickerPreview) {
            this.colorPickerPreview.style.backgroundColor = color;
        }
        if (this.statusColorVal) {
            this.statusColorVal.textContent = color;
            this.statusColorVal.style.color = color;
        }

        // 지우개 모드였을 경우 펜 모드로 복귀
        if (this.currentTool === 'eraser') {
            this.setMode('draw', 'pen');
        }
    }

    /**
     * 폰트 크기 조절 (textarea 글자 크기 실시간 변경)
     */
    setFontSize(size) {
        this.currentFontSize = size;

        if (this.boardTextarea) {
            this.boardTextarea.style.fontSize = `${size}px`;
        }
        if (this.fontSizeSlider) {
            this.fontSizeSlider.value = size;
        }
        if (this.fontSizeVal) {
            this.fontSizeVal.textContent = `${size}px`;
        }
        if (this.statusFontSize) {
            this.statusFontSize.innerHTML = `폰트: <strong>${size}px</strong>`;
        }
    }

    /**
     * 선 굵기 조절
     */
    setLineWidth(width) {
        this.currentLineWidth = width;

        if (this.drawingBoard) {
            this.drawingBoard.lineWidth = width;
        }
        if (this.lineWidthSlider) {
            this.lineWidthSlider.value = width;
        }
        if (this.lineWidthVal) {
            this.lineWidthVal.textContent = `${width}px`;
        }
        if (this.statusPenSize) {
            this.statusPenSize.innerHTML = `선 굵기: <strong>${width}px</strong>`;
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
     * 모두 지우기 (텍스트 + 드로잉 일괄 초기화)
     */
    handleClearAll() {
        if (!confirm('보드의 글씨와 드로잉을 모두 지우시겠습니까?')) {
            return;
        }

        // 1. 드로잉 지우기
        if (this.drawingBoard && typeof this.drawingBoard.clear === 'function') {
            this.drawingBoard.clear();
        }

        // 2. 텍스트 지우기
        if (this.boardTextarea) {
            this.boardTextarea.value = '';
            if (this.currentMode === 'text') {
                this.boardTextarea.focus();
            }
        }
    }

    /**
     * 보드 전체 이미지(PNG)로 다운로드 (텍스트 + 드로잉 합성)
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

            // 1. 흰색 보드 배경
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // 2. 텍스트 레이어 렌더링
            const text = this.boardTextarea ? this.boardTextarea.value : '';
            if (text.trim()) {
                const fontSize = this.currentFontSize;
                ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                ctx.fillStyle = this.currentColor;
                ctx.textBaseline = 'top';

                const lines = text.split('\n');
                const paddingX = 24;
                const paddingY = 24;
                const lineHeight = fontSize * 1.7;

                lines.forEach((line, index) => {
                    ctx.fillText(line, paddingX, paddingY + index * lineHeight);
                });
            }

            // 3. 드로잉 SVG 레이어 합성
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

            // 4. 다운로드
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
