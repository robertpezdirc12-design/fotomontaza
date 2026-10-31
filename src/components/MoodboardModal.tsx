/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StyleConfig } from '../data/styleData';
import { 
  X, 
  Sparkles, 
  Box, 
  Check, 
  Palette, 
  Lightbulb, 
  Armchair, 
  Layers, 
  Coins, 
  Compass, 
  Printer, 
  TrendingUp,
  HelpCircle,
  Calculator,
  Ruler,
  Copy
} from 'lucide-react';

interface MoodboardModalProps {
  style: StyleConfig;
  previewImage?: string;
  onClose: () => void;
  onOpen3D?: () => void;
}

export default function MoodboardModal({ style, previewImage, onClose, onOpen3D }: MoodboardModalProps) {
  const [activeTab, setActiveTab] = useState<'palette' | 'budget' | 'calc'>('palette');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedCalc, setCopiedCalc] = useState(false);

  // Room dimension calculator inputs
  const [roomLength, setRoomLength] = useState<number>(5.0);
  const [roomWidth, setRoomWidth] = useState<number>(4.2);
  const [roomHeight, setRoomHeight] = useState<number>(2.6);

  // Calculations
  const roomArea = Math.round(roomLength * roomWidth * 10) / 10;
  const roomPerimeter = Math.round(2 * (roomLength + roomWidth) * 10) / 10;
  // Wall area with 15% deduction for doors/windows
  const grossWallArea = Math.round(roomPerimeter * roomHeight * 10) / 10;
  const netWallArea = Math.round(grossWallArea * 0.85 * 10) / 10;
  // Paint liters (approx 5 m² per liter for 2 coats)
  const paintLiters = Math.round((netWallArea / 5) * 10) / 10;
  const paintBuckets5L = Math.ceil(paintLiters / 5);
  // Flooring with 10% wastage
  const flooringSqm = Math.round(roomArea * 1.1 * 10) / 10;
  const flooringPacks = Math.ceil(flooringSqm / 2.0); // approx 2 m² per pack
  // Baseboard with door deduction (~1.6m)
  const baseboardMeters = Math.max(0, Math.round((roomPerimeter - 1.6) * 10) / 10);

  // Cost multiplier based on level
  const baseRatePerSqm = style.budgetEstimate.level === '€€€€' ? 150 : style.budgetEstimate.level === '€€€' ? 110 : 75;
  const estimatedCost = Math.round(roomArea * baseRatePerSqm);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const handleCopyCalcSummary = () => {
    const text = `PROJEKT SPACE LIFT - SPECIFIKACIJA MATERIALA ZA PROSTOR\nSlog: ${style.name}\nDimenzije sobe: ${roomLength} m × ${roomWidth} m (višina ${roomHeight} m)\nPovršina: ${roomArea} m²\n\nPOTREBEN MATERIAL:\n- Barva za stene (2 nanosa): ${paintLiters} L (${paintBuckets5L} × 5L kanti)\n- Talna obloga (+10% rezalni ostanek): ${flooringSqm} m² (~${flooringPacks} paketov)\n- Zaključne letve: ${baseboardMeters} tekočih metrov\n- Okvirna ocena investicije: ~${estimatedCost.toLocaleString('sl-SI')} € (${style.budgetEstimate.level})`;
    navigator.clipboard?.writeText(text);
    setCopiedCalc(true);
    setTimeout(() => setCopiedCalc(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-black/10">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase">
                  Arhitekturni Moodboard
                </span>
                <span className="text-[10px] font-mono bg-black/5 text-[#222222]/70 px-2 py-0.5 rounded-full font-semibold">
                  {style.budgetEstimate.level} ({style.budgetEstimate.range})
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#222222] font-syncopate">{style.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Natisni ali shrani kot PDF"
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#222222] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#222222] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex gap-2 border-b border-black/5 bg-[#faf9f6]">
          <button
            onClick={() => setActiveTab('palette')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'palette'
                ? 'border-amber-600 text-[#222222]'
                : 'border-transparent text-[#222222]/50 hover:text-[#222222]'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            <span>Slog & Paleta</span>
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'budget'
                ? 'border-amber-600 text-[#222222]'
                : 'border-transparent text-[#222222]/50 hover:text-[#222222]'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>Ocena stroškov & Nasveti</span>
          </button>
          <button
            onClick={() => setActiveTab('calc')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'calc'
                ? 'border-amber-600 text-[#222222]'
                : 'border-transparent text-[#222222]/50 hover:text-[#222222]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-600" />
            <span>Kalkulator materiala & m²</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#222222]">
          {/* Top Banner with Image Preview if available */}
          {previewImage && (
            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-black/10 relative shadow-xs">
              <img src={previewImage} alt={style.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                <div>
                  <p className="text-white text-xs font-medium leading-relaxed drop-shadow-sm">{style.description}</p>
                  <p className="text-white/70 text-[10px] mt-1 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-400" />
                    <span>Idealen za: {style.bestSuitedFor}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'palette' && (
            <>
              {/* Color Palette Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]/70 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-600" />
                    <span>Avtohtona barvna paleta sloga</span>
                  </h3>
                  <span className="text-[10px] text-[#222222]/40">Kliknite za kopiranje HEX kode</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {style.palette.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleCopyHex(color.hex)}
                      className="p-2.5 rounded-2xl border border-black/10 bg-[#faf9f6] flex flex-col gap-2 text-left hover:border-black/30 transition-all active:scale-95 cursor-pointer"
                    >
                      <div
                        className="w-full h-12 rounded-xl border border-black/10 shadow-inner flex items-center justify-center"
                        style={{ backgroundColor: color.hex }}
                      >
                        {copiedHex === color.hex && (
                          <div className="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" /> Kopirano
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[#222222] truncate">{color.name}</div>
                        <div className="text-[11px] font-mono text-[#222222]/60 uppercase">{color.hex}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Materials */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]/70 flex items-center gap-1.5 mb-2.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Priporočeni naravni & zaključni materiali</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {style.materials.map((mat) => (
                    <span
                      key={mat}
                      className="px-3 py-1.5 rounded-xl bg-[#faf9f6] border border-black/5 text-xs text-[#222222]/80 font-medium"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lighting Recommendation */}
              <div className="p-4 rounded-2xl bg-[#faf9f6] border border-black/5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#222222] uppercase tracking-wide">
                    Svetlobni načrt & temperatura svetlobe
                  </h4>
                  <p className="text-xs text-[#222222]/80 mt-1 leading-relaxed">{style.lighting}</p>
                </div>
              </div>

              {/* Iconic Furniture Pieces */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]/70 flex items-center gap-1.5 mb-2.5">
                  <Armchair className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ključni kosi pohištva za ta slog</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {style.furniture.map((item) => (
                    <div
                      key={item}
                      className="p-2.5 rounded-xl bg-[#faf9f6] border border-black/5 flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'budget' && (
            /* Budget & Execution Tab */
            <div className="space-y-6">
              {/* Overall Budget Overview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Ocenjen stroškovni razpon prenove
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white">
                    {style.budgetEstimate.level}
                  </span>
                </div>
                <div className="text-2xl font-bold font-syncopate text-[#222222]">
                  {style.budgetEstimate.range}
                </div>
                <p className="text-[11px] text-[#222222]/70 mt-1">
                  Ocena vključuje osvežitev pohištva, ključna svetila, tekstil in osnovne stenske/talne posege za povprečno dnevno sobo (20–30 m²).
                </p>
              </div>

              {/* Cost Breakdown Bars */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]/70 flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  <span>Stroškovna razdelitev investicije</span>
                </h3>
                <div className="space-y-3">
                  {style.budgetEstimate.breakdown.map((item) => (
                    <div key={item.category} className="p-3 rounded-xl bg-[#faf9f6] border border-black/5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-[#222222]">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-900 font-bold">{item.cost}</span>
                          <span className="text-[10px] text-[#222222]/40">({item.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architect Styling Tips */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]/70 flex items-center gap-1.5 mb-3">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Praktični nasveti za izvedbo</span>
                </h3>
                <div className="space-y-2">
                  {style.stylingTips.map((tip, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#faf9f6] border border-black/5 flex items-start gap-2.5 text-xs text-[#222222]/85">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calc' && (
            /* Room Material & m² Calculator Tab */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-[#faf9f6] border border-black/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#222222] mb-3">
                  <Ruler className="w-4 h-4 text-amber-600" />
                  <span>Vnesite dimenzije svojega prostora</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[#222222]/60 font-medium block mb-1">
                      Dolžina sobe (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.5"
                      max="15.0"
                      value={roomLength}
                      onChange={(e) => setRoomLength(parseFloat(e.target.value) || 1)}
                      className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#222222] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#222222]/60 font-medium block mb-1">
                      Širina sobe (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.5"
                      max="15.0"
                      value={roomWidth}
                      onChange={(e) => setRoomWidth(parseFloat(e.target.value) || 1)}
                      className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#222222] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#222222]/60 font-medium block mb-1">
                      Višina stropa (m)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="2.0"
                      max="4.5"
                      value={roomHeight}
                      onChange={(e) => setRoomHeight(parseFloat(e.target.value) || 2)}
                      className="w-full bg-white border border-black/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#222222] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-semibold">
                  <span>Tlorisna površina: <strong className="font-mono text-amber-700">{roomArea} m²</strong></span>
                  <span>Obseg sten: <strong className="font-mono text-[#222222]">{roomPerimeter} m</strong></span>
                </div>
              </div>

              {/* Calculated Material Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-200/50 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                      Barva za stene (2 nanosa)
                    </div>
                    <div className="text-xl font-bold font-syncopate text-[#222222]">
                      {paintLiters} L
                    </div>
                    <p className="text-[11px] text-[#222222]/60 mt-1">
                      Za {netWallArea} m² sten (z 15% odbitkom za okna in vrata). Priporočamo {paintBuckets5L} × 5L kanto.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200/50 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Talna obloga (+10% rezanja)
                    </div>
                    <div className="text-xl font-bold font-syncopate text-[#222222]">
                      {flooringSqm} m²
                    </div>
                    <p className="text-[11px] text-[#222222]/60 mt-1">
                      Vštet rezalni ostanek. Približno {flooringPacks} paketov parketa ali laminata.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-200/50 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Zaključne talne letve
                    </div>
                    <div className="text-xl font-bold font-syncopate text-[#222222]">
                      {baseboardMeters} m
                    </div>
                    <p className="text-[11px] text-[#222222]/60 mt-1">
                      Tekoči metri po obodu sobe brez vratne odprtine.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-purple-200/50 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                      Okvirna ocena investicije ({style.name})
                    </div>
                    <div className="text-xl font-bold font-syncopate text-[#222222]">
                      ~{estimatedCost.toLocaleString('sl-SI')} €
                    </div>
                    <p className="text-[11px] text-[#222222]/60 mt-1">
                      Preračunano za {roomArea} m² po standardu {style.budgetEstimate.level}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Copy specification button */}
              <button
                onClick={handleCopyCalcSummary}
                className="w-full py-2.5 rounded-2xl bg-[#faf9f6] hover:bg-black/5 border border-black/10 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedCalc ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Specifikacija materialov kopirana v odložišče!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kopiraj specifikacijo materialov za trgovino ali izvajalca</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#faf9f6] border-t border-black/5 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-black/15 text-xs font-semibold text-[#222222] hover:bg-black/5 transition-colors cursor-pointer"
          >
            Zapri
          </button>

          {onOpen3D && (
            <button
              onClick={() => {
                onClose();
                onOpen3D();
              }}
              className="px-6 py-2.5 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-[#333333] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Box className="w-4 h-4 text-amber-400" />
              <span>Odpri ta slog v 3D</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
