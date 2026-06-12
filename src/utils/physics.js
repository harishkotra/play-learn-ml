export function springForce(point, anchor, stiffness = 0.02, restLength = 0) {
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const displacement = dist - restLength;
  const force = stiffness * displacement;
  return { x: -force * (dx / dist), y: -force * (dy / dist) };
}

export function magneticForce(point, magnet, strength = 500, minDist = 5) {
  const dx = magnet.x - point.x;
  const dy = magnet.y - point.y;
  const dist = Math.max(Math.sqrt(dx * dx + dy * dy), minDist);
  const force = strength / (dist * dist);
  return { x: force * (dx / dist), y: force * (dy / dist) };
}

export function dragForce(velocity, damping = 0.9) {
  return { x: velocity.x * damping, y: velocity.y * damping };
}

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function screenToWorld(screenX, screenY, canvasRect, worldBounds) {
  const x =
    ((screenX - canvasRect.left) / canvasRect.width) *
      (worldBounds.right - worldBounds.left) +
    worldBounds.left;
  const y =
    ((screenY - canvasRect.top) / canvasRect.height) *
      (worldBounds.bottom - worldBounds.top) +
    worldBounds.top;
  return { x, y };
}

export function worldToScreen(worldX, worldY, canvasRect, worldBounds) {
  const x =
    ((worldX - worldBounds.left) / (worldBounds.right - worldBounds.left)) *
      canvasRect.width +
    canvasRect.left;
  const y =
    ((worldY - worldBounds.top) / (worldBounds.bottom - worldBounds.top)) *
      canvasRect.height +
    canvasRect.top;
  return { x, y };
}
