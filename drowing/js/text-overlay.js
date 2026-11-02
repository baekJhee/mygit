/**
 * text-overlay.js
 * 드로잉보드 텍스트 오버레이 매니저 (Textarea 입력, 폰트 크기/색상 실시간 변경, 드래그 이동, 인라인 편집)
 */

export class TextOverlayManager {
    constructor(options = {}) {
        this.container = options.container || document.getElementById('board-container');
        this.layer = options.layer || document.getElementById('text-layer');
        this.onHistoryChange = options.onHistoryChange || (() => {});
        this.onSelectBox = options.onSelectBox || (() => {});
        this.onAction = options.onAction || (() => {});

        this.isActive = false; // 텍스트 도구 활성화 여부
        this.fontSize = options.fontSize || 20;
        this.color = options.color || '#000000';

        this.textBoxes = [];
        this.activeBox = null;
        this.undoStack = [];

        this.isDragging = false;
        this.draggedBox = null;
        this.dragOffset = { x: 0, y: 0 };

        this.initEvents();
    }

    initEvents() {
        if (!this.container) return;

        // 컨테이너 클릭 시 텍스트 모드이면 새 텍스트 박스 생성
        this.container.addEventListener('click', (e) => {
            if (!this.isActive) return;

            // 만약 클릭된 곳이 기존 text-box 내부이거나 툴바이면 새 박스 생성 안 함
            if (e.target.closest('.text-box')) return;

            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.createTextBox(x, y);
        });

        // 드래그 이동을 위한 마우스 이벤트
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.draggedBox) return;

            const rect = this.container.getBoundingClientRect();
            let newX = e.clientX - rect.left - this.dragOffset.x;
            let newY = e.clientY - rect.top - this.dragOffset.y;

            // 보드 경계 제한
            newX = Math.max(0, Math.min(newX, rect.width - 60));
            newY = Math.max(0, Math.min(newY, rect.height - 30));

            this.draggedBox.style.left = `${newX}px`;
            this.draggedBox.style.top = `${newY}px`;
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.draggedBox = null;
            }
        });

        // 바깥 영역 클릭 시 활성 텍스트 박스 선택 해제
        document.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.text-box') && !e.target.closest('#main-toolbar')) {
                this.deselectAll();
            }
        });
    }

    setActive(active) {
        this.isActive = active;
        if (this.layer) {
            this.layer.style.pointerEvents = active ? 'auto' : 'none';
        }
    }

    setFontSize(size) {
        this.fontSize = parseInt(size, 10);
        if (this.activeBox) {
            const input = this.activeBox.querySelector('.text-box-input');
            const view = this.activeBox.querySelector('.text-box-view');
            if (input) input.style.fontSize = `${this.fontSize}px`;
            if (view) view.style.fontSize = `${this.fontSize}px`;
            this.activeBox.dataset.fontSize = this.fontSize;
        }
    }

    setColor(color) {
        this.color = color;
        if (this.activeBox) {
            const input = this.activeBox.querySelector('.text-box-input');
            const view = this.activeBox.querySelector('.text-box-view');
            if (input) input.style.color = color;
            if (view) view.style.color = color;
            this.activeBox.dataset.color = color;
        }
    }

    createTextBox(x, y, initialText = '', initialFontSize = null, initialColor = null) {
        this.deselectAll();

        const box = document.createElement('div');
        box.className = 'text-box editing selected';
        box.style.left = `${x}px`;
        box.style.top = `${y}px`;

        const boxFontSize = initialFontSize || this.fontSize;
        const boxColor = initialColor || this.color;
        box.dataset.fontSize = boxFontSize;
        box.dataset.color = boxColor;

        // 상단 미니 컨트롤
        const toolbar = document.createElement('div');
        toolbar.className = 'text-box-toolbar';
        toolbar.innerHTML = `
            <button class="box-tool-btn btn-confirm" title="작성 완료">✓ 완료</button>
            <button class="box-tool-btn danger btn-delete" title="삭제">🗑️</button>
        `;

        // 텍스트 입력 textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'text-box-input';
        textarea.placeholder = '텍스트 입력...';
        textarea.value = initialText;
        textarea.style.fontSize = `${boxFontSize}px`;
        textarea.style.color = boxColor;

        // 렌더링용 뷰
        const view = document.createElement('div');
        view.className = 'text-box-view';
        view.style.display = 'none';
        view.style.fontSize = `${boxFontSize}px`;
        view.style.color = boxColor;

        box.appendChild(toolbar);
        box.appendChild(textarea);
        box.appendChild(view);
        this.layer.appendChild(box);

        this.textBoxes.push(box);
        this.activeBox = box;
        this.onSelectBox({ fontSize: boxFontSize, color: boxColor });

        // 히스토리 기록
        this.undoStack.push({
            type: 'add-text',
            element: box
        });
        this.onHistoryChange();
        this.onAction('text');

        // 자동 포커스 및 텍스트 영역 크기 자동 맞춤
        setTimeout(() => {
            textarea.focus();
            this.autoResize(textarea);
        }, 50);

        // 이벤트 바인딩
        textarea.addEventListener('input', () => {
            this.autoResize(textarea);
        });

        // ESC 키 입력 시 작성 완료
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.finishEditing(box);
            }
        });

        // 완료 버튼
        toolbar.querySelector('.btn-confirm').addEventListener('click', (e) => {
            e.stopPropagation();
            this.finishEditing(box);
        });

        // 삭제 버튼
        toolbar.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeTextBox(box);
        });

        // 더블 클릭 시 재편집
        box.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startEditing(box);
        });

        // 클릭 시 선택 및 드래그 시작 준비
        box.addEventListener('mousedown', (e) => {
            if (e.target.closest('.text-box-toolbar') || e.target === textarea) {
                // 편집 중 textarea 입력이나 툴바 클릭 시는 드래그하지 않음
                return;
            }
            e.stopPropagation();
            this.selectBox(box);

            this.isDragging = true;
            this.draggedBox = box;
            const rect = box.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });

        // textarea blur 처리: 빈 내용이면 삭제, 있으면 완료 모드로
        textarea.addEventListener('blur', (e) => {
            // 다른 툴바 버튼을 누를 수도 있으므로 약간 지연 후 처리
            setTimeout(() => {
                if (box.classList.contains('editing')) {
                    if (!textarea.value.trim()) {
                        this.removeTextBox(box, false);
                    } else {
                        this.finishEditing(box);
                    }
                }
            }, 180);
        });

        return box;
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(30, textarea.scrollHeight)}px`;
        textarea.style.width = 'auto';
        textarea.style.width = `${Math.max(120, textarea.scrollWidth + 10)}px`;
    }

    finishEditing(box) {
        if (!box || !box.parentElement) return;
        const textarea = box.querySelector('.text-box-input');
        const view = box.querySelector('.text-box-view');
        if (!textarea || !view) return;

        const text = textarea.value.trim();
        if (!text) {
            this.removeTextBox(box, false);
            return;
        }

        view.textContent = text;
        view.style.display = 'block';
        textarea.style.display = 'none';

        box.classList.remove('editing');
    }

    startEditing(box) {
        if (!box) return;
        const textarea = box.querySelector('.text-box-input');
        const view = box.querySelector('.text-box-view');
        if (!textarea || !view) return;

        this.selectBox(box);
        view.style.display = 'none';
        textarea.style.display = 'block';
        box.classList.add('editing');
        textarea.focus();
        this.autoResize(textarea);
    }

    selectBox(box) {
        this.deselectAll();
        box.classList.add('selected');
        this.activeBox = box;

        const currentFontSize = parseInt(box.dataset.fontSize || this.fontSize, 10);
        const currentColor = box.dataset.color || this.color;
        this.onSelectBox({ fontSize: currentFontSize, color: currentColor });
    }

    deselectAll() {
        this.textBoxes.forEach(box => {
            box.classList.remove('selected');
            if (box.classList.contains('editing')) {
                this.finishEditing(box);
            }
        });
        this.activeBox = null;
    }

    removeTextBox(box, recordUndo = true) {
        if (!box) return;
        if (recordUndo) {
            this.undoStack.push({
                type: 'remove-text',
                element: box,
                parent: this.layer
            });
            this.onHistoryChange();
        }

        box.remove();
        this.textBoxes = this.textBoxes.filter(b => b !== box);
        if (this.activeBox === box) {
            this.activeBox = null;
        }
    }

    undo() {
        if (this.undoStack.length === 0) return false;

        const action = this.undoStack.pop();
        if (action.type === 'add-text') {
            // 추가했던 텍스트 박스 제거
            action.element.remove();
            this.textBoxes = this.textBoxes.filter(b => b !== action.element);
            if (this.activeBox === action.element) this.activeBox = null;
        } else if (action.type === 'remove-text') {
            // 삭제했던 텍스트 박스 복구
            action.parent.appendChild(action.element);
            this.textBoxes.push(action.element);
            this.selectBox(action.element);
        }

        this.onHistoryChange();
        return true;
    }

    clearAll() {
        this.textBoxes.forEach(box => box.remove());
        this.textBoxes = [];
        this.activeBox = null;
        this.undoStack = [];
        this.onHistoryChange();
    }

    getCount() {
        return this.textBoxes.length;
    }
}
