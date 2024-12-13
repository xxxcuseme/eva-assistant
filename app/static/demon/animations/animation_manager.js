import * as THREE from 'three';
import { legIdleAnimation, legWalkAnimation } from '../legs/movement.js';
import { idleAnimation, breathAnimation } from '../body/idle.js';
import { waveHand } from '../arms/wave.js';
import { HeadRotationManager, startCursorTracking } from '../head/rotation.js';
import { EyeTrackingManager } from '../head/eyes.js';
import { ModelDiagnostics } from './diagnostics.js';

export class AnimationManager {
    constructor(scene, camera, renderer, controls) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.controls = controls;
        this.model = null;
        
        // Менеджеры анимаций
        this.headManager = null;
        this.eyeManager = null;
        this.stopCursorTracking = null;
        
        // Активные анимации
        this.activeAnimations = {
            legs: null,
            body: null,
            breath: null
        };
        
        // Параметры движения
        this.targetPosition = new THREE.Vector3();
        this.currentPosition = new THREE.Vector3();
        this.moveSpeed = 0.02;
        this.wanderRadius = 5;
        this.isWandering = false;
        this.isWalking = false;
        
        // Части модели
        this.parts = {
            head: null,
            body: null,
            leftArm: null,
            rightArm: null
        };
        
        // Добавляем флаг отладки
        this.debug = true;
        
        // Кости модели
        this.bones = {
            base: null,      // Base -> Base001
            spine: null,     // Base001
            neck: null,      // Cuello
            head: null,      // Head
            leftLeg: {
                upper: null, // PiernaL
                lower: null  // Pierna2L
            },
            rightLeg: {
                upper: null, // PiernaR
                lower: null  // Pierna2R
            },
            leftArm: {
                upper: null, // BrazoL
                lower: null  // Brazo2L
            },
            rightArm: {
                upper: null, // BrazoR
                lower: null  // Brazo2R
            },
            leftHorn: {
                base: null,  // CuernoL
                tip: null    // Cuerno2L
            },
            rightHorn: {
                base: null,  // CuernoR
                tip: null    // Cuerno2R
            },
            leftEye: null,   // EyeL
            rightEye: null   // EyeR
        };
    }

    loadModel(gltf) {
        this.model = gltf.scene;
        
        // Находим все кости
        this.model.traverse(obj => {
            if (obj.isBone) {
                const name = obj.name.toLowerCase();
                
                // Основной скелет
                if (name === 'base') this.bones.base = obj;
                if (name === 'base001') this.bones.spine = obj;
                if (name === 'cuello') this.bones.neck = obj;
                if (name === 'head') this.bones.head = obj;
                
                // Ноги
                if (name === 'piernal') this.bones.leftLeg.upper = obj;
                if (name === 'pierna2l') this.bones.leftLeg.lower = obj;
                if (name === 'piernar') this.bones.rightLeg.upper = obj;
                if (name === 'pierna2r') this.bones.rightLeg.lower = obj;
                
                // Руки
                if (name === 'brazol') this.bones.leftArm.upper = obj;
                if (name === 'brazo2l') this.bones.leftArm.lower = obj;
                if (name === 'brazor') this.bones.rightArm.upper = obj;
                if (name === 'brazo2r') this.bones.rightArm.lower = obj;
                
                // Рога
                if (name === 'cuernol') this.bones.leftHorn.base = obj;
                if (name === 'cuerno2l') this.bones.leftHorn.tip = obj;
                if (name === 'cuernor') this.bones.rightHorn.base = obj;
                if (name === 'cuerno2r') this.bones.rightHorn.tip = obj;
                
                // Глаза
                if (name === 'eyel') this.bones.leftEye = obj;
                if (name === 'eyer') this.bones.rightEye = obj;
            }
        });

        // Добавляем модель в сцену
        this.scene.add(this.model);
        
        // Масштабирование и позиционирование
        this.model.scale.set(0.2, 0.2, 0.2);
        
        // Запуск анимаций
        this.startBaseAnimations();
        this.startWandering();
    }

    startBaseAnimations() {
        console.log('Запуск базовых анимаций...');
        
        // Проверяем наличие костей перед запуском
        console.log('Состояние костей:', {
            base: !!this.bones.base,
            leftLeg: {
                upper: !!this.bones.leftLeg.upper,
                lower: !!this.bones.leftLeg.lower
            },
            rightLeg: {
                upper: !!this.bones.rightLeg.upper,
                lower: !!this.bones.rightLeg.lower
            }
        });

        const animate = () => {
            const time = Date.now() * 0.001;
            
            // Дыхание
            if (this.bones.base) {
                const breathIntensity = 0.03;
                const breathSpeed = 1.5;
                this.bones.base.position.y = Math.sin(time * breathSpeed) * breathIntensity;
                this.bones.base.rotation.z = Math.sin(time * breathSpeed) * 0.015;
                this.bones.base.rotation.x = Math.sin(time * breathSpeed * 0.5) * 0.01;
                
                // Обновляем матрицы
                this.bones.base.updateMatrix();
                this.bones.base.updateMatrixWorld(true);
            }

            // Анимация ног
            if (this.bones.leftLeg.upper && this.bones.rightLeg.upper) {
                // Легкое покачивание
                const legSwayAmount = 0.1; // Увеличили амплитуду
                const legSwaySpeed = 1.5;
                
                // Левая нога
                this.bones.leftLeg.upper.rotation.x = Math.sin(time * legSwaySpeed) * legSwayAmount;
                if (this.bones.leftLeg.lower) {
                    this.bones.leftLeg.lower.rotation.x = Math.abs(Math.sin(time * legSwaySpeed)) * 0.05;
                }
                
                // Правая нога (в противофазе)
                this.bones.rightLeg.upper.rotation.x = -Math.sin(time * legSwaySpeed) * legSwayAmount;
                if (this.bones.rightLeg.lower) {
                    this.bones.rightLeg.lower.rotation.x = Math.abs(Math.sin(time * legSwaySpeed + Math.PI)) * 0.05;
                }
                
                // Обновляем матрицы ног
                this.bones.leftLeg.upper.updateMatrix();
                this.bones.leftLeg.upper.updateMatrixWorld(true);
                this.bones.rightLeg.upper.updateMatrix();
                this.bones.rightLeg.upper.updateMatrixWorld(true);
                
                if (this.bones.leftLeg.lower) {
                    this.bones.leftLeg.lower.updateMatrix();
                    this.bones.leftLeg.lower.updateMatrixWorld(true);
                }
                if (this.bones.rightLeg.lower) {
                    this.bones.rightLeg.lower.updateMatrix();
                    this.bones.rightLeg.lower.updateMatrixWorld(true);
                }
            }

            // Анимация рук
            if (this.bones.leftArm.upper && this.bones.rightArm.upper) {
                const armSwayAmount = 0.1; // Увеличили амплитуду
                const armSwaySpeed = 1.2;
                
                // Левая рука
            // Покачивание рогов
            if (this.bones.leftHorn.base && this.bones.rightHorn.base) {
                this.bones.leftHorn.base.rotation.z = -Math.PI/3 + Math.sin(time * 2) * 0.05;
                this.bones.rightHorn.base.rotation.z = Math.PI/3 - Math.sin(time * 2) * 0.05;
            }

            // Движение глаз
            if (this.bones.leftEye && this.bones.rightEye) {
                const eyeMovement = Math.sin(time * 0.5) * 0.1;
                this.bones.leftEye.rotation.y = eyeMovement;
                this.bones.rightEye.rotation.y = eyeMovement;
            }

            // Покачивание рук (только легкие движения, без изменения базового положения)
            if (this.bones.leftArm.upper && this.bones.rightArm.upper) {
                // Легкое покачивание вперед-назад
                const armSwing = Math.sin(time * 1.5) * 0.05;
                
                // Сохраняем базовое положение рук и добавляем покачивание
                this.bones.leftArm.upper.rotation.order = 'YXZ';
                this.bones.rightArm.upper.rotation.order = 'YXZ';
                
                // Добавляем только покачивание по X, сохраняя базовое положение по Y и Z
                this.bones.leftArm.upper.rotation.x = armSwing;
                this.bones.rightArm.upper.rotation.x = armSwing;
                
                // Легкое движение предплечий
                if (this.bones.leftArm.lower && this.bones.rightArm.lower) {
                    const forearmBend = Math.sin(time * 1.5) * 0.03;
                    this.bones.leftArm.lower.rotation.x = forearmBend;
                    this.bones.rightArm.lower.rotation.x = forearmBend;
                }
            }

            requestAnimationFrame(animate);
        };

        // Устанавливаем начальное положение рук
        if (this.bones.leftArm.upper && this.bones.rightArm.upper) {
            this.bones.leftArm.upper.rotation.order = 'YXZ';
            this.bones.rightArm.upper.rotation.order = 'YXZ';
            
            this.bones.leftArm.upper.rotation.y = 0;
            this.bones.leftArm.upper.rotation.x = 0;
            this.bones.leftArm.upper.rotation.z = 0; // Руки вдоль тела
            
            this.bones.rightArm.upper.rotation.y = 0;
            this.bones.rightArm.upper.rotation.x = 0;
            this.bones.rightArm.upper.rotation.z = 0; // Руки вдоль тела
        }

        animate();
    }

    updateWandering() {
        if (!this.isWandering) {
            if (this.isWalking) {
                this.isWalking = false;
                // Переключение на анимацию ожидания
                if (this.activeAnimations.legs) {
                    this.activeAnimations.legs();
                    this.activeAnimations.legs = legIdleAnimation(this.model);
                }
            }
            return;
        }

        const distance = this.currentPosition.distanceTo(this.targetPosition);

        if (distance < 0.1) {
            this.setNewWanderTarget();
            this.isWalking = false;
            // Переключение на анимацию ожидания
            if (this.activeAnimations.legs) {
                this.activeAnimations.legs();
                this.activeAnimations.legs = legIdleAnimation(this.model);
            }
        } else {
            const direction = new THREE.Vector3()
                .subVectors(this.targetPosition, this.currentPosition)
                .normalize();

            this.currentPosition.add(direction.multiplyScalar(this.moveSpeed));
            this.model.position.copy(this.currentPosition);
            this.model.lookAt(this.targetPosition);

            // Включение анимации ходьбы
            if (!this.isWalking) {
                this.isWalking = true;
                if (this.activeAnimations.legs) {
                    this.activeAnimations.legs();
                    this.activeAnimations.legs = legWalkAnimation(this.model);
                }
            }
        }
    }

    playTalkAnimation() {
        // Остановка блуждания
        this.stopWandering();
        
        // Анимация приветствия
        waveHand(this.model);
        
        // Усиление анимаций тела
        this.startBaseAnimations();
    }

    playIdleAnimation() {
        // Возобновление блуждания
        this.startWandering();
        
        // Возврат к базовым анимациям
        this.startBaseAnimations();
    }

    playThinkAnimation() {
        // Остановка блуждания
        this.stopWandering();
        
        // Замедление анимаций
        this.startBaseAnimations();
    }

    playGreetingAnimation() {
        // Остановка блуждания
        this.stopWandering();
        
        // Приветственная анимация
        waveHand(this.model);
        
        setTimeout(() => {
            this.playIdleAnimation();
        }, 1000);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Обновление блуждания
        this.updateWandering();
        
        // Обновление контролов
        if (this.controls) {
            this.controls.update();
        }
        
        // Рендеринг
        if (this.renderer && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    cleanup() {
        // Остановка всех анимаций
        Object.values(this.activeAnimations).forEach(stopFn => {
            if (typeof stopFn === 'function') stopFn();
        });
        
        // Остановка отслеживания курсора
        if (this.stopCursorTracking) {
            this.stopCursorTracking();
        }
    }

    setNewWanderTarget() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.wanderRadius;
        this.targetPosition.set(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );
    }

    startWandering() {
        this.isWandering = true;
    }

    stopWandering() {
        this.isWandering = false;
    }
}
