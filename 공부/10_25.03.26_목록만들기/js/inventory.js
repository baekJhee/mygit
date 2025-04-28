const prev = document.querySelector("button.prev");
const next = document.querySelector("button.next");
const circle_tabs = document.querySelectorAll(".circle_tabs>button");
const pageContainer = document.querySelector(".pageContainer");
const page = document.querySelectorAll(".pageContainer>li");
const on_page = document.querySelector(".pageContainer>li.on");

let idx = 0;

//슬라이드
//다음버튼
next.addEventListener("click", () => {
    if (idx < page.length - 1) {
        idx++
        pageMove();
    }
});

prev.addEventListener("click", () => {
    if (idx > 0) {
        idx--;
        pageMove();
    }
});

function pageMove() {
    page.forEach(e => e.classList.remove("on"));
    circle_tabs.forEach(e => e.classList.remove("on"));

    page[idx].classList.add("on");
    circle_tabs[idx].classList.add("on");

    prev.classList.toggle("off", idx === 0);
    next.classList.toggle("off", idx === page.length - 1);
    console.log("페이지", idx);
}

circle_tabs.forEach((e, pageIdx) => {

    e.addEventListener("click", () => {
        console.log(pageIdx);
        idx = pageIdx
        pageMove();
    })
})

//right 박스를 배열로만들어서 내용을 바꿀 수 있도록!--- 나중에.. 

//data-click-obj 클릭시 data-page-num 번호에 맞게 부여
const clickObjs = document.querySelectorAll("[data-click-obj]");
const speakers = document.querySelectorAll(".speaker");
const narration = document.querySelectorAll("audio");


clickObjs.forEach(function (clickObj) {
    clickObj.addEventListener("click", function () {

        //data-click-obj 값 가져오기
        const clickedObj = this.getAttribute("data-click-obj");
        const pageNums = document.querySelectorAll(".right>li");
        pageNums.forEach(function (pageNum) {
            pageNum.classList.remove("on");
        });

        //data-click-obj 값 에 맞는 data-page-num on 더하기
        const targetPage = document.querySelector(
            `[data-page-num="${clickedObj}"]`
        );
        targetPage.classList.add("on");

        // 클릭 data-click-obj 에 .on 더하기
        clickObjs.forEach(function (clickObjs_on) {
            clickObjs_on.classList.remove("on");
        });
        this.classList.add("on");
        console.log(this);

        //음원재생
        speakers.forEach(function (speaker, i) {
            speaker.addEventListener("click", function () {
                narration[i].play();  // 해당 음원재생
            });
        });
        //다른 data-click-obj 클릭시 음원 멈춤 pause
        narration.forEach(function (audio) {
            audio.pause();
        });
    });
});


//좋아요버튼 토글 .on
const goodBtn = document.querySelectorAll(".good");
goodBtn.forEach(function (good) {
    good.addEventListener("click", function () {
        good.classList.toggle("on");
    });
});