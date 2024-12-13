class ThemeSwitcher {
    constructor() {
        this.themeToggle = null;
        this.currentTheme = 'light';
        this.initTheme();
    }

    initTheme() {
        // Проверяем localStorage при загрузке
        const savedTheme = localStorage.getItem('site-theme');
        this.currentTheme = savedTheme || 'light';
        
        // Применяем тему сразу
        this.applyTheme();
        
        // this.createThemeToggle();
    }

    applyTheme() {
        if (this.currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        }
    }

    updateToggleIcon() {
        // Этот метод больше не нужен
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // Применяем тему
        this.applyTheme();
        
        // Обновляем иконку в существующей кнопке навигации
        const themeToggleContainer = document.querySelector('.theme-menu-toggle');
        if (themeToggleContainer) {
            const moonIcon = themeToggleContainer.querySelector('.moon-icon');
            const gemIcon = themeToggleContainer.querySelector('.gem-icon');
            
            if (moonIcon && gemIcon) {
                moonIcon.classList.toggle('active', this.currentTheme === 'dark');
                gemIcon.classList.toggle('active', this.currentTheme === 'light');
            }
        }
        
        // Сохраняем тему
        localStorage.setItem('site-theme', this.currentTheme);
    }
}

// Инициализируем при загрузке
document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
});
