console.log("09");
// if문
// let num = 4;
// if (num >= 10) {
//     console.log("num 은 10 이상입니다.");
// } else if (num >= 5) {
//     console.log("num 은 5 이상입니다.");
// } else if (num >= 3) {
//     console.log("num 은 3 이상 입니다.");
// } else {
//     console.log("조건은 거짓 입니다.");
// }

// switch 문
// -> if 과 기능은 동일 하지만 다수의 조건을 처리할때 더 직관적
let animal = "owl";

switch (animal) {
    case "cat": {
        console.log("고양이");
        break;
    }
    case "dog": {
        console.log("강아지");
        break;
    }
    case "bear": {
        console.log("고양이");
        break;
    }
    case "snake": {
        console.log("뱀");
        break;
    }
    case "tiger": {
        console.log("호랑이");
        break;
    }
    default: {
        console.log("모릅니다.");
    }
}