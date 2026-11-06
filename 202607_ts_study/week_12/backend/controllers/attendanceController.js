
const authModel = require('../models/authModel');

// 로그인
const login = async (req, res) => {
    try {
        const { login_id, password } = req.body;

        // 입력값 확인
        if (!login_id || !password) {
            return res.status(400).json({
                code: 400,
                message: '아이디와 비밀번호를 입력해 주세요.'
            });
        }

        // 아이디로 직원 조회
        const employee = await authModel.getEmployeeByLoginId(login_id);

        // 아이디 확인
        if (!employee) {
            return res.status(401).json({
                code: 401,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 비밀번호 확인 (현재 DB는 평문 저장)
        if (employee.password !== password) {
            return res.status(401).json({
                code: 401,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 로그인 성공
        res.json({
            code: 200,
            message: '로그인 성공',
            data: {
                id: employee.id,
                login_id: employee.login_id,
                name: employee.name,
                department: employee.department,
                position: employee.position
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            code: 500,
            message: '로그인 처리 실패'
        });
    }
};

module.exports = {
    login
};


const attendanceModel = require('../models/attendanceModel');

// 오늘 출퇴근 기록 조회
const getTodayAttendance = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                code: 400,
                message: '올바르지 않은 사원 번호입니다.'
            });
        }

        const attendance =
            await attendanceModel.getTodayAttendance(userId);

        return res.json({
            code: 200,
            message: '오늘 출퇴근 기록 조회 성공',
            data: attendance || null
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            code: 500,
            message: '출퇴근 기록 조회 실패'
        });
    }
};

// 출근
const checkIn = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!Number.isInteger(user_id) || user_id <= 0) {
            return res.status(400).json({
                code: 400,
                message: '올바르지 않은 사원 번호입니다.'
            });
        }

        const attendance =
            await attendanceModel.getTodayAttendance(user_id);

        if (attendance) {
            return res.status(409).json({
                code: 409,
                message: '이미 출근 처리되었습니다.'
            });
        }

        await attendanceModel.checkIn(user_id);

        const result =
            await attendanceModel.getTodayAttendance(user_id);

        return res.json({
            code: 200,
            message: '출근 처리 성공',
            data: result
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            code: 500,
            message: '출근 처리 실패'
        });
    }
};

// 퇴근
const checkOut = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!Number.isInteger(user_id) || user_id <= 0) {
            return res.status(400).json({
                code: 400,
                message: '올바르지 않은 사원 번호입니다.'
            });
        }

        const attendance =
            await attendanceModel.getTodayAttendance(user_id);

        if (!attendance) {
            return res.status(400).json({
                code: 400,
                message: '출근 기록이 없습니다.'
            });
        }

        if (attendance.check_out) {
            return res.status(409).json({
                code: 409,
                message: '이미 퇴근 처리되었습니다.'
            });
        }

        await attendanceModel.checkOut(user_id);

        const result =
            await attendanceModel.getTodayAttendance(user_id);

        return res.json({
            code: 200,
            message: '퇴근 처리 성공',
            data: result
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            code: 500,
            message: '퇴근 처리 실패'
        });
    }
};

module.exports = {
    getTodayAttendance,
    checkIn,
    checkOut
};
