import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Grid,
  Compass,
  Tag
} from 'lucide-react';

interface BlochSphereProps {
  inputVector: [number, number, number];
  outputVector?: [number, number, number] | null;
  inputLabel?: string;
  outputLabel?: string;
  size?: number;
  interactive?: boolean;
}

interface ProjectedLabel {
  text: string;
  symbol: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({
  inputVector,
  outputVector,
  inputLabel = '|ψ⟩ Input',
  outputLabel = 'Bob Received',
  size = 320,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mesh references for dynamic updates
  const inputArrowRef = useRef<THREE.Group | null>(null);
  const outputArrowRef = useRef<THREE.Group | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);

  // Camera Orbit State
  const defaultOrbit = { distance: 3.2, theta: Math.PI / 4, phi: Math.PI / 3 };
  const orbitRef = useRef({ ...defaultOrbit });
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });

  // UI Toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);

  // Update Camera Position from Spherical Orbit
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { distance, theta, phi } = orbitRef.current;

    // In our coordinate system where Z is UP:
    // x = r * sin(phi) * cos(theta)
    // y = r * sin(phi) * sin(theta)
    // z = r * cos(phi)
    const x = distance * Math.sin(phi) * Math.cos(theta);
    const y = distance * Math.sin(phi) * Math.sin(theta);
    const z = distance * Math.cos(phi);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Reset Camera View to default
  const handleResetCamera = () => {
    orbitRef.current = { ...defaultOrbit };
    updateCameraPosition();
  };

  // Helper to construct a glowing 3D vector arrow
  const createVectorGroup = (colorHex: number) => {
    const group = new THREE.Group();

    // Shaft (Cylinder)
    const shaftGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.0, 16);
    shaftGeo.translate(0, 0.5, 0); // Origin at base
    const shaftMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.2,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.name = 'shaft';
    group.add(shaft);

    // Tip (Cone)
    const coneGeo = new THREE.ConeGeometry(0.045, 0.12, 16);
    coneGeo.translate(0, 0.06, 0);
    const coneMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.name = 'cone';
    group.add(cone);

    // Endpoint sphere
    const sphereGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const endpointSphere = new THREE.Mesh(sphereGeo, sphereMat);
    endpointSphere.name = 'endpoint';
    group.add(endpointSphere);

    return group;
  };

  // Update a vector group's direction and length
  const updateVectorMesh = (
    group: THREE.Group,
    target: [number, number, number],
    visible: boolean = true
  ) => {
    group.visible = visible;
    if (!visible) return;

    const [tx, ty, tz] = target;
    const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
    if (len < 1e-6) {
      group.visible = false;
      return;
    }

    const dir = new THREE.Vector3(tx, ty, tz).normalize();

    // Default cylinder points along +Y in Three.js
    // Align vector group to target direction
    const defaultAxis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(defaultAxis, dir);
    group.setRotationFromQuaternion(quaternion);

    // Scale shaft & reposition tip
    const shaft = group.getObjectByName('shaft') as THREE.Mesh;
    const cone = group.getObjectByName('cone') as THREE.Mesh;
    const endpoint = group.getObjectByName('endpoint') as THREE.Mesh;

    const coneHeight = 0.12;
    const shaftLen = Math.max(0.001, len - coneHeight);

    if (shaft) {
      shaft.scale.set(1, shaftLen, 1);
    }
    if (cone) {
      cone.position.set(0, shaftLen, 0);
    }
    if (endpoint) {
      endpoint.position.set(0, len, 0);
    }
  };

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera (Z is UP in quantum convention)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.up.set(0, 0, 1); // Crucial: Z is vertical (+Z = |0>, -Z = |1>)
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(3, 4, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc084fc, 0.8);
    dirLight2.position.set(-3, -2, -3);
    scene.add(dirLight2);

    // 5. Translucent Glass Bloch Sphere Surface
    const sphereGeo = new THREE.SphereGeometry(1.0, 48, 36);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e1b4b,
      transparent: true,
      opacity: 0.18,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // 6. Wireframe Grid Group (Equator & Meridians)
    const gridGroup = new THREE.Group();
    gridGroupRef.current = gridGroup;

    // Equator Ring (Z = 0 plane)
    const equatorGeo = new THREE.BufferGeometry();
    const equatorPts: THREE.Vector3[] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      equatorPts.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
    }
    equatorGeo.setFromPoints(equatorPts);
    const equatorMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
    gridGroup.add(new THREE.Line(equatorGeo, equatorMat));

    // Meridians (X = 0 plane & Y = 0 plane)
    const meridianXGeo = new THREE.BufferGeometry();
    const meridianXPts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      meridianXPts.push(new THREE.Vector3(0, Math.cos(angle), Math.sin(angle)));
    }
    meridianXGeo.setFromPoints(meridianXPts);
    const meridianMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.25 });
    gridGroup.add(new THREE.Line(meridianXGeo, meridianMat));

    const meridianYGeo = new THREE.BufferGeometry();
    const meridianYPts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      meridianYPts.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    }
    meridianYGeo.setFromPoints(meridianYPts);
    gridGroup.add(new THREE.Line(meridianYGeo, meridianMat));

    // Latitudes (Z = ±0.5 circles)
    for (const zLat of [0.5, -0.5]) {
      const latGeo = new THREE.BufferGeometry();
      const latPts: THREE.Vector3[] = [];
      const radLat = Math.sqrt(1.0 - zLat * zLat);
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        latPts.push(new THREE.Vector3(radLat * Math.cos(angle), radLat * Math.sin(angle), zLat));
      }
      latGeo.setFromPoints(latPts);
      const latMat = new THREE.LineDashedMaterial({ color: 0x64748b, transparent: true, opacity: 0.2, dashSize: 0.05, gapSize: 0.05 });
      const latLine = new THREE.Line(latGeo, latMat);
      latLine.computeLineDistances();
      gridGroup.add(latLine);
    }
    scene.add(gridGroup);

    // 7. Coordinate Axes Group (+X, +Y, +Z)
    const axesGroup = new THREE.Group();
    axesGroupRef.current = axesGroup;

    const axisLen = 1.25;
    const createAxis = (start: THREE.Vector3, end: THREE.Vector3, colorHex: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
      const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65 });
      return new THREE.Line(geo, mat);
    };

    // X Axis (Red/Pink, |+> to |->)
    axesGroup.add(createAxis(new THREE.Vector3(-axisLen, 0, 0), new THREE.Vector3(axisLen, 0, 0), 0xf43f5e));
    // Y Axis (Green/Emerald, |+i> to |-i>)
    axesGroup.add(createAxis(new THREE.Vector3(0, -axisLen, 0), new THREE.Vector3(0, axisLen, 0), 0x10b981));
    // Z Axis (Cyan/Blue, |0> to |1>)
    axesGroup.add(createAxis(new THREE.Vector3(0, 0, -axisLen), new THREE.Vector3(0, 0, axisLen), 0x38bdf8));

    // Origin sphere (completely mixed state center I/2)
    const originGeo = new THREE.SphereGeometry(0.03, 16, 16);
    const originMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    axesGroup.add(new THREE.Mesh(originGeo, originMat));

    scene.add(axesGroup);

    // 8. State Vector Meshes
    // Input Vector (cyan)
    const inGroup = createVectorGroup(0x38bdf8);
    inputArrowRef.current = inGroup;
    scene.add(inGroup);

    // Output Vector (rose / magenta)
    const outGroup = createVectorGroup(0xf43f5e);
    outputArrowRef.current = outGroup;
    scene.add(outGroup);

    // Trajectory dashed line between Input and Output tips
    const trajGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const trajMat = new THREE.LineDashedMaterial({ color: 0xf43f5e, dashSize: 0.04, gapSize: 0.03, transparent: true, opacity: 0.6 });
    const trajLine = new THREE.Line(trajGeo, trajMat);
    trajLine.computeLineDistances();
    trajectoryLineRef.current = trajLine;
    scene.add(trajLine);

    // 9. Animation & Projection Render Loop
    const poleDefinitions = [
      { text: '+Z', symbol: '|0⟩', pos: new THREE.Vector3(0, 0, 1.25), color: 'var(--color-info)' },
      { text: '-Z', symbol: '|1⟩', pos: new THREE.Vector3(0, 0, -1.25), color: 'var(--text-secondary)' },
      { text: '+X', symbol: '|+⟩', pos: new THREE.Vector3(1.25, 0, 0), color: 'var(--color-danger)' },
      { text: '-X', symbol: '|-⟩', pos: new THREE.Vector3(-1.25, 0, 0), color: 'var(--color-danger)' },
      { text: '+Y', symbol: '|+i⟩', pos: new THREE.Vector3(0, 1.25, 0), color: 'var(--color-success)' },
      { text: '-Y', symbol: '|-i⟩', pos: new THREE.Vector3(0, -1.25, 0), color: 'var(--color-success)' },
    ];

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Render Three.js WebGL
      renderer.render(scene, camera);

      // Project Pole Labels to 2D Screen
      if (showLabels) {
        const projected = poleDefinitions.map((def) => {
          const v = def.pos.clone().project(camera);
          // Convert normalized device coordinates to canvas pixels
          const px = ((v.x + 1) * size) / 2;
          const py = ((-v.y + 1) * size) / 2;
          // Visible if in front of camera
          const isVisible = v.z < 1.0;
          return {
            text: def.text,
            symbol: def.symbol,
            color: def.color,
            x: px,
            y: py,
            visible: isVisible,
          };
        });
        setProjectedLabels(projected);
      }
    };

    animate();

    // 10. Cleanup on unmount
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, [size, updateCameraPosition, showLabels]);

  // Synchronize dynamic vector coordinates
  useEffect(() => {
    if (!inputArrowRef.current) return;
    updateVectorMesh(inputArrowRef.current, inputVector, true);

    if (outputArrowRef.current) {
      if (outputVector) {
        updateVectorMesh(outputArrowRef.current, outputVector, true);

        // Update trajectory line
        if (trajectoryLineRef.current) {
          trajectoryLineRef.current.visible = true;
          const pts = [
            new THREE.Vector3(inputVector[0], inputVector[1], inputVector[2]),
            new THREE.Vector3(outputVector[0], outputVector[1], outputVector[2]),
          ];
          trajectoryLineRef.current.geometry.setFromPoints(pts);
          trajectoryLineRef.current.computeLineDistances();
        }
      } else {
        outputArrowRef.current.visible = false;
        if (trajectoryLineRef.current) {
          trajectoryLineRef.current.visible = false;
        }
      }
    }
  }, [inputVector, outputVector]);

  // Visibility toggle synchronization
  useEffect(() => {
    if (gridGroupRef.current) {
      gridGroupRef.current.visible = showGrid;
    }
    if (axesGroupRef.current) {
      axesGroupRef.current.visible = showAxes;
    }
  }, [showGrid, showAxes]);

  // Pointer Event Handlers for 3D Orbiting and Zooming
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - prevPointerRef.current.x;
    const deltaY = e.clientY - prevPointerRef.current.y;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };

    // Orbit sensitivity
    const speed = 0.007;
    orbitRef.current.theta -= deltaX * speed;
    // Clamp phi so camera does not flip over the poles
    orbitRef.current.phi = Math.max(0.08, Math.min(Math.PI - 0.08, orbitRef.current.phi - deltaY * speed));

    updateCameraPosition();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already released
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.002;
    orbitRef.current.distance = Math.max(2.1, Math.min(5.5, orbitRef.current.distance + e.deltaY * zoomSpeed));
    updateCameraPosition();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="qr-dark-surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 50%, rgba(30, 27, 75, 0.45) 0%, rgba(10, 15, 30, 0.85) 75%)',
          border: '1px solid var(--border-subtle)',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Crisp HTML Screen-Projected Pole Labels */}
        {showLabels &&
          projectedLabels.map((lbl, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${lbl.x}px`,
                top: `${lbl.y}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                opacity: lbl.visible ? 0.95 : 0.25,
                transition: 'opacity 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
              }}
            >
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: lbl.color,
                  fontFamily: 'monospace',
                }}
              >
                {lbl.symbol}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                {lbl.text}
              </span>
            </div>
          ))}

        {/* 3D Scene Action Toolbar */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
            zIndex: 10,
          }}
        >
          {/* Reset Camera View */}
          <button
            onClick={handleResetCamera}
            title="Reset Camera Viewing Angle"
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px 6px',
              color: 'var(--color-info)',
              fontSize: '0.68rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <RotateCcw size={11} />
            <span>Reset View</span>
          </button>

          {/* Toggle Grid */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Wireframe Grid"
            style={{
              background: showGrid ? 'rgba(56, 189, 248, 0.2)' : 'var(--surface-inset)',
              border: showGrid ? '1px solid var(--color-info)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '4px 6px',
              color: showGrid ? 'var(--color-info)' : 'var(--text-secondary)',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Grid size={11} />
          </button>

          {/* Toggle Axes */}
          <button
            onClick={() => setShowAxes(!showAxes)}
            title="Toggle Coordinate Axes"
            style={{
              background: showAxes ? 'rgba(192, 38, 211, 0.2)' : 'var(--surface-inset)',
              border: showAxes ? '1px solid var(--accent-magenta)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '4px 6px',
              color: showAxes ? 'var(--accent-magenta)' : 'var(--text-secondary)',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Compass size={11} />
          </button>

          {/* Toggle Labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            title="Toggle Pole Labels"
            style={{
              background: showLabels ? 'rgba(16, 185, 129, 0.2)' : 'var(--surface-inset)',
              border: showLabels ? '1px solid var(--color-success)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '4px 6px',
              color: showLabels ? 'var(--color-success)' : 'var(--text-secondary)',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Tag size={11} />
          </button>
        </div>

        {/* Orbit Drag Instruction Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '8px',
            fontSize: '0.65rem',
            color: 'rgba(148, 163, 184, 0.7)',
            pointerEvents: 'none',
          }}
        >
          Drag to Orbit 3D · Wheel to Zoom
        </div>
      </div>

      {/* Vector Legend & Coordinate Readout */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '10px',
          fontSize: '0.74rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--color-info)',
              display: 'inline-block',
              boxShadow: '0 0 6px var(--color-info)',
            }}
          />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{inputLabel}</span>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
            ({inputVector[0].toFixed(2)}, {inputVector[1].toFixed(2)}, {inputVector[2].toFixed(2)})
          </span>
        </div>

        {outputVector && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'var(--color-danger)',
                display: 'inline-block',
                boxShadow: '0 0 6px var(--color-danger)',
              }}
            />
            <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{outputLabel}</span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              ({outputVector[0].toFixed(2)}, {outputVector[1].toFixed(2)}, {outputVector[2].toFixed(2)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
