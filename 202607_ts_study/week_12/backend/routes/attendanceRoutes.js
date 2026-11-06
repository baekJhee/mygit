const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendanceController');

// 오늘 출퇴근 기록 조회
router.get('/:userId/today', attendanceController.getTodayAttendance);

// 출근
router.post('/check-in', attendanceController.checkIn);

// 퇴근
router.patch('/check-out', attendanceController.checkOut);

module.exports = router;