import * as THREE from 'three';

// Диагностика анимаций и производительности
export class AnimationDiagnostics {
    constructor() {
        this.performanceMetrics = {
            totalAnimations: 0,
            animationStartTimes: {},
            animationEndTimes: {},
            boneTrackingData: {}
        };
    }

    startAnimationTracking(animationName) {
        this.performanceMetrics.totalAnimations++;
        this.performanceMetrics.animationStartTimes[animationName] = performance.now();
    }

    endAnimationTracking(animationName) {
        const endTime = performance.now();
        const startTime = this.performanceMetrics.animationStartTimes[animationName];
        const duration = endTime - startTime;

        this.performanceMetrics.animationEndTimes[animationName] = endTime;
        console.log(`Animation "${animationName}" duration: ${duration.toFixed(2)}ms`);
    }

    trackBoneMovement(boneName, rotation, position) {
        if (!this.performanceMetrics.boneTrackingData[boneName]) {
            this.performanceMetrics.boneTrackingData[boneName] = {
                rotationHistory: [],
                positionHistory: []
            };
        }

        // Безопасное извлечение значений
        const safeRotation = {
            x: rotation && !isNaN(rotation.x) ? rotation.x : 0,
            y: rotation && !isNaN(rotation.y) ? rotation.y : 0,
            z: rotation && !isNaN(rotation.z) ? rotation.z : 0
        };

        const safePosition = {
            x: position && !isNaN(position.x) ? position.x : 0,
            y: position && !isNaN(position.y) ? position.y : 0,
            z: position && !isNaN(position.z) ? position.z : 0
        };

        this.performanceMetrics.boneTrackingData[boneName].rotationHistory.push(
            Math.sqrt(safeRotation.x**2 + safeRotation.y**2 + safeRotation.z**2)
        );
        this.performanceMetrics.boneTrackingData[boneName].positionHistory.push(
            Math.sqrt(safePosition.x**2 + safePosition.y**2 + safePosition.z**2)
        );
    }

    generatePerformanceReport() {
        console.group('🔍 Animation Performance Report');
        console.log('Total Animations:', this.performanceMetrics.totalAnimations);
        
        console.group('Bone Movement Analysis');
        Object.entries(this.performanceMetrics.boneTrackingData).forEach(([boneName, data]) => {
            console.log(`Bone: ${boneName}`);
            console.log('  Rotation Variations:', this.calculateVariation(data.rotationHistory));
            console.log('  Position Variations:', this.calculateVariation(data.positionHistory));
        });
        console.groupEnd();

        console.groupEnd();
    }

    calculateVariation(history) {
        if (history.length < 2) return 0;

        const min = Math.min(...history);
        const max = Math.max(...history);
        return isNaN(max - min) ? 0 : Math.abs(max - min);
    }

    reset() {
        this.performanceMetrics = {
            totalAnimations: 0,
            animationStartTimes: {},
            animationEndTimes: {},
            boneTrackingData: {}
        };
    }
}

export function setupAnimationDiagnostics(model) {
    const diagnostics = new AnimationDiagnostics();

    // Создаем массив для хранения оригинальных методов
    const originalMethods = new Map();

    model.traverse(obj => {
        if (obj.isBone) {
            // Сохраняем оригинальные методы
            originalMethods.set(obj, {
                updateMatrix: obj.updateMatrix,
                updateMatrixWorld: obj.updateMatrixWorld,
                updateWorldMatrix: obj.updateWorldMatrix
            });

            // Перезаписываем методы для принудительного трекинга
            obj.updateMatrix = function(force) {
                diagnostics.trackBoneMovement(
                    this.name, 
                    { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z },
                    { x: this.position.x, y: this.position.y, z: this.position.z }
                );
                return originalMethods.get(this).updateMatrix.call(this, force);
            };

            obj.updateMatrixWorld = function(force) {
                diagnostics.trackBoneMovement(
                    this.name, 
                    { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z },
                    { x: this.position.x, y: this.position.y, z: this.position.z }
                );
                return originalMethods.get(this).updateMatrixWorld.call(this, force);
            };

            obj.updateWorldMatrix = function(updateParents, updateChildren) {
                diagnostics.trackBoneMovement(
                    this.name, 
                    { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z },
                    { x: this.position.x, y: this.position.y, z: this.position.z }
                );
                return originalMethods.get(this).updateWorldMatrix.call(this, updateParents, updateChildren);
            };
        }
    });

    // Принудительный трекинг каждые 100мс
    const trackingInterval = setInterval(() => {
        model.traverse(obj => {
            if (obj.isBone) {
                diagnostics.trackBoneMovement(
                    obj.name, 
                    { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
                    { x: obj.position.x, y: obj.position.y, z: obj.position.z }
                );
            }
        });
    }, 100);

    // Очистка интервала при необходимости
    diagnostics.stopTracking = () => {
        clearInterval(trackingInterval);
    };

    return diagnostics;
}

export class ModelDiagnostics {
    constructor(model) {
        this.model = model;
        this.foundParts = {
            meshes: [],
            bones: [],
            groups: [],
            materials: []
        };
        this.hierarchy = [];
    }

    // Анализ всей модели
    analyzeModel() {
        console.group('🔍 Диагностика модели');
        
        // Анализ иерархии
        this.analyzeHierarchy(this.model, 0);
        
        // Поиск всех компонентов
        this.model.traverse(obj => {
            const type = this.getObjectType(obj);
            const name = obj.name || 'Безымянный';
            
            if (type) {
                this.foundParts[type].push({
                    name: name,
                    type: type,
                    position: obj.position.clone(),
                    rotation: obj.rotation.clone(),
                    parent: obj.parent ? obj.parent.name : 'none'
                });
            }
        });

        // Вывод результатов
        this.printResults();
        
        console.groupEnd();
    }

    // Определение типа объекта
    getObjectType(obj) {
        if (obj.isMesh) return 'meshes';
        if (obj.isBone) return 'bones';
        if (obj.isGroup) return 'groups';
        if (obj.isMaterial) return 'materials';
        return null;
    }

    // Анализ иерархии объектов
    analyzeHierarchy(obj, level = 0) {
        const indent = '  '.repeat(level);
        const type = this.getObjectType(obj) || 'unknown';
        const name = obj.name || 'Безымянный';
        
        this.hierarchy.push({
            level: level,
            name: name,
            type: type,
            position: obj.position.clone(),
            rotation: obj.rotation.clone()
        });

        obj.children.forEach(child => {
            this.analyzeHierarchy(child, level + 1);
        });
    }

    // Вывод результатов анализа
    printResults() {
        // Вывод иерархии
        console.group('📊 Иерархия модели:');
        this.hierarchy.forEach(item => {
            const indent = '  '.repeat(item.level);
            console.log(`${indent}${item.name} (${item.type})`);
            console.log(`${indent}  Позиция:`, {
                x: item.position.x.toFixed(2),
                y: item.position.y.toFixed(2),
                z: item.position.z.toFixed(2)
            });
            console.log(`${indent}  Поворот:`, {
                x: (item.rotation.x * 180 / Math.PI).toFixed(2) + '°',
                y: (item.rotation.y * 180 / Math.PI).toFixed(2) + '°',
                z: (item.rotation.z * 180 / Math.PI).toFixed(2) + '°'
            });
        });
        console.groupEnd();

        // Статистика по типам
        console.group('📈 Статистика:');
        Object.entries(this.foundParts).forEach(([type, parts]) => {
            console.log(`${type}: ${parts.length} элементов`);
            if (parts.length > 0) {
                console.group(`Детали ${type}:`);
                parts.forEach(part => {
                    console.log(`- ${part.name}`);
                    console.log('  Родитель:', part.parent);
                    console.log('  Позиция:', {
                        x: part.position.x.toFixed(2),
                        y: part.position.y.toFixed(2),
                        z: part.position.z.toFixed(2)
                    });
                    console.log('  Поворот:', {
                        x: (part.rotation.x * 180 / Math.PI).toFixed(2) + '°',
                        y: (part.rotation.y * 180 / Math.PI).toFixed(2) + '°',
                        z: (part.rotation.z * 180 / Math.PI).toFixed(2) + '°'
                    });
                });
                console.groupEnd();
            }
        });
        console.groupEnd();
    }

    // Визуальная отладка в сцене
    createDebugVisuals() {
        const debugObjects = new THREE.Group();
        
        this.model.traverse(obj => {
            if (obj.isMesh || obj.isBone) {
                // Создаем сферу для визуализации позиции
                const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1),
                    new THREE.MeshBasicMaterial({ 
                        color: obj.isMesh ? 0xff0000 : 0x00ff00,
                        wireframe: true 
                    })
                );
                sphere.position.copy(obj.position);
                debugObjects.add(sphere);

                // Создаем оси для визуализации поворота
                const axes = new THREE.AxesHelper(0.2);
                axes.position.copy(obj.position);
                axes.rotation.copy(obj.rotation);
                debugObjects.add(axes);
            }
        });

        return debugObjects;
    }
}
