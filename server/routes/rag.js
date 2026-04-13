const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadDocument, queryDocument, listDocuments, clearHistory } = require('../controllers/ragController');

const upload = multer({ memoryStorage: multer.memoryStorage() });

router.get('/documents', protect, listDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.post('/query', protect, queryDocument);
router.delete('/history', protect, clearHistory);

module.exports = router;
