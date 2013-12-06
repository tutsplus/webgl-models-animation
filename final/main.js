var width = window.innerWidth;
var height = window.innerHeight;

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene;

var cubeGeometry = new THREE.CubeGeometry(100, 100, 100);
var cubeTexture = THREE.ImageUtils.loadTexture('./box.png');
var materials = [];
materials.push(new THREE.MeshLambertMaterial({ map: cubeTexture, color: 0xff0000 })); //right
materials.push(new THREE.MeshLambertMaterial({ map: cubeTexture, color: 0xffff00 })); //left
materials.push(new THREE.MeshLambertMaterial({ map: cubeTexture, color: 0xffffff })); //top
materials.push(new THREE.MeshLambertMaterial({ map: cubeTexture, color: 0x00ffff })); //bottom
materials.push(new THREE.MeshLambertMaterial({ map: cubeTexture, color: 0x0000ff })); //front
materials.push(new THREE.MeshLambertMaterial({ map: cubeTexture, color: 0xff00ff })); //back
var cubeMaterial = new THREE.MeshFaceMaterial(materials);
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
//cube.rotation.y = Math.PI * 45 / 180;
scene.add(cube);

var loader = new THREE.JSONLoader();
var animation;
var skinnedMesh, pivot, item;
loader.load('./model.js', function (geometry, materials) {
	skinnedMesh = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));
	skinnedMesh.position.y = 50;
	skinnedMesh.scale.set(15, 15, 15);
	scene.add(skinnedMesh);

	item = new THREE.Mesh(new THREE.CubeGeometry(100, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
	item.position.x = 50;
	pivot = new THREE.Object3D();
	pivot.scale.set(.15, .15, .15);
	pivot.add(item);
	pivot.useQuaternion = true;
	skinnedMesh.add(pivot);
	
	animate(skinnedMesh);
});

function animate(skinnedMesh) {
	var materials = skinnedMesh.material.materials;

	for (var k in materials) {
		materials[k].skinning = true;
	}

	THREE.AnimationHandler.add(skinnedMesh.geometry.animation);
	animation = new THREE.Animation(skinnedMesh, "ArmatureAction", THREE.AnimationHandler.CATMULLROM);
	animation.play(false, 0);
}

var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
camera.position.y = 160;
camera.position.z = 400;
camera.lookAt(cube.position);

scene.add(camera);

var skyboxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
var skyboxMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
var skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);

scene.add(skybox);

var particles = new THREE.Geometry;
for (var p = 0; p < 2000; p++) {
	var particle = new THREE.Vector3(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250);
	particles.vertices.push(particle);
}
var particleTexture = THREE.ImageUtils.loadTexture('./snowflake.png');
var particleMaterial = new THREE.ParticleBasicMaterial({ map: particleTexture, transparent: true, size: 5 });
var particleSystem = new THREE.ParticleSystem(particles, particleMaterial);

scene.add(particleSystem);

var smokeParticles = new THREE.Geometry;
for (var i = 0; i < 300; i++) {
	var particle = new THREE.Vector3(Math.random() * 32 - 16, Math.random() * 230, Math.random() * 32 - 16);
	smokeParticles.vertices.push(particle);
}
var smokeTexture = THREE.ImageUtils.loadTexture('./smoke.png');
var smokeMaterial = new THREE.ParticleBasicMaterial({ map: smokeTexture, transparent: true, blending: THREE.AdditiveBlending, size: 50, color: 0x111111 });
var smoke = new THREE.ParticleSystem(smokeParticles, smokeMaterial);
smoke.sortParticles = true;
smoke.position.x = -150;

scene.add(smoke);

var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(0, 300, 200);

scene.add(pointLight);

var clock = new THREE.Clock;
var currentSequence = 'standing';

function render() {
	requestAnimationFrame(render);
	
	var delta = clock.getDelta();
	cube.rotation.y -= delta;
	particleSystem.rotation.y += delta;
	
	pivot.position = new THREE.Vector3().getPositionFromMatrix(skinnedMesh.bones[2].skinMatrix);
	pivot.quaternion.setFromRotationMatrix(skinnedMesh.bones[2].skinMatrix);
	
	if (animation) animation.update(delta);
	if (currentSequence == 'standing') {
		if (animation.currentTime > 4) {
			animation.stop();
			animation.play(false, 0); // play the animation not looped, from 0s
		}
	} else if (currentSequence == 'walking') {
		if (animation.currentTime <= 4 || animation.currentTime > 8) {
			animation.stop();
			animation.play(false, 4); // play the animation not looped, from 3s
		}
	}
	
	var particleCount = smokeParticles.vertices.length;
	while (particleCount--) {
		var particle = smokeParticles.vertices[particleCount];
		particle.y += delta * 50;
		if (particle.y >= 230) {
			particle.y = Math.random() * 16;
			particle.x = Math.random() * 32 - 16;
			particle.z = Math.random() * 32 - 16;
		}
	}
	smokeParticles.__dirtyVertices = true;
	
	renderer.render(scene, camera);
}

document.addEventListener('keyup', function (e) {
	if (e.keyCode == 'A'.charCodeAt(0)) {
		currentSequence = (currentSequence == 'standing' ? 'walking': 'standing');
	}
});

render();
