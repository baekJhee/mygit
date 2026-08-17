/**
 * main.js
 * 메인 엔트리포인트 모듈 (URL 파라미터 수신 및 EPUB 뷰어 전체 초기화)
 */

import { EpubParser } from './epub-parser.js';
import { TocManager } from './toc.js';
import { NavigationManager } from './navigation.js';

class EpubApp {
    constructor() {
        this.frameEl = document.getElementById('epub-frame');
        this.titleEl = document.getElementById('book-title');
        this.loadingEl = document.getElementById('loading-spinner');

        this.parser = null;
        this.spineData = [];
        this.basePath = './sample_epub';
        this.currentIndex = 0;

        this.init();
    }

    /**
     * URL 파라미터에서 EPUB 폴더 경로 추출
     */
    getEpubPathFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('path') || params.get('folder') || params.get('epub') || './sample_epub';
    }

    async init() {
        this.basePath = this.getEpubPathFromUrl();
        this.showLoading(true);

        try {
            // 1. 파서 초기화 및 로드
            this.parser = new EpubParser(this.basePath);
            const epubData = await this.parser.load();

            this.spineData = epubData.spine;

            // 도서 제목 업데이트
            if (this.titleEl) {
                this.titleEl.textContent = epubData.metadata.title || 'EPUB 웹 뷰어';
            }

            // 2. 하단 네비게이션 매니저 초기화
            this.navManager = new NavigationManager({
                firstBtnEl: document.getElementById('btn-first'),
                prevBtnEl: document.getElementById('btn-prev'),
                nextBtnEl: document.getElementById('btn-next'),
                lastBtnEl: document.getElementById('btn-last'),
                pageInfoEl: document.getElementById('page-info'),
                onChangePage: (index) => this.loadSpineIndex(index)
            });
            this.navManager.setTotal(this.spineData.length);

            // 3. 목차(TOC) 매니저 초기화
            this.tocManager = new TocManager({
                sidebarEl: document.getElementById('sidebar-toc'),
                containerEl: document.getElementById('toc-container'),
                toggleBtnEl: document.getElementById('btn-toc-toggle'),
                closeBtnEl: document.getElementById('btn-toc-close'),
                onSelect: (href) => this.loadHref(href)
            });
            this.tocManager.render(epubData.toc);

            // 4. 첫 번째 Spine 페이지 자동 로드
            if (this.spineData.length > 0) {
                this.loadSpineIndex(0);
            } else {
                throw new Error('읽을 수 있는 Spine 항목이 없습니다.');
            }

        } catch (error) {
            console.error('EPUB 로딩 오류:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 지정된 Spine 인덱스(페이지)의 XHTML 문서 로드
     */
    loadSpineIndex(index) {
        if (index < 0 || index >= this.spineData.length) return;
        this.currentIndex = index;
        const item = this.spineData[index];
        const pageUrl = `${this.basePath}/${item.href}`;

        this.frameEl.src = pageUrl;
        this.navManager.setIndex(index);
        this.tocManager.updateActive(item.href);

        // iframe 내부 클릭/키보드 이벤트 연동
        this.frameEl.onload = () => {
            this.bindIframeKeyboardEvent();
        };
    }

    /**
     * 특정 Href 경로로 이동 (목차 클릭 시 사용)
     */
    loadHref(targetHref) {
        const cleanHref = targetHref.split('#')[0];
        const foundIndex = this.spineData.findIndex(item => item.href === cleanHref || item.href.endsWith(cleanHref));

        if (foundIndex !== -1) {
            this.loadSpineIndex(foundIndex);
        } else {
            this.frameEl.src = `${this.basePath}/${targetHref}`;
            this.tocManager.updateActive(targetHref);
        }
    }

    /**
     * iframe 내부 영역에서도 키보드 좌/우 화살표 키가 동작하도록 리스너 추가
     */
    bindIframeKeyboardEvent() {
        try {
            const iframeDoc = this.frameEl.contentDocument || this.frameEl.contentWindow.document;
            if (iframeDoc) {
                iframeDoc.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft') {
                        this.navManager.prev();
                    } else if (e.key === 'ArrowRight') {
                        this.navManager.next();
                    } else if (e.key === 'Home') {
                        this.navManager.first();
                    } else if (e.key === 'End') {
                        this.navManager.last();
                    }
                });
            }
        } catch (err) {
            // cross-origin 접근 제한 무시
        }
    }

    showLoading(show) {
        if (this.loadingEl) {
            this.loadingEl.style.display = show ? 'flex' : 'none';
        }
    }

    showError(msg) {
        const container = document.getElementById('viewer-container');
        if (container) {
            container.innerHTML = `
                <div class="error-box">
                    <h3>⚠️ EPUB 로딩 오류</h3>
                    <p>${msg}</p>
                    <p class="error-tip">URL 파라미터 예시: <code>?path=./sample_epub</code></p>
                </div>
            `;
        }
    }
}

// DOM 준비 완료 시 실행
document.addEventListener('DOMContentLoaded', () => {
    new EpubApp();
});
