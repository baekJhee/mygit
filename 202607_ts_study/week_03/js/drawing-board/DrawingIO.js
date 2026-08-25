/**
 * DrawingIO.js
 * 그림판 스트로크 데이터 변환, 2분할(양면) 모드 데이터 컷팅 및 좌표 스케일링 유틸리티
 */

/**
 * 깊은 복사 헬퍼 함수
 */
function cloneDeep(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

export class DrawingIO {
  /**
   * 스트로크 데이터를 내보내기용 객체로 생성 (2분할 모드 지원)
   * @param {Array} strokes - 현재 그려진 스트로크 배열
   * @param {number} width - 보드 전체 너비
   * @param {number} height - 보드 전체 높이
   * @param {boolean} isSplitMode - 2분할(양면) 모드 여부
   * @returns {Array} 내보낼 그림 데이터 객체 배열
   */
  static createExportData(strokes, width, height, isSplitMode) {
    if (!isSplitMode) {
      return [{ version: 1, width, height, strokes: cloneDeep(strokes) }];
    }
    
    const halfWidth = width / 2;
    const leftStrokes = [];
    const rightStrokes = [];

    for (const stroke of strokes) {
      this.cutStrokeExact(stroke, halfWidth).forEach(item => {
        if (item.side === 'left') {
          leftStrokes.push(item.stroke);
        } else {
          rightStrokes.push(this.shiftStroke(item.stroke, -halfWidth));
        }
      });
    }

    const meta = { version: 1, width: halfWidth, height };
    return [
      { ...meta, strokes: leftStrokes },
      { ...meta, strokes: rightStrokes }
    ];
  }

  /**
   * JSON 데이터를 파싱하여 기존 스트로크와 병합
   */
  static parseAndMerge(jsonString, currentStrokes, canvasWidth, canvasHeight, side = 'full', isSplitMode = false) {
    let data;
    try {
      data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object' || !Array.isArray(data.strokes)) {
        console.error('[DrawingBoard] Invalid DrawingData format: strokes property is missing or not an array');
        return currentStrokes;
      }
    } catch (err) {
      console.error('[DrawingBoard] Failed to parse jsonString in DrawingIO.parseAndMerge:', err);
      return currentStrokes;
    }

    let inputStrokes = data.strokes;
    const halfWidth = canvasWidth / 2;
    const targetWidth = side === 'full' ? canvasWidth : halfWidth;
    const offsetX = side === 'right' ? halfWidth : 0;

    const scaleX = data.width > 0 ? targetWidth / data.width : 1;
    const scaleY = data.height > 0 ? canvasHeight / data.height : 1;

    if (scaleX !== 1 || scaleY !== 1 || offsetX !== 0) {
      inputStrokes = inputStrokes.map(s => this.scaleStroke(s, scaleX, scaleY, offsetX));
    }

    const filteredExisting = currentStrokes.filter(s => {
      const isRight = this.isStrokeRightSide(s, halfWidth);
      if (side === 'full') return false;
      if (side === 'left') return isRight;
      if (side === 'right') return !isRight;
      return true;
    });

    return [...filteredExisting, ...inputStrokes];
  }

  /**
   * 분할 기준선(splitX)을 기준으로 하나의 스트로크를 좌/우로 정밀 절단
   */
  static cutStrokeExact(stroke, splitX) {
    const points = stroke.points;
    if (points.length < 2) return [];

    const result = [];
    let currentPoints = [points[0]];
    let currentSide = points[0].x < splitX ? 'left' : 'right';

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const p2Side = p2.x < splitX ? 'left' : 'right';

      if (p2Side === currentSide) {
        currentPoints.push(p2);
      } else {
        const t = (splitX - p1.x) / (p2.x - p1.x);
        const intersectY = p1.y + t * (p2.y - p1.y);
        const intersectPoint = { x: splitX, y: intersectY, pressure: p1.pressure ?? 0.5 };

        currentPoints.push(intersectPoint);
        if (currentPoints.length > 1) {
          result.push({ stroke: { ...stroke, points: [...currentPoints] }, side: currentSide });
        }

        currentSide = p2Side;
        currentPoints = [{ ...intersectPoint }, p2];
      }
    }

    if (currentPoints.length > 1) {
      result.push({ stroke: { ...stroke, points: currentPoints }, side: currentSide });
    }

    return result;
  }

  /**
   * 스트로크의 X좌표 이동
   */
  static shiftStroke(stroke, shiftX) {
    const newStroke = cloneDeep(stroke);
    newStroke.points.forEach(p => (p.x += shiftX));
    return newStroke;
  }

  /**
   * 스트로크의 크기(Scale) 및 위치(Offset) 조절
   */
  static scaleStroke(stroke, scaleX, scaleY, offsetX) {
    const newStroke = cloneDeep(stroke);
    newStroke.points.forEach(p => {
      p.x = p.x * scaleX + offsetX;
      p.y = p.y * scaleY;
    });
    return newStroke;
  }

  /**
   * 스트로크의 중심 X좌표가 오른쪽 영역인지 판별
   */
  static isStrokeRightSide(stroke, splitX) {
    if (stroke.points.length === 0) return false;
    const avgX = stroke.points.reduce((sum, p) => sum + p.x, 0) / stroke.points.length;
    return avgX >= splitX;
  }
}
