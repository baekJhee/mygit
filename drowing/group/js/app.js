/**
 * ⭐ 모둠 스티커 보드 (Group Sticker Board) JavaScript
 * 
 * 기능:
 * 1. 초기 진입 시 기본 3모둠, 스티커 5개로 구성 (재접속/새로고침 시 항상 기본 초기화)
 * 2. 4가지 고화질 벡터 스티커 (별, 스마일, 하트, 체크)
 * 3. 스티커 슬롯 클릭 시 오직 클릭한 요소만 '확대되었다 찹!' 달라붙는 애니메이션 적용
 * 4. 각 모둠별 [⚡ 다 붙이기] 기능 및 [↺ 비우기] 기능
 * 5. 심플 모둠 설정 팝업 (모둠수 3~20, 스티커 5~20) 및 유효성 검사 경고창
 * 6. 모둠 이름 인라인 편집 기능
 * 7. Web Audio API 찰진 효과음 및 완주 시 팡파레 & 꽃가루 폭죽(Confetti)
 */

(function () {
  'use strict';

  // ==========================================
  // 1. 상수 및 초기 기본값 설정
  // ==========================================
  const CONFIG = {
    DEFAULT_GROUP_COUNT: 3,
    DEFAULT_STICKER_COUNT: 5,
    MIN_GROUP: 3,
    MAX_GROUP: 20,
    MIN_STICKER: 5,
    MAX_STICKER: 20,
    STORAGE_KEY: 'classroom_group_sticker_board_v1'
  };

  // 스티커 SVG 벡터 그래픽 (사용자가 전달한 이미지 속 4가지 디자인)
  const STICKER_SVGS = {
    star: `<svg viewBox="0 0 36 36"><path fill="#FFB300" d="M18 2.5l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L18 26.2l-9.3 4.8 1.8-10.3-7.5-7.3 10.4-1.5L18 2.5z" stroke="#FFA000" stroke-width="0.5" stroke-linejoin="round"/></svg>`,
    smile: `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#FFCA28"/><circle cx="12.5" cy="14" r="2.2" fill="#4E342E"/><circle cx="23.5" cy="14" r="2.2" fill="#4E342E"/><path d="M11 20c1.8 4.2 12.2 4.2 14 0" fill="none" stroke="#4E342E" stroke-width="2.6" stroke-linecap="round"/></svg>`,
    heart: `<svg viewBox="0 0 36 36"><path fill="#FF5252" d="M18 31.8S4.5 22.5 4.5 13C4.5 8 8.5 4.5 13.2 4.5c3.2 0 6 1.8 7.3 4.5 1.3-2.7 4.1-4.5 7.3-4.5 4.7 0 8.7 3.5 8.7 8.5 0 9.5-13.5 18.8-18.5 18.8z"/></svg>`,
    check: `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#1E88E5"/><path d="M11 18.5l4.8 4.8 9.5-9.5" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  // ==========================================
  // 2. 애플리케이션 상태 (State)
  // ==========================================
  const state = {
    groupCount: CONFIG.DEFAULT_GROUP_COUNT,
    stickerTargetCount: CONFIG.DEFAULT_STICKER_COUNT,
    stickerTheme: 'star',
    soundEnabled: true,
    groups: [] // [{ id: 1, name: '1모둠', stickers: [true, false, ...] }]
  };

  // ==========================================
  // 3. DOM 요소 캐싱
  // ==========================================
  const DOM = {
    // 모둠 컨테이너
    groupsContainer: document.getElementById('groupsContainer'),

    // 상단 컨트롤
    stickerThemeGroup: document.getElementById('stickerThemeGroup'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    resetAllStickersBtn: document.getElementById('resetAllStickersBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),

    // 설정 모달
    settingsModal: document.getElementById('settingsModal'),
    settingsForm: document.getElementById('settingsForm'),
    groupCountInput: document.getElementById('groupCountInput'),
    stickerCountInput: document.getElementById('stickerCountInput'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
    confirmSettingsBtn: document.getElementById('confirmSettingsBtn'),

    // 경고 알림 모달
    alertModal: document.getElementById('alertModal'),
    alertMessage: document.getElementById('alertMessage'),
    alertConfirmBtn: document.getElementById('alertConfirmBtn'),

    // 리셋 확인 모달
    confirmResetModal: document.getElementById('confirmResetModal'),
    cancelResetBtn: document.getElementById('cancelResetBtn'),
    executeResetBtn: document.getElementById('executeResetBtn'),

    // 컨페티 캔버스
    confettiCanvas: document.getElementById('confettiCanvas')
  };

  // ==========================================
  // 4. 사운드 시스템 (Web Audio API)
  // ==========================================
  class SoundManager {
    constructor() {
      this.ctx = null;
    }

    initContext() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // 스티커 붙일 때 찰진 '찹!' 사운드
    playAttach() {
      if (!state.soundEnabled) return;
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      // 높은 곳에서 빠르게 떨어져 바닥에 찹! 달라붙는 주파수
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    }

    // 스티커 뗄 때 부드러운 퐁 소리
    playDetach() {
      if (!state.soundEnabled) return;
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    }

    // 유효성 경고 시 띠릭! 경고음
    playAlert() {
      if (!state.soundEnabled) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(220, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }

    // 완주 달성 시 축하 팡파레 소리
    playFanfare() {
      if (!state.soundEnabled) return;
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    }
  }

  const sound = new SoundManager();

  // ==========================================
  // 5. 컨페티 (꽃가루 폭죽) 애니메이션 효과
  // ==========================================
  class ConfettiManager {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.animationId = null;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    fire() {
      this.resize();
      const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316'];
      const count = 100;

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: window.innerWidth * (0.3 + Math.random() * 0.4),
          y: window.innerHeight * 0.4,
          w: Math.random() * 9 + 5,
          h: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 14,
          vy: Math.random() * -12 - 4,
          gravity: 0.4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          opacity: 1
        });
      }

      if (!this.animationId) {
        this.animate();
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        if (p.opacity <= 0 || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = Math.max(0, p.opacity);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.animate());
      } else {
        this.animationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  const confetti = new ConfettiManager(DOM.confettiCanvas);

  // ==========================================
  // 6. 데이터 초기화 관리 (재접속/새로고침 시 항상 기본 초기화)
  // ==========================================
  function createDefaultGroups(count, stickersPerGroup) {
    const newGroups = [];
    for (let i = 1; i <= count; i++) {
      newGroups.push({
        id: i,
        name: `${i}모둠`,
        stickers: new Array(stickersPerGroup).fill(false)
      });
    }
    return newGroups;
  }

  function clearSavedStorage() {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEY);
    } catch (e) {
      // 무시
    }
  }

  // ==========================================
  // 7. 렌더링 함수들
  // ==========================================

  // 모둠 수와 스티커 개수에 맞춘 최적 그리드 및 모둠판 크기 계산 (상하좌우 여백 및 자연스러운 크기 변화)
  function updateGridDimensions() {
    const gCount = state.groupCount;
    const sCount = state.stickerTargetCount;

    // 1) 모둠 카드 배치 열/행 계산 (화면에 맞춘 최적 분할)
    let cols, rows;
    if (gCount <= 3) {
      cols = gCount;
      rows = 1;
    } else if (gCount === 4) {
      cols = 4;
      rows = 1;
    } else if (gCount <= 6) {
      cols = 3;
      rows = 2;
    } else if (gCount <= 8) {
      cols = 4;
      rows = 2;
    } else if (gCount <= 10) {
      cols = 5;
      rows = 2;
    } else if (gCount <= 12) {
      cols = 4;
      rows = 3;
    } else if (gCount <= 15) {
      cols = 5;
      rows = 3;
    } else {
      cols = 5;
      rows = 4;
    }

    // 2) 스티커 슬롯 배치 열/행 계산 (5~20 스티커)
    let sCols, sRows;
    if (sCount <= 5) {
      sCols = sCount;
      sRows = 1;
    } else if (sCount <= 8) {
      sCols = 4;
      sRows = 2;
    } else if (sCount <= 10) {
      sCols = 5;
      sRows = 2;
    } else if (sCount <= 15) {
      sCols = 5;
      sRows = 3;
    } else {
      sCols = 5;
      sRows = 4;
    }

    // 3) 모둠판 컨테이너의 자연스러운 최대 너비(max-width) 및 최대 높이(max-height)
    // 모둠 수가 적을 때 억지로 늘어나지 않고 상하좌우 여백을 주어 예쁘게 가운데 정렬!
    let maxGridW, maxGridH, gridGap, cardPadding, boardPadding, slotGap, maxSlotSize;

    // 가로 최대 너비 계산
    if (gCount === 3) {
      maxGridW = '1080px';
      gridGap = '20px';
      cardPadding = '14px 18px';
    } else if (gCount === 4) {
      maxGridW = '1300px';
      gridGap = '16px';
      cardPadding = '12px 14px';
    } else if (gCount <= 6) {
      maxGridW = '1140px';
      gridGap = '14px';
      cardPadding = '10px 12px';
    } else if (gCount <= 8) {
      maxGridW = '1380px';
      gridGap = '12px';
      cardPadding = '8px 10px';
    } else if (gCount <= 10) {
      maxGridW = '1540px';
      gridGap = '10px';
      cardPadding = '8px 10px';
    } else if (gCount <= 15) {
      maxGridW = '1600px';
      gridGap = '8px';
      cardPadding = '6px 8px';
    } else {
      maxGridW = '100%';
      gridGap = '6px';
      cardPadding = '5px 7px';
    }

    // 세로 최대 높이 계산 (스티커 개수 sRows 및 행 수 rows에 따라 비례)
    if (rows === 1) {
      // 1행 (3~4 모둠)
      if (sRows === 1) {
        maxGridH = '250px';
        maxSlotSize = '68px';
      } else if (sRows === 2) {
        maxGridH = '330px';
        maxSlotSize = '62px';
      } else if (sRows === 3) {
        maxGridH = '410px';
        maxSlotSize = '56px';
      } else {
        maxGridH = '490px';
        maxSlotSize = '52px';
      }
      boardPadding = '10px 12px';
      slotGap = '10px';
    } else if (rows === 2) {
      // 2행 (5~10 모둠)
      if (sRows === 1) {
        maxGridH = '440px';
        maxSlotSize = '56px';
      } else if (sRows === 2) {
        maxGridH = '560px';
        maxSlotSize = '50px';
      } else {
        maxGridH = '640px';
        maxSlotSize = '44px';
      }
      boardPadding = '8px 10px';
      slotGap = '8px';
    } else if (rows === 3) {
      // 3행 (11~15 모둠)
      maxGridH = '100%';
      maxSlotSize = '42px';
      boardPadding = '6px 8px';
      slotGap = '6px';
    } else {
      // 4행 (16~20 모둠)
      maxGridH = '100%';
      maxSlotSize = '36px';
      boardPadding = '4px 6px';
      slotGap = '4px';
    }

    DOM.groupsContainer.style.setProperty('--grid-cols', cols);
    DOM.groupsContainer.style.setProperty('--grid-rows', rows);
    DOM.groupsContainer.style.setProperty('--sticker-cols', sCols);
    DOM.groupsContainer.style.setProperty('--sticker-rows', sRows);
    DOM.groupsContainer.style.setProperty('--max-grid-w', maxGridW);
    DOM.groupsContainer.style.setProperty('--max-grid-h', maxGridH);
    DOM.groupsContainer.style.setProperty('--grid-gap', gridGap);
    DOM.groupsContainer.style.setProperty('--card-padding', cardPadding);
    DOM.groupsContainer.style.setProperty('--board-padding', boardPadding);
    DOM.groupsContainer.style.setProperty('--slot-gap', slotGap);
    DOM.groupsContainer.style.setProperty('--max-slot-size', maxSlotSize);
  }

  // 모둠 목록 전체 렌더링
  function renderGroups() {
    updateGridDimensions();
    DOM.groupsContainer.innerHTML = '';
    DOM.groupsContainer.setAttribute('data-count', state.groupCount);

    state.groups.forEach((group, index) => {
      const card = createGroupCardElement(group, index + 1);
      DOM.groupsContainer.appendChild(card);
    });
  }

  // 개별 모둠 카드 DOM 요소 생성
  function createGroupCardElement(group, groupNumber) {
    const card = document.createElement('article');
    const attachedCount = group.stickers.filter(Boolean).length;
    const isCompleted = attachedCount >= state.stickerTargetCount;
    const currentSvg = STICKER_SVGS[state.stickerTheme] || STICKER_SVGS.star;

    // 클래스 및 테마 설정 (1~20 모둠 컬러 순환)
    const themeIndex = ((groupNumber - 1) % 20) + 1;
    card.className = `group-card group-theme-${themeIndex} ${isCompleted ? 'goal-completed' : ''}`;
    card.setAttribute('data-group-id', group.id);
    card.setAttribute('data-total-stickers', state.stickerTargetCount);

    card.innerHTML = `
      <!-- 카드 상단: 모둠 번호 배지, 이름, 미니 액션(다 붙이기, 비우기) -->
      <div class="card-header">
        <div class="card-title-wrap">
          <span class="group-badge">${groupNumber}</span>
          <span class="group-name" title="클릭하여 모둠 이름 변경" tabindex="0" role="button">
            ${escapeHtml(group.name)}
            <span class="edit-hint">✏️</span>
          </span>
        </div>
        
        <div class="card-header-actions">
          <span class="mini-complete-tag ${isCompleted ? '' : 'hidden'}">🎉 완주</span>
          <button type="button" class="btn-mini-fill" title="이 모둠 스티커 한번에 다 붙이기" ${isCompleted ? 'disabled' : ''}>
            ⚡ 다 붙이기
          </button>
          <button type="button" class="btn-mini-clear" title="이 모둠 스티커 비우기" ${attachedCount === 0 ? 'disabled' : ''}>
            ↺ 비우기
          </button>
        </div>
      </div>

      <!-- 스티커 붙이기 판 -->
      <div class="sticker-board" aria-label="${group.name} 스티커 판">
        ${group.stickers.map((isAttached, slotIdx) => `
          <div 
            class="sticker-slot ${isAttached ? 'attached' : 'empty'}" 
            data-slot-idx="${slotIdx}" 
            data-slot-num="${slotIdx + 1}"
            title="${isAttached ? '스티커 떼기 (클릭)' : '스티커 붙이기 (클릭)'}"
            tabindex="0"
            role="button"
          >
            ${isAttached ? `<span class="sticker-item">${currentSvg}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    // 이벤트 리스너 바인딩
    bindGroupCardEvents(card, group);

    return card;
  }

  // 모둠 카드의 상태만 부분 업데이트 (전체 리렌더링 없이 깜빡임 및 애니메이션 재실행 방지)
  function updateGroupCardState(card, group) {
    if (!card || !group) return;
    const attachedCount = group.stickers.filter(Boolean).length;
    const isCompleted = attachedCount >= state.stickerTargetCount;

    if (isCompleted) {
      card.classList.add('goal-completed');
    } else {
      card.classList.remove('goal-completed');
    }

    const tag = card.querySelector('.mini-complete-tag');
    if (tag) {
      if (isCompleted) {
        tag.classList.remove('hidden');
      } else {
        tag.classList.add('hidden');
      }
    }

    const btnFill = card.querySelector('.btn-mini-fill');
    if (btnFill) {
      btnFill.disabled = isCompleted;
    }

    const btnClear = card.querySelector('.btn-mini-clear');
    if (btnClear) {
      btnClear.disabled = (attachedCount === 0);
    }
  }

  // ==========================================
  // 8. 모둠 카드 인터랙션 이벤트 처리
  // ==========================================
  function bindGroupCardEvents(card, group) {
    // 1) 스티커 슬롯 클릭/키보드 엔터 -> 붙이기 / 떼기
    const stickerBoard = card.querySelector('.sticker-board');
    stickerBoard.addEventListener('click', (e) => {
      const slot = e.target.closest('.sticker-slot');
      if (!slot) return;
      const slotIdx = parseInt(slot.getAttribute('data-slot-idx'), 10);
      toggleSticker(group.id, slotIdx, slot, card);
    });

    stickerBoard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const slot = e.target.closest('.sticker-slot');
        if (slot) {
          e.preventDefault();
          const slotIdx = parseInt(slot.getAttribute('data-slot-idx'), 10);
          toggleSticker(group.id, slotIdx, slot, card);
        }
      }
    });

    // 2) 각 모둠당 한번에 다 붙이기 버튼
    const btnMiniFill = card.querySelector('.btn-mini-fill');
    if (btnMiniFill) {
      btnMiniFill.addEventListener('click', () => {
        fillGroupStickers(group.id, card);
      });
    }

    // 3) 미니 비우기 버튼
    const btnMiniClear = card.querySelector('.btn-mini-clear');
    if (btnMiniClear) {
      btnMiniClear.addEventListener('click', () => {
        clearGroupStickers(group.id, card);
      });
    }

    // 4) 모둠 이름 인라인 편집
    const nameEl = card.querySelector('.group-name');
    nameEl.addEventListener('click', () => startEditingGroupName(nameEl, group));
    nameEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        startEditingGroupName(nameEl, group);
      }
    });
  }

  // 스티커 토글 (오직 클릭한 슬롯 요소만 타겟 업데이트 -> 다른 스티커 애니메이션 재발생 방지!)
  function toggleSticker(groupId, slotIdx, slotEl, cardEl) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    const card = cardEl || DOM.groupsContainer.querySelector(`.group-card[data-group-id="${groupId}"]`);
    const slot = slotEl || (card ? card.querySelector(`.sticker-slot[data-slot-idx="${slotIdx}"]`) : null);
    if (!slot) return;

    const wasAttached = group.stickers[slotIdx];
    const willAttach = !wasAttached;
    const prevAttachedCount = group.stickers.filter(Boolean).length;

    group.stickers[slotIdx] = willAttach;
    const newAttachedCount = group.stickers.filter(Boolean).length;
    const currentSvg = STICKER_SVGS[state.stickerTheme] || STICKER_SVGS.star;

    if (willAttach) {
      sound.playAttach();

      // 타겟 슬롯만 클래스 변경 및 확대->찹! 애니메이션 트리거
      slot.classList.remove('empty');
      slot.classList.add('attached', 'snap-attach');
      slot.innerHTML = `<span class="sticker-item">${currentSvg}</span>`;
      slot.title = '스티커 떼기 (클릭)';

      slot.addEventListener('animationend', () => {
        slot.classList.remove('snap-attach');
      }, { once: true });

      // 완주 축하
      if (newAttachedCount === state.stickerTargetCount && prevAttachedCount < state.stickerTargetCount) {
        sound.playFanfare();
        confetti.fire();
      }
    } else {
      sound.playDetach();

      slot.classList.remove('attached', 'snap-attach');
      slot.classList.add('empty');
      slot.innerHTML = '';
      slot.title = '스티커 붙이기 (클릭)';
    }

    updateGroupCardState(card, group);
  }

  // 각 모둠당 한번에 다 붙이기 기능
  function fillGroupStickers(groupId, cardEl) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    const card = cardEl || DOM.groupsContainer.querySelector(`.group-card[data-group-id="${groupId}"]`);
    if (!card) return;

    const currentSvg = STICKER_SVGS[state.stickerTheme] || STICKER_SVGS.star;
    const slots = card.querySelectorAll('.sticker-slot');
    let newlyAttachedCount = 0;

    group.stickers.forEach((isAttached, idx) => {
      if (!isAttached) {
        group.stickers[idx] = true;
        newlyAttachedCount++;

        const slot = slots[idx];
        if (slot) {
          slot.classList.remove('empty');
          slot.classList.add('attached');
          slot.innerHTML = `<span class="sticker-item">${currentSvg}</span>`;
          slot.title = '스티커 떼기 (클릭)';

          // 순차적으로 찹! 하고 붙는 효과 (25ms 딜레이)
          setTimeout(() => {
            slot.classList.add('snap-attach');
            slot.addEventListener('animationend', () => {
              slot.classList.remove('snap-attach');
            }, { once: true });
          }, newlyAttachedCount * 25);
        }
      }
    });

    if (newlyAttachedCount > 0) {
      sound.playAttach();
      setTimeout(() => {
        sound.playFanfare();
        confetti.fire();
      }, newlyAttachedCount * 25 + 80);
    }

    updateGroupCardState(card, group);
  }

  // 특정 모둠의 스티커만 비우기 (타겟 DOM 업데이트)
  function clearGroupStickers(groupId, cardEl) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    const card = cardEl || DOM.groupsContainer.querySelector(`.group-card[data-group-id="${groupId}"]`);
    if (!card) return;

    group.stickers = new Array(state.stickerTargetCount).fill(false);

    const slots = card.querySelectorAll('.sticker-slot');
    slots.forEach(slot => {
      slot.classList.remove('attached', 'snap-attach');
      slot.classList.add('empty');
      slot.innerHTML = '';
      slot.title = '스티커 붙이기 (클릭)';
    });

    sound.playDetach();
    updateGroupCardState(card, group);
  }

  // 모둠 이름 인라인 편집 기능
  function startEditingGroupName(nameElement, group) {
    const currentName = group.name;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'group-name-input';
    input.value = currentName;
    input.maxLength = 15;

    function finishEdit() {
      const trimmed = input.value.trim();
      if (trimmed && trimmed !== currentName) {
        group.name = trimmed;
      }
      const newNameEl = document.createElement('span');
      newNameEl.className = 'group-name';
      newNameEl.title = '클릭하여 모둠 이름 변경';
      newNameEl.tabIndex = 0;
      newNameEl.setAttribute('role', 'button');
      newNameEl.innerHTML = `${escapeHtml(group.name)} <span class="edit-hint">✏️</span>`;
      newNameEl.addEventListener('click', () => startEditingGroupName(newNameEl, group));
      newNameEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') startEditingGroupName(newNameEl, group);
      });
      input.replaceWith(newNameEl);
    }

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        input.value = currentName;
        input.blur();
      }
    });

    nameElement.replaceWith(input);
    input.focus();
    input.select();
  }

  // ==========================================
  // 9. 모둠 설정 및 유효성 검사 (Core Requirement)
  // ==========================================

  // 설정 모달 열기
  function openSettingsModal() {
    DOM.groupCountInput.value = state.groupCount;
    DOM.stickerCountInput.value = state.stickerTargetCount;
    DOM.groupCountInput.classList.remove('input-error');
    DOM.stickerCountInput.classList.remove('input-error');

    DOM.settingsModal.classList.remove('hidden');
    setTimeout(() => {
      DOM.groupCountInput.focus();
      DOM.groupCountInput.select();
    }, 50);
  }

  // 설정 모달 닫기
  function closeSettingsModal() {
    DOM.settingsModal.classList.add('hidden');
  }

  let focusTargetAfterAlert = null;

  function showAlertPopup(htmlMessage, targetInputToFocus) {
    sound.playAlert();
    focusTargetAfterAlert = targetInputToFocus || null;
    DOM.alertMessage.innerHTML = htmlMessage;
    DOM.alertModal.classList.remove('hidden');
    DOM.alertConfirmBtn.focus();
  }

  function closeAlertPopup() {
    DOM.alertModal.classList.add('hidden');
    if (focusTargetAfterAlert && typeof focusTargetAfterAlert.focus === 'function') {
      focusTargetAfterAlert.focus();
      if (typeof focusTargetAfterAlert.select === 'function') {
        focusTargetAfterAlert.select();
      }
    }
    focusTargetAfterAlert = null;
  }

  // 설정 확인 및 유효성 검사 로직
  function handleConfirmSettings() {
    const rawGroupVal = DOM.groupCountInput.value.trim();
    const rawStickerVal = DOM.stickerCountInput.value.trim();

    const groupNum = Number(rawGroupVal);
    const stickerNum = Number(rawStickerVal);

    const errors = [];
    let firstErrorField = null;

    // 1) 모둠수 유효성 검증
    if (rawGroupVal === '' || isNaN(groupNum) || !Number.isInteger(groupNum)) {
      errors.push({
        field: DOM.groupCountInput,
        msg: `모둠 수를 올바른 숫자로 입력해주세요.`
      });
      DOM.groupCountInput.classList.add('input-error');
      if (!firstErrorField) firstErrorField = DOM.groupCountInput;
    } else if (groupNum < CONFIG.MIN_GROUP || groupNum > CONFIG.MAX_GROUP) {
      errors.push({
        field: DOM.groupCountInput,
        msg: `<strong>모둠 수</strong>는 <strong>${CONFIG.MIN_GROUP} ~ ${CONFIG.MAX_GROUP}</strong> 사이로 입력해주세요.<br><span style="color:#64748b; font-size:13px;">(입력값: <strong>${escapeHtml(rawGroupVal)}</strong>)</span>`
      });
      DOM.groupCountInput.classList.add('input-error');
      if (!firstErrorField) firstErrorField = DOM.groupCountInput;
    } else {
      DOM.groupCountInput.classList.remove('input-error');
    }

    // 2) 스티커 개수 유효성 검증
    if (rawStickerVal === '' || isNaN(stickerNum) || !Number.isInteger(stickerNum)) {
      errors.push({
        field: DOM.stickerCountInput,
        msg: `스티커 개수를 올바른 숫자로 입력해주세요.`
      });
      DOM.stickerCountInput.classList.add('input-error');
      if (!firstErrorField) firstErrorField = DOM.stickerCountInput;
    } else if (stickerNum < CONFIG.MIN_STICKER || stickerNum > CONFIG.MAX_STICKER) {
      errors.push({
        field: DOM.stickerCountInput,
        msg: `<strong>스티커 개수</strong>는 <strong>${CONFIG.MIN_STICKER} ~ ${CONFIG.MAX_STICKER}</strong> 사이로 입력해주세요.<br><span style="color:#64748b; font-size:13px;">(입력값: <strong>${escapeHtml(rawStickerVal)}</strong>)</span>`
      });
      DOM.stickerCountInput.classList.add('input-error');
      if (!firstErrorField) firstErrorField = DOM.stickerCountInput;
    } else {
      DOM.stickerCountInput.classList.remove('input-error');
    }

    if (errors.length > 0) {
      const errorHtml = errors.map(err => `
        <div class="error-point">
          <span>❌</span>
          <div>${err.msg}</div>
        </div>
      `).join('');

      showAlertPopup(errorHtml, firstErrorField);
      return;
    }

    // 유효성 검사 모두 통과!
    applyNewSettings(groupNum, stickerNum);
    closeSettingsModal();
  }

  // 새로운 모둠 및 스티커 설정 적용
  function applyNewSettings(newGroupCount, newStickerCount) {
    state.groupCount = newGroupCount;
    state.stickerTargetCount = newStickerCount;
    state.groups = createDefaultGroups(newGroupCount, newStickerCount);
    renderGroups();
  }

  // ==========================================
  // 10. 전체 초기화 (스티커 비우기)
  // ==========================================
  function openResetConfirmModal() {
    DOM.confirmResetModal.classList.remove('hidden');
  }

  function closeResetConfirmModal() {
    DOM.confirmResetModal.classList.add('hidden');
  }

  function executeResetAllStickers() {
    state.groups.forEach(group => {
      group.stickers = new Array(state.stickerTargetCount).fill(false);
    });

    closeResetConfirmModal();
    sound.playDetach();
    renderGroups();
  }

  // ==========================================
  // 11. 스티커 테마 및 사운드 토글
  // ==========================================
  function setStickerTheme(themeKey) {
    if (!STICKER_SVGS[themeKey]) return;
    state.stickerTheme = themeKey;

    DOM.stickerThemeGroup.querySelectorAll('.theme-sticker-btn').forEach(btn => {
      if (btn.getAttribute('data-type') === themeKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    renderGroups();
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    DOM.soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    DOM.soundToggleBtn.querySelector('.btn-text').textContent = state.soundEnabled ? '소리 ON' : '소리 OFF';
  }

  // ==========================================
  // 12. 유틸리티 함수 (이스케이프)
  // ==========================================
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // 13. 전역 이벤트 리스너 등록
  // ==========================================
  function initEventListeners() {
    // 1) 모둠 설정 열기/닫기
    DOM.openSettingsBtn.addEventListener('click', openSettingsModal);
    DOM.closeSettingsBtn.addEventListener('click', closeSettingsModal);
    DOM.cancelSettingsBtn.addEventListener('click', closeSettingsModal);

    // 2) 설정 확인 버튼 클릭 & 폼 제출 (유효성 검사 수행)
    DOM.confirmSettingsBtn.addEventListener('click', handleConfirmSettings);
    DOM.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleConfirmSettings();
    });

    // 3) 경고 팝업 확인 버튼 클릭
    DOM.alertConfirmBtn.addEventListener('click', closeAlertPopup);

    // 4) 전체 스티커 비우기 모달
    DOM.resetAllStickersBtn.addEventListener('click', openResetConfirmModal);
    DOM.cancelResetBtn.addEventListener('click', closeResetConfirmModal);
    DOM.executeResetBtn.addEventListener('click', executeResetAllStickers);

    // 5) 스티커 모양(테마) 선택 (4가지 디자인)
    DOM.stickerThemeGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-sticker-btn');
      if (!btn) return;
      const theme = btn.getAttribute('data-type');
      setStickerTheme(theme);
    });

    // 6) 사운드 토글 버튼
    DOM.soundToggleBtn.addEventListener('click', toggleSound);

    // 7) 모달 바깥 배경 클릭 시 닫기
    window.addEventListener('click', (e) => {
      if (e.target === DOM.settingsModal) {
        closeSettingsModal();
      }
      if (e.target === DOM.alertModal) {
        closeAlertPopup();
      }
      if (e.target === DOM.confirmResetModal) {
        closeResetConfirmModal();
      }
    });

    // 8) ESC 키로 모달 닫기
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!DOM.alertModal.classList.contains('hidden')) {
          closeAlertPopup();
        } else if (!DOM.settingsModal.classList.contains('hidden')) {
          closeSettingsModal();
        } else if (!DOM.confirmResetModal.classList.contains('hidden')) {
          closeResetConfirmModal();
        }
      }
    });

    // 9) 창 크기 조절 시 그리드 최적화 유지
    window.addEventListener('resize', () => {
      updateGridDimensions();
    });
  }

  // ==========================================
  // 14. 앱 초기화 시작 (Init)
  // ==========================================
  function initApp() {
    initEventListeners();

    // 껐다 다시 켰을 때 기록 및 설정을 항상 기본값(3모둠, 스티커 5개, 0개 부착)으로 초기화
    clearSavedStorage();
    state.groupCount = CONFIG.DEFAULT_GROUP_COUNT;
    state.stickerTargetCount = CONFIG.DEFAULT_STICKER_COUNT;
    state.stickerTheme = 'star';
    state.soundEnabled = true;
    state.groups = createDefaultGroups(state.groupCount, state.stickerTargetCount);

    // 사운드 상태 UI 동기화
    DOM.soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    DOM.soundToggleBtn.querySelector('.btn-text').textContent = state.soundEnabled ? '소리 ON' : '소리 OFF';

    // 테마 버튼 active 동기화
    DOM.stickerThemeGroup.querySelectorAll('.theme-sticker-btn').forEach(btn => {
      if (btn.getAttribute('data-type') === state.stickerTheme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    renderGroups();
  }

  // DOM 로드 완료 시 앱 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
