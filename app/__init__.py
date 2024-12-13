from flask import Flask, render_template, send_from_directory
import logging
import os

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
    
    @app.route('/test')
    def test():
        return render_template('test.html')
    
    @app.route('/static/demon/model/<filename>')
    def serve_model(filename):
        model_dir = os.path.join(app.root_path, 'static', 'demon', 'model')
        if os.path.exists(os.path.join(model_dir, filename)):
            return send_from_directory(model_dir, filename)
        return f"File not found: {filename}", 404
    
    logger.debug("Приложение создано успешно")
    return app