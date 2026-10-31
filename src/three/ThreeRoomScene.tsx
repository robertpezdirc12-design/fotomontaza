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
  createCompositePendantLight,
  createArchitecturalGrid,
  applyExplodedDisplacement
} from './proceduralModels';
import {
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Compass,
  Sparkles,
  X,
  Eye,
  Camera,
  Layers,
  Check,
  Grid,
  Palette,
  Crosshair,
  Sliders,
  Clock,
  Paintbrush,
  Maximize2
} from 'lucide-react';

interface ThreeRoomSceneProps {
  initialStyleId?: string;
  onClose?: () => void;
}

const CAMERA_PRESETS = {
  overview: { pos: new THREE.Vector3(3.4, 2.4, 4.2), lookAt: new THREE.Vector3(0, 0.8, 0), label: 'Perspektiva' },
  sofa: { pos: new THREE.Vector3(1.2, 1.2, 1.9), lookAt: new THREE.Vector3(0, 0.6, 0), label: 'Fokus na kavč' },
  floorplan: { pos: new THREE.Vector3(0.01, 5.8, 0.01), lookAt: new THREE.Vector3(0, 0, 0), label: 'Tloris (Zgoraj)' },
  cinematic: { pos: new THREE.Vector3(-2.8, 1.6, 3.2), lookAt: new THREE.Vector3(0.2, 0.7, -0.2), label: 'Kinematografski' }
};

type CameraPresetKey = keyof typeof CAMERA_PRESETS;
type FloorType = 'style' | 'light' | 'walnut' | 'weathered' | 'charcoal' | 'marble';
type DockTab = 'slogi' | 'svetloba' | 'stene' | 'staging';
type WallFinish = 'matte' | 'satin' | 'plaster';

interface SelectedItemInfo {
  id: string;
  name: string;
  specs: string;
  focusPos: THREE.Vector3;
  focusLook: THREE.Vector3;
}

const COLOR_SWATCHES = [
  { label: 'Oatmeal', hex: 0xe6e0d4 },
  { label: 'Sage', hex: 0x8a9486 },
  { label: 'Terracotta', hex: 0xb85d38 },
  { label: 'Forest', hex: 0x245242 },
  { label: 'Walnut', hex: 0x5c381e },
  { label: 'Gold Brass', hex: 0xdfb76c },
  { label: 'Charcoal', hex: 0x22252a }
];

const WALL_COLOR_SWATCHES = [
  { label: 'Slogovna', hex: 'style', bg: '#d4cebe' },
  { label: 'Alabaster', hex: 0xf5f3ee, bg: '#f5f3ee' },
  { label: 'Kašmir', hex: 0xe2dbd0, bg: '#e2dbd0' },
  { label: 'Terakota', hex: 0xb96a4b, bg: '#b96a4b' },
  { label: 'Žajbelj', hex: 0x8f9f8c, bg: '#8f9f8c' },
  { label: 'Skrilavec', hex: 0x242932, bg: '#242932' },
  { label: 'Bor', hex: 0x2a4233, bg: '#2a4233' },
  { label: 'Oker', hex: 0xc89547, bg: '#c89547' }
];

const TIME_PRESETS = [
  { label: '07:00 Rano jutro', hour: 7.0, icon: Sunrise },
  { label: '12:00 Poldne', hour: 12.0, icon: Sun },
  { label: '17:30 Zlata ura', hour: 17.5, icon: Sunset },
  { label: '22:00 Nočni ambient', hour: 22.0, icon: Moon }
];

export default function ThreeRoomScene({ initialStyleId = 'japandi', onClose }: ThreeRoomSceneProps) {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const [activeStyle, setActiveStyle] = useState<string>(initialStyleId);
  const [activeCamera, setActiveCamera] = useState<CameraPresetKey>('overview');
  const [activeDockTab, setActiveDockTab] = useState<DockTab>('slogi');
  const [explodedVal, setExplodedVal] = useState<number>(0);
  const [activeFloor, setActiveFloor] = useState<FloorType>('style');
  const [isBlueprintMode, setIsBlueprintMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItemInfo | null>(null);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState(false);

  // Time-of-day continuous simulation state (6.0 to 24.0)
  const [timeHour, setTimeHour] = useState<number>(12.0);

  // Wall customization state
  const [wallColorSelection, setWallColorSelection] = useState<number | 'style'>('style');
  const [wallFinish, setWallFinish] = useState<WallFinish>('matte');

  // Staging items visibility
  const [stagingVisibility, setStagingVisibility] = useState({
    sofa: true,
    coffeeTable: true,
    floorLamp: true,
    plant: true,
    wallArt: true,
    pendantLight: true,
    rug: true
  });

  // References for scene update dispatch without tearing down WebGL canvas
  const updateStyleRef = useRef<((styleId: string) => void) | null>(null);
  const updateCameraRef = useRef<((preset: CameraPresetKey) => void) | null>(null);
  const focusTargetRef = useRef<((pos: THREE.Vector3, lookAt: THREE.Vector3) => void) | null>(null);
  const updateTimeOfDayRef = useRef<((hour: number) => void) | null>(null);
  const updateWallColorRef = useRef<((color: number | 'style', finish: WallFinish) => void) | null>(null);
  const updateStagingRef = useRef<((key: string, visible: boolean) => void) | null>(null);
  const updateFloorRef = useRef<((floor: FloorType) => void) | null>(null);
  const toggleBlueprintRef = useRef<((enabled: boolean) => void) | null>(null);
  const updateItemColorRef = useRef<((colorHex: number) => void) | null>(null);
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
      preserveDrawingBuffer: true
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

    // 5. Studio Lighting Rig (Sun + Hemisphere + Ambient + Interior Point Lights)
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Interior Warm Glow: Floor Lamp PointLight
    const floorLampPointLight = new THREE.PointLight(0xffd080, 0.0, 5, 1.8);
    floorLampPointLight.position.set(-1.8, 1.65, -1.2);
    scene.add(floorLampPointLight);

    // Interior Warm Glow: Ceiling Pendant PointLight
    const pendantPointLight = new THREE.PointLight(0xffe0a0, 0.0, 6, 1.6);
    pendantPointLight.position.set(0, 2.1, 0.7);
    scene.add(pendantPointLight);

    // 6. Camera Controls with Exponential Damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 1.0;
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
      roughness: 0.95,
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

    // Blueprint grid group
    const blueprintGroup = createArchitecturalGrid();
    blueprintGroup.visible = false;
    roomRoot.add(blueprintGroup);

    // Dynamic Furniture Group (swapped when style changes)
    const furnitureGroup = new THREE.Group();
    roomRoot.add(furnitureGroup);

    let currentFloorType: FloorType = 'style';
    let currentStyleId = initialStyleId;
    let selectedGroupRef: THREE.Group | null = null;
    let currentCustomWallColor: number | 'style' = 'style';
    let currentWallFinish: WallFinish = 'matte';

    // Staging references
    const stagingObjects: Record<string, THREE.Object3D | null> = {
      sofa: null,
      coffeeTable: null,
      floorLamp: null,
      plant: null,
      wallArt: null,
      pendantLight: null,
      rug: rug
    };

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

    const applyWallMaterial = () => {
      const palette = STYLE_3D_PALETTES[currentStyleId] || STYLE_3D_PALETTES.japandi;
      const targetColor = currentCustomWallColor === 'style' ? palette.wallColor : currentCustomWallColor;

      wallMat.color.setHex(targetColor);
      if (currentWallFinish === 'matte') {
        wallMat.roughness = 0.95;
      } else if (currentWallFinish === 'satin') {
        wallMat.roughness = 0.58;
      } else {
        wallMat.roughness = 0.82; // plaster
      }
      wallMat.needsUpdate = true;
    };

    // Reusable Room Builder
    const buildRoomForStyle = (styleId: string) => {
      currentStyleId = styleId;
      selectedGroupRef = null;
      setSelectedItem(null);

      while (furnitureGroup.children.length > 0) {
        const obj = furnitureGroup.children[0];
        furnitureGroup.remove(obj);
      }

      const palette = STYLE_3D_PALETTES[styleId] || STYLE_3D_PALETTES.japandi;

      updateFloorTexture(currentFloorType, styleId);
      applyWallMaterial();

      scene.background = new THREE.Color(palette.wallColor);
      if (scene.fog) scene.fog.color.setHex(palette.wallColor);

      rugMat.map = createRugTexture(renderer, palette.rugType);
      rugMat.needsUpdate = true;

      // 1. Composite Hero Sofa
      const sofa = createCompositeSofa(palette);
      sofa.position.set(0, 0, -0.6);
      furnitureGroup.add(sofa);
      stagingObjects.sofa = sofa;

      // 2. Composite Coffee Table
      const coffeeTable = createCompositeCoffeeTable(palette);
      coffeeTable.position.set(0, 0, 0.7);
      furnitureGroup.add(coffeeTable);
      stagingObjects.coffeeTable = coffeeTable;

      // 3. Composite Floor Lamp
      const lamp = createCompositeFloorLamp(palette);
      lamp.position.set(-1.8, 0, -1.2);
      lamp.rotation.y = 0.45;
      furnitureGroup.add(lamp);
      stagingObjects.floorLamp = lamp;

      // 4. Composite Botanical Plant
      const plant = createCompositePlant(palette);
      plant.position.set(1.9, 0, -1.4);
      furnitureGroup.add(plant);
      stagingObjects.plant = plant;

      // 5. Composite Wall Art
      const art = createCompositeWallArt(palette);
      art.position.set(0, 2.15, -2.54);
      furnitureGroup.add(art);
      stagingObjects.wallArt = art;

      // 6. Composite Pendant Light
      const pendant = createCompositePendantLight(palette);
      pendant.position.set(0, 0, 0.7);
      furnitureGroup.add(pendant);
      stagingObjects.pendantLight = pendant;

      applyExplodedDisplacement(furnitureGroup, currentExploded);
    };

    // Initial build
    buildRoomForStyle(initialStyleId);

    // Continuous Dynamic Sun Path & Time-of-Day Lighting Rig
    const applyTimeOfDay = (hour: number) => {
      // Hour ranges from 6.0 to 24.0
      if (hour >= 6.0 && hour <= 8.5) {
        // Sunrise / Early Morning
        const t = (hour - 6.0) / 2.5;
        const sunX = 5.0 - t * 1.5;
        const sunY = 2.2 + t * 2.5;
        const sunZ = 4.2 - t * 0.5;
        keyLight.position.set(sunX, sunY, sunZ);
        keyLight.color.setHex(0xffcb99); // warm morning rose-amber
        keyLight.intensity = 1.9 + t * 0.4;
        hemiLight.color.setHex(0xdce7f5);
        hemiLight.groundColor.setHex(0x4a3a2e);
        hemiLight.intensity = 0.8;
        ambientLight.intensity = 0.3;
        floorLampPointLight.intensity = 0.3 * (1 - t);
        pendantPointLight.intensity = 0.2 * (1 - t);
      } else if (hour > 8.5 && hour <= 15.5) {
        // Midday / Crisp daylight
        keyLight.position.set(3.8, 5.8, 3.2);
        keyLight.color.setHex(0xfffaee); // crisp warm white
        keyLight.intensity = 2.4;
        hemiLight.color.setHex(0xe8f0f8);
        hemiLight.groundColor.setHex(0x3d352e);
        hemiLight.intensity = 0.9;
        ambientLight.intensity = 0.38;
        floorLampPointLight.intensity = 0.05;
        pendantPointLight.intensity = 0.05;
      } else if (hour > 15.5 && hour <= 19.0) {
        // Golden Hour / Sunset
        const t = (hour - 15.5) / 3.5;
        const sunX = 3.8 + t * 2.0;
        const sunY = 5.8 - t * 3.4;
        const sunZ = 3.2 + t * 1.2;
        keyLight.position.set(sunX, sunY, sunZ);
        keyLight.color.setHex(0xffa854); // intense golden hour
        keyLight.intensity = 2.7;
        hemiLight.color.setHex(0xffdfb0);
        hemiLight.groundColor.setHex(0x56341c);
        hemiLight.intensity = 0.85;
        ambientLight.intensity = 0.28;
        floorLampPointLight.intensity = 0.6 * t;
        pendantPointLight.intensity = 0.7 * t;
      } else if (hour > 19.0 && hour <= 21.0) {
        // Dusk / Twilight
        const t = (hour - 19.0) / 2.0;
        keyLight.position.set(5.5, 2.0, 4.0);
        keyLight.color.setHex(0x7688aa); // twilight indigo
        keyLight.intensity = 0.8 * (1 - t * 0.4);
        hemiLight.color.setHex(0x28384f);
        hemiLight.groundColor.setHex(0x191e26);
        hemiLight.intensity = 0.55;
        ambientLight.intensity = 0.2;
        floorLampPointLight.intensity = 1.4 + t * 0.6;
        pendantPointLight.intensity = 1.5 + t * 0.5;
      } else {
        // Night / Moonlight + Interior Lamps
        keyLight.position.set(2.8, 4.5, 3.0);
        keyLight.color.setHex(0x415b7c); // soft nocturnal moonlight
        keyLight.intensity = 0.45;
        hemiLight.color.setHex(0x182436);
        hemiLight.groundColor.setHex(0x101318);
        hemiLight.intensity = 0.4;
        ambientLight.intensity = 0.15;
        floorLampPointLight.intensity = 2.2;
        pendantPointLight.intensity = 2.4;
      }
    };

    // Apply default midday
    applyTimeOfDay(12.0);

    // Camera preset transition target
    const targetCamPos = CAMERA_PRESETS.overview.pos.clone();
    const targetCamLook = CAMERA_PRESETS.overview.lookAt.clone();
    let isTransitioningCamera = false;

    const setCameraTarget = (preset: CameraPresetKey) => {
      const config = CAMERA_PRESETS[preset];
      targetCamPos.copy(config.pos);
      targetCamLook.copy(config.lookAt);
      isTransitioningCamera = true;
    };

    const focusCameraOnTarget = (pos: THREE.Vector3, lookAt: THREE.Vector3) => {
      targetCamPos.copy(pos);
      targetCamLook.copy(lookAt);
      isTransitioningCamera = true;
    };

    // Interactive Raycasting on Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Dragged camera

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(furnitureGroup.children, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && hitObj.parent && hitObj.parent !== furnitureGroup) {
          hitObj = hitObj.parent;
        }

        if (hitObj && hitObj.userData && hitObj.userData.id) {
          const u = hitObj.userData;
          selectedGroupRef = hitObj as THREE.Group;
          setSelectedItem({
            id: u.id,
            name: u.name,
            specs: u.specs,
            focusPos: u.focusPos,
            focusLook: u.focusLook
          });
          return;
        }
      }

      selectedGroupRef = null;
      setSelectedItem(null);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Bind dispatch handlers to refs
    updateStyleRef.current = (styleId: string) => {
      buildRoomForStyle(styleId);
    };

    updateCameraRef.current = (preset: CameraPresetKey) => {
      setCameraTarget(preset);
    };

    focusTargetRef.current = (pos: THREE.Vector3, lookAt: THREE.Vector3) => {
      focusCameraOnTarget(pos, lookAt);
    };

    updateTimeOfDayRef.current = (hour: number) => {
      applyTimeOfDay(hour);
    };

    updateWallColorRef.current = (color: number | 'style', finish: WallFinish) => {
      currentCustomWallColor = color;
      currentWallFinish = finish;
      applyWallMaterial();
    };

    updateStagingRef.current = (key: string, visible: boolean) => {
      const target = stagingObjects[key];
      if (target) {
        target.visible = visible;
      }
    };

    updateFloorRef.current = (floorType: FloorType) => {
      currentFloorType = floorType;
      updateFloorTexture(floorType, currentStyleId);
    };

    toggleBlueprintRef.current = (enabled: boolean) => {
      blueprintGroup.visible = enabled;
    };

    updateItemColorRef.current = (colorHex: number) => {
      if (selectedGroupRef && selectedGroupRef.userData && selectedGroupRef.userData.materials) {
        const mats = selectedGroupRef.userData.materials;
        if (mats.fabric) mats.fabric.color.setHex(colorHex);
        if (mats.top) mats.top.color.setHex(colorHex);
        if (mats.base) mats.base.color.setHex(colorHex);
        if (mats.pot) mats.pot.color.setHex(colorHex);
        if (mats.canvas) mats.canvas.color.setHex(colorHex);
        if (mats.shade) mats.shade.color.setHex(colorHex);
      }
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

      if (isTransitioningCamera) {
        camera.position.lerp(targetCamPos, 0.06);
        controls.target.lerp(targetCamLook, 0.06);
        if (camera.position.distanceTo(targetCamPos) < 0.02 && controls.target.distanceTo(targetCamLook) < 0.02) {
          isTransitioningCamera = false;
        }
      }

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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
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

  const handleTimeChange = (hour: number) => {
    setTimeHour(hour);
    updateTimeOfDayRef.current?.(hour);
  };

  const handleWallColorChange = (hex: number | 'style') => {
    setWallColorSelection(hex);
    updateWallColorRef.current?.(hex, wallFinish);
  };

  const handleWallFinishChange = (finish: WallFinish) => {
    setWallFinish(finish);
    updateWallColorRef.current?.(wallColorSelection, finish);
  };

  const handleStagingToggle = (key: keyof typeof stagingVisibility) => {
    const nextVal = !stagingVisibility[key];
    setStagingVisibility(prev => ({ ...prev, [key]: nextVal }));
    updateStagingRef.current?.(key, nextVal);
  };

  const handleSelectFloor = (floor: FloorType) => {
    setActiveFloor(floor);
    updateFloorRef.current?.(floor);
  };

  const handleToggleBlueprint = () => {
    const nextVal = !isBlueprintMode;
    setIsBlueprintMode(nextVal);
    toggleBlueprintRef.current?.(nextVal);
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

  const handleFocusSelected = () => {
    if (selectedItem) {
      focusTargetRef.current?.(selectedItem.focusPos, selectedItem.focusLook);
    }
  };

  const handleColorSwatchClick = (hex: number) => {
    updateItemColorRef.current?.(hex);
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

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#16171a] select-none font-sans">
      {/* Three.js Canvas Container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-3 bg-[#1e2025]/85 text-white px-4 py-2 rounded-full border border-white/10 pointer-events-auto shadow-md">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-syncopate text-xs tracking-wider font-bold">Space Lift 3D</span>
          <span className="text-[11px] text-white/50 border-l border-white/20 pl-2">Procedural PBR Studio</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Blueprint Grid Toggle */}
          <button
            onClick={handleToggleBlueprint}
            title="Vklopi arhitekturni načrt z mrežo"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border shadow-md text-xs font-medium cursor-pointer transition-colors active:scale-95 ${
              isBlueprintMode
                ? 'bg-blue-600/90 text-white border-blue-400/50'
                : 'bg-[#1e2025]/85 hover:bg-[#2b2e35] text-white/80 border-white/10'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mreža</span>
          </button>

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

      {/* Top-Down Floorplan HUD Scale when Camera is 'floorplan' */}
      {activeCamera === 'floorplan' && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 bg-[#1c1d22]/90 text-white px-4 py-2 rounded-full border border-blue-500/30 shadow-lg z-20 flex items-center gap-3 text-xs pointer-events-none animate-in fade-in duration-200">
          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold">TLORIS SOBOVEGA MODULA</span>
          <span className="text-white/60 border-l border-white/20 pl-2">4.80 m × 4.50 m &bull; 21.6 m²</span>
        </div>
      )}

      {/* Toast Notification on Snapshot */}
      {snapshotToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-600/95 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 z-50 pointer-events-none">
          <Check className="w-3.5 h-3.5" />
          <span>3D posnetek uspešno shranjen!</span>
        </div>
      )}

      {/* Selected Object Customizer Card */}
      {selectedItem && (
        <div className="absolute top-16 right-4 w-72 bg-[#1c1d22]/95 text-white rounded-2xl border border-white/15 p-3.5 shadow-xl z-30 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                <Crosshair className="w-3 h-3" /> Izbran kos pohištva
              </div>
              <h3 className="text-sm font-semibold text-white mt-0.5">{selectedItem.name}</h3>
              <p className="text-[11px] text-white/50">{selectedItem.specs}</p>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-white/40 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <span className="text-[10px] text-white/60 flex items-center gap-1">
              <Palette className="w-3 h-3" /> Barva:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.label}
                  onClick={() => handleColorSwatchClick(swatch.hex)}
                  title={swatch.label}
                  style={{ backgroundColor: '#' + swatch.hex.toString(16).padStart(6, '0') }}
                  className="w-5 h-5 rounded-full border border-white/30 hover:scale-115 active:scale-95 transition-transform shadow-xs cursor-pointer"
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleFocusSelected}
            className="w-full bg-white/10 hover:bg-white/20 text-white text-xs py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Fokusiraj kamero na ta kos</span>
          </button>
        </div>
      )}

      {/* Viewport-First Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 transition-transform duration-300 ease-in-out ${
          isDockCollapsed ? 'translate-y-[calc(100%-46px)]' : 'translate-y-0'
        }`}
      >
        <div className="bg-[#1c1d22]/95 text-white rounded-[24px] border border-white/10 shadow-2xl p-4 flex flex-col gap-3">
          {/* Header & Sub-Tab Navigation */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveDockTab('slogi')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDockTab === 'slogi' ? 'bg-amber-500/25 text-amber-300 font-semibold' : 'text-white/60 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Slogi & Tla</span>
              </button>
              <button
                onClick={() => setActiveDockTab('svetloba')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDockTab === 'svetloba' ? 'bg-amber-500/25 text-amber-300 font-semibold' : 'text-white/60 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Ura dneva</span>
              </button>
              <button
                onClick={() => setActiveDockTab('stene')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDockTab === 'stene' ? 'bg-amber-500/25 text-amber-300 font-semibold' : 'text-white/60 hover:text-white'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Stene</span>
              </button>
              <button
                onClick={() => setActiveDockTab('staging')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDockTab === 'staging' ? 'bg-amber-500/25 text-amber-300 font-semibold' : 'text-white/60 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Pohištvo</span>
              </button>
            </div>

            <button
              onClick={() => setIsDockCollapsed((c) => !c)}
              className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
            >
              <span>{isDockCollapsed ? 'Prikaži' : 'Skrij'}</span>
              {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* TAB 1: SLOGI & TLA */}
          {activeDockTab === 'slogi' && (
            <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
              {/* Style Selector Chips (Horizontal Scroll) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {STYLE_LIST.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleSelectStyle(style.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      activeStyle === style.id
                        ? 'bg-white text-[#1c1d22] shadow-sm font-semibold scale-102'
                        : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>

              {/* Exploded View Slider & Floor Finishes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-white/10">
                <div className="flex items-center gap-2.5 bg-white/5 px-3 py-1.5 rounded-xl">
                  <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] text-white/60 whitespace-nowrap">Razstavljen:</span>
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

                <div className="flex items-center justify-between sm:justify-end gap-1 bg-white/5 px-2.5 py-1.5 rounded-xl text-[11px]">
                  <span className="text-white/60 mr-1">Tla:</span>
                  <button
                    onClick={() => handleSelectFloor('style')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      activeFloor === 'style' ? 'bg-amber-400/30 text-amber-300 font-medium' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Slog
                  </button>
                  <button
                    onClick={() => handleSelectFloor('walnut')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      activeFloor === 'walnut' ? 'bg-amber-400/30 text-amber-300 font-medium' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Oreh
                  </button>
                  <button
                    onClick={() => handleSelectFloor('marble')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      activeFloor === 'marble' ? 'bg-amber-400/30 text-amber-300 font-medium' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Marmor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: URA DNEVA & SONCE */}
          {activeDockTab === 'svetloba' && (
            <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sončni položaj & ambient:</span>
                </span>
                <span className="font-mono font-bold text-amber-300 text-xs px-2 py-0.5 rounded bg-white/10">
                  {formatHour(timeHour)}
                </span>
              </div>

              {/* Time Slider */}
              <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl">
                <Sunrise className="w-4 h-4 text-amber-300 shrink-0" />
                <input
                  type="range"
                  min="6.0"
                  max="24.0"
                  step="0.25"
                  value={timeHour}
                  onChange={(e) => handleTimeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-white/20 rounded-lg"
                />
                <Moon className="w-4 h-4 text-blue-300 shrink-0" />
              </div>

              {/* Quick Time Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {TIME_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isActive = Math.abs(timeHour - preset.hour) < 0.8;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => handleTimeChange(preset.hour)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40 font-semibold'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STENSKA BARVA & FINIŠ */}
          {activeDockTab === 'stene' && (
            <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Odtenek sten:</span>
                <div className="flex items-center gap-1">
                  <span className="text-white/50 text-[10px] mr-1">Finiš:</span>
                  {(['matte', 'satin', 'plaster'] as WallFinish[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => handleWallFinishChange(f)}
                      className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors cursor-pointer ${
                        wallFinish === f ? 'bg-amber-400/30 text-amber-300 font-semibold' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {f === 'matte' ? 'Mat' : f === 'satin' ? 'Saten' : 'Omet'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {WALL_COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.label}
                    onClick={() => handleWallColorChange(swatch.hex as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer ${
                      wallColorSelection === swatch.hex
                        ? 'border-amber-400 bg-white/20 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: swatch.bg }}
                    />
                    <span className="whitespace-nowrap">{swatch.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STAGING & POHIŠTVO TOGGLES */}
          {activeDockTab === 'staging' && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-150">
              <div className="text-[11px] text-white/60">
                Vklop / izklop posameznih kosov opreme za ogled praznega ali delno opremljenega prostora:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { key: 'sofa', label: '🛋️ Zofa' },
                  { key: 'coffeeTable', label: '☕ Mizica' },
                  { key: 'floorLamp', label: '💡 Svetilka' },
                  { key: 'plant', label: '🌿 Rastlina' },
                  { key: 'wallArt', label: '🖼️ Platno' },
                  { key: 'pendantLight', label: '✨ Viseča luč' },
                  { key: 'rug', label: '🧶 Preproga' }
                ].map((item) => {
                  const isVisible = stagingVisibility[item.key as keyof typeof stagingVisibility];
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleStagingToggle(item.key as any)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                        isVisible
                          ? 'bg-white/20 text-white font-medium border border-white/20'
                          : 'bg-white/5 text-white/40 line-through border border-transparent'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-emerald-400' : 'bg-red-400/40'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Camera Angles Always-Visible Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[10px] text-white/50 mr-1 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Pogled:
              </span>
              {(Object.keys(CAMERA_PRESETS) as CameraPresetKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSelectCamera(key)}
                  className={`px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    activeCamera === key ? 'bg-white/25 text-white font-semibold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {CAMERA_PRESETS[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
