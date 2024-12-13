# 3D Demon Character Animation System

## Overview
This module provides a comprehensive system for animating a 3D demon character with advanced interaction mechanics.

## Structure
- `head/`: Head movement and eye tracking mechanics
- `body/`: Idle and breathing animations
- `arms/`: Arm movement and wave animations
- `animations/`: Performance diagnostics and tracking

## Key Features
- Dynamic bone manipulation
- Mouse-based head and eye tracking
- Performance diagnostics
- Modular animation system

## Dependencies
- Three.js (v0.151.0)
- TWEEN.js

## Usage
Import specific modules for targeted animations:

```javascript
import { rotateHead } from './head/rotation.js';
import { waveHand } from './arms/wave.js';
import { idleAnimation } from './body/idle.js';
import { setupAnimationDiagnostics } from './animations/diagnostics.js';
```

## Performance Monitoring
Use `AnimationDiagnostics` to track and analyze animation performance.

## Contribution
Please follow modular design principles and maintain performance standards.
