const OpenAI = require('openai');
const Analysis = require('../models/Analysis');

// Initialize conditionally to prevent server crash on startup
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// @desc    Analyze text (resume or code)
// @route   POST /api/analyze
// @access  Private
const analyzeText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Please provide text to analyze' });
    }

    if (!openai) {
      return res.status(500).json({ message: 'OpenAI API key is missing or invalid. Please configure OPENAI_API_KEY in the environment variables.' });
    }

    const prompt = `You are an expert technical interviewer and hiring manager.
    The user has provided the following text, which is either a resume or a code snippet.
    Review this text practically and realistically, as if evaluating a candidate for a competitive role. Do not hold back constructive criticism.
    
    Output your analysis in strict JSON format. Do not include markdown blocks or any text outside the JSON object. 
    The JSON structure MUST be exactly:
    {
      "strengths": ["[Highlight key positive signals, robust architectures, or strong experiences]"],
      "weaknesses": ["[Identify missing critical skills, bad practices, or vague statements]"],
      "questions": ["[List exactly 5 realistic, probing interview questions based specifically on the text]"],
      "suggestions": ["[Provide actionable, specific advice for improving the text or the candidate's profile]"]
    }
    
    Text to analyze:
    ${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant designed to output strict JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const resultString = completion.choices[0].message.content;
    const jsonResult = JSON.parse(resultString);

    // Save to database
    await Analysis.create({
      user: req.user.id,
      inputText: text,
      aiResponse: jsonResult
    });

    res.status(200).json(jsonResult);
  } catch (error) {
    console.error('OpenAI Analysis Error:', error);
    res.status(500).json({ message: 'Failed to analyze text. Please try again later.' });
  }
};

// @desc    Get user past analyses
// @route   GET /api/analyze/history
// @access  Private
const getAnalysisHistory = async (req, res) => {
  try {
    const history = await Analysis.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error('History Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch analysis history' });
  }
};

module.exports = { analyzeText, getAnalysisHistory };
