
const commentModel = require('../models/commentModel');

// 댓글 목록 조회
const getComments = async (req, res) => {
    try {
        const { id } = req.params;

        const comments = await commentModel.getCommentsByPhotoId(id);

        res.status(200).json({
            code: 200,
            message: '댓글 목록 조회 성공',
            data: comments
        });

    } catch (error) {
        console.error('댓글 목록 조회 오류:', error);

        res.status(500).json({
            code: 500,
            message: '댓글 목록 조회 실패',
            data: null
        });
    }
};

// 댓글 작성
const createComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, content } = req.body;

        if (!user_id || !content || !content.trim()) {
            return res.status(400).json({
                code: 400,
                message: '작성자와 댓글 내용을 입력해 주세요.',
                data: null
            });
        }

        const commentId = await commentModel.createComment(
            id,
            user_id,
            content.trim()
        );

        res.status(201).json({
            code: 201,
            message: '댓글 작성 성공',
            data: {
                comment_id: commentId
            }
        });

    } catch (error) {
        console.error('댓글 작성 오류:', error);

        res.status(500).json({
            code: 500,
            message: '댓글 작성 실패',
            data: null
        });
    }
};

// 댓글 삭제
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                code: 400,
                message: '작성자 정보가 필요합니다.',
                data: null
            });
        }

        const result = await commentModel.deleteComment(commentId, user_id);

        if (result === 0) {
            return res.status(404).json({
                code: 404,
                message: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.',
                data: null
            });
        }

        res.status(200).json({
            code: 200,
            message: '댓글 삭제 성공',
            data: null
        });

    } catch (error) {
        console.error('댓글 삭제 오류:', error);

        res.status(500).json({
            code: 500,
            message: '댓글 삭제 실패',
            data: null
        });
    }
};

module.exports = {
    getComments,
    createComment,
    deleteComment
};
