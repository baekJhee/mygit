const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employeeController');

router.get('/contacts', employeeController.getEmployeeContacts);
// 사원 목록 조회
router.get('/', employeeController.getEmployees);
// 사원 상세 조회
router.get('/:id', employeeController.getEmployeeById);

module.exports = router;