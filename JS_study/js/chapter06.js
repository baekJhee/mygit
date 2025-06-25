console.log("06");

// 1. 묵시적 형 변환
// -> 자바스크립트 엔진이 알아서 형 변환을 하는것

let num = 10;
let str = "20";

const resurt = num + str;
console.log(resurt); //1020  -> num 의 값을 String Type으로 변환됨

// 2. 명시적 형 변환
// -> 내장함수 등을 이용해서 직접 형 변환을 명시

let str1 = "10";
let strToNum = Number(str1);

console.log(10 + strToNum);// 20 -> 문자열을 Number 함수를 통해 변환

let str2 = "10개";
let strToNum2 = parseInt(str2);

console.log(strToNum2); // 10









