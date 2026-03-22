const express = require('express');
const router = express.Router();
const { analyzeText, getAnalysisHistory } = require('../controllers/analyzeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, analyzeText);
router.get('/history', protect, getAnalysisHistory);

module.exports = router;
