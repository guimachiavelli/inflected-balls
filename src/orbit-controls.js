'use strict';

var THREE = require('three');

var OrbitControls = function (camera, el) {
    this.camera = camera;
    this.el = el;
    this.target = new THREE.Vector3();

    this.dispatcher = new THREE.EventDispatcher();

    // Set to false to disable this control
    this.enabled = true;

    this.minDistance = 500;
    this.maxDistance = 20000;

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, must be a sub-interval of the interval [-Math.PI, Math.PI].
    this.minAzimuthAngle = -Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    // This option actually enables dollying in and out;
    // left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = true;
    this.zoomSpeed = 0.25;

    // Set to false to disable rotating
    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    // Set to false to disable panning
    this.enablePan = true;

    // for reset
    this.target0 = this.target.clone();
    this.position0 = this.camera.position.clone();
    this.zoom0 = this.camera.zoom;

    this.changeEvent = { type: 'change' };
    this.startEvent = { type: 'start' };
    this.endEvent = { type: 'end' };

    this.state = this.STATE.NONE;
    this.scale = 1;

    this.EPS = 0.000001;

    // current position in spherical coordinates
    this.theta = 0;
    this.phi = 0;

    this.phiDelta = 0;
    this.thetaDelta = 0;
    this.panOffset = new THREE.Vector3();
    this.zoomChanged = false;

    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();

    this.panStart = new THREE.Vector2();
    this.panEnd = new THREE.Vector2();
    this.panDelta = new THREE.Vector2();

    this.dollyStart = new THREE.Vector2();
    this.dollyEnd = new THREE.Vector2();
    this.dollyDelta = new THREE.Vector2();

    this.bind();
    this.update();
};

OrbitControls.prototype.STATE = {
    NONE : - 1,
    ROTATE : 0,
    DOLLY : 1,
    PAN : 2,
    TOUCH_ROTATE : 3,
    TOUCH_DOLLY : 4,
    TOUCH_PAN : 5
};

OrbitControls.prototype.mouseButtons = {
    ORBIT: THREE.MOUSE.LEFT,
    ZOOM: THREE.MOUSE.MIDDLE,
    PAN: THREE.MOUSE.RIGHT
};

OrbitControls.prototype.onContextMenu = function(event) {
    event.preventDefault();
};

OrbitControls.prototype.handleMouseWheel = function(event) {
    var delta = 0;

    if (event.wheelDelta !== undefined) {
        delta = event.wheelDelta;
    } else if (event.detail !== undefined) {
        delta = - event.detail;
    }

    if (delta > 0) {
        this.dollyOut(this.getZoomScale());
    } else if (delta < 0) {
        this.dollyIn(this.getZoomScale());
    }

    this.update();
};

OrbitControls.prototype.onMouseWheel = function (event) {
    if (this.enabled === false ||
        this.enableZoom === false ||
        this.state !== this.STATE.NONE) {
            return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.handleMouseWheel(event);

    this.dispatcher.dispatchEvent(this.startEvent);
    this.dispatcher.dispatchEvent(this.endEvent);
};

OrbitControls.prototype.dollyIn = function dollyIn(dollyScale) {
    if (!(this.camera instanceof THREE.PerspectiveCamera)) {
        this.enableZoom = false;
        return;
    }

    this.scale /= dollyScale;
};

OrbitControls.prototype.dollyOut = function(dollyScale) {
    if (!this.camera instanceof THREE.PerspectiveCamera) {
        this.enableZoom = false;
        return;
    }

    this.scale *= dollyScale;
};

OrbitControls.prototype.getZoomScale = function() {
    return Math.pow(0.95, this.zoomSpeed);
};

OrbitControls.prototype.handleMouseDownRotate = function(event) {
    this.rotateStart.set(event.clientX, event.clientY);
};

OrbitControls.prototype.handleMouseDownDolly = function(event) {
    this.dollyStart.set(event.clientX, event.clientY);
};

OrbitControls.prototype.handleMouseDownPan = function(event) {
    this.panStart.set(event.clientX, event.clientY);
};

OrbitControls.prototype.handleMouseMoveRotate = function(event) {
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

    var element = this.el === document ? this.el.body : this.el;

    // rotating across whole screen goes 360 degrees around
    this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed);

    // rotating up and down along whole screen attempts to go 360, but limited to 180
    this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed);

    this.rotateStart.copy(this.rotateEnd);

    this.update();
};

OrbitControls.prototype.handleMouseMoveDolly = function(event) {
    this.dollyEnd.set(event.clientX, event.clientY);

    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

    if (this.dollyDelta.y > 0) {
        this.dollyIn(this.getZoomScale());
    } else if (this.dollyDelta.y < 0) {
        this.dollyOut(this.getZoomScale());
    }

    this.dollyStart.copy(this.dollyEnd);

    this.update();
};

OrbitControls.prototype.handleMouseMovePan = function(event) {
    this.panEnd.set(event.clientX, event.clientY);
    this.panDelta.subVectors(this.panEnd, this.panStart);
    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
    this.update();
};

OrbitControls.prototype.onMouseDown = function(event) {
    if (this.enabled === false && this.state === this.STATE.NONE) {
        return;
    }

    event.preventDefault();

    if (event.button === this.mouseButtons.ORBIT && this.enableRotate) {
        this.handleMouseDownRotate(event);
        this.state = this.STATE.ROTATE;
    }

    if (event.button === this.mouseButtons.ZOOM && this.enableZoom) {
        this.handleMouseDownDolly(event);
        this.state = this.STATE.DOLLY;
    }

    if (event.button === this.mouseButtons.PAN && this.enablePan) {
        this.handleMouseDownPan(event);
        this.state = this.STATE.PAN;
    }

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mouseout', this.onMouseUp.bind(this));

    this.dispatcher.dispatchEvent(this.startEvent);
};

OrbitControls.prototype.onMouseMove = function(event) {
    if (this.enabled === false) {
        return;
    }

    event.preventDefault();

    if (this.state === this.STATE.ROTATE && this.enableRotate) {
        this.handleMouseMoveRotate(event);
    }

    if (this.state === this.STATE.DOLLY && this.enableZoom) {
        this.handleMouseMoveDolly(event);
    }

    if (this.state === this.STATE.PAN && this.enablePan) {
        this.handleMouseMovePan(event);
    }
};

OrbitControls.prototype.onMouseUp = function(event) {
    if (this.enabled === false) {
        return;
    }

    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mouseout', this.onMouseUp);

    this.dispatcher.dispatchEvent(this.endEvent);

    this.state = this.STATE.NONE;
};

OrbitControls.prototype.rotateLeft = function(angle) {
    this.thetaDelta -= angle;
};

OrbitControls.prototype.rotateUp = function(angle) {
    this.phiDelta -= angle;
};

OrbitControls.prototype.dispose = function() {
    this.el.removeEventListener('contextmenu', this.onContextMenu);
    this.el.removeEventListener('mousedown', onMouseDown, false);
    this.el.removeEventListener('mousewheel', this.onMouseWheel);
    this.el.removeEventListener('MozMousePixelScroll',
                                 this.onMouseWheel); // firefox

    this.el.removeEventListener('touchstart', onTouchStart, false);
    this.el.removeEventListener('touchend', onTouchEnd, false);
    this.el.removeEventListener('touchmove', onTouchMove, false);

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);
    document.removeEventListener('mouseout', onMouseUp, false);

    window.removeEventListener('keydown', onKeyDown, false);
};

OrbitControls.prototype.getPolarAngle = function () {
    return this.phi;
};

OrbitControls.prototype.getAzimuthalAngle = function () {
    return this.theta;
};

OrbitControls.prototype.reset = function () {
    this.target.copy(this.target0);
    this.camera.position.copy(this.position0);
    this.camera.zoom = this.zoom0;

    this.camera.updateProjectionMatrix();
    this.dispatcher.dispatchEvent(this.changeEvent);

    this.update();

    this.state = this.STATE.NONE;
};


OrbitControls.prototype.update = function() {
    var offset, quat, quatInverse, lastPosition, lastQuaternion, position;

    offset = new THREE.Vector3();

    // so camera.up is the orbit axis
    quat = new THREE.Quaternion()
                    .setFromUnitVectors(this.camera.up,
                                        new THREE.Vector3(0, 1, 0));

    quatInverse = quat.clone().inverse();

    lastPosition = new THREE.Vector3();
    lastQuaternion = new THREE.Quaternion();

    position = this.camera.position;

    offset.copy(position).sub(this.target);

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(quat);

    // angle from z-axis around y-axis
    this.theta = Math.atan2(offset.x, offset.z);

    // angle from y-axis
    this.phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z),
                          offset.y);

    this.theta += this.thetaDelta;
    this.phi += this.phiDelta;

    // restrict this.theta to be between desired limits
    this.theta = Math.max(this.minAzimuthAngle,
                          Math.min(this.maxAzimuthAngle, this.theta));

    // restrict this.phi to be between desired limits
    this.phi = Math.max(this.minPolarAngle,
                        Math.min(this.maxPolarAngle, this.phi));

    // restrict this.phi to be betwee this.EPS and PI-this.EPS
    this.phi = Math.max(this.EPS, Math.min(Math.PI - this.EPS, this.phi));

    var radius = offset.length() * this.scale;

    // restrict radius to be between desired limits
    radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

    // move target to panned location
    this.target.add(this.panOffset);

    offset.x = radius * Math.sin(this.phi) * Math.sin(this.theta);
    offset.y = radius * Math.cos(this.phi);
    offset.z = radius * Math.sin(this.phi) * Math.cos(this.theta);

    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(quatInverse);

    position.copy(this.target).add(offset);

    this.camera.lookAt(this.target);

    this.thetaDelta = 0;
    this.phiDelta = 0;

    this.scale = 1;
    this.panOffset.set(0, 0, 0);

    // update condition is:
    // min(camera displacement, camera rotation in radians)^2 > this.EPS
    // using small-angle approximation cos(x/2) = 1 - x^2 / 8

    if (this.zoomChanged === false ||
        lastPosition.distanceToSquared(this.camera.position) < this.EPS ||
        8 * (1 - lastQuaternion.dot(this.camera.quaternion)) < this.EPS) {
            return false;
        }

    this.dispatcher.dispatchEvent(this.changeEvent);

    lastPosition.copy(this.camera.position);
    lastQuaternion.copy(this.camera.quaternion);
    this.zoomChanged = false;

    return true;
};


OrbitControls.prototype.getAutoRotationAngle = function() {
    return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
}

OrbitControls.prototype.panLeft = function() {
    var v = new THREE.Vector3();

    return function panLeft(distance, objectMatrix) {
        var te = objectMatrix.elements;

        // get X column of objectMatrix
        v.set(te[ 0 ], te[ 1 ], te[ 2 ]);

        v.multiplyScalar(- distance);

        this.panOffset.add(v);
    };
}();

OrbitControls.prototype.panUp = function() {
    var v = new THREE.Vector3();

    return function panUp(distance, objectMatrix) {
        var te = objectMatrix.elements;

        // get Y column of objectMatrix
        v.set(te[ 4 ], te[ 5 ], te[ 6 ]);

        v.multiplyScalar(distance);

        this.panOffset.add(v);
    };
}();

// deltaX and deltaY are in pixels; right and down are positive
OrbitControls.prototype.pan = function() {
    var offset = new THREE.Vector3();

    return function(deltaX, deltaY) {
        var element, position, targetDistance;

        element = this.el === document ? this.el.body : this.el;

        if (!(this.camera instanceof THREE.PerspectiveCamera)) {
            return;
        }

        // perspective
        position = this.camera.position;
        offset.copy(position).sub(this.target);
        targetDistance = offset.length();

        // half of the fov is center to top of screen
        targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);

        // we actually don't use screenWidth, since perspective camera is fixed to screen height
        this.panLeft(2 * deltaX * targetDistance / element.clientHeight, this.camera.matrix);
        this.panUp(2 * deltaY * targetDistance / element.clientHeight, this.camera.matrix);
    };
}();


OrbitControls.prototype.handleTouchStartRotate = function(event) {
    this.rotateStart.set(event.touches[0].pageX,
                         event.touches[0].pageY);
};

OrbitControls.prototype.handleTouchStartDolly = function(event) {
    var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
    var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

    var distance = Math.sqrt(dx * dx + dy * dy);

    this.dollyStart.set(0, distance);
};

OrbitControls.prototype.handleTouchStartPan = function(event) {
    this.panStart.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
};

OrbitControls.prototype.handleTouchMoveRotate = function(event) {
    var element;

    this.rotateEnd.set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

    element = this.el === document ? this.el.body : this.el;

    // rotating across whole screen goes 360 degrees around
    this.rotateLeft((2 * Math.PI * this.rotateDelta.x) /
               element.clientWidth * this.rotateSpeed);

    // rotating up and down along whole screen attempts to go 360,
    // but limited to 180
    this.rotateUp((2 * Math.PI * this.rotateDelta.y) /
             element.clientHeight * this.rotateSpeed);

    this.rotateStart.copy(this.rotateEnd);

    this.update();
};

OrbitControls.prototype.handleTouchMoveDolly = function(event) {
    var dx, dy, distance;

    dx = event.touches[0].pageX - event.touches[1].pageX;
    dy = event.touches[0].pageY - event.touches[1].pageY;

    distance = Math.sqrt(dx * dx + dy * dy);

    this.dollyEnd.set(0, distance);

    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

    if (this.dollyDelta.y > 0) {
        this.dollyOut(this.getZoomScale());
    } else if (this.dollyDelta.y < 0) {
        this.dollyIn(this.getZoomScale());
    }

    this.dollyStart.copy(this.dollyEnd);

    this.update();
};

OrbitControls.prototype.handleTouchMovePan = function(event) {
    this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);

    this.panDelta.subVectors(this.panEnd, this.panStart);

    this.pan(this.panDelta.x, this.panDelta.y);

    this.panStart.copy(this.panEnd);

    this.update();
};

OrbitControls.prototype.onTouchStart = function(event) {
    if (this.enabled === false) return;

    switch (event.touches.length) {
        case 1:	// one-fingered touch: rotate
            if (this.enableRotate === false) {
                return;
            }
            this.handleTouchStartRotate(event);
            this.state = this.STATE.TOUCH_ROTATE;
            break;

        case 2:	// two-fingered touch: dolly
            if (this.enableZoom === false) {
                return;
            }
            this.handleTouchStartDolly(event);
            this.state = this.STATE.TOUCH_DOLLY;
            break;

        case 3: // three-fingered touch: pan
            if (this.enablePan === false) {
                return;
            }
            this.handleTouchStartPan(event);
            this.state = this.STATE.TOUCH_PAN;
            break;

        default:
            this.state = this.STATE.NONE;
    }

    if (this.state === this.STATE.NONE) {
        return;
    }

    this.dispatcher.dispatchEvent(this.startEvent);
};

OrbitControls.prototype.onTouchMove = function(event) {
    if (this.enabled === false) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
        case 1: // one-fingered touch: rotate
            if (this.enableRotate === false) {
                return;
            }
            this.handleTouchMoveRotate(event);
            break;

        case 2: // two-fingered touch: dolly
            if (this.enableZoom === false) {
                return;
            }
            this.handleTouchMoveDolly(event);
            break;

        case 3: // three-fingered touch: pan
            if (this.enablePan === false) {
                return;
            }
            this.handleTouchMovePan(event);
            break;

        default:
            this.state = this.STATE.NONE;
    }
};

OrbitControls.prototype.onTouchEnd = function() {
    if (this.enabled === false) {
        return;
    }

    this.dispatcher.dispatchEvent(this.endEvent);
    this.state = this.STATE.NONE;
};


OrbitControls.prototype.bind = function() {
    this.el.addEventListener('contextmenu', this.onContextMenu);

    this.el.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.el.addEventListener('mousewheel', this.onMouseWheel.bind(this));
    this.el.addEventListener('MozMousePixelScroll',
                             this.onMouseWheel.bind(this));

    this.el.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.el.addEventListener('touchend', this.onTouchEnd.bind(this));
    this.el.addEventListener('touchmove', this.onTouchMove.bind(this));
};

module.exports = OrbitControls;
