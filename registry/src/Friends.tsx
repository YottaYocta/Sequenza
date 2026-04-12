import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import HandshakerHero from "./components/HandshakerHero";
import Sentinel from "./components/Sentinel";

export default function Friends() {
  return (
    <div className="flex flex-col items-center gap-36 pt-3 pb-12 bg-neutral-100 antialiased font-sans min-h-screen px-10">
      <Nav />
      <div className="flex flex-col items-center gap-16 w-full max-w-screen-2xl">
        <HandshakerHero />
        <Sentinel />
      </div>
      <Footer />
    </div>
  );
}
