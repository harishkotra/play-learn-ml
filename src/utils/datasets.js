export function generateLinear(
  n = 40,
  slope = 0.8,
  intercept = 20,
  noise = 15,
) {
  const points = [];
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 200 - 100;
    const y = slope * x + intercept + (Math.random() - 0.5) * noise;
    points.push({ x, y, label: 0 });
  }
  return points;
}

export function generateMoons(n = 200, noise = 0.15) {
  const points = [];
  const n2 = n / 2;
  for (let i = 0; i < n2; i++) {
    const t = (Math.PI * i) / n2;
    points.push({
      x: Math.cos(t) + (Math.random() - 0.5) * noise,
      y: Math.sin(t) * 0.8 + (Math.random() - 0.5) * noise,
      label: 0,
    });
    points.push({
      x: 1 - Math.cos(t) + (Math.random() - 0.5) * noise,
      y: 0.4 - Math.sin(t) * 0.8 + (Math.random() - 0.5) * noise,
      label: 1,
    });
  }
  return points;
}

export function generateBlobs(n = 150, k = 3, spread = 0.3) {
  const centers = [
    { x: -0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 0, y: -0.5 },
    { x: -0.7, y: -0.3 },
  ].slice(0, k);
  const points = [];
  for (let i = 0; i < n; i++) {
    const c = centers[i % k];
    points.push({
      x: c.x + (Math.random() - 0.5) * spread,
      y: c.y + (Math.random() - 0.5) * spread,
      label: i % k,
    });
  }
  return shuffle(points);
}

export function generateCircles(n = 200, noise = 0.1) {
  const points = [];
  const n2 = n / 2;
  for (let i = 0; i < n2; i++) {
    const r = 0.3 + (Math.random() - 0.5) * noise;
    const t = Math.random() * 2 * Math.PI;
    points.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, label: 0 });
  }
  for (let i = 0; i < n2; i++) {
    const r = 0.7 + (Math.random() - 0.5) * noise;
    const t = Math.random() * 2 * Math.PI;
    points.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, label: 1 });
  }
  return shuffle(points);
}

export function generateXOR(n = 200, noise = 0.1) {
  const points = [];
  const n4 = n / 4;
  const regions = [
    { x: -0.5, y: -0.5, label: 0 },
    { x: 0.5, y: 0.5, label: 0 },
    { x: -0.5, y: 0.5, label: 1 },
    { x: 0.5, y: -0.5, label: 1 },
  ];
  for (const r of regions) {
    for (let i = 0; i < n4; i++) {
      points.push({
        x: r.x + (Math.random() - 0.5) * noise,
        y: r.y + (Math.random() - 0.5) * noise,
        label: r.label,
      });
    }
  }
  return shuffle(points);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
