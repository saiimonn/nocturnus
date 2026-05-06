import FloorplanCanvas from './floorplanCanvas';

export default function LayoutEditorPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-white">Floorplan Editor</h1>
      <FloorplanCanvas />
    </div>
  );
}
