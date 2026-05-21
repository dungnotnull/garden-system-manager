export function GardenLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/30 animate-pulse" />
        <p className="text-lg text-white/80 font-medium drop-shadow">
          Waking up the garden...
        </p>
      </div>
    </div>
  );
}
