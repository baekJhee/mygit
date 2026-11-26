(() => {
  const $ = (selector) => document.querySelector(selector);
  const app = $("#app");
  const coverScreen = $("#coverScreen");
  const attentionScreen = $("#attentionScreen");
  const attentionOptions = $("#attentionOptions");
  const toast = $("#toast");
  const imageInput = $("#imageInput");
  const clickSection = document.querySelectorAll("#app>section");

  let currentMode = "cover";
  let selectedAttentionBg = "cream";
  let uploadedImageUrl = "";
  let soundEnabled = false;
  let audioContext = null;
  let soundTimer = null;
  let noteIndex = 0;
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1900);
  }

  function setMode(mode) {
    currentMode = mode;
    const isCover = mode === "cover";
    coverScreen.hidden = !isCover;
    attentionScreen.hidden = isCover;
    attentionOptions.hidden = isCover;
    document.querySelectorAll(".mode-tab").forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
    if (isCover) stopSound();
  }

  function setCoverColor(color, selectedButton) {
    coverScreen.style.background = color;
    document.querySelectorAll(".color-chip").forEach((chip) => chip.classList.remove("is-selected"));
    if (selectedButton) selectedButton.classList.add("is-selected");
  }

  function setAttentionBackground(name) {
    selectedAttentionBg = name;
    attentionScreen.dataset.bg = name;
    document.querySelectorAll(".background-choice").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.bg === name);
    });
  }

  function openModal(modal) {
    modal.hidden = false;
    const focusTarget = modal.querySelector("input,button");
    if (focusTarget) setTimeout(() => focusTarget.focus(), 20);
  }

  function closeModal(modal) { modal.hidden = true; }

  function playNote() {
    if (!soundEnabled || !audioContext) return;
    const notes = [587.33, 698.46, 783.99, 698.46, 659.25, 783.99, 880, 783.99];
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = notes[noteIndex++ % notes.length];
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, audioContext.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.24);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);
  }

  async function startSound() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      showToast("이 브라우저에서는 소리를 사용할 수 없어요.");
      soundEnabled = false;
      updateSoundButton();
      return;
    }
    audioContext = audioContext || new AudioCtx();
    if (audioContext.state === "suspended") await audioContext.resume();
    soundEnabled = true;
    updateSoundButton();
    playNote();
    soundTimer = setInterval(playNote, 330);
  }

  function stopSound() {
    soundEnabled = false;
    clearInterval(soundTimer);
    soundTimer = null;
    updateSoundButton();
  }

  function updateSoundButton() {
    const button = $("#soundToggleBtn");
    button.classList.toggle("is-muted", !soundEnabled);
    button.textContent = soundEnabled ? "♫" : "♪";
    button.setAttribute("aria-label", soundEnabled ? "소리 끄기" : "소리 켜기");
    button.title = soundEnabled ? "소리 끄기" : "소리 켜기";
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      showToast("전체화면을 실행할 수 없어요.");
    }
  }
  function setAttentionBackground(name) {
    selectedAttentionBg = name;

    // 기본 배경 선택 시 사용자 이미지 제거
    attentionScreen.style.backgroundImage = "";

    attentionScreen.dataset.bg = name;

    document.querySelectorAll(".background-choice").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.bg === name);
    });
  }
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", async () => {
      const mode = tab.dataset.mode;

      setMode(mode);

      // 주목하기를 누르면 음원 자동 재생
      if (mode === "attention" && !soundEnabled) {
        await startSound();
      }
    });
  });

  document.querySelectorAll(".color-chip").forEach((chip) => {
    chip.addEventListener("click", () => setCoverColor(chip.dataset.color, chip));
  });
  $("#customCoverColor").addEventListener("input", (event) => {
    setCoverColor(event.target.value, null);
  });

  $("#textOpenBtn").addEventListener("click", () => {
    $("#messageInput").value = $("#attentionMessage").textContent;
    openModal($("#textModal"));
  });
  $("#applyTextBtn").addEventListener("click", () => {
    const value = $("#messageInput").value.trim();
    if (!value) {
      showToast("문구를 입력해 주세요.");
      $("#messageInput").focus();
      return;
    }
    $("#attentionMessage").textContent = value;
    closeModal($("#textModal"));
    showToast("문구를 변경했어요.");
  });

  $("#backgroundOpenBtn").addEventListener("click", () => openModal($("#backgroundModal")));
  document.querySelectorAll(".background-choice").forEach((button) => {
    button.addEventListener("click", () => setAttentionBackground(button.dataset.bg));
  });
  $("#applyBackgroundBtn").addEventListener("click", () => {
    closeModal($("#backgroundModal"));
    showToast("배경을 적용했어요.");
  });
  $("#customBackgroundBtn").addEventListener("click", () => {
    imageInput.click();
  });

  imageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일을 선택해 주세요.");
      return;
    }

    // 이전 이미지 URL 정리
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
    }

    uploadedImageUrl = URL.createObjectURL(file);

    // 주목 화면 전체 배경으로 적용
    attentionScreen.style.backgroundImage =
      `url("${uploadedImageUrl}")`;

    attentionScreen.style.backgroundSize = "contain";
    attentionScreen.style.backgroundPosition = "center";
    attentionScreen.style.backgroundRepeat = "no-repeat";

    // 사용자 이미지 선택 상태
    selectedAttentionBg = "custom";

    document.querySelectorAll(".background-choice").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.bg === "custom");
    });

    imageInput.value = "";

    showToast("사용자 배경을 적용했어요.");
  });

  $("#fullscreenBtn").addEventListener("click", toggleFullscreen);

  $("#soundToggleBtn").addEventListener("click", async () => {
    if (soundEnabled) {
      stopSound();
      showToast("소리를 껐어요.");
    } else {
      await startSound();
      if (soundEnabled) showToast("소리를 켰어요.");
    }
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop")));
  });
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeModal(backdrop);
    });
  });

  document.addEventListener("keydown", async (event) => {
    // 입력 중에는 단축키 실행하지 않기
    const tagName = event.target.tagName;
    if (
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      event.target.isContentEditable
    ) return;

    // F 키 : 전체화면 토글
    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        showToast("전체화면을 실행할 수 없어요.");
      }
    }

    // ESC : 모달 닫기 및 소리 끄기
    if (event.key === "Escape") {
      document.querySelectorAll(".modal-backdrop").forEach(closeModal);

      if (currentMode === "attention" && soundEnabled) {
        stopSound();
      }
    }
  });
  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = !!document.fullscreenElement;
    const button = $("#fullscreenBtn");

    button.textContent = isFullscreen ? "⛶" : "⛶";
    button.setAttribute(
      "aria-label",
      isFullscreen ? "전체화면 종료" : "전체화면 켜기"
    );
    button.title = isFullscreen ? "전체화면 종료" : "전체화면 켜기";
  });

  clickSection.forEach((clickSections) => {
    clickSections.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopSound();
  });

  setMode("cover");
  setAttentionBackground(selectedAttentionBg);
  updateSoundButton();
})();