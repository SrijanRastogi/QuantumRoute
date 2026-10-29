import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface QuantumHeroCanvasProps {
  onNodeClick?: (nodeId: string) => void;
}

export const QuantumHeroCanvas: React.FC<QuantumHeroCanvasProps> = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return;

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene & Camera Setup
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 2. Node Setup (6 Nodes: Alice, 4 Repeaters, Bob)
    const nodeDefs = [
      { id: 'Alice', name: 'Alice', pos: new THREE.Vector3(-3.2, 0.8, 0.2), color: 0x38bdf8, size: 0.22, role: 'Source Node' },
      { id: 'RepA', name: 'Repeater α', pos: new THREE.Vector3(-1.4, 1.8, -0.6), color: 0xa855f7, size: 0.17, role: 'Quantum Relay' },
      { id: 'RepB', name: 'Repeater β', pos: new THREE.Vector3(-1.0, -1.5, 0.5), color: 0xc084fc, size: 0.17, role: 'Quantum Relay' },
      { id: 'RepC', name: 'Repeater γ', pos: new THREE.Vector3(1.2, 1.6, 0.4), color: 0xd946ef, size: 0.17, role: 'Quantum Relay' },
      { id: 'RepD', name: 'Repeater δ', pos: new THREE.Vector3(1.5, -1.2, -0.4), color: 0xa855f7, size: 0.17, role: 'Quantum Relay' },
      { id: 'Bob', name: 'Bob', pos: new THREE.Vector3(3.2, -0.2, 0.3), color: 0xf59e0b, size: 0.22, role: 'Target Node' },
    ];

    const constellationGroup = new THREE.Group();
    scene.add(constellationGroup);

    // Node spheres & outer glow rings
    const nodeSpheres: THREE.Mesh[] = [];
    const ringMeshes: THREE.Mesh[] = [];

    nodeDefs.forEach((def) => {
      // Core sphere
      const sphereGeo = new THREE.SphereGeometry(def.size, 24, 24);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: def.color,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(def.pos);
      constellationGroup.add(sphere);
      nodeSpheres.push(sphere);

      // Orbital glow halo
      const ringGeo = new THREE.RingGeometry(def.size * 1.3, def.size * 1.6, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(def.pos);
      constellationGroup.add(ring);
      ringMeshes.push(ring);
    });

    // 3. Entanglement Link Filaments
    const edgePairs = [
      [0, 1], // Alice -> RepA
      [0, 2], // Alice -> RepB
      [1, 3], // RepA -> RepC
      [1, 2], // RepA -> RepB
      [2, 4], // RepB -> RepD
      [3, 4], // RepC -> RepD
      [3, 5], // RepC -> Bob
      [4, 5], // RepD -> Bob
    ];

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.35,
    });

    const activeRouteMaterial = new THREE.LineBasicMaterial({
      color: 0xf0abfc,
      transparent: true,
      opacity: 0.85,
    });

    // Optimal route path: Alice (0) -> RepA (1) -> RepC (3) -> Bob (5)
    const activeRouteSet = new Set(['0-1', '1-3', '3-5']);

    edgePairs.forEach(([i, j]) => {
      const p1 = nodeDefs[i].pos;
      const p2 = nodeDefs[j].pos;
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      const mat = activeRouteSet.has(key) ? activeRouteMaterial : lineMaterial;
      const line = new THREE.Line(lineGeo, mat);
      constellationGroup.add(line);
    });

    // 4. Entangled Flying Photon Wave Packets
    const packetCount = 14;
    const packetGeometry = new THREE.SphereGeometry(0.045, 12, 12);
    const packetMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });

    interface PhotonPacket {
      mesh: THREE.Mesh;
      edgeIdx: number;
      progress: number;
      speed: number;
      forward: boolean;
    }

    const photonPackets: PhotonPacket[] = [];
    for (let k = 0; k < packetCount; k++) {
      const packetMesh = new THREE.Mesh(packetGeometry, packetMaterial);
      const edgeIdx = Math.floor(Math.random() * edgePairs.length);
      const progress = Math.random();
      const speed = 0.003 + Math.random() * 0.004;
      const forward = Math.random() > 0.5;

      const [i, j] = edgePairs[edgeIdx];
      const p1 = nodeDefs[i].pos;
      const p2 = nodeDefs[j].pos;
      packetMesh.position.lerpVectors(p1, p2, progress);

      constellationGroup.add(packetMesh);
      photonPackets.push({ mesh: packetMesh, edgeIdx, progress, speed, forward });
    }

    // 5. Background Quantum Field Dust (Subtle star field)
    const dustCount = 180;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);

    for (let d = 0; d < dustCount * 3; d += 3) {
      dustPositions[d] = (Math.random() - 0.5) * 16;
      dustPositions[d + 1] = (Math.random() - 0.5) * 12;
      dustPositions[d + 2] = (Math.random() - 0.5) * 8 - 2;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0xc084fc,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
    });
    const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustParticles);

    // 6. Interactive Mouse Parallax
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      if (prefersReducedMotion) return;
      const rect = mount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.25;
      targetRotationX = -y * 0.20;
    };

    window.addEventListener('mousemove', handlePointerMove);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      clock += 0.015;

      if (!prefersReducedMotion) {
        // Smooth rotation damping
        currentRotationX += (targetRotationX - currentRotationX) * 0.05;
        currentRotationY += (targetRotationY - currentRotationY) * 0.05;

        // Subtle organic constellation float
        constellationGroup.rotation.y = currentRotationY + Math.sin(clock * 0.4) * 0.06;
        constellationGroup.rotation.x = currentRotationX + Math.cos(clock * 0.3) * 0.04;

        // Pulsing rings
        ringMeshes.forEach((ring, idx) => {
          const s = 1.0 + Math.sin(clock * 2.0 + idx * 0.8) * 0.18;
          ring.scale.set(s, s, s);
          ring.lookAt(camera.position);
        });

        // Move photon wave packets along Bell links
        photonPackets.forEach((p) => {
          p.progress += p.speed;
          if (p.progress > 1.0) {
            p.progress = 0.0;
            p.edgeIdx = Math.floor(Math.random() * edgePairs.length);
          }
          const [u, v] = edgePairs[p.edgeIdx];
          const start = p.forward ? nodeDefs[u].pos : nodeDefs[v].pos;
          const end = p.forward ? nodeDefs[v].pos : nodeDefs[u].pos;
          p.mesh.position.lerpVectors(start, end, p.progress);
        });

        // Gentle dust drift
        dustParticles.rotation.y = clock * 0.01;
      } else {
        // Reduced motion: face rings to camera once and hold steady
        ringMeshes.forEach((ring) => ring.lookAt(camera.position));
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Observer
    const handleResize = () => {
      if (!mount) return;
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      resizeObserver.disconnect();
      renderer.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      packetGeometry.dispose();
      packetMaterial.dispose();
      lineMaterial.dispose();
      activeRouteMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '440px',
        overflow: 'hidden',
        cursor: 'grab',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      {/* Subtle overlay corner cues for interactive 3D */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--surface-inset)',
          border: '1px solid rgba(147, 51, 234, 0.25)',
          borderRadius: '20px',
          padding: '4px 10px',
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-success)',
            boxShadow: '0 0 8px var(--color-success)',
          }}
        />
        Interactive 3D Quantum Topology
      </div>
    </div>
  );
};
