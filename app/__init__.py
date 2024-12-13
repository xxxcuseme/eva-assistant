from flask import Flask, render_template
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def create_app():
    logger.debug("Создание приложения Flask")
    app = Flask(__name__)
    
    # Конфигурация отладки
    app.config['DEBUG'] = True
    
    logger.debug("Регистрация blueprints")
    from .routes.chat import chat_bp
    from .routes.ai_assistant import ai_bp
    
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(ai_bp, url_prefix='/ai-assistant')
    
    @app.route('/')
    def index():
        return render_template('index.html')
    
    logger.debug("Приложение создано успешно")
    return app