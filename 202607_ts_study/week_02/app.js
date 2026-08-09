/**
 * Web Album EPUB Viewer Engine
 * First Page: Album Cover auto-loader
 * Page 2+: Easy Photo Registration & Storage System
 */

class WebAlbumApp {
    constructor() {
        this.epubPath = '';
        this.opfDir = '';
        this.spineItems = [];
        this.currentIndex = 0;
        this.albumTitle = '웹 포토 앨범';
        this.activeImageData = null;

        // DOM Elements
        this.iframe = document.getElementById('content-iframe');
        this.titleElement = document.getElementById('book-title');
        this.pageIndicator = document.getElementById('page-indicator');
        this.albumBadge = document.getElementById('album-badge');
        this.progressFill = document.getElementById('progress-fill');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.tocBtn = document.getElementById('toc-btn');
        this.closeTocBtn = document.getElementById('close-toc-btn');
        this.sidebar = document.getElementById('sidebar');
        this.tocList = document.getElementById('toc-list');

        // Photo Registration Drawer Elements
        this.photoBtn = document.getElementById('photo-btn');
        this.closePhotoBtn = document.getElementById('close-photo-btn');
        this.photoPanel = document.getElementById('photo-panel');
        this.photoTitle = document.getElementById('photo-title');
        this.photoDesc = document.getElementById('photo-desc');
        this.imageInput = document.getElementById('image-file-input');
        this.imageUrlInput = document.getElementById('image-url-input');
        this.dropzone = document.getElementById('image-dropzone');
        this.imagePreview = document.getElementById('image-preview');
        this.savePhotoBtn = document.getElementById('save-photo-btn');
        this.photoCardGrid = document.getElementById('photo-card-grid');

        // Lightbox Modal
        this.lightboxModal = document.getElementById('lightbox-modal');
        this.lightboxImg = document.getElementById('lightbox-img');
        this.lightboxCaption = document.getElementById('lightbox-caption');
        this.lightboxClose = document.getElementById('lightbox-close');

        // Overlays
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.errorOverlay = document.getElementById('error-overlay');
        this.errorMessage = document.getElementById('error-message');
        this.reloadBtn = document.getElementById('reload-btn');

        this.initTheme();
        this.bindEvents();
        this.initImageDropzone();
        this.loadEpubFromUrlParam();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('webalbum_theme') || 'dark';
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
        localStorage.setItem('webalbum_theme', theme);
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });

        try {
            if (this.iframe && this.iframe.contentDocument && this.iframe.contentDocument.body) {
                const body = this.iframe.contentDocument.body;
                if (theme === 'dark' || theme === 'gallery') {
                    body.style.backgroundColor = '#121212';
                    body.style.color = '#f8fafc';
                } else {
                    body.style.backgroundColor = '#ffffff';
                    body.style.color = '#0f172a';
                }
            }
        } catch (e) {
            // Cross-origin safe
        }
    }

    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.prevPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());

        this.tocBtn.addEventListener('click', () => this.toggleSidebar(true));
        this.closeTocBtn.addEventListener('click', () => this.toggleSidebar(false));

        this.photoBtn.addEventListener('click', () => this.togglePhotoPanel(true));
        this.closePhotoBtn.addEventListener('click', () => this.togglePhotoPanel(false));

        this.savePhotoBtn.addEventListener('click', () => this.savePhoto());

        if (this.lightboxClose) {
            this.lightboxClose.addEventListener('click', () => {
                this.lightboxModal.classList.add('hidden');
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') this.prevPage();
            if (e.key === 'ArrowRight') this.nextPage();
            if (e.key === 'Escape') this.lightboxModal.classList.add('hidden');
        });

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

    initImageDropzone() {
        this.dropzone.addEventListener('click', () => this.imageInput.click());

        this.imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleImageFile(file);
        });

        this.imageUrlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                this.activeImageData = url;
                this.imagePreview.src = url;
                this.imagePreview.classList.remove('hidden');
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                this.dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                this.dropzone.classList.remove('dragover');
            });
        });

        this.dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            if (file) this.handleImageFile(file);
        });
    }

    handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 선택할 수 있습니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.activeImageData = e.target.result;
            this.imagePreview.src = this.activeImageData;
            this.imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    toggleSidebar(open) {
        if (open) {
            this.sidebar.classList.add('open');
            this.photoPanel.classList.remove('open');
        } else {
            this.sidebar.classList.remove('open');
        }
    }

    togglePhotoPanel(open) {
        if (open) {
            this.photoPanel.classList.add('open');
            this.sidebar.classList.remove('open');
            this.renderPhotos();
        } else {
            this.photoPanel.classList.remove('open');
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

    loadEpubFromUrlParam() {
        const params = new URLSearchParams(window.location.search);
        const targetPath = params.get('url') || params.get('path') || params.get('epub') || './sample-book';

        this.epubPath = targetPath.replace(/\/$/, '');
        this.loadEpub(this.epubPath);
    }

    async loadEpub(basePath) {
        try {
            this.showLoading(true);
            this.errorOverlay.classList.add('hidden');

            // Step 1: container.xml
            const containerUrl = this.joinPaths(basePath, 'META-INF/container.xml');
            const containerRes = await fetch(containerUrl);
            if (!containerRes.ok) {
                throw new Error(`container.xml을 찾을 수 없습니다. (경로: ${containerUrl})`);
            }
            const containerXmlText = await containerRes.text();
            const containerDoc = new DOMParser().parseFromString(containerXmlText, 'text/xml');

            const rootfileNode = containerDoc.querySelector('rootfile');
            if (!rootfileNode) {
                throw new Error('container.xml에 rootfile 태그가 지정되어 있지 않습니다.');
            }

            const opfFullPath = rootfileNode.getAttribute('full-path');
            if (!opfFullPath) {
                throw new Error('rootfile 태그에서 full-path 속성을 찾을 수 없습니다.');
            }

            // Step 2: OPF Package
            this.opfDir = this.getDir(opfFullPath);
            const opfUrl = this.joinPaths(basePath, opfFullPath);
            const opfRes = await fetch(opfUrl);
            if (!opfRes.ok) {
                throw new Error(`OPF 파일(${opfUrl})을 읽어오지 못했습니다.`);
            }

            const opfXmlText = await opfRes.text();
            const opfDoc = new DOMParser().parseFromString(opfXmlText, 'text/xml');

            // Metadata Title
            const titleNode = opfDoc.querySelector('title') || opfDoc.querySelector('dc\\:title');
            if (titleNode && titleNode.textContent.trim()) {
                this.albumTitle = titleNode.textContent.trim();
                this.titleElement.textContent = this.albumTitle;
            }

            // Manifest & Spine Parsing
            const manifestItems = {};
            opfDoc.querySelectorAll('manifest > item').forEach(item => {
                manifestItems[item.getAttribute('id')] = {
                    href: item.getAttribute('href'),
                    mediaType: item.getAttribute('media-type')
                };
            });

            const itemRefs = opfDoc.querySelectorAll('spine > itemref');
            this.spineItems = [];

            itemRefs.forEach((itemRef, idx) => {
                const idref = itemRef.getAttribute('idref');
                if (manifestItems[idref]) {
                    const href = manifestItems[idref].href;
                    const fullHref = this.opfDir ? this.joinPaths(this.opfDir, href) : href;
                    const fullUrl = this.joinPaths(basePath, fullHref);

                    const title = idx === 0 ? '앨범 커버 (Cover)' : `페이지 ${idx} (${href})`;
                    this.spineItems.push({
                        id: idref,
                        href: href,
                        fullUrl: fullUrl,
                        title: title
                    });
                }
            });

            if (this.spineItems.length === 0) {
                throw new Error('OPF spine 패키지 항목이 존재하지 않습니다.');
            }

            this.renderTocUI();

            // Step 3: Load First Page (Album Cover)!
            this.currentIndex = 0;
            await this.renderPage(0);

            this.showLoading(false);

        } catch (err) {
            console.error('웹 앨범 EPUB 로딩 실패:', err);
            this.showError(err.message || '웹 앨범 로딩 중 오류가 발생했습니다.');
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
                const currentTheme = localStorage.getItem('webalbum_theme') || 'dark';
                this.setTheme(currentTheme);
                this.updateUIControls();
                this.renderPhotos();
                resolve();
            };

            this.iframe.src = pageItem.fullUrl;
        });
    }

    updateUIControls() {
        const total = this.spineItems.length;
        const current = this.currentIndex + 1;

        if (this.currentIndex === 0) {
            this.albumBadge.textContent = 'COVER';
            this.pageIndicator.textContent = `Page 1 (앨범 커버) / ${total}`;
            this.photoBtn.title = '2페이지부터 사진 등록이 가능합니다.';
        } else {
            this.albumBadge.textContent = `PAGE ${this.currentIndex}`;
            this.pageIndicator.textContent = `Page ${current} / ${total}`;
            this.photoBtn.title = '이 페이지에 앨범 사진 등록';
        }

        this.progressFill.style.width = `${(current / total) * 100}%`;

        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex === total - 1;

        const tocItems = this.tocList.querySelectorAll('.toc-item');
        tocItems.forEach((item, idx) => {
            item.classList.toggle('active', idx === this.currentIndex);
        });
    }

    prevPage() {
        if (this.currentIndex > 0) this.renderPage(this.currentIndex - 1);
    }

    nextPage() {
        if (this.currentIndex < this.spineItems.length - 1) this.renderPage(this.currentIndex + 1);
    }

    /* Photo Registration LocalStorage System */
    getPhotoKey() {
        return `webalbum_photos_${this.epubPath}_p${this.currentIndex}`;
    }

    getPhotos() {
        try {
            return JSON.parse(localStorage.getItem(this.getPhotoKey())) || [];
        } catch (e) {
            return [];
        }
    }

    savePhoto() {
        const title = this.photoTitle.value.trim() || '소중한 순간';
        const desc = this.photoDesc.value.trim();
        const image = this.activeImageData;

        if (!image) {
            alert('등록할 이미지 파일이나 이미지 URL을 등록해 주세요.');
            return;
        }

        const photos = this.getPhotos();
        const newPhoto = {
            id: Date.now(),
            title: title,
            desc: desc,
            image: image,
            date: new Date().toLocaleDateString()
        };

        photos.unshift(newPhoto);
        localStorage.setItem(this.getPhotoKey(), JSON.stringify(photos));

        // Form Reset
        this.photoTitle.value = '';
        this.photoDesc.value = '';
        this.imageUrlInput.value = '';
        this.activeImageData = null;
        this.imagePreview.src = '';
        this.imagePreview.classList.add('hidden');

        this.renderPhotos();
        alert('앨범 사진이 정상 등록되었습니다!');
    }

    deletePhoto(id) {
        let photos = this.getPhotos();
        photos = photos.filter(p => p.id !== id);
        localStorage.setItem(this.getPhotoKey(), JSON.stringify(photos));
        this.renderPhotos();
    }

    renderPhotos() {
        const photos = this.getPhotos();
        this.photoCardGrid.innerHTML = '';

        this.renderPhotosInIframe(photos);

        if (photos.length === 0) {
            this.photoCardGrid.innerHTML = '<p style="color:var(--text-secondary); font-size:0.85rem; text-align:center; grid-column: 1/-1; padding: 1.5rem 0;">이 페이지에 등록된 앨범 사진이 없습니다.<br/>위 입력란에서 이미지를 추가해 보세요!</p>';
            return;
        }

        photos.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'photo-card';

            card.innerHTML = `
                <button class="photo-delete-btn" title="삭제">&times;</button>
                <img src="${photo.image}" class="photo-card-img" alt="${this.escapeHtml(photo.title)}"/>
                <div class="photo-card-info">
                    <div class="photo-card-title">${this.escapeHtml(photo.title)}</div>
                    ${photo.desc ? `<div class="photo-card-desc">${this.escapeHtml(photo.desc)}</div>` : ''}
                </div>
            `;

            card.querySelector('.photo-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePhoto(photo.id);
            });

            card.querySelector('.photo-card-img').addEventListener('click', () => {
                this.openLightbox(photo.image, photo.title + (photo.desc ? ' - ' + photo.desc : ''));
            });

            this.photoCardGrid.appendChild(card);
        });
    }

    renderPhotosInIframe(photos) {
        try {
            if (!this.iframe || !this.iframe.contentDocument) return;
            const doc = this.iframe.contentDocument;
            if (!doc.body) return;

            const guideBox = doc.querySelector('.gallery-welcome-box');
            let dynamicGallery = doc.getElementById('dynamic-photo-gallery');

            if (photos && photos.length > 0) {
                // Hide guide box
                if (guideBox) guideBox.style.display = 'none';

                // Create or update dynamic gallery container in iframe
                if (!dynamicGallery) {
                    dynamicGallery = doc.createElement('div');
                    dynamicGallery.id = 'dynamic-photo-gallery';
                    dynamicGallery.style.cssText = `
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                        gap: 1.25rem;
                        margin-top: 1.5rem;
                        padding-bottom: 2rem;
                    `;
                    doc.body.appendChild(dynamicGallery);
                }

                const isLight = (document.documentElement.getAttribute('data-theme') === 'light');
                const cardBg = isLight ? '#f8fafc' : '#1e293b';
                const cardBorder = isLight ? '#e2e8f0' : '#334155';
                const textColor = isLight ? '#0f172a' : '#f8fafc';
                const descColor = isLight ? '#64748b' : '#94a3b8';

                dynamicGallery.innerHTML = photos.map((photo, idx) => `
                    <div class="iframe-photo-item" data-index="${idx}" style="
                        background: ${cardBg};
                        border: 1px solid ${cardBorder};
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 14px rgba(0,0,0,0.15);
                        cursor: pointer;
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                    ">
                        <img src="${photo.image}" style="width: 100%; height: 180px; object-fit: cover; display: block;" alt="${this.escapeHtml(photo.title)}"/>
                        <div style="padding: 0.85rem;">
                            <div style="font-weight: 700; font-size: 0.95rem; color: ${textColor}; margin-bottom: 4px;">${this.escapeHtml(photo.title)}</div>
                            ${photo.desc ? `<div style="font-size: 0.82rem; color: ${descColor}; line-height: 1.4;">${this.escapeHtml(photo.desc)}</div>` : ''}
                        </div>
                    </div>
                `).join('');

                // Add click handlers for lightbox
                dynamicGallery.querySelectorAll('.iframe-photo-item').forEach((item, idx) => {
                    item.addEventListener('mouseenter', () => {
                        item.style.transform = 'translateY(-4px)';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.transform = 'translateY(0)';
                    });
                    item.addEventListener('click', () => {
                        const p = photos[idx];
                        this.openLightbox(p.image, p.title + (p.desc ? ' - ' + p.desc : ''));
                    });
                });

            } else {
                // Show guide box if no photos registered
                if (guideBox) guideBox.style.display = 'block';
                if (dynamicGallery) dynamicGallery.remove();
            }
        } catch (e) {
            console.warn('Iframe gallery render info:', e);
        }
    }

    openLightbox(imgSrc, captionText) {
        this.lightboxImg.src = imgSrc;
        this.lightboxCaption.textContent = captionText;
        this.lightboxModal.classList.remove('hidden');
    }

    escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.webAlbumApp = new WebAlbumApp();
});
