from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/about')
def about():
    return render_template('base.html')

@main_bp.route('/portfolio')
def portfolio():
    return render_template('base.html')

@main_bp.route('/contact')
def contact():
    return render_template('base.html')

@main_bp.route('/ai-assistant')
def ai_assistant():
    return render_template('ai_assistant.html')