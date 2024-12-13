const THREE = window.THREE;
const GLTFLoader = window.GLTFLoader;
const OrbitControls = window.OrbitControls;

class ChatAssistant {
    constructor() {
        // Ждем загрузки Three.js и модулей
        if (!window.THREE || !window.GLTFLoader || !window.OrbitControls) {
            console.error('Three.js или модули не загружены');
            return;
        }

        this.initScene();
        this.initDOM();
        this.speechBubble = document.getElementById('speech-bubble');
        
        // Инициализируем персонажа и после этого покажем приветствие
        this.initCharacter().then(() => {
            this.showGreeting();
        });

        this.idleStates = ['idle', 'ninjaIdle'];
        this.lastIdleChange = Date.now();
        this.idleChangeInterval = 10000;
        this.allowRandomAnimations = true;
    }

    initScene() {
        // Создаем сцену
        this.scene = new THREE.Scene();
        
        // Добавляем освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 10);
        this.scene.add(directionalLight);
        
        // Настраиваем камеру
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1, 0);

        // Настраиваем рендерер
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        
        // Добавляем рендерер в DOM
        document.getElementById('model-container').appendChild(this.renderer.domElement);

        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initDOM() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatForm = document.getElementById('chat-form');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendButton = document.getElementById('chat-send');
        this.chatResetButton = document.getElementById('chat-reset');

        this.initEventListeners();
    }

    initEventListeners() {
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        this.chatResetButton.addEventListener('click', () => {
            this.resetChat();
        });
    }

    async sendMessage() {
        const userMessage = this.chatInput.value.trim();
        if (!userMessage) return;

        // Отключаем случайные анимации на время общения
        this.allowRandomAnimations = false;

        // Выбираем анимацию на основе сообщения пользователя
        const animation = this.chooseAnimationByText(userMessage);
        this.playAnimation(animation);

        // Добавление сообщения пользователя
        const userMessageElement = document.createElement('div');
        userMessageElement.classList.add('message', 'user-message');
        userMessageElement.textContent = userMessage;
        this.chatMessages.appendChild(userMessageElement);

        // Показываем индикатор загрузки
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'assistant-message', 'loading');
        loadingElement.textContent = 'Думаю...';
        this.chatMessages.appendChild(loadingElement);

        this.chatInput.value = '';

        try {
            const response = await fetch('/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Удаляем индикатор загрузки
            loadingElement.remove();

            // Добавление ответа ассистента
            const assistantMessageElement = document.createElement('div');
            assistantMessageElement.classList.add('message', 'assistant-message');
            assistantMessageElement.textContent = data.response;
            this.chatMessages.appendChild(assistantMessageElement);

            // Случайная реакция на ответ
            const reactions = [
                () => this.playAnimation('talk', { duration: 0.5 }),
                () => {
                    this.playAnimation('wave', { duration: 1.0, loop: false });
                    setTimeout(() => this.playAnimation('talk'), 1000);
                },
                () => {
                    this.playAnimation('dance', { duration: 2.0, loop: false });
                    setTimeout(() => this.playAnimation('talk'), 2000);
                }
            ];

            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            randomReaction();

            // Возвращаемся к случайной idle анимации и включаем случайные анимации
            setTimeout(() => {
                const randomIdle = this.idleStates[Math.floor(Math.random() * this.idleStates.length)];
                this.playAnimation(randomIdle);
                this.allowRandomAnimations = true;
            }, 3000);

            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        } catch (error) {
            console.error('Ошибка:', error);
            loadingElement.textContent = 'Произошла ошибка при получении ответа';
            loadingElement.classList.add('error');
            this.playAnimation('idle');
            this.allowRandomAnimations = true;
        }
    }

    getAnimationCommands() {
        const commands = {
            'dance': ['танцуй', 'потанцуй', 'станцуй'],
            'sitTalk': ['сядь', 'присядь', 'сесть'],
            'phoneCall': ['позвони', 'телефон', 'звонок'],
            'wave': ['помаши', 'поприветствуй', 'попрощайся'],
            'walk': ['иди', 'пройдись', 'походи'],
            'layIdle': ['ляг', 'отдохни', 'расслабься'],
            'ninjaIdle': ['покажи ниндзя', 'стань ниндзя'],
            'zombieStand': ['зомби', 'стань зомби']
        };
        return commands;
    }

    chooseAnimationByText(text) {
        text = text.toLowerCase();
        
        // Команды для анимаций
        const animations = this.getAnimationCommands();

        // Проверяем наличие команд в тексте
        for (const [animation, commands] of Object.entries(animations)) {
            if (commands.some(cmd => text.includes(cmd))) {
                return animation;
            }
        }

        // По умолчанию используем talk
        return 'talk';
    }

    resetChat() {
        this.chatMessages.innerHTML = '';
        this.chatInput.value = '';
        
        // Показываем приветствие при сбросе
        this.showGreeting();
    }

    init() {
        // Приветственная анимация при запуске
        if (this.animationManager) {
            this.animationManager.playGreetingAnimation();
            setTimeout(() => {
                this.animationManager.playIdleAnimation();
            }, 2000);
        }
    }

    initCharacterSelect() {
        const ybotBtn = document.getElementById('select-ybot');
        const xbotBtn = document.getElementById('select-xbot');

        ybotBtn.addEventListener('click', () => this.switchCharacter('ybot'));
        xbotBtn.addEventListener('click', () => this.switchCharacter('xbot'));

        // По умолчанию загружаем YBot
        this.switchCharacter('ybot');
    }

    async switchCharacter(characterId) {
        if (this.currentCharacter === characterId) return;

        // Удаляем текущую модель если есть
        if (this.model) {
            this.scene.remove(this.model);
        }

        // Обновляем кнопки
        document.querySelectorAll('.character-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`select-${characterId}`).classList.add('active');

        // Загружаем новую модель
        await this.loadModel(this.characters[characterId].url);
        this.currentCharacter = characterId;
    }

    async initCharacter() {
        const loader = new GLTFLoader();
        
        try {
            const modelPath = '/static/models/xbot/xbot.glb';
            const gltf = await loader.loadAsync(modelPath);
            
            this.model = gltf.scene;
            this.mixer = new THREE.AnimationMixer(this.model);
            
            // Настройка модели
            this.model.scale.set(1, 1, 1);
            this.model.position.set(0, -1, 0);
            this.scene.add(this.model);

            // Загружаем отдельные анимации
            this.animations = {};
            const animationFiles = {
                'idle': '/static/models/xbot/animations/idle.glb',
                'talk': '/static/models/xbot/animations/talk.glb',
                'wave': '/static/models/xbot/animations/Wave.glb',
                'walk': '/static/models/xbot/animations/walking.glb',
                'dance': '/static/models/xbot/animations/hip hop dancing.glb',
                'sitTalk': '/static/models/xbot/animations/sitting talking.glb',
                'phoneCall': '/static/models/xbot/animations/talking on phone.glb',
                'layIdle': '/static/models/xbot/animations/laying idle.glb',
                'ninjaIdle': '/static/models/xbot/animations/ninja idle.glb',
                'zombieStand': '/static/models/xbot/animations/zombie stand up.glb'
            };

            // Загружаем все анимации
            for (const [name, path] of Object.entries(animationFiles)) {
                try {
                    const animationGltf = await loader.loadAsync(path);
                    if (animationGltf.animations && animationGltf.animations.length > 0) {
                        this.animations[name] = this.mixer.clipAction(animationGltf.animations[0]);
                    }
                } catch (error) {
                    // Тихая обработка ошибок загрузки анимаций
                }
            }

            // Запускаем анимационный цикл
            this.animate();

        } catch (error) {
            // Тихая обработка ошибок
        }
    }

    playAnimation(name, options = {}) {
        const { duration = 0.5, loop = true } = options;
        
        if (!this.animations || !this.animations[name]) {
            console.warn(`Анимация ${name} не найдена`);
            return;
        }
        
        try {
            const nextAction = this.animations[name];
            
            if (this.currentAction && this.currentAction !== nextAction) {
                // Плавный переход между анимациями
                nextAction.reset();
                nextAction.setEffectiveTimeScale(1);
                nextAction.setEffectiveWeight(1);
                nextAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
                nextAction.crossFadeFrom(this.currentAction, duration, true);
                nextAction.play();

                // Если анимация одноразовая, добавляем обработчик окончания
                if (!loop) {
                    nextAction.clampWhenFinished = true;
                }
            } else {
                nextAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
                nextAction.play();
            }
            
            this.currentAction = nextAction;
        } catch (error) {
            console.error(`Ошибка при воспроизведении анимации ${name}:`, error);
        }
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        
        const delta = 0.016; // ~60fps
        
        if (this.mixer) {
            this.mixer.update(delta);
            // Обновляем случайные движения
            this.updateIdleAnimation();
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    playDance() {
        this.playAnimation('dance', { duration: 0.8 });
    }

    playSitTalk() {
        this.playAnimation('sitTalk', { duration: 0.5 });
    }

    playPhoneCall() {
        this.playAnimation('phoneCall', { duration: 0.5 });
    }

    showGreeting() {
        // Отключаем случайные анимации на время приветствия
        this.allowRandomAnimations = false;

        if (!this.animations.wave) {
            console.warn('Wave анимация недоступна');
            return;
        }

        // Показываем приветственную анимацию
        this.playAnimation('wave', { 
            duration: 0.5,
            loop: false
        });

        // Позиционируем пузырь над головой
        const headPosition = this.getHeadPosition();
        if (headPosition) {
            this.speechBubble.style.top = `${headPosition.y}px`;
        }

        // Показываем речевой пузырь с приветствием
        const greetings = [
            "Привет! Я твой виртуальный помощник!",
            "Здравствуй! Рад тебя видеть!",
            "Приветствую! Чем могу помочь?",
            "Привет! Напиши 'что ты умеешь', чтобы узнать мои возможности!"
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        this.speechBubble.textContent = greeting;
        this.speechBubble.classList.add('show');

        // Включаем случайные анимации после приветствия
        setTimeout(() => {
            this.speechBubble.classList.remove('show');
            this.playAnimation('idle', { duration: 0.5 });
            this.allowRandomAnimations = true;
        }, 3000);
    }

    // Добавим метод для определения позиции головы
    getHeadPosition() {
        if (!this.model) return null;

        // Ищем кость головы в модели
        let headBone;
        this.model.traverse((node) => {
            if (node.isBone && node.name.toLowerCase().includes('head')) {
                headBone = node;
            }
        });

        if (headBone) {
            // Получаем позицию в мировых координатах
            const position = new THREE.Vector3();
            headBone.getWorldPosition(position);

            // Преобразуем в экранные координаты
            const screenPosition = position.project(this.camera);
            
            return {
                x: (screenPosition.x * 0.5 + 0.5) * window.innerWidth,
                y: (-screenPosition.y * 0.5 + 0.5) * window.innerHeight
            };
        }

        // Если кость головы не найдена, возвращаем примерную позицию
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.3 // Примерно над моделью
        };
    }

    // Добавляем метод для случайных движений в режиме ожидания
    updateIdleAnimation() {
        // Проверяем флаг перед выполнением случайных анимаций
        if (!this.allowRandomAnimations) return;

        const now = Date.now();
        if (now - this.lastIdleChange > this.idleChangeInterval) {
            // Случайно выбираем новую idle анимацию
            const randomIdle = this.idleStates[Math.floor(Math.random() * this.idleStates.length)];
            
            // Иногда добавляем специальные действия
            const chance = Math.random();
            if (chance > 0.8) {
                // 20% шанс помахать
                this.playAnimation('wave', { duration: 1.0, loop: false });
                setTimeout(() => this.playAnimation(randomIdle), 2000);
            } else if (chance > 0.6) {
                // 20% шанс потанцевать
                this.playAnimation('dance', { duration: 1.0, loop: false });
                setTimeout(() => this.playAnimation(randomIdle), 3000);
            } else {
                // 60% шанс просто сменить idle анимацию
                this.playAnimation(randomIdle);
            }
            
            this.lastIdleChange = now;
            this.idleChangeInterval = 5000 + Math.random() * 10000; // 5-15 секунд
        }
    }
}

// Инициализация при загрузке страницы и после загрузки модулей
function initApp() {
    if (window.THREE && window.GLTFLoader && window.OrbitControls) {
        const chat = new ChatAssistant();
    } else {
        setTimeout(initApp, 100); // Проверяем каждые 100мс
    }
}

document.addEventListener('DOMContentLoaded', initApp);

export { ChatAssistant };
