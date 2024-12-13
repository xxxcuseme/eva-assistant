// Анимация idle-состояния демона
export function idleAnimation(model) {
    if (!model) {
        return () => {};
    }

    const spineBones = [];
    const hipBones = [];

    model.traverse(obj => {
        if (obj.isBone) {
            const name = obj.name.toLowerCase();
            
            // Расширенный поиск костей позвоночника
            if (name.includes('spine') || 
                name.includes('columna') || 
                name.includes('espalda') || 
                name.includes('torso') ||
                name === 'base' || 
                name === 'base001' ||
                name === 'cuello') {
                spineBones.push(obj);
            }

            // Расширенный поиск тазовых костей
            if (name.includes('hip') || 
                name.includes('cadera') || 
                name.includes('pelvis') ||
                name === 'piernal' ||
                name === 'piernar' ||
                name === 'pierna2l' ||
                name === 'pierna2r') {
                hipBones.push(obj);
            }
        }
    });

    if (spineBones.length === 0 || hipBones.length === 0) {
        return () => {};
    }

    let animationFrameId;
    const startTime = Date.now();
    const animationDuration = 2000; // 2 секунды цикл

    function animateIdle() {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % animationDuration) / animationDuration;

        // Легкое покачивание корпуса
        const swayAngle = Math.sin(progress * Math.PI * 2) * Math.PI / 16;

        spineBones.forEach(bone => {
            bone.rotation.z = swayAngle;
            bone.updateMatrixWorld(true);
        });

        hipBones.forEach(bone => {
            bone.rotation.x = Math.sin(progress * Math.PI * 2) * Math.PI / 32;
            bone.updateMatrixWorld(true);
        });

        animationFrameId = requestAnimationFrame(animateIdle);
    }

    animateIdle();

    // Возвращаем функцию остановки
    return () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        // Возвращаем кости в начальное положение
        spineBones.forEach(bone => {
            bone.rotation.z = 0;
            bone.updateMatrixWorld(true);
        });
        hipBones.forEach(bone => {
            bone.rotation.x = 0;
            bone.updateMatrixWorld(true);
        });
    };
}

export function breathAnimation(model) {
    if (!model) {
        return () => {};
    }

    const chestBones = [];

    model.traverse(obj => {
        if (obj.isBone) {
            const name = obj.name.toLowerCase();
            
            // Расширенный поиск костей грудной клетки
            if (name.includes('chest') || 
                name.includes('pecho') || 
                name.includes('torax') || 
                name.includes('ribcage') ||
                name.includes('cuello') ||
                name === 'cuello') {
                chestBones.push(obj);
            }
        }
    });

    if (chestBones.length === 0) {
        return () => {};
    }

    let animationFrameId;
    const startTime = Date.now();
    const animationDuration = 3000; // 3 секунды цикл дыхания

    function animateBreath() {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % animationDuration) / animationDuration;

        // Имитация дыхания - расширение и сужение грудной клетки
        const breathScale = 1 + Math.sin(progress * Math.PI * 2) * 0.05;

        chestBones.forEach(bone => {
            bone.scale.x = breathScale;
            bone.scale.y = breathScale;
            bone.updateMatrixWorld(true);
        });

        animationFrameId = requestAnimationFrame(animateBreath);
    }

    animateBreath();

    // Возвращаем функцию остановки
    return () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        // Возвращаем кости в начальное положение
        chestBones.forEach(bone => {
            bone.scale.x = 1;
            bone.scale.y = 1;
            bone.updateMatrixWorld(true);
        });
    };
}

export function facialAnimation(model) {
    if (!model) {
        return () => {};
    }

    const facialBones = {
        eyebrows: [],
        eyes: [],
        mouth: [],
        cheeks: []
    };

    model.traverse(obj => {
        if (obj.isBone) {
            const name = obj.name.toLowerCase();
            
            // Расширенный поиск костей с использованием точных и частичных совпадений
            const matchesBone = (possibleNames) => 
                possibleNames.some(part => name.includes(part));

            // Поиск бровей
            if (name.includes('head')) {
                facialBones.eyebrows.push(obj);
            }
            
            // Поиск глаз
            if (matchesBone(['eyel', 'eyer'])) {
                facialBones.eyes.push(obj);
            }
            
            // Поиск рта
            if (name.includes('head')) {
                facialBones.mouth.push(obj);
            }
            
            // Поиск щек
            if (name.includes('head')) {
                facialBones.cheeks.push(obj);
            }
        }
    });

    // Проверяем наличие лицевых костей
    const hasFacialBones = Object.values(facialBones).some(arr => arr.length > 0);
    
    if (!hasFacialBones) {
        return () => {};
    }

    let animationFrameId;
    const startTime = Date.now();
    const animationDuration = 4000; // 4 секунды цикл

    function animateFace() {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % animationDuration) / animationDuration;

        // Анимация бровей - легкое движение вверх-вниз
        facialBones.eyebrows.forEach(bone => {
            bone.rotation.x = Math.sin(progress * Math.PI * 2) * 0.1;
        });

        // Анимация глаз - легкое моргание
        facialBones.eyes.forEach(bone => {
            const blinkProgress = Math.sin(progress * Math.PI * 4);
            bone.scale.y = 1 - Math.abs(blinkProgress) * 0.2;
        });

        // Анимация рта - легкая улыбка
        facialBones.mouth.forEach(bone => {
            bone.rotation.x = Math.sin(progress * Math.PI * 2) * 0.05;
        });

        // Анимация щек - легкое покачивание
        facialBones.cheeks.forEach(bone => {
            bone.rotation.z = Math.sin(progress * Math.PI * 2) * 0.1;
        });

        animationFrameId = requestAnimationFrame(animateFace);
    }

    animateFace();

    // Возвращаем функцию остановки
    return () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // Возвращаем кости в начальное положение
        Object.values(facialBones).forEach(boneGroup => {
            boneGroup.forEach(bone => {
                bone.rotation.x = 0;
                bone.rotation.y = 0;
                bone.rotation.z = 0;
                bone.scale.y = 1;
                bone.updateMatrixWorld(true);
            });
        });
    };
}
