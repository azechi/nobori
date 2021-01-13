// 参考にした https://raw.githubusercontent.com/mrdoob/three.js/bbc05ad6538e7014c81008d766f1b742b2cdfdbc/examples/webgl_animation_cloth.html
// 参考にしたファイルのライセンス
// Copyright © 2010-2021 three.js authors
// https://raw.githubusercontent.com/mrdoob/three.js/75406c631355980994186c84316c606140ac045c/LICENSE
 
import * as THREE from "./_snowpack/pkg/three.js";

import Stats from "./stats.module.js";

import { OrbitControls } from "./OrbitControls.js";

import { Cloth } from "./cloth.js";

/*
 * Cloth Simulation using a relaxed constraints solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

const restDistance = 25;
const xSegs = 10;
const ySegs = 10;

const clothFunction = (function plane(width, height) {
  return function (u, v, target) {
    const x = (u - 0.5) * width;
    const y = (v + 0.5) * height;
    const z = 0;

    target.set(x, y, z);
  };
})(restDistance * xSegs, restDistance * ySegs);

const MASS = 0.1;
const cloth = new Cloth(xSegs, ySegs, restDistance, MASS, clothFunction);

const GRAVITY = 981 * 1.4;
const gravity = new THREE.Vector3(0, -GRAVITY, 0).multiplyScalar(MASS);

const TIMESTEP = 18 / 1000;
const TIMESTEP_SQ = TIMESTEP * TIMESTEP;

let pins = [];

const windForce = new THREE.Vector3(0, 0, 0);

const tmpForce = new THREE.Vector3();

const diff = new THREE.Vector3();

function satisfyConstraints(p1, p2, distance) {
  diff.subVectors(p2.position, p1.position);
  const currentDist = diff.length();
  if (currentDist === 0) return; // prevents division by 0
  const correction = diff.multiplyScalar(1 - distance / currentDist);
  const correctionHalf = correction.multiplyScalar(0.5);
  p1.position.add(correctionHalf);
  p2.position.sub(correctionHalf);
}

function simulate(now) {
  const windStrength = Math.cos(now / 7000) * 20 + 40;

  windForce.set(
    Math.sin(now / 2000),
    Math.cos(now / 3000),
    Math.sin(now / 1000)
  );
  windForce.normalize();
  windForce.multiplyScalar(windStrength);

  // Aerodynamics forces

  const particles = cloth.particles;

  let indx;
  const normal = new THREE.Vector3();
  const indices = clothGeometry.index;
  const normals = clothGeometry.attributes.normal;

  for (let i = 0, il = indices.count; i < il; i += 3) {
    for (let j = 0; j < 3; j++) {
      indx = indices.getX(i + j);
      normal.fromBufferAttribute(normals, indx);
      tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(windForce));
      particles[indx].addForce(tmpForce);
    }
  }

  for (let i = 0, il = particles.length; i < il; i++) {
    const particle = particles[i];
    particle.addForce(gravity);

    particle.integrate(TIMESTEP_SQ);
  }

  // Start Constraints

  const constraints = cloth.constraints;
  const il = constraints.length;

  for (let i = 0; i < il; i++) {
    const constraint = constraints[i];
    satisfyConstraints(constraint[0], constraint[1], constraint[2]);
  }

  // Floor Constraints

  for (let i = 0, il = particles.length; i < il; i++) {
    const particle = particles[i];
    const pos = particle.position;
    if (pos.y < -250) {
      pos.y = -250;
    }
  }

  // Pin Constraints
  for (let i = 0, il = pins.length; i < il; i++) {
    const xy = pins[i];
    const p = particles[xy];
    p.position.copy(p.original);
    p.previous.copy(p.original);
  }

  nobori.rotation.y += 0.01;
}

pins = [...Array(cloth.w + 1).keys()];

let container, stats;
let camera, scene, renderer;

let clothGeometry;
let object;

let nobori;

init();
animate(0);

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  // scene
  scene = new THREE.Scene();
  // camera
  camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.set(1000, 50, 1500);

  // lights
  scene.add(new THREE.AmbientLight(0x666666));

  // nobori-group
  nobori = new THREE.Group();
  scene.add(nobori);

  // cloth material
  const loader = new THREE.TextureLoader();
  let clothTexture = loader.load("./circuit_pattern.png");

  //
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgb(0, 0, 255)";
  ctx.font = "100px serif";
  ctx.fillText("あ", 0, canvas.height / 2);

  clothTexture = new THREE.Texture(canvas);
  clothTexture.needsUpdate = true;
  //
  clothTexture.anisotropy = 16;

  const clothMaterial = new THREE.MeshLambertMaterial({
    map: clothTexture,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
  });

  // cloth geometry

  clothGeometry = new THREE.ParametricBufferGeometry(
    clothFunction,
    cloth.w,
    cloth.h
  );

  // cloth mesh

  object = new THREE.Mesh(clothGeometry, clothMaterial);
  object.position.set(125, 0, 0);
  object.castShadow = true;
  //scene.add( object );
  nobori.add(object);

  object.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: clothTexture,
    alphaTest: 0.5,
  });

  // poles

  const poleGeo = new THREE.BoxBufferGeometry(5, 375, 5);
  const poleMat = new THREE.MeshLambertMaterial();

  let mesh = new THREE.Mesh(poleGeo, poleMat);
  mesh.position.x = 0;
  mesh.position.y = -62;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  //scene.add( mesh );
  nobori.add(mesh);

  // ポールの横棒
  mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(255, 5, 5), poleMat);
  mesh.position.y = -250 + 750 / 2;
  mesh.position.x = 125;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  //scene.add( mesh );
  nobori.add(mesh);

  // ポールの台
  const gg = new THREE.BoxBufferGeometry(10, 10, 10);
  mesh = new THREE.Mesh(gg, poleMat);
  mesh.position.y = -250;
  mesh.position.x = 125;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  mesh = new THREE.Mesh(gg, poleMat);
  mesh.position.y = -250;
  mesh.position.x = -125;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  // renderer

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);

  renderer.outputEncoding = THREE.sRGBEncoding;

  renderer.shadowMap.enabled = true;

  // controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minDistance = 1000;
  controls.maxDistance = 5000;

  // performance monitor

  stats = new Stats();
  container.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize, false);

  //
  if (typeof TESTING !== "undefined") {
    for (let i = 0; i < 50; i++) {
      simulate(500 - 10 * i);
    }
  }
} // init

//

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate(now) {
  requestAnimationFrame(animate);
  simulate(now);
  render();
  stats.update();
}

function render() {
  const p = cloth.particles;

  for (let i = 0, il = p.length; i < il; i++) {
    const v = p[i].position;

    clothGeometry.attributes.position.setXYZ(i, v.x, v.y, v.z);
  }

  clothGeometry.attributes.position.needsUpdate = true;

  clothGeometry.computeVertexNormals();

  renderer.render(scene, camera);
}
