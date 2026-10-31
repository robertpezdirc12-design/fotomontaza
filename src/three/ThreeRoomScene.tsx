/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createWoodParquetTexture,
  createMarbleTexture,
  createRugTexture
} from './textures';
import {
  STYLE_3D_PALETTES,
  createCompositeSofa,
  createCompositeCoffeeTable,
  createCompositeFloorLamp,
  createCompositePlant,
  createCompositeWallArt,
  applyExplodedDisplacement
} from './proceduralModels';
import {
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Compass,
  Sparkles,
  X,
  Eye,
  Camera,
  Layers,
  Check
} from 'lucide-react';

interface ThreeRoomSceneProps {
  initialStyleId?: string;
  onClose?: () => void;
}

const CAMERA_PRESETS = {
  overview: { pos: new THREE.Vector3(3.4, 2.4, 4.2), lookAt: new THREE.Vector3(0, 0.8, 0), label: 'Overview' },
  sofa: { pos: new THREE.Vector3(1.2, 1.2, 1.9), lookAt: new THREE.Vector3(0, 0.6, 0), label: 'Sofa Focus' },
  floorplan: { pos: new THREE.Vector3(0.1, 5.5, 0.1), lookAt: new THREE.Vector3(0, 0, 0), label: 'Top View' },
  cinematic: { pos: new THREE.Vector3(-2.8, 1.6, 3.2), lookAt: new THREE.Vector3(0.2, 0.7, -0.2), label: 'Cinematic' }
};

type CameraPresetKey = keyof typeof CAMERA_PRESETS;
type LightingMood = 'daylight' | 'golden' | 'evening';
type FloorType = 'style' | 'light' | 'walnut' | 'weathered' | 'charcoal' | 'marble';

export default function ThreeRoomScene({ initialStyleId = 'japandi', onClose }: ThreeRoomSceneProps) {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const [activeStyle, setActiveStyle] = useState<string>(initialStyleId);
  const [activeCamera, setActiveCamera] = useState<CameraPresetKey>('overview');
  const [activeMood, setActiveMood] = useState<LightingMood>('daylight');
  const [explodedVal, setExplodedVal] = useState<number>(0);
  const [activeFloor, setActiveFloor] = useState<FloorType>('style');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState(false);

  // References for scene update dispatch without tearing down WebGL canvas
  const updateStyleRef = useRef<((styleId: string) => void) | null>(null);
  const updateCameraRef = useRef<((preset: CameraPresetKey) => void) | null>(null);
  const updateMoodRef = useRef<((mood: LightingMood) => void) | null>(null);
  const updateFloorRef = useRef<((floor: FloorType) => void) | null>(null);
  const targetExplodedRef = useRef<number>(0);
  const takeSnapshotRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    // 1. Detect Software WebGL (SwiftShader, llvmpipe) via renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // Required for snapshot capture
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2efe9);
    scene.fog = new THREE.Fog(0xf2efe9, 9, 26);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.copy(CAMERA_PRESETS.overview.pos);

    // 4. Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(4, 5.5, 3.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xe8f0f8, 0x3d352e, 0.9);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 6. Camera Controls with Exponential Damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 1.2;
    controls.maxDistance = 10;
    controls.target.copy(CAMERA_PRESETS.overview.lookAt);

    // 7. Architectural Room Shell & Furniture Root Group
    const roomRoot = new THREE.Group();
    scene.add(roomRoot);

    // Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.08
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = !isSoftwareGl;
    floor.position.y = 0;
    roomRoot.add(floor);

    // Back Wall
    const backWallGeo = new THREE.BoxGeometry(8, 3.4, 0.1);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf3efe7,
      roughness: 0.9,
      metalness: 0.0
    });
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 1.7, -2.6);
    backWall.receiveShadow = !isSoftwareGl;
    roomRoot.add(backWall);

    // Left Wall
    const leftWallGeo = new THREE.BoxGeometry(0.1, 3.4, 8);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-3.5, 1.7, 0);
    leftWall.receiveShadow = !isSoftwareGl;
    roomRoot.add(leftWall);

    // Baseboards
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(8, 0.14, 0.03), baseboardMat);
    bbBack.position.set(0, 0.07, -2.54);
    roomRoot.add(bbBack);

    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 8), baseboardMat);
    bbLeft.position.set(-3.44, 0.07, 0);
    roomRoot.add(bbLeft);

    // Area Rug
    const rugGeo = new THREE.PlaneGeometry(3.6, 2.6);
    rugGeo.rotateX(-Math.PI / 2);
    const rugMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.0
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(0, 0.01, 0.2);
    rug.receiveShadow = !isSoftwareGl;
    roomRoot.add(rug);

    // Dynamic Furniture Group (swapped when style changes)
    let furnitureGroup = new THREE.Group();
    roomRoot.add(furnitureGroup);

    let currentFloorType: FloorType = 'style';
    let currentStyleId = initialStyleId;

    const updateFloorTexture = (type: FloorType, styleId: string) => {
      const palette = STYLE_3D_PALETTES[styleId] || STYLE_3D_PALETTES.japandi;
      if (type === 'marble') {
        floorMat.map = createMarbleTexture(renderer);
        floorMat.roughness = 0.15;
        floorMat.metalness = 0.15;
      } else {
        const tone = type === 'style' ? palette.floorTone : type;
        floorMat.map = createWoodParquetTexture(renderer, tone);
        floorMat.roughness = 0.35;
        floorMat.metalness = 0.08;
      }
      floorMat.needsUpdate = true;
    };

    // Reusable Room Builder
    const buildRoomForStyle = (styleId: string) => {
      currentStyleId = styleId;
      while (furnitureGroup.children.length > 0) {
        const obj = furnitureGroup.children[0];
        furnitureGroup.remove(obj);
      }

      const palette = STYLE_3D_PALETTES[styleId] || STYLE_3D_PALETTES.japandi;

      updateFloorTexture(currentFloorType, styleId);

      wallMat.color.setHex(palette.wallColor);
      wallMat.needsUpdate = true;

      scene.background = new THREE.Color(palette.wallColor);
      if (scene.fog) scene.fog.color.setHex(palette.wallColor);

      rugMat.map = createRugTexture(renderer, palette.rugType);
      rugMat.needsUpdate = true;

      // 1. Composite Hero Sofa
      const sofa = createCompositeSofa(palette);
      sofa.position.set(0, 0, -0.6);
      furnitureGroup.add(sofa);

      // 2. Composite Coffee Table
      const coffeeTable = createCompositeCoffeeTable(palette);
      coffeeTable.position.set(0, 0, 0.7);
      furnitureGroup.add(coffeeTable);

      // 3. Composite Floor Lamp
      const lamp = createCompositeFloorLamp(palette);
      lamp.position.set(-1.8, 0, -1.2);
      lamp.rotation.y = 0.45;
      furnitureGroup.add(lamp);

      // 4. Composite Botanical Plant
      const plant = createCompositePlant(palette);
      plant.position.set(1.9, 0, -1.4);
      furnitureGroup.add(plant);

      // 5. Composite Wall Art
      const art = createCompositeWallArt(palette);
      art.position.set(0, 2.15, -2.54);
      furnitureGroup.add(art);

      // Re-apply current exploded state
      applyExplodedDisplacement(furnitureGroup, currentExploded);
    };

    // Initial build
    buildRoomForStyle(initialStyleId);

    // Lighting mood controller
    const applyLightingMood = (mood: LightingMood) => {
      if (mood === 'golden') {
        keyLight.color.setHex(0xffcb85);
        keyLight.intensity = 2.6;
        keyLight.position.set(5.5, 3.2, 4.0);
        hemiLight.color.setHex(0xffdfb8);
        hemiLight.groundColor.setHex(0x5a3c20);
        hemiLight.intensity = 0.8;
      } else if (mood === 'evening') {
        keyLight.color.setHex(0x6b8db5);
        keyLight.intensity = 0.7;
        keyLight.position.set(3, 4, 3);
        hemiLight.color.setHex(0x23334d);
        hemiLight.groundColor.setHex(0x181a20);
        hemiLight.intensity = 0.5;
      } else {
        keyLight.color.setHex(0xfffaed);
        keyLight.intensity = 2.2;
        keyLight.position.set(4, 5.5, 3.5);
        hemiLight.color.setHex(0xe8f0f8);
        hemiLight.groundColor.setHex(0x3d352e);
        hemiLight.intensity = 0.9;
      }
    };

    // Camera preset transition target
    let targetCamPos = CAMERA_PRESETS.overview.pos.clone();
    let targetCamLook = CAMERA_PRESETS.overview.lookAt.clone();
    let isTransitioningCamera = false;

    const setCameraTarget = (preset: CameraPresetKey) => {
      const config = CAMERA_PRESETS[preset];
      targetCamPos.copy(config.pos);
      targetCamLook.copy(config.lookAt);
      isTransitioningCamera = true;
    };

    // Bind dispatch handlers to refs
    updateStyleRef.current = (styleId: string) => {
      buildRoomForStyle(styleId);
    };

    updateCameraRef.current = (preset: CameraPresetKey) => {
      setCameraTarget(preset);
    };

    updateMoodRef.current = (mood: LightingMood) => {
      applyLightingMood(mood);
    };

    updateFloorRef.current = (floorType: FloorType) => {
      currentFloorType = floorType;
      updateFloorTexture(floorType, currentStyleId);
    };

    takeSnapshotRef.current = () => {
      renderer.render(scene, camera);
      const dataUrl = renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `space-lift-3d-${currentStyleId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    };

    // 8. Animation & Render Loop with Exponential Damping
    let frameId = 0;
    let currentExploded = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();

      // Smooth camera transition damping
      if (isTransitioningCamera) {
        camera.position.lerp(targetCamPos, 0.06);
        controls.target.lerp(targetCamLook, 0.06);
        if (camera.position.distanceTo(targetCamPos) < 0.02 && controls.target.distanceTo(targetCamLook) < 0.02) {
          isTransitioningCamera = false;
        }
      }

      // Smooth exponential damping on exploded view
      const targetExp = targetExplodedRef.current;
      if (Math.abs(currentExploded - targetExp) > 0.001) {
        currentExploded = THREE.MathUtils.damp(currentExploded, targetExp, 7, delta);
        applyExplodedDisplacement(furnitureGroup, currentExploded);
      }

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // 9. Resize Handling
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleSelectStyle = (styleId: string) => {
    setActiveStyle(styleId);
    updateStyleRef.current?.(styleId);
  };

  const handleSelectCamera = (preset: CameraPresetKey) => {
    setActiveCamera(preset);
    updateCameraRef.current?.(preset);
  };

  const handleSelectMood = (mood: LightingMood) => {
    setActiveMood(mood);
    updateMoodRef.current?.(mood);
  };

  const handleSelectFloor = (floor: FloorType) => {
    setActiveFloor(floor);
    updateFloorRef.current?.(floor);
  };

  const handleExplodedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setExplodedVal(val);
    targetExplodedRef.current = val;
  };

  const handleSnapshotClick = () => {
    takeSnapshotRef.current?.();
    setSnapshotToast(true);
    setTimeout(() => setSnapshotToast(false), 2400);
  };

  const STYLE_LIST = [
    { id: 'japandi', name: 'Japandi' },
    { id: 'industrial', name: 'Industrial' },
    { id: 'midcentury', name: 'Mid-Century' },
    { id: 'biophilic', name: 'Biophilic' },
    { id: 'luxury', name: 'Luxury' },
    { id: 'bohemian', name: 'Bohemian' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'coastal', name: 'Coastal' },
    { id: 'artdeco', name: 'Art Deco' },
    { id: 'farmhouse', name: 'Farmhouse' }
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#16171a] select-none font-sans">
      {/* Three.js Canvas Container (Isolated ref) */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-3 bg-[#1e2025]/85 text-white px-4 py-2 rounded-full border border-white/10 pointer-events-auto shadow-md">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-syncopate text-xs tracking-wider font-bold">Space Lift 3D</span>
          <span className="text-[11px] text-white/50 border-l border-white/20 pl-2">Procedural PBR Room</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 3D Snapshot Camera Button */}
          <button
            onClick={handleSnapshotClick}
            title="Zajemi sliko visoke ločljivosti"
            className="flex items-center gap-1.5 bg-[#1e2025]/85 hover:bg-[#2b2e35] text-white px-3.5 py-2 rounded-full border border-white/10 shadow-md text-xs font-medium cursor-pointer transition-colors active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Zajemi sliko</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 bg-[#1e2025]/85 hover:bg-[#2b2e35] text-white px-3.5 py-2 rounded-full border border-white/10 shadow-md text-xs font-medium cursor-pointer transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Nazaj</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification on Snapshot */}
      {snapshotToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-600/95 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 z-50 pointer-events-none">
          <Check className="w-3.5 h-3.5" />
          <span>3D posnetek uspešno shranjen!</span>
        </div>
      )}

      {/* Viewport Hints */}
      <div className="absolute top-18 left-1/2 -translate-x-1/2 text-[11px] text-[#222222]/70 bg-white/70 px-3 py-1 rounded-full pointer-events-none border border-black/5 shadow-xs hidden sm:block">
        Povlecite za rotacijo &bull; Drsite za približanje (Pinch / Scroll)
      </div>

      {/* Viewport-First Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 transition-transform duration-300 ease-in-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-42px)]' : 'translate-y-0'
        }`}
      >
        <div className="bg-[#1c1d22]/95 text-white rounded-[24px] border border-white/10 shadow-2xl p-4 flex flex-col gap-3">
          {/* Collapse/Expand Toggle Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-white/80 uppercase">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>3D Slogi, Detajli & Osvetlitev</span>
            </div>

            <button
              onClick={() => setIsDockCollapsed((c) => !c)}
              className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <span>{isDockCollapsed ? 'Prikaži meni' : 'Skrij meni'}</span>
              {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Style Selector Chips (Horizontal Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {STYLE_LIST.map((style) => (
              <button
                key={style.id}
                onClick={() => handleSelectStyle(style.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeStyle === style.id
                    ? 'bg-white text-[#1c1d22] shadow-sm font-semibold'
                    : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>

          {/* Exploded View Slider & Floor Finishes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10">
            {/* Exploded View Slider */}
            <div className="flex items-center gap-2.5 bg-white/5 px-3 py-1.5 rounded-xl">
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-white/60 whitespace-nowrap">Razstavljen pogled:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodedVal}
                onChange={handleExplodedChange}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
              <span className="text-[10px] text-white/50 w-7 text-right">{Math.round(explodedVal * 100)}%</span>
            </div>

            {/* Floor Finishes */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl">
              <span className="text-[11px] text-white/60">Tla:</span>
              <button
                onClick={() => handleSelectFloor('style')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  activeFloor === 'style' ? 'bg-amber-400/30 text-amber-300 font-medium' : 'text-white/60 hover:text-white'
                }`}
              >
                Po slogu
              </button>
              <button
                onClick={() => handleSelectFloor('walnut')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  activeFloor === 'walnut' ? 'bg-amber-400/30 text-amber-300 font-medium' : 'text-white/60 hover:text-white'
                }`}
              >
                Oreh
              </button>
              <button
                onClick={() => handleSelectFloor('marble')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  activeFloor === 'marble' ? 'bg-amber-400/30 text-amber-300 font-medium' : 'text-white/60 hover:text-white'
                }`}
              >
                Marmor
              </button>
            </div>
          </div>

          {/* Camera Angles & Lighting Mood Controls */}
          <div className="flex items-center justify-between gap-3 pt-1 text-xs">
            {/* Camera Viewpoints */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[11px] text-white/50 mr-1 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Pogled:
              </span>
              {(Object.keys(CAMERA_PRESETS) as CameraPresetKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSelectCamera(key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    activeCamera === key ? 'bg-white/25 text-white font-medium' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {CAMERA_PRESETS[key].label}
                </button>
              ))}
            </div>

            {/* Lighting Mood Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => handleSelectMood('daylight')}
                title="Dnevna svetloba"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  activeMood === 'daylight' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleSelectMood('golden')}
                title="Zlata ura"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  activeMood === 'golden' ? 'bg-amber-500/30 text-amber-300' : 'text-white/50 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleSelectMood('evening')}
                title="Večerni ambient"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  activeMood === 'evening' ? 'bg-blue-500/30 text-blue-300' : 'text-white/50 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
