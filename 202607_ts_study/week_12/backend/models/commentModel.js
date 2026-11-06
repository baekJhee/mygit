
const db = require('../config/db');

// 특정 게시글의 댓글 목록 조회
const getCommentsByPhotoId = async (photoId) => {
    const [rows] = await db.query(
        `SELECT
            c.comment_id,
            c.photo_id,
            c.user_id,
            e.name AS user_name,
            c.content,
            c.created_at
        FROM photo_comments c
        JOIN employees e ON c.user_id = e.id
        WHERE c.photo_id = ?
        ORDER BY c.created_at ASC`,
        [photoId]
    );

    return rows;
};

// 댓글 작성
const createComment = async (photoId, userId, content) => {
    const [result] = await db.query(
        `INSERT INTO photo_comments
            (photo_id, user_id, content)
        VALUES (?, ?, ?)`,
        [photoId, userId, content]
    );

    return result.insertId;
};

// 댓글 삭제 (작성자 확인)
const deleteComment = async (commentId, userId) => {
    const [result] = await db.query(
        `DELETE FROM photo_comments
        WHERE comment_id = ? AND user_id = ?`,
        [commentId, userId]
    );

    return result.affectedRows;
};

module.exports = {
    getCommentsByPhotoId,
    createComment,
    deleteComment
};
