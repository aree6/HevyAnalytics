import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Dumbbell } from 'lucide-react';
import type { ExerciseAsset } from '../../utils/data/exerciseAssets';

interface ExerciseThumbnailProps {
    asset?: ExerciseAsset;
    alt?: string;
    className?: string; // Container className
    imageClassName?: string; // inner image/video className
    autoPlay?: boolean;
}

/**
 * A smart thumbnail component that handles:
 * - Switching between Image and Video based on asset type
 * - Lazy loading for images
 * - IntersectionObserver for video autoplay and prefetching
 */
export const ExerciseThumbnail: React.FC<ExerciseThumbnailProps> = ({
    asset,
    alt = '',
    className = "w-12 h-12 rounded-md",
    imageClassName = "w-full h-full object-cover",
    autoPlay = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [shouldPlay, setShouldPlay] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const videoSrc = asset?.sourceType === 'video' ? (asset.video ?? asset.source) : undefined;
    const imgSrc = asset?.sourceType === 'video' ? asset.thumbnail : (asset?.thumbnail || asset?.source);

    // Intersection Observer for autoplay/prefetch
    useEffect(() => {
        if (!videoSrc || !autoPlay) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldPlay(true);
                        // Optional: Set preload to auto when in view or close to view
                        if (videoRef.current) videoRef.current.preload = "auto";
                    } else {
                        setShouldPlay(false);
                        if (videoRef.current) {
                            videoRef.current.pause();
                            videoRef.current.currentTime = 0; // Reset to start
                        }
                    }
                });
            },
            {
                rootMargin: '50px 0px', // Prefetch slightly before view
                threshold: 0.5, // Play when 50% visible
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [videoSrc, autoPlay]);

    // Handle Play/Pause based on state
    useEffect(() => {
        if (!videoRef.current) return;

        if (shouldPlay) {
            videoRef.current.play().catch(() => {
                // Auto-play was prevented. Silent fail or fallback to UI indication if needed.
            });
        } else {
            videoRef.current.pause();
        }
    }, [shouldPlay]);

    if (!asset) {
        return (
            <div className={`${className} bg-black/50 flex items-center justify-center text-slate-500 overflow-hidden`}>
                <Dumbbell className="w-1/3 h-1/3 opacity-50" />
            </div>
        );
    }

    if (videoSrc) {
        return (
            <div
                ref={containerRef}
                className={`${className} overflow-hidden relative bg-black`}
            >
                <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={imgSrc}
                    className={imageClassName}
                    muted
                    loop
                    playsInline
                    preload="none" // Controlled by observer
                />
            </div>
        );
    }

    if (imgSrc) {
        return (
            <div className={`${className} overflow-hidden bg-white`}>
                <img
                    src={imgSrc}
                    alt={alt}
                    className={imageClassName}
                    loading="lazy"
                    decoding="async"
                />
            </div>
        );
    }

    // Fallback if asset exists but no visual source
    return (
        <div className={`${className} bg-black/50 flex items-center justify-center text-slate-500 overflow-hidden`}>
            <Dumbbell className="w-1/3 h-1/3 opacity-50" />
        </div>
    );
};
