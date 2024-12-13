import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_message(message):
    """
    Обрабатывает входящее сообщение и возвращает ответ.
    
    Args:
        message (str): Входящее сообщение от пользователя
        
    Returns:
        str: Ответ на сообщение
    """
    try:
        logger.info(f"Получено сообщение: {message}")
        
        # Здесь будет логика обработки сообщения
        # Пока возвращаем заглушку
        response = "Я получил ваше сообщение: " + message
        
        logger.info(f"Отправлен ответ: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Ошибка при обработке сообщения: {str(e)}")
        raise