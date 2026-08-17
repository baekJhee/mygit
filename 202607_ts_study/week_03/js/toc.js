/**
 * toc.js
 * 목차(TOC) UI 렌더링, 사이드바 토글 및 클릭 이벤트 관리 전담 모듈
 */

export class TocManager {
    constructor({ sidebarEl, containerEl, toggleBtnEl, closeBtnEl, onSelect }) {
        this.sidebarEl = sidebarEl;
        this.containerEl = containerEl;
        this.toggleBtnEl = toggleBtnEl;
        this.closeBtnEl = closeBtnEl;
        this.onSelect = onSelect;
        this.isOpen = false;

        this.initEvents();
    }

    initEvents() {
        if (this.toggleBtnEl) {
            this.toggleBtnEl.addEventListener('click', () => this.toggle());
        }
        if (this.closeBtnEl) {
            this.closeBtnEl.addEventListener('click', () => this.close());
        }
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.sidebarEl?.classList.add('open');
    }

    close() {
        this.isOpen = false;
        this.sidebarEl?.classList.remove('open');
    }

    /**
     * 목차 항목 리스트 렌더링
     */
    render(tocItems) {
        if (!this.containerEl) return;
        this.containerEl.innerHTML = '';

        if (!tocItems || tocItems.length === 0) {
            this.containerEl.innerHTML = '<div class="toc-empty">목차 정보가 없습니다.</div>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'toc-list';

        tocItems.forEach((item) => {
            const li = document.createElement('li');
            li.className = 'toc-item';
            
            const btn = document.createElement('button');
            btn.className = 'toc-btn';
            btn.textContent = item.title;
            btn.setAttribute('data-href', item.href);

            btn.addEventListener('click', () => {
                if (typeof this.onSelect === 'function') {
                    this.onSelect(item.href);
                }
                this.close();
            });

            li.appendChild(btn);
            ul.appendChild(li);
        });

        this.containerEl.appendChild(ul);
    }

    /**
     * 현재 Href에 맞게 목차 항목 활성화 상태 표시
     */
    updateActive(currentHref) {
        const buttons = this.containerEl?.querySelectorAll('.toc-btn');
        buttons?.forEach(btn => {
            const href = btn.getAttribute('data-href');
            if (href && (href === currentHref || href.split('#')[0] === currentHref.split('#')[0])) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}
