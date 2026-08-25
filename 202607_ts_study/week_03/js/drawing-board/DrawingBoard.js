/**
 * DrawingBoard.js
 * LitElement 기반 커스텀 엘리먼트 (<lib-drawing-board>) 컴포넌트 클래스
 */

import { LitElement, html, css } from 'lit';
import { DrawingController } from './DrawingController.js';

/**
 * 점 배열을 SVG 패스 d 문자열(베지어 곡선)로 변환
 */
function pointsToSvgPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y}`;
  }
  if (points.length === 2) {
    const p1 = points[0];
    const p2 = points[1];
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }

  const p0 = points[0];
  let pathStr = `M ${p0.x} ${p0.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = Math.round((p1.x + (p2.x - p1.x) / 2) * 10) / 10;
    const midY = Math.round((p1.y + (p2.y - p1.y) / 2) * 10) / 10;
    pathStr += ` Q ${p1.x} ${p1.y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  pathStr += ` L ${last.x} ${last.y}`;
  return pathStr;
}

export class DrawingBoard extends LitElement {
  static properties = {
    width: { type: Number },
    height: { type: Number },
    tool: { type: String },
    color: { type: String },
    lineWidth: { type: Number },
    showGuides: { type: Boolean, attribute: 'show-guides' },
    fitMode: { state: true },
    cursorInfo: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      overflow: hidden;
      touch-action: none;
      user-select: none;
      max-width: 100%;
      max-height: 100%;
    }
    svg {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      cursor: crosshair;
      display: block;
      touch-action: none;
    }
  `;

  constructor() {
    super();
    this.ctrl = new DrawingController(this);
    this.width = 0;
    this.height = 0;
    this.showGuides = false;
    this.fitMode = 'cover-height';
    this.resizeObserver = null;
    this.cursorInfo = null;

    this._onReplayStart = (e) => this.applyReplayEvent({ phase: 'start', ...e.detail });
    this._onReplayMove = (e) => this.applyReplayEvent({ phase: 'move', ...e.detail });
    this._onReplayEnd = (e) => this.applyReplayEvent({ phase: 'end', ...e.detail });
  }

  get tool() { return this.ctrl.tool; }
  set tool(val) {
    const changed = this.ctrl.setTool(val);
    if (changed) {
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { tool: val, color: changed.color, width: changed.width }
      }));
    }
  }

  get color() { return this.ctrl.color; }
  set color(val) { this.ctrl.setColor(val); }

  get lineWidth() { return this.ctrl.lineWidth; }
  set lineWidth(val) { this.ctrl.setLineWidth(val); }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('drawing-replay-start', this._onReplayStart);
    this.addEventListener('drawing-replay-move', this._onReplayMove);
    this.addEventListener('drawing-replay-end', this._onReplayEnd);
    this.initSize();

    if (this.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.checkFit());
      this.resizeObserver.observe(this.parentElement);
    }
    this.checkFit();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.removeEventListener('drawing-replay-start', this._onReplayStart);
    this.removeEventListener('drawing-replay-move', this._onReplayMove);
    this.removeEventListener('drawing-replay-end', this._onReplayEnd);
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('width') || changedProperties.has('height')) {
      this.checkFit();
    }
  }

  initSize() {
    const isNoWidth = this.width === 0;
    const isNoHeight = this.height === 0;
    if (isNoWidth || isNoHeight) {
      const rect = (this.parentElement || document.body).getBoundingClientRect();
      if (isNoWidth) this.width = rect.width || 1000;
      if (isNoHeight) this.height = rect.height || 700;
    }
    this.checkFit();
  }

  checkFit() {
    const parent = this.parentElement;
    if (!parent) return;
    const parentRatio = parent.clientWidth / parent.clientHeight;
    const boardRatio = this.width / this.height;
    this.fitMode = parentRatio > boardRatio ? 'cover-height' : 'cover-width';
  }

  undo() { this.ctrl.undo(); }
  redo() { this.ctrl.redo(); }
  canUndo() { return this.ctrl.canUndo; }
  canRedo() { return this.ctrl.canRedo; }
  clear() { this.ctrl.clear(); }
  setSplitMode(val) { this.ctrl.setSplitMode(val); }
  exportData() { return this.ctrl.exportData(); }
  exportAsBlob(format = 'svg') {
    const svgEl = this.shadowRoot?.querySelector('svg');
    return this.ctrl.exportAsBlob(svgEl, format);
  }
  importData(jsonString, side) { this.ctrl.importData(jsonString, side); }

  applyReplayEvent(detail) {
    this._applyReplayStyle(detail);
    if (detail.phase === 'end') {
      this.ctrl.stopReplay();
      this.cursorInfo = null;
      return;
    }
    if (typeof detail.x === 'number' && typeof detail.y === 'number') {
      if (detail.phase === 'start') {
        this.ctrl.startAt(detail.x, detail.y);
      } else {
        this.ctrl.moveTo(detail.x, detail.y);
      }
      if (this.tool === 'eraser') {
        this.cursorInfo = { x: detail.x, y: detail.y, show: true };
      }
    }
  }

  _applyReplayStyle(detail) {
    if (detail.tool) this.tool = detail.tool;
    if (typeof detail.color === 'string') this.color = detail.color;
    if (typeof detail.width === 'number') this.lineWidth = detail.width;
  }

  _handlePointerDown(e) {
    const svgEl = this.shadowRoot?.querySelector('svg');
    this.ctrl.start(e, svgEl);
    if (e.button !== 0) return;
    const pt = this.ctrl.getSvgCoordinates(svgEl, e.clientX, e.clientY);
    if (this.tool === 'eraser' && pt) {
      this.cursorInfo = { x: pt.x, y: pt.y, show: true };
    }
  }

  _handlePointerMove(e) {
    const svgEl = this.shadowRoot?.querySelector('svg');
    this.ctrl.move(e, svgEl);
    const pt = this.ctrl.getSvgCoordinates(svgEl, e.clientX, e.clientY);
    if (this.tool === 'eraser' && pt) {
      this.cursorInfo = { x: pt.x, y: pt.y, show: true };
    }
  }

  _stopAndDispatch(e) {
    const svgEl = this.shadowRoot?.querySelector('svg');
    this.ctrl.stop(e);
  }

  renderStroke(stroke) {
    const pathD = pointsToSvgPath(stroke.points);
    const lineCap = stroke.lineCap || 'round';

    return html`
      <path
        d="${pathD}"
        stroke="${stroke.color}"
        stroke-width="${stroke.width}"
        opacity="${stroke.opacity || 1}"
        fill="none"
        stroke-linecap="${lineCap}"
        stroke-linejoin="round"
        style="mix-blend-mode: ${stroke.tool === 'highlighter' ? 'multiply' : 'normal'};"
      />
    `;
  }

  renderCurrentStroke() {
    if (!this.ctrl.isDrawing || this.ctrl.currentPoints.length === 0) return null;
    const config = this.ctrl.getCurrentStrokeConfig();
    const stroke = {
      points: this.ctrl.currentPoints,
      color: config.color,
      width: config.width,
      opacity: config.opacity,
      lineCap: config.lineCap,
      tool: config.tool
    };
    return this.renderStroke(stroke);
  }

  renderEraserCursor() {
    if (this.tool !== 'eraser' || !this.cursorInfo || !this.cursorInfo.show) return null;
    const size = Math.max(20, this.ctrl.configs.eraser.width);
    return html`
      <circle
        cx="${this.cursorInfo.x}"
        cy="${this.cursorInfo.y}"
        r="${size / 2}"
        fill="rgba(255, 0, 0, 0.2)"
        stroke="#ff0000"
        stroke-width="1.5"
        style="pointer-events: none;"
      />
    `;
  }

  render() {
    const fitCss = this.fitMode === 'cover-height' ? css`:host { height: 100%; width: auto; }` : css`:host { width: 100%; height: auto; }`;
    const isSplit = this.ctrl.isSplitMode;

    return html`
      <style>
        ${fitCss}
      </style>
      <svg
        viewBox="0 0 ${this.width} ${this.height}"
        preserveAspectRatio="xMidYMid meet"
        @pointerdown="${this._handlePointerDown}"
        @pointermove="${this._handlePointerMove}"
        @pointerup="${this._stopAndDispatch}"
        @pointerleave="${(e) => { this._stopAndDispatch(e); this.cursorInfo = null; }}"
      >
        ${this.ctrl.strokes.map((s) => this.renderStroke(s))}
        ${this.renderCurrentStroke()}
        ${this.renderEraserCursor()}

        ${isSplit ? html`
          <line
            x1="${this.width / 2}" y1="0"
            x2="${this.width / 2}" y2="${this.height}"
            stroke="#ff0000" stroke-width="1" stroke-dasharray="10,5" opacity="0.5"
            style="pointer-events: none;"
          />
          <text
            x="${this.width / 2}" y="20"
            fill="#ff0000" opacity="0.5" font-size="12" text-anchor="middle"
            style="pointer-events: none; user-select: none;"
          >양면 모드</text>
        ` : null}
      </svg>
    `;
  }
}

if (!customElements.get('lib-drawing-board')) {
  customElements.define('lib-drawing-board', DrawingBoard);
}
