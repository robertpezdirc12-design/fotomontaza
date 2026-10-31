/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Script-based Interior Design Stylizer & Video Generator
 * Replaces external AI models with high-performance deterministic algorithmic scripts.
 * Performs real-time pixel grading, lighting sweeps, and cinematic video rendering.
 */

interface StyleFilterParams {
  brightness: number;   // -100 to 100 (0 = normal)
  contrast: number;     // -100 to 100 (0 = normal)
  saturation: number;   // -100 to 100 (0 = normal)
  temperature: number;  // -100 (cool blue) to 100 (warm amber)
  tint: number;         // -100 (greenish) to 100 (magenta/rose)
  vignette: number;     // 0 to 1 (intensity of edge darkening)
  bloom: number;        // 0 to 1 (intensity of soft diffuse glow)
  overlayColor?: string;
  overlayBlend?: GlobalCompositeOperation;
  overlayAlpha?: number;
  highlightColor?: string;
  shadowColor?: string;
  effectType?: 'japandi' | 'industrial' | 'midcentury' | 'biophilic' | 'luxury' | 'bohemian' | 'minimalist' | 'coastal' | 'artdeco' | 'farmhouse';
}

const STYLE_PRESETS: Record<string, StyleFilterParams> = {
  japandi: {
    brightness: 6,
    contrast: -8,
    saturation: -18,
    temperature: 30, // warm bamboo & neutral beige
    tint: -5,
    vignette: 0.18,
    bloom: 0.35,
    overlayColor: 'rgba(235, 222, 198, 0.22)', // light bamboo/linen wash
    overlayBlend: 'multiply',
    overlayAlpha: 0.25,
    highlightColor: 'rgba(255, 248, 230, 0.3)',
    shadowColor: 'rgba(54, 46, 38, 0.2)',
    effectType: 'japandi'
  },
  industrial: {
    brightness: -4,
    contrast: 28,
    saturation: -35,
    temperature: -18, // cool steel & charcoal
    tint: -8,
    vignette: 0.45,
    bloom: 0.1,
    overlayColor: 'rgba(45, 52, 60, 0.28)', // raw charcoal iron
    overlayBlend: 'hard-light',
    overlayAlpha: 0.2,
    highlightColor: 'rgba(215, 220, 225, 0.25)',
    shadowColor: 'rgba(20, 22, 28, 0.45)',
    effectType: 'industrial'
  },
  midcentury: {
    brightness: 5,
    contrast: 15,
    saturation: 22,
    temperature: 45, // warm walnut wood & mustard yellow
    tint: 12,
    vignette: 0.28,
    bloom: 0.2,
    overlayColor: 'rgba(218, 145, 42, 0.22)', // amber / mustard tone
    overlayBlend: 'soft-light',
    overlayAlpha: 0.3,
    highlightColor: 'rgba(255, 220, 160, 0.35)',
    shadowColor: 'rgba(70, 38, 14, 0.3)',
    effectType: 'midcentury'
  },
  biophilic: {
    brightness: 8,
    contrast: 12,
    saturation: 25,
    temperature: -5,
    tint: -28, // lush nature green tones
    vignette: 0.22,
    bloom: 0.4,
    overlayColor: 'rgba(64, 130, 78, 0.24)', // botanical chlorophyll wash
    overlayBlend: 'soft-light',
    overlayAlpha: 0.32,
    highlightColor: 'rgba(230, 255, 230, 0.35)',
    shadowColor: 'rgba(20, 50, 28, 0.25)',
    effectType: 'biophilic'
  },
  luxury: {
    brightness: -2,
    contrast: 32,
    saturation: 10,
    temperature: 20,
    tint: 8,
    vignette: 0.42,
    bloom: 0.35,
    overlayColor: 'rgba(205, 168, 92, 0.25)', // polished champagne & brass gold
    overlayBlend: 'overlay',
    overlayAlpha: 0.28,
    highlightColor: 'rgba(255, 245, 210, 0.45)',
    shadowColor: 'rgba(18, 16, 22, 0.4)',
    effectType: 'luxury'
  },
  bohemian: {
    brightness: 8,
    contrast: 6,
    saturation: 30,
    temperature: 42, // terracotta & vintage rugs
    tint: 20,
    vignette: 0.25,
    bloom: 0.3,
    overlayColor: 'rgba(204, 110, 68, 0.26)', // warm terracotta wash
    overlayBlend: 'soft-light',
    overlayAlpha: 0.35,
    highlightColor: 'rgba(255, 225, 190, 0.3)',
    shadowColor: 'rgba(80, 40, 25, 0.25)',
    effectType: 'bohemian'
  },
  minimalist: {
    brightness: 18,
    contrast: 18,
    saturation: -70, // high-key clean monochrome
    temperature: -10,
    tint: 0,
    vignette: 0.1,
    bloom: 0.25,
    overlayColor: 'rgba(245, 247, 250, 0.25)', // pristine pure white wash
    overlayBlend: 'screen',
    overlayAlpha: 0.2,
    highlightColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(40, 42, 45, 0.2)',
    effectType: 'minimalist'
  },
  coastal: {
    brightness: 12,
    contrast: 10,
    saturation: 15,
    temperature: -30, // breezy sea-spray cyan & bright sunlight
    tint: -12,
    vignette: 0.15,
    bloom: 0.45,
    overlayColor: 'rgba(92, 175, 215, 0.25)', // ocean blue / marine breeze
    overlayBlend: 'soft-light',
    overlayAlpha: 0.3,
    highlightColor: 'rgba(235, 250, 255, 0.4)',
    shadowColor: 'rgba(25, 55, 75, 0.25)',
    effectType: 'coastal'
  },
  artdeco: {
    brightness: 0,
    contrast: 35,
    saturation: 30,
    temperature: 15,
    tint: 15,
    vignette: 0.48,
    bloom: 0.3,
    overlayColor: 'rgba(24, 76, 70, 0.32)', // rich emerald & gilded accents
    overlayBlend: 'overlay',
    overlayAlpha: 0.3,
    highlightColor: 'rgba(255, 215, 120, 0.5)',
    shadowColor: 'rgba(10, 20, 25, 0.5)',
    effectType: 'artdeco'
  },
  farmhouse: {
    brightness: 10,
    contrast: 8,
    saturation: -10,
    temperature: 32, // rustic barnwood & shiplap
    tint: 5,
    vignette: 0.22,
    bloom: 0.25,
    overlayColor: 'rgba(210, 195, 175, 0.28)', // natural weathered timber
    overlayBlend: 'soft-light',
    overlayAlpha: 0.3,
    highlightColor: 'rgba(255, 248, 235, 0.35)',
    shadowColor: 'rgba(50, 42, 35, 0.25)',
    effectType: 'farmhouse'
  }
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

/**
 * Script-driven room stylization algorithm:
 * Uses Canvas pixel grading, tone-mapping curves, atmospheric lighting overlays,
 * and style-specific architectural accents.
 */
export async function stylizeRoomImage(sourceBase64: string, styleId: string): Promise<string> {
  const img = await loadImage(sourceBase64);
  const canvas = document.createElement('canvas');
  const targetWidth = 1024;
  const targetHeight = Math.round((targetWidth * 3) / 4); // 4:3 ratio
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // 1. Draw source image scaled to 4:3 cover
  const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
  const scaledW = img.width * scale;
  const scaledH = img.height * scale;
  const offsetX = (targetWidth - scaledW) / 2;
  const offsetY = (targetHeight - scaledH) / 2;

  ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

  const preset = STYLE_PRESETS[styleId] || STYLE_PRESETS.japandi;

  // 2. Pixel-level manipulation (Color grading, temperature, contrast, saturation)
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  const contrastFactor = (259 * (preset.contrast + 255)) / (255 * (259 - preset.contrast));
  const brightnessOffset = (preset.brightness / 100) * 255;
  const tempR = (preset.temperature / 100) * 35;
  const tempB = -(preset.temperature / 100) * 30;
  const tintG = -(preset.tint / 100) * 25;
  const tintR = (preset.tint / 100) * 15;
  const satFactor = 1 + preset.saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness & Contrast
    r = contrastFactor * (r - 128) + 128 + brightnessOffset;
    g = contrastFactor * (g - 128) + 128 + brightnessOffset;
    b = contrastFactor * (b - 128) + 128 + brightnessOffset;

    // Color Temperature & Tint
    r += tempR + tintR;
    g += tintG;
    b += tempB;

    // Saturation
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * satFactor;
    g = gray + (g - gray) * satFactor;
    b = gray + (b - gray) * satFactor;

    // Style-specific channel grading
    if (preset.effectType === 'biophilic') {
      // Enhance green vitality and leaf richness
      if (g > b * 0.9) {
        g = Math.min(255, g * 1.15 + 10);
      }
    } else if (preset.effectType === 'industrial') {
      // Crush midtones for concrete / iron mood
      if (gray < 140) {
        r *= 0.92;
        g *= 0.92;
        b *= 0.96;
      }
    } else if (preset.effectType === 'luxury') {
      // Golden highlights and rich shadow depth
      if (gray > 180) {
        r = Math.min(255, r * 1.08);
        g = Math.min(255, g * 1.04);
      } else if (gray < 80) {
        r *= 0.88;
        g *= 0.85;
        b *= 0.88;
      }
    } else if (preset.effectType === 'midcentury') {
      // Warm 70s Kodachrome warmth
      r = Math.min(255, r * 1.06 + 8);
      g = Math.min(255, g * 1.02);
      b *= 0.92;
    } else if (preset.effectType === 'coastal') {
      // Cyan ocean air
      b = Math.min(255, b * 1.12 + 6);
      g = Math.min(255, g * 1.04);
    } else if (preset.effectType === 'artdeco') {
      // Deep dramatic jewel tones
      if (gray < 120) {
        g = Math.min(255, g * 1.08);
        b = Math.min(255, b * 1.05);
      } else {
        r = Math.min(255, r * 1.08 + 10);
        g = Math.min(255, g * 1.05);
      }
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  ctx.putImageData(imgData, 0, 0);

  // 3. Atmospheric Lighting & Texture Overlays
  ctx.save();

  // Wash overlay
  if (preset.overlayColor) {
    ctx.globalCompositeOperation = preset.overlayBlend || 'soft-light';
    ctx.fillStyle = preset.overlayColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Soft diffuse Bloom / Sunlight beam
  if (preset.bloom > 0) {
    ctx.globalCompositeOperation = 'screen';
    const bloomGrad = ctx.createRadialGradient(
      targetWidth * 0.35, targetHeight * 0.25, 40,
      targetWidth * 0.45, targetHeight * 0.4, targetWidth * 0.75
    );
    bloomGrad.addColorStop(0, preset.highlightColor || 'rgba(255, 250, 240, 0.4)');
    bloomGrad.addColorStop(0.5, 'rgba(255, 245, 230, 0.15)');
    bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Style-specific artistic accent passes
  if (preset.effectType === 'japandi') {
    // Gentle bamboo wood sunlight striping
    ctx.globalCompositeOperation = 'soft-light';
    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    grad.addColorStop(0, 'rgba(240, 228, 205, 0.35)');
    grad.addColorStop(0.5, 'rgba(225, 210, 185, 0.1)');
    grad.addColorStop(1, 'rgba(180, 160, 135, 0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (preset.effectType === 'biophilic') {
    // Dappled organic sunlight pattern
    ctx.globalCompositeOperation = 'overlay';
    const sunGrad = ctx.createRadialGradient(targetWidth * 0.8, 0, 100, targetWidth * 0.8, 0, targetWidth * 0.9);
    sunGrad.addColorStop(0, 'rgba(255, 255, 220, 0.4)');
    sunGrad.addColorStop(0.7, 'rgba(120, 210, 140, 0.15)');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (preset.effectType === 'luxury') {
    // Polished architectural rim lighting
    ctx.globalCompositeOperation = 'color-dodge';
    const goldGrad = ctx.createLinearGradient(0, targetHeight, targetWidth, 0);
    goldGrad.addColorStop(0, 'rgba(0,0,0,0)');
    goldGrad.addColorStop(0.7, 'rgba(195, 155, 80, 0.18)');
    goldGrad.addColorStop(1, 'rgba(255, 235, 180, 0.3)');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (preset.effectType === 'coastal') {
    // Sea breeze top-down light
    ctx.globalCompositeOperation = 'screen';
    const skyGrad = ctx.createLinearGradient(0, 0, 0, targetHeight);
    skyGrad.addColorStop(0, 'rgba(180, 225, 255, 0.25)');
    skyGrad.addColorStop(0.6, 'rgba(220, 245, 255, 0.08)');
    skyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Edge Vignette
  if (preset.vignette > 0) {
    ctx.globalCompositeOperation = 'multiply';
    const vigGrad = ctx.createRadialGradient(
      targetWidth / 2, targetHeight / 2, targetWidth * 0.35,
      targetWidth / 2, targetHeight / 2, targetWidth * 0.72
    );
    vigGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    vigGrad.addColorStop(0.7, 'rgba(220, 220, 220, 1)');
    vigGrad.addColorStop(1, `rgba(40, 35, 30, ${1 - preset.vignette * 0.8})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Script-driven Cinematic Video Generator:
 * Creates a real, fluid 4-second video clip using HTML5 Canvas animation
 * and MediaRecorder (Ken Burns slow camera dolly, atmospheric lighting ray sweep).
 * Returns a playable blob URL or data URL for the <video> element.
 */
export async function generateCinematicVideo(
  imageSrc: string,
  styleName: string
): Promise<string> {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 600; // 4:3
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for video generation');

  const durationSec = 3.5;
  const fps = 30;
  const totalFrames = Math.round(durationSec * fps);

  // Check if MediaRecorder is supported
  const stream = canvas.captureStream ? canvas.captureStream(fps) : null;
  let recorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];

  if (stream && typeof MediaRecorder !== 'undefined') {
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm',
      'video/mp4'
    ];
    let selectedMime = '';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    if (selectedMime) {
      recorder = new MediaRecorder(stream, { mimeType: selectedMime, videoBitsPerSecond: 3000000 });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
    }
  }

  return new Promise(async (resolve) => {
    if (recorder) {
      try {
        recorder.start();
      } catch (err) {
        console.warn('Could not start MediaRecorder, falling back:', err);
        recorder = null;
      }
    }

    if (!recorder) {
      // If MediaRecorder is not supported or failed to start, resolve immediately
      resolve(imageSrc);
      return;
    }

    let frame = 0;

    const renderFrame = () => {
      const progress = frame / totalFrames; // 0.0 to 1.0

      // Smooth easing (ease-in-out cubic)
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Cinematic Ken Burns camera transformation:
      // Subtle zoom: 1.00 -> 1.12
      // Subtle pan: horizontally drifts -15px to +15px
      const zoom = 1.0 + ease * 0.12;
      const panX = Math.sin(progress * Math.PI) * 20;
      const panY = -ease * 10;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Transform origin to center
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // Draw stylized room image
      ctx.drawImage(img, 0, 0, width, height);

      // Cinematic lighting sweep (light beam travelling gently across the room)
      ctx.globalCompositeOperation = 'screen';
      const beamX = width * (-0.2 + ease * 1.4);
      const beamGrad = ctx.createLinearGradient(beamX - 180, 0, beamX + 180, height);
      beamGrad.addColorStop(0, 'rgba(255, 250, 230, 0)');
      beamGrad.addColorStop(0.5, 'rgba(255, 245, 220, 0.16)');
      beamGrad.addColorStop(1, 'rgba(255, 250, 230, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric vignette
      ctx.globalCompositeOperation = 'multiply';
      const vig = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.72);
      vig.addColorStop(0, 'rgba(255,255,255,1)');
      vig.addColorStop(1, 'rgba(30,25,20,0.85)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      frame++;

      if (frame < totalFrames) {
        // Continue recording frames
        requestAnimationFrame(renderFrame);
      } else {
        // Complete video capture
        if (recorder && recorder.state !== 'inactive') {
          recorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: recorder?.mimeType || 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            resolve(videoUrl);
          };
          recorder.stop();
        } else {
          // Fallback to stylized image data URL if recorder is unavailable
          resolve(imageSrc);
        }
      }
    };

    renderFrame();
  });
}
