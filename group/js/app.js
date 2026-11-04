/**
 * ⭐ 모둠 스티커 보드 (Group Sticker Board) JavaScript
 * 
 * 기능:
 * 1. 초기 진입 시 기본 3모둠, 스티커 5개로 구성
 * 2. 스티커 슬롯 클릭 시 붙이기/떼기 토글 인터랙션
 * 3. 모둠 설정 팝업 (모둠수 3~20, 스티커 5~20)
 * 4. type="number" 인풋을 통한 유효성 검사 및 범위 초과 시 커스텀 경고 팝업 표시
 * 5. 모둠 이름 인라인 편집 기능
 * 6. Web Audio API 기반 효과음 및 목표 달성 시 축하 컨페티 효과
 * 7. 로컬스토리지 자동 저장 및 상태 복원
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

  // 스티커 이모지 매핑
  const STICKER_ICONS = {
    star: '⭐',
    praise: '💮',
    heart: '❤️',
    smile: '😊',
    thumb: '👍',
    trophy: '🏆',
    fire: '🔥'
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
    // 요약 바
    summaryGroupCount: document.getElementById('summaryGroupCount'),
    summaryStickerGoal: document.getElementById('summaryStickerGoal'),
    summaryTotalStickers: document.getElementById('summaryTotalStickers'),
    summaryCompletedCount: document.getElementById('summaryCompletedCount'),

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

    // 토스트 및 컨페티
    toastContainer: document.getElementById('toastContainer'),
    confettiCanvas: document.getElementById('confettiCanvas')
  };

  // ==========================================
  // 4. 사운드 시스템 (Web Audio API)
  // 외부 파일 의존성 없이 브라우저 자체 오실레이터로 깔끔한 효과음 생성
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

    // 스티커 붙일 때 경쾌한 뾱! 소리
    playAttach() {
      if (!state.soundEnabled) return;
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
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
  // 6. 데이터 초기화 및 로컬스토리지 관리
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

  function saveToLocalStorage() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
        groupCount: state.groupCount,
        stickerTargetCount: state.stickerTargetCount,
        stickerTheme: state.stickerTheme,
        soundEnabled: state.soundEnabled,
        groups: state.groups
      }));
    } catch (e) {
      console.warn('LocalStorage 저장 실패:', e);
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.groupCount === 'number' &&
          typeof parsed.stickerTargetCount === 'number' &&
          Array.isArray(parsed.groups)
        ) {
          state.groupCount = parsed.groupCount;
          state.stickerTargetCount = parsed.stickerTargetCount;
          state.stickerTheme = parsed.stickerTheme || 'star';
          state.soundEnabled = parsed.soundEnabled !== false;
          state.groups = parsed.groups;
          return true;
        }
      }
    } catch (e) {
      console.warn('LocalStorage 로드 실패:', e);
    }
    return false;
  }

  // ==========================================
  // 7. 렌더링 함수들
  // ==========================================

  // 대시보드 상태 요약 업데이트
  function updateSummary() {
    DOM.summaryGroupCount.textContent = `${state.groupCount}개`;
    DOM.summaryStickerGoal.textContent = `${state.stickerTargetCount}개`;

    let totalStickers = 0;
    let completedGroups = 0;

    state.groups.forEach(group => {
      const attachedCount = group.stickers.filter(Boolean).length;
      totalStickers += attachedCount;
      if (attachedCount >= state.stickerTargetCount) {
        completedGroups++;
      }
    });

    DOM.summaryTotalStickers.textContent = `${totalStickers}개`;
    DOM.summaryCompletedCount.textContent = `${completedGroups} / ${state.groupCount}`;
  }

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
    let maxGridW, maxGridH, gridGap, cardPadding, boardPadding, slotGap, maxSlotSize, stickerFontSize;

    // 가로 최대 너비 계산
    if (gCount === 3) {
      maxGridW = '1060px'; // 3개일 때 카드당 너비 약 320~340px
      gridGap = '20px';
      cardPadding = '12px 14px';
    } else if (gCount === 4) {
      maxGridW = '1280px';
      gridGap = '16px';
      cardPadding = '10px 12px';
    } else if (gCount <= 6) {
      maxGridW = '1120px';
      gridGap = '14px';
      cardPadding = '9px 11px';
    } else if (gCount <= 8) {
      maxGridW = '1360px';
      gridGap = '12px';
      cardPadding = '8px 10px';
    } else if (gCount <= 10) {
      maxGridW = '1520px';
      gridGap = '10px';
      cardPadding = '7px 9px';
    } else if (gCount <= 15) {
      maxGridW = '1600px';
      gridGap = '8px';
      cardPadding = '6px 8px';
    } else {
      // 16~20개
      maxGridW = '100%';
      gridGap = '6px';
      cardPadding = '5px 7px';
    }

    // 세로 최대 높이 계산 (스티커 개수 sRows 및 행 수 rows에 따라 비례)
    // 스티커 줄 수(sRows)가 1줄(5개), 2줄(6~10개), 3줄(11~15개), 4줄(16~20개)
    if (rows === 1) {
      // 1행 (3~4 모둠): 스티커 개수에 따라 카드가 자연스럽게 위아래로 커짐
      if (sRows === 1) {
        maxGridH = '230px';
        maxSlotSize = '62px';
        stickerFontSize = '30px';
      } else if (sRows === 2) {
        maxGridH = '310px';
        maxSlotSize = '56px';
        stickerFontSize = '28px';
      } else if (sRows === 3) {
        maxGridH = '390px';
        maxSlotSize = '52px';
        stickerFontSize = '25px';
      } else {
        maxGridH = '460px';
        maxSlotSize = '48px';
        stickerFontSize = '23px';
      }
      boardPadding = '8px 10px';
      slotGap = '8px';
    } else if (rows === 2) {
      // 2행 (5~10 모둠)
      if (sRows === 1) {
        maxGridH = '420px';
        maxSlotSize = '52px';
        stickerFontSize = '25px';
      } else if (sRows === 2) {
        maxGridH = '540px';
        maxSlotSize = '46px';
        stickerFontSize = '23px';
      } else {
        maxGridH = '620px';
        maxSlotSize = '42px';
        stickerFontSize = '20px';
      }
      boardPadding = '6px 8px';
      slotGap = '6px';
    } else if (rows === 3) {
      // 3행 (11~15 모둠)
      maxGridH = '100%';
      maxSlotSize = '40px';
      stickerFontSize = '19px';
      boardPadding = '4px 6px';
      slotGap = '4px';
    } else {
      // 4행 (16~20 모둠)
      maxGridH = '100%';
      maxSlotSize = '34px';
      stickerFontSize = '16px';
      boardPadding = '3px 4px';
      slotGap = '3px';
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
    DOM.groupsContainer.style.setProperty('--sticker-font-size', stickerFontSize);
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

    updateSummary();
  }

  // 개별 모둠 카드 DOM 요소 생성 (현황 및 +- 버튼 제거된 컴팩트 디자인)
  function createGroupCardElement(group, groupNumber) {
    const card = document.createElement('article');
    const attachedCount = group.stickers.filter(Boolean).length;
    const isCompleted = attachedCount >= state.stickerTargetCount;
    const currentEmoji = STICKER_ICONS[state.stickerTheme] || '⭐';

    // 클래스 및 테마 설정 (1~20 모둠 컬러 순환)
    const themeIndex = ((groupNumber - 1) % 20) + 1;
    card.className = `group-card group-theme-${themeIndex} ${isCompleted ? 'goal-completed' : ''}`;
    card.setAttribute('data-group-id', group.id);
    card.setAttribute('data-total-stickers', state.stickerTargetCount);

    card.innerHTML = `
      <!-- 카드 상단: 모둠 번호 배지, 이름, 미니 비우기 -->
      <div class="card-header">
        <div class="card-title-wrap">
          <span class="group-badge">${groupNumber}</span>
          <span class="group-name" title="클릭하여 모둠 이름 변경" tabindex="0" role="button">
            ${escapeHtml(group.name)}
            <span class="edit-hint">✏️</span>
          </span>
        </div>
        
        <div class="card-header-actions">
          ${isCompleted ? '<span class="mini-complete-tag">🎉 완주</span>' : ''}
          <button type="button" class="btn-mini-clear" title="이 모둠 스티커 비우기">↺ 비우기</button>
        </div>
      </div>

      <!-- 스티커 붙이기 판 (슬롯들만 화면에 가득 배치) -->
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
            ${isAttached ? `<span class="sticker-item">${currentEmoji}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    // 이벤트 리스너 바인딩
    bindGroupCardEvents(card, group);

    return card;
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
      toggleSticker(group.id, slotIdx);
    });

    stickerBoard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const slot = e.target.closest('.sticker-slot');
        if (slot) {
          e.preventDefault();
          const slotIdx = parseInt(slot.getAttribute('data-slot-idx'), 10);
          toggleSticker(group.id, slotIdx);
        }
      }
    });

    // 2) 미니 비우기 버튼
    const btnMiniClear = card.querySelector('.btn-mini-clear');
    if (btnMiniClear) {
      btnMiniClear.addEventListener('click', () => {
        clearGroupStickers(group.id);
      });
    }

    // 3) 모둠 이름 인라인 편집
    const nameEl = card.querySelector('.group-name');
    nameEl.addEventListener('click', () => startEditingGroupName(nameEl, group));
    nameEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        startEditingGroupName(nameEl, group);
      }
    });
  }

  // 스티커 토글 (붙이기 / 떼기)
  function toggleSticker(groupId, slotIdx) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    const wasAttached = group.stickers[slotIdx];
    const willAttach = !wasAttached;
    const prevAttachedCount = group.stickers.filter(Boolean).length;

    group.stickers[slotIdx] = willAttach;

    const newAttachedCount = group.stickers.filter(Boolean).length;

    if (willAttach) {
      sound.playAttach();
      // 방금 스티커를 붙여서 목표를 완성했는지 확인!
      if (newAttachedCount === state.stickerTargetCount && prevAttachedCount < state.stickerTargetCount) {
        sound.playFanfare();
        confetti.fire();
        showToast(`🎉 ${group.name}이(가) 스티커 ${state.stickerTargetCount}개를 모두 모았습니다!`);
      }
    } else {
      sound.playDetach();
    }

    saveToLocalStorage();
    renderGroups();
  }

  // 다음 빈 칸에 스티커 1개 바로 붙이기 (+)
  function addNextSticker(groupId) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    const firstEmptyIndex = group.stickers.findIndex(s => !s);
    if (firstEmptyIndex !== -1) {
      toggleSticker(groupId, firstEmptyIndex);
    }
  }

  // 마지막으로 붙은 스티커 1개 떼기 (-)
  function removeLastSticker(groupId) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    for (let i = group.stickers.length - 1; i >= 0; i--) {
      if (group.stickers[i]) {
        toggleSticker(groupId, i);
        break;
      }
    }
  }

  // 특정 모둠의 스티커만 비우기
  function clearGroupStickers(groupId) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    group.stickers = new Array(state.stickerTargetCount).fill(false);
    sound.playDetach();
    saveToLocalStorage();
    renderGroups();
    showToast(`${group.name}의 스티커를 모두 비웠습니다.`);
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
        saveToLocalStorage();
        showToast(`모둠 이름이 '${trimmed}'(으)로 변경되었습니다.`);
      }
      renderGroups();
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

  /**
   * 커스텀 경고 팝업창 띄우기
   * 요구사항: "모둠수 최소 3 최대 20 스티커 개수 최소 5 최대 20 이고 그 범위 벗어나면 팝업창 과 문구가 뜨면 좋겠어"
   */
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

  /**
   * 설정 확인 및 유효성 검사 로직
   * 1. 모둠수 범위: 3 ~ 20
   * 2. 스티커 개수 범위: 5 ~ 20
   * 범위를 벗어나거나 빈 값/숫자가 아니면 팝업창과 상세 문구 표시
   */
  function handleConfirmSettings() {
    const rawGroupVal = DOM.groupCountInput.value.trim();
    const rawStickerVal = DOM.stickerCountInput.value.trim();

    const groupNum = Number(rawGroupVal);
    const stickerNum = Number(rawStickerVal);

    // 에러 내역 수집
    const errors = [];
    let firstErrorField = null;

    // 1) 모둠수 유효성 검증
    if (rawGroupVal === '' || isNaN(groupNum) || !Number.isInteger(groupNum)) {
      errors.push({
        field: DOM.groupCountInput,
        title: '모둠 수 입력 오류',
        msg: `모둠 수를 올바른 정수 숫자로 입력해주세요.`
      });
      DOM.groupCountInput.classList.add('input-error');
      if (!firstErrorField) firstErrorField = DOM.groupCountInput;
    } else if (groupNum < CONFIG.MIN_GROUP || groupNum > CONFIG.MAX_GROUP) {
      errors.push({
        field: DOM.groupCountInput,
        title: '모둠 수 범위 초과',
        msg: `<strong>모둠 수</strong>는 최소 <strong>${CONFIG.MIN_GROUP}개</strong>에서 최대 <strong>${CONFIG.MAX_GROUP}개</strong>까지 설정 가능합니다. <br><span style="color:#64748b; font-size:13px;">(현재 입력값: <strong>${escapeHtml(rawGroupVal)}</strong>)</span>`
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
        title: '스티커 개수 입력 오류',
        msg: `스티커 개수를 올바른 정수 숫자로 입력해주세요.`
      });
      DOM.stickerCountInput.classList.add('input-error');
      if (!firstErrorField) firstErrorField = DOM.stickerCountInput;
    } else if (stickerNum < CONFIG.MIN_STICKER || stickerNum > CONFIG.MAX_STICKER) {
      errors.push({
        field: DOM.stickerCountInput,
        title: '스티커 개수 범위 초과',
        msg: `<strong>스티커 개수</strong>는 최소 <strong>${CONFIG.MIN_STICKER}개</strong>에서 최대 <strong>${CONFIG.MAX_STICKER}개</strong>까지 설정 가능합니다. <br><span style="color:#64748b; font-size:13px;">(현재 입력값: <strong>${escapeHtml(rawStickerVal)}</strong>)</span>`
      });
      DOM.stickerCountInput.classList.add('input-error');
      if (!firstErrorField) firstErrorField = DOM.stickerCountInput;
    } else {
      DOM.stickerCountInput.classList.remove('input-error');
    }

    // 유효성 에러가 발생한 경우 -> 요구사항대로 팝업창과 안내 문구 노출!
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
    showToast(`✅ ${groupNum}개 모둠, 스티커 ${stickerNum}개로 새로 생성되었습니다.`);
  }

  // 새로운 모둠 및 스티커 설정 적용
  function applyNewSettings(newGroupCount, newStickerCount) {
    state.groupCount = newGroupCount;
    state.stickerTargetCount = newStickerCount;
    state.groups = createDefaultGroups(newGroupCount, newStickerCount);

    saveToLocalStorage();
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
    saveToLocalStorage();
    renderGroups();
    showToast('모든 모둠의 스티커를 0개로 비웠습니다.');
  }

  // ==========================================
  // 11. 스티커 테마 및 사운드 토글
  // ==========================================
  function setStickerTheme(themeKey) {
    if (!STICKER_ICONS[themeKey]) return;
    state.stickerTheme = themeKey;

    // 테마 버튼 active 갱신
    DOM.stickerThemeGroup.querySelectorAll('.theme-sticker-btn').forEach(btn => {
      if (btn.getAttribute('data-type') === themeKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    saveToLocalStorage();
    renderGroups();
    showToast(`스티커 모양이 '${STICKER_ICONS[themeKey]}' 모양으로 변경되었습니다.`);
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    DOM.soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    DOM.soundToggleBtn.querySelector('.btn-text').textContent = state.soundEnabled ? '소리 ON' : '소리 OFF';
    saveToLocalStorage();
    showToast(state.soundEnabled ? '🔊 효과음이 켜졌습니다.' : '🔇 효과음이 꺼졌습니다.');
  }

  // ==========================================
  // 12. 유틸리티 함수들 (토스트, 이스케이프)
  // ==========================================
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 2800);
  }

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

    // 3) 빠른 선택 칩 버튼 클릭
    document.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        const targetId = chip.getAttribute('data-target');
        const val = chip.getAttribute('data-value');
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          targetInput.value = val;
          targetInput.classList.remove('input-error');
        }
      });
    });

    // 4) 경고 팝업 확인 버튼 클릭
    DOM.alertConfirmBtn.addEventListener('click', closeAlertPopup);

    // 5) 전체 스티커 비우기 모달
    DOM.resetAllStickersBtn.addEventListener('click', openResetConfirmModal);
    DOM.cancelResetBtn.addEventListener('click', closeResetConfirmModal);
    DOM.executeResetBtn.addEventListener('click', executeResetAllStickers);

    // 6) 스티커 모양(테마) 선택
    DOM.stickerThemeGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-sticker-btn');
      if (!btn) return;
      const theme = btn.getAttribute('data-type');
      setStickerTheme(theme);
    });

    // 7) 사운드 토글 버튼
    DOM.soundToggleBtn.addEventListener('click', toggleSound);

    // 8) 모달 바깥 배경 클릭 시 닫기
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

    // 9) ESC 키로 모달 닫기
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

    // 10) 창 크기 조절 시 그리드 최적화 유지
    window.addEventListener('resize', () => {
      updateGridDimensions();
    });
  }

  // ==========================================
  // 14. 앱 초기화 시작 (Init)
  // ==========================================
  function initApp() {
    initEventListeners();

    // 로컬스토리지 복원 시도, 없으면 기본값(3모둠, 스티커 5개)으로 생성
    const restored = loadFromLocalStorage();
    if (!restored || state.groups.length === 0) {
      state.groupCount = CONFIG.DEFAULT_GROUP_COUNT;
      state.stickerTargetCount = CONFIG.DEFAULT_STICKER_COUNT;
      state.groups = createDefaultGroups(state.groupCount, state.stickerTargetCount);
    }

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

