import SinDots from "./SinDots";

export default function Sentinel() {
  return (
    <div className="max-w-7xl w-full flex flex-col items-center gap-6 font-mono bg-white py-8 h-120  justify-center">
      <div className="max-w-4xl w-full flex flex-col items-center gap-6 font-mono">
        <div className="flex flex-col items-center relative w-full">
          <div className="w-full h-48 rounded-lg overflow-clip relative">
            <SinDots className="absolute inset-0 w-full h-full" />
          </div>
          <div
            className="w-20 h-20 absolute bg-white flex items-center justify-center"
            style={{ translate: "-50% -50%", left: "50%", top: "50%" }}
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12"
            >
              <rect x="4" y="4" width="10" height="10" rx="1" fill="#007BFF" />
              <rect
                x="18"
                y="4"
                width="10"
                height="10"
                rx="1"
                fill="#007BFF"
                opacity="0.7"
              />
              <rect
                x="4"
                y="18"
                width="10"
                height="10"
                rx="1"
                fill="#007BFF"
                opacity="0.7"
              />
              <rect
                x="18"
                y="18"
                width="10"
                height="10"
                rx="1"
                fill="#007BFF"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-start justify-between w-full">
          <div className="text-black font-bold  leading-9">Sentinel</div>
          <div className="flex items-start gap-8">
            <div className="text-black  leading-9">Maitrix Labs</div>
            <div className="text-black leading-9">2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}
