/**
 * 3D 주사위 굴리기 게임 애플리케이션
 * HTML, CSS, JS 분리 아키텍처
 */

// 각 주사위 눈금(1~6)을 정면으로 향하게 만드는 기본 회전 각도 (단위: deg)
// CSS 큐브 배치 기준:
// 1: front (rotateY 0)
// 6: back (rotateY 180)
// 2: right (rotateY 90) -> 정면으로 보려면 rotateY -90
// 5: left (rotateY -90) -> 정면으로 보려면 rotateY 90
// 3: top (rotateX 90) -> 정면으로 보려면 rotateX -90
// 4: bottom (rotateX -90) -> 정면으로 보려면 rotateX 90
const FACE_ANGLES = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 }
};

// 애플리케이션 상태
const state = {
  diceCount: 1, // 1 or 2
  isRolling: false,
  soundEnabled: true,
  rotations: [
    { x: 0, y: 0 }, // 주사위 1 누적 회전 각도
    { x: 0, y: 0 }  // 주사위 2 누적 회전 각도
  ],
  history: []
};

// DOM 요소 캐싱
const elements = {
  // Mode selectors
  modeBtn1: document.getElementById('mode-1'),
  modeBtn2: document.getElementById('mode-2'),
  
  // Dice containers
  diceArena: document.getElementById('dice-arena'),
  dice1Wrap: document.getElementById('dice-wrap-1'),
  dice2Wrap: document.getElementById('dice-wrap-2'),
  diceCube1: document.getElementById('dice-cube-1'),
  diceCube2: document.getElementById('dice-cube-2'),
  
  // Controls
  rollBtn: document.getElementById('roll-btn'),
  soundBtn: document.getElementById('sound-toggle-btn'),
  soundIconOn: document.getElementById('sound-icon-on'),
  soundIconOff: document.getElementById('sound-icon-off'),
  
  // Results
  statusIndicator: document.getElementById('status-indicator'),
  resultCaption: document.getElementById('result-caption'),
  resultNumber: document.getElementById('result-number'),
  diceBreakdown: document.getElementById('dice-breakdown'),
  breakdownVal1: document.getElementById('breakdown-val-1'),
  breakdownVal2: document.getElementById('breakdown-val-2'),
  doubleBadge: document.getElementById('double-badge'),
  
  // History
  historyList: document.getElementById('history-list'),
  clearHistoryBtn: document.getElementById('clear-history-btn')
};

// ==========================================
// Web Audio API를 활용한 효과음 생성 (무음원 방식)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  // 주사위 굴리는 덜그럭/회전 사운드
  playRoll() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const count = 7;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!state.isRolling) return;
        this.playClick(280 + Math.random() * 200, 0.035, 0.15);
      }, i * 130 + Math.random() * 40);
    }
  }

  // 주사위가 바닥에 안착하는 탁! 사운드
  playThud() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // 메인 타격음
    this.playClick(150, 0.08, 0.35);
    setTimeout(() => {
      this.playClick(220, 0.04, 0.2);
    }, 60);
  }

  playClick(freq, duration, gainVal) {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // AudioContext 제한 무시
    }
  }
}

const sfx = new SoundFX();

// ==========================================
// 1~6 난수 생성
// ==========================================
function getRandomDiceValue() {
  return Math.floor(Math.random() * 6) + 1;
}

// ==========================================
// 다음 목표 3D 회전 각도 계산
// (이전 회전값에 최소 3~4바퀴를 더 회전시켜 자연스러운 가속/감속 롤링 구현)
// ==========================================
function calculateNextAngle(diceIndex, targetVal) {
  const current = state.rotations[diceIndex];
  const targetFace = FACE_ANGLES[targetVal];

  // 1080도(3바퀴) ~ 1800도(5바퀴) 무작위 다회전 누적
  const minTurns = 3;
  const randomExtraTurnsX = (Math.floor(Math.random() * 2) + minTurns) * 360;
  const randomExtraTurnsY = (Math.floor(Math.random() * 2) + minTurns) * 360;

  // 이전 회전 각도의 정수 배수에서 눈금 목표 각도만큼 더함
  const baseRoundX = Math.round(current.x / 360) * 360;
  const baseRoundY = Math.round(current.y / 360) * 360;

  const nextX = baseRoundX + randomExtraTurnsX + targetFace.x;
  const nextY = baseRoundY + randomExtraTurnsY + targetFace.y;

  // 다음 롤링을 위해 누적 상태 저장
  state.rotations[diceIndex] = { x: nextX, y: nextY };

  return { x: nextX, y: nextY };
}

// ==========================================
// 주사위 던지기 실행
// ==========================================
function rollDice() {
  if (state.isRolling) return;

  state.isRolling = true;
  elements.rollBtn.disabled = true;
  elements.statusIndicator.classList.add('rolling');

  // 효과음
  sfx.playRoll();

  // 롤링 중 시각 효과
  elements.dice1Wrap.classList.add('rolling');
  if (state.diceCount === 2) {
    elements.dice2Wrap.classList.add('rolling');
  }

  // 결과 패널 롤링 표시
  elements.resultNumber.classList.remove('pop');
  elements.resultNumber.textContent = '...';
  elements.doubleBadge.classList.remove('show');

  // 주사위 1 난수 및 회전
  const val1 = getRandomDiceValue();
  const angle1 = calculateNextAngle(0, val1);
  elements.diceCube1.style.transform = `rotateX(${angle1.x}deg) rotateY(${angle1.y}deg)`;

  // 주사위 2 난수 및 회전 (모드에 따라)
  let val2 = 0;
  if (state.diceCount === 2) {
    val2 = getRandomDiceValue();
    const angle2 = calculateNextAngle(1, val2);
    elements.diceCube2.style.transform = `rotateX(${angle2.x}deg) rotateY(${angle2.y}deg)`;
  }

  // 애니메이션 완료 대기 (CSS duration 1.2s와 동기화)
  setTimeout(() => {
    state.isRolling = false;
    elements.rollBtn.disabled = false;
    elements.statusIndicator.classList.remove('rolling');
    elements.dice1Wrap.classList.remove('rolling');
    elements.dice2Wrap.classList.remove('rolling');

    // 착지 타격음
    sfx.playThud();

    // 결과 수치 반영
    renderResult(val1, val2);
  }, 1200);
}

// ==========================================
// 결과 렌더링
// ==========================================
function renderResult(val1, val2) {
  let mainValue = 0;
  let isDouble = false;

  if (state.diceCount === 1) {
    mainValue = val1;
    elements.resultCaption.textContent = '주사위 결과';
    elements.diceBreakdown.classList.remove('show');
    elements.doubleBadge.classList.remove('show');
  } else {
    mainValue = val1 + val2;
    elements.resultCaption.textContent = '주사위 합계';
    elements.breakdownVal1.textContent = val1;
    elements.breakdownVal2.textContent = val2;
    elements.diceBreakdown.classList.add('show');

    if (val1 === val2) {
      isDouble = true;
      elements.doubleBadge.classList.add('show');
    } else {
      elements.doubleBadge.classList.remove('show');
    }
  }

  // 큰 숫자 업데이트 & Pop 애니메이션
  elements.resultNumber.textContent = mainValue;
  elements.resultNumber.classList.remove('pop');
  // 브라우저 리플로우 강제 후 애니메이션 재적용
  void elements.resultNumber.offsetWidth;
  elements.resultNumber.classList.add('pop');

  // 히스토리 기록 추가
  addHistoryRecord({
    count: state.diceCount,
    val1,
    val2,
    sum: mainValue,
    isDouble
  });
}

// ==========================================
// 히스토리 관리
// ==========================================
function addHistoryRecord(record) {
  state.history.unshift(record);
  if (state.history.length > 8) {
    state.history.pop();
  }
  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = '<li class="history-empty">아직 던진 기록이 없습니다</li>';
    return;
  }

  elements.historyList.innerHTML = '';
  state.history.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'history-chip' + (item.isDouble ? ' double' : '');

    if (item.count === 1) {
      li.innerHTML = `<span>🎲</span> <strong>${item.val1}</strong>`;
    } else {
      li.innerHTML = `<span>🎲🎲</span> <strong>${item.sum}</strong> <small>(${item.val1}+${item.val2})</small>${item.isDouble ? ' ✨' : ''}`;
    }

    elements.historyList.appendChild(li);
  });
}

function clearHistory() {
  state.history = [];
  renderHistory();
}

// ==========================================
// 주사위 개수 모드 전환 (1개 vs 2개)
// ==========================================
function setDiceCount(count) {
  if (state.isRolling || state.diceCount === count) return;

  state.diceCount = count;

  if (count === 1) {
    elements.modeBtn1.classList.add('active');
    elements.modeBtn2.classList.remove('active');
    elements.modeBtn1.setAttribute('aria-selected', 'true');
    elements.modeBtn2.setAttribute('aria-selected', 'false');
    elements.diceArena.classList.add('single-mode');
    elements.dice2Wrap.classList.add('hidden');
    elements.diceBreakdown.classList.remove('show');
    elements.doubleBadge.classList.remove('show');
    elements.resultCaption.textContent = '주사위 결과';
  } else {
    elements.modeBtn1.classList.remove('active');
    elements.modeBtn2.classList.add('active');
    elements.modeBtn1.setAttribute('aria-selected', 'false');
    elements.modeBtn2.setAttribute('aria-selected', 'true');
    elements.diceArena.classList.remove('single-mode');
    elements.dice2Wrap.classList.remove('hidden');
    elements.resultCaption.textContent = '주사위 합계';
  }

  // 모드 변경 시 결과 표시 초기화
  elements.resultNumber.textContent = '-';
  elements.breakdownVal1.textContent = '-';
  elements.breakdownVal2.textContent = '-';
}

// ==========================================
// 사운드 토글
// ==========================================
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  if (state.soundEnabled) {
    elements.soundBtn.classList.remove('muted');
    elements.soundIconOn.style.display = 'block';
    elements.soundIconOff.style.display = 'none';
    elements.soundBtn.setAttribute('title', '사운드 켜짐 (클릭시 음소거)');
    sfx.init();
  } else {
    elements.soundBtn.classList.add('muted');
    elements.soundIconOn.style.display = 'none';
    elements.soundIconOff.style.display = 'block';
    elements.soundBtn.setAttribute('title', '사운드 음소거됨 (클릭시 켜기)');
  }
}

// ==========================================
// 이벤트 리스너 등록
// ==========================================
function initEvents() {
  // 모드 전환
  elements.modeBtn1.addEventListener('click', () => setDiceCount(1));
  elements.modeBtn2.addEventListener('click', () => setDiceCount(2));

  // 던지기 버튼
  elements.rollBtn.addEventListener('click', rollDice);

  // 사운드 토글
  elements.soundBtn.addEventListener('click', toggleSound);

  // 히스토리 삭제
  elements.clearHistoryBtn.addEventListener('click', clearHistory);

  // 키보드 단축키 (스페이스바)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      // 포커스가 버튼이나 input에 있지 않을 때만
      if (document.activeElement.tagName !== 'BUTTON') {
        e.preventDefault();
        rollDice();
      }
    }
  });
}

// 앱 초기화
function init() {
  initEvents();
  renderHistory();
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', init);
