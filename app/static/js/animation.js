class DemonAnimationManager {
    constructor(customSelector = null) {
        // Отложенная инициализация элемента
        this.demonHead = null;
        this.autoHeadMovementInterval = null;
        this.customSelector = customSelector;
        
        // Используем MutationObserver с самого начала
        this.initDemonHeadObserver();
        
        // Добавляем резервный метод с задержкой
        this.initDemonHeadWithDelay();
        
        // Отладочная информация
        console.log('DemonAnimationManager создан');
        console.trace('Трассировка создания менеджера анимации');
    }

    // Инициализация элемента демона с помощью MutationObserver
    initDemonHeadObserver() {
        console.log('Инициализация MutationObserver для demon-head');
        
        const findDemonHead = () => {
            // Если передан кастомный селектор, используем его в первую очередь
            if (this.customSelector) {
                let customHead = document.querySelector(this.customSelector);
                if (customHead) {
                    console.log('Элемент найден по кастомному селектору:', this.customSelector);
                    return customHead;
                }
            }
            
            // Метод 1: прямой поиск по ID
            let head = document.getElementById('demon-head');
            console.log('Поиск по ID:', head ? 'Найден' : 'Не найден');
            
            // Метод 2: поиск по классу, если ID не найден
            if (!head) {
                head = document.querySelector('.demon-head');
                console.log('Поиск по классу:', head ? 'Найден' : 'Не найден');
            }
            
            // Метод 3: поиск в контейнере чата
            if (!head) {
                const chatContainer = document.querySelector('.container');
                if (chatContainer) {
                    head = chatContainer.querySelector('#demon-head');
                    console.log('Поиск в контейнере чата:', head ? 'Найден' : 'Не найден');
                }
            }

            // Метод 4: поиск в любом месте документа
            if (!head) {
                head = document.querySelector('#demon-head, .demon-head');
                console.log('Глобальный поиск:', head ? 'Найден' : 'Не найден');
            }

            return head;
        };

        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    this.demonHead = findDemonHead();
                    if (this.demonHead) {
                        console.log('Элемент demon-head найден через MutationObserver');
                        observer.disconnect();
                        this.setupDemonHeadAnimations();
                        break;
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Резервный метод инициализации с задержкой
    initDemonHeadWithDelay() {
        setTimeout(() => {
            if (!this.demonHead) {
                console.log('Попытка найти demon-head с задержкой');
                
                // Если передан кастомный селектор, используем его в первую очередь
                if (this.customSelector) {
                    this.demonHead = document.querySelector(this.customSelector);
                    if (this.demonHead) {
                        console.log('Элемент найден по кастомному селектору с задержкой');
                        this.setupDemonHeadAnimations();
                        return;
                    }
                }
                
                // Стандартные методы поиска
                this.demonHead = document.getElementById('demon-head') || 
                                 document.querySelector('.demon-head') || 
                                 document.querySelector('.container #demon-head') ||
                                 document.querySelector('#demon-head, .demon-head');
                
                if (this.demonHead) {
                    console.log('Элемент demon-head найден с задержкой');
                    this.setupDemonHeadAnimations();
                } else {
                    console.warn('Элемент demon-head не найден даже после задержки');
                }
            }
        }, 2000);  // Увеличил задержку до 2 секунд
    }

    // Настройка анимаций головы демона
    setupDemonHeadAnimations() {
        if (!this.demonHead) return;
        
        console.log('Настройка анимаций для demon-head');
        
        // Можно добавить начальную анимацию или другие настройки
        this.blinkEyes();
    }

    // Встряхивание головы демона
    shakeHead() {
        if (!this.demonHead) {
            console.warn('Элемент demon-head не найден при вызове shakeHead');
            this.initDemonHeadObserver();
            this.initDemonHeadWithDelay();
            return;
        }
        
        this.demonHead.classList.add('shake-animation');
        setTimeout(() => {
            this.demonHead.classList.remove('shake-animation');
        }, 500);
    }

    // Глаза демона мигают
    blinkEyes() {
        if (!this.demonHead) {
            console.warn('Элемент demon-head не найден при вызове blinkEyes');
            this.initDemonHeadObserver();
            this.initDemonHeadWithDelay();
            return;
        }
        
        this.demonHead.classList.add('blink-animation');
        setTimeout(() => {
            this.demonHead.classList.remove('blink-animation');
        }, 200);
    }

    // Автоматическое движение головы
    startAutoHeadMovement() {
        if (!this.demonHead) {
            console.warn('Элемент demon-head не найден при вызове startAutoHeadMovement');
            this.initDemonHeadObserver();
            this.initDemonHeadWithDelay();
            return;
        }
        
        if (this.autoHeadMovementInterval) return;

        this.autoHeadMovementInterval = setInterval(() => {
            const randomX = Math.random() * 10 - 5; // От -5 до 5 градусов
            const randomY = Math.random() * 10 - 5;
            
            this.demonHead.style.transform = `rotateX(${randomY}deg) rotateY(${randomX}deg)`;
        }, 1000);
    }

    // Остановка автоматического движения головы
    stopAutoHeadMovement() {
        if (!this.demonHead) {
            console.warn('Элемент demon-head не найден при вызове stopAutoHeadMovement');
            this.initDemonHeadObserver();
            this.initDemonHeadWithDelay();
            return;
        }
        
        if (this.autoHeadMovementInterval) {
            clearInterval(this.autoHeadMovementInterval);
            this.autoHeadMovementInterval = null;
            this.demonHead.style.transform = 'none';
        }
    }

    // Анимация злости
    angryAnimation() {
        if (!this.demonHead) {
            console.warn('Элемент demon-head не найден при вызове angryAnimation');
            this.initDemonHeadObserver();
            this.initDemonHeadWithDelay();
            return;
        }
        
        this.demonHead.classList.add('angry-animation');
        setTimeout(() => {
            this.demonHead.classList.remove('angry-animation');
        }, 1000);
    }

    // Анимация удивления
    surpriseAnimation() {
        if (!this.demonHead) {
            console.warn('Элемент demon-head не найден при вызове surpriseAnimation');
            this.initDemonHeadObserver();
            this.initDemonHeadWithDelay();
            return;
        }
        
        this.demonHead.classList.add('surprise-animation');
        setTimeout(() => {
            this.demonHead.classList.remove('surprise-animation');
        }, 800);
    }
}

export { DemonAnimationManager };
