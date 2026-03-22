const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  inputText: {
    type: String,
    required: true
  },
  aiResponse: {
    type: Object,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Analysis', analysisSchema);
