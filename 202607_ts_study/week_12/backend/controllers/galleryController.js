
const galleryModel = require('../models/galleryModel');
const fs = require('fs');
const path = require('path');

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
            message: '포토갤러리 목록 조회 실패',
            data: null
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
                message: '올바르지 않은 갤러리 번호입니다.',
                data: null
            });
        }

        const gallery = await galleryModel.getGalleryById(id);

        if (!gallery) {
            return res.status(404).json({
                code: 404,
                message: '포토갤러리를 찾을 수 없습니다.',
                data: null
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
            message: '포토갤러리 상세 조회 실패',
            data: null
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

// 서버에 저장된 이미지 삭제
const deleteImageFile = (imagePath) => {
    if (!imagePath || !imagePath.startsWith('/uploads/gallery/')) {
        return;
    }

    const fileName = path.basename(imagePath);
    const filePath = path.join(
        __dirname,
        '../uploads/gallery',
        fileName
    );

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// 포토갤러리 등록
const createGallery = async (req, res) => {
    try {
        const { user_id, photo_title, description } = req.body;

        if (!user_id || !photo_title?.trim() || !req.file) {
            if (req.file) deleteImageFile(`/uploads/gallery/${req.file.filename}`);

            return res.status(400).json({
                code: 400,
                message: '작성자, 제목, 이미지를 입력해 주세요.',
                data: null
            });
        }

        const imagePath = `/uploads/gallery/${req.file.filename}`;

        const photoId = await galleryModel.createGallery({
            user_id,
            photo_title: photo_title.trim(),
            description: description || '',
            image_path: imagePath
        });

        res.status(201).json({
            code: 201,
            message: '포토갤러리 등록 성공',
            data: {
                photo_id: photoId,
                user_id,
                photo_title: photo_title.trim(),
                image_path: imagePath
            }
        });

    } catch (error) {
        console.error('포토갤러리 등록 오류:', error);

        if (req.file) {
            deleteImageFile(`/uploads/gallery/${req.file.filename}`);
        }

        res.status(500).json({
            code: 500,
            message: '포토갤러리 등록 실패',
            data: null
        });
    }
};

// 포토갤러리 수정
const updateGallery = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { photo_title, description } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                code: 400,
                message: '잘못된 사진 번호입니다.',
                data: null
            });
        }

        if (!photo_title?.trim()) {
            if (req.file) deleteImageFile(`/uploads/gallery/${req.file.filename}`);

            return res.status(400).json({
                code: 400,
                message: '사진 제목을 입력해 주세요.',
                data: null
            });
        }

        const oldGallery = await galleryModel.getGalleryById(id);

        if (!oldGallery) {
            if (req.file) deleteImageFile(`/uploads/gallery/${req.file.filename}`);

            return res.status(404).json({
                code: 404,
                message: '포토갤러리를 찾을 수 없습니다.',
                data: null
            });
        }

        const imagePath = req.file
            ? `/uploads/gallery/${req.file.filename}`
            : oldGallery.image_path;

        const result = await galleryModel.updateGallery(id, {
            photo_title: photo_title.trim(),
            description: description || '',
            image_path: imagePath
        });

        if (!result) {
            if (req.file) deleteImageFile(imagePath);

            return res.status(404).json({
                code: 404,
                message: '게시물 수정에 실패했습니다.',
                data: null
            });
        }

        // 새 이미지로 교체한 경우 기존 이미지 삭제
        if (req.file && oldGallery.image_path !== imagePath) {
            deleteImageFile(oldGallery.image_path);
        }

        res.json({
            code: 200,
            message: '포토갤러리 수정 성공',
            data: {
                photo_id: id,
                photo_title: photo_title.trim(),
                description: description || '',
                image_path: imagePath
            }
        });

    } catch (error) {
        console.error('포토갤러리 수정 오류:', error);

        if (req.file) {
            deleteImageFile(`/uploads/gallery/${req.file.filename}`);
        }

        res.status(500).json({
            code: 500,
            message: '포토갤러리 수정 실패',
            data: null
        });
    }
};

// 포토갤러리 삭제
const deleteGallery = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                code: 400,
                message: '잘못된 사진 번호입니다.',
                data: null
            });
        }

        const imagePath = await galleryModel.deleteGallery(id);

        if (imagePath === null) {
            return res.status(404).json({
                code: 404,
                message: '포토갤러리를 찾을 수 없습니다.',
                data: null
            });
        }

        // DB 삭제 후 이미지 파일 삭제
        deleteImageFile(imagePath);

        res.json({
            code: 200,
            message: '포토갤러리 삭제 성공',
            data: {
                photo_id: id
            }
        });

    } catch (error) {
        console.error('포토갤러리 삭제 오류:', error);

        res.status(500).json({
            code: 500,
            message: '포토갤러리 삭제 실패',
            data: null
        });
    }
};

module.exports = {
    getGalleries,
    getGalleryById,
    increaseViewCount,
    createGallery,
    updateGallery,
    deleteGallery
};
