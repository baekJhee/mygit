const employeeModel = require('../models/employeeModel');

const getEmployees = async (req, res) => {
    try {
        const employees = await employeeModel.getEmployees();

        res.json({
            code: 200,
            message: '사원 목록 조회 성공',
            data: employees
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            code: 500,
            message: '사원 목록 조회 실패'
        });
    }
};
const getEmployeeById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                code: 400,
                message: '올바르지 않은 사원 ID입니다.'
            });
        }

        const employee = await employeeModel.getEmployeeById(id);

        if (!employee) {
            return res.status(404).json({
                code: 404,
                message: '해당 사원을 찾을 수 없습니다.'
            });
        }

        res.json({
            code: 200,
            message: '사원 상세 조회 성공',
            data: employee
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            code: 500,
            message: '사원 상세 조회 실패'
        });
    }
};

// 직원 연락망 목록 조회
const getEmployeeContacts = async (req, res) => {
    try {
        const contacts = await employeeModel.getEmployeeContacts();

        res.json({
            code: 200,
            message: '직원 연락망 조회 성공',
            data: contacts
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            code: 500,
            message: '직원 연락망 조회 실패'
        });
    }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    getEmployeeContacts
};