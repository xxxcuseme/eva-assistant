const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Конфигурация
const CONFIG = {
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  OLLAMA_KEY: process.env.OLLAMA_SSH_KEY,
  MODEL: 'mistral:7b',
  SYSTEM_PROMPT: "Ты Eva - дружелюбный AI-ассистент. Используй эмодзи. Отвечай кратко."
};

exports.handler = async function(event, context) {
  // Проверка метода
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // CORS заголовки
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Обработка OPTIONS запроса
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Парсинг входящего сообщения
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Запрос к Ollama
    const response = await fetch(`${CONFIG.OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONFIG.OLLAMA_KEY && { 'Authorization': `Bearer ${CONFIG.OLLAMA_KEY}` })
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          {
            role: "system",
            content: CONFIG.SYSTEM_PROMPT
          },
          {
            role: "user",
            content: message
          }
        ],
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 150
        }
      })
    });

    // Проверка ответа
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();

    // Форматирование ответа
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

    // Возвращаем ошибку
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 