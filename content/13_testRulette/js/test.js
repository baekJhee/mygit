
const inputs = document.querySelectorAll("input");
const circle = document.querySelector(".circle");

const btnStart = document.querySelector(".start");
const btnStop = document.querySelector(".stop");
const btnReset = document.querySelector(".reset");
//animation 말고 transform rotate로 던데.. 다 따로 가능한가???
// 멈추는게 랜덤--> 회전속도 차이로 가능
// 값을 주고 이것에 대한 배수 에서만 멈춰라+근접한 값에 멈춰라

let spinning = false
const animationIds = {};
const currentDegs = {
    bottom: 0,
    // middle: 0,
    // top: 0
};

const circles = {
    bottom: {
        el: document.querySelector(".circle"),
        speed: 20,
        step: 36,
        degree: 0,
    },
    // middle: {
    //     el: document.querySelector(".circle_middle"),
    //     speed: 15,
    //     step: 36,
    //     degree: 0,
    // },
    // top: {
    //     el: document.querySelector(".circle_top"),
    //     speed: 15,
    //     step: 72,
    //     degree: 0,
    // }
};


//회전 함수
//function spinLoop(target, circle, speed){ }  --> circles 키벨류 활용 전
function spinLoop(circleKey) {
    const circle = circles[circleKey];
    currentDegs[circleKey] += circle.speed;
    circle.el.style.transform = `rotate(${currentDegs[circleKey]}deg)`;

    animationIds[circleKey] = requestAnimationFrame(() => spinLoop(circleKey));
}

// 시작 버튼
btnStart.addEventListener("click", () => {
    if (spinning) return;
    spinning = true;

    btnReset.classList.add("pointN");
    btnStart.classList.add("pointN");

    spinLoop("bottom");
    // spinLoop("middle");
    // spinLoop("top");
});

// 멈춤 버튼
btnStop.addEventListener("click", () => {
    if (!spinning) return;
    spinning = false;

    btnReset.classList.remove("pointN");
    btnStart.classList.remove("pointN");

    cancelAnimationFrame(animationIds.bottom);
    // cancelAnimationFrame(animationIds.middle);
    // cancelAnimationFrame(animationIds.top);

    stopAtMultiple("bottom");
    // stopAtMultiple("middle");
    // stopAtMultiple("top");
    // stopAtMultiple(circleBottom, "bottom", 36);
    // stopAtMultiple(circleMidlle, "middle", 36);
    // stopAtMultiple(circleTop, "top", 72);
});

//function stopAtMultiple(element, circle, stepDeg){ }
function stopAtMultiple(circleKey) {
    const circle = circles[circleKey]
    const nowDeg = currentDegs[circleKey] % 360;
    const remainder = nowDeg % circles[circleKey].step;
    const extraDeg = remainder === 0 ? 0 : circles[circleKey].step - remainder;
    const targetDeg = currentDegs[circleKey] + extraDeg;
    //ㄴ삼항연산자로 단순한 조건문에서 간결허게 쓰기 좋다. 아래 if 와 동일

    // let extraDeg;
    // if (remainder === 0) {
    //     extraDeg = 0;
    // } else {
    //     extraDeg = stepDeg - remainder;
    // }

    circle.el.style.transition = 'transform 2s ease-out';  // 스르륵 멈추기
    circle.el.style.transform = `rotate(${targetDeg}deg)`;
    currentDegs[circleKey] = targetDeg;

    circle.el.addEventListener('transitionend', function handler() {
        circle.el.style.transition = '';
        circle.el.removeEventListener('transitionend', handler);
    });

    console.log(`${circles}(${targetDeg}deg)`);
}

//입력란
inputs.forEach(function (input) {
    // 내용이 있을경우만 지워라
    input.addEventListener("input", function () {
        if (input.value.trim() === "") {
            input.parentElement.classList.remove("on");
        } else {
            input.parentElement.classList.add("on")
        }
    });
});

btnReset.addEventListener("click", function () {
    inputs.forEach(function (input) {
        input.value = "";
        input.parentElement.classList.remove("on")
    });
});
