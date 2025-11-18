export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="absolute inset-0 bg-purple-900/50 backdrop-blur-md" />
      <div className="relative z-10 bg-white rounded-lg p-8 flex flex-col items-center gap-4 animate-fade-in-scale">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-black font-medium">Loading...</p>
      </div>
    </div>
  );
}
