import { useState, useRef } from "react";
import Dither1 from "./components/Dither1";
import daffodil from "./assets/daffodil.png";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string>(daffodil);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageUrl(URL.createObjectURL(file));
  };

  return (
    <div className="flex w-screen h-screen antialiased font-sans items-center">
      <div className="w-2/5 h-full flex flex-col items-center justify-center gap-3 px-12 bg-neutral-100">
        <img src={imageUrl} className="h-48 w-64 rounded-lg object-cover" />
        <button
          className="bg-neutral-100 text-neutral-600 w-min text-nowrap text-xs rounded-sm px-2 py-1 border-none cursor-pointer transition-all duration-75 hover:bg-neutral-200"
          onClick={() => fileInputRef.current?.click()}
        >
          Replace image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

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
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-56 h-28 bg-blue-300">
              <Dither1 sourceImage={imageUrl}></Dither1>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
