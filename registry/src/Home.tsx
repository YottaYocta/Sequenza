import { useState, useRef } from "react";
import Dither1 from "./components/Dither1";
import Hatching from "./components/Hatching";
import HeatMap from "./components/HeatMap";
import Dots1 from "./components/Dots1";
import daffodil from "./assets/daffodil.png";
import {
  Editor,
  type EditorInitialState,
  staticShaders,
} from "@sequenza/workbench";
import "@xyflow/react/dist/style.css";
import "@sequenza/workbench/style.css";
import type { Shader } from "@sequenza/lib";

type MediaSource =
  | { url: string; isVideo: false; name: string; element?: undefined }
  | { url: string; isVideo: true; name: string; element: HTMLVideoElement };

export default function Home() {
  const [sources, setSources] = useState<MediaSource[]>([
    { url: daffodil, isVideo: false, name: "daffodil.png" },
  ]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitialState, setEditorInitialState] = useState<
    EditorInitialState | undefined
  >(undefined);

  const currentSource = sources[sourceIndex];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    if (isVideo) {
      const vid = document.createElement("video");
      vid.autoplay = true;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.src = url;
      vid.play();
      setSources((prev) => {
        const next: MediaSource[] = [
          ...prev,
          { url, isVideo: true, name: file.name, element: vid },
        ];
        setSourceIndex(next.length - 1);
        return next;
      });
    } else {
      setSources((prev) => {
        const next: MediaSource[] = [
          ...prev,
          { url, isVideo: false, name: file.name },
        ];
        setSourceIndex(next.length - 1);
        return next;
      });
    }
    setEditorOpen(false);
    e.target.value = "";
  };

  const handleEdit = (initialState: EditorInitialState) => {
    setEditorInitialState(initialState);
    setEditorOpen(true);
  };

  return (
    <div className="flex w-screen h-screen antialiased font-sans items-center">
      <div className="w-2/5 h-full flex flex-col items-end justify-center gap-3 px-12 bg-neutral-100">
        {currentSource.isVideo ? (
          <video
            key={currentSource.url}
            src={currentSource.url}
            className="h-48 w-64 rounded-sm object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={currentSource.url}
            className="h-48 w-64 rounded-sm object-cover"
          />
        )}
        <div className="flex items-center gap-2">
          <button
            className="button-base"
            onClick={() => fileInputRef.current?.click()}
          >
            Add source
          </button>
          <div className="flex items-center gap-1">
            <button
              className="button-base"
              disabled={sourceIndex === 0}
              onClick={() => setSourceIndex((i) => i - 1)}
            >
              ↑
            </button>
            <span className="text-xs font-mono text-neutral-400 tabular-nums">
              {sourceIndex + 1}/{sources.length}
            </span>
            <button
              className="button-base"
              disabled={sourceIndex === sources.length - 1}
              onClick={() => setSourceIndex((i) => i + 1)}
            >
              ↓
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {editorOpen ? (
        <div className="w-3/5 h-full p-4">
          <div className="w-full h-full rounded-sm overflow-clip relative">
            <button
              className="top-4 right-4 button-base absolute z-10"
              onClick={() => setEditorOpen(false)}
            >
              Close
            </button>
            <Editor
              shaders={Object.entries(staticShaders).map(
                ([key, val]): Shader => {
                  return {
                    id: key,
                    name: key,
                    source: val,
                    resolution: { width: 100, height: 100 },
                  };
                },
              )}
              initialState={editorInitialState}
              handleSave={() => {}}
              initialShowStats={
                localStorage.getItem("registry-show-stats") === "true"
              }
              onEditorStateChange={({ showStats }) => {
                localStorage.setItem("registry-show-stats", String(showStats));
              }}
              className="rounded-md"
            />
          </div>
        </div>
      ) : (
        <div className="w-3/5 h-full flex flex-col items-start gap-20 pt-28 pl-12 overflow-x-visible overflow-y-auto">
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-base leading-5">Sequenza Registry</p>
              <p className="text-3xl leading-9 w-100 font-semibold">
                Design, Hack, and Embed Anywhere
              </p>
            </div>
            <p className="text-xs leading-4 w-52 opacity-70">
              Like what you see? Follow @YottaYocta and give the repo a star
            </p>
          </div>

          <div className="grid grid-cols-[repeat(2,14rem)] lg:grid-cols-[repeat(3,14rem)] gap-x-4 gap-y-2">
            {[
              Dither1,
              Hatching,
              HeatMap,
              Dots1,
              Dither1,
              Hatching,
              HeatMap,
              Dots1,
            ].map((Component, i) => (
              <div key={i} className="w-56 h-28 rounded-sm overflow-clip">
                <Component
                  source={
                    currentSource.isVideo
                      ? currentSource.element
                      : currentSource.url
                  }
                  handleEdit={handleEdit}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
