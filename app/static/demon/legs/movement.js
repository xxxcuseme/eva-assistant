function debugBoneHierarchy(model) {
    console.log('Начинаем анализ модели:', model);
    
    if (!model) {
        console.error('Модель не передана в debugBoneHierarchy');
        return;
    }

    let bonesFound = 0;
    
    console.group('Иерархия костей модели:');
    
    function logBone(bone, level = 0) {
        bonesFound++;
        const indent = '  '.repeat(level);
        console.log(`${indent}Кость #${bonesFound}: ${bone.name}`, {
            type: bone.type,
            isBone: bone.isBone,
            position: {
                x: bone.position.x.toFixed(3),
                y: bone.position.y.toFixed(3),
                z: bone.position.z.toFixed(3)
            },
            rotation: {
                order: bone.rotation.order,
                x: (bone.rotation.x * 180 / Math.PI).toFixed(2) + '°',
                y: (bone.rotation.y * 180 / Math.PI).toFixed(2) + '°',
                z: (bone.rotation.z * 180 / Math.PI).toFixed(2) + '°'
            },
            parent: bone.parent ? bone.parent.name : 'нет',
            children: bone.children.length
        });
        
        // Логируем все дочерние объекты, не только кости
        bone.children.forEach(child => {
            logBone(child, level + 1);
        });
    }

    console.log('Начинаем обход модели...');
    
    // Логируем всю сцену для отладки
    model.traverse(obj => {
        console.log('Найден объект:', {
            name: obj.name,
            type: obj.type,
            isBone: obj.isBone,
            isSkinnedMesh: obj.isSkinnedMesh
        });
        
        if (obj.isSkinnedMesh) {
            console.log('Найден SkinnedMesh:', obj.name);
            if (obj.skeleton) {
                console.log('Скелет:', {
                    bones: obj.skeleton.bones.length,
                    boneNames: obj.skeleton.bones.map(b => b.name)
                });
            }
        }
    });

    // Ищем корневые кости
    model.traverse(obj => {
        if (obj.isBone && (!obj.parent || !obj.parent.isBone)) {
            console.log('Найдена корневая кость:', obj.name);
            logBone(obj);
        }
    });
    
    console.log(`Всего найдено костей: ${bonesFound}`);
    console.groupEnd();
}

export function legWalkAnimation(model) {
    console.log('legWalkAnimation вызвана с моделью:', model);
    
    // Добавляем отладочный вывод при инициализации
    debugBoneHierarchy(model);
    
    let leftUpperLeg = null;
    let leftLowerLeg = null;
    let rightUpperLeg = null;
    let rightLowerLeg = null;
    let base = null;

    // Поиск SkinnedMesh и скелета
    let skinnedMesh = null;
    model.traverse(obj => {
        if (obj.isSkinnedMesh) {
            skinnedMesh = obj;
            console.log('Найден SkinnedMesh:', {
                name: obj.name,
                hasSkeleton: !!obj.skeleton,
                bones: obj.skeleton ? obj.skeleton.bones.length : 0
            });
        }
    });

    if (skinnedMesh && skinnedMesh.skeleton) {
        console.log('Кости в скелете:', skinnedMesh.skeleton.bones.map(b => b.name));
    }

    // Находим кости ног и логируем результаты
    model.traverse(obj => {
        if (obj.isBone) {
            const name = obj.name.toLowerCase();
            console.log(`Найдена кость: ${obj.name}`, {
                position: obj.position.toArray(),
                rotation: {
                    order: obj.rotation.order,
                    x: obj.rotation.x * 180 / Math.PI,
                    y: obj.rotation.y * 180 / Math.PI,
                    z: obj.rotation.z * 180 / Math.PI
                }
            });
            
            if (name === 'piernal') {
                leftUpperLeg = obj;
                console.log('Найдена левая верхняя нога');
            }
            if (name === 'pierna2l') {
                leftLowerLeg = obj;
                console.log('Найдена левая нижняя нога');
            }
            if (name === 'piernar') {
                rightUpperLeg = obj;
                console.log('Найдена правая верхняя нога');
            }
            if (name === 'pierna2r') {
                rightLowerLeg = obj;
                console.log('Найдена правая нижняя нога');
            }
            if (name === 'base') {
                base = obj;
                console.log('Найдена базовая кость');
            }
        }
    });

    // Проверяем, что все необходимые кости найдены
    if (!leftUpperLeg || !rightUpperLeg) {
        console.warn('Не найдены необходимые кости ног:', {
            leftUpperLeg: !!leftUpperLeg,
            leftLowerLeg: !!leftLowerLeg,
            rightUpperLeg: !!rightUpperLeg,
            rightLowerLeg: !!rightLowerLeg,
            base: !!base
        });
        return;
    }

    // Остальной код анимации...
    // ... (оставляем как есть)
}

export function legIdleAnimation(model) {
    model.traverse(obj => {
        if (obj.isBone) {
            const name = obj.name.toLowerCase();
            if (name === 'piernal' || name === 'piernar') {
                // Сброс позиции
                obj.position.set(
                    name === 'piernal' ? -0.3 : 0.3, // X: влево/вправо
                    0,    // Y: внизу
                    0     // Z: вперед/назад
                );
                
                // Сброс поворота
                obj.rotation.set(0, 0, 0);
                
                // Немного разводим ноги
                obj.rotation.z = (name === 'piernal' ? 1 : -1) * Math.PI / 12;
                
                obj.updateMatrix();
                obj.updateMatrixWorld(true);
            }
        }
    });
}

class LegSafetySystem {
  constructor(model) {
    this.model = model;
    this.legBones = {
      left: ['PiernaL', 'Pierna2L'],
      right: ['PiernaR', 'Pierna2R']
    };
    this.safetyConfig = {
      maxDisplacement: 1.2,   
      bodyWidth: 1.8,         
      logThreshold: 0.5,      
      smoothingFactor: 0.15   
    };
  }

  findBonesByNames(bones, nameList) {
    return nameList
      .map(name => 
        bones.find(bone => 
          bone.name.toLowerCase() === name.toLowerCase()
        )
      )
      .filter(Boolean);  
  }

  calculateSafeZone(bone) {
    const safeX = this.safetyConfig.bodyWidth / 2;
    const safeY = this.safetyConfig.maxDisplacement;
    return { safeX, safeY };
  }

  constrainBoneMovement(bone) {
    if (!bone) return;

    const safeZone = this.calculateSafeZone(bone);
    const safeX = safeZone.safeX;
    const safeY = safeZone.safeY;

    const smoothX = bone.position.x * (1 - this.safetyConfig.smoothingFactor) + 
                    Math.max(-safeX * 1.2, Math.min(safeX * 1.2, bone.position.x)) * this.safetyConfig.smoothingFactor;
    
    const smoothY = bone.position.y * (1 - this.safetyConfig.smoothingFactor) + 
                    Math.max(-safeY * 1.2, Math.min(safeY * 1.2, bone.position.y)) * this.safetyConfig.smoothingFactor;

    bone.position.x = smoothX;
    bone.position.y = smoothY;
  }

  applyLegSafety(skinnedMesh) {
    if (!skinnedMesh || !skinnedMesh.skeleton) {
      return;
    }

    const bones = skinnedMesh.skeleton.bones;
    
    const legBones = [
      ...this.findBonesByNames(bones, this.legBones.left),
      ...this.findBonesByNames(bones, this.legBones.right)
    ];

    legBones.forEach(bone => {
      if (bone) {
        this.constrainBoneMovement(bone);
      }
    });
  }
}

export { LegSafetySystem };
