/**
 * epub-parser.js
 * EPUB 압축 해제 폴더의 container.xml, OPF, TOC 파일 해석 전담 모듈
 */

export class EpubParser {
    constructor(basePath) {
        // 경로 구분자 정규화
        this.basePath = basePath.replace(/\/$/, '');
        this.opfPath = '';
        this.opfDir = '';
        this.metadata = {};
        this.manifest = {}; // id -> { id, href, rawHref, mediaType, properties }
        this.spine = [];    // 읽기 순서대로 정렬된 리소스 목록
        this.toc = [];      // { title, href } 목록
    }

    /**
     * XML 텍스트를 DOM Document로 파싱
     */
    parseXml(xmlText) {
        const parser = new DOMParser();
        return parser.parseFromString(xmlText, 'text/xml');
    }

    /**
     * HTML/XHTML 텍스트를 DOM Document로 파싱
     */
    parseHtml(htmlText) {
        const parser = new DOMParser();
        return parser.parseFromString(htmlText, 'text/html');
    }

    /**
     * 1. META-INF/container.xml 파싱하여 OPF 파일 경로 확인
     */
    async parseContainer() {
        const containerUrl = `${this.basePath}/META-INF/container.xml`;
        const response = await fetch(containerUrl);
        if (!response.ok) {
            throw new Error(`container.xml 로드 실패 (상태코드 ${response.status}): ${containerUrl}`);
        }
        const xmlText = await response.text();
        const xmlDoc = this.parseXml(xmlText);
        
        const rootfile = xmlDoc.querySelector('rootfile');
        if (!rootfile) {
            throw new Error('container.xml에서 rootfile 태그를 찾을 수 없습니다.');
        }

        this.opfPath = rootfile.getAttribute('full-path');
        const lastSlash = this.opfPath.lastIndexOf('/');
        this.opfDir = lastSlash !== -1 ? this.opfPath.substring(0, lastSlash) : '';
    }

    /**
     * 2. OPF 파일 파싱 (metadata, manifest, spine)
     */
    async parseOpf() {
        const opfUrl = `${this.basePath}/${this.opfPath}`;
        const response = await fetch(opfUrl);
        if (!response.ok) {
            throw new Error(`OPF 파일 로드 실패 (상태코드 ${response.status}): ${opfUrl}`);
        }
        const xmlText = await response.text();
        const xmlDoc = this.parseXml(xmlText);

        // 메타데이터 파싱
        const titleEl = xmlDoc.querySelector('title') || xmlDoc.querySelector('dc\\:title');
        this.metadata.title = titleEl ? titleEl.textContent.trim() : '제목 없는 책';

        // 매니페스트 파싱
        const items = xmlDoc.querySelectorAll('manifest > item');
        let tocHref = null;

        items.forEach(item => {
            const id = item.getAttribute('id');
            const href = item.getAttribute('href');
            const mediaType = item.getAttribute('media-type');
            const properties = item.getAttribute('properties') || '';

            // OPF 폴더 상대 경로 기준 풀 경로 생성
            const fullHref = this.opfDir ? `${this.opfDir}/${href}` : href;

            this.manifest[id] = {
                id,
                href: fullHref,
                rawHref: href,
                mediaType,
                properties
            };

            // EPUB 3 nav 또는 EPUB 2 NCX 확인
            if (properties.includes('nav') || mediaType === 'application/x-dtbncx+xml' || id === 'ncx') {
                tocHref = fullHref;
            }
        });

        // 스파인(읽기 순서) 파싱
        const itemrefs = xmlDoc.querySelectorAll('spine > itemref');
        itemrefs.forEach(itemref => {
            const idref = itemref.getAttribute('idref');
            if (this.manifest[idref]) {
                this.spine.push(this.manifest[idref]);
            }
        });

        // 목차 파싱 실행
        if (tocHref) {
            await this.parseToc(tocHref);
        }
    }

    /**
     * 3. 목차(TOC) 파싱 (nav.xhtml 또는 toc.ncx)
     */
    async parseToc(tocHref) {
        const tocUrl = `${this.basePath}/${tocHref}`;
        try {
            const response = await fetch(tocUrl);
            if (!response.ok) return;

            const text = await response.text();
            const doc = tocHref.endsWith('.ncx') ? this.parseXml(text) : this.parseHtml(text);

            const tocList = [];

            if (tocHref.endsWith('.ncx')) {
                const navPoints = doc.querySelectorAll('navPoint');
                navPoints.forEach(np => {
                    const label = np.querySelector('navLabel > text');
                    const content = np.querySelector('content');
                    if (label && content) {
                        const src = content.getAttribute('src');
                        const fullHref = this.opfDir ? `${this.opfDir}/${src}` : src;
                        tocList.push({
                            title: label.textContent.trim(),
                            href: fullHref
                        });
                    }
                });
            } else {
                const links = doc.querySelectorAll('nav[*|type="toc"] a, nav#toc a, nav a');
                links.forEach(link => {
                    const title = link.textContent.trim();
                    const rawHref = link.getAttribute('href');
                    if (title && rawHref) {
                        const fullHref = this.opfDir ? `${this.opfDir}/${rawHref}` : rawHref;
                        tocList.push({
                            title,
                            href: fullHref
                        });
                    }
                });
            }

            this.toc = tocList;
        } catch (err) {
            console.warn('TOC 파싱 중 경고:', err);
        }
    }

    /**
     * 전체 파싱 수행
     */
    async load() {
        await this.parseContainer();
        await this.parseOpf();
        return {
            basePath: this.basePath,
            metadata: this.metadata,
            spine: this.spine,
            toc: this.toc
        };
    }
}
