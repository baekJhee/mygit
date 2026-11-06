const db = require('../config/db');

// 아이디로 직원 조회
const login = async (login_id) => {
    const [rows] = await db.query(
        `SELECT
            id,
            login_id,
            password,
            name,
            department,
            position
        FROM employees
        WHERE login_id = ?`,
        [login_id]
    );

    return rows[0];
};

module.exports = {
    login
};