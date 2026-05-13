"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryImage = { id: string; url: string };

export function ProductGallery({
  images,
  alt,
}: {
  images: GalleryImage[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  const select = useCallback(
    (i: number) => {
      if (images.length === 0) return;
      const n = ((i % images.length) + images.length) % images.length;
      setActive(n);
    },
    [images.length],
  );

  // Keyboard navigation when the lightbox is open.
  useEffect(() => {
    if (!zoom) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(false);
      else if (e.key === "ArrowLeft") select(active - 1);
      else if (e.key === "ArrowRight") select(active + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, active, select]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        kein Bild
      </div>
    );
  }

  const current = images[active]!;

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="Bild vergrößern"
          className="group block w-full overflow-hidden rounded-lg bg-muted"
        >
          <Image
            src={current.url}
            alt={alt}
            width={600}
            height={600}
            className="aspect-square w-full cursor-zoom-in object-cover transition group-hover:scale-[1.02]"
            unoptimized
          />
        </button>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => select(i)}
                aria-label={`Bild ${i + 1} anzeigen`}
                aria-pressed={i === active}
                className={`h-20 w-20 flex-none overflow-hidden rounded transition ${
                  i === active
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bildvergrößerung"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom(false);
            }}
            aria-label="Schließen"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-6 w-6" strokeWidth={1.75} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  select(active - 1);
                }}
                aria-label="Vorheriges Bild"
                className="absolute left-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  select(active + 1);
                }}
                aria-label="Nächstes Bild"
                className="absolute right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                style={{ right: "4.5rem" }}
              >
                <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
              </button>
            </>
          )}

          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* next/image with fill needs a sized container; we constrain by
                viewport and let the image scale within. */}
            <Image
              src={current.url}
              alt={alt}
              width={1600}
              height={1600}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              unoptimized
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {active + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
