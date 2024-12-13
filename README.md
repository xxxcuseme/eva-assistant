# AI Assistant with 3D Animations

Интерактивный 3D-ассистент с поддержкой анимаций и AI чата.

## Особенности
- 3D модель с анимациями (Three.js)
- AI чат с использованием Mistral-7B
- Интерактивные действия и жесты
- Оптимизированная производительность

## Установка
```bash
# Клонируйте репозиторий
git clone https://github.com/your-username/ai-assistant.git
cd ai-assistant

# Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt

# Установите Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Загрузите модель
ollama pull mistral:7b
```

## Запуск
```bash
python run.py
```

## Использование
- Откройте http://localhost:5000
- Начните диалог с ассистентом
- Используйте команды для анимаций:
  - танцуй
  - помаши
  - сядь
  - и другие
