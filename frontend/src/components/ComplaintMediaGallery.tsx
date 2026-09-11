import React, { useState } from "react";
import { WorkerMediaAttachment } from "../types";
import {
  Camera,
  Film,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { ComplaintImageModal } from "./ComplaintImageModal";

interface ComplaintMediaGalleryProps {
  media?: WorkerMediaAttachment[];
  ticketNo?: string;
  station?: string;
  title?: string;
  compact?: boolean;
  showOriginalTag?: boolean;
  onImageClick?: (index: number) => void;
}

export const ComplaintMediaGallery: React.FC<ComplaintMediaGalleryProps> = ({
  media = [],
  ticketNo,
  station,
  title = "Worker Field Photo Evidence",
  compact = false,
  showOriginalTag = true,
  onImageClick,
}) => {
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  if (!media || media.length === 0) {
    if (compact) return null;
    return (
      <div className="p-3 bg-[#f8f9fa] border border-dashed border-[#c7c4d8] rounded-xl flex items-center gap-2 text-xs text-[#777587]">
        <Camera className="w-4 h-4 text-[#a09eaf]" />
        <span>No field photos attached to this complaint report.</span>
      </div>
    );
  }

  const handleOpenImage = (idx: number) => {
    if (onImageClick) {
      onImageClick(idx);
    } else {
      setActiveModalIndex(idx);
    }
  };

  return (
    <div className="space-y-2">
      {/* Header Label */}
      {!compact && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#191c1e]">
            <Camera className="w-3.5 h-3.5 text-[#3525cd]" />
            <span>{title}</span>
            <span className="px-1.5 py-0.2 bg-[#e2dfff] text-[#3525cd] text-[10px] font-mono rounded font-bold">
              {media.length} {media.length === 1 ? "file" : "files"}
            </span>
          </div>

          {showOriginalTag && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Worker Field Upload • Immutable Evidence</span>
            </span>
          )}
        </div>
      )}

      {/* Media Thumbnails Grid */}
      <div
        className={`grid gap-2.5 ${
          compact
            ? "grid-cols-2 sm:grid-cols-3"
            : media.length === 1
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        }`}
      >
        {media.map((item, idx) => {
          const isVideo = item.type === "video";

          return (
            <div
              key={item.id || idx}
              onClick={() => handleOpenImage(idx)}
              className="group relative bg-[#191c1e] rounded-xl overflow-hidden border border-[#c7c4d8]/70 shadow-2xs hover:shadow-md hover:border-[#3525cd] transition-all cursor-pointer aspect-video flex flex-col justify-end"
            >
              {/* Image Preview */}
              {isVideo ? (
                <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                  <Film className="w-8 h-8 text-white/60 group-hover:text-white group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback placeholder on error
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=500&auto=format&fit=crop&q=80";
                  }}
                />
              )}

              {/* Hover Overlay with Action Buttons */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 z-10">
                <span className="p-2 bg-white/90 text-[#191c1e] rounded-full shadow-lg font-semibold text-xs flex items-center gap-1 transform scale-95 group-hover:scale-100 transition-transform">
                  <Maximize2 className="w-3.5 h-3.5 text-[#3525cd]" />
                  <span className="text-[11px]">View Photo</span>
                </span>
              </div>

              {/* Bottom Caption Pill */}
              <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 text-white">
                <p className="text-[11px] font-semibold truncate leading-tight">
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-white/70 font-mono mt-0.5">
                  <span>{isVideo ? "MP4 Video" : "Field Image"}</span>
                  {item.size && <span>{item.size}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {activeModalIndex !== null && (
        <ComplaintImageModal
          mediaList={media}
          initialIndex={activeModalIndex}
          ticketNo={ticketNo}
          station={station}
          onClose={() => setActiveModalIndex(null)}
        />
      )}
    </div>
  );
};
