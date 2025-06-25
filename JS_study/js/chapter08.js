console.log("08");
// 1. null 병합 연산자
// -> 존재하는 값을 추려내는 기능

// let userName = "백지희";
let userName
let nickName = "뀨로";

let displayname = userName ?? nickName; // userName이 있울 경우 userName 출력, 없을 경우 nickName 을 출력
// console.log(displayname);

// 2. typeof 연산자
// -> 값의 타입을 문자열로 반환하는 기능

let text
text = "hello" //string
text = true //boolean

let t1 = typeof text;

// console.log(t1);

// 3. 삼항 연산자
// -> 항을 3개 사용하는 연산자
let num1 = 10;
//요구사항: 변수 res에 num1의 값이 짝수 => "짝" , 홀수 => "홀"
let res = num1 % 2 === 0 ? "짝" : "홀";
//       ---------------   ----  -----
//            조건식         참    거짓
console.log(res);
