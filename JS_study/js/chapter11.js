console.log("---11---");
// 함수
// 매게변수
function getArea1(width, height) {//(여기는 매게변수)
    // let area = 20 * 30
    let area = width * height;
    console.log(area);
}
getArea1(50, 30);// (여기 숫자는 인수)
console.log("-----------");
//
// 반환 (return)
function getArea2(width2, height2) {
    let area = width2 * height2;
    return area // 반환 : 반환하여 변수에 담을수 있다.
}
let area1 = getArea2(20, 30); // 반환된 값을 변수에 넣기
console.log(area1);
console.log("-----------");
//
// 중쳡 함수
function getArea3(width3, height3) {
    function another() { // 중첩하여 사용 가능
        console.log("another");
    }
    another()
    let area3 = width3 * height3;
    console.log(area3);
}
getArea3(30, 20);