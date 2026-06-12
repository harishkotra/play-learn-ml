export function computeOLS(points) {
  const n = points.length;
  if (n < 2) return { m: 0, b: 0, sse: 0, r2: 0 };

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = meanY - m * meanX;

  let sse = 0,
    sst = 0;
  for (const p of points) {
    const pred = m * p.x + b;
    sse += (p.y - pred) ** 2;
    sst += (p.y - meanY) ** 2;
  }

  const r2 = sst === 0 ? 0 : 1 - sse / sst;
  return { m, b, sse, r2 };
}
