/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowUpRight, 
  Loader2, 
  Video, 
  Box, 
  Download, 
  Eye, 
  Columns2, 
  LayoutGrid, 
  Sparkles, 
  FileText, 
  Layers, 
  Check, 
  RotateCcw,
  Palette,
  Heart,
  Sliders,
  ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { stylizeRoomImage, generateCinematicVideo } from "./utils/scriptStylizer";
import { STYLE_CONFIGS, StyleConfig, ROOM_TYPES, RoomTypeConfig } from "./data/styleData";
import ThreeRoomScene from "./three/ThreeRoomScene";
import MoodboardModal from "./components/MoodboardModal";
import ImageTuneModal from "./components/ImageTuneModal";

type Screen = "welcome" | "countdown" | "loading" | "cards";

declare global {
  interface Window {
    aistudio?: {
      openSelectKey?: () => Promise<boolean | void>;
    };
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [view3D, setView3D] = useState(false);
  const [selected3DStyleId, setSelected3DStyleId] = useState<string>("japandi");
  const [activeMoodboardStyle, setActiveMoodboardStyle] = useState<StyleConfig | null>(null);
  const [tuneTargetStyle, setTuneTargetStyle] = useState<{ id: string; name: string; image: string } | null>(null);
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState<boolean>(false);

  // Favorites state persisted to localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('space_lift_favs') || '[]');
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      try {
        localStorage.setItem('space_lift_favs', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Compare & Split Modes
  const [isComparing, setIsComparing] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitModeType, setSplitModeType] = useState<'original' | 'dualStyle'>('original');
  const [dualCompareRightStyleId, setDualCompareRightStyleId] = useState<string>('midcentury');
  const [splitPercent, setSplitPercent] = useState(50);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const fetchingRef = useRef<Set<string>>(new Set());

  const [videoStatus, setVideoStatus] = useState<Record<string, 'generating' | 'polling' | 'ready' | 'failed'>>({});
  const [videos, setVideos] = useState<Record<string, string>>({});

  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Room type selection
  const [selectedRoomType, setSelectedRoomType] = useState<'living' | 'bedroom' | 'office' | 'dining'>('living');

  const handleDownloadImage = (styleId: string, styleName: string) => {
    const imgUrl = images[styleId];
    if (!imgUrl) return;
    const link = document.createElement("a");
    link.download = `space-lift-${styleId}-${Date.now()}.jpg`;
    link.href = imgUrl;
    link.click();
  };

  const handleDownloadComparison = async () => {
    const leftImgSrc = splitModeType === 'dualStyle' ? images[STYLE_CONFIGS[currentIndex].id] : uploadedImage;
    const rightImgSrc = splitModeType === 'dualStyle' 
      ? images[dualCompareRightStyleId] 
      : images[STYLE_CONFIGS[currentIndex].id];
    
    if (!leftImgSrc || !rightImgSrc) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    try {
      const [lImg, rImg] = await Promise.all([loadImg(leftImgSrc), loadImg(rightImgSrc)]);

      const splitX = (canvas.width * splitPercent) / 100;

      // Draw right image
      ctx.drawImage(rImg, 0, 0, canvas.width, canvas.height);

      // Draw left clipped image
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, canvas.height);
      ctx.clip();
      ctx.drawImage(lImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw divider line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, canvas.height);
      ctx.stroke();

      // Divider handle circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(splitX, canvas.height / 2, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222222';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('↔', splitX, canvas.height / 2);

      // Left label pill
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = 'bold 22px sans-serif';
      const leftText = splitModeType === 'dualStyle' ? STYLE_CONFIGS[currentIndex].name : 'Original';
      const leftWidth = ctx.measureText(leftText).width + 36;
      ctx.fillStyle = 'rgba(28, 29, 34, 0.85)';
      ctx.roundRect ? ctx.roundRect(24, canvas.height - 65, leftWidth, 42, 21) : ctx.fillRect(24, canvas.height - 65, leftWidth, 42);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(leftText, 42, canvas.height - 37);

      // Right label pill
      const rightText = splitModeType === 'dualStyle' 
        ? (STYLE_CONFIGS.find(s => s.id === dualCompareRightStyleId)?.name || dualCompareRightStyleId)
        : STYLE_CONFIGS[currentIndex].name;
      const rightWidth = ctx.measureText(rightText).width + 36;
      ctx.fillStyle = 'rgba(28, 29, 34, 0.85)';
      ctx.roundRect ? ctx.roundRect(canvas.width - rightWidth - 24, canvas.height - 65, rightWidth, 42, 21) : ctx.fillRect(canvas.width - rightWidth - 24, canvas.height - 65, rightWidth, 42);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(rightText, canvas.width - rightWidth - 6, canvas.height - 37);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `space-lift-primerjava-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export comparison image:', err);
    }
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error("Failed to access camera", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg");
        setUploadedImage(base64);
        setUploaded(true);
        fetchImage(0, base64).then(() => fetchImage(1, base64));
      }
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUploadedImage(base64);
        setBottomSheetOpen(false);
        setUploaded(true);
        fetchImage(0, base64).then(() => fetchImage(1, base64));
      };
      reader.readAsDataURL(file);
    }
  };

  // Demo room test
  const handleDemoUpload = async () => {
    try {
      const response = await fetch('/test-image2.jpeg');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUploadedImage(base64);
        setBottomSheetOpen(false);
        setUploaded(true);
        fetchImage(0, base64).then(() => fetchImage(1, base64));
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Demo image not found", e);
    }
  };

  const fetchImage = async (styleIndex: number, overrideImage?: string) => {
    if (styleIndex >= STYLE_CONFIGS.length) return;
    const style = STYLE_CONFIGS[styleIndex];
    if (images[style.id] || fetchingRef.current.has(style.id)) return;
    
    fetchingRef.current.add(style.id);

    try {
      const sourceImage = overrideImage || uploadedImage;
      if (!sourceImage) return;

      const stylizedImage = await stylizeRoomImage(sourceImage, style.id);
      setImages((prev) => ({ ...prev, [style.id]: stylizedImage }));
    } catch (e) {
      console.error("Failed to generate stylized image with script for", style.name, e);
    }
  };

  const fetchAllRemainingImages = () => {
    if (!uploadedImage) return;
    for (let i = 0; i < STYLE_CONFIGS.length; i++) {
      fetchImage(i);
    }
  };

  const generateVideo = async (styleId: string, base64Image: string) => {
    if (videoStatus[styleId]) return;

    setVideoStatus(prev => ({ ...prev, [styleId]: 'generating' }));

    try {
      const style = STYLE_CONFIGS.find(s => s.id === styleId);
      const videoUrl = await generateCinematicVideo(base64Image, style?.name || styleId);
      setVideos(prev => ({ ...prev, [styleId]: videoUrl }));
      setVideoStatus(prev => ({ ...prev, [styleId]: 'ready' }));
    } catch (e) {
      console.error("Failed to generate cinematic video with script:", e);
      setVideoStatus(prev => ({ ...prev, [styleId]: 'failed' }));
    }
  };

  const startGenerating = () => {
    setScreen("countdown");
    setCountdown(5);
  };

  const handleStartGenerating = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    startGenerating();
  };

  useEffect(() => {
    let timer: any;
    if (screen === "countdown") {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        if (images[STYLE_CONFIGS[0].id]) {
          setScreen("cards");
        } else {
          setScreen("loading");
        }
      }
    }
    return () => clearTimeout(timer);
  }, [screen, countdown, images]);

  useEffect(() => {
    if (screen === "loading" && images[STYLE_CONFIGS[0].id]) {
      setScreen("cards");
    }
  }, [screen, images]);

  useEffect(() => {
    if (screen === "cards") {
      fetchImage(currentIndex + 1);
    }
  }, [screen, currentIndex]);

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    if (offset.y < -100 || velocity.y < -500) {
      if (currentIndex < STYLE_CONFIGS.length) {
        setCurrentIndex((prev) => prev + 1);
      }
    }
  };

  const handleOpen3DWithStyle = (styleId: string) => {
    setSelected3DStyleId(styleId);
    setView3D(true);
  };

  const handleReset = () => {
    fetchingRef.current.clear();
    setUploaded(false);
    setUploadedImage(null);
    setCurrentIndex(0);
    setImages({});
    setVideos({});
    setVideoStatus({});
    setIsGridView(false);
    setIsSplitMode(false);
    setIsComparing(false);
    setScreen("welcome");
  };

  // Filtered styles for grid view
  const displayedStyles = filterFavoritesOnly
    ? STYLE_CONFIGS.filter(s => favorites.includes(s.id))
    : STYLE_CONFIGS;

  if (view3D) {
    return (
      <ThreeRoomScene
        initialStyleId={selected3DStyleId || STYLE_CONFIGS[currentIndex]?.id || 'japandi'}
        onClose={() => setView3D(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#EAE9E4] flex flex-col font-sans text-[#222222] overflow-x-hidden relative">
      {/* Architectural Moodboard Modal */}
      {activeMoodboardStyle && (
        <MoodboardModal
          style={activeMoodboardStyle}
          previewImage={images[activeMoodboardStyle.id]}
          onClose={() => setActiveMoodboardStyle(null)}
          onOpen3D={() => handleOpen3DWithStyle(activeMoodboardStyle.id)}
        />
      )}

      {/* Image Fine-Tuner Modal */}
      {tuneTargetStyle && (
        <ImageTuneModal
          styleName={tuneTargetStyle.name}
          sourceImage={tuneTargetStyle.image}
          onClose={() => setTuneTargetStyle(null)}
          onApply={(tunedBase64) => {
            setImages(prev => ({ ...prev, [tuneTargetStyle.id]: tunedBase64 }));
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {screen === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 min-h-screen absolute inset-0 w-full"
          >
            {uploaded && uploadedImage ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm aspect-[4/3] rounded-[32px] overflow-hidden mb-4 shadow-sm border border-[#222222]/10"
              >
                <img src={uploadedImage} alt="Uploaded room" className="w-full h-full object-cover" />
              </motion.div>
            ) : (
              <>
                <div className="text-[80px] leading-none mb-4">🛋️</div>
                <h1 className="text-[39px] font-syncopate font-bold mb-4 tracking-tight text-center">Space Lift</h1>
                <p className="text-[#222222]/60 mb-4 text-center px-4">
                  Raziščite in vizualizirajte svojo sobo v 10 vrhunskih slogih notranjega oblikovanja v nekaj sekundah
                </p>
              </>
            )}

            {!uploaded && (
              <div className="w-full max-w-sm mb-4 animate-in fade-in duration-300">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#222222]/50 text-center mb-2">
                  Izberite prostor za preobrazbo
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROOM_TYPES.map((rt) => {
                    const isSelected = selectedRoomType === rt.id;
                    return (
                      <button
                        key={rt.id}
                        type="button"
                        onClick={() => setSelectedRoomType(rt.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-white border-[#222222] shadow-sm font-semibold scale-101'
                            : 'bg-white/50 border-[#222222]/10 hover:bg-white/80'
                        }`}
                      >
                        <span className="text-xl shrink-0">{rt.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs text-[#222222] truncate font-medium">{rt.name}</div>
                          <div className="text-[10px] text-[#222222]/50 truncate">{rt.defaultArea} m²</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!uploaded && (
              <button
                onClick={startCamera}
                className="w-full max-w-sm rounded-[32px] bg-[#222222] text-white py-4 text-center font-medium shadow-sm active:scale-[0.98] transition-transform mb-3 block cursor-pointer"
              >
                Posnemi fotografijo
              </button>
            )}

            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload} 
            />

            <button
              onClick={(e) => {
                if (uploaded) {
                  handleStartGenerating(e);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="w-full max-w-sm rounded-[32px] border border-[#222222]/10 bg-white py-4 text-center font-medium shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
              style={uploaded ? { backgroundColor: "#222222", color: "white" } : {}}
            >
              {uploaded ? "Ogled slogov notranjega oblikovanja" : "Naloži fotografijo sobe"}
            </button>

            {!uploaded && (
              <button
                type="button"
                onClick={handleDemoUpload}
                className="w-full max-w-sm rounded-[32px] border border-[#222222]/15 bg-white/70 hover:bg-white text-[#222222]/80 py-3 text-center text-xs font-semibold tracking-wider uppercase shadow-xs active:scale-[0.98] transition-all mt-3 cursor-pointer"
              >
                Preizkusi s testno sobo (Demo)
              </button>
            )}

            {!uploaded && (
              <button
                type="button"
                onClick={() => {
                  setSelected3DStyleId("japandi");
                  setView3D(true);
                }}
                className="w-full max-w-sm rounded-[32px] border border-amber-600/30 bg-[#222222] hover:bg-[#333333] text-white py-3.5 text-center text-xs font-semibold tracking-wider uppercase shadow-xs active:scale-[0.98] transition-all mt-2.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <Box className="w-4 h-4 text-amber-400" />
                <span>Interaktivna 3D soba (Three.js)</span>
              </button>
            )}

            <div className="w-full max-w-sm mt-8 text-[11px] text-[#222222]/40 text-center leading-relaxed">
              <p>
                Predogled in vizualizacija prostora delujeta s pomočjo optimiziranih skript za obdelavo slik in kinematično animacijo v realnem času.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Screen */}
      <AnimatePresence>
        {screen === "countdown" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 relative z-10"
          >
            <div className="relative flex items-center justify-center">
              <span className="text-[140px] font-bold font-syncopate tracking-tighter text-[#222222]">
                {countdown}
              </span>
            </div>
            <p className="text-[#222222]/60 mt-4 text-sm font-medium tracking-wide uppercase">
              Uporaba algoritmov stiliziranja prostora...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet for Upload Options */}
      <AnimatePresence>
        {bottomSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBottomSheetOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 z-50 flex flex-col gap-3 pb-safe"
            >
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="file-upload" 
                onChange={handleFileUpload} 
              />
              <button
                onClick={() => {
                  setBottomSheetOpen(false);
                  startCamera();
                }}
                className="w-full text-center rounded-2xl bg-[#EAE9E4] py-4 font-medium active:bg-[#EAE9E4]/80 transition-colors block cursor-pointer"
              >
                Posnemi fotografijo
              </button>
              <label
                htmlFor="file-upload"
                className="w-full text-center rounded-2xl bg-[#EAE9E4] py-4 font-medium active:bg-[#EAE9E4]/80 transition-colors cursor-pointer block"
              >
                Izberi iz galerije
              </label>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {screen === "loading" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-white rounded-[32px] p-4 flex flex-col relative overflow-hidden shadow-sm pb-[20px] min-h-[500px]"
          >
            <div className="absolute -left-4 top-[calc(50%+80px)] w-8 h-8 rounded-full bg-[#EAE9E4] z-10" />
            <div className="absolute -right-4 top-[calc(50%+80px)] w-8 h-8 rounded-full bg-[#EAE9E4] z-10" />

            <div className="w-full aspect-[4/3] rounded-2xl bg-[#EAE9E4]/60 animate-pulse flex-none" />
            
            <div className="mt-8 space-y-3 px-2 flex-1">
              <div className="h-6 w-3/4 bg-[#EAE9E4]/60 rounded-full animate-pulse" />
              <div className="h-6 w-5/6 bg-[#EAE9E4]/60 rounded-full animate-pulse" />
              <div className="h-6 w-1/2 bg-[#EAE9E4]/60 rounded-full animate-pulse" />
            </div>

            <div className="mt-auto flex items-center gap-4 px-2 pb-2">
              <div className="h-10 w-28 bg-[#EAE9E4]/60 rounded-full animate-pulse" />
              <div className="h-10 w-10 bg-[#EAE9E4]/60 rounded-full animate-pulse" />
            </div>
          </motion.div>
        </div>
      )}

      {screen === "cards" && (
        <div className="flex-1 flex flex-col items-center justify-start p-4 relative min-h-screen">
          {/* Top Navigation Bar */}
          <header className="w-full max-w-4xl py-3 px-2 flex items-center justify-between z-50 mb-3 flex-wrap gap-2">
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-[#222222]/70 hover:text-[#222222] transition-colors cursor-pointer flex items-center gap-1.5 bg-white/80 px-3.5 py-2 rounded-full border border-black/5 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Začni znova</span>
            </button>

            {/* View Mode Toggle: Cards vs Grid Gallery */}
            <div className="flex items-center gap-1 bg-white/90 p-1 rounded-full border border-black/10 shadow-xs">
              <button
                onClick={() => setIsGridView(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isGridView 
                    ? 'bg-[#222222] text-white shadow-xs' 
                    : 'text-[#222222]/70 hover:text-[#222222]'
                }`}
              >
                <span>🃏 Kartica</span>
              </button>
              <button
                onClick={() => {
                  setIsGridView(true);
                  fetchAllRemainingImages();
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isGridView 
                    ? 'bg-[#222222] text-white shadow-xs' 
                    : 'text-[#222222]/70 hover:text-[#222222]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>⊞ Vseh 10 stilov</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelected3DStyleId(STYLE_CONFIGS[currentIndex]?.id || 'japandi');
                  setView3D(true);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white text-[#222222] px-3.5 py-2 rounded-full border border-[#222222]/15 shadow-xs hover:bg-[#faf9f6] active:scale-95 transition-all cursor-pointer"
              >
                <Box className="w-4 h-4 text-amber-600" />
                <span>3D Soba</span>
              </button>
            </div>
          </header>

          {/* MAIN CONTENT AREA */}
          {isGridView ? (
            /* =================== GRID GALLERY VIEW =================== */
            <div className="w-full max-w-5xl pb-16 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold font-syncopate tracking-tight text-[#222222]">
                    Galerija vseh 10 slogov
                  </h2>
                  <p className="text-xs text-[#222222]/60 mt-0.5">
                    Hitra primerjava, prilagajanje tona ter 3D ogled celotnega kataloga stilov.
                  </p>
                </div>

                {/* Filter Chips: All vs Favorites */}
                <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-full border border-black/10 shadow-xs">
                  <button
                    onClick={() => setFilterFavoritesOnly(false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                      !filterFavoritesOnly
                        ? 'bg-[#222222] text-white shadow-xs'
                        : 'text-[#222222]/60 hover:text-[#222222]'
                    }`}
                  >
                    Vsi ({STYLE_CONFIGS.length})
                  </button>
                  <button
                    onClick={() => setFilterFavoritesOnly(true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                      filterFavoritesOnly
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-[#222222]/60 hover:text-[#222222]'
                    }`}
                  >
                    <Heart className="w-3 h-3 fill-current" />
                    <span>Priljubljeni ({favorites.length})</span>
                  </button>
                </div>
              </div>

              {displayedStyles.length === 0 ? (
                <div className="text-center py-16 bg-white/60 rounded-3xl border border-black/5 p-8">
                  <div className="text-4xl mb-3">❤️</div>
                  <h3 className="font-bold text-base text-[#222222]">Ni shranjenih priljubljenih slogov</h3>
                  <p className="text-xs text-[#222222]/60 mt-1 max-w-sm mx-auto">
                    Kliknite na srček pri kateremkoli slogu, da ga dodate v zbirko svojih favoritov.
                  </p>
                  <button
                    onClick={() => setFilterFavoritesOnly(false)}
                    className="mt-4 px-4 py-2 bg-[#222222] text-white text-xs font-semibold rounded-full cursor-pointer"
                  >
                    Prikaži vse sloge
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedStyles.map((style) => {
                    const idx = STYLE_CONFIGS.findIndex(s => s.id === style.id);
                    const img = images[style.id];
                    const isFav = favorites.includes(style.id);

                    return (
                      <div
                        key={style.id}
                        className="bg-white rounded-[24px] p-3.5 shadow-xs border border-black/5 flex flex-col hover:shadow-md transition-shadow group"
                      >
                        {/* Image Preview Container */}
                        <div className="w-full aspect-[4/3] rounded-[18px] overflow-hidden bg-[#EAE9E4]/70 relative flex items-center justify-center">
                          {img ? (
                            <img
                              src={img}
                              alt={style.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-[#222222]/40">
                              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                              <span className="text-[10px] uppercase font-bold tracking-wider">Obdelava...</span>
                            </div>
                          )}

                          {/* Style badge */}
                          <div className="absolute top-2.5 left-2.5 bg-[#1c1d22]/80 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase shadow-xs">
                            {style.name}
                          </div>

                          {/* Action icons on top right */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            {/* Favorite Button */}
                            <button
                              onClick={(e) => toggleFavorite(style.id, e)}
                              title={isFav ? "Odstrani iz priljubljenih" : "Dodaj med priljubljene"}
                              className={`p-1.5 rounded-full shadow-xs active:scale-90 transition-transform cursor-pointer ${
                                isFav ? 'bg-rose-50 text-rose-600' : 'bg-white/90 text-[#222222]'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-600' : ''}`} />
                            </button>

                            {/* Download Button */}
                            {img && (
                              <button
                                onClick={() => handleDownloadImage(style.id, style.name)}
                                title="Prenesi sliko"
                                className="bg-white/90 hover:bg-white text-[#222222] p-1.5 rounded-full shadow-xs active:scale-90 transition-transform cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Content & Palette */}
                        <div className="p-2 pt-3 flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-1.5">
                            <h3 className="font-bold text-sm text-[#222222]">{style.name}</h3>
                            
                            {/* Mini Palette dots */}
                            <div className="flex items-center gap-1">
                              {style.palette.map((swatch) => (
                                <div
                                  key={swatch.hex}
                                  title={`${swatch.name} (${swatch.hex})`}
                                  style={{ backgroundColor: swatch.hex }}
                                  className="w-3 h-3 rounded-full border border-black/10 shadow-xs"
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-[11px] text-[#222222]/70 leading-relaxed line-clamp-2 mb-3">
                            {style.description}
                          </p>

                          {/* Card Action Buttons */}
                          <div className="mt-auto grid grid-cols-4 gap-1 pt-2 border-t border-black/5">
                            <button
                              onClick={() => {
                                setCurrentIndex(idx >= 0 ? idx : 0);
                                setIsGridView(false);
                              }}
                              className="px-1.5 py-1.5 rounded-xl bg-[#faf9f6] hover:bg-black/5 text-[#222222] text-[10px] font-semibold text-center transition-colors cursor-pointer"
                              title="Primerjaj ta slog v kartici"
                            >
                              Primerjaj
                            </button>

                            {/* Fine-Tuner button */}
                            <button
                              disabled={!img}
                              onClick={() => {
                                if (img) {
                                  setTuneTargetStyle({ id: style.id, name: style.name, image: img });
                                }
                              }}
                              className="px-1.5 py-1.5 rounded-xl bg-[#faf9f6] hover:bg-black/5 text-[#222222] text-[10px] font-semibold text-center transition-colors cursor-pointer flex items-center justify-center gap-0.5 disabled:opacity-40"
                              title="Prilagodi svetlobo, kontrast in barvni ton"
                            >
                              <Sliders className="w-2.5 h-2.5 text-neutral-600" />
                              <span>Uredi</span>
                            </button>

                            <button
                              onClick={() => setActiveMoodboardStyle(style)}
                              className="px-1.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-semibold text-center transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                              title="Pokaži arhitekturni moodboard in oceno stroškov"
                            >
                              <Palette className="w-2.5 h-2.5 text-amber-600" />
                              <span>Slog</span>
                            </button>

                            <button
                              onClick={() => handleOpen3DWithStyle(style.id)}
                              className="px-1.5 py-1.5 rounded-xl bg-[#222222] hover:bg-[#333333] text-white text-[10px] font-semibold text-center transition-colors cursor-pointer flex items-center justify-center gap-0.5"
                              title="Odpri v 3D pogledu"
                            >
                              <Box className="w-2.5 h-2.5 text-amber-400" />
                              <span>3D</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* =================== SINGLE CARD DECK VIEW =================== */
            <div className="w-full max-w-sm relative grid mt-2">
              <AnimatePresence initial={false}>
                {currentIndex < STYLE_CONFIGS.length ? (
                  <motion.div
                    key={currentIndex}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={handleDragEnd}
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1, zIndex: 10 }}
                    exit={{ y: -300, opacity: 0, scale: 0.9, zIndex: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="[grid-area:1/1] w-full bg-white rounded-[32px] flex flex-col shadow-sm cursor-grab active:cursor-grabbing pb-[20px] relative"
                    style={{ touchAction: "none" }}
                  >
                    <div className="p-4 relative flex-none">
                      <div
                        ref={splitContainerRef}
                        onPointerMove={(e) => {
                          if (isSplitMode && splitContainerRef.current) {
                            const rect = splitContainerRef.current.getBoundingClientRect();
                            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                            setSplitPercent(Math.round((x / rect.width) * 100));
                          }
                        }}
                        className="w-full aspect-[4/3] rounded-[20px] overflow-hidden bg-[#EAE9E4]/60 flex items-center justify-center relative select-none"
                      >
                        {isSplitMode && uploadedImage && images[STYLE_CONFIGS[currentIndex].id] ? (
                          <>
                            {/* Base: Stylized Image or Dual Style Right */}
                            {splitModeType === 'dualStyle' && images[dualCompareRightStyleId] ? (
                              <img
                                src={images[dualCompareRightStyleId]}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                alt="Desni stil"
                              />
                            ) : (
                              <img
                                src={images[STYLE_CONFIGS[currentIndex].id]}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                alt="Stilizirana soba"
                              />
                            )}

                            {/* Clipped: Original Room or Dual Style Left */}
                            <div
                              className="absolute inset-0 overflow-hidden pointer-events-none"
                              style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                            >
                              <img
                                src={splitModeType === 'dualStyle' ? images[STYLE_CONFIGS[currentIndex].id] : uploadedImage}
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                alt="Levi primerjalni element"
                              />
                              <div className="absolute bottom-3 left-3 bg-[#1c1d22]/80 text-white text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-xs">
                                {splitModeType === 'dualStyle' ? STYLE_CONFIGS[currentIndex].name : 'Original'}
                              </div>
                            </div>

                            <div className="absolute bottom-3 right-3 bg-[#1c1d22]/80 text-white text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-xs pointer-events-none">
                              {splitModeType === 'dualStyle' 
                                ? (STYLE_CONFIGS.find(s => s.id === dualCompareRightStyleId)?.name || dualCompareRightStyleId)
                                : STYLE_CONFIGS[currentIndex].name}
                            </div>

                            {/* Divider Line & Grip Handle */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none z-20 flex items-center justify-center"
                              style={{ left: `${splitPercent}%` }}
                            >
                              <div className="w-7 h-7 rounded-full bg-white text-[#222222] shadow-md flex items-center justify-center text-[10px] font-bold border border-black/10">
                                ↔
                              </div>
                            </div>
                          </>
                        ) : isComparing && uploadedImage ? (
                          <img
                            src={uploadedImage}
                            className="w-full h-full object-cover pointer-events-none"
                            alt="Original soba"
                          />
                        ) : videos[STYLE_CONFIGS[currentIndex].id] ? (
                          <video
                             autoPlay
                             loop
                             muted
                             playsInline
                             className="w-full h-full object-cover"
                             src={videos[STYLE_CONFIGS[currentIndex].id].startsWith('blob:') || videos[STYLE_CONFIGS[currentIndex].id].startsWith('data:') ? videos[STYLE_CONFIGS[currentIndex].id] : `/api/video/${videos[STYLE_CONFIGS[currentIndex].id]}`}
                          />
                        ) : images[STYLE_CONFIGS[currentIndex].id] ? (
                          <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={images[STYLE_CONFIGS[currentIndex].id]}
                            className="w-full h-full object-cover pointer-events-none"
                            alt={STYLE_CONFIGS[currentIndex].name}
                          />
                        ) : (
                          <Loader2 className="w-8 h-8 animate-spin text-[#222222]/30" />
                        )}

                        {/* Top Badges & Favorite Heart */}
                        {!isSplitMode && (
                          <div className="absolute top-3 left-3 bg-[#1c1d22]/80 text-white text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-xs">
                            {isComparing ? 'Original soba' : STYLE_CONFIGS[currentIndex].name}
                          </div>
                        )}

                        {/* Action Buttons on Image */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {/* Heart favorite toggle */}
                          <button
                            onClick={(e) => toggleFavorite(STYLE_CONFIGS[currentIndex].id, e)}
                            title={favorites.includes(STYLE_CONFIGS[currentIndex].id) ? "Odstrani iz priljubljenih" : "Dodaj med priljubljene"}
                            className={`p-2 rounded-full shadow-sm active:scale-90 transition-transform cursor-pointer ${
                              favorites.includes(STYLE_CONFIGS[currentIndex].id)
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-white/90 text-[#222222] hover:bg-white'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${favorites.includes(STYLE_CONFIGS[currentIndex].id) ? 'fill-rose-600' : ''}`} />
                          </button>

                          {images[STYLE_CONFIGS[currentIndex].id] && !isComparing && (
                            <button
                              onClick={() => handleDownloadImage(STYLE_CONFIGS[currentIndex].id, STYLE_CONFIGS[currentIndex].name)}
                              title="Prenesi stilizirano sliko"
                              className="bg-white/90 hover:bg-white text-[#222222] p-2 rounded-full shadow-sm active:scale-90 transition-transform cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Split Mode Mode Selector Bar (Original vs Dual Style) */}
                      {isSplitMode && (
                        <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSplitModeType('original')}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                                splitModeType === 'original'
                                  ? 'bg-[#222222] text-white'
                                  : 'bg-black/5 text-[#222222]/70 hover:bg-black/10'
                              }`}
                            >
                              Original vs Stil
                            </button>
                            <button
                              onClick={() => {
                                setSplitModeType('dualStyle');
                                fetchImage(STYLE_CONFIGS.findIndex(s => s.id === dualCompareRightStyleId));
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                                splitModeType === 'dualStyle'
                                  ? 'bg-[#222222] text-white'
                                  : 'bg-black/5 text-[#222222]/70 hover:bg-black/10'
                              }`}
                            >
                              Primerjaj 2 stila
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {splitModeType === 'dualStyle' && (
                              <select
                                value={dualCompareRightStyleId}
                                onChange={(e) => {
                                  setDualCompareRightStyleId(e.target.value);
                                  const foundIdx = STYLE_CONFIGS.findIndex(s => s.id === e.target.value);
                                  if (foundIdx >= 0) fetchImage(foundIdx);
                                }}
                                className="text-[10px] bg-white border border-black/15 rounded-lg px-2 py-0.5 font-semibold text-[#222222] cursor-pointer"
                              >
                                {STYLE_CONFIGS.filter(s => s.id !== STYLE_CONFIGS[currentIndex].id).map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Export Comparison Button */}
                            <button
                              onClick={handleDownloadComparison}
                              title="Prenesi sliko primerjave (Side-by-side)"
                              className="p-1 rounded-full bg-black/5 hover:bg-black/10 text-[#222222] transition-colors cursor-pointer flex items-center justify-center"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vertical centering notches relative to the space between image and text */}
                    <div className="absolute -left-4 top-[calc(50%+80px)] w-8 h-8 rounded-full bg-[#EAE9E4] pointer-events-none z-10" />
                    <div className="absolute -right-4 top-[calc(50%+80px)] w-8 h-8 rounded-full bg-[#EAE9E4] pointer-events-none z-10" />

                    <div className="px-6 flex-1 flex flex-col justify-center mt-1 pb-5">
                      <h2 className="text-[#222222] text-[19px] font-medium leading-snug tracking-tight">
                        {STYLE_CONFIGS[currentIndex].description}
                      </h2>

                      {/* Mini palette dots on card */}
                      <div className="flex items-center gap-1.5 mt-3">
                        {STYLE_CONFIGS[currentIndex].palette.map(swatch => (
                          <div
                            key={swatch.hex}
                            title={`${swatch.name} (${swatch.hex})`}
                            style={{ backgroundColor: swatch.hex }}
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                          />
                        ))}
                        <span className="text-[10px] text-[#222222]/50 ml-1">Karakterne barve</span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-5 mt-auto flex items-center gap-1.5 flex-wrap">
                      {/* Hold to Compare Button */}
                      {uploadedImage && !isSplitMode && (
                        <button
                          onMouseDown={() => setIsComparing(true)}
                          onMouseUp={() => setIsComparing(false)}
                          onTouchStart={() => setIsComparing(true)}
                          onTouchEnd={() => setIsComparing(false)}
                          title="Držite za primerjavo z originalom"
                          className="h-9 px-2.5 rounded-full border border-[#222222]/15 flex items-center justify-center gap-1 bg-white shrink-0 shadow-xs active:bg-[#222222] active:text-white transition-all text-xs font-medium text-[#222222] cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">Primerjaj</span>
                        </button>
                      )}

                      {/* Split Slider Toggle */}
                      {uploadedImage && images[STYLE_CONFIGS[currentIndex].id] && (
                        <button
                          onClick={() => setIsSplitMode(!isSplitMode)}
                          title={isSplitMode ? "Zapri drsnik" : "Odpri primerjalni drsnik"}
                          className={`h-9 px-2.5 rounded-full border border-[#222222]/15 flex items-center justify-center gap-1 shrink-0 shadow-xs transition-all text-xs font-medium cursor-pointer ${
                            isSplitMode ? 'bg-[#222222] text-white font-semibold' : 'bg-white text-[#222222] active:bg-[#222222] active:text-white'
                          }`}
                        >
                          <Columns2 className="w-3 h-3" />
                          <span>Drsnik</span>
                        </button>
                      )}

                      {/* Fine-Tuner button */}
                      {images[STYLE_CONFIGS[currentIndex].id] && (
                        <button
                          onClick={() => {
                            setTuneTargetStyle({
                              id: STYLE_CONFIGS[currentIndex].id,
                              name: STYLE_CONFIGS[currentIndex].name,
                              image: images[STYLE_CONFIGS[currentIndex].id]
                            });
                          }}
                          title="Prilagodi svetlobo, kontrast in barvni ton"
                          className="h-9 px-2.5 rounded-full border border-[#222222]/15 flex items-center justify-center gap-1 bg-white shrink-0 shadow-xs active:scale-95 transition-all text-xs font-medium text-[#222222] cursor-pointer"
                        >
                          <Sliders className="w-3 h-3 text-neutral-600" />
                          <span className="hidden sm:inline">Uredi</span>
                        </button>
                      )}

                      {/* Moodboard / Style Specs Button */}
                      <button
                        onClick={() => setActiveMoodboardStyle(STYLE_CONFIGS[currentIndex])}
                        title="Odpri barve, proračun in nasvete tega sloga"
                        className="h-9 px-2.5 rounded-full border border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 flex items-center justify-center gap-1 shrink-0 shadow-xs active:scale-95 transition-all text-xs font-semibold text-amber-900 cursor-pointer"
                      >
                        <Palette className="w-3 h-3 text-amber-600" />
                        <span>Slog</span>
                      </button>

                      {/* 3D Button */}
                      <button 
                        onClick={() => handleOpen3DWithStyle(STYLE_CONFIGS[currentIndex].id)}
                        title="Odpri ta stil v interaktivnem 3D pogledu"
                        className="h-9 px-3 rounded-full border border-[#222222]/15 flex items-center justify-center gap-1 bg-white shrink-0 shadow-sm active:scale-95 transition-transform text-xs font-semibold text-[#222222] cursor-pointer"
                      >
                        <Box className="w-3 h-3 text-amber-600" />
                        <span>3D</span>
                      </button>

                      {/* Video Render Button */}
                      <button 
                        onClick={() => {
                          const base64 = images[STYLE_CONFIGS[currentIndex].id];
                          if (base64) {
                             generateVideo(STYLE_CONFIGS[currentIndex].id, base64);
                          }
                        }}
                        disabled={videoStatus[STYLE_CONFIGS[currentIndex].id] === 'generating' || videoStatus[STYLE_CONFIGS[currentIndex].id] === 'polling'}
                        className="w-9 h-9 rounded-full border border-[#222222]/15 flex items-center justify-center bg-white shrink-0 shadow-sm active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 ml-auto cursor-pointer"
                        title="Ustvari 60fps kinematični video"
                      >
                        {videoStatus[STYLE_CONFIGS[currentIndex].id] === 'generating' || videoStatus[STYLE_CONFIGS[currentIndex].id] === 'polling' ? (
                          <Loader2 className="w-3.5 h-3.5 text-[#222222] animate-spin" />
                        ) : (
                          <Video className="w-3.5 h-3.5 text-[#222222]" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="endState"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="[grid-area:1/1] w-full h-[550px] flex flex-col items-center justify-center p-8 bg-white rounded-[32px] shadow-sm relative z-20 text-center"
                  >
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="text-[60px] leading-none mb-4">✨</div>
                      <h2 className="text-[#222222] text-2xl font-medium tracking-tight mb-2">Pregledali ste vseh 10 stilov!</h2>
                      <p className="text-[#222222]/60 text-sm max-w-xs">Upamo, da ste našli popolno kombinacijo za vaš dom.</p>
                    </div>

                    <div className="w-full flex flex-col gap-2 mt-auto">
                      <button
                        onClick={() => {
                          setIsGridView(true);
                          fetchAllRemainingImages();
                        }}
                        className="w-full rounded-[24px] bg-amber-500 hover:bg-amber-600 text-white py-3.5 text-center font-semibold text-sm shadow-xs active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-center gap-2"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Odpri galerijo vseh 10 sob</span>
                      </button>

                      <button
                        onClick={handleReset}
                        className="w-full rounded-[24px] bg-[#222222] text-white py-3.5 text-center font-medium text-sm shadow-xs active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        Začni znova z novo sliko
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Swipe hint */}
              <AnimatePresence>
                {currentIndex === 0 && !videoStatus[STYLE_CONFIGS[currentIndex]?.id] && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-[calc(100%+16px)] text-[10px] text-[#222222]/40 tracking-widest font-medium uppercase text-center w-full"
                  >
                    PODRSNITE NAVZGOR ZA NASLEDNJI SLOG (ALI PREKLOPITE NA MREŽO)
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Camera Overlay */}
      <AnimatePresence>
        {cameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8">
              <button
                onClick={stopCamera}
                className="px-6 py-3 rounded-full bg-white/20 text-white font-medium backdrop-blur-md cursor-pointer"
              >
                Prekliči
              </button>
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/50 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
