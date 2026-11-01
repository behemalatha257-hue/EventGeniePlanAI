/**
 * EventGeniePlan AI - System Health & Diagnostics Routes
 */

const express = require('express');
const router = express.Router();
require('dotenv').config();

const startTime = Date.now();

router.get('/', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey !== 'your_gemini_api_key_here');

  res.json({
    status: 'online',
    appName: 'EventGeniePlan AI',
    version: '1.0.0',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    aiEngine: {
      provider: 'Google Gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      isKeyConfigured,
      keyMask: isKeyConfigured ? `${apiKey.substring(0, 8)}...` : 'UNSET'
    }
  });
});

module.exports = router;
