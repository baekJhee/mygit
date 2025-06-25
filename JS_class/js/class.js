//Object-객체란

const me = {
    name: "qor",
    address: "토브",
    phoneNum: "010-0000-0000",
    canWalk() {
        console.log("qor은 걷는다.");
    },
    teaching(student) {
        student.study();
    }
}

const student = {
    level: 1,
    study() {
        this.levelUp();
    },
    levelUp() {
        this.level++;
    }
}

me.teaching(student);
console.log(student);


