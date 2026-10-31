/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { createContactShadowTexture } from './textures';

/**
 * 3–12 Part Composite Procedural Models Module
 * Assembles furniture and architectural elements as detailed THREE.Group hierarchies.
 * Strictly adheres to PBR material variance, chamfers, and grounded pivots.
 */

export interface StylePalette {
  sofaFabric: number;
  sofaRoughness: number;
  woodColor: number;
  metalColor: number;
  metalness: number;
  accentColor: number;
  cushionColor: number;
  wallColor: number;
  floorTone: 'light' | 'walnut' | 'weathered' | 'charcoal';
  rugType: 'scandi' | 'boho' | 'minimal' | 'deco';
}

export const STYLE_3D_PALETTES: Record<string, StylePalette> = {
  japandi: {
    sofaFabric: 0xe6e0d4, // oat linen
    sofaRoughness: 0.85,
    woodColor: 0xd6c4aa, // light hinoki bamboo
    metalColor: 0x3a3632,
    metalness: 0.2,
    accentColor: 0x8a9486, // serene sage
    cushionColor: 0xf0ece4,
    wallColor: 0xf3efe7,
    floorTone: 'light',
    rugType: 'scandi'
  },
  industrial: {
    sofaFabric: 0x5a3d28, // distressed saddle leather
    sofaRoughness: 0.55,
    woodColor: 0x3f352b, // reclaimed charred timber
    metalColor: 0x1f2226, // raw cast iron
    metalness: 0.85,
    accentColor: 0x9e472a, // rust / exposed brick
    cushionColor: 0x2b2927,
    wallColor: 0x3d4147, // charcoal concrete
    floorTone: 'charcoal',
    rugType: 'minimal'
  },
  midcentury: {
    sofaFabric: 0xc97a3e, // mustard / burnt orange tweed
    sofaRoughness: 0.75,
    woodColor: 0x5c381e, // rich American walnut
    metalColor: 0xd4af37, // spun brass
    metalness: 0.9,
    accentColor: 0x245242, // retro avocado green
    cushionColor: 0xd9b352,
    wallColor: 0xebe3d5,
    floorTone: 'walnut',
    rugType: 'scandi'
  },
  biophilic: {
    sofaFabric: 0xdcd8ce, // natural hemp fabric
    sofaRoughness: 0.9,
    woodColor: 0xb59e7f, // natural ash wood
    metalColor: 0x293d2e, // botanical forest green
    metalness: 0.3,
    accentColor: 0x3b6b47, // fresh leaf chlorophyll
    cushionColor: 0x6e8f72,
    wallColor: 0xeae6dc,
    floorTone: 'light',
    rugType: 'scandi'
  },
  luxury: {
    sofaFabric: 0xf5f3ee, // plush ivory boucle
    sofaRoughness: 0.8,
    woodColor: 0x1b1b1f, // polished ebony
    metalColor: 0xdfb76c, // 24k polished gold
    metalness: 0.95,
    accentColor: 0x203545, // midnight navy
    cushionColor: 0xd8caa8,
    wallColor: 0xded8ce,
    floorTone: 'light',
    rugType: 'deco'
  },
  bohemian: {
    sofaFabric: 0xb85d38, // terracotta woven cloth
    sofaRoughness: 0.85,
    woodColor: 0x7c4e2b, // teak wood
    metalColor: 0x946b38, // hammered brass
    metalness: 0.6,
    accentColor: 0xd69938, // desert ochre
    cushionColor: 0x96432b,
    wallColor: 0xf0e3d0,
    floorTone: 'walnut',
    rugType: 'boho'
  },
  minimalist: {
    sofaFabric: 0xededed, // pure light grey wool
    sofaRoughness: 0.7,
    woodColor: 0xd9d9d9, // bleached ash
    metalColor: 0x141416, // matte black powder coat
    metalness: 0.7,
    accentColor: 0x757575, // cool steel
    cushionColor: 0xffffff,
    wallColor: 0xf7f8fa,
    floorTone: 'weathered',
    rugType: 'minimal'
  },
  coastal: {
    sofaFabric: 0xdde7ec, // washed denim / sea-salt linen
    sofaRoughness: 0.8,
    woodColor: 0xc8beb2, // weathered driftwood
    metalColor: 0xd2d7dc, // polished nautical chrome
    metalness: 0.75,
    accentColor: 0x4d8ba6, // oceanic cyan
    cushionColor: 0xbee0ed,
    wallColor: 0xf0f5f7,
    floorTone: 'weathered',
    rugType: 'scandi'
  },
  artdeco: {
    sofaFabric: 0x1a3d36, // deep emerald velvet
    sofaRoughness: 0.45,
    woodColor: 0x141418, // high-gloss piano black
    metalColor: 0xe5c158, // brushed brass
    metalness: 0.95,
    accentColor: 0x91253b, // ruby wine
    cushionColor: 0xd8b549,
    wallColor: 0x232729,
    floorTone: 'charcoal',
    rugType: 'deco'
  },
  farmhouse: {
    sofaFabric: 0xdfd9ce, // oatmeal slipcover
    sofaRoughness: 0.85,
    woodColor: 0x8a6f53, // rough-hewn barnwood
    metalColor: 0x1d1e20, // forged black iron
    metalness: 0.7,
    accentColor: 0x485863, // slate blue
    cushionColor: 0xaf9d86,
    wallColor: 0xeeebe3,
    floorTone: 'walnut',
    rugType: 'scandi'
  }
};

/**
 * Creates a soft radial contact shadow plane underneath furniture.
 */
export function createContactShadow(width: number, length: number, opacity = 0.45): THREE.Mesh {
  const shadowGeo = new THREE.PlaneGeometry(width, length);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    opacity,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.005; // avoid z-fighting
  shadowMesh.renderOrder = 1;
  return shadowMesh;
}

/**
 * Composite 8-Part Hero Sofa
 * Primary silhouette (frame & seat), Secondary (backrest, arms), Accent (bolsters & tapered peg legs)
 */
export function createCompositeSofa(palette: StylePalette): THREE.Group {
  const group = new THREE.Group();

  const fabricMat = new THREE.MeshStandardMaterial({
    color: palette.sofaFabric,
    roughness: palette.sofaRoughness,
    metalness: 0.05
  });

  const woodLegMat = new THREE.MeshStandardMaterial({
    color: palette.woodColor,
    roughness: 0.35,
    metalness: 0.1
  });

  const metalCapMat = new THREE.MeshStandardMaterial({
    color: palette.metalColor,
    roughness: 0.2,
    metalness: palette.metalness
  });

  const accentCushionMat = new THREE.MeshStandardMaterial({
    color: palette.accentColor,
    roughness: 0.85,
    metalness: 0.05
  });

  // 1. Plinth / Wooden Base Frame
  const plinthGeo = new THREE.BoxGeometry(2.3, 0.12, 0.95);
  const plinth = new THREE.Mesh(plinthGeo, woodLegMat);
  plinth.position.set(0, 0.24, 0);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // 2. Main Seat Cushion (Beveled box feel)
  const seatGeo = new THREE.BoxGeometry(2.24, 0.22, 0.88);
  const seat = new THREE.Mesh(seatGeo, fabricMat);
  seat.position.set(0, 0.41, 0.02);
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  // 3. Backrest Core
  const backGeo = new THREE.BoxGeometry(2.24, 0.52, 0.18);
  const back = new THREE.Mesh(backGeo, fabricMat);
  back.position.set(0, 0.72, -0.36);
  back.castShadow = true;
  group.add(back);

  // 4 & 5. Left and Right Cushioned Armrests
  const armGeo = new THREE.BoxGeometry(0.18, 0.38, 0.92);
  const leftArm = new THREE.Mesh(armGeo, fabricMat);
  leftArm.position.set(-1.14, 0.62, 0.02);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, fabricMat);
  rightArm.position.set(1.14, 0.62, 0.02);
  rightArm.castShadow = true;
  group.add(rightArm);

  // 6. Accent Throw Pillows
  const pillowGeo = new THREE.BoxGeometry(0.42, 0.42, 0.14);
  const p1 = new THREE.Mesh(pillowGeo, accentCushionMat);
  p1.position.set(-0.75, 0.64, -0.22);
  p1.rotation.set(-0.15, 0.25, -0.1);
  p1.castShadow = true;
  group.add(p1);

  const p2 = new THREE.Mesh(pillowGeo, accentCushionMat);
  p2.position.set(0.75, 0.64, -0.22);
  p2.rotation.set(-0.15, -0.25, 0.1);
  p2.castShadow = true;
  group.add(p2);

  // 7. Four Tapered Peg Legs with Metal Ferrules
  const legPositions = [
    [-1.02, 0.11, -0.38],
    [1.02, 0.11, -0.38],
    [-1.02, 0.11, 0.38],
    [1.02, 0.11, 0.38]
  ];

  const legGeo = new THREE.CylinderGeometry(0.025, 0.015, 0.22, 16);
  const ferruleGeo = new THREE.CylinderGeometry(0.017, 0.015, 0.05, 16);

  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, woodLegMat);
    leg.position.set(x, y, z);
    leg.rotation.z = x > 0 ? -0.12 : 0.12;
    leg.rotation.x = z > 0 ? 0.12 : -0.12;
    leg.castShadow = true;
    group.add(leg);

    const ferrule = new THREE.Mesh(ferruleGeo, metalCapMat);
    ferrule.position.set(x * 1.02, 0.025, z * 1.02);
    group.add(ferrule);
  });

  // 8. Ground Contact Shadow
  const shadow = createContactShadow(2.6, 1.4, 0.5);
  group.add(shadow);

  group.userData = {
    id: 'sofa',
    type: 'sofa',
    name: 'Nordic Lounge Zofa',
    specs: '224 × 88 × 72 cm',
    focusPos: new THREE.Vector3(0, 1.2, 1.9),
    focusLook: new THREE.Vector3(0, 0.5, -0.6),
    materials: {
      fabric: fabricMat,
      wood: woodLegMat,
      accent: accentCushionMat
    },
    plinth,
    seat,
    back,
    leftArm,
    rightArm,
    p1,
    p2
  };

  return group;
}

/**
 * Composite 6-Part Sculpted Coffee Table
 * Beveled circular or rounded rectangular tabletop with under-shelf, sculpted fluted legs, and brass hardware.
 */
export function createCompositeCoffeeTable(palette: StylePalette): THREE.Group {
  const group = new THREE.Group();

  const topMat = new THREE.MeshStandardMaterial({
    color: palette.woodColor,
    roughness: 0.3,
    metalness: 0.1
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: palette.metalColor,
    roughness: 0.2,
    metalness: palette.metalness
  });

  // 1. Main Tabletop (Lathe curved circular bevel)
  const points: THREE.Vector2[] = [];
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(0.55, 0));
  points.push(new THREE.Vector2(0.58, 0.015));
  points.push(new THREE.Vector2(0.57, 0.04));
  points.push(new THREE.Vector2(0, 0.04));
  const topGeo = new THREE.LatheGeometry(points, 32);
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(0, 0.36, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // 2. Lower Accessory Shelf
  const shelfGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.02, 32);
  const shelf = new THREE.Mesh(shelfGeo, topMat);
  shelf.position.set(0, 0.16, 0);
  shelf.castShadow = true;
  shelf.receiveShadow = true;
  group.add(shelf);

  // 3. Three Sculpted Tapered Metal/Wood Legs
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const r = 0.44;
    const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.36, 16);
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(Math.cos(angle) * r, 0.18, Math.sin(angle) * r);
    leg.rotation.z = Math.cos(angle) * 0.08;
    leg.rotation.x = Math.sin(angle) * -0.08;
    leg.castShadow = true;
    group.add(leg);
  }

  // 4. Ceramic Decor Bowl
  const bowlPoints: THREE.Vector2[] = [];
  for (let a = 0; a <= Math.PI / 2; a += 0.2) {
    bowlPoints.push(new THREE.Vector2(Math.sin(a) * 0.12, (1 - Math.cos(a)) * 0.06));
  }
  const bowlGeo = new THREE.LatheGeometry(bowlPoints, 24);
  const bowlMat = new THREE.MeshStandardMaterial({
    color: palette.accentColor,
    roughness: 0.35,
    metalness: 0.1
  });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat);
  bowl.position.set(0.05, 0.4, -0.04);
  bowl.castShadow = true;
  group.add(bowl);

  // 5. Contact Shadow
  const shadow = createContactShadow(1.3, 1.3, 0.45);
  group.add(shadow);

  group.userData = {
    id: 'coffeeTable',
    type: 'coffeeTable',
    name: 'Skandinavska kavna mizica',
    specs: 'Ø 110 × 40 cm',
    focusPos: new THREE.Vector3(0, 1.2, 1.7),
    focusLook: new THREE.Vector3(0, 0.35, 0.7),
    materials: {
      top: topMat,
      metal: metalMat
    },
    top,
    shelf,
    bowl
  };

  return group;
}

/**
 * Composite 7-Part Architectural Floor Lamp
 * Marble/iron pedestal base, arch stem, brass adjustment collar, lathe shade, and glowing bulb.
 */
export function createCompositeFloorLamp(palette: StylePalette): THREE.Group {
  const group = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({
    color: palette.metalColor,
    roughness: 0.3,
    metalness: palette.metalness
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xdfb76c,
    roughness: 0.2,
    metalness: 0.95
  });

  // 1. Heavy Base Plinth
  const baseGeo = new THREE.CylinderGeometry(0.22, 0.24, 0.04, 32);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.02;
  base.castShadow = true;
  group.add(base);

  // 2. Telescoping Vertical Mast
  const mastGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.3, 16);
  const mast = new THREE.Mesh(mastGeo, baseMat);
  mast.position.set(0, 0.67, 0);
  mast.castShadow = true;
  group.add(mast);

  // 3. Knurled Brass Collar Joint
  const collarGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.06, 16);
  const collar = new THREE.Mesh(collarGeo, brassMat);
  collar.position.set(0, 1.34, 0);
  group.add(collar);

  // 4. Cantilevered Arch Tube (Curved Spline)
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 1.34, 0),
    new THREE.Vector3(0, 1.95, 0.35),
    new THREE.Vector3(0, 1.75, 0.75)
  );
  const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.012, 12, false);
  const tube = new THREE.Mesh(tubeGeo, baseMat);
  tube.castShadow = true;
  group.add(tube);

  // 5. Flared Lampshade (Lathe Geometry)
  const shadePoints: THREE.Vector2[] = [];
  shadePoints.push(new THREE.Vector2(0.04, 0));
  shadePoints.push(new THREE.Vector2(0.18, -0.16));
  shadePoints.push(new THREE.Vector2(0.17, -0.17));
  shadePoints.push(new THREE.Vector2(0.035, 0.01));
  const shadeGeo = new THREE.LatheGeometry(shadePoints, 32);
  const shade = new THREE.Mesh(shadeGeo, baseMat);
  shade.position.set(0, 1.75, 0.75);
  shade.castShadow = true;
  group.add(shade);

  // 6. Glowing Light Bulb / Filament
  const bulbGeo = new THREE.SphereGeometry(0.035, 16, 16);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff6dd,
    emissive: 0xffe6a3,
    emissiveIntensity: 1.8,
    roughness: 0.1
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(0, 1.66, 0.75);
  group.add(bulb);

  // 7. Contact Shadow
  const shadow = createContactShadow(0.6, 0.6, 0.4);
  group.add(shadow);

  group.userData = {
    id: 'floorLamp',
    type: 'floorLamp',
    name: 'Obločna talna svetilka',
    specs: 'V: 195 cm, brušena medenina',
    focusPos: new THREE.Vector3(-0.9, 1.6, 0.1),
    focusLook: new THREE.Vector3(-1.8, 1.4, -1.2),
    materials: {
      base: baseMat,
      brass: brassMat
    },
    shade,
    collar,
    bulb
  };

  return group;
}

/**
 * Composite 9-Part Botanical Indoor Plant
 * Glazed ceramic pot, soil substrate, curving organic stems, and broad layered foliage leaves.
 */
export function createCompositePlant(palette: StylePalette): THREE.Group {
  const group = new THREE.Group();

  // 1. Ceramic Pot (Lathe geometry with lip)
  const potPoints: THREE.Vector2[] = [];
  potPoints.push(new THREE.Vector2(0, 0));
  potPoints.push(new THREE.Vector2(0.16, 0));
  potPoints.push(new THREE.Vector2(0.24, 0.38));
  potPoints.push(new THREE.Vector2(0.25, 0.42));
  potPoints.push(new THREE.Vector2(0.22, 0.42));
  potPoints.push(new THREE.Vector2(0, 0.05));
  const potGeo = new THREE.LatheGeometry(potPoints, 24);
  const potMat = new THREE.MeshStandardMaterial({
    color: palette.cushionColor,
    roughness: 0.4,
    metalness: 0.05
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  // 2. Dark Soil Substrate
  const soilGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.02, 24);
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x241e17,
    roughness: 0.95,
    metalness: 0.0
  });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.38;
  group.add(soil);

  // 3-7. Branching Stems & Large Sculpted Leaf Blades
  const leafGeo = new THREE.SphereGeometry(0.18, 8, 8);
  leafGeo.scale(0.5, 0.03, 1.4); // flat organic leaf shape

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a37,
    roughness: 0.35,
    metalness: 0.1
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3d6b47,
    roughness: 0.6
  });

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6 + (Math.random() * 0.2);
    const height = 0.65 + Math.random() * 0.3;
    const reach = 0.35 + Math.random() * 0.15;

    const stemCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.38, 0),
      new THREE.Vector3(Math.cos(angle) * 0.1, 0.38 + height * 0.6, Math.sin(angle) * 0.1),
      new THREE.Vector3(Math.cos(angle) * reach, 0.38 + height, Math.sin(angle) * reach)
    );
    const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.008, 8, false);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.castShadow = true;
    group.add(stem);

    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(angle) * reach, 0.38 + height, Math.sin(angle) * reach);
    leaf.rotation.y = angle + Math.PI / 2;
    leaf.rotation.x = -0.4;
    leaf.rotation.z = (Math.random() - 0.5) * 0.3;
    leaf.castShadow = true;
    group.add(leaf);
  }

  // 8. Contact Shadow
  const shadow = createContactShadow(0.65, 0.65, 0.4);
  group.add(shadow);

  group.userData = {
    id: 'plant',
    type: 'plant',
    name: 'Ficus & sobna lončnica',
    specs: 'V: 95 cm, terakota & fikus',
    focusPos: new THREE.Vector3(1.1, 1.2, 0.1),
    focusLook: new THREE.Vector3(1.9, 0.6, -1.4),
    materials: {
      pot: potMat
    }
  };

  return group;
}

/**
 * Composite 5-Part Architectural Wall Artwork & Floating Shelving
 */
export function createCompositeWallArt(palette: StylePalette): THREE.Group {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: palette.woodColor,
    roughness: 0.4,
    metalness: 0.1
  });

  const mattingMat = new THREE.MeshStandardMaterial({
    color: 0xfcfbf8,
    roughness: 0.9
  });

  const canvasMat = new THREE.MeshStandardMaterial({
    color: palette.accentColor,
    roughness: 0.7
  });

  // 1. Outer Beveled Shadowbox Frame
  const frameGeo = new THREE.BoxGeometry(1.6, 1.1, 0.04);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.castShadow = true;
  group.add(frame);

  // 2. Inner White Matting
  const mattingGeo = new THREE.BoxGeometry(1.44, 0.94, 0.02);
  const matting = new THREE.Mesh(mattingGeo, mattingMat);
  matting.position.z = 0.015;
  group.add(matting);

  // 3. Central Artwork Artwork Canvas
  const artGeo = new THREE.BoxGeometry(1.15, 0.68, 0.01);
  const art = new THREE.Mesh(artGeo, canvasMat);
  art.position.z = 0.025;
  group.add(art);

  group.userData = {
    id: 'wallArt',
    type: 'wallArt',
    name: 'Arhitekturno stensko platno',
    specs: '160 × 110 cm, shadowbox',
    focusPos: new THREE.Vector3(0, 2.2, -0.4),
    focusLook: new THREE.Vector3(0, 2.15, -2.5),
    materials: {
      frame: frameMat,
      canvas: canvasMat
    }
  };

  return group;
}

/**
 * 6. Composite Modern Architectural Pendant Light
 * Suspended from ceiling with canopy, sleek braided cord, spun conical shade, and glowing diffuser.
 */
export function createCompositePendantLight(palette: StylePalette): THREE.Group {
  const group = new THREE.Group();

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.7,
    metalness: 0.1
  });

  const shadeMat = new THREE.MeshStandardMaterial({
    color: palette.metalColor,
    roughness: 0.35,
    metalness: palette.metalness
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e0,
    emissive: 0xffd280,
    emissiveIntensity: 0.8,
    roughness: 0.2
  });

  // Ceiling canopy mount
  const canopyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 24);
  const canopy = new THREE.Mesh(canopyGeo, cordMat);
  canopy.position.y = 3.39;
  group.add(canopy);

  // Cord dropping down
  const cordHeight = 1.1;
  const cordGeo = new THREE.CylinderGeometry(0.006, 0.006, cordHeight, 8);
  const cord = new THREE.Mesh(cordGeo, cordMat);
  cord.position.y = 3.4 - cordHeight / 2;
  group.add(cord);

  // Spun metal conical shade
  const shadeGeo = new THREE.ConeGeometry(0.24, 0.22, 32, 1, true);
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.position.y = 3.4 - cordHeight - 0.08;
  shade.castShadow = true;
  group.add(shade);

  // Frosted inner bulb / diffuser
  const bulbGeo = new THREE.SphereGeometry(0.065, 24, 24);
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = 3.4 - cordHeight - 0.12;
  group.add(bulb);

  group.userData = {
    id: 'pendantLight',
    type: 'pendantLight',
    name: 'Viseče arhitekturno svetilo',
    specs: 'Premer 24 cm, brušena kovina',
    focusPos: new THREE.Vector3(0.8, 2.2, 1.8),
    focusLook: new THREE.Vector3(0, 2.1, 0.7),
    materials: {
      shade: shadeMat,
      bulb: bulbMat
    },
    shade,
    bulb
  };

  return group;
}

/**
 * Creates an architectural blueprint grid with subtle dimension lines
 */
export function createArchitecturalGrid(): THREE.Group {
  const group = new THREE.Group();
  const grid = new THREE.GridHelper(8, 16, 0x3b82f6, 0x94a3b8);
  grid.position.y = 0.012;
  const mat = grid.material as THREE.Material;
  mat.transparent = true;
  mat.opacity = 0.45;
  group.add(grid);
  return group;
}

/**
 * Applies smooth exploded-view displacement to procedural subcomponents.
 */
export function applyExplodedDisplacement(furnitureGroup: THREE.Group, progress: number) {
  furnitureGroup.traverse((child) => {
    if (child.userData && child.userData.type === 'sofa') {
      const { seat, back, leftArm, rightArm, p1, p2 } = child.userData;
      if (seat) seat.position.y = 0.41 + progress * 0.4;
      if (back) back.position.z = -0.36 - progress * 0.45;
      if (leftArm) leftArm.position.x = -1.14 - progress * 0.35;
      if (rightArm) rightArm.position.x = 1.14 + progress * 0.35;
      if (p1) p1.position.y = 0.64 + progress * 0.65;
      if (p2) p2.position.y = 0.64 + progress * 0.65;
    } else if (child.userData && child.userData.type === 'coffeeTable') {
      const { top, shelf, bowl } = child.userData;
      if (top) top.position.y = 0.36 + progress * 0.35;
      if (shelf) shelf.position.y = 0.16 - progress * 0.12;
      if (bowl) bowl.position.y = 0.4 + progress * 0.65;
    } else if (child.userData && child.userData.type === 'floorLamp') {
      const { shade, collar, bulb } = child.userData;
      if (shade) shade.position.y = 1.75 + progress * 0.35;
      if (collar) collar.position.y = 1.34 + progress * 0.18;
      if (bulb) bulb.position.y = 1.66 + progress * 0.35;
    } else if (child.userData && child.userData.type === 'pendantLight') {
      const { shade, bulb } = child.userData;
      if (shade) shade.position.y = 2.22 - progress * 0.25;
      if (bulb) bulb.position.y = 2.18 - progress * 0.25;
    }
  });
}

