export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Only POST'});

  const { prompt } = await req.json();
  if (!prompt) return res.status(400).json({error:'Need prompt'});

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${apiKey}`
    },
    body:JSON.stringify({
      model:'deepseek-chat',
      messages:[
        { role:'system', content:'你是靠谱的刷题解析老师，答案+简短原因，200字以内。' },
        { role:'user', content:prompt }
      ]
    })
  });

  const json = await resp.json();
  const text = json?.choices?.[0]?.message?.content || '解析失败';
  res.status(200).json({explanation:text});
}

