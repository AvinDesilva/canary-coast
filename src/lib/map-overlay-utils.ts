import type mapboxgl from "mapbox-gl";

export const ICON_SIZE = 24;

export function drawFallbackPin(map: mapboxgl.Map, id: string) {
  const canvas = document.createElement("canvas");
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext("2d")!;
  const cx = ICON_SIZE / 2;
  const cy = ICON_SIZE * 0.38;
  const r = ICON_SIZE * 0.32;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.6, cy + r * 0.5);
  ctx.lineTo(cx, ICON_SIZE - 2);
  ctx.lineTo(cx + r * 0.6, cy + r * 0.5);
  ctx.fill();
  if (!map.hasImage(id)) map.addImage(id, ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE), { sdf: true });
}

export function loadSvgIcon(map: mapboxgl.Map, id: string, svgString: string, onDone: () => void) {
  if (map.hasImage(id)) { onDone(); return; }
  const img = new Image(ICON_SIZE, ICON_SIZE);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) { drawFallbackPin(map, id); onDone(); return; }
    ctx.drawImage(img, 0, 0);
    if (!map.hasImage(id)) map.addImage(id, ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE), { sdf: true });
    onDone();
  };
  img.onerror = () => { drawFallbackPin(map, id); onDone(); };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
