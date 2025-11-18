import { ReactNode } from "react";

interface BackgroundWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function BackgroundWrapper({
  children,
  className = "",
}: BackgroundWrapperProps) {
  return (
    <div
      className={`min-h-screen relative ${className}`}
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-purple-900/40 backdrop-blur-sm" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
