class ParticleSystem {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { 
            alpha: true,
            desynchronized: true
        });

        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.canvas);

        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth * this.pixelRatio;
        this.height = window.innerHeight * this.pixelRatio;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastTime = 0;

        this.initParticles();
        this.setupEventListeners();
        this.animate();
    }

    isLightTheme() {
        return document.body.classList.contains('light-theme') || 
               (!document.body.classList.contains('dark-theme') && 
                window.matchMedia && 
                window.matchMedia('(prefers-color-scheme: light)').matches);
    }

    initParticles() {
        const text = "GEORGY GANAGA";
        const fontSize = 120 * this.pixelRatio;
        const fontFamily = "'Helvetica Neue', Arial, sans-serif";
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        
        tempCtx.font = `${fontSize}px ${fontFamily}`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillStyle = 'white';
        tempCtx.fillText(text, this.width / 2, this.height / 2);
        
        const imageData = tempCtx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        
        for (let y = 0; y < this.height; y += 2) {
            for (let x = 0; x < this.width; x += 2) {
                const index = (y * this.width + x) * 4;
                if (data[index + 3] > 128) {
                    this.particles.push(new Particle(x, y));
                }
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX * this.pixelRatio;
            this.mouseY = e.clientY * this.pixelRatio;
        });

        window.addEventListener('resize', () => {
            this.width = window.innerWidth * this.pixelRatio;
            this.height = window.innerHeight * this.pixelRatio;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.particles = [];
            this.initParticles();
        });

        // Добавляем обработчик смены темы
        const themeObserver = new MutationObserver(() => {
            this.updateParticleColor();
        });

        themeObserver.observe(document.body, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }

    updateParticleColor() {
        this.particleColor = this.isLightTheme() 
            ? 'rgba(0,0,0,0.9)' 
            : 'rgba(255,255,255,0.9)';
    }

    animate(time = 0) {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = time - this.lastTime;
        if (deltaTime < 16) return; // ~60 fps
        this.lastTime = time;

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Ленивая инициализация цвета
        if (!this.particleColor) {
            this.updateParticleColor();
        }

        for (const particle of this.particles) {
            particle.update(this.mouseX, this.mouseY);
            
            this.ctx.beginPath();
            this.ctx.fillStyle = this.particleColor;
            this.ctx.arc(
                particle.x, 
                particle.y, 
                particle.size * 1.5, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.size = Math.random() * 0.3 + 0.2;
        this.baseSpeed = 4;
        this.velocity = { x: 0, y: 0 };
        this.friction = 0.9;
        this.distanceFromMouse = Infinity;
    }

    update(mouseX, mouseY) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        this.distanceFromMouse = Math.sqrt(dx * dx + dy * dy);

        if (this.distanceFromMouse < 100) {
            const force = (100 - this.distanceFromMouse) / 100;
            const pushForce = force * 2;
            
            this.velocity.x = (dx / this.distanceFromMouse) * this.baseSpeed * pushForce;
            this.velocity.y = (dy / this.distanceFromMouse) * this.baseSpeed * pushForce;
        } else {
            const returnForce = 0.1;
            this.velocity.x += (this.originX - this.x) * returnForce;
            this.velocity.y += (this.originY - this.y) * returnForce;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
    }
}

// Инициализация
new ParticleSystem();