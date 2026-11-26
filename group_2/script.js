const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = { groups: [], stickerCount: 5, selectedSticker: "star", theme: "basic", hasBoard: false, completedShownFor: new Set() };

const stickerMap = { star: "★", smile: "☻", heart: "♥", check: "✓" };

const teamColors = ["#e89ca4", "#f0cf72", "#91bd91", "#8fb6e8", "#b59be0", "#e9a36f", "#82c9c3", "#d79bbf", "#a8b3c8", "#c4ad83"];

const events = [{ title: "칭찬 타임!", message: "서로 도와주며 열심히 참여했어요." }, { title: "응원 타임!", message: "조금씩 함께 나아가는 우리 모둠, 끝까지 힘내요!" }, { title: "깜짝 질문!", message: "오늘 활동에서 가장 재미있었던 순간은 무엇인가요?" }, { title: "하이파이브!", message: "멋진 협동심을 보여준 우리 모둠에게 박수!" }, { title: "미션 성공!", message: "함께하면 무엇이든 해낼 수 있어요!" }];

const settingsModal = $("#settingsModal"), settingsForm = $("#settingsForm"), groupInput = $("#groupCount"), stickerInput = $("#stickerCount");

let settingsMode = "initial", toastTimer, eventTimer;

function createGroups(count, stickerCount) {
    state.groups = Array.from({ length: count }, (_, i) => ({ id: i + 1, stickers: [], stickerType: state.selectedSticker, color: teamColors[i] }));
    state.stickerCount = stickerCount;
    state.completedShownFor.clear();
    state.hasBoard = true;
    render();

}
function render() {
    const el = $("#groups");
    el.innerHTML = "";
    const cols = Math.min(state.groups.length, 5), w = state.groups.length <= 2 ? 420 : state.groups.length <= 3 ? 360 : state.groups.length <= 5 ? 320 : 280;

    el.style.gridTemplateColumns = `repeat(${cols},minmax(0,${w}px))`;
    el.style.gridTemplateRows = `repeat(${Math.ceil(state.groups.length / cols)},minmax(0,1fr))`;
    el.style.justifyContent = "center";
    el.style.alignItems = "center";

    state.groups.forEach(g => {
        const n = g.stickers.length, done = n === state.stickerCount, card = document.createElement("article");
        card.className = `group-card${done ? " completed" : ""}`;
        card.style.setProperty("--team", g.color);

        card.innerHTML = `<div class="group-top"></div><div class="group-header"><div><div class="group-name"><i class="team-dot"></i>${g.id}모둠</div><div class="group-count">${n} / ${state.stickerCount}개 모았어요</div></div><button class="reset-group" type="button" data-reset="${g.id}" aria-label="${g.id}모둠 스티커 모두 지우기" title="이 모둠 비우기">↻</button></div><div class="sticker-grid" aria-label="${g.id}모둠 스티커 칸"></div><div class="group-footer"><span>${done ? "모든 스티커를 모았어요!" : "빈 칸을 눌러 스티커 모으기"}</span><strong class="${done ? "done-label" : ""}">${done ? "완료 ✦" : `${Math.round(n / state.stickerCount * 100)}%`}</strong></div>`;

        const grid = $(".sticker-grid", card);
        for (let i = 0;
            i < state.stickerCount;
            i++) {
            const filled = i < n, slot = document.createElement("button");
            slot.type = "button";
            slot.className = `sticker-slot${filled ? " filled" : ""}`;
            slot.dataset.group = g.id;
            slot.dataset.index = i;
            slot.setAttribute("aria-label", `${g.id}모둠 ${i + 1}번째 칸 ${filled ? "스티커 있음, 누르면 여기부터 지우기" : "비어 있음, 누르면 스티커 붙이기"}`);
            slot.innerHTML = filled ? `<span class="sticker-glyph">${stickerMap[g.stickers[i]] || stickerMap.star}</span>` : `<span>${i + 1}</span>`;
            grid.appendChild(slot);
        } el.appendChild(card);

    });

    const total = state.groups.length * state.stickerCount, earned = state.groups.reduce((s, g) => s + g.stickers.length, 0);

    $("#progressSummary").innerHTML = `<span class="summary-chip"><strong>${state.groups.length}</strong>개 모둠</span><span class="summary-chip"><strong>${earned} / ${total}</strong>개 스티커</span><span class="summary-chip"><strong>${total ? Math.round(earned / total * 100) : 0}%</strong> 달성</span>`;

    document.body.dataset.theme = state.theme;
    $("#app").classList.toggle("play", state.theme === "play");

}
function openSettings(mode = "edit") {
    settingsMode = mode;
    groupInput.value = state.hasBoard ? state.groups.length : 3;
    stickerInput.value = state.hasBoard ? state.stickerCount : 5;
    $("#formError").textContent = "";
    $("#cancelSettings").style.display = mode === "initial" ? "none" : "";
    $("#settingsTitle").textContent = mode === "initial" ? "모둠 설정" : "모둠 설정 변경";
    $(".dialog-desc", settingsModal).textContent = mode === "initial" ? "오늘 함께할 모둠과 스티커 개수를 정해 주세요." : "설정을 바꾸면 현재 스티커가 모두 초기화돼요.";
    $(".primary", settingsModal).textContent = mode === "initial" ? "보드 만들기" : "변경하기";
    settingsModal.classList.add("show");

}
function closeSettings() {
    if (settingsMode !== "initial") settingsModal.classList.remove("show");

}
function showToast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1900);

}
function burstConfetti() {
    const layer = $("#confettiLayer"), symbols = ["★", "✦", "●", "◆", "♥"];
    for (let i = 0;
        i < 64;
        i++) {
        const p = document.createElement("i");
        p.className = "confetti";
        p.textContent = symbols[Math.random() * symbols.length | 0];
        p.style.left = `${Math.random() * 100}%`;
        p.style.color = ["#f2c14e", "#ee8797", "#6fa9e8", "#8bc7a4", "#a88de0"][i % 5];
        p.style.fontSize = `${8 + Math.random() * 12}px`;
        p.style.animationDelay = `${Math.random() * .45}s`;
        p.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
        layer.appendChild(p);
        setTimeout(() => p.remove(), 2400);
    }
}
function showEvent(g) {
    const e = events[Math.random() * events.length | 0];
    $("#eventTitle").textContent = e.title;
    $("#eventTeam").textContent = `${g.id}모둠을 응원합니다!`;
    $("#eventMessage").textContent = e.message;
    $("#eventModal").classList.add("show");
}
function closeEvent() {
    $("#eventModal").classList.remove("show");
    clearTimeout(eventTimer);

}
$("#groups").addEventListener("click", e => {
    const reset = e.target.closest("[data-reset]");
    if (reset) {
        const g = state.groups.find(x => x.id === +reset.dataset.reset);
        if (!g?.stickers.length) return;
        g.stickers = [];
        state.completedShownFor.delete(g.id);
        render();
        showToast(`${g.id}모둠 스티커를 비웠어요.`);
        return;
    }
    const slot = e.target.closest(".sticker-slot");
    if (!slot) return;
    const g = state.groups.find(x => x.id === +slot.dataset.group), i = +slot.dataset.index;
    if (!g) return;

    if (i >= g.stickers.length) {
        const before = g.stickers.length;

        for (let j = before; j <= i; j++) {
            g.stickers.push(g.stickerType);
        }
        render();
        // 이번 클릭으로 새로 채워진 스티커만 애니메이션
        for (let j = before; j <= i; j++) {
            const target = $(
                `.sticker-slot[data-group="${g.id}"][data-index="${j}"]`
            );
            target?.classList.add("pop");
        }


        if (g.stickers.length === state.stickerCount && !state.completedShownFor.has(g.id)) {
            state.completedShownFor.add(g.id);
            burstConfetti();
            showToast(`${g.id}모둠 완료! 참 잘했어요!`);
        } if (g.stickers.length > before && Math.random() < .22) {
            clearTimeout(eventTimer);
            eventTimer = setTimeout(() => showEvent(g), 350);

        }
    }
    else {
        g.stickers.splice(i);
        state.completedShownFor.delete(g.id);
        render();
        showToast(`${g.id}모둠 스티커를 ${i + 1}번째부터 지웠어요.`);
    }
});

settingsForm.addEventListener("submit", e => {
    e.preventDefault();
    const groups = +groupInput.value, stickers = +stickerInput.value;
    if (!Number.isInteger(groups) || groups < 2 || groups > 10 || !Number.isInteger(stickers) || stickers < 5 || stickers > 20) {
        $("#formError").textContent = "모둠은 2~10개, 스티커는 5~20개 사이로 입력해 주세요.";
        return;

    } createGroups(groups, stickers);
    settingsModal.classList.remove("show");
    showToast("새 스티커 보드를 만들었어요!");
});

$("#cancelSettings").addEventListener("click", closeSettings);
$("#settingsBtn").addEventListener("click", () => openSettings("edit"));

$("#noticeOk").addEventListener("click", () => {
    $("#noticeModal").classList.remove("show");
    if (!state.hasBoard) openSettings("initial");

});

$$("[data-step]").forEach(b => b.addEventListener("click", () => {
    const input = b.dataset.step === "groups" ? groupInput : stickerInput;
    input.value = Math.min(+input.max, Math.max(+input.min, +(input.value || input.min) + +b.dataset.delta));
    $("#formError").textContent = "";

}));

$("#clearAllBtn").addEventListener("click", () => {
    if (!state.hasBoard) return;
    state.groups.forEach(g => g.stickers = []);
    state.completedShownFor.clear();
    render();
    showToast("모든 모둠의 스티커를 비웠어요.");

});

$$(".sticker-choice").forEach(b => b.addEventListener("click", () => {
    state.selectedSticker = b.dataset.sticker;
    $$(".sticker-choice").forEach(x => {
        const on = x === b;
        x.classList.toggle("selected", on);
        x.setAttribute("aria-pressed", String(on));

    });
    state.groups.forEach(g => {
        g.stickerType = state.selectedSticker;
        g.stickers = g.stickers.map(() => state.selectedSticker);

    });
    render();
    showToast("스티커 디자인을 변경했어요.");
}));

$$(".theme-btn").forEach(b => b.addEventListener("click", () => {
    state.theme = b.dataset.theme;
    $$(".theme-btn").forEach(x => {
        const on = x === b;
        x.classList.toggle("active", on);
        x.setAttribute("aria-pressed", String(on));

    });
    render();
}));

$("#closeEvent").addEventListener("click", closeEvent);
$("#eventModal").addEventListener("click", e => {
    if (e.target === $("#eventModal")) closeEvent();

});

$("#noticeModal").addEventListener("click", e => {
    if (e.target === $("#noticeModal")) $("#noticeModal").classList.remove("show");

});

$("#settingsModal").addEventListener("click", e => {
    if (e.target === settingsModal && settingsMode !== "initial") closeSettings();

});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        if ($("#eventModal").classList.contains("show")) closeEvent();
        else if ($("#noticeModal").classList.contains("show")) $("#noticeModal").classList.remove("show");
        else closeSettings();

    }
});

openSettings("initial");

