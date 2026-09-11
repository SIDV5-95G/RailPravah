import React, { useState, useEffect } from "react";
import { WorkerMediaAttachment } from "../types";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Camera,
} from "lucide-react";

interface ComplaintImageModalProps {
  mediaList: WorkerMediaAttachment[];
  initialIndex?: number;
  ticketNo?: string;
  station?: string;
  onClose: () => void;
}

export const ComplaintImageModal: React.FC<ComplaintImageModalProps> = ({
  mediaList,
  initialIndex = 0,
  ticketNo,
  station,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [hasError, setHasError] = useState(false);

  const currentMedia = mediaList[currentIndex];

  useEffect(() => {
    // Reset zoom & rotation when navigating media
    setScale(1);
    setRotation(0);
    setHasError(false);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && mediaList.length > 1) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
      } else if (e.key === "ArrowRight" && mediaList.length > 1) {
        setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mediaList.length, onClose]);

  if (!currentMedia) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const isVideo = currentMedia.type === "video";

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between text-white bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#3525cd] text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {ticketNo && (
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/30">
                  {ticketNo}
                </span>
              )}
              {station && (
                <span className="text-xs text-white/80 font-medium">
                  {station} Section
                </span>
              )}
              <span className="text-xs text-white/50">
                ({currentIndex + 1} of {mediaList.length})
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md mt-0.5">
              {currentMedia.name}
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isVideo && (
            <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 hover:bg-white/20 rounded cursor-pointer transition-colors text-white"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="px-2 py-1 hover:bg-white/20 rounded font-mono cursor-pointer transition-colors text-white"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 hover:bg-white/20 rounded cursor-pointer transition-colors text-white"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate Clockwise"
                className="p-1.5 hover:bg-white/20 rounded cursor-pointer transition-colors text-white ml-1 border-l border-white/20"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentMedia.url && (
            <a
              href={currentMedia.url}
              download={currentMedia.name}
              target="_blank"
              rel="noopener noreferrer"
              title="Download or Open in New Tab"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            title="Close Viewer (Esc)"
            className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors cursor-pointer ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Stage */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Arrows */}
        {mediaList.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev > 0 ? prev - 1 : mediaList.length - 1
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all border border-white/20 z-20 cursor-pointer"
              title="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev < mediaList.length - 1 ? prev + 1 : 0
                )
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all border border-white/20 z-20 cursor-pointer"
              title="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image / Video Content */}
        {isVideo ? (
          <div className="max-w-4xl max-h-[75vh] w-full flex items-center justify-center">
            <video
              src={currentMedia.url}
              controls
              autoPlay
              className="max-h-[75vh] max-w-full rounded-lg shadow-2xl border border-white/10 bg-black"
            >
              Your browser does not support video playback.
            </video>
          </div>
        ) : hasError ? (
          <div className="bg-white/10 border border-white/20 p-8 rounded-2xl text-center text-white space-y-2">
            <Camera className="w-12 h-12 text-white/40 mx-auto" />
            <p className="font-semibold text-sm">Complaint Image Preview Unavailable</p>
            <p className="text-xs text-white/60 font-mono">{currentMedia.name}</p>
          </div>
        ) : (
          <div className="transition-transform duration-150 ease-out flex items-center justify-center max-h-[75vh] max-w-full">
            <img
              src={currentMedia.url}
              alt={currentMedia.name}
              onError={() => setHasError(true)}
              referrerPolicy="no-referrer"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease-in-out",
              }}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10 select-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Footer Info Strip */}
      <div
        className="w-full bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs text-white/80 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <FileText className="w-3.5 h-3.5 text-[#3525cd]" />
            <span>Worker Field Defect Upload</span>
          </span>
          <span className="font-mono text-white/60">
            Format: {isVideo ? "MP4 Video" : "Defect Photo"}
          </span>
          {currentMedia.size && (
            <span className="font-mono text-white/60">
              Size: {currentMedia.size}
            </span>
          )}
        </div>

        {/* Thumbnail Selector Strip if multiple */}
        {mediaList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {mediaList.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  idx === currentIndex
                    ? "border-amber-400 scale-105"
                    : "border-white/30 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
