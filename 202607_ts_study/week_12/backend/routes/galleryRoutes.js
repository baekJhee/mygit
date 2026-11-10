
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const galleryController = require('../controllers/galleryController');

// 이미지 저장 폴더
const uploadDir = path.join(__dirname, '../uploads/gallery');

// 폴더가 없으면 자동 생성
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 이미지 저장 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;

        cb(null, fileName);
    }
});

// 이미지 파일 형식 제한
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('JPG, PNG, GIF, WEBP 이미지만 업로드할 수 있습니다.'));
    }
};

// Multer 설정
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// 업로드 오류 처리
const uploadImage = (req, res, next) => {
    upload.single('image')(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                code: 400,
                message: error instanceof multer.MulterError
                    ? '이미지 업로드에 실패했습니다. 파일 크기와 형식을 확인해 주세요.'
                    : error.message,
                data: null
            });
        }

        next();
    });
};

// 포토갤러리 목록
router.get('/', galleryController.getGalleries);

// 포토갤러리 등록
router.post('/', uploadImage, galleryController.createGallery);

// 포토갤러리 상세
router.get('/:id', galleryController.getGalleryById);

// 포토갤러리 수정
router.put('/:id', uploadImage, galleryController.updateGallery);

// 포토갤러리 삭제
router.delete('/:id', galleryController.deleteGallery);

// 포토갤러리 조회수 증가
router.patch('/:id/views', galleryController.increaseViewCount);

module.exports = router;
