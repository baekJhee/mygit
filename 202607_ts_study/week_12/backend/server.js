const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const path = require('path');

const app = express();
const PORT = 3000;

const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use(cors());
app.use(express.json());

// API 라우터
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/photo-gallery', galleryRoutes);
app.use('/api/photo-gallery', commentRoutes);

// 서버 확인
// 프론트엔드 화면 연결
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 프론트엔드 CSS, JS 등 정적 파일 연결
app.use(express.static(path.join(__dirname, '../frontend')));

// 업로드 이미지 접근
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 서버 시간 조회
app.get('/api/time', (req, res) => {
    res.json({
        code: 200,
        message: '서버 시간 조회 성공',
        data: {
            timestamp: Date.now()
        }
    });
});

// DB 테스트
app.get('/api/db-test', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT NOW() AS currentTime');

        res.json({
            code: 200,
            message: 'DB 연결 성공',
            data: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: 'DB 연결 실패'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});