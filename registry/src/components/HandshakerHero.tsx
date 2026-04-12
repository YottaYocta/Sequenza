import { useRef, useState, useCallback } from "react";
import PixellateTransform from "./PixellateTransform";
import handshaker from "../assets/handshaker.png";

function HandshakerHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * 12, y: dx * -12 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative max-w-7xl w-full h-120 rounded-lg overflow-clip bg-amber-200 flex justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute top-0 left-0 w-full h-full">
        <PixellateTransform />
      </div>
      <div className="inset-0 flex items-center justify-between p-10 max-w-4xl bg-black gap-16">
        <div className="h-full flex items-center">
          <img
            src={handshaker}
            className="w-200 h-auto relative shrink-0 rounded-lg shadow-xl"
            style={{
              transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: "transform 0.15s ease-out",
            }}
          />
        </div>

        <div className="w-full justify-center flex z-10">
          <div className="flex flex-col justiyf-center gap-4 bg-white rounded-lg p-4 shrink-0 w-min text-nowrap">
            <div className="text-3xl leading-[round(up,120%,1px)] text-[#166FE3FC] font-sans font-medium">
              Land that Dream Role
            </div>
            <div>
              <a
                href="https://chromewebstore.google.com/detail/handshaker-handshake-auto/aedegffcgkjmbaefclfjlklommhmeokf"
                target="_blank"
              >
                <button className="flex flex-col items-start px-6 py-2 rounded-md bg-[#1866FC] w-min text-white hover:bg-blue-500 transition cursor-pointer">
                  install Handshaker today
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HandshakerHero;
