// Анимация взмаха рукой
export function waveHand(model) {
    let rightArm = null;
    let rightForearm = null;
    let initialRotations = {
        arm: {
            x: 0,
            y: 0,
            z: 0,
            order: 'YXZ'
        },
        forearm: {
            x: 0,
            y: 0,
            z: 0,
            order: 'XYZ'
        }
    };

    model.traverse(obj => {
        if (obj.isBone) {
            const name = obj.name.toLowerCase();
            if (name === 'brazor') {
                rightArm = obj;
                initialRotations.arm = {
                    x: obj.rotation.x,
                    y: obj.rotation.y,
                    z: obj.rotation.z,
                    order: obj.rotation.order
                };
            } else if (name === 'brazo2r') {
                rightForearm = obj;
                initialRotations.forearm = {
                    x: obj.rotation.x,
                    y: obj.rotation.y,
                    z: obj.rotation.z,
                    order: obj.rotation.order
                };
            }
        }
    });

    if (!rightArm || !rightForearm) {
        console.warn('Кости руки не найдены');
        return;
    }

    const startTime = Date.now();
    const duration = 2000; // Увеличили длительность для более плавной анимации
    let animationFrameId;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Плавная функция перехода
        const easing = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedProgress = easing(progress);

        // Анимация взмаха
        const waveProgress = Math.sin(progress * Math.PI * 4) * (1 - progress); // Затухающие колебания
        
        // Сохраняем порядок поворотов
        rightArm.rotation.order = 'YXZ';
        
        // Поднимаем руку и машем
        rightArm.rotation.x = initialRotations.arm.x + Math.PI * 0.3 * easedProgress; // Поднимаем руку
        rightArm.rotation.y = initialRotations.arm.y + Math.PI * 0.2 * easedProgress; // Поворачиваем наружу
        rightArm.rotation.z = initialRotations.arm.z + waveProgress * 0.3; // Покачивание

        // Сгибаем локоть
        rightForearm.rotation.order = 'XYZ';
        rightForearm.rotation.x = initialRotations.forearm.x + Math.PI * 0.2 * easedProgress;
        rightForearm.rotation.y = initialRotations.forearm.y;
        rightForearm.rotation.z = initialRotations.forearm.z + Math.sin(progress * Math.PI * 4) * 0.2;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            // Плавно возвращаем в исходное положение
            const returnToStart = () => {
                const returnProgress = Math.min((Date.now() - (startTime + duration)) / 500, 1);
                const returnEasing = 1 - Math.pow(1 - returnProgress, 3); // Кубическая функция замедления

                rightArm.rotation.x = initialRotations.arm.x + Math.PI * 0.3 * (1 - returnEasing);
                rightArm.rotation.y = initialRotations.arm.y + Math.PI * 0.2 * (1 - returnEasing);
                rightArm.rotation.z = initialRotations.arm.z;

                rightForearm.rotation.x = initialRotations.forearm.x + Math.PI * 0.2 * (1 - returnEasing);
                rightForearm.rotation.y = initialRotations.forearm.y;
                rightForearm.rotation.z = initialRotations.forearm.z;

                if (returnProgress < 1) {
                    animationFrameId = requestAnimationFrame(returnToStart);
                }
            };
            returnToStart();
        }
    }

    animate();

    // Возвращаем функцию остановки анимации
    return () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            
            // Мгновенно возвращаем в исходное положение при остановке
            rightArm.rotation.order = initialRotations.arm.order;
            rightArm.rotation.x = initialRotations.arm.x;
            rightArm.rotation.y = initialRotations.arm.y;
            rightArm.rotation.z = initialRotations.arm.z;
            
            rightForearm.rotation.order = initialRotations.forearm.order;
            rightForearm.rotation.x = initialRotations.forearm.x;
            rightForearm.rotation.y = initialRotations.forearm.y;
            rightForearm.rotation.z = initialRotations.forearm.z;
        }
    };
}

export function setArmsNeutralPose(model) {
    model.traverse(obj => {
        if (obj.isBone) {
            const name = obj.name.toLowerCase();
            
            // Основные части рук
            if (name === 'brazol' || name === 'brazor') {
                // Сброс поворота
                obj.rotation.set(0, 0, 0);
                
                // Установка базового положения - руки в стороны
                if (name === 'brazol') {
                    obj.rotation.order = 'YXZ'; // Важно для правильного порядка поворотов
                    obj.rotation.y = 0;
                    obj.rotation.x = 0;
                    obj.rotation.z = -Math.PI/2; // -90 градусов для левой руки
                } else {
                    obj.rotation.order = 'YXZ';
                    obj.rotation.y = 0;
                    obj.rotation.x = 0;
                    obj.rotation.z = Math.PI/2; // 90 градусов для правой руки
                }
                
                obj.updateMatrix();
                obj.updateMatrixWorld(true);
            }
            
            // Предплечья
            if (name === 'brazo2l' || name === 'brazo2r') {
                obj.rotation.set(0, 0, 0);
                obj.updateMatrix();
                obj.updateMatrixWorld(true);
            }
        }
    });
}
