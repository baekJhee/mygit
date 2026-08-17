/**
 * navigation.js
 * 페이지 이동 (처음/이전/다음/마지막), 하단 바 카운터(1/N) 및 키보드 이벤트 관리 전담 모듈
 */

export class NavigationManager {
    constructor({ firstBtnEl, prevBtnEl, nextBtnEl, lastBtnEl, pageInfoEl, onChangePage }) {
        this.firstBtnEl = firstBtnEl;
        this.prevBtnEl = prevBtnEl;
        this.nextBtnEl = nextBtnEl;
        this.lastBtnEl = lastBtnEl;
        this.pageInfoEl = pageInfoEl;
        this.onChangePage = onChangePage;

        this.currentIndex = 0;
        this.totalCount = 0;

        this.initEvents();
    }

    initEvents() {
        if (this.firstBtnEl) {
            this.firstBtnEl.addEventListener('click', () => this.first());
        }
        if (this.prevBtnEl) {
            this.prevBtnEl.addEventListener('click', () => this.prev());
        }
        if (this.nextBtnEl) {
            this.nextBtnEl.addEventListener('click', () => this.next());
        }
        if (this.lastBtnEl) {
            this.lastBtnEl.addEventListener('click', () => this.last());
        }

        // 키보드 조작 지원 (좌/우 화살표, Home, End 키)
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            } else if (e.key === 'Home') {
                this.first();
            } else if (e.key === 'End') {
                this.last();
            }
        });
    }

    setTotal(total) {
        this.totalCount = total;
        this.updateUI();
    }

    setIndex(index) {
        if (index < 0 || index >= this.totalCount) return;
        this.currentIndex = index;
        this.updateUI();
    }

    first() {
        if (this.currentIndex > 0) {
            this.currentIndex = 0;
            this.updateUI();
            if (typeof this.onChangePage === 'function') {
                this.onChangePage(this.currentIndex);
            }
        }
    }

    last() {
        if (this.totalCount > 0 && this.currentIndex < this.totalCount - 1) {
            this.currentIndex = this.totalCount - 1;
            this.updateUI();
            if (typeof this.onChangePage === 'function') {
                this.onChangePage(this.currentIndex);
            }
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateUI();
            if (typeof this.onChangePage === 'function') {
                this.onChangePage(this.currentIndex);
            }
        }
    }

    next() {
        if (this.currentIndex < this.totalCount - 1) {
            this.currentIndex++;
            this.updateUI();
            if (typeof this.onChangePage === 'function') {
                this.onChangePage(this.currentIndex);
            }
        }
    }

    updateUI() {
        const isFirst = (this.currentIndex <= 0);
        const isLast = (this.currentIndex >= this.totalCount - 1);

        if (this.firstBtnEl) this.firstBtnEl.disabled = isFirst;
        if (this.prevBtnEl) this.prevBtnEl.disabled = isFirst;
        if (this.nextBtnEl) this.nextBtnEl.disabled = isLast;
        if (this.lastBtnEl) this.lastBtnEl.disabled = isLast;

        if (this.pageInfoEl) {
            const currentDisplay = this.totalCount > 0 ? this.currentIndex + 1 : 0;
            this.pageInfoEl.textContent = `${currentDisplay} / ${this.totalCount}`;
        }
    }
}
