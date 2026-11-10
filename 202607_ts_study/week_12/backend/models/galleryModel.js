
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
// 포토갤러리 상세 조회
const getGalleryById = async (id) => {
    const [rows] = await db.query(
        `SELECT
            g.photo_id,
            g.user_id,
            g.photo_title,
            g.description,
            g.image_path,
            g.created_at,
            g.view_count,
            e.name
         FROM photo_gallery g
         LEFT JOIN employees e
            ON g.user_id = e.id
         WHERE g.photo_id = ?`,
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

// 포토갤러리 등록
const createGallery = async (gallery) => {
    const {
        user_id,
        photo_title,
        description,
        image_path
    } = gallery;

    const [result] = await db.query(
        `INSERT INTO photo_gallery
            (user_id, photo_title, description, image_path)
         VALUES (?, ?, ?, ?)`,
        [user_id, photo_title, description, image_path]
    );

    return result.insertId;
};

// 포토갤러리 수정
const updateGallery = async (id, gallery) => {
    const {
        photo_title,
        description,
        image_path
    } = gallery;

    const [result] = await db.query(
        `UPDATE photo_gallery
         SET photo_title = ?,
             description = ?,
             image_path = ?
         WHERE photo_id = ?`,
        [photo_title, description, image_path, id]
    );

    return result.affectedRows;
};

// 포토갤러리 삭제
const deleteGallery = async (id) => {
    // 삭제 전 이미지 경로 조회
    const [rows] = await db.query(
        `SELECT image_path
         FROM photo_gallery
         WHERE photo_id = ?`,
        [id]
    );

    if (!rows.length) {
        return null;
    }

    // 게시물 삭제
    await db.query(
        `DELETE FROM photo_gallery
         WHERE photo_id = ?`,
        [id]
    );

    return rows[0].image_path;
};

module.exports = {
    getGalleries,
    getGalleryById,
    increaseViewCount,
    createGallery,
    updateGallery,
    deleteGallery
};
