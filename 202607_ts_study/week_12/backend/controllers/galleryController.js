const galleryModel = require('../models/galleryModel');

// 포토갤러리 목록 조회
const getGalleries = async (req, res) => {
    try {
        const galleries = await galleryModel.getGalleries();

        res.json({
            code: 200,
            message: '포토갤러리 목록 조회 성공',
            data: galleries
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            code: 500,
            message: '포토갤러리 목록 조회 실패'
        });
    }
};

// 포토갤러리 상세 조회
const getGalleryById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                code: 400,
                message: '올바르지 않은 갤러리 번호입니다.'
            });
        }

        const gallery = await galleryModel.getGalleryById(id);

        if (!gallery) {
            return res.status(404).json({
                code: 404,
                message: '포토갤러리를 찾을 수 없습니다.'
            });
        }

        res.json({
            code: 200,
            message: '포토갤러리 상세 조회 성공',
            data: gallery
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            code: 500,
            message: '포토갤러리 상세 조회 실패'
        });
    }
};
// 포토갤러리 조회수 증가
const increaseViewCount = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                code: 400,
                message: '잘못된 사진 번호입니다.',
                data: null
            });
        }

        const result = await galleryModel.increaseViewCount(id);

        if (!result) {
            return res.status(404).json({
                code: 404,
                message: '사진을 찾을 수 없습니다.',
                data: null
            });
        }

        res.json({
            code: 200,
            message: '조회수 증가 성공',
            data: null
        });

    } catch (error) {
        console.error('조회수 증가 오류:', error);

        res.status(500).json({
            code: 500,
            message: '조회수 증가 실패',
            data: null
        });
    }
};
module.exports = {
    getGalleries,
    getGalleryById,
    increaseViewCount
};