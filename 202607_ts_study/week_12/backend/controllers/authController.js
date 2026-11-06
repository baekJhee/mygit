const authModel = require('../models/authModel');

const login = async (req, res) => {
    try {
        const { login_id, password } = req.body;

        if (!login_id || !password) {
            return res.status(400).json({
                code: 400,
                message: '아이디와 비밀번호를 입력해 주세요.'
            });
        }

        // DB에서 직원 조회
        const employee = await authModel.login(login_id);

        if (!employee || employee.password !== password) {
            return res.status(401).json({
                code: 401,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        return res.json({
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

        return res.status(500).json({
            code: 500,
            message: '로그인 처리에 실패했습니다.'
        });
    }
};

module.exports = {
    login
};