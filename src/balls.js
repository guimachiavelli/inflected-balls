'use strict';

var THREE = require('three'),
    OrbitControls = require('./orbit-controls.js');

var container,
    camera, scene, renderer,
    mesh, zmesh, lightMesh, geometry,
    mouseX = 0, mouseY = 0,
    windowHalfX = window.innerWidth/2,
    windowHalfY = window.innerHeight/2;


function BallWorld(textures, amountOfBalls) {
    this.container = document.createElement('div');
    this.renderer = new THREE.WebGLRenderer({alpha: true});
    this.amountOfBalls = amountOfBalls || 300;

    this.textures = this.loadedTextures(textures);
    this.materials = this.generatedMaterials();
    this.balls = this.generatedBalls();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
}

BallWorld.prototype.setup = function() {
    document.body.appendChild(this.container);

    this.camera.position.z = 5000;

    this.scene.fog = new THREE.Fog(0x000000, 10, 25000);
    this.scene.add(this.light);

    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.container.appendChild( this.renderer.domElement );

    this.bind();
};

BallWorld.prototype.generatedBalls = function() {
    var geometry, i, index, material, mesh, balls;
    geometry = new THREE.SphereGeometry(260, 60, 60, 10, 1, 1, 1);
    balls = [];

    for (i = 0; i < this.amountOfBalls; i += 1) {
        index = Math.floor(Math.random() * this.materials.length);
        material = this.materials[index];

        mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = Math.random() * 10000 - 5000;
        mesh.position.y = Math.random() * 10000 - 5000;
        mesh.position.z = Math.random() * 10000 - 5000;

        mesh.rotation.y = Math.random() * 2 * Math.PI;

        mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 4 + 1;

        balls.push(mesh);

        this.scene.add(mesh);
    }

    return balls;
};

BallWorld.prototype.bind = function() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
};

BallWorld.prototype.loadedTextures = function(textures) {
    if (!textures) {
        return [];
    }

    return textures.map(function(texture){
        texture = texture;
        return THREE.ImageUtils.loadTexture(texture);
    });
};

BallWorld.prototype.camera = new THREE.PerspectiveCamera(45,
                                     window.innerWidth/window.innerHeight,
                                     1, 25000);


BallWorld.prototype.scene = new THREE.Scene();
BallWorld.prototype.light = new THREE.PointLight(0xffffff);

BallWorld.prototype.generatedMaterials = function() {
    var materials = [
        new THREE.MeshBasicMaterial({ color: 0xffaa00, wireframe: true } ),
        new THREE.MeshBasicMaterial({ color: 0x000bff,
                                    blending: THREE.AdditiveBlending,
                                    transparent: true,
                                    depthWrite: false
        })
    ];

    if (this.textures.length < 1) {
        return materials;
    }

    return materials.concat(this.textures.map(function(texture) {
        return new THREE.MeshBasicMaterial({map: texture});
    }));
};

BallWorld.prototype.onWindowResize = function() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
};

BallWorld.prototype.animate = function() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
};

BallWorld.prototype.render = function() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
};

module.exports = BallWorld;
