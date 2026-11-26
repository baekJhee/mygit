/**
 * 🎲 3D 주사위 굴리기 게임 애플리케이션
 * Three.js + Cannon.js 3D 물리 엔진 기반
 * - 1번 굴리기 & 연속 굴리기(멈추기) 모드 분리
 * - 4종 질감(나무, 플라스틱, 쇠, 유리) 및 맞춤형 Web Audio 절차적 효과음
 * - 1~5개 주사위 지원, 자연스러운 감속 및 미세 레벨링, 교육용 클린 UI
 */

// ==========================================
// 1. 애플리케이션 상태 (State)
// ==========================================
const state = {
  diceCount: 2,
  material: 'plastic',
  isRolling: false,
  isContinuous: false,
  isCharging: false,
  soundEnabled: true,
  themeMode: 'system',
  history: []
};

// ==========================================
// 2. DOM 요소 캐싱
// ==========================================
const elements = {
  // Theme selectors
  themeSystemBtn: document.getElementById('theme-system-btn'),
  themeLightBtn: document.getElementById('theme-light-btn'),
  themeDarkBtn: document.getElementById('theme-dark-btn'),

  // Mode buttons (1~5개)
  modeButtons: [
    document.getElementById('mode-1'),
    document.getElementById('mode-2'),
    document.getElementById('mode-3'),
    document.getElementById('mode-4'),
    document.getElementById('mode-5')
  ],

  // Material buttons (나무, 플라스틱, 쇠, 유리)
  materialButtons: {
    wood: document.getElementById('mat-wood'),
    plastic: document.getElementById('mat-plastic'),
    metal: document.getElementById('mat-metal'),
    glass: document.getElementById('mat-glass')
  },

  // 3D Arena
  diceArena: document.getElementById('dice-arena'),
  canvasContainer: document.getElementById('canvas-container'),
  arenaHint: document.getElementById('arena-hint'),

  // Controls
  rollBtn: document.getElementById('roll-btn'),
  soundBtn: document.getElementById('sound-toggle-btn'),

  soundIconOn: document.getElementById('sound-icon-on'),
  soundIconOff: document.getElementById('sound-icon-off'),

  // Results
  mainResultBox: document.getElementById('main-result-box'),
  statusIndicator: document.getElementById('status-indicator'),
  resultCaption: document.getElementById('result-caption'),
  resultNumber: document.getElementById('result-number'),
  diceBreakdownWrapper: document.getElementById('dice-breakdown-wrapper'),
  diceEquation: document.getElementById('dice-equation'),
  diceBreakdown: document.getElementById('dice-breakdown'),

  // History
  historyList: document.getElementById('history-list'),
  clearHistoryBtn: document.getElementById('clear-history-btn')
};

// ==========================================
// 3. Web Audio API 절차적 효과음 신시사이저 (4종 질감 대응)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.lastHitTime = 0;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => { });
    }
  }

  // 던지기 바람소리
  playThrow() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) { }
  }

  // 질감별 물리 충돌음 (나무, 플라스틱, 쇠, 유리)
  playCollision(type, velocity) {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastHitTime < 0.02) return;
    this.lastHitTime = now;

    const clampedVel = Math.min(Math.max(velocity, 0.5), 18);
    const vol = Math.min(1.0, 0.08 + (clampedVel / 18) * 0.45);
    const mat = state.material;

    try {
      if (mat === 'wood') {
        // [🪵 나무] 묵직하고 건조한 나무 부딪히는 딱딱! 소리 (낮은 공명)
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const baseFreq = 850 + Math.random() * 200;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(950, now);
        filter.Q.value = 4.0;

        gain.gain.setValueAtTime(vol * 0.85, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);

        // 바닥 둔탁한 저음 툭 소리
        if (type !== 'dice') {
          const sub = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          sub.type = 'sine';
          sub.frequency.setValueAtTime(130, now);
          sub.frequency.exponentialRampToValueAtTime(50, now + 0.06);
          subGain.gain.setValueAtTime(vol * 0.7, now);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
          sub.connect(subGain);
          subGain.connect(this.ctx.destination);
          sub.start(now);
          sub.stop(now + 0.07);
        }

      } else if (mat === 'metal') {
        // [⚙️ 쇠] 챙! 쨍! 고주파 배음이 울리는 금속 충돌음
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        const f1 = 3600 + Math.random() * 400;
        const f2 = 5200 + Math.random() * 500;
        osc1.frequency.setValueAtTime(f1, now);
        osc2.frequency.setValueAtTime(f2, now);

        gain.gain.setValueAtTime(vol * 0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.085);
        osc2.stop(now + 0.085);

      } else if (mat === 'glass') {
        // [💎 유리] 맑고 투명한 유리 구슬/크리스털 쨍그랑/또각 소리
        const osc = this.ctx.createOscillator();
        const oscHigh = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        oscHigh.type = 'sine';
        const f = 4600 + Math.random() * 600;
        osc.frequency.setValueAtTime(f, now);
        oscHigh.frequency.setValueAtTime(f * 1.5, now);

        gain.gain.setValueAtTime(vol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        oscHigh.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        oscHigh.start(now);
        osc.stop(now + 0.055);
        oscHigh.stop(now + 0.055);

      } else {
        // [🎲 플라스틱] 깔끔하고 경쾌한 플라스틱 주사위 클릭음
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const baseFreq = 2600 + Math.random() * 600;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.035);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq, now);
        filter.Q.value = 5.5;

        gain.gain.setValueAtTime(vol * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);

        if (type !== 'dice') {
          const thud = this.ctx.createOscillator();
          const thudGain = this.ctx.createGain();
          thud.type = 'sine';
          thud.frequency.setValueAtTime(170, now);
          thud.frequency.exponentialRampToValueAtTime(45, now + 0.06);
          thudGain.gain.setValueAtTime(vol * 0.7, now);
          thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
          thud.connect(thudGain);
          thudGain.connect(this.ctx.destination);
          thud.start(now);
          thud.stop(now + 0.07);
        }
      }
    } catch (e) { }
  }

  // 안착음
  playSettle() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = state.material === 'glass' ? 'sine' : 'triangle';
      const freq = state.material === 'wood' ? 180 : (state.material === 'glass' ? 620 : 260);
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) { }
  }

  // 결과 계산 완료 맑은 알림음 (Educational chime)
  playResultChime() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [659.25, 880]; // E5 -> A5
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.16, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch (e) { }
  }
}

const sfx = new SoundFX();

// ==========================================
// 4. Three.js + Cannon.js 3D 주사위 엔진
// ==========================================
class DiceEngine3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.world = null;

    // 조명
    this.ambientLight = null;
    this.dirLight = null;
    this.pointLight = null;
    this.floorMesh = null;

    // 주사위 객체 관리 (최대 5개)
    this.diceObjects = [];
    this.texturesByMaterial = {}; // { wood: [...], plastic: [...], metal: [...], glass: [...] }
    this.materialsByMaterial = {}; // { wood: [...], plastic: [...], metal: [...], glass: [...] }

    // 벽 물리 바디들
    this.walls = [];
    this.floorBody = null;

    // 롤링 애니메이션 및 안착 제어
    this.animFrameId = null;
    this.isSettling = false;
    this.rollStartTime = 0;
    this.restStableFrames = 0;

    // 규격 상수
    this.DICE_SIZE = 3.3;
    this.ARENA_DEPTH = 20;
    this.ARENA_WIDTH = 45;
    this.ARENA_CENTER_Z = -1.0;

    // Face Normals 매핑: [+X:2, -X:5, +Y:1, -Y:6, +Z:3, -Z:4]
    this.faceNormals = [
      { vec: new CANNON.Vec3(1, 0, 0), val: 2 },
      { vec: new CANNON.Vec3(-1, 0, 0), val: 5 },
      { vec: new CANNON.Vec3(0, 1, 0), val: 1 },
      { vec: new CANNON.Vec3(0, -1, 0), val: 6 },
      { vec: new CANNON.Vec3(0, 0, 1), val: 3 },
      { vec: new CANNON.Vec3(0, 0, -1), val: 4 }
    ];
  }

  init() {
    this.initPhysics();
    this.initGraphics();
    this.createArenaOutline(); // 주사위 판 범위
    this.initAllMaterials();
    this.createDicePool();
    this.updateDiceCount(state.diceCount);
    this.animate();
  }

  // ----------------------------------------
  // Cannon.js 물리 세계 초기화
  // ----------------------------------------
  initPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -32, 0);
    this.world.solver.iterations = 12;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e7;
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;

    const diceMat = new CANNON.Material('diceMat');
    const floorMat = new CANNON.Material('floorMat');
    const wallMat = new CANNON.Material('wallMat');

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(diceMat, floorMat, {
        // 주사위 ↔ 바닥
        friction: 0.35,
        restitution: 0.65
      })
    );

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(diceMat, diceMat, {
        // 주사위 ↔ 주사위
        friction: 0.25,
        restitution: 0.65
      })
    );

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(diceMat, wallMat, {
        // 주사위 ↔ 벽
        friction: 0.2,
        restitution: 0.75
      })
    );

    this.diceMat = diceMat;
    this.floorMat = floorMat;
    this.wallMat = wallMat;

    // 바닥 평면
    const floorShape = new CANNON.Plane();
    this.floorBody = new CANNON.Body({ mass: 0, material: floorMat });
    this.floorBody.addShape(floorShape);
    this.floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(this.floorBody);

    // 천장 평면 (높이를 38로 여유있게 확장)
    const ceilingShape = new CANNON.Plane();
    const ceilingBody = new CANNON.Body({ mass: 0 });
    ceilingBody.addShape(ceilingShape);
    ceilingBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    ceilingBody.position.set(0, 30, 0);
    this.world.addBody(ceilingBody);

    this.updatePhysicsWalls();
  }

  updatePhysicsWalls() {
    this.walls.forEach((wall) => this.world.removeBody(wall));
    this.walls = [];

    const wallThickness = 2;
    const wallHeight = 40;
    const halfW = this.ARENA_WIDTH / 2;
    const halfD = this.ARENA_DEPTH / 2;
    const centerZ = this.ARENA_CENTER_Z;

    const createWall = (x, y, z, sizeX, sizeY, sizeZ) => {
      const shape = new CANNON.Box(new CANNON.Vec3(sizeX / 2, sizeY / 2, sizeZ / 2));
      const body = new CANNON.Body({ mass: 0, material: this.wallMat });
      body.addShape(shape);
      body.position.set(x, y, z);
      this.world.addBody(body);
      this.walls.push(body);
    };

    createWall(-halfW - wallThickness / 2, wallHeight / 2, centerZ, wallThickness, wallHeight, this.ARENA_DEPTH + 4);
    createWall(halfW + wallThickness / 2, wallHeight / 2, centerZ, wallThickness, wallHeight, this.ARENA_DEPTH + 4);
    createWall(0, wallHeight / 2, centerZ - halfD - wallThickness / 2, this.ARENA_WIDTH + 4, wallHeight, wallThickness);
    createWall(0, wallHeight / 2, centerZ + halfD + wallThickness / 2, this.ARENA_WIDTH + 4, wallHeight, wallThickness);
  }

  // ----------------------------------------
  // Three.js 씬 및 렌더러 초기화
  // ----------------------------------------
  initGraphics() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const isMobile = width <= 600;

    this.scene = new THREE.Scene();
    this.updateThemeColors();

    this.camera = new THREE.PerspectiveCamera(
      isMobile ? 48 : 40,
      width / height,
      0.1,
      120
    );

    this.camera.position.set(
      0,
      isMobile ? 34 : 27,
      isMobile ? 20 : 16
    );

    this.camera.lookAt(0, 0, -1.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    this.dirLight.position.set(12, 34, 14);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.left = -22;
    this.dirLight.shadow.camera.right = 22;
    this.dirLight.shadow.camera.top = 22;
    this.dirLight.shadow.camera.bottom = -22;
    this.dirLight.shadow.bias = -0.0008;
    this.scene.add(this.dirLight);

    this.pointLight = new THREE.PointLight(0x818cf8, 0, 40);
    this.pointLight.position.set(0, 14, -1);
    this.scene.add(this.pointLight);

    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);
  }

  updateThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' ||
      (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: light)').matches);

    if (this.scene) this.scene.background = null;
    if (this.ambientLight) this.ambientLight.intensity = isLight ? 0.9 : 0.72;
    if (this.dirLight) this.dirLight.intensity = isLight ? 0.95 : 0.85;
    if (this.floorMesh) this.floorMesh.material.opacity = isLight ? 0.18 : 0.38;
  }

  // ----------------------------------------
  // 4가지 질감별 고해상도 Canvas 텍스처 및 재질 생성
  // (나무, 플라스틱, 쇠, 유리)
  // ----------------------------------------
  initAllMaterials() {
    const types = ['plastic', 'wood', 'metal', 'glass'];
    types.forEach((type) => {
      this.texturesByMaterial[type] = this.buildTexturesFor(type);
      this.materialsByMaterial[type] = this.buildMaterialsFor(type, this.texturesByMaterial[type]);
    });
  }

  buildTexturesFor(matType) {
    const textures = [];
    const size = 512;
    const radius = 58;

    for (let faceNum = 1; faceNum <= 6; faceNum++) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. 둥근 사각형 베이스
      ctx.beginPath();
      ctx.roundRect(8, 8, size - 16, size - 16, radius);

      if (matType === 'wood') {
        // [🪵 나무] 따뜻한 나뭇결 베이스
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, '#c27835');
        grad.addColorStop(0.5, '#b46522');
        grad.addColorStop(1, '#964d12');
        ctx.fillStyle = grad;
        ctx.fill();

        // 은은한 나뭇결 무늬 선
        ctx.save();
        ctx.clip();
        for (let j = 0; j < 8; j++) {
          ctx.beginPath();
          const startY = j * 64 + 10;
          ctx.moveTo(0, startY);
          ctx.bezierCurveTo(size * 0.3, startY - 20, size * 0.7, startY + 25, size, startY - 10);
          ctx.lineWidth = 6;
          ctx.strokeStyle = 'rgba(74, 34, 4, 0.14)';
          ctx.stroke();
        }
        ctx.restore();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#6e340a';
        ctx.stroke();

      } else if (matType === 'metal') {
        // [⚙️ 쇠] 헤어라인 브러시드 스틸
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, '#cbd5e1');
        grad.addColorStop(0.25, '#94a3b8');
        grad.addColorStop(0.55, '#64748b');
        grad.addColorStop(0.8, '#cbd5e1');
        grad.addColorStop(1, '#475569');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.save();
        ctx.clip();
        for (let j = 0; j < 24; j++) {
          ctx.beginPath();
          ctx.moveTo(0, j * 22);
          ctx.lineTo(size, j * 22);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.stroke();
        }
        ctx.restore();

        ctx.lineWidth = 12;
        ctx.strokeStyle = '#334155';
        ctx.stroke();

      } else if (matType === 'glass') {
        // [💎 유리] 반투명 아쿠아/프로스트 글래스
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, 'rgba(224, 242, 254, 0.95)');
        grad.addColorStop(0.5, 'rgba(186, 230, 253, 0.88)');
        grad.addColorStop(1, 'rgba(125, 211, 252, 0.92)');
        ctx.fillStyle = grad;
        ctx.fill();

        // 대각선 유리 반사 하이라이트
        ctx.save();
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(0, size * 0.4);
        ctx.lineTo(size * 0.4, 0);
        ctx.lineTo(size * 0.7, 0);
        ctx.lineTo(0, size * 0.7);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();
        ctx.restore();

        ctx.lineWidth = 12;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();

      } else {
        // [🎲 플라스틱] 깔끔한 아이보리 화이트
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.6, '#f8fafc');
        grad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
      }

      // 2. 주사위 눈금 (Pips) 그리기
      const pipRadius = faceNum === 1 ? 52 : 36;
      let pipColor = '#1e293b';

      if (matType === 'wood') {
        pipColor = faceNum === 1 ? '#852207' : '#2d1506'; // 불에 각인된 듯한 짙은 갈색
      } else if (matType === 'metal') {
        pipColor = faceNum === 1 ? '#991b1b' : '#0f172a'; // 음각된 다크 건메탈
      } else if (matType === 'glass') {
        pipColor = faceNum === 1 ? '#e11d48' : '#0369a1'; // 루비 레드 & 사파이어 블루
      } else {
        pipColor = faceNum === 1 ? '#dc2626' : '#1e293b';
      }

      const dotPositions = {
        1: [[0.5, 0.5]],
        2: [[0.28, 0.28], [0.72, 0.72]],
        3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
        4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
        5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
        6: [
          [0.28, 0.25], [0.72, 0.25],
          [0.28, 0.5], [0.72, 0.5],
          [0.28, 0.75], [0.72, 0.75]
        ]
      }[faceNum];

      ctx.fillStyle = pipColor;
      dotPositions.forEach(([normX, normY]) => {
        const x = normX * size;
        const y = normY * size;

        ctx.beginPath();
        ctx.arc(x, y, pipRadius, 0, Math.PI * 2);
        ctx.fill();

        // 핍 하이라이트
        ctx.beginPath();
        ctx.arc(x - 3, y - 3, pipRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = (matType === 'wood')
          ? 'rgba(255, 220, 180, 0.2)'
          : (matType === 'glass' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.2)');
        ctx.fill();
        ctx.fillStyle = pipColor;
      });

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      textures[faceNum] = texture;
    }

    return textures;
  }

  buildMaterialsFor(matType, textures) {
    const loader = new THREE.TextureLoader();
    const faceOrder = [2, 5, 1, 6, 3, 4];

    return faceOrder.map((num) => {
      const texture = loader.load(
        `images/dice/dice_${num}.svg`
      );

      texture.colorSpace = THREE.SRGBColorSpace;

      if (matType === 'wood') {
        return new THREE.MeshStandardMaterial({
          map: textures[num],
          roughness: 0.78,
          metalness: 0.0
        });
      } else if (matType === 'metal') {
        return new THREE.MeshStandardMaterial({
          map: textures[num],
          roughness: 0.24,
          metalness: 0.3
        });
      } else if (matType === 'glass') {
        return new THREE.MeshStandardMaterial({
          map: textures[num],
          roughness: 0.08,
          metalness: 0.12,
          transparent: true,
          opacity: 0.86
        });
      } else {
        return new THREE.MeshStandardMaterial({
          map: textures[num],
          roughness: 0.22,
          metalness: 0.05
        });
      }
    });
  }
  // 질감 변경 적용
  setMaterial(type) {
    state.material = type;
    const newMaterials = this.materialsByMaterial[type];

    // 주사위 메시 재질 교체
    this.diceObjects.forEach((d) => {
      d.mesh.material = newMaterials;

      // 질감에 따른 무게(Mass) 물리 조정
      if (type === 'metal') {
        d.body.mass = 2.0;
      } else if (type === 'wood') {
        d.body.mass = 0.9;
      } else {
        d.body.mass = 1.2;
      }
      d.body.updateMassProperties();
    });

    // 질감 버튼 활성화 UI 동기화
    Object.keys(elements.materialButtons).forEach((key) => {
      const btn = elements.materialButtons[key];
      if (btn) btn.classList.toggle('active', key === type);
    });
  }

  // ----------------------------------------
  // 주사위 풀(Pool) 생성
  // ----------------------------------------
  createDicePool() {
    const s = this.DICE_SIZE;
    const geometry = new THREE.BoxGeometry(s, s, s);
    const edgesGeo = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 1.5 });

    const initialMaterials = this.materialsByMaterial[state.material];

    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(geometry, initialMaterials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // 충전 에너지 조명
      const chargeLight = new THREE.PointLight(0x818cf8, 0, 10);
      chargeLight.position.set(0, 1.5, 0);
      mesh.add(chargeLight);

      // 바닥 에너지 링
      const chargeRing = new THREE.Mesh(
        new THREE.RingGeometry(1.9, 2.15, 48),
        new THREE.MeshBasicMaterial({
          color: 0x818cf8,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );

      chargeRing.rotation.x = -Math.PI / 2;
      chargeRing.position.y = 0.03;
      chargeRing.visible = false;

      this.scene.add(chargeRing);

      const edgeLines = new THREE.LineSegments(edgesGeo, edgeMaterial);
      mesh.add(edgeLines);
      this.scene.add(mesh);

      const halfS = s / 2;
      const shape = new CANNON.Box(new CANNON.Vec3(halfS, halfS, halfS));
      const body = new CANNON.Body({
        mass: 1.2,
        material: this.diceMat,
        linearDamping: 0.15,
        angularDamping: 0.18
      });
      body.addShape(shape);

      body.addEventListener('collide', (e) => {
        if (!state.isRolling) return;
        const targetBody = e.body;
        let hitType = 'floor';
        if (targetBody && targetBody.mass > 0) {
          hitType = 'dice';
        } else if (this.walls.includes(targetBody)) {
          hitType = 'wall';
        }

        let contactVel = 2.0;
        try {
          contactVel = Math.abs(e.contact.getImpactVelocityAlongNormal());
        } catch (err) { }

        if (contactVel > 0.8) {
          sfx.playCollision(hitType, contactVel);
          if (hitType === 'floor' && contactVel > 5 && 'vibrate' in navigator) {
            try { navigator.vibrate(10); } catch (err) { }
          }
        }
      });

      this.world.addBody(body);

      this.diceObjects.push({
        index: i,
        mesh,
        body,
        chargeLight,
        chargeRing,
        value: 1,
        active: false,
        alignAnim: null
      });
    }
  }

  // ----------------------------------------
  // 주사위 개수 설정 (1~5개)
  // ----------------------------------------
  updateDiceCount(count) {
    state.diceCount = count;

    this.diceObjects.forEach((d, i) => {
      if (i < count) {
        d.active = true;
        d.mesh.visible = true;
        if (!this.world.bodies.includes(d.body)) {
          this.world.addBody(d.body);
        }
      } else {
        d.active = false;
        d.mesh.visible = false;
        if (this.world.bodies.includes(d.body)) {
          this.world.removeBody(d.body);
        }
      }
    });

    this.resetToIdleLayout();
  }

  // 대기 상태(Idle) 정렬
  resetToIdleLayout() {
    const activeDice = this.getActiveDice();
    const count = activeDice.length;
    const spacing = 3.6;
    const startX = -((count - 1) * spacing) / 2;
    const y = this.DICE_SIZE / 2;

    activeDice.forEach((d, i) => {
      if (d.alignAnim) cancelAnimationFrame(d.alignAnim);
      d.alignAnim = null;

      d.body.velocity.set(0, 0, 0);
      d.body.angularVelocity.set(0, 0, 0);

      const targetX = startX + i * spacing;
      d.body.position.set(targetX, y, 0);
      d.body.quaternion.set(0, 0, 0, 1);

      d.mesh.position.copy(d.body.position);
      d.mesh.quaternion.copy(d.body.quaternion);
    });
  }

  getActiveDice() {
    return this.diceObjects.filter((d) => d.active);
  }
  // 주사위 힘 모으기 시작
  startCharge() {
    if (state.isRolling || state.isCharging) return;

    state.isCharging = true;
    this.chargeStartTime = performance.now();

    elements.diceArena.classList.add('charging');
    elements.rollBtn.classList.add('charging');

    elements.arenaHint.classList.remove('hidden');
    elements.arenaHint.querySelector('span').textContent = '힘을 모으는 중... 손을 떼면 던져집니다!';

    sfx.init();
  }

  // 손을 떼면 던지기
  releaseCharge() {
    if (!state.isCharging || state.isRolling) return;

    const holdTime = performance.now() - this.chargeStartTime;

    // 최대 1.2초까지 힘 충전
    const chargePower = Math.min(holdTime / 1200, 1);

    // 최소 힘 35%, 최대 힘 100%
    const power = 0.35 + chargePower * 0.65;

    state.isCharging = false;

    elements.diceArena.classList.remove('charging');
    elements.rollBtn.classList.remove('charging');

    this.rollSingle(power);
  }
  // ----------------------------------------
  // 1번 굴리기 실행 (Single Roll)
  // ----------------------------------------
  rollSingle(power = 1) {
    if (state.isRolling) return;

    state.isRolling = true;
    state.isContinuous = false;
    this.isSettling = false;
    this.restStableFrames = 0;
    this.rollStartTime = performance.now();

    elements.rollBtn.disabled = true;
    elements.statusIndicator.classList.add('rolling');
    elements.arenaHint.classList.add('hidden');

    elements.resultNumber.classList.remove('pop');
    elements.resultNumber.classList.add('rolling');
    elements.resultNumber.textContent = '...';

    if (elements.mainResultBox) {
      elements.mainResultBox.classList.remove('reveal');
    }

    sfx.playThrow();
    this.pointLight.intensity = 2.0;
    setTimeout(() => { this.pointLight.intensity = 0; }, 120);

    this.applyImpulseFromCurrent(power);
  }


  // 모든 활성 주사위에 초기 3D 물리 솟구침 및 강한 회전 부여
  applyImpulseToAll() {
    const activeDice = this.getActiveDice();
    const count = activeDice.length;

    activeDice.forEach((d, i) => {
      if (d.alignAnim) cancelAnimationFrame(d.alignAnim);
      d.alignAnim = null;

      // 초기 뎀핑을 약간 낮춰 (감쇠가 늦어짐)
      d.body.linearDamping = 0.10;
      d.body.angularDamping = 0.12;

      // 위치 재배치 유지 (기존 로직)
      const spreadX = (i - (count - 1) / 2) * 2.2;
      d.body.position.set(
        spreadX + (Math.random() - 0.5) * 1.5,
        3.2 + Math.random() * 2.5,
        (Math.random() - 0.5) * 2
      );

      // 강한 임펄스 (역동적 구름)
      const speedY = 20 + Math.random() * 10;          // 크게 위로
      const angle = Math.random() * Math.PI * 2;
      const speedHoriz = 12 + Math.random() * 8;
      const speedX = Math.cos(angle) * speedHoriz;
      const speedZ = Math.sin(angle) * speedHoriz;
      d.body.velocity.set(speedX, speedY, speedZ);

      // 회전도 크게
      const spinX = (Math.random() - 0.5) * 80;
      const spinY = (Math.random() - 0.5) * 80;
      const spinZ = (Math.random() - 0.5) * 80;
      d.body.angularVelocity.set(spinX, spinY, spinZ);
    });
  }
  // 현재 위치에서 강하게 튀어 오르며 회전
  applyImpulseFromCurrent(power = 1) {
    const activeDice = this.getActiveDice();


    activeDice.forEach((d, i) => {
      if (d.alignAnim) cancelAnimationFrame(d.alignAnim);
      d.alignAnim = null;

      // 초반에는 감쇠를 최소화해서 회전 유지
      d.body.linearDamping = 0.04;
      d.body.angularDamping = 0.04;

      // 주사위마다 다른 방향으로 발사
      const angle = Math.random() * Math.PI * 2;
      const speedHoriz = (6 + Math.random() * 3) * (0.75 + power * 0.5);

      const speedX = Math.cos(angle) * speedHoriz;
      const speedZ = Math.sin(angle) * speedHoriz;


      // 충전 정도에 따라 상승력 조절
      const speedY = (13 + Math.random() * 4) * (0.8 + power * 0.45);

      d.body.velocity.set(speedX, speedY, speedZ);

      // 회전력도 충전 정도에 따라 조절
      const spinPower = (140 + Math.random() * 60) * (0.7 + power * 0.6);

      d.body.angularVelocity.set(
        (Math.random() - 0.5) * spinPower,
        (Math.random() - 0.5) * spinPower,
        (Math.random() - 0.5) * spinPower
      );

      // 물리 엔진에 즉시 반영
      d.body.wakeUp();
    });
  }

  // ----------------------------------------
  // 정지 감지 및 결과 판정
  // ----------------------------------------
  checkSettled() {
    // 연속 굴리기 진행 중일 때는 절대 멈추지 않음!
    if (!state.isRolling || this.isSettling || state.isContinuous) return;

    const activeDice = this.getActiveDice();
    const elapsed = performance.now() - this.rollStartTime;

    // 멈춤 지시 후 최소 0.8초는 자연스럽게 굴러가도록 보장
    if (elapsed < 800) return;

    let allResting = true;
    for (const d of activeDice) {
      const v = d.body.velocity.length();
      const av = d.body.angularVelocity.length();
      const distFromFloor = Math.abs(d.body.position.y - this.DICE_SIZE / 2);

      if (v > 0.14 || av > 0.18 || distFromFloor > 0.35) {
        allResting = false;
        break;
      }
    }

    if (allResting) {
      this.restStableFrames = (this.restStableFrames || 0) + 1;
    } else {
      this.restStableFrames = 0;
    }

    // 8프레임 연속 안정적 정지 or 최대 2.5초 경과 시 안착 확정
    if (this.restStableFrames >= 8 || elapsed > 3500) {
      this.isSettling = true;
      this.finishRoll();
    }
  }

  detectTopFace(body) {
    const worldUp = new CANNON.Vec3(0, 1, 0);
    let maxDot = -Infinity;
    let bestVal = 1;

    this.faceNormals.forEach(({ vec, val }) => {
      const worldNormal = body.quaternion.vmult(vec);
      const dot = worldNormal.dot(worldUp);
      if (dot > maxDot) {
        maxDot = dot;
        bestVal = val;
      }
    });

    return bestVal;
  }

  // 롤링 완료 처리
  finishRoll() {
    const activeDice = this.getActiveDice();
    const results = [];

    activeDice.forEach((d) => {
      d.value = this.detectTopFace(d.body);
      results.push(d.value);
    });

    // 윗면 미세 수평 레벨링 (Y축 회전각 보존)
    this.smoothAlignDice(activeDice);
    sfx.playSettle();

    setTimeout(() => {
      state.isRolling = false;
      this.isSettling = false;
      elements.rollBtn.disabled = false;
      elements.statusIndicator.classList.remove('rolling');

      renderResult(results);
    }, 340);
  }

  // 안착 후 미세 수평 레벨링
  smoothAlignDice(activeDice) {
    const upVector = new THREE.Vector3(0, 1, 0);

    activeDice.forEach((d) => {
      d.body.velocity.set(0, 0, 0);
      d.body.angularVelocity.set(0, 0, 0);

      const targetFace = this.faceNormals.find((f) => f.val === d.value);
      if (!targetFace) return;

      const currentQ = new THREE.Quaternion(
        d.body.quaternion.x,
        d.body.quaternion.y,
        d.body.quaternion.z,
        d.body.quaternion.w
      );

      const localNorm = targetFace.vec;
      const worldNormCannon = d.body.quaternion.vmult(localNorm);
      const worldNormThree = new THREE.Vector3(worldNormCannon.x, worldNormCannon.y, worldNormCannon.z).normalize();

      const deltaQ = new THREE.Quaternion().setFromUnitVectors(worldNormThree, upVector);
      const targetQ = deltaQ.multiply(currentQ);

      const startQ = currentQ.clone();
      const startTime = performance.now();
      const duration = 320;

      const animateAlign = (now) => {
        const t = Math.min(1.0, (now - startTime) / duration);
        const easeT = 0.5 - 0.5 * Math.cos(t * Math.PI);
        const interpolated = startQ.clone().slerp(targetQ, easeT);

        d.body.quaternion.set(interpolated.x, interpolated.y, interpolated.z, interpolated.w);
        d.mesh.quaternion.copy(interpolated);

        if (t < 1.0) {
          d.alignAnim = requestAnimationFrame(animateAlign);
        } else {
          d.alignAnim = null;
        }
      };

      d.alignAnim = requestAnimationFrame(animateAlign);
    });
  }

  // ----------------------------------------
  // 메인 애니메이션 렌더 루프
  // ----------------------------------------
  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    this.world.step(1 / 60);

    const activeDice = this.getActiveDice();

    // [연속 굴리기 모드일 때] 주사위가 바닥에 떨어지면 지속적으로 튀어오르게 충격량 부여
    if (state.isContinuous) {
      activeDice.forEach((d) => {
        // 주사위가 바닥 부근에 있고 내려오고 있을 때 재바운스
        if (d.body.position.y < this.DICE_SIZE / 2 + 0.6 && d.body.velocity.y <= 0.5) {
          d.body.velocity.y = 11 + Math.random() * 5;
          d.body.velocity.x += (Math.random() - 0.5) * 6;
          d.body.velocity.z += (Math.random() - 0.5) * 6;
          d.body.angularVelocity.x += (Math.random() - 0.5) * 20;
          d.body.angularVelocity.y += (Math.random() - 0.5) * 20;
          d.body.angularVelocity.z += (Math.random() - 0.5) * 20;
        }
        d.body.linearDamping = 0.08;
        d.body.angularDamping = 0.1;
      });
    } else if (state.isRolling) {
      const elapsed = performance.now() - this.rollStartTime;

      // 마지막 튀김과 회전을 충분히 보여준 뒤 감속
      if (elapsed > 1300) {
        const factor = Math.min(1.0, (elapsed - 1300) / 1200);

        activeDice.forEach((d) => {
          d.body.linearDamping = 0.08 + factor * 0.65;
          d.body.angularDamping = 0.1 + factor * 0.75;
        });
      }

      this.checkSettled();
    }

    // 물리 Body 위치/회전을 Three.js Mesh에 복사
    this.diceObjects.forEach((d) => {
      if (!d.active) return;

      const now = performance.now();

      // 기본 위치 및 회전 동기화
      d.mesh.position.copy(d.body.position);
      d.mesh.quaternion.copy(d.body.quaternion);

      if (state.isCharging) {
        const elapsed = now - this.chargeStartTime;
        const charge = Math.min(elapsed / 1200, 1);

        // 1. 서서히 떠오르는 효과
        const lift = charge * 0.9;
        const floating = Math.sin(now * 0.006) * 0.06 * charge;

        d.mesh.position.y += lift + floating;

        // 2. 에너지 조명 효과
        d.chargeLight.intensity = charge * 2.5;
        d.chargeLight.distance = 5 + charge * 5;

        // 3. 바닥 에너지 링
        d.chargeRing.visible = true;
        d.chargeRing.position.set(
          d.body.position.x,
          0.04,
          d.body.position.z
        );

        const ringScale = 0.7 + charge * 0.6;
        d.chargeRing.scale.set(ringScale, ringScale, ringScale);

        d.chargeRing.material.opacity = charge * 0.65;

        // 은은하게 회전
        d.chargeRing.rotation.z = now * 0.0008;

      } else {
        // 충전 종료 시 원상복구
        d.chargeLight.intensity = 0;
        d.chargeRing.visible = false;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
  resize() {
    if (!this.container || !this.renderer || !this.camera) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const isMobile = width <= 600;

    this.camera.aspect = width / height;
    this.camera.fov = isMobile ? 48 : 40;

    this.camera.position.set(
      0,
      isMobile ? 34 : 27,
      isMobile ? 20 : 16
    );

    this.camera.lookAt(0, 0, -1.0);
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.updatePhysicsWalls();
  }


  createArenaOutline() {
    const geometry = new THREE.BoxGeometry(
      this.ARENA_WIDTH,
      0.1,
      this.ARENA_DEPTH
    );

    const edges = new THREE.EdgesGeometry(geometry);

    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8
    });

    this.arenaOutline = new THREE.LineSegments(edges, material);

    this.arenaOutline.position.set(
      0,
      0,
      this.ARENA_CENTER_Z
    );

    this.scene.add(this.arenaOutline);
  }
}

let diceEngine = null;

// ==========================================
// 5. 결과 렌더링 및 UI 업데이트
// ==========================================
function renderResult(values) {
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);

  // 1. 메인 수치 업데이트 & Pop 이펙트
  elements.resultNumber.classList.remove('rolling', 'pop');
  elements.resultNumber.textContent = sum;
  void elements.resultNumber.offsetWidth;
  elements.resultNumber.classList.add('pop');

  // 2. 어떤 결과든 나올 때 합계 박스에 부드러운 빛남/펄스 이펙트 추가
  if (elements.mainResultBox) {
    elements.mainResultBox.classList.remove('reveal');
    void elements.mainResultBox.offsetWidth;
    elements.mainResultBox.classList.add('reveal');
  }

  // 3. 깔끔하고 부드러운 계산 완료 알림음
  sfx.playResultChime();

  // 캡션 설정
  elements.resultCaption.textContent = count === 1 ? '주사위 결과' : '주사위 합계';

  // 4. 개별 분해 칩 및 계산식 업데이트
  if (count > 1) {
    elements.diceBreakdown.classList.add('show');
    elements.diceBreakdown.innerHTML = '';

    values.forEach((val, idx) => {
      const item = document.createElement('div');
      item.className = 'breakdown-item';
      item.innerHTML = `
        <div class="breakdown-label">주사위 ${idx + 1}</div>
        <div class="breakdown-val">${val}</div>
      `;
      elements.diceBreakdown.appendChild(item);
    });

    const equationStr = `${values.join(' + ')} = ${sum}`;
    elements.diceEquation.textContent = equationStr;
  } else {
    elements.diceBreakdown.classList.remove('show');
    elements.diceBreakdown.innerHTML = '';
    elements.diceEquation.textContent = '';
  }

  // 5. 히스토리 기록
  addHistoryRecord({
    count,
    values,
    sum
  });
}

// ==========================================
// 6. 히스토리 관리
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
    li.className = 'history-chip';

    if (item.count === 1) {
      li.innerHTML = `<span>🎲</span> <strong>${item.values[0]}</strong>`;
    } else {
      const diceIcons = '🎲'.repeat(Math.min(item.count, 1)) + (item.count > 1 ? `x${item.count}` : '');
      const detail = item.values.join('+');
      li.innerHTML = `<span>${diceIcons}</span> <strong>${item.sum}</strong> <small>(${detail})</small>`;
    }

    elements.historyList.appendChild(li);
  });
}

function clearHistory() {
  state.history = [];
  renderHistory();
}

// ==========================================
// 7. 주사위 개수 모드 전환 (1 ~ 5개)
// ==========================================
function setDiceCount(count) {
  if (state.isRolling || state.isCharging || state.diceCount === count) return;
  if (count < 1 || count > 5) return;

  state.diceCount = count;

  elements.modeButtons.forEach((btn, idx) => {
    if (!btn) return;
    const btnCount = idx + 1;
    const isActive = btnCount === count;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (diceEngine) {
    diceEngine.updateDiceCount(count);
  }

  elements.arenaHint.classList.remove('hidden');

  elements.resultNumber.textContent = '-';
  elements.resultNumber.classList.remove('rolling', 'pop');
  elements.resultCaption.textContent = count === 1 ? '주사위 결과' : '주사위 합계';
  elements.diceBreakdown.classList.remove('show');
  elements.diceBreakdown.innerHTML = '';
  elements.diceEquation.textContent = '';
  if (elements.mainResultBox) {
    elements.mainResultBox.classList.remove('reveal');
  }
}

// ==========================================
// 8. 주사위 질감 전환 (나무, 플라스틱, 쇠, 유리)
// ==========================================
function setMaterial(matType) {
  if (state.material === matType) return;
  if (!['wood', 'plastic', 'metal', 'glass'].includes(matType)) return;

  if (diceEngine) {
    diceEngine.setMaterial(matType);
  }

  // 질감 변경 알림 효과음 테스트 재생
  sfx.playCollision('dice', 10);
}

// ==========================================
// 9. 사운드 토글
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
// 10. 테마 관리 (시스템 설정 / 다크 / 라이트)
// ==========================================
function applyTheme(mode, save = true) {
  state.themeMode = mode;

  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else if (mode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  if (elements.themeSystemBtn) elements.themeSystemBtn.classList.toggle('active', mode === 'system');
  if (elements.themeLightBtn) elements.themeLightBtn.classList.toggle('active', mode === 'light');
  if (elements.themeDarkBtn) elements.themeDarkBtn.classList.toggle('active', mode === 'dark');

  if (diceEngine) {
    diceEngine.updateThemeColors();
  }

  if (save) {
    try {
      localStorage.setItem('dice-theme', mode);
    } catch (e) { }
  }
}

function initTheme() {
  let saved = 'system';
  try {
    saved = localStorage.getItem('dice-theme') || 'system';
  } catch (e) { }
  applyTheme(saved, false);

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (state.themeMode === 'system') {
        applyTheme('system', false);
      }
    });
  }
}

// ==========================================
// 11. 이벤트 리스너 등록
// ==========================================
function initEvents() {
  // 테마 모드 전환
  if (elements.themeSystemBtn) elements.themeSystemBtn.addEventListener('click', () => applyTheme('system'));
  if (elements.themeLightBtn) elements.themeLightBtn.addEventListener('click', () => applyTheme('light'));
  if (elements.themeDarkBtn) elements.themeDarkBtn.addEventListener('click', () => applyTheme('dark'));

  // 주사위 개수 버튼 (1~5개)
  elements.modeButtons.forEach((btn, idx) => {
    if (btn) {
      btn.addEventListener('click', () => setDiceCount(idx + 1));
    }
  });

  // 주사위 질감 버튼 (나무, 플라스틱, 쇠, 유리)
  Object.keys(elements.materialButtons).forEach((key) => {
    const btn = elements.materialButtons[key];
    if (btn) {
      btn.addEventListener('click', () => setMaterial(key));
    }
  });
  // 누르기 시작
  const startDiceCharge = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (!diceEngine || state.isRolling || state.isCharging) return;

    e.preventDefault();
    diceEngine.startCharge();
  };

  // 손을 떼면 던지기
  const releaseDiceCharge = () => {
    if (!diceEngine || !state.isCharging) return;

    diceEngine.releaseCharge();
  };

  // 굴리기 버튼
  elements.rollBtn.addEventListener('pointerdown', startDiceCharge);

  // 3D 아레나
  elements.diceArena.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, [role=button]')) return;

    startDiceCharge(e);
  });

  // 마우스 또는 터치에서 손을 떼면 던지기
  window.addEventListener('pointerup', releaseDiceCharge);
  window.addEventListener('pointercancel', releaseDiceCharge);


  // 사운드 토글
  elements.soundBtn.addEventListener('click', toggleSound);

  // 히스토리 비우기
  elements.clearHistoryBtn.addEventListener('click', clearHistory);


  // 키보드 단축키


  // 키보드 단축키
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat && diceEngine) {
        diceEngine.startCharge();
      }
    } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
      e.preventDefault();
      setDiceCount(Math.min(5, state.diceCount + 1));
    } else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
      e.preventDefault();
      setDiceCount(Math.max(1, state.diceCount - 1));
    } else if (e.code === 'Digit1') {
      setMaterial('wood');
    } else if (e.code === 'Digit2') {
      setMaterial('plastic');
    } else if (e.code === 'Digit3') {
      setMaterial('metal');
    } else if (e.code === 'Digit4') {
      setMaterial('glass');
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (diceEngine) diceEngine.releaseCharge();
    }
  });

  // 창을 벗어나거나 포커스를 잃어도 충전 상태가 남지 않도록 처리
  window.addEventListener('blur', () => {
    if (diceEngine) diceEngine.releaseCharge();
  });

  // 윈도우 리사이즈 대응
  window.addEventListener('resize', () => {
    if (diceEngine) diceEngine.resize();
  });


}

// ==========================================
// 12. 애플리케이션 초기화
// ==========================================
function init() {
  initTheme();
  initEvents();
  renderHistory();

  // 3D 주사위 엔진 초기화
  if (elements.canvasContainer) {
    diceEngine = new DiceEngine3D(elements.canvasContainer);
    diceEngine.init();
  }
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', init);
