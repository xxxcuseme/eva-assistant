import os

# Структура директорий и файлов
structure = {
    'app': {
        'static': {
            'js': [
                'chat.js',
                'three-imports.js'
            ],
            'css': [
                'chat.css'
            ],
            'demon': {
                'model': [
                    'demon.glb'
                ],
                'core': [
                    'animator.js',
                    'bone-helper.js'
                ],
                'animations': [
                    'idle.js',
                    'walk.js',
                    'talk.js',
                    'wave.js'
                ]
            }
        },
        'templates': [
            'base.html',
            'ai_assistant.html'
        ]
    }
}

def create_structure(base_path, struct):
    for name, content in struct.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        elif isinstance(content, list):
            os.makedirs(base_path, exist_ok=True)
            for file in content:
                file_path = os.path.join(base_path, file)
                if not os.path.exists(file_path):
                    with open(file_path, 'a') as f:
                        pass
                print(f"Checked file: {file_path}")

# Создаем структуру
create_structure('.', structure)

# Выводим структуру для проверки
def print_structure(base_path, prefix=''):
    for item in os.listdir(base_path):
        path = os.path.join(base_path, item)
        if os.path.isdir(path):
            print(f"{prefix}📁 {item}/")
            print_structure(path, prefix + '  ')
        else:
            print(f"{prefix}📄 {item}")

print("\nProject structure:")
print_structure('./app')