from flask import Blueprint, request, jsonify, render_template
import ollama
import logging
import time
from datetime import datetime
import os
import psutil
try:
    import GPUtil
    GPU_AVAILABLE = True
except ImportError:
    GPU_AVAILABLE = False
import traceback  # Добавляем для подробного стектрейса
import logging.handlers  # Добавляем handlers
from functools import lru_cache

# Создаем директорию для логов если её нет
log_dir = 'logs'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Полный путь к файлу логов
log_file = os.path.join(log_dir, 'app.log')

# Создаем форматтер для логов
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# Создаем файловый обработчик
file_handler = logging.FileHandler(log_file, encoding='utf-8')
file_handler.setFormatter(formatter)

# Создаем консольный обработчик
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)

# Настраиваем корневой логгер
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Удаляем стандартные обработчики
for handler in logger.handlers[:]:
    logger.removeHandler(handler)

# Добавляем наши обработчики
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Проверяем создание файла и запись
logger.info('=== Запуск приложения ===')
logger.info(f'Логирование настроено. Путь к файлу логов: {log_file}')

try:
    with open(log_file, 'a') as f:
        f.write('Тестовая запись в лог\n')
    logger.info('Тест записи в файл успешен')
except Exception as e:
    logger.error(f'Ошибка при записи в файл: {e}')
    print(f'Ошибка при записи в файл: {e}')

chat_bp = Blueprint('chat', __name__)

# Определяем системный промпт глобально
SYSTEM_PROMPT = "Ты Eva - дружелюбный AI-ассистент. Используй эмодзи. Отвечай кратко."

def get_system_stats():
    stats = {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'cpu': {
            'percent': psutil.cpu_percent(interval=1),
            'freq_mhz': psutil.cpu_freq().current if psutil.cpu_freq() else 'N/A',
            'cores_total': psutil.cpu_count(),
            'cores_physical': psutil.cpu_count(logical=False)
        },
        'memory': {
            'total_gb': round(psutil.virtual_memory().total / (1024**3), 2),
            'used_gb': round(psutil.virtual_memory().used / (1024**3), 2),
            'percent': psutil.virtual_memory().percent
        },
        'process': {
            'cpu_percent': psutil.Process().cpu_percent(),
            'memory_percent': psutil.Process().memory_percent(),
            'threads': len(psutil.Process().threads())
        }
    }
    
    # GPU статистика
    if GPU_AVAILABLE:
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]
                stats['gpu'] = {
                    'name': gpu.name,
                    'load_percent': round(gpu.load * 100, 2),
                    'memory_total_mb': gpu.memoryTotal,
                    'memory_used_mb': gpu.memoryUsed,
                    'temperature_c': gpu.temperature
                }
        except Exception as e:
            stats['gpu'] = f'Error getting GPU stats: {str(e)}'
    
    return stats

def format_stats(stats):
    """Форматиру��т статистику для вывода в лог"""
    return f"""=== Системная статистика ===
CPU:
    Загрузка: {stats['cpu']['percent']}%
    Частота: {stats['cpu']['freq_mhz']} MHz
    Ядра: {stats['cpu']['cores_physical']} физических / {stats['cpu']['cores_total']} логических

Память:
    Всего: {stats['memory']['total_gb']:.1f} GB
    Использовано: {stats['memory']['used_gb']:.1f} GB ({stats['memory']['percent']}%)

Процесс:
    CPU: {stats['process']['cpu_percent']}%
    RAM: {stats['process']['memory_percent']:.1f}%
    Потоки: {stats['process']['threads']}

GPU: {stats['gpu'] if 'gpu' in stats else 'Не доступен'}"""

# Кэш для ответов
@lru_cache(maxsize=100)
def get_cached_response(message, temperature):
    """Кэширует ответы для одинаковых сообщений"""
    return ollama.chat(
        model='mistral:7b',
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ],
        stream=False,
        options={
            "temperature": temperature,
            "top_p": 0.9,
            "max_tokens": 100,
            "num_ctx": 256,
            "num_gpu": 1,
            "num_thread": 16,
            "repeat_penalty": 1.1,
            "stop": ["Human:", "Assistant:"],
            "num_batch": 2048,
            "f16_kv": True,
            "rope_frequency_base": 10000,
            "rope_frequency_scale": 0.5,
            "low_vram": True,
            "cache_mode": "always",
            "seed": 42,
            "num_predict": 100
        }
    )

@chat_bp.route('/')
def chat_page():
    return render_template('ai_assistant.html')

@chat_bp.route('/message', methods=['POST'])
def chat():
    try:
        # Проверяем входящие данные
        data = request.json
        if not data:
            logger.error("Пустой запрос")
            return jsonify({"error": "Пустой запрос"}), 400

        user_message = data.get('message', '')
        if not user_message:
            logger.error("Сообщение отсутствует")
            return jsonify({"error": "Сообщение отсутствует"}), 400

        logger.info(f"Получено сообщение: {user_message}")
        start_time = time.time()

        # Собираем статистику
        try:
            start_stats = get_system_stats()
            stats_text = format_stats(start_stats)
            logger.info("Начало генерации")
            logger.info(stats_text)
        except Exception as stats_error:
            logger.error(f"Ошибка сбора статистики: {stats_error}")
            logger.error(traceback.format_exc())
            start_stats = {"error": "Не удалось получить статистику"}

        # Быстрые ответы
        if user_message.lower() in ['привет', 'здравствуй', 'здравствуйте', 'hi', 'hello']:
            greeting = "Привет! Я Eva - твой виртуальный помощник! 🌟 Рада тебя видеть!"
            return jsonify({"response": greeting})

        # Генерация ответа
        try:
            # Используем кэш для частых вопросов
            response = get_cached_response(user_message, temperature=0.7)
            ai_message = response['message']['content'].strip()
            logger.info(f"Получен ответ от модели: {ai_message}")
            
            # Логируем попадание в кэш
            if hasattr(get_cached_response, 'cache_info'):
                logger.info(f"Статистика кэша: {get_cached_response.cache_info()}")

        except Exception as model_error:
            logger.error(f"Ошибка генерации ответа: {model_error}")
            logger.error(traceback.format_exc())
            return jsonify({"error": "Ошибка генерации ответа"}), 500

        # Собираем финальную статистику
        generation_time = time.time() - start_time
        try:
            end_stats = get_system_stats()
            stats_text = format_stats(end_stats)
            logger.info(f"Генерация завершена за {generation_time:.2f} сек")
            logger.info(stats_text)
        except Exception as stats_error:
            logger.error(f"Ошибка финальной статистики: {stats_error}")
            logger.error(traceback.format_exc())
            end_stats = {"error": "Не удалось получить статистику"}

        return jsonify({
            "response": ai_message,
            "stats": {
                "generation_time": generation_time,
                "system_stats": end_stats
            }
        })

    except Exception as e:
        logger.error(f"Критическая ошибка: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "error": "Внутренняя ошибка сервера", 
            "details": str(e)
        }), 500

@chat_bp.route('/reset', methods=['POST'])
def reset_chat():
    logger.info("Сброс истории чата")
    global chat_history
    chat_history = []
    return jsonify({"status": "Chat reset successfully"})
