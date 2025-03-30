export default function LoadingBars() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex items-end space-x-2 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-4 bg-green-500 rounded-t-md animate-loading-bar"
            style={{
              height: "40px",
              animation: `loading ${0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <p className="text-gray-600 animate-pulse">Loading...</p>
    </div>
  );
}
