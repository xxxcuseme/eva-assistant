document.addEventListener('DOMContentLoaded', () => {
    const themeMenuToggle = document.querySelector('.theme-menu-toggle');
    const gemIcon = themeMenuToggle.querySelector('.gem-icon');
    const moonIcon = themeMenuToggle.querySelector('.moon-icon');
    
    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
            themeMenuToggle.classList.add('dark');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            themeMenuToggle.classList.remove('dark');
        }
        
        localStorage.setItem('site-theme', theme);
    }

    // Восстанавливаем тему из localStorage
    const savedTheme = localStorage.getItem('site-theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Проверяем системную тему по умолчанию
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        setTheme(prefersDarkScheme.matches ? 'dark' : 'light');
    }

    // Обработчик клика на переключение темы
    themeMenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        setTheme(currentTheme);
    });

    // Поддержка системной темы
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDarkScheme.addListener((e) => {
        if (!localStorage.getItem('site-theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
});
