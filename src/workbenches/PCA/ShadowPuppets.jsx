import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const xs = d3.scaleLinear().domain([-3, 3]).range([0, IW]);
const ys = d3.scaleLinear().domain([3, -3]).range([0, IH]);

function generateData(n = 40) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = Math.atan2(0.3, 1);
    const along = (Math.random() - 0.5) * 4;
    const perp = (Math.random() - 0.5) * 0.8;
    const x = along * Math.cos(angle) - perp * Math.sin(angle);
    const y = along * Math.sin(angle) + perp * Math.cos(angle);
    pts.push({ x, y, label: 0 });
  }
  return pts;
}

function computePCA(points) {
  const mx = d3.mean(points, (p) => p.x);
  const my = d3.mean(points, (p) => p.y);
  let vxx = 0,
    vxy = 0,
    vyy = 0;
  for (const p of points) {
    vxx += (p.x - mx) ** 2;
    vxy += (p.x - mx) * (p.y - my);
    vyy += (p.y - my) ** 2;
  }
  const n = points.length;
  vxx /= n;
  vxy /= n;
  vyy /= n;
  const theta = 0.5 * Math.atan2(2 * vxy, vxx - vyy);
  const eigenval1 =
    0.5 * (vxx + vyy) + 0.5 * Math.sqrt((vxx - vyy) ** 2 + 4 * vxy * vxy);
  const eigenval2 =
    0.5 * (vxx + vyy) - 0.5 * Math.sqrt((vxx - vyy) ** 2 + 4 * vxy * vxy);
  const totalVar = eigenval1 + eigenval2;
  return {
    angle: theta,
    pc1: Math.cos(theta),
    pc2: Math.sin(theta),
    explained: eigenval1 / totalVar,
    mx,
    my,
  };
}

function projectPoints(points, angle, mx, my) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  return points.map((p) => {
    const centX = p.x - mx;
    const centY = p.y - my;
    const proj = centX * dx + centY * dy;
    return { ...p, proj, projX: mx + proj * dx, projY: my + proj * dy };
  });
}

const LEVELS = [
  {
    title: "See the Shadow",
    objective:
      "Drag the line to rotate and watch the points cast 'shadows' (projections) onto it.",
    hint: "Click and drag the yellow line to rotate it. Watch the projected dots move along it.",
  },
  {
    title: "Find the Spread",
    objective:
      "Rotate the line so the projections spread out as much as possible.",
    hint: "Look for the direction with the most spread — that's the direction of maximum variance.",
  },
  {
    title: "Match PC1",
    objective: "Get within 5° of the true first principal component.",
    hint: "The variance % indicator shows how well the current direction captures the spread.",
  },
  {
    title: "High Variance",
    objective:
      "Capture at least 95% of the total variance with your chosen direction.",
    hint: "Rotate the line to align with the long axis of the data cloud.",
  },
  {
    title: "Top Component",
    objective: "Find PC1 exactly (≤ 1° error) AND explain ≥ 98% of variance.",
    hint: "The first principal component points toward the longest stretch of data. Use the variance meter as your guide.",
  },
];

export default function ShadowPuppets() {
  const svgRef = useRef(null);
  const [points] = useState(() => generateData(40));
  const [angle, setAngle] = useState(() => {
    const pca = computePCA(generateData(40));
    return pca.angle;
  });
  const [message, setMessage] = useState("");
  const ls = useLevelSystem(5);
  const [truePCA] = useState(() => computePCA(points));

  const projected = useMemo(
    () => projectPoints(points, angle, truePCA.mx, truePCA.my),
    [points, angle, truePCA],
  );
  const variance = useMemo(() => {
    const centered = points.map((p) => ({
      x: p.x - truePCA.mx,
      y: p.y - truePCA.my,
    }));
    const projVals = centered.map(
      (p) => p.x * Math.cos(angle) + p.y * Math.sin(angle),
    );
    const varProj = d3.variance(projVals) || 0;
    const varTotal =
      d3.variance(centered, (p) => p.x) + d3.variance(centered, (p) => p.y) ||
      0;
    return { current: varProj / varTotal, total: varTotal };
  }, [points, angle, truePCA]);

  const angleDeg = useMemo(() => {
    const deg = (angle * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
  }, [angle]);

  const checkLevel = useCallback(
    (a) => {
      const deg = (((a - truePCA.angle) * 180) / Math.PI + 360) % 360;
      const error = Math.min(deg, 360 - deg);
      const varRatio = variance.current;

      if (!message) {
        let msg = "";
        switch (ls.currentLevel) {
          case 1:
            if (!ls.justCompleted) {
              ls.completeLevel();
              msg =
                "✅ Level 1! You can see the projections. Now maximize the spread (L2).";
            }
            break;
          case 2:
            if (varRatio > 0.8 && !ls.justCompleted) {
              ls.completeLevel();
              msg = "🎉 Level 2! Good spread! Now find PC1 within 5° (L3).";
            }
            break;
          case 3:
            if (error < 5 && !ls.justCompleted) {
              ls.completeLevel();
              msg = "🎉 Level 3! Close to PC1! Now capture 95% variance (L4).";
            }
            break;
          case 4:
            if (varRatio >= 0.95 && !ls.justCompleted) {
              ls.completeLevel();
              msg =
                "🎉 Level 4! Almost all variance captured! Final: ≤1° with ≥98% (L5).";
            }
            break;
          case 5:
            if (error <= 1 && varRatio >= 0.98 && !ls.justCompleted) {
              ls.completeLevel();
              msg = "🏆 All levels complete! You understand PCA!";
            }
            break;
        }
        if (msg) setMessage(msg);
      }
    },
    [ls, truePCA, variance, message],
  );

  const handleAngleChange = useCallback((newAngle) => {
    while (newAngle < 0) newAngle += Math.PI;
    while (newAngle > Math.PI) newAngle -= Math.PI;
    setAngle(newAngle);
    setMessage("");
  }, []);

  useEffect(() => {
    checkLevel(angle);
  }, [angle, checkLevel]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    g.append("rect")
      .attr("width", IW)
      .attr("height", IH)
      .attr("fill", "#1a1a2e")
      .attr("rx", 8);

    g.append("line")
      .attr("x1", 0)
      .attr("y1", IH / 2)
      .attr("x2", IW)
      .attr("y2", IH / 2)
      .attr("stroke", "#2a2a4a")
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);
    g.append("line")
      .attr("x1", IW / 2)
      .attr("y1", 0)
      .attr("x2", IW / 2)
      .attr("y2", IH)
      .attr("stroke", "#2a2a4a")
      .attr("stroke-width", 1)
      .attr("opacity", 0.3);

    const projLineX1 = xs(truePCA.mx - 2 * Math.cos(angle));
    const projLineY1 = ys(truePCA.my - 2 * Math.sin(angle));
    const projLineX2 = xs(truePCA.mx + 2 * Math.cos(angle));
    const projLineY2 = ys(truePCA.my + 2 * Math.sin(angle));

    g.append("line")
      .attr("x1", projLineX1)
      .attr("y1", projLineY1)
      .attr("x2", projLineX2)
      .attr("y2", projLineY2)
      .attr("stroke", "#ffd93d")
      .attr("stroke-width", 2.5)
      .attr("opacity", 0.8)
      .attr("cursor", "grab");

    g.selectAll(".proj-line")
      .data(projected)
      .join("line")
      .attr("class", "proj-line")
      .attr("x1", (d) => xs(d.x))
      .attr("y1", (d) => ys(d.y))
      .attr("x2", (d) => xs(d.projX))
      .attr("y2", (d) => ys(d.projY))
      .attr("stroke", "#45e6c0")
      .attr("stroke-width", 1)
      .attr("opacity", 0.3)
      .attr("stroke-dasharray", "3,3");

    g.selectAll(".proj-pt")
      .data(projected)
      .join("circle")
      .attr("class", "proj-pt")
      .attr("cx", (d) => xs(d.projX))
      .attr("cy", (d) => ys(d.projY))
      .attr("r", 4)
      .attr("fill", "#45e6c0")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7);

    g.selectAll(".pt")
      .data(points)
      .join("circle")
      .attr("class", "pt")
      .attr("cx", (d) => xs(d.x))
      .attr("cy", (d) => ys(d.y))
      .attr("r", 5)
      .attr("fill", "#6c63ff")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.85);

    const dragLine = d3.drag().on("drag", (event) => {
      const rect = svgRef.current.getBoundingClientRect();
      const mx = event.sourceEvent.clientX - rect.left - MARGIN.left;
      const my = event.sourceEvent.clientY - rect.top - MARGIN.top;
      const cx = xs(truePCA.mx);
      const cy = ys(truePCA.my);
      const newAngle = Math.atan2(my - cy, mx - cx);
      handleAngleChange(newAngle);
    });

    g.selectAll(".drag-handle")
      .data([0])
      .join("circle")
      .attr("class", "drag-handle")
      .attr("cx", xs(truePCA.mx + 2 * Math.cos(angle)))
      .attr("cy", ys(truePCA.my + 2 * Math.sin(angle)))
      .attr("r", 8)
      .attr("fill", "#ffd93d")
      .attr("opacity", 0.3)
      .attr("stroke", "#ffd93d")
      .attr("stroke-width", 2)
      .attr("cursor", "grab")
      .style("pointer-events", "all")
      .call(dragLine);

    const legX = IW - 175,
      legY = 10;
    g.append("rect")
      .attr("x", legX)
      .attr("y", legY)
      .attr("width", 170)
      .attr("height", 56)
      .attr("rx", 6)
      .attr("fill", "#0f0f1a")
      .attr("opacity", 0.85);
    const legItems = [
      { label: "Data point", color: "#6c63ff", r: 4 },
      { label: "Projection (shadow)", color: "#45e6c0", r: 3.5 },
      { label: "PC direction", color: "#ffd93d", line: true },
    ];
    legItems.forEach((li, i) => {
      const ly = legY + 16 + i * 15;
      if (li.line) {
        g.append("line")
          .attr("x1", legX + 8)
          .attr("y1", ly)
          .attr("x2", legX + 26)
          .attr("y2", ly)
          .attr("stroke", li.color)
          .attr("stroke-width", 2)
          .attr("opacity", 0.7);
      } else {
        g.append("circle")
          .attr("cx", legX + 17)
          .attr("cy", ly)
          .attr("r", li.r)
          .attr("fill", li.color)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);
      }
      g.append("text")
        .attr("x", legX + 32)
        .attr("y", ly + 3)
        .attr("fill", "#8888aa")
        .attr("font-size", 9)
        .text(li.label);
    });
  }, [points, projected, angle, truePCA, handleAngleChange]);

  const trueAngleDeg = ((truePCA.angle * 180) / Math.PI + 360) % 360;
  const error = Math.min(
    (angleDeg - trueAngleDeg + 360) % 360,
    (trueAngleDeg - angleDeg + 360) % 360,
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🎭</span> Shadow Puppets — PCA
          </h1>
          <p className="text-workshop-muted text-sm">
            Drag to rotate the projection line. Each point casts a{" "}
            <strong>shadow</strong> — that's dimensionality reduction.
          </p>
        </div>
        <span className="text-xs text-workshop-muted bg-workshop-surface px-3 py-1 rounded-full border border-workshop-border">
          Level {ls.currentLevel}/5
        </span>
      </div>
      <div className="flex gap-6">
        <div style={{ width: W, height: H }}>
          <svg ref={svgRef} width={W} height={H} className="rounded-xl" />
        </div>
        <div className="w-72 space-y-4 shrink-0">
          <LevelSystem
            levels={LEVELS}
            currentLevel={ls.currentLevel}
            completedLevels={ls.completedLevels}
            onSelectLevel={ls.selectLevel}
            onComplete={ls.completeLevel}
            justCompleted={ls.justCompleted}
            onNext={ls.goNext}
          />
          <DefinitionGuide
            title="What is PCA?"
            definition={`**Principal Component Analysis** finds the direction of maximum variance in data and projects points onto it.\n\nLike casting a shadow: a 3D object's 2D shadow tells you a lot — if you hold it at the right angle.`}
            how={`1. **Centering**: subtract the mean from all points\n2. **PC1**: the direction where data spreads most\n3. **Projection**: each point drops a perpendicular "shadow" onto the line\n4. **Variance explained**: how much of the original spread is preserved\n\nDrag the yellow line to rotate PC1 — watch shadows move!`}
            why={`PCA is the most widely used dimensionality reduction technique. Used for visualization (project high-D to 2D), noise reduction, feature compression, and exploratory data analysis.`}
            what={`Drag the yellow handle to rotate the principal component. Watch the green "shadows" — projected points on the line. The goal is to maximize variance (spread along the line).`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border space-y-3">
            <div className="text-xs text-workshop-muted space-y-1">
              <div className="flex justify-between">
                <span>Current Angle</span>
                <span className="font-mono text-workshop-text">
                  {angleDeg.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span>True PC1</span>
                <span className="font-mono text-workshop-accent3">
                  {trueAngleDeg.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span>Error</span>
                <span
                  className={`font-mono ${error < 5 ? "text-workshop-accent3" : "text-workshop-accent2"}`}
                >
                  {error.toFixed(1)}°
                </span>
              </div>
              <div className="pt-2 border-t border-workshop-border">
                <div className="flex justify-between mb-1">
                  <span>Variance Captured</span>
                  <span
                    className={`font-mono ${variance.current >= 0.95 ? "text-workshop-accent3" : "text-workshop-accent4"}`}
                  >
                    {(variance.current * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-workshop-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-workshop-accent3 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, variance.current * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
