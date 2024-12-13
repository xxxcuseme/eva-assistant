const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const CONFIG = {
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  OLLAMA_KEY: process.env.OLLAMA_SSH_KEY,
  MODEL: 'mistral:7b',
  SYSTEM_PROMPT: "Ты Eva - дружелюбный AI-ассистент. Используй эмодзи. Отвечай кратко."
};

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    const response = await fetch(`${CONFIG.OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONFIG.OLLAMA_KEY && { 'Authorization': `Bearer ${CONFIG.OLLAMA_KEY}` })
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          { role: "system", content: CONFIG.SYSTEM_PROMPT },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: data.message?.content || data.response,
        model: CONFIG.MODEL,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
