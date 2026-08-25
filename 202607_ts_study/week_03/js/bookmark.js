/**
 * bookmark.js
 * EPUB 북마크 등록, 해제, 목록 조회 및 localStorage 연동 전담 모듈
 */

export class BookmarkManager {
    constructor({ bookId = 'default_epub', toggleBtnEl, containerEl, countEl, onSelect }) {
        this.bookId = bookId;
        this.toggleBtnEl = toggleBtnEl;
        this.containerEl = containerEl;
        this.countEl = countEl;
        this.onSelect = onSelect;

        this.currentPageInfo = null; // { index, href, title }
        this.bookmarks = [];

        this.init();
    }

    get storageKey() {
        return `epub_bookmarks_${this.bookId}`;
    }

    init() {
        this.loadBookmarks();

        if (this.toggleBtnEl) {
            this.toggleBtnEl.addEventListener('click', () => {
                this.toggleCurrentBookmark();
            });
        }
    }

    /**
     * localStorage에서 북마크 목록 읽어오기
     */
    loadBookmarks() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            this.bookmarks = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Bookmark load error:', e);
            this.bookmarks = [];
        }
        this.render();
    }

    /**
     * localStorage에 북마크 저장
     */
    saveBookmarks() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.bookmarks));
        } catch (e) {
            console.error('Bookmark save error:', e);
        }
        this.render();
    }

    /**
     * 현재 로드된 페이지 정보 설정 및 UI 상태 갱신
     */
    setCurrentPage(pageInfo) {
        this.currentPageInfo = pageInfo;
        this.updateToggleBtnState();
    }

    /**
     * 특정 Href 또는 Index가 북마크되어 있는지 여부 반환
     */
    isBookmarked(href, index) {
        if (!this.bookmarks || this.bookmarks.length === 0) return false;
        return this.bookmarks.some(bm => {
            if (index !== undefined && bm.index === index) return true;
            if (href && (bm.href === href || bm.href.split('#')[0] === href.split('#')[0])) return true;
            return false;
        });
    }

    /**
     * 현재 페이지 북마크 등록/해제 토글
     */
    toggleCurrentBookmark() {
        if (!this.currentPageInfo) return;

        const { index, href, title } = this.currentPageInfo;
        const existsIndex = this.bookmarks.findIndex(bm =>
            bm.index === index || bm.href === href || bm.href.split('#')[0] === href.split('#')[0]
        );

        if (existsIndex !== -1) {
            // 북마크 삭제
            this.bookmarks.splice(existsIndex, 1);
        } else {
            // 북마크 추가
            const now = new Date();
            const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            this.bookmarks.push({
                id: `bm_${Date.now()}`,
                index: index,
                href: href,
                title: title || `${index + 1}페이지`,
                createdAt: timeStr
            });
        }

        this.saveBookmarks();
        this.updateToggleBtnState();
    }

    /**
     * 특정 ID의 북마크 삭제
     */
    removeBookmark(id) {
        this.bookmarks = this.bookmarks.filter(bm => bm.id !== id);
        this.saveBookmarks();
        this.updateToggleBtnState();
    }

    /**
     * 헤더의 북마크 버튼 활성화/비활성화 상태 업데이트
     */
    updateToggleBtnState() {
        if (!this.toggleBtnEl || !this.currentPageInfo) return;

        const isMarked = this.isBookmarked(this.currentPageInfo.href, this.currentPageInfo.index);

        if (isMarked) {
            this.toggleBtnEl.classList.add('active');
            this.toggleBtnEl.setAttribute('title', '북마크 해제');
            this.toggleBtnEl.innerHTML = '북마크됨';
        } else {
            this.toggleBtnEl.classList.remove('active');
            this.toggleBtnEl.setAttribute('title', '현재 페이지 북마크 추가');
            this.toggleBtnEl.innerHTML = '북마크';
        }
    }

    /**
     * 북마크 목록 리스트 UI 렌더링
     */
    render() {
        if (this.countEl) {
            this.countEl.textContent = this.bookmarks.length;
        }

        if (!this.containerEl) return;
        this.containerEl.innerHTML = '';

        if (this.bookmarks.length === 0) {
            this.containerEl.innerHTML = '<div class="bookmark-empty">등록된 북마크가 없습니다.</div>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'bookmark-list';

        this.bookmarks.forEach(bm => {
            const li = document.createElement('li');
            li.className = 'bookmark-item';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'bookmark-info';

            const titleBtn = document.createElement('button');
            titleBtn.className = 'bookmark-title-btn';
            titleBtn.textContent = bm.title;
            titleBtn.addEventListener('click', () => {
                if (typeof this.onSelect === 'function') {
                    this.onSelect(bm);
                }
            });

            const dateSpan = document.createElement('span');
            dateSpan.className = 'bookmark-date';
            dateSpan.textContent = bm.createdAt || '';

            infoDiv.appendChild(titleBtn);
            infoDiv.appendChild(dateSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'bookmark-del-btn';
            deleteBtn.innerHTML = '✕';
            deleteBtn.setAttribute('title', '북마크 삭제');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBookmark(bm.id);
            });

            li.appendChild(infoDiv);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
        });

        this.containerEl.appendChild(ul);
    }
}
