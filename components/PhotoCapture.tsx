"use client";

import { Box, Button, HStack, Icon } from "@chakra-ui/react";
import { useRef, useState, useCallback } from "react";
import { BiCamera, BiImage, BiX } from "react-icons/bi";

type PhotoCaptureProps = {
  onPhotoCapture: (file: File) => void;
  onClear?: () => void;
};

type Mode = "idle" | "viewfinder" | "preview";

export function PhotoCapture({ onPhotoCapture, onClear }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const openViewfinder = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setMode("viewfinder");
      // attach after render
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
    } catch {
      // getUserMedia not available or denied — fall back to file input
      inputRef.current?.click();
    }
  }, [stopStream]);

  const captureFrame = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    stopStream();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setMode("preview");
      onPhotoCapture(file);
    }, "image/jpeg", 0.92);
  }, [stopStream, onPhotoCapture]);

  const closeViewfinder = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    stopStream();
    setMode("idle");
  }, [stopStream]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setMode("preview");
      onPhotoCapture(file);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    setPreview(null);
    setMode("idle");
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  const openGallery = (e: React.MouseEvent) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  return (
    <Box
      borderRadius="lg"
      flexBasis={"1/4"}
      alignSelf="stretch"
      w={"100%"}
      display="flex"
      flexDirection="column"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {mode === "viewfinder" && (
        <Box position="relative" h="100%" borderRadius="lg" overflow="hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <HStack position="absolute" bottom={3} w="100%" justifyContent="center" gap={4} px={3}>
            <Button type="button" variant="outline" onClick={closeViewfinder} size="sm">
              <Icon><BiX /></Icon>
            </Button>
            <Button type="button" onClick={captureFrame} borderRadius="full" w={14} h={14} bg="white" />
          </HStack>
        </Box>
      )}

      {mode === "preview" && preview && (
        <>
          {/* Lightbox */}
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              display: lightboxOpen ? "flex" : "none",
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(0,0,0,0.88)",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Captured photo"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "100%",
                maxHeight: "80dvh",
                borderRadius: 12,
                objectFit: "contain",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
              }}
            />
            <HStack position="absolute" bottom={8} gap={3}>
              <Button type="button" bg="stout.400" onClick={(e) => { setLightboxOpen(false); openViewfinder(e); }}>
                Retake
              </Button>
              <Button type="button" variant="outline" color="white" borderColor="rgba(255,255,255,0.3)" onClick={(e) => { setLightboxOpen(false); handleClear(e); }}>
                Clear
              </Button>
            </HStack>
          </div>

          {/* Thumbnail button (same size as idle buttons) */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            style={{
              width: "100%",
              height: "100%",
              padding: 0,
              border: "none",
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              display: "block",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Captured photo"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </button>
        </>
      )}

      {mode === "idle" && (
        <HStack h="100%" gap={2}>
          <Button
            type="button"
            flex={1}
            h="100%"
            variant="outline"
            borderColor="app.border"
            bg="app.surfaceSolid"
            color="app.fg"
            onClick={openViewfinder}
            borderRadius="lg"
          >
            <Icon fontSize="3xl" color="app.accent">
              <BiCamera />
            </Icon>
          </Button>
          <Button
            type="button"
            flex={1}
            h="100%"
            variant="outline"
            borderColor="app.border"
            bg="app.surfaceSolid"
            color="app.fg"
            onClick={openGallery}
            borderRadius="lg"
          >
            <Icon fontSize="3xl" color="app.accent">
              <BiImage />
            </Icon>
          </Button>
        </HStack>
      )}
    </Box>
  );
}
