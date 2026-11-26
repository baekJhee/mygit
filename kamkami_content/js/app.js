(() => {
  const $ = (selector) => document.querySelector(selector);
  const stage = $("#stage");
  const messageInput = $("#messageInput");
  const attentionText = $("#attentionText");
  const attentionImage = $("#attentionImage");
  const toast = $("#toast");
  const imageInput = $("#imageInput");
  let currentMode = "cover";
  let soundEnabled = false;
  let selectedBackground = "sunshine";
  let uploadedImageUrl = "";
  let toastTimer;
  let audioContext;
  let musicTimer;
  let musicStep = 0;

  const descriptions = {
    cover: "화면 가리기 모드예요. 교실 화면을 잠시 가려보세요.",
    attention: "주목 시키기 모드예요. 문구와 효과로 시선을 모아보세요."
  };
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
  function setMode(mode) {
    currentMode = mode;
    stage.classList.toggle("stage-attention", mode === "attention");
    document.querySelectorAll(".mode-btn").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $("#modeDescription").textContent = descriptions[mode];
    $("#runBtn").textContent = mode === "cover" ? "깜깜이 실행하기 ↗" : "주목 시키기 실행 ↗";
  }
  function openModal(modal) {
    modal.hidden = false;
    const target = modal.querySelector("input,button");
    if (target) setTimeout(() => target.focus(), 30);
  }
  function closeModal(modal) { modal.hidden = true; }
  function setBackground(name) {
    selectedBackground = name;
    stage.dataset.background = name;
    document.querySelectorAll(".background-option[data-background]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.background === name);
    });
  }
  function startMusic() {
    if (!soundEnabled || musicTimer) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext = audioContext || new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume();
    const notes = [523.25,659.25,783.99,659.25,587.33,698.46,880,698.46];
    const playNote = () => {
      if (!soundEnabled || !audioContext) return;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.value = notes[musicStep++ % notes.length];
      gain.gain.setValueAtTime(.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.04, audioContext.currentTime + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .22);
      osc.connect(gain); gain.connect(audioContext.destination);
      osc.start(); osc.stop(audioContext.currentTime + .23);
    };
    playNote();
    musicTimer = setInterval(playNote, 280);
  }
  function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
  function closeRun() {
    stage.classList.remove("is-running");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    stopMusic();
  }
  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await stage.requestFullscreen();
      else await document.exitFullscreen();
    } catch { showToast("이 브라우저에서는 전체 화면을 사용할 수 없어요."); }
  }

  document.querySelectorAll(".mode-btn").forEach((button) =>
    button.addEventListener("click", () => setMode(button.dataset.mode))
  );
  $("#textSettingsBtn").addEventListener("click", () => {
    messageInput.value = attentionText.textContent;
    openModal($("#textModal"));
  });
  $("#saveTextBtn").addEventListener("click", () => {
    const value = messageInput.value.trim();
    if (!value) { showToast("문구를 입력해 주세요."); messageInput.focus(); return; }
    attentionText.textContent = value;
    closeModal($("#textModal"));
    showToast("문구를 적용했어요.");
  });
  $("#backgroundBtn").addEventListener("click", () => openModal($("#backgroundModal")));
  $("#applyBackgroundBtn").addEventListener("click", () => {
    closeModal($("#backgroundModal"));
    showToast("배경을 적용했어요.");
  });
  $("#customBackgroundBtn").addEventListener("click", () => imageInput.click());
  $("#imageSettingsBtn").addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("이미지 파일을 선택해 주세요."); return; }
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    uploadedImageUrl = URL.createObjectURL(file);
    attentionImage.style.backgroundImage = `url("${uploadedImageUrl}")`;
    attentionImage.hidden = false;
    const custom = $("#customBackgroundBtn");
    custom.style.backgroundImage = `linear-gradient(#ffffff35,#ffffff35),url("${uploadedImageUrl}")`;
    custom.style.backgroundSize = "cover";
    custom.style.backgroundPosition = "center";
    custom.querySelectorAll("span,b").forEach((el) => el.style.opacity = "0");
    setMode("attention");
    showToast("이미지를 주목 화면에 추가했어요.");
    imageInput.value = "";
  });
  $("#soundToggleBtn").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    $("#soundToggleBtn").classList.toggle("is-on", soundEnabled);
    $("#soundToggleBtn").setAttribute("aria-label", soundEnabled ? "소리 끄기" : "소리 켜기");
    if (soundEnabled) startMusic(); else stopMusic();
    showToast(soundEnabled ? "소리를 켰어요." : "소리를 껐어요.");
  });
  $("#runBtn").addEventListener("click", () => {
    stage.classList.add("is-running");
    if (currentMode === "attention") {
      startMusic();
      showToast("모두의 시선을 모아볼까요?");
    } else {
      stopMusic();
      showToast("화면을 가렸어요. 화면을 클릭하거나 ESC를 눌러 닫으세요.");
    }
  });
  $("#previewBtn").addEventListener("click", () => {
    setMode("attention");
    showToast("주목 화면 미리보기예요.");
  });
  $("#coverCard").addEventListener("click", closeRun);
  stage.addEventListener("click", (event) => {
    if (stage.classList.contains("is-running") && currentMode === "cover" &&
        !event.target.closest(".stage-toolbar")) closeRun();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "f" && !event.target.matches("input")) {
      event.preventDefault(); toggleFullscreen();
    }
    if (event.key === "Escape") {
      closeRun();
      document.querySelectorAll(".modal-backdrop").forEach(closeModal);
    }
  });
  document.querySelectorAll("[data-close]").forEach((button) =>
    button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop")))
  );
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) =>
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeModal(backdrop);
    })
  );
  setMode("cover");
  setBackground(selectedBackground);
})();