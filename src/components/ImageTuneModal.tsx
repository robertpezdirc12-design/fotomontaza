/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Sliders, RotateCcw, Download, Check, Sparkles } from 'lucide-react';

interface ImageTuneModalProps {
  styleName: string;
  sourceImage: string;
  onClose: () => void;
  onApply: (tunedBase64: string) => void;
}

export default function ImageTuneModal({
  styleName,
  sourceImage,
  onClose,
  onApply
}: ImageTuneModalProps) {
  const [brightness, setBrightness] = useState(100); // 70 to 130
  const [contrast, setContrast] = useState(100);     // 70 to 140
  const [warmth, setWarmth] = useState(0);           // -40 to +40
  const [saturation, setSaturation] = useState(100); // 50 to 160
  const [vignette, setVignette] = useState(0);       // 0 to 50

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);

  // Load base image into an HTMLImageElement
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgElementRef.current = img;
      renderAdjustedImage();
    };
    img.src = sourceImage;
  }, [sourceImage]);

  // Re-render canvas whenever sliders change
  const renderAdjustedImage = () => {
    const canvas = canvasRef.current;
    const img = imgElementRef.current;
    if (!canvas || !img) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw base image
    ctx.drawImage(img, 0, 0);

    // Get pixel data
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    const bFactor = brightness / 100;
    const cFactor = (contrast - 100) * 2.55;
    const cMult = (259 * (cFactor + 255)) / (255 * (259 - cFactor));
    const sFactor = saturation / 100;
    const rShift = warmth * 0.7;
    const bShift = -warmth * 0.7;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    const vigStrength = vignette / 100;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // 1. Warmth
      r += rShift;
      b += bShift;

      // 2. Brightness
      r *= bFactor;
      g *= bFactor;
      b *= bFactor;

      // 3. Contrast
      r = cMult * (r - 128) + 128;
      g = cMult * (g - 128) + 128;
      b = cMult * (b - 128) + 128;

      // 4. Saturation
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * sFactor;
      g = gray + (g - gray) * sFactor;
      b = gray + (b - gray) * sFactor;

      // 5. Vignette
      if (vigStrength > 0) {
        const px = (i / 4) % canvas.width;
        const py = Math.floor((i / 4) / canvas.width);
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
        const vigFactor = 1 - (dist / maxDist) * vigStrength;
        r *= vigFactor;
        g *= vigFactor;
        b *= vigFactor;
      }

      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    if (imgElementRef.current) {
      renderAdjustedImage();
    }
  }, [brightness, contrast, warmth, saturation, vignette]);

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setWarmth(0);
    setSaturation(100);
    setVignette(0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `tuned-${styleName.toLowerCase()}-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tunedBase64 = canvas.toDataURL('image/jpeg', 0.92);
    onApply(tunedBase64);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-black/10">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase">
                Prilagoditev tona in svetlobe
              </span>
              <h2 className="text-xl font-bold text-[#222222] font-syncopate">{styleName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title="Ponastavi na privzeto"
              className="px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 text-xs font-semibold text-[#222222] transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ponastavi</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#222222] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Canvas Preview + Controls */}
        <div className="p-6 overflow-y-auto flex flex-col md:flex-row gap-6">
          {/* Canvas Preview Area */}
          <div className="flex-1 flex flex-col items-center justify-center bg-[#1c1d22] rounded-2xl p-2 relative overflow-hidden min-h-[260px]">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[360px] object-contain rounded-xl shadow-lg"
            />
          </div>

          {/* Controls Sliders */}
          <div className="w-full md:w-72 space-y-4 text-xs">
            {/* Brightness */}
            <div>
              <div className="flex justify-between font-semibold text-[#222222] mb-1">
                <span>Svetlost</span>
                <span className="font-mono text-[#222222]/60">{brightness}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="130"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex justify-between font-semibold text-[#222222] mb-1">
                <span>Kontrast</span>
                <span className="font-mono text-[#222222]/60">{contrast}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="140"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Warmth / Color Temp */}
            <div>
              <div className="flex justify-between font-semibold text-[#222222] mb-1">
                <span>Toplina (Kelvin)</span>
                <span className="font-mono text-[#222222]/60">
                  {warmth > 0 ? `+${warmth}` : warmth}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                value={warmth}
                onChange={(e) => setWarmth(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#222222]/40 mt-0.5">
                <span>Hladno (Modra)</span>
                <span>Toplo (Zlata)</span>
              </div>
            </div>

            {/* Saturation */}
            <div>
              <div className="flex justify-between font-semibold text-[#222222] mb-1">
                <span>Nasičenost barv</span>
                <span className="font-mono text-[#222222]/60">{saturation}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="160"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Vignette */}
            <div>
              <div className="flex justify-between font-semibold text-[#222222] mb-1">
                <span>Vinjeta (Temnjenje robov)</span>
                <span className="font-mono text-[#222222]/60">{vignette}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={vignette}
                onChange={(e) => setVignette(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#faf9f6] border-t border-black/5 flex items-center justify-between gap-3">
          <button
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-full border border-black/15 text-xs font-semibold text-[#222222] hover:bg-black/5 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Prenesi sliko</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-black/15 text-xs font-semibold text-[#222222] hover:bg-black/5 transition-colors cursor-pointer"
            >
              Prekliči
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-[#333333] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Uporabi spremembe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
