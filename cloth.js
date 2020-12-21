import * as THREE from 'three';
import {Particle} from './particle.js'
export {Cloth};

function Cloth( w, h, restDistance, mass, clothFunction ) {

  w = w || 10;
  h = h || 10;
  this.w = w;
  this.h = h;

  const particles = [];
  const constraints = [];

  // Create particles
  for ( let v = 0; v <= h; v ++ ) {

    for ( let u = 0; u <= w; u ++ ) {

      particles.push(
        new Particle( u / w, v / h, 0, mass, clothFunction )
      );

    }

  }

  // Structural

  for ( let v = 0; v < h; v ++ ) {

    for ( let u = 0; u < w; u ++ ) {

      constraints.push( [
        particles[ index( u, v ) ],
        particles[ index( u, v + 1 ) ],
        restDistance
      ] );

      constraints.push( [
        particles[ index( u, v ) ],
        particles[ index( u + 1, v ) ],
        restDistance
      ] );

    }

  }

  for ( let u = w, v = 0; v < h; v ++ ) {

    constraints.push( [
      particles[ index( u, v ) ],
      particles[ index( u, v + 1 ) ],
      restDistance

    ] );

  }

  for ( let v = h, u = 0; u < w; u ++ ) {

    constraints.push( [
      particles[ index( u, v ) ],
      particles[ index( u + 1, v ) ],
      restDistance
    ] );

  }


  // While many systems use shear and bend springs,
  // the relaxed constraints model seems to be just fine
  // using structural springs.
  // Shear
  // const diagonalDist = Math.sqrt(restDistance * restDistance * 2);


  // for (v=0;v<h;v++) {
  // 	for (u=0;u<w;u++) {

  // 		constraints.push([
  // 			particles[index(u, v)],
  // 			particles[index(u+1, v+1)],
  // 			diagonalDist
  // 		]);

  // 		constraints.push([
  // 			particles[index(u+1, v)],
  // 			particles[index(u, v+1)],
  // 			diagonalDist
  // 		]);

  // 	}
  // }


  this.particles = particles;
  this.constraints = constraints;

  function index( u, v ) {

    return u + v * ( w + 1 );

  }

  this.index = index;

} //Cloth
