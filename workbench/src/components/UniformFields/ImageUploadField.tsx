import { useState, useRef, useEffect, type FC } from "react";
import type { Field, TextureUniform } from "@sequenza/lib";

export const ImageUploadField: FC<{
  field: Field & { type: "sampler2D" };
  value?: TextureUniform;
  handleUpdateUniformField: (value: TextureUniform | null) => void;
}> = ({ value: initialValue, handleUpdateUniformField }) => {
  const [focused, setFocused] = useState(false);

  const initVideo =
    initialValue?.src instanceof HTMLVideoElement ? initialValue.src : null;
  const initStrSrc =
    typeof initialValue?.src === "string"
      ? initialValue.src
      : (initVideo?.src ?? null);
  const initIsVideo = initVideo !== null;

  const [mediaSrc, setMediaSrc] = useState<string | null>(initStrSrc);
  const [isVideo, setIsVideo] = useState(initIsVideo);
  const [fileName, setFileName] = useState<string | null>(
    initStrSrc ? (initStrSrc.split("/").pop() ?? null) : null,
  );
  const [resolution, setResolution] = useState<[number, number] | null>(() => {
    if (!initVideo) return null;
    if (initVideo.readyState >= 1)
      return [initVideo.videoWidth, initVideo.videoHeight];
    return null;
  });

  useEffect(() => {
    if (resolution !== null) return;
    if (initVideo) {
      const apply = () =>
        setResolution([initVideo.videoWidth, initVideo.videoHeight]);
      if (initVideo.readyState >= 1) apply();
      else initVideo.addEventListener("loadedmetadata", apply, { once: true });
    } else if (initStrSrc && !initIsVideo) {
      const img = new Image();
      img.onload = () => setResolution([img.naturalWidth, img.naturalHeight]);
      img.src = initStrSrc;
    }
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = (file: File | null) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const fileIsVideo = file.type.startsWith("video/");
    setMediaSrc(objectUrl);
    setIsVideo(fileIsVideo);
    setFileName(file.name);
    setResolution(null);
    if (fileIsVideo) {
      const vid = document.createElement("video");
      vid.autoplay = true;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.onloadedmetadata = () =>
        setResolution([vid.videoWidth, vid.videoHeight]);
      vid.src = objectUrl;
      vid.play();
      handleUpdateUniformField({ type: "texture", src: vid });
    } else {
      const img = new Image();
      img.onload = () => setResolution([img.naturalWidth, img.naturalHeight]);
      img.src = objectUrl;
      handleUpdateUniformField({ type: "texture", src: objectUrl });
    }
  };

  useEffect(() => {
    if (!focused) return;
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
          upload(item.getAsFile());
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [focused]);

  return (
    <div className="flex items-center ">
      <div className="flex flex-col items-start gap-2">
        <div
          tabIndex={0}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-32 h-32 rounded overflow-hidden flex flex-col items-center justify-center cursor-pointer select-none transition border-4 text-neutral-500 text-xs font-mono p-2 ${
            focused
              ? "bg-neutral-50 border-neutral-300"
              : "bg-neutral-100 border-neutral-50"
          }`}
        >
          {mediaSrc ? (
            isVideo ? (
              <video
                src={mediaSrc}
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img src={mediaSrc} className="w-full h-full object-contain" />
            )
          ) : focused ? (
            "cmd+V"
          ) : (
            <>
              <p>Paste</p>
              <p>Here</p>
            </>
          )}
        </div>

        <div className="flex flex-col items-start gap-0.5">
          <button
            className="button-base"
            onClick={() => inputRef.current?.click()}
          >
            {mediaSrc ? "Replace" : "Upload"}
          </button>
          {fileName && (
            <span
              className="text-[10px] text-neutral-400 font-mono truncate max-w-32"
              title={fileName}
            >
              {fileName}
            </span>
          )}
          {resolution && (
            <span className="text-[10px] text-neutral-400 font-mono">
              {resolution[0]}×{resolution[1]}
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
};
