const axios = require('axios');
const FormData = require('form-data');

const PYTHON_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

const listDocuments = async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/documents`, {
      headers: { 'X-User-ID': req.user._id.toString() }
    });
    res.json(response.data);
  } catch (error) {
    console.error('RAG Proxy Error - List:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Failed to communicate with RAG service' });
  }
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(`${PYTHON_SERVICE_URL}/upload`, form, {
      headers: { 
        ...form.getHeaders(),
        'X-User-ID': req.user._id.toString()
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('RAG Proxy Error - Upload:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Failed to upload document to RAG service' });
  }
};

const queryDocument = async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/query`, req.body, {
      headers: { 
        'Content-Type': 'application/json',
        'X-User-ID': req.user._id.toString()
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('RAG Proxy Error - Query:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Failed to query RAG service' });
  }
};

const clearHistory = async (req, res) => {
  try {
    const response = await axios.delete(`${PYTHON_SERVICE_URL}/history`, {
      headers: { 'X-User-ID': req.user._id.toString() }
    });
    res.json(response.data);
  } catch (error) {
    console.error('RAG Proxy Error - Clear History:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Failed to clear RAG memory' });
  }
};

module.exports = {
  listDocuments,
  uploadDocument,
  queryDocument,
  clearHistory
};
