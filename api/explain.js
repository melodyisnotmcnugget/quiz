export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  // ------- 解析 JSON Body (Node Runtime) -------
  let prompt = '';
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    prompt = JSON.parse(raw || '{}').prompt || '';
  } catch (e) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  if (!prompt) {
    return res.status(400).json({ error: 'Need prompt' });
  }
  // ---------------------------------------------

  const apiKey = process.env.DEEPSEEK_API_KEY;

  try {
    const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是刷题讲解老师，回答200字以内。' },
          { role: 'user',   content: prompt }
        ]
      })
    });

  const j = await r.json();

  // DEBUG：把 DeepSeek 全部响应带回前端
  if (!j.choices || !j.choices[0] || !j.choices[0].message) {
    return res.status(200).json({ explanation: 'DeepSeek error: ' + JSON.stringify(j) });
  }

  res.status(200).json({
    explanation: j.choices[0].message.content
  });
