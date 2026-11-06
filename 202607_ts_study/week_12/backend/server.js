const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = 3000;

const attendanceRoutes = require('./routes/attendanceRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use(cors());
app.use(express.json());

// API 라우터
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);

// 서버 확인
app.get('/', (req, res) => {
    res.send('Groupware API Server');
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

app.use('/api/attendance', attendanceRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/photo-gallery', galleryRoutes);
app.use('/api/photo-gallery', commentRoutes);
