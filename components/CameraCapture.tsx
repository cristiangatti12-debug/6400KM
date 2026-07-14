"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "idle" | "live" | "captured";

// Captures a photo straight from the device camera — no file picker,
// so it can't be an old saved image.
export function CameraCapture({
  onCapture,
  facingMode = "user",
}: {
  onCapture: (file: File | null) => void;
  facingMode?: "user" | "environment";
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function start() {
    setError(null);
    onCapture(null);
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = stream;
      setMode("live");
    } catch {
      setError(
        "We couldn't open your camera. Please allow camera access in your browser and try again."
      );
      setMode("idle");
    }
  }

  // Attach the live stream to the <video> once it's on screen.
  useEffect(() => {
    if (mode === "live" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [mode]);

  // Always release the camera when this component goes away.
  useEffect(() => () => stopStream(), []);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setPreview(URL.createObjectURL(blob));
        onCapture(file);
        stopStream();
        setMode("captured");
      },
      "image/jpeg",
      0.9
    );
  }

  function cancel() {
    stopStream();
    setMode("idle");
  }

  return (
    <div className="flex flex-col gap-2">
      {mode === "idle" && (
        <Button
          type="button"
          variant="outline"
          onClick={start}
          className="self-start"
        >
          <Camera className="h-4 w-4" />
          Open camera
        </Button>
      )}

      {mode === "live" && (
        <div className="flex flex-col gap-2">
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="aspect-square w-full max-w-xs object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={capture} className="self-start">
              <Camera className="h-4 w-4" />
              Take photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={cancel}
              className="self-start"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {mode === "captured" && preview && (
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Your live selfie"
            className="aspect-square w-full max-w-xs rounded-xl object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={start}
            className="self-start"
          >
            <RefreshCw className="h-4 w-4" />
            Retake
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
