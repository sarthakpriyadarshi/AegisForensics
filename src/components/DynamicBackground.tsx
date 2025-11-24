"use client";

import React from "react";

export const DynamicBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-[#030014]">
      {/* Dynamic moving gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3533cd] opacity-30 blur-[100px] animate-blob" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#4f46e5] opacity-30 blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-[#2d2a9e] opacity-30 blur-[100px] animate-blob animation-delay-4000" />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030014_90%)]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
        style={{ opacity: 0.15 }}
      />
    </div>
  );
};
