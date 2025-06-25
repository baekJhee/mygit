console.log("04");

//1. 변수
let age;
// console.log(age); // undefined

age = 30;
// console.log(age); // 30

// 2. 상수
const birth = "1997"
// console.log(birth); //1997

// birth = 30;
// console.log(birth); //오류

// 3. 변수 네이밍 규칙
// 3-1. $, _ 제외한 기호 사용 불가
let $_name;

// 3-2. 숫자로 시작 할 수 없다.
let name1;
let $2name;

// 3-3. 예약어를 사용 할 수 없다.
//let let , let if , let const , let var , let for ... 등등

// 4. 변수 명명 가이드
// 안좋은 예
let a = 1;
let b = 1;
let c = a - b;

// 좋은예 직관적으로 알 수 있도록
let salesCount = 1;
let refoundCount = 1;
let totalSalesCount = salesCount - refoundCount;