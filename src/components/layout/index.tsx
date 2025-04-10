"use client";

import React from "react";
import Hero from "../hero";
import { useWallet } from "@jup-ag/wallet-adapter";

export default function Layout() {
  const { publicKey } = useWallet();
  console.log("publicKey", publicKey);
  return (
    <div>
      <div className="fixed bg-white z-10 w-full">
        <Hero />
      </div>
    </div>
  );
}
