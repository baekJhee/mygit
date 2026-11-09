
const db = require('../config/db');

// 전체 출퇴근 기록 조회
const getAttendances = async () => {
    const [rows] = await db.query(
        'SELECT * FROM attendance ORDER BY work_date DESC'
    );

    return rows;
};

// 사원별 출퇴근 기록 조회
const getAttendancesByEmployeeId = async (employeeId) => {
    const [rows] = await db.query(
        `SELECT *
         FROM attendance
         WHERE user_id = ?
         ORDER BY work_date DESC`,
        [employeeId]
    );

    return rows;
};

// 오늘 출퇴근 기록 조회
const getTodayAttendance = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            attendance_id,
            user_id,
            work_date,
            check_in,
            check_out,
            work_status
         FROM attendance
         WHERE user_id = ?
         AND work_date = CURDATE()`,
        [userId]
    );

    return rows[0];
};

// 출근 처리
const checkIn = async (userId) => {
    const [result] = await db.query(
        `INSERT INTO attendance (
            user_id,
            work_date,
            check_in
        ) VALUES (?, CURDATE(), CURTIME())`,
        [userId]
    );

    return result.insertId;
};

// 퇴근 처리
const checkOut = async (userId) => {
    const [result] = await db.query(
        `UPDATE attendance
         SET check_out = CURTIME()
         WHERE user_id = ?
         AND work_date = CURDATE()
         AND check_out IS NULL`,
        [userId]
    );

    return result.affectedRows;
};

// 월별 전체 직원 출퇴근 기록 조회
const getMonthlyAttendances = async (year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

    const [rows] = await db.query(
        `SELECT
            a.attendance_id,
            a.user_id,
            e.name AS employee_name,
            e.department,
            e.position,
            DATE_FORMAT(a.work_date, '%Y-%m-%d') AS work_date,
            a.check_in,
            a.check_out,
            a.work_status
         FROM attendance a
         LEFT JOIN employees e
            ON a.user_id = e.id
         WHERE a.work_date >= ?
         AND a.work_date < DATE_ADD(?, INTERVAL 1 MONTH)
         ORDER BY a.work_date ASC, e.name ASC`,
        [startDate, startDate]
    );

    return rows;
};

// 외부에서 사용할 함수 내보내기
module.exports = {
    getAttendances,
    getAttendancesByEmployeeId,
    getTodayAttendance,
    checkIn,
    checkOut,
    getMonthlyAttendances
};
