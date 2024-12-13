// Управление поворотом головы демона
import * as TWEEN from 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.esm.js';
import * as THREE from 'three';

export class HeadRotationManager {
    constructor() {
        this.headParts = {
            main: [], // Основная кость головы
            horns: [], // Рога
            face: [], // Лицевые кости
            neck: []  // Шея
        };
    }

    findHeadBones(model) {
        model.traverse(obj => {
            if (obj.isBone) {
                const name = obj.name.toLowerCase();
                
                // Классификация костей головы
                if (name === 'head' || name === 'cabeza') {
                    this.headParts.main.push(obj);
                    // Начальное положение головы
                    obj.rotation.set(0, 0, 0);
                    obj.position.set(0, 0, 0);
                }
                else if (name.includes('horn') || name.includes('cuerno')) {
                    this.headParts.horns.push(obj);
                    // Рога следуют за головой
                    obj.rotation.set(0, 0, 0);
                }
                else if (name.includes('face') || name.includes('cara')) {
                    this.headParts.face.push(obj);
                    // Лицевые кости следуют за головой
                    obj.rotation.set(0, 0, 0);
                }
                
                obj.updateMatrix();
                obj.updateMatrixWorld(true);
            }
        });

        return this.headParts;
    }

    rotateHead(rotation = { x: 0, y: 0, z: 0 }) {
        // Поворачиваем все части головы синхронно
        Object.values(this.headParts).flat().forEach(bone => {
            if (bone) {
                bone.rotation.x = rotation.x;
                bone.rotation.y = rotation.y;
                bone.rotation.z = rotation.z;
                bone.updateMatrix();
                bone.updateMatrixWorld(true);
            }
        });
    }
}

export function rotateHead(model, angleX, angleY) {
    if (!model) return;

    const headRotationManager = new HeadRotationManager();
    const headBones = headRotationManager.findHeadBones(model);
    headRotationManager.rotateHead(headBones, { x: angleX, y: angleY });
}

export function startCursorTracking(model, camera) {
    return initCursorTracking(model, camera);
}

export function initCursorTracking(model, camera) {
    const headRotationManager = new HeadRotationManager();
    const headBones = headRotationManager.findHeadBones(model);

    function updateHeadRotation(event) {
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        const angleX = mouseY * Math.PI / 4;     // Умеренный наклон вперед/назад
        const angleY = mouseX * Math.PI / 3;     // Умеренный поворот влево/вправо
        const angleZ = mouseX * Math.PI / 12;    // Небольшой наклон по Z

        headRotationManager.rotateHead(headBones, { 
            x: angleX, 
            y: angleY,
            z: angleZ 
        });
    }

    // Добавляем обработчик движения мыши
    window.addEventListener('mousemove', updateHeadRotation);

    // Возвращаем функцию отключения
    return () => {
        window.removeEventListener('mousemove', updateHeadRotation);
    };
}

export function shakehead(model) {
    if (!model) return;

    const headRotationManager = new HeadRotationManager();
    const headBones = headRotationManager.findHeadBones(model);

    const shakeTween = new TWEEN.Tween({ angle: 0 })
        .to({ angle: Math.PI / 6 }, 200)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj) {
            headRotationManager.rotateHead(headBones, { x: obj.angle, y: 0, z: 0 });
        })
        .yoyo(true)
        .repeat(2);

    shakeTween.start();
}

export function startAutoHeadMovement(model) {
    if (!model) return null;

    const headRotationManager = new HeadRotationManager();
    const headBones = headRotationManager.findHeadBones(model);
    
    headRotationManager.startAutoHeadMovement(headBones);
    
    return headRotationManager;
}

export function stopAutoHeadMovement(headRotationManager) {
    if (headRotationManager) {
        headRotationManager.stopAutoHeadMovement();
    }
}