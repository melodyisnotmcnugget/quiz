const https = require('https');   // 用内置 https 发请求，避免 node-fetch ESM 问题

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  // 解析 JSON Body（适配 Vercel Node 运行时）
  let prompt = '';
  try {
    const raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => (data += chunk));
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
    prompt = JSON.parse(raw || '{}').prompt || '';
  } catch (e) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  if (!prompt) return res.status(400).json({ error: 'Need prompt' });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const payload = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是刷题讲解老师，回答200字以内。' },
      { role: 'user', content: prompt }
    ]
  });

  const options = {
    hostname: 'api.deepseek.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      Authorization: `Bearer ${apiKey}`
    }
  };

  try {
    const responseData = await new Promise((resolve, reject) => {
      const reqHttps = https.request(options, resHttps => {
        let data = '';
        resHttps.on('data', chunk => (data += chunk));
        resHttps.on('end', () => resolve(data));
      });
      reqHttps.on('error', reject);
      reqHttps.write(payload);
      reqHttps.end();
    });

    const j = JSON.parse(responseData || '{}');
    const txt =
      j?.choices?.[0]?.message?.content ||
      '解析失败：' + (j.error?.message || 'unknown');

    res.status(200).json({ explanation: txt });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'DeepSeek request failed', detail: err.toString() });
  }
};
