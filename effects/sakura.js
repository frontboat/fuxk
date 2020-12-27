import { OBJLoader } from "../third_party/OBJLoader.js";
import {
  DynamicDrawUsage,
  Group,
  Object3D,
  InstancedMesh,
  RawShaderMaterial,
  Quaternion,
  Vector3,
  DoubleSide,
} from "../third_party/three.module.js";
import { addPromise } from "../js/loader.js";

const sakuraVS = `#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in mat4 instanceMatrix;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
}
`;

const sakuraFS = `#version 300 es
precision highp float;

in vec2 vUv;

out vec4 color;

void main() {
  vec4 c1 = vec4(192., 179., 186., 255.)/255.;
  vec4 c2 = vec4(171., 143., 150., 255.)/255.;
  
  color = vec4(mix(c1.rgb, c2.rgb, vUv.x),1.);

}`;

const loaded = addPromise();

const objLoader = new OBJLoader();
const count = 1000;
const dummy = new Object3D();

class Sakura extends Group {
  constructor() {
    super();
    objLoader.load("assets/cherry_blossom.obj", (e) => {
      const geometry = e.children[0].geometry;

      const material = new RawShaderMaterial({
        vertexShader: sakuraVS,
        fragmentShader: sakuraFS,
        side: DoubleSide,
      });

      const mesh = new InstancedMesh(geometry, material, count);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      this.add(mesh);
      this.mesh = mesh;
      this.init();
      loaded();
    });
  }

  init() {
    if (this.mesh) {
      const r = 30;
      const time = performance.now() * 0.001;
      for (let i = 0; i < count; i++) {
        const x = r * (Math.random() * 1 - 0.5);
        const y = r * (Math.random() * 1 - 0.5);
        const z = r * (Math.random() * 1 - 0.5);

        dummy.position.set(x, y, z);
        dummy.rotation.x = Math.random() * 2 * Math.PI;
        dummy.rotation.y = Math.random() * 2 * Math.PI;
        dummy.rotation.z = Math.random() * 2 * Math.PI;

        dummy.updateMatrix();

        this.mesh.setMatrixAt(i, dummy.matrix);
      }

      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  update(dt) {
    const q = new Quaternion().setFromAxisAngle(
      new Vector3(1, 0.5, 0).normalize(),
      Math.PI / 40
    );
    if (this.mesh) {
      const r = 30;
      for (let i = 0; i < count; i++) {
        this.mesh.getMatrixAt(i, dummy.matrix);

        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        dummy.position.y -= 0.01;
        if (dummy.position.y < -15) dummy.position.y = 15;
        dummy.quaternion.multiply(q);
        dummy.updateMatrix();

        this.mesh.setMatrixAt(i, dummy.matrix);
      }

      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

const sakura = new Sakura();

export { sakura };