/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Procedural Texture Generator
 * Strictly creates textures using HTML5 Canvas with SRGBColorSpace and maximum anisotropy.
 * Zero external asset or 404 dependencies.
 */

export function createWoodParquetTexture(
  renderer: THREE.WebGLRenderer,
  tone: 'light' | 'walnut' | 'weathered' | 'charcoal' = 'light'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColors = {
    light: { bg: '#e5d7c3', plank1: '#ddcbb3', plank2: '#e9dcce', line: '#c4b097' },
    walnut: { bg: '#5c3d28', plank1: '#543622', plank2: '#68452e', line: '#3a2214' },
    weathered: { bg: '#a3988c', plank1: '#9b9084', plank2: '#aba195', line: '#7d7266' },
    charcoal: { bg: '#33373b', plank1: '#2b2f33', plank2: '#3b3f43', line: '#1f2225' },
  }[tone];

  ctx.fillStyle = baseColors.bg;
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankH = 32;
  const plankW = 128;

  for (let y = 0; y < 512; y += plankH) {
    const shift = (y / plankH) % 2 === 0 ? 0 : plankW / 2;
    for (let x = -plankW; x < 512 + plankW; x += plankW) {
      ctx.fillStyle = (Math.sin(x * 12.3 + y * 4.1) > 0) ? baseColors.plank1 : baseColors.plank2;
      ctx.fillRect(x + shift, y, plankW - 2, plankH - 2);

      // Fine wood grain lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        const gy = y + 4 + g * 6;
        ctx.beginPath();
        ctx.moveTo(x + shift, gy);
        ctx.bezierCurveTo(
          x + shift + 40, gy + (Math.sin(x + g) * 3),
          x + shift + 80, gy - (Math.cos(y + g) * 3),
          x + shift + plankW - 2, gy
        );
        ctx.stroke();
      }
    }
  }

  // Border seams
  ctx.strokeStyle = baseColors.line;
  ctx.lineWidth = 1.5;
  for (let y = 0; y <= 512; y += plankH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

export function createMarbleTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Carrara ivory marble
  ctx.fillStyle = '#f6f7f8';
  ctx.fillRect(0, 0, 512, 512);

  // Soft organic veins
  ctx.lineWidth = 2;
  for (let v = 0; v < 6; v++) {
    ctx.strokeStyle = v % 2 === 0 ? 'rgba(160, 168, 178, 0.25)' : 'rgba(195, 170, 130, 0.2)';
    ctx.beginPath();
    let x = (v * 90) % 512;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < 512) {
      x += (Math.random() - 0.45) * 45;
      y += 35 + Math.random() * 25;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

export function createRugTexture(
  renderer: THREE.WebGLRenderer,
  style: 'scandi' | 'boho' | 'minimal' | 'deco' = 'scandi'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (style === 'boho') {
    ctx.fillStyle = '#c77855';
    ctx.fillRect(0, 0, 512, 512);

    // Diamond geometric tapestry pattern
    ctx.strokeStyle = '#e8d4be';
    ctx.lineWidth = 4;
    const step = 64;
    for (let x = 0; x < 512; x += step) {
      for (let y = 0; y < 512; y += step) {
        ctx.strokeRect(x + 8, y + 8, step - 16, step - 16);
        ctx.beginPath();
        ctx.moveTo(x + step / 2, y + 8);
        ctx.lineTo(x + step - 8, y + step / 2);
        ctx.lineTo(x + step / 2, y + step - 8);
        ctx.lineTo(x + 8, y + step / 2);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (style === 'deco') {
    ctx.fillStyle = '#162b28';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#d4af37'; // gold lines
    ctx.lineWidth = 3;
    for (let r = 20; r < 300; r += 35) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Scandi / Minimalist ribbed wool
    ctx.fillStyle = '#eae5db';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#dbd4c6';
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(10, 12, 16, 0.65)');
  gradient.addColorStop(0.4, 'rgba(15, 18, 22, 0.35)');
  gradient.addColorStop(0.8, 'rgba(20, 22, 28, 0.08)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
