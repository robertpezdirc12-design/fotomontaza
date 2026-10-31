/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Loader2, Video, Box, Download, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { stylizeRoomImage, generateCinematicVideo } from "./utils/scriptStylizer";
import ThreeRoomScene from "./three/ThreeRoomScene";

type Screen = "welcome" | "countdown" | "loading" | "cards";

const STYLE_CONFIGS = [
  {
    id: "japandi",
    name: "Japandi",
    description: "Japandi minimalism blends serene Scandinavian functionality with Japanese rustic warmth to create peace.",
    prompt: "Interior design of a living room, Japandi style, earthy neutrals, low platform light wood furniture, zero clutter, minimalist ceramic decor, neutral palette",
  },
  {
    id: "industrial",
    name: "Industrial Modern",
    description: "Industrial Modern embraces raw architectural elements with charcoal tones and exposed brick for an urban edge.",
    prompt: "Interior design of a living room, Industrial Modern style, charcoal tones, exposed brick wall, distressed leather sofa, iron pipe detailing, large industrial windows",
  },
  {
    id: "midcentury",
    name: "Mid-Century Modern",
    description: "Mid-Century Modern pairs warm retro aesthetics with sleek lines, peg legs, and vibrant autumnal accent colors.",
    prompt: "Interior design of a living room, Mid-Century Modern style, tapered peg legs on furniture, rich walnut wood finishes, mustard yellow and burnt orange accents",
  },
  {
    id: "biophilic",
    name: "Biophilic",
    description: "Biophilic design brings the outdoors inside, layering abundant plant life with natural rattan and cream fabrics.",
    prompt: "Interior design of a living room, Biophilic Urban Jungle style, abundant indoor green plants, hanging vines, rattan accents, plush cream fabrics, natural sunlight",
  },
  {
    id: "luxury",
    name: "Luxury Contemporary",
    description: "Luxury Contemporary exudes opulence through rich boucle textures, polished marble tables, and refined brass hardware.",
    prompt: "Interior design of a living room, Luxury Contemporary style, plush boucle textures, elegant polished marble coffee table, gold and brass hardware accents, sophisticated lighting",
  },
  {
    id: "bohemian",
    name: "Bohemian Chic",
    description: "Bohemian Chic layers eclectic patterns, vintage rugs, and macrame accents for a free-spirited, relaxed aesthetic.",
    prompt: "Interior design of a living room, Bohemian Chic style, eclectic patterns, vintage rugs, macrame wall hangings, warm earthy tones, lots of textures, relaxed vibe",
  },
  {
    id: "minimalist",
    name: "Pure Minimalist",
    description: "Pure Minimalist focuses on the essentials with clean white walls, hidden storage, and singular statement pieces.",
    prompt: "Interior design of a living room, Pure Minimalist style, clean white walls, hidden storage, singular statement furniture pieces, monotone palette, ample negative space",
  },
  {
    id: "coastal",
    name: "Modern Coastal",
    description: "Modern Coastal blends breezy light blues, whitewashed driftwood, and natural linen for a relaxed beachside feel.",
    prompt: "Interior design of a living room, Modern Coastal style, breezy light blues, whitewashed driftwood furniture, natural linen fabrics, airy and bright, beachside atmosphere",
  },
  {
    id: "artdeco",
    name: "Art Deco",
    description: "Art Deco brings glamorous symmetry to life with geometric patterns, velvet seating, and bold jewel tones.",
    prompt: "Interior design of a living room, Art Deco style, geometric patterns, velvet seating, bold jewel tones, mirrored surfaces, glamorous metallic accents",
  },
  {
    id: "farmhouse",
    name: "Modern Farmhouse",
    description: "Modern Farmhouse pairs rustic shiplap walls and reclaimed woods with sleek black iron fixtures for a cozy appeal.",
    prompt: "Interior design of a living room, Modern Farmhouse style, rustic shiplap walls, reclaimed wood furniture, sleek black iron fixtures, cozy and inviting, neutral tones",
  }
];

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
  const [isComparing, setIsComparing] = useState(false);
  const [hasLinkedKey, setHasLinkedKey] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const fetchingRef = useRef<Set<string>>(new Set());

  const [videoStatus, setVideoStatus] = useState<Record<string, 'generating' | 'polling' | 'ready' | 'failed'>>({});
  const [videos, setVideos] = useState<Record<string, string>>({});

  const handleDownloadImage = (styleId: string, styleName: string) => {
    const imgUrl = images[styleId];
    if (!imgUrl) return;
    const link = document.createElement("a");
    link.download = `space-lift-${styleId}-${Date.now()}.jpg`;
    link.href = imgUrl;
    link.click();
  };

  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Start pre-fetching images immediately
        fetchImage(0, base64).then(() => fetchImage(1, base64));
      };
      reader.readAsDataURL(file);
    }
  };

  // TEMPORARY DEMO CODE
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
  // END TEMPORARY DEMO CODE

  const fetchImage = async (styleIndex: number, overrideImage?: string) => {
    if (styleIndex >= STYLE_CONFIGS.length) return;
    const style = STYLE_CONFIGS[styleIndex];
    if (images[style.id] || fetchingRef.current.has(style.id)) return;
    
    fetchingRef.current.add(style.id);

    try {
      const sourceImage = overrideImage || uploadedImage;
      if (!sourceImage) return;

      // Execute script-based visual styling
      const stylizedImage = await stylizeRoomImage(sourceImage, style.id);
      setImages((prev) => ({ ...prev, [style.id]: stylizedImage }));
    } catch (e) {
      console.error("Failed to generate stylized image with script for", style.name, e);
    }
  };

  const generateVideo = async (styleId: string, base64Image: string, styleDesc: string) => {
    if (videoStatus[styleId]) return;

    setVideoStatus(prev => ({ ...prev, [styleId]: 'generating' }));

    try {
      const style = STYLE_CONFIGS.find(s => s.id === styleId);
      // Execute script-based cinematic camera dolly & lighting sweep rendering
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

  // Eagerly fetch the next image whenever the current index changes
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

  if (view3D) {
    return (
      <ThreeRoomScene
        initialStyleId={STYLE_CONFIGS[currentIndex]?.id || 'japandi'}
        onClose={() => setView3D(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#EAE9E4] flex flex-col font-sans text-[#222222] overflow-hidden relative">
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
                <p className="text-[#222222]/60 mb-4 text-center px-4">Explore how you can visualize your room in different Interior design styles within seconds</p>
              </>
            )}

            {!uploaded && (
              <button
                onClick={startCamera}
                className="w-full max-w-sm rounded-[32px] bg-[#222222] text-white py-4 text-center font-medium shadow-sm active:scale-[0.98] transition-transform mb-3 block"
              >
                Click a photo
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
              className="w-full max-w-sm rounded-[32px] border border-[#222222]/10 bg-white py-4 text-center font-medium shadow-sm active:scale-[0.98] transition-transform"
              style={uploaded ? { backgroundColor: "#222222", color: "white" } : {}}
            >
              {uploaded ? "Let's pick some styles" : "Upload a photo of your room"}
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
                onClick={() => setView3D(true)}
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

        {screen === "countdown" && (
          <motion.div
            key="countdown"
            className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 min-h-screen absolute inset-0 w-full"
          >
            <AnimatePresence mode="wait">
              {countdown > 0 && (
                <motion.div
                  key={countdown}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.4 }}
                >
                  <h1 className="text-9xl font-semibold text-[#222222]">{countdown}</h1>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {bottomSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#222222]/20 z-40"
              onClick={() => setBottomSheetOpen(false)}
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
                className="w-full text-center rounded-2xl bg-[#EAE9E4] py-4 font-medium active:bg-[#EAE9E4]/80 transition-colors block"
              >
                Capture photo
              </button>
              <label
                htmlFor="file-upload"
                className="w-full text-center rounded-2xl bg-[#EAE9E4] py-4 font-medium active:bg-[#EAE9E4]/80 transition-colors cursor-pointer block"
              >
                Attach from photos
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
            {/* Notches */}
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
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between">
            <button
              onClick={() => {
                fetchingRef.current.clear();
                setUploaded(false);
                setUploadedImage(null);
                setCurrentIndex(0);
                setImages({});
                setVideos({});
                setVideoStatus({});
                setScreen("welcome");
              }}
              className="text-sm font-medium text-[#222222]/60 hover:text-[#222222] transition-colors cursor-pointer"
            >
              Start Over
            </button>
            <button
              onClick={() => setView3D(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white text-[#222222] px-3.5 py-2 rounded-full border border-[#222222]/15 shadow-sm hover:bg-[#faf9f6] active:scale-95 transition-all cursor-pointer"
            >
              <Box className="w-4 h-4 text-amber-600" />
              <span>3D Soba</span>
            </button>
          </div>
          <div className="w-full max-w-sm relative grid mt-6">
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
                  className="[grid-area:1/1] w-full h-full bg-white rounded-[32px] flex flex-col shadow-sm cursor-grab active:cursor-grabbing pb-[20px] relative"
                  style={{ touchAction: "none" }}
                >
                  <div className="p-4 relative flex-none">
                    <div className="w-full aspect-[4/3] rounded-[20px] overflow-hidden bg-[#EAE9E4]/60 flex items-center justify-center relative select-none">
                      {isComparing && uploadedImage ? (
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

                      {/* State Badge */}
                      <div className="absolute top-3 left-3 bg-[#1c1d22]/80 text-white text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase shadow-xs">
                        {isComparing ? 'Original soba' : STYLE_CONFIGS[currentIndex].name}
                      </div>

                      {/* Download Button on image */}
                      {images[STYLE_CONFIGS[currentIndex].id] && !isComparing && (
                        <button
                          onClick={() => handleDownloadImage(STYLE_CONFIGS[currentIndex].id, STYLE_CONFIGS[currentIndex].name)}
                          title="Prenesi stilizirano sliko"
                          className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[#222222] p-2 rounded-full shadow-sm active:scale-90 transition-transform cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vertical centering notches relative to the space between image and text */}
                  <div className="absolute -left-4 top-[calc(50%+80px)] w-8 h-8 rounded-full bg-[#EAE9E4] pointer-events-none z-10" />
                  <div className="absolute -right-4 top-[calc(50%+80px)] w-8 h-8 rounded-full bg-[#EAE9E4] pointer-events-none z-10" />

                  <div className="px-6 flex-1 flex flex-col justify-center mt-2 pb-6">
                    <h2 className="text-[#222222] text-[22px] font-medium leading-snug tracking-tight">
                      {STYLE_CONFIGS[currentIndex].description}
                    </h2>
                  </div>

                  <div className="px-6 mt-auto flex items-center gap-2">
                    <div className="border border-[#222222]/15 rounded-full px-3.5 py-2.5 bg-white shrink-0">
                      <span className="text-[#222222] text-xs font-semibold tracking-wide">
                        {STYLE_CONFIGS[currentIndex].name}
                      </span>
                    </div>

                    {/* Hold to Compare Button */}
                    {uploadedImage && (
                      <button
                        onMouseDown={() => setIsComparing(true)}
                        onMouseUp={() => setIsComparing(false)}
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        title="Držite za primerjavo z originalom"
                        className="h-11 px-3 rounded-full border border-[#222222]/15 flex items-center justify-center gap-1 bg-white shrink-0 shadow-xs active:bg-[#222222] active:text-white transition-all text-xs font-medium text-[#222222] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Primerjaj</span>
                      </button>
                    )}

                    <button 
                      onClick={() => setView3D(true)}
                      title="Odpri ta stil v interaktivnem 3D pogledu"
                      className="h-11 px-3.5 rounded-full border border-[#222222]/15 flex items-center justify-center gap-1 bg-white shrink-0 shadow-sm active:scale-95 transition-transform text-xs font-semibold text-[#222222] cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5 text-amber-600" />
                      <span>3D</span>
                    </button>
                    <button 
                      onClick={() => {
                        const base64 = images[STYLE_CONFIGS[currentIndex].id];
                        if (base64) {
                           generateVideo(STYLE_CONFIGS[currentIndex].id, base64, STYLE_CONFIGS[currentIndex].description);
                        }
                      }}
                      disabled={videoStatus[STYLE_CONFIGS[currentIndex].id] === 'generating' || videoStatus[STYLE_CONFIGS[currentIndex].id] === 'polling'}
                      className="w-11 h-11 rounded-full border border-[#222222]/15 flex items-center justify-center bg-white shrink-0 shadow-sm active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 ml-auto cursor-pointer"
                      title="Ustvari video"
                    >
                      {videoStatus[STYLE_CONFIGS[currentIndex].id] === 'generating' || videoStatus[STYLE_CONFIGS[currentIndex].id] === 'polling' ? (
                        <Loader2 className="w-5 h-5 text-[#222222] animate-spin" />
                      ) : (
                        <Video className="w-5 h-5 text-[#222222]" />
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
                    <h2 className="text-[#222222] text-2xl font-medium tracking-tight mb-2">Some great styles in there.</h2>
                    <p className="text-[#222222]/60 text-lg">Hope you found the right one.</p>
                  </div>
                  <button
                    onClick={() => {
                      fetchingRef.current.clear();
                      setUploaded(false);
                      setUploadedImage(null);
                      setCurrentIndex(0);
                      setImages({});
                      setVideos({});
                      setVideoStatus({});
                      setScreen("welcome");
                    }}
                    className="w-full rounded-[32px] bg-[#222222] text-white py-4 text-center font-medium shadow-sm active:scale-[0.98] transition-transform mt-auto shrink-0"
                  >
                    Go back to home
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {currentIndex === 0 && !videoStatus[STYLE_CONFIGS[currentIndex]?.id] && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-[calc(100%+16px)] text-[10px] text-[#222222]/40 tracking-widest font-medium uppercase text-center w-full"
                >
                  SWIPE UP TO SEE MORE STYLES
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
                className="px-6 py-3 rounded-full bg-white/20 text-white font-medium backdrop-blur-md"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white bg-white/50 backdrop-blur-md"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
