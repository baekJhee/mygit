/**
 * EPUB Web Viewer Core Application
 * EPUB 2.0 / 3.0 uncompressed directory parser & viewer engine
 */

class EpubViewer {
    constructor() {
        this.epubPath = '';
        this.opfDir = '';
        this.spineItems = [];
        this.currentIndex = 0;
        this.bookTitle = '전자책 뷰어';

        // DOM elements
        this.iframe = document.getElementById('content-iframe');
        this.titleElement = document.getElementById('book-title');
        this.pageIndicator = document.getElementById('page-indicator');
        this.progressFill = document.getElementById('progress-fill');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.tocBtn = document.getElementById('toc-btn');
        this.closeTocBtn = document.getElementById('close-toc-btn');
        this.sidebar = document.getElementById('sidebar');
        this.tocList = document.getElementById('toc-list');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.errorOverlay = document.getElementById('error-overlay');
        this.errorMessage = document.getElementById('error-message');
        this.reloadBtn = document.getElementById('reload-btn');

        this.initTheme();
        this.bindEvents();
        this.loadEpubFromUrlParam();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('epub_theme') || 'light';
        this.setTheme(savedTheme);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.setTheme(theme);
            });
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('epub_theme', theme);
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        // If iframe is loaded, update iframe body theme if needed
        try {
            if (this.iframe && this.iframe.contentDocument) {
                const doc = this.iframe.contentDocument;
                if (theme === 'dark') {
                    doc.body.style.backgroundColor = '#1e293b';
                    doc.body.style.color = '#f8fafc';
                } else if (theme === 'sepia') {
                    doc.body.style.backgroundColor = '#f4e8c1';
                    doc.body.style.color = '#5f4b32';
                } else {
                    doc.body.style.backgroundColor = '#ffffff';
                    doc.body.style.color = '#0f172a';
                }
            }
        } catch (e) {
            // Cross-origin safe catch
        }
    }

    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.prevPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());

        this.tocBtn.addEventListener('click', () => this.toggleSidebar(true));
        this.closeTocBtn.addEventListener('click', () => this.toggleSidebar(false));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevPage();
            if (e.key === 'ArrowRight') this.nextPage();
        });

        // Error card reload
        if (this.reloadBtn) {
            this.reloadBtn.addEventListener('click', () => {
                const customPath = document.getElementById('custom-url-input').value.trim();
                if (customPath) {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('url', customPath);
                    window.location.href = newUrl.toString();
                } else {
                    location.reload();
                }
            });
        }
    }

    toggleSidebar(open) {
        if (open) {
            this.sidebar.classList.add('open');
        } else {
            this.sidebar.classList.remove('open');
        }
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    showError(msg) {
        this.showLoading(false);
        this.errorMessage.textContent = msg;
        this.errorOverlay.classList.remove('hidden');
    }

    joinPaths(base, relative) {
        if (!base) return relative;
        if (base.endsWith('/')) base = base.slice(0, -1);
        if (relative.startsWith('/')) relative = relative.slice(1);
        return `${base}/${relative}`;
    }

    getDir(filePath) {
        const idx = filePath.lastIndexOf('/');
        return idx !== -1 ? filePath.substring(0, idx) : '';
    }

    /**
     * Parse URL query parameters to retrieve target EPUB directory path
     */
    loadEpubFromUrlParam() {
        const params = new URLSearchParams(window.location.search);
        // Supports ?url=, ?path=, or ?epub=
        const targetPath = params.get('url') || params.get('path') || params.get('epub') || './sample-book';

        this.epubPath = targetPath.replace(/\/$/, '');
        this.loadEpub(this.epubPath);
    }

    async loadEpub(basePath) {
        try {
            this.showLoading(true);
            this.errorOverlay.classList.add('hidden');

            // Step 1: Read META-INF/container.xml
            const containerUrl = this.joinPaths(basePath, 'META-INF/container.xml');
            const containerRes = await fetch(containerUrl);
            if (!containerRes.ok) {
                throw new Error(`container.xml을 찾을 수 없습니다. (경로: ${containerUrl})`);
            }
            const containerXmlText = await containerRes.text();
            const containerDoc = new DOMParser().parseFromString(containerXmlText, 'text/xml');

            const rootfileNode = containerDoc.querySelector('rootfile');
            if (!rootfileNode) {
                throw new Error('container.xml에 rootfile 태그가 정의되어 있지 않습니다.');
            }

            const opfFullPath = rootfileNode.getAttribute('full-path');
            if (!opfFullPath) {
                throw new Error('rootfile 태그에서 full-path 속성을 찾을 수 없습니다.');
            }

            // Step 2: Read OPF File
            this.opfDir = this.getDir(opfFullPath);
            const opfUrl = this.joinPaths(basePath, opfFullPath);
            const opfRes = await fetch(opfUrl);
            if (!opfRes.ok) {
                throw new Error(`OPF 파일(${opfUrl})을 읽어오는데 실패했습니다.`);
            }

            const opfXmlText = await opfRes.text();
            const opfDoc = new DOMParser().parseFromString(opfXmlText, 'text/xml');

            // Extract Book Metadata Title
            const titleNode = opfDoc.querySelector('title') || opfDoc.querySelector('dc\\:title');
            if (titleNode && titleNode.textContent.trim()) {
                this.bookTitle = titleNode.textContent.trim();
                this.titleElement.textContent = this.bookTitle;
            }

            // Parse Manifest
            const manifestItems = {};
            opfDoc.querySelectorAll('manifest > item').forEach(item => {
                const id = item.getAttribute('id');
                const href = item.getAttribute('href');
                const mediaType = item.getAttribute('media-type');
                manifestItems[id] = { href, mediaType };
            });

            // Parse Spine (Reading Order)
            const itemRefs = opfDoc.querySelectorAll('spine > itemref');
            this.spineItems = [];

            itemRefs.forEach((itemRef, idx) => {
                const idref = itemRef.getAttribute('idref');
                if (manifestItems[idref]) {
                    const href = manifestItems[idref].href;
                    const fullHref = this.opfDir ? this.joinPaths(this.opfDir, href) : href;
                    const fullUrl = this.joinPaths(basePath, fullHref);
                    
                    // Simple title generator for TOC
                    const title = `페이지 ${idx + 1} (${href})`;
                    this.spineItems.push({
                        id: idref,
                        href: href,
                        fullUrl: fullUrl,
                        title: title
                    });
                }
            });

            if (this.spineItems.length === 0) {
                throw new Error('OPF spine에 표시할 항목이 존재하지 않습니다.');
            }

            // Build Sidebar TOC UI
            this.renderTocUI();

            // Step 3: Load First Page!
            this.currentIndex = 0;
            await this.renderPage(0);

            this.showLoading(false);

        } catch (err) {
            console.error('EPUB 로딩 실패:', err);
            this.showError(err.message || 'EPUB 로딩 중 오류가 발생했습니다.');
        }
    }

    renderTocUI() {
        this.tocList.innerHTML = '';
        this.spineItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'toc-item';
            li.textContent = item.title;
            li.addEventListener('click', () => {
                this.renderPage(index);
                this.toggleSidebar(false);
            });
            this.tocList.appendChild(li);
        });
    }

    async renderPage(index) {
        if (index < 0 || index >= this.spineItems.length) return;

        this.currentIndex = index;
        const pageItem = this.spineItems[index];

        return new Promise((resolve) => {
            this.iframe.onload = () => {
                // Apply theme styling to iframe contents
                const currentTheme = localStorage.getItem('epub_theme') || 'light';
                this.setTheme(currentTheme);
                this.updateUIControls();
                resolve();
            };

            this.iframe.src = pageItem.fullUrl;
        });
    }

    updateUIControls() {
        const total = this.spineItems.length;
        const current = this.currentIndex + 1;

        // Page Indicator
        this.pageIndicator.textContent = `${current} / ${total}`;

        // Progress Bar
        const percentage = (current / total) * 100;
        this.progressFill.style.width = `${percentage}%`;

        // Buttons
        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex === total - 1;

        // TOC active highlight
        const tocItems = this.tocList.querySelectorAll('.toc-item');
        tocItems.forEach((item, idx) => {
            item.classList.toggle('active', idx === this.currentIndex);
        });
    }

    prevPage() {
        if (this.currentIndex > 0) {
            this.renderPage(this.currentIndex - 1);
        }
    }

    nextPage() {
        if (this.currentIndex < this.spineItems.length - 1) {
            this.renderPage(this.currentIndex + 1);
        }
    }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    window.epubViewer = new EpubViewer();
});
