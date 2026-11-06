const express = require('express');
const router = express.Router();

const galleryController = require('../controllers/galleryController');

// 포토갤러리 목록
router.get('/', galleryController.getGalleries);

// 포토갤러리 상세
router.get('/:id', galleryController.getGalleryById);

// 포토갤러리 뷰카운트
router.patch('/:id/views', galleryController.increaseViewCount);

module.exports = router;

