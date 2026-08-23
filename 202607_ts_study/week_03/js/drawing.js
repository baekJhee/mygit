/**
 * drawing.js
 * 드로잉 보드 매니저 모듈 (펜 쓰기, 지우기, 색상 변경, 모두 지우기, 새로고침/페이지별 기록 유지, iframe 스크롤 동기화)
 */

export class DrawingManager {
    constructor(options = {}) {
        this.boardEl = options.boardEl || document.getElementById('drawing-board');
        this.overlayEl = options.overlayEl || document.getElementById('drawing-overlay');
        this.toolbarEl = options.toolbarEl || document.getElementById('drawing-toolbar');
        this.toggleBtnEl = options.toggleBtnEl || document.getElementById('btn-drawing-toggle');
        
        this.currentPageKey = 'page_0';
        this.bookId = options.bookId || 'default_epub';
        this.isActive = false;
        
        this.currentIframe = null;
        this.iframeWin = null;
        this.iframeDoc = null;

        this.initUI();
        this.bindEvents();
    }

    initUI() {
        if (!this.boardEl) return;

        // 초기 기본 속성 설정
        this.boardEl.tool = 'pen';
        this.boardEl.color = '#2563eb';
        this.boardEl.lineWidth = 4;
        
        // 크기 업데이트
        this.updateBoardSize();
    }

    /**
     * iframe 스크롤 및 문서 크기와 드로잉 레이어를 동기화
     */
    bindIframe(iframeEl) {
        if (!iframeEl) return;
        this.currentIframe = iframeEl;

        try {
            this.iframeWin = iframeEl.contentWindow;
            this.iframeDoc = iframeEl.contentDocument || (this.iframeWin && this.iframeWin.document);
        } catch (e) {
            console.warn('iframe cross-origin access restricted', e);
            return;
        }

        if (!this.iframeWin || !this.iframeDoc) return;

        // 1. 스크롤 동기화 함수
        const syncScroll = () => {
            if (!this.iframeDoc || !this.iframeDoc.documentElement || !this.overlayEl) return;
            const scrollTop = this.iframeWin.scrollY || this.iframeDoc.documentElement.scrollTop || 0;
            const scrollLeft = this.iframeWin.scrollX || this.iframeDoc.documentElement.scrollLeft || 0;
            
            this.overlayEl.style.transform = `translate3d(-${scrollLeft}px, -${scrollTop}px, 0)`;
        };

        // 2. 문서 크기 동기화 함수
        const syncDimensions = () => {
            if (!this.iframeDoc || !this.iframeDoc.documentElement || !this.boardEl || !this.overlayEl) return;
            
            const docWidth = Math.max(
                this.iframeDoc.documentElement.scrollWidth,
                this.iframeDoc.body ? this.iframeDoc.body.scrollWidth : 0,
                iframeEl.clientWidth
            );
            const docHeight = Math.max(
                this.iframeDoc.documentElement.scrollHeight,
                this.iframeDoc.body ? this.iframeDoc.body.scrollHeight : 0,
                iframeEl.clientHeight
            );

            this.boardEl.width = docWidth;
            this.boardEl.height = docHeight;
            this.overlayEl.style.width = `${docWidth}px`;
            this.overlayEl.style.height = `${docHeight}px`;

            syncScroll();
        };

        // 이벤트 바인딩 (스크롤 & 리사이즈)
        this.iframeWin.removeEventListener('scroll', syncScroll);
        this.iframeWin.addEventListener('scroll', syncScroll, { passive: true });

        this.iframeWin.removeEventListener('resize', syncDimensions);
        this.iframeWin.addEventListener('resize', syncDimensions);

        // ResizeObserver로 iframe 본문 내용 변경 시 크기 갱신
        if (window.ResizeObserver && this.iframeDoc.body) {
            const ro = new ResizeObserver(() => syncDimensions());
            ro.observe(this.iframeDoc.body);
        }

        // 3. 드로잉 레이어 위에서 마우스 휠 동작 시 iframe 스크롤 전달
        if (this.overlayEl) {
            this.overlayEl.addEventListener('wheel', (e) => {
                if (this.iframeWin) {
                    this.iframeWin.scrollBy({
                        top: e.deltaY,
                        left: e.deltaX,
                        behavior: 'instant'
                    });
                }
            }, { passive: true });
        }

        // 초기 동기화 실행
        setTimeout(syncDimensions, 50);
    }

    updateBoardSize() {
        if (this.currentIframe) {
            this.bindIframe(this.currentIframe);
        } else if (this.overlayEl && this.boardEl) {
            const rect = this.overlayEl.parentElement.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.boardEl.width = Math.round(rect.width);
                this.boardEl.height = Math.round(rect.height);
            }
        }
    }

    bindEvents() {
        // 1. 드로잉 모드 열기/닫기 토글
        if (this.toggleBtnEl) {
            this.toggleBtnEl.addEventListener('click', () => this.toggleActive());
        }

        // 2. 도구 선택 (펜 vs 지우개)
        const toolBtns = document.querySelectorAll('[data-drawing-tool]');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                toolBtns.forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                const tool = target.getAttribute('data-drawing-tool');
                this.setTool(tool);
            });
        });

        // 3. 색상 선택 (색상 칩 & 컬러 피커)
        const colorSwatches = document.querySelectorAll('.color-chip');
        const customColorPicker = document.getElementById('drawing-color-picker');
        
        colorSwatches.forEach(chip => {
            chip.addEventListener('click', (e) => {
                colorSwatches.forEach(c => c.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                const color = target.getAttribute('data-color');
                this.setColor(color);
                if (customColorPicker) customColorPicker.value = color;
            });
        });

        if (customColorPicker) {
            customColorPicker.addEventListener('input', (e) => {
                colorSwatches.forEach(c => c.classList.remove('active'));
                this.setColor(e.target.value);
            });
        }

        // 4. 선 굵기 조절 슬라이더
        const widthSlider = document.getElementById('drawing-width-slider');
        const widthValEl = document.getElementById('drawing-width-val');
        if (widthSlider) {
            widthSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                this.setLineWidth(val);
                if (widthValEl) widthValEl.textContent = `${val}px`;
            });
        }

        // 5. 모두 지우기 버튼
        const clearBtn = document.getElementById('btn-drawing-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('현재 페이지의 드로잉을 모두 지우시겠습니까?')) {
                    this.clearAll();
                }
            });
        }

        // 6. 선 그리기가 끝나거나 지우개 완료 시 localStorage에 자동 저장
        if (this.boardEl) {
            this.boardEl.addEventListener('drawing-end', () => {
                this.saveCurrentPageData();
            });
        }
    }

    toggleActive(forceState) {
        this.isActive = forceState !== undefined ? forceState : !this.isActive;

        if (this.overlayEl) {
            if (this.isActive) {
                this.overlayEl.classList.add('active');
            } else {
                this.overlayEl.classList.remove('active');
            }
        }

        if (this.toolbarEl) {
            this.toolbarEl.style.display = this.isActive ? 'flex' : 'none';
        }

        if (this.toggleBtnEl) {
            if (this.isActive) {
                this.toggleBtnEl.classList.add('active');
                this.toggleBtnEl.innerHTML = '<span>🎨</span> 드로잉 끄기';
            } else {
                this.toggleBtnEl.classList.remove('active');
                this.toggleBtnEl.innerHTML = '<span>🎨</span> 드로잉';
            }
        }

        if (this.isActive) {
            this.updateBoardSize();
        }
    }

    setTool(tool) {
        if (!this.boardEl) return;
        this.boardEl.tool = tool;
        
        let targetWidth = 4;
        if (tool === 'eraser') {
            targetWidth = 24;
        } else if (tool === 'highlighter') {
            targetWidth = 20;
        } else if (tool === 'pen') {
            targetWidth = 4;
        }

        this.setLineWidth(targetWidth);

        // 슬라이더 UI 갱신
        const widthSlider = document.getElementById('drawing-width-slider');
        const widthValEl = document.getElementById('drawing-width-val');
        if (widthSlider) widthSlider.value = targetWidth;
        if (widthValEl) widthValEl.textContent = `${targetWidth}px`;
    }

    setLineWidth(width) {
        if (this.boardEl) {
            this.boardEl.lineWidth = width;
        }
    }

    setColor(color) {
        if (this.boardEl) {
            this.boardEl.color = color;
            // 지우개 상태에서 색상을 변경하면 자동으로 펜 모드로 전환
            if (this.boardEl.tool === 'eraser') {
                this.setTool('pen');
                const penBtn = document.querySelector('[data-drawing-tool="pen"]');
                const toolBtns = document.querySelectorAll('[data-drawing-tool]');
                if (penBtn && toolBtns) {
                    toolBtns.forEach(b => b.classList.remove('active'));
                    penBtn.classList.add('active');
                }
            }
        }
    }

    clearAll() {
        if (this.boardEl && typeof this.boardEl.clear === 'function') {
            this.boardEl.clear();
            this.saveCurrentPageData();
        }
    }

    /**
     * 페이지 전환 시 호출: 기존 페이지 저장 및 새 페이지 로드
     */
    setPageKey(pageKey) {
        this.saveCurrentPageData();
        this.currentPageKey = pageKey;
        this.loadPageData(pageKey);
    }

    getStorageKey(pageKey) {
        return `epub_drawing_data_${this.bookId}_${pageKey}`;
    }

    /**
     * localStorage에 드로잉 기록 자동 저장 (새로고침 유지)
     */
    saveCurrentPageData() {
        if (!this.boardEl || typeof this.boardEl.exportData !== 'function') return;

        try {
            const dataArr = this.boardEl.exportData();
            const key = this.getStorageKey(this.currentPageKey);

            if (dataArr && dataArr.length > 0 && dataArr[0].strokes && dataArr[0].strokes.length > 0) {
                localStorage.setItem(key, JSON.stringify(dataArr[0]));
            } else {
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.error('Drawing save error:', e);
        }
    }

    /**
     * localStorage에서 드로잉 기록 로드 (새로고침 복원)
     */
    loadPageData(pageKey) {
        if (!this.boardEl) return;

        if (typeof this.boardEl.clear === 'function') {
            this.boardEl.clear();
        }

        const key = this.getStorageKey(pageKey);
        const storedJson = localStorage.getItem(key);

        if (storedJson && typeof this.boardEl.importData === 'function') {
            try {
                this.boardEl.importData(storedJson, 'full');
            } catch (e) {
                console.error('Drawing load error:', e);
            }
        }
    }
}
