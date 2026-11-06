const db = require('../config/db');

const getEmployees = async () => {
    const [rows] = await db.query(`
    SELECT
      id,
      login_id,
      name,
      extension_num,
      created_at,
      birth_date,
      department,
      position,
      phone,
      email
    FROM employees
  `);

    return rows;
};

// 직원 연락망 목록 조회
const getEmployeeContacts = async () => {
    const [rows] = await db.query(`
        SELECT
            id,
            name,
            department,
            position,
            extension_num,
            phone,
            email
        FROM employees
        ORDER BY department, name
    `);

    return rows;
};

const getEmployeeById = async (id) => {
    const [rows] = await db.query(
        `SELECT
            id,
            login_id,
            name,
            extension_num,
            created_at,
            birth_date,
            department,
            position,
            phone,
            email
        FROM employees
        WHERE id = ?`,
        [id]
    );

    return rows[0];
};
module.exports = {
    getEmployees,
    getEmployeeById,
    getEmployeeContacts
};