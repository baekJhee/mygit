
const db = require('../config/db');

// 포토갤러리 전체 목록 조회
const getGalleries = async () => {
    const [rows] = await db.query(
        `SELECT
            photo_id,
            user_id,
            photo_title,
            description,
            image_path,
            created_at,
            view_count
         FROM photo_gallery
         ORDER BY created_at DESC`
    );

    return rows;
};

// 포토갤러리 상세 조회
const getGalleryById = async (id) => {
    const [rows] = await db.query(
        `SELECT
            photo_id,
            user_id,
            photo_title,
            description,
            image_path,
            created_at,
            view_count
         FROM photo_gallery
         WHERE photo_id = ?`,
        [id]
    );

    return rows[0];
};

// 포토갤러리 조회수 증가
const increaseViewCount = async (id) => {
    const [result] = await db.query(
        `UPDATE photo_gallery
         SET view_count = view_count + 1
         WHERE photo_id = ?`,
        [id]
    );

    return result.affectedRows;
};
module.exports = {
    getGalleries,
    getGalleryById,
    increaseViewCount
};
