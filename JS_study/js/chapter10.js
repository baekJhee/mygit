console.log("10");
//for 문 반복문
// for (기본값; 조건식; 증감식 ){

// }

for (let idx = 1; idx <= 10; idx++) {

    if (idx % 2 === 0) {
        continue; // 건너뛰기
    }
    console.log(idx);
    // if (idx >= 5) {
    //     console.log("///////////");
    //     break; //  강제종료
    // }
}