
const express = require('express');
const router = express.Router();

const commentController = require('../controllers/commentController');

// 댓글 목록 조회
router.get('/:id/comments', commentController.getComments);

// 댓글 작성
router.post('/:id/comments', commentController.createComment);

// 댓글 삭제
router.delete('/comments/:commentId', commentController.deleteComment);

module.exports = router;
