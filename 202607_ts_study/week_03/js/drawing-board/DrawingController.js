/**
 * DrawingController.js
 * 그림판 도구(펜, 형광펜, 지우개) 상태 관리, 포인터 드래그 이벤트, 히스토리(Undo/Redo) 제어 클래스
 */

import { DrawingIO } from './DrawingIO.js';

function cloneDeep(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

function roundCoord(val, precision = 1) {
  const factor = Math.pow(10, precision);
  return Math.round(val * factor) / factor;
}

function lerp(start, end, amt) {
  return start * (1 - amt) + end * amt;
}

function distSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

const DEFAULT_TOOL_CONFIGS = {
  pen: { color: '#000000', width: 3, opacity: 1, blend: 'normal', lineCap: 'round' },
  highlighter: { color: '#eab308', width: 20, opacity: 0.5, blend: 'multiply', lineCap: 'butt' },
  eraser: { color: '#ffffff', width: 30, opacity: 1, blend: 'normal', lineCap: 'round' }
};

export class DrawingController {
  constructor(host) {
    this.strokes = [];
    this.currentPoints = [];
    this.isDrawing = false;
    this.history = [[]];
    this.historyStep = 0;
    this.configs = cloneDeep(DEFAULT_TOOL_CONFIGS);
    this._tool = 'pen';
    this._color = DEFAULT_TOOL_CONFIGS.pen.color;
    this._lineWidth = DEFAULT_TOOL_CONFIGS.pen.width;
    this._hasEraserChange = false;
    this.isSplitMode = false;
    this.host = host;

    if (host && typeof host.addController === 'function') {
      host.addController(this);
    }
  }

  hostConnected() { }
  hostDisconnected() { }

  _trySetPointerCapture(target, pointerId) {
    if (target && typeof target.setPointerCapture === 'function') {
      try { target.setPointerCapture(pointerId); } catch { }
    }
  }

  _tryReleasePointerCapture(target, pointerId) {
    if (target && typeof target.releasePointerCapture === 'function') {
      try {
        if (typeof target.hasPointerCapture === 'function' && !target.hasPointerCapture(pointerId)) return;
        target.releasePointerCapture(pointerId);
      } catch { }
    }
  }

  get tool() { return this._tool; }
  setTool(tool) {
    if (this._tool === tool) return null;
    this._tool = tool;
    const cfg = this.configs[tool];
    this._color = cfg.color;
    this._lineWidth = cfg.width;
    this.host.requestUpdate();
    return { color: this._color, width: this._lineWidth };
  }

  get color() { return this._color; }
  setColor(color) {
    if (this._color !== color) {
      this._color = color;
      this.configs[this._tool].color = color;
      this.host.requestUpdate();
    }
  }

  get lineWidth() { return this._lineWidth; }
  setLineWidth(width) {
    if (this._lineWidth !== width) {
      this._lineWidth = width;
      this.configs[this._tool].width = width;
      this.host.requestUpdate();
    }
  }

  getCurrentStrokeConfig() {
    const cfg = this.configs[this._tool];
    return {
      tool: this._tool,
      color: this._color,
      width: this._lineWidth,
      opacity: cfg.opacity,
      lineCap: cfg.lineCap || 'round'
    };
  }

  saveState() {
    if (this.historyStep < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyStep + 1);
    }
    this.history.push(cloneDeep(this.strokes));
    this.historyStep++;
    if (this.history.length > 50) {
      this.history.shift();
      this.historyStep--;
    }
  }

  get canUndo() { return this.historyStep > 0; }
  get canRedo() { return this.historyStep < this.history.length - 1; }

  undo() {
    if (this.canUndo) {
      this.historyStep--;
      this.strokes = cloneDeep(this.history[this.historyStep]);
      this.host.requestUpdate();
    }
  }

  redo() {
    if (this.canRedo) {
      this.historyStep++;
      this.strokes = cloneDeep(this.history[this.historyStep]);
      this.host.requestUpdate();
    }
  }

  clear() {
    this.strokes = [];
    this.currentPoints = [];
    this.history = [[]];
    this.historyStep = 0;
    this.host.requestUpdate();
  }

  setSplitMode(isSplit) {
    if (this.isSplitMode !== isSplit) {
      this.isSplitMode = isSplit;
      this.host.requestUpdate();
    }
  }

  exportData() {
    return DrawingIO.createExportData(this.strokes, this.host.width, this.host.height, this.isSplitMode);
  }

  exportAsBlob(svgElement, format = 'svg') {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    if (format === 'svg') return Promise.resolve(blob);

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = this.host.width;
        canvas.height = this.host.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(pngBlob => {
          pngBlob ? resolve(pngBlob) : reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('SVG image load failed'));
      };
      img.src = url;
    });
  }

  importData(jsonString, side = 'full') {
    try {
      const isSplit = this.isSplitMode;
      const merged = DrawingIO.parseAndMerge(jsonString, this.strokes, this.host.width, this.host.height, side, isSplit);
      this.strokes = merged;
      this.saveState();
      this.host.requestUpdate();
    } catch (err) {
      console.error('[DrawingBoard] Import Error:', err);
    }
  }

  start(e, svgElement) {
    if (e.button !== 0) return;
    this._trySetPointerCapture(e.target, e.pointerId);
    this._hasEraserChange = false;
    const pt = this.getSvgCoordinates(svgElement, e.clientX, e.clientY);

    if (this.tool === 'eraser') {
      if (pt) this.erase(pt.x, pt.y);
      return;
    }
    this.isDrawing = true;
    if (pt) {
      this.currentPoints = [{ x: roundCoord(pt.x), y: roundCoord(pt.y) }];
      this.host.requestUpdate();
    }
  }

  startAt(x, y) {
    this._hasEraserChange = false;
    if (this.tool === 'eraser') {
      this.erase(x, y);
      return;
    }
    this.isDrawing = true;
    this.currentPoints = [{ x: roundCoord(x), y: roundCoord(y) }];
    this.host.requestUpdate();
  }

  _drawMove(pt) {
    const last = this.currentPoints[this.currentPoints.length - 1];
    if (last) {
      const lerpX = lerp(last.x, pt.x, 0.5);
      const lerpY = lerp(last.y, pt.y, 0.5);
      if (distSq(last.x, last.y, lerpX, lerpY) < 10) return;
      this.currentPoints = [...this.currentPoints, { x: roundCoord(lerpX), y: roundCoord(lerpY) }];
    } else {
      this.currentPoints = [...this.currentPoints, { x: roundCoord(pt.x), y: roundCoord(pt.y) }];
    }
    this.host.requestUpdate();
  }

  move(e, svgElement) {
    const pt = this.getSvgCoordinates(svgElement, e.clientX, e.clientY);
    if (pt) {
      if (this.isDrawing) {
        this._drawMove(pt);
      } else if (this.tool === 'eraser' && e.buttons === 1) {
        this.erase(pt.x, pt.y);
      }
    }
  }

  moveTo(x, y) {
    if (this.isDrawing) {
      this._drawMove({ x, y });
    } else if (this.tool === 'eraser') {
      this.erase(x, y);
    }
  }

  erase(x, y) {
    const radiusSq = Math.pow(Math.max(20, this.configs.eraser.width) / 2, 2);
    const newStrokes = [];
    let changed = false;

    for (const stroke of this.strokes) {
      let hit = false;
      const strokeSegments = [];
      let currentSeg = [];

      for (const p of stroke.points) {
        const dx = p.x - x;
        const dy = p.y - y;
        if (dx * dx + dy * dy < radiusSq) {
          hit = true;
          if (currentSeg.length > 0) {
            strokeSegments.push(currentSeg);
            currentSeg = [];
          }
        } else {
          currentSeg.push(p);
        }
      }

      if (currentSeg.length > 1) strokeSegments.push(currentSeg);

      if (!hit) {
        newStrokes.push(stroke);
      } else {
        changed = true;
        for (const seg of strokeSegments) {
          newStrokes.push({ ...stroke, points: seg });
        }
      }
    }

    if (changed) {
      this.strokes = newStrokes;
      this._hasEraserChange = true;
      this.host.requestUpdate();
    }
  }

  stop(e) {
    if (this.isDrawing) {
      this._tryReleasePointerCapture(e.target, e.pointerId);
      this.isDrawing = false;
    } else if (this.tool === 'eraser') {
      this._tryReleasePointerCapture(e.target, e.pointerId);
    } else return;
    this._finalizeStop();
  }

  stopReplay() {
    if (this.isDrawing || this.tool === 'eraser') {
      this.isDrawing = false;
      this._finalizeStop();
    }
  }

  _finalizeStop() {
    let stateSaved = false;
    if (this.currentPoints.length > 0) {
      const config = this.getCurrentStrokeConfig();
      const stroke = {
        id: Date.now().toString(),
        points: this.currentPoints,
        color: config.color,
        width: config.width,
        tool: config.tool,
        opacity: config.opacity,
        lineCap: config.lineCap
      };
      this.strokes = [...this.strokes, stroke];
      this.currentPoints = [];
      stateSaved = true;
    }
    if (this.tool === 'eraser' && this._hasEraserChange) {
      stateSaved = true;
    }
    if (stateSaved) {
      this.saveState();
      this.host.requestUpdate();
    }
    this._hasEraserChange = false;
  }

  getSvgCoordinates(svgEl, clientX, clientY) {
    if (!svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    const viewBox = svgEl.viewBox.baseVal;
    const viewBoxWidth = viewBox.width || rect.width;
    const viewBoxHeight = viewBox.height || rect.height;

    const x = ((clientX - rect.left) / rect.width) * viewBoxWidth;
    const y = ((clientY - rect.top) / rect.height) * viewBoxHeight;
    return { x, y };
  }
}
