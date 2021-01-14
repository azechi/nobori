// 参考にした https://raw.githubusercontent.com/mrdoob/three.js/bbc05ad6538e7014c81008d766f1b742b2cdfdbc/examples/webgl_animation_cloth.html
// 参考にしたファイルのライセンス
// Copyright © 2010-2021 three.js authors
// https://raw.githubusercontent.com/mrdoob/three.js/75406c631355980994186c84316c606140ac045c/LICENSE

import * as THREE from "three";
export { Particle };

const DAMPING = 0.09;
const DRAG = 1 - DAMPING;

function Particle(x, y, z, mass, clothFunction) {
  this.position = new THREE.Vector3();
  this.previous = new THREE.Vector3();
  this.original = new THREE.Vector3();
  this.a = new THREE.Vector3(0, 0, 0); // acceleration
  this.mass = mass;
  this.invMass = 1 / mass;
  this.tmp = new THREE.Vector3();
  this.tmp2 = new THREE.Vector3();

  // init

  clothFunction(x, y, this.position); // position
  clothFunction(x, y, this.previous); // previous
  clothFunction(x, y, this.original);
}

// Force -> Acceleration
Particle.prototype.addForce = function (force) {
  this.a.add(this.tmp2.copy(force).multiplyScalar(this.invMass));
};

// Performs Verlet integration

Particle.prototype.integrate = function (timesq) {
  const newPos = this.tmp.subVectors(this.position, this.previous);
  newPos.multiplyScalar(DRAG).add(this.position);
  newPos.add(this.a.multiplyScalar(timesq));

  this.tmp = this.previous;
  this.previous = this.position;
  this.position = newPos;

  this.a.set(0, 0, 0);
};
