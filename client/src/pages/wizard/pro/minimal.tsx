// Absolute minimal test component with no dependencies
export default function MinimalTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-4">Minimal Test Page</h1>
      <p className="text-gray-300 mb-4">
        This page has minimal dependencies to test routing issues.
      </p>
      <div className="p-4 bg-zinc-800 rounded-lg">
        <p className="text-white">If you can see this page, basic routing is working.</p>
      </div>
    </div>
  );
}