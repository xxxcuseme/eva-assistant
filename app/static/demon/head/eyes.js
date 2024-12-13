// Управление глазами демона
export class EyeTrackingManager {
    constructor(config = {}) {
        // Глубокое слияние конфигураций с значениями по умолчанию
        this.config = this.deepMerge({
            maxEyeMovement: Math.PI / 6,  // Максимальное движение глаз
            smoothingFactor: 0.2,         // Коэффициент сглаживания
            blinkFrequency: 5000,         // Частота моргания (мс)
            facialAnimationIntensity: 0.2, // Интенсивность анимации лица
            debugMode: false,              // Режим отладки
            verboseLogging: false,         // Подробное логирование
            boneCriteria: {
                nose: {
                    keywords: [
                        'nose', 'nariz', 'naris', 
                        'punta_nariz', 'nose_tip', 
                        'centro_nariz', 'nose_center',
                        'puente_nariz', 'nose_bridge',
                        'nariz_punta', 'nariz_centro',
                        'bone001', 'nose_bone'
                    ],
                    positionCriteria: {
                        heightRange: {
                            min: 6.5,     // Минимальная высота
                            max: 8.0      // Максимальная высота
                        },
                        zOffset: {
                            min: 1.5,     // Минимальное смещение по Z
                            max: 3.0      // Максимальное смещение по Z
                        },
                        xOffset: {
                            max: 0.5      // Допустимое отклонение по X
                        },
                        confidenceThreshold: 0.7  // Порог уверенности в определении
                    },
                    excludeNames: []  // Список исключений
                },
                forehead: {
                    keywords: [
                        'forehead', 'frente', 'brow', 
                        'brow_bone', 'hueso_frente', 
                        'parte_superior_cabeza', 'top_head',
                        'frontal', 'frontal_bone',
                        'cabeza_superior', 'head_top',
                        'head', 'cabeza', 'bone'
                    ],
                    positionCriteria: {
                        heightRange: {
                            min: 5.5,     // Минимальная высота лба
                            max: 7.0      // Максимальная высота лба
                        },
                        zOffset: {
                            min: 1.0,     // Минимальное смещение по Z
                            max: 2.5      // Максимальное смещение по Z
                        },
                        confidenceThreshold: 0.6  // Порог уверенности в определении
                    },
                    excludeNames: ['bone001']  // Исключаем имена, которые могут быть носовыми
                }
            }
        }, config);
        
        // Новый механизм предотвращения повторов
        this.logCache = {
            facialBonesSignature: null,
            lastLogTimestamp: 0,
            logInterval: 5000 // 5 секунд между логами
        };
        
        this.debugCounter = {
            nose: 0,
            forehead: 0,
            globalLogCounter: 0
        };
        this.detectedBones = {
            nose: [],
            forehead: []
        };
        this.hasLogged = false;
    }

    // Глубокое слияние объектов
    deepMerge(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    // Проверка, является ли объект объектом
    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    findEyeBones(model) {
        const eyeBones = {
            left: null,
            right: null
        };

        const eyeKeywords = ['eye', 'ojo', 'pupil', 'iris'];
        
        model.traverse(bone => {
            if (bone.type === 'Bone') {
                const name = bone.name.toLowerCase();
                
                for (let keyword of eyeKeywords) {
                    if (name.includes(keyword)) {
                        if (name.includes('l')) {
                            eyeBones.left = bone;
                        } else if (name.includes('r')) {
                            eyeBones.right = bone;
                        }
                    }
                }
            }
        });

        return eyeBones;
    }

    // Генерация уникальной сигнатуры для обнаруженных костей
    generateBonesSignature(facialBones) {
        const signature = Object.entries(facialBones)
            .map(([type, bones]) => 
                `${type}:${bones.map(bone => bone.name).sort().join(',')}`
            )
            .join('|');
        return signature;
    }

    // Проверка, нужно ли логировать
    shouldLog(facialBones) {
        const currentTime = Date.now();
        const currentSignature = this.generateBonesSignature(facialBones);
        
        const timeSinceLastLog = currentTime - this.logCache.lastLogTimestamp;
        const signatureChanged = currentSignature !== this.logCache.facialBonesSignature;

        const shouldLog = this.config.debugMode && (
            signatureChanged || 
            timeSinceLastLog > this.logCache.logInterval
        );

        if (shouldLog) {
            this.logCache.facialBonesSignature = currentSignature;
            this.logCache.lastLogTimestamp = currentTime;
        }

        return shouldLog;
    }

    calculateBoneConfidence(bone, boneType) {
        const criteria = this.config.boneCriteria[boneType];
        const name = bone.name.toLowerCase();
        const position = bone.position || { x: 0, y: 0, z: 0 };

        let confidence = 0;
        let confidenceBreakdown = {
            keywordMatch: false,
            heightMatch: false,
            zOffsetMatch: false,
            xOffsetMatch: false
        };

        // Проверка ключевых слов
        confidenceBreakdown.keywordMatch = criteria.keywords.some(keyword => 
            name.includes(keyword)
        );
        confidence += confidenceBreakdown.keywordMatch ? 0.4 : 0;

        // Проверка позиции
        confidenceBreakdown.heightMatch = 
            position.y >= criteria.positionCriteria.heightRange.min && 
            position.y <= criteria.positionCriteria.heightRange.max;
        confidence += confidenceBreakdown.heightMatch ? 0.3 : 0;

        // Проверка смещения по Z
        confidenceBreakdown.zOffsetMatch = 
            Math.abs(position.z) >= criteria.positionCriteria.zOffset.min &&
            Math.abs(position.z) <= criteria.positionCriteria.zOffset.max;
        confidence += confidenceBreakdown.zOffsetMatch ? 0.2 : 0;

        // Проверка смещения по X (только для носа)
        if (boneType === 'nose') {
            confidenceBreakdown.xOffsetMatch = 
                Math.abs(position.x) <= criteria.positionCriteria.xOffset.max;
            confidence += confidenceBreakdown.xOffsetMatch ? 0.1 : 0;
        }

        // Подробное логирование, если включен режим
        if (this.config.verboseLogging) {
            console.log(`🔍 Bone Confidence Breakdown for ${bone.name} (${boneType}):`, {
                confidence: confidence.toFixed(2),
                ...confidenceBreakdown
            });
        }

        return { 
            score: confidence, 
            breakdown: confidenceBreakdown 
        };
    }

    isNoseBone(bone) {
        const noseCriteria = this.config.boneCriteria.nose;
        
        // Исключаем кости, указанные в списке исключений
        if (noseCriteria.excludeNames && 
            noseCriteria.excludeNames.includes(bone.name.toLowerCase())) {
            return false;
        }

        const { score, breakdown } = this.calculateBoneConfidence(bone, 'nose');
        
        // Логирование деталей, если включен режим
        if (this.config.debugMode && this.config.verboseLogging) {
            console.log(`🦴 Nose Bone Analysis: ${bone.name}`, {
                confidence: score.toFixed(2),
                matchDetails: breakdown,
                position: bone.position
            });
        }

        return score >= noseCriteria.positionCriteria.confidenceThreshold;
    }

    isForeheadBone(bone) {
        const foreheadCriteria = this.config.boneCriteria.forehead;
        
        // Исключаем кости, указанные в списке исключений
        if (foreheadCriteria.excludeNames && 
            foreheadCriteria.excludeNames.includes(bone.name.toLowerCase())) {
            return false;
        }

        const { score, breakdown } = this.calculateBoneConfidence(bone, 'forehead');
        
        // Логирование деталей, если включен режим
        if (this.config.debugMode && this.config.verboseLogging) {
            console.log(`🦴 Forehead Bone Analysis: ${bone.name}`, {
                confidence: score.toFixed(2),
                matchDetails: breakdown,
                position: bone.position
            });
        }

        return score >= foreheadCriteria.positionCriteria.confidenceThreshold;
    }

    findFacialBones(model) {
        this.debugCounter.globalLogCounter++;

        const facialBones = {
            nose: [],
            mouth: [],
            cheeks: [],
            forehead: [],
            jaw: []
        };

        const processedBones = new Set(); // Для предотвращения дублирования

        const searchBones = (obj, depth = 0) => {
            if (depth > 10) return;

            if ((obj.type === 'Bone' || obj.type === 'SkinnedMesh') && obj.name) {
                const name = obj.name.toLowerCase();

                // Определение носа
                if (this.isNoseBone(obj) && !processedBones.has(name)) {
                    const { score } = this.calculateBoneConfidence(obj, 'nose');
                    facialBones.nose.push({
                        ...obj,
                        matchReason: 'nose bone detection',
                        matchDetails: {
                            name: obj.name,
                            position: obj.position,
                            confidence: score.toFixed(2),
                            criteria: 'advanced nose detection'
                        }
                    });
                    processedBones.add(name);
                }

                // Определение лба
                if (this.isForeheadBone(obj) && !processedBones.has(name)) {
                    const { score } = this.calculateBoneConfidence(obj, 'forehead');
                    facialBones.forehead.push({
                        ...obj,
                        matchReason: 'forehead bone detection',
                        matchDetails: {
                            name: obj.name,
                            position: obj.position,
                            confidence: score.toFixed(2),
                            criteria: 'advanced forehead detection'
                        }
                    });
                    processedBones.add(name);
                }
            }

            if (obj.children) {
                obj.children.forEach(child => searchBones(child, depth + 1));
            }
        };

        searchBones(model);

        // Сохраняем обнаруженные кости для отладки
        this.detectedBones.nose = facialBones.nose;
        this.detectedBones.forehead = facialBones.forehead;

        // Логирование с новым механизмом
        if (this.shouldLog(facialBones)) {
            this.logDetectedBones(facialBones);
        }

        return facialBones;
    }

    // Расширенный метод логирования
    logDetectedBones(facialBones) {
        console.log('🔎 Detected Facial Bones');
        
        // Логирование носовых костей
        console.log('📍 NOSE Bones:');
        facialBones.nose.forEach((bone, index) => {
            console.log(`#${index + 1}: ${bone.name} (nose bone detection)`);
            console.log(`Details: – ${JSON.stringify({
                name: bone.name,
                position: bone.position,
                confidence: bone.matchDetails.confidence,
                criteria: bone.matchDetails.criteria
            })}`);
        });

        // Логирование лобовых костей
        console.log('📍 FOREHEAD Bones:');
        facialBones.forehead.forEach((bone, index) => {
            console.log(`#${index + 1}: ${bone.name} (forehead bone detection)`);
            console.log(`Details: – ${JSON.stringify({
                name: bone.name,
                position: bone.position,
                confidence: bone.matchDetails.confidence,
                criteria: bone.matchDetails.criteria
            })}`);
        });

        // Сводная статистика
        console.log('📊 Bone Detection Summary:');
        Object.keys(facialBones).forEach(boneType => {
            console.log(`- Total ${boneType.charAt(0).toUpperCase() + boneType.slice(1)} Bones: ${facialBones[boneType].length}`);
        });
    }

    trackEyes(eyeBones, targetPosition = { x: 0, y: 0, z: 0 }) {
        if (!eyeBones.left && !eyeBones.right) return;

        const bones = [eyeBones.left, eyeBones.right].filter(Boolean);

        bones.forEach(bone => {
            bone.rotation.x = this._smoothRotation(
                bone.rotation.x, 
                Math.max(-this.config.maxEyeMovement, Math.min(this.config.maxEyeMovement, targetPosition.x)),
                this.config.smoothingFactor
            );

            bone.rotation.y = this._smoothRotation(
                bone.rotation.y,
                Math.max(-this.config.maxEyeMovement, Math.min(this.config.maxEyeMovement, targetPosition.y)),
                this.config.smoothingFactor
            );
        });
    }

    _smoothRotation(current, target, factor) {
        return current * (1 - factor) + target * factor;
    }

    startBlinkAnimation(eyeBones) {
        const blinkInterval = setInterval(() => {
            if (eyeBones.left && eyeBones.right) {
                eyeBones.left.scale.y = 0.1;
                eyeBones.right.scale.y = 0.1;

                setTimeout(() => {
                    eyeBones.left.scale.y = 1;
                    eyeBones.right.scale.y = 1;
                }, 100);
            }
        }, this.config.blinkFrequency);

        return () => clearInterval(blinkInterval);
    }

    animateFacialBones(facialBones, mousePosition = { x: 0, y: 0 }) {
        const intensity = this.config.facialAnimationIntensity;

        if (facialBones.nose.length > 0) {
            facialBones.nose.forEach(bone => {
                bone.rotation.x = mousePosition.y * intensity;
                bone.rotation.y = mousePosition.x * intensity;
                
                this.debugFacialBone(bone, 'Nose');
            });
        }

        if (facialBones.forehead.length > 0) {
            facialBones.forehead.forEach(bone => {
                bone.rotation.x = mousePosition.y * intensity * 0.5;
                bone.rotation.y = mousePosition.x * intensity * 0.5;
                
                this.debugFacialBone(bone, 'Forehead');
            });
        }

        Object.entries(facialBones).forEach(([type, bones]) => {
            if (type !== 'nose' && type !== 'forehead') {
                bones.forEach(bone => {
                    bone.rotation.x += (Math.random() - 0.5) * intensity;
                    bone.rotation.y += (Math.random() - 0.5) * intensity;
                    bone.rotation.z += (Math.random() - 0.5) * intensity;
                });
            }
        });
    }

    debugFacialBone(bone, boneType) {
        if (!this.config.debugMode) return;

        this.debugCounter[boneType.toLowerCase()]++;
        if (this.debugCounter[boneType.toLowerCase()] % 10 !== 0) return;

        const styles = {
            title: 'background: #222; color: #bada55; padding: 2px; border-radius: 4px;',
            rotation: 'color: blue;',
            position: 'color: green;',
            scale: 'color: purple;'
        };

        console.log(`%c🔍 ${boneType} Bone Diagnostic`, styles.title);

        console.log('%cBone Name:', 'font-weight: bold;', bone.name);
        
        // Безопасное извлечение вращения с числовым приведением
        const rotation = bone.rotation || { x: 0, y: 0, z: 0 };
        console.log('%cRotation:', styles.rotation, {
            x: Number(rotation.x || 0).toFixed(4),
            y: Number(rotation.y || 0).toFixed(4),
            z: Number(rotation.z || 0).toFixed(4)
        });
        
        // Безопасное извлечение позиции с числовым приведением
        const position = bone.position || { x: 0, y: 0, z: 0 };
        console.log('%cPosition:', styles.position, {
            x: Number(position.x || 0).toFixed(4),
            y: Number(position.y || 0).toFixed(4),
            z: Number(position.z || 0).toFixed(4)
        });
        
        // Безопасное извлечение масштаба с числовым приведением
        const scale = bone.scale || { x: 1, y: 1, z: 1 };
        console.log('%cScale:', styles.scale, {
            x: Number(scale.x || 1).toFixed(4),
            y: Number(scale.y || 1).toFixed(4),
            z: Number(scale.z || 1).toFixed(4)
        });
        
        console.log('----------------------------');
    }

    enableDebugMode() {
        this.config.debugMode = true;
    }

    disableDebugMode() {
        this.config.debugMode = false;
    }
}
