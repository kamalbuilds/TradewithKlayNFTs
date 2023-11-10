import { ConnectWallet } from "@thirdweb-dev/react";
import Image from "next/image";
import Link from "next/link";

export function Nav() {
  return (
    <div className="w-full flex items-center justify-center fixed top-0 left-0 z-50 rounded-xl shadow-md backdrop-blur-lg">
      <nav className="flex items-center justify-between w-full max-w-7xl py-5 px-4 border-b-2">
        <div className="flex items-center gap-3 transition duration-150">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" width={42} height={42} alt="EVM Kit Logo" />
          </Link>

          <div className="flex ml-3 gap-6">
            <Link
              href="/"
              className="text-white text-base font-medium hover:text-white transition-colors duration-300"
            >
              Home
            </Link>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <ConnectWallet />
        </div>
      </nav>
    </div>
  );
}
