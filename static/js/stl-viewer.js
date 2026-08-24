// Lightweight interactive STL viewer, used by the `stl-viewer` shortcode.
// Loads three.js from a CDN as ES modules — no build step needed.
// The plain (non-"+esm") example files import bare "three" specifiers
// internally, which a bare <script type="module"> can't resolve without
// an import map. jsDelivr's "+esm" endpoint rewrites those to full CDN
// URLs for us, so we use it for all three imports.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/+esm';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/STLLoader.js/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js/+esm';

function initViewer(container) {
  if (container.dataset.stlInit) return;
  container.dataset.stlInit = '1';

  const src = container.dataset.stl;
  const width = container.clientWidth || 300;
  const height = container.clientHeight || 300;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(1, 1, 1);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.4);
  fill.position.set(-1, -0.5, -1);
  scene.add(fill);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  const loader = new STLLoader();
  loader.load(
    src,
    (geometry) => {
      geometry.computeBoundingBox();
      geometry.center();

      const material = new THREE.MeshStandardMaterial({
        color: 0x9aa7b8,
        metalness: 0.15,
        roughness: 0.65,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const dist = maxDim * 2.0;
      camera.position.set(dist, dist * 0.7, dist);
      camera.near = maxDim / 100;
      camera.far = maxDim * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();

      const loading = container.querySelector('.stl-viewer-loading');
      if (loading) loading.remove();
    },
    undefined,
    () => {
      const loading = container.querySelector('.stl-viewer-loading');
      if (loading) loading.textContent = 'Could not load model.';
    }
  );

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

function initAll() {
  document.querySelectorAll('[data-stl]').forEach(initViewer);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
