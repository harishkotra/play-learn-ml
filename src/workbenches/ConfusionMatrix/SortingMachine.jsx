import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const ITEM_W = 80,
  ITEM_H = 36;

function generateItems(count, difficulty) {
  const items = [];
  const actuals = [];
  for (let i = 0; i < count; i++) actuals.push(Math.random() < 0.5 ? 0 : 1);
  const accBase = Math.max(0.45, 0.7 - difficulty * 0.06);
  const trueRate = Math.min(0.9, accBase + 0.15);
  const falseRate = 1 - trueRate;
  for (let i = 0; i < count; i++) {
    const actual = actuals[i];
    const correct = Math.random() < trueRate;
    const predicted = correct ? actual : actual === 0 ? 1 : 0;
    items.push({
      id: i,
      actual,
      predicted,
      x: 30 + (i % 8) * (ITEM_W + 12),
      y: 20 + Math.floor(i / 8) * (ITEM_H + 10),
      placed: false,
      bin: null,
    });
  }
  return items;
}

const LEVELS = [
  {
    title: "First Sort",
    objective: "Drag at least 4 predictions into the correct bins.",
    hint: "Drag a card into TP (actual=1, predicted=1), TN, FP, or FN.",
  },
  {
    title: "Half Sorted",
    objective: "Correctly sort at least 8 predictions.",
    hint: "Look at the actual value (A) and predicted value (P) on each card.",
  },
  {
    title: "Nearly Perfect",
    objective: "Correctly sort at least 12 predictions.",
    hint: "Aim for 80% accuracy! Take your time with each card.",
  },
  {
    title: "Perfectionist",
    objective: "Sort all 16 predictions correctly.",
    hint: "Check each card carefully. A=actual truth, P=model prediction.",
  },
  {
    title: "Speed Demon",
    objective:
      "Sort all 16 correctly AND achieve accuracy ≥ 90% for the model.",
    hint: "The model accuracy is fixed — sort carefully to match the ground truth.",
  },
];

export default function SortingMachine() {
  const svgRef = useRef(null);
  const [levelItems, setLevelItems] = useState(() => [4, 8, 12, 16, 16]);
  const [items, setItems] = useState(() => generateItems(4, 1));
  const [sorted, setSorted] = useState({ TP: 0, TN: 0, FP: 0, FN: 0 });
  const [correctCount, setCorrectCount] = useState(0);
  const [message, setMessage] = useState("");
  const [totalPlaced, setTotalPlaced] = useState(0);
  const ls = useLevelSystem(5);

  const resetLevel = useCallback(() => {
    const count = levelItems[ls.currentLevel - 1] || 4;
    const newItems = generateItems(count, ls.currentLevel);
    setItems(newItems);
    setSorted({ TP: 0, TN: 0, FP: 0, FN: 0 });
    setCorrectCount(0);
    setTotalPlaced(0);
    setMessage("");
  }, [ls.currentLevel, levelItems]);

  useEffect(() => {
    resetLevel();
  }, [ls.currentLevel]);

  const checkLevel = useCallback(
    (correct, total) => {
      const thresholds = [4, 8, 12, 16, 16];
      const needed = thresholds[ls.currentLevel - 1] || 4;
      if (correct >= needed && !ls.justCompleted) {
        ls.completeLevel();
        if (ls.currentLevel < 5) {
          setMessage(
            `🎉 Level ${ls.currentLevel} done! ${correct}/${total} correct. On to the next level!`,
          );
        } else {
          setMessage(
            "🏆 All levels complete! You're a Confusion Matrix master!",
          );
        }
        return true;
      }
      return false;
    },
    [ls],
  );

  const handleDrop = useCallback(
    (item, bin) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, placed: true, bin } : i)),
      );
      const actual = item.actual;
      const predicted = item.predicted;
      let correct = false;
      if (bin === "TP" && actual === 1 && predicted === 1) correct = true;
      else if (bin === "TN" && actual === 0 && predicted === 0) correct = true;
      else if (bin === "FP" && actual === 0 && predicted === 1) correct = true;
      else if (bin === "FN" && actual === 1 && predicted === 0) correct = true;

      setCorrectCount((prev) => prev + (correct ? 1 : 0));
      setTotalPlaced((prev) => prev + 1);
      setSorted((prev) => ({ ...prev, [bin]: prev[bin] + 1 }));

      const newCorrect = correctCount + (correct ? 1 : 0);
      const newTotal = totalPlaced + 1;
      if (newTotal >= levelItems[ls.currentLevel - 1]) {
        checkLevel(newCorrect, newTotal);
      }
    },
    [correctCount, totalPlaced, levelItems, ls, checkLevel],
  );

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

    const bins = [
      {
        id: "TP",
        label: "True Positive",
        x: 10,
        y: 260,
        w: (IW - 30) / 2,
        h: 90,
      },
      {
        id: "TN",
        label: "True Negative",
        x: 10 + (IW - 30) / 2 + 10,
        y: 260,
        w: (IW - 30) / 2,
        h: 90,
      },
      {
        id: "FP",
        label: "False Positive",
        x: 10,
        y: 365,
        w: (IW - 30) / 2,
        h: 90,
      },
      {
        id: "FN",
        label: "False Negative",
        x: 10 + (IW - 30) / 2 + 10,
        y: 365,
        w: (IW - 30) / 2,
        h: 90,
      },
    ];

    const binColors = {
      TP: "#45e6c0",
      TN: "#6c63ff",
      FP: "#ff6b9d",
      FN: "#ffd93d",
    };

    bins.forEach((b) => {
      const bg = g
        .append("rect")
        .attr("x", b.x)
        .attr("y", b.y)
        .attr("width", b.w)
        .attr("height", b.h)
        .attr("rx", 8)
        .attr("fill", binColors[b.id])
        .attr("opacity", 0.08)
        .attr("stroke", binColors[b.id])
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,4");
      g.append("text")
        .attr("x", b.x + b.w / 2)
        .attr("y", b.y + 16)
        .attr("text-anchor", "middle")
        .attr("fill", binColors[b.id])
        .attr("font-size", 11)
        .attr("font-weight", "bold")
        .text(b.label);
      g.append("text")
        .attr("x", b.x + b.w / 2)
        .attr("y", b.y + 32)
        .attr("text-anchor", "middle")
        .attr("fill", binColors[b.id])
        .attr("font-size", 9)
        .attr("opacity", 0.7)
        .text(`A=1 P=1`);

      g.append("text")
        .attr("x", b.x + b.w / 2)
        .attr("y", b.y + 50)
        .attr("text-anchor", "middle")
        .attr("fill", binColors[b.id])
        .attr("font-size", 14)
        .attr("font-weight", "bold")
        .text(`[${sorted[b.id]}]`);
    });

    bins.forEach((b) => {
      const dropBg = g
        .append("rect")
        .attr("x", b.x)
        .attr("y", b.y)
        .attr("width", b.w)
        .attr("height", b.h)
        .attr("rx", 8)
        .attr("fill", "transparent")
        .attr("stroke", "transparent")
        .style("pointer-events", "all");
    });

    const itemsG = g.append("g").attr("class", "items");

    const drag = d3
      .drag()
      .on("start", function (event, d) {
        d3.select(this).raise();
      })
      .on("drag", function (event, d) {
        d.x = event.x;
        d.y = event.y;
        d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
      })
      .on("end", function (event, d) {
        const mx = event.x + ITEM_W / 2;
        const my = event.y + ITEM_H / 2;
        let dropped = false;
        for (const b of bins) {
          if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
            handleDrop(d, b.id);
            dropped = true;
            d3.select(this).remove();
            break;
          }
        }
        if (!dropped) {
          d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
        }
      });

    const unplaced = items.filter((i) => !i.placed);
    itemsG
      .selectAll(".item")
      .data(unplaced, (d) => d.id)
      .join("g")
      .attr("class", "item")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("cursor", "grab")
      .call(drag)
      .each(function (d) {
        const el = d3.select(this);
        el.append("rect")
          .attr("width", ITEM_W)
          .attr("height", ITEM_H)
          .attr("rx", 6)
          .attr("fill", "#2a2a4a")
          .attr("stroke", "#6c63ff")
          .attr("stroke-width", 1);
        el.append("text")
          .attr("x", ITEM_W / 2)
          .attr("y", 15)
          .attr("text-anchor", "middle")
          .attr("fill", "#e8e8f0")
          .attr("font-size", 10)
          .attr("font-weight", "bold")
          .text(`#${d.id + 1}`);
        const actualColor = d.actual === 1 ? "#ff6b9d" : "#6c63ff";
        const predColor = d.predicted === 1 ? "#ff6b9d" : "#6c63ff";
        el.append("text")
          .attr("x", 14)
          .attr("y", 28)
          .attr("fill", actualColor)
          .attr("font-size", 9)
          .text(`A:${d.actual}`);
        el.append("text")
          .attr("x", ITEM_W - 14)
          .attr("y", 28)
          .attr("text-anchor", "end")
          .attr("fill", predColor)
          .attr("font-size", 9)
          .text(`P:${d.predicted}`);
      });
  }, [items, sorted, handleDrop]);

  const totalItems = levelItems[ls.currentLevel - 1] || 4;
  const accuracy =
    totalPlaced > 0 ? Math.round((correctCount / totalPlaced) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>📋</span> Sorting Machine — Confusion Matrix
          </h1>
          <p className="text-workshop-muted text-sm">
            Drag each prediction card into the correct bin:{" "}
            <strong>TP, TN, FP, FN</strong>.
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
            title="What is a Confusion Matrix?"
            definition={`A table that summarizes classification model performance by comparing predicted vs actual values.\n\n**TP** = predicted 1, actually 1 (correct)\n**TN** = predicted 0, actually 0 (correct)\n**FP** = predicted 1, actually 0 (Type I error)\n**FN** = predicted 0, actually 1 (Type II error)`}
            how={`1. Each card shows **A=actual** (ground truth) and **P=predicted** (model output)\n2. Drag it to the matching bin\n3. TP = correct positive, TN = correct negative\n4. FP = false alarm, FN = missed detection`}
            why={`Confusion matrices reveal what kind of errors a model makes. Critical for medical tests, fraud detection, and security where different errors have different costs.`}
            what={`A=actual value (what was really true), P=predicted value (what the model guessed). Drag each card to its correct bin!`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border space-y-3">
            <div className="text-xs text-workshop-muted space-y-1">
              <div className="flex justify-between">
                <span>Placed</span>
                <span className="font-mono text-workshop-text">
                  {totalPlaced}/{totalItems}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Correct</span>
                <span className="font-mono text-workshop-accent3">
                  {correctCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Accuracy</span>
                <span
                  className={`font-mono ${accuracy >= 80 ? "text-workshop-accent3" : accuracy >= 50 ? "text-workshop-accent4" : "text-workshop-accent2"}`}
                >
                  {accuracy}%
                </span>
              </div>
              <div className="pt-2 border-t border-workshop-border space-y-1">
                {[
                  { bin: "TP", color: "text-workshop-accent3" },
                  { bin: "TN", color: "text-workshop-accent" },
                  { bin: "FP", color: "text-workshop-accent2" },
                  { bin: "FN", color: "text-workshop-accent4" },
                ].map(({ bin, color }) => (
                  <div key={bin} className="flex justify-between text-[11px]">
                    <span className={color}>{bin}</span>
                    <span className="font-mono text-workshop-text">
                      {sorted[bin]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={resetLevel}
              className="w-full px-3 py-2 bg-workshop-border rounded-lg text-xs text-workshop-muted cursor-pointer hover:bg-workshop-surface"
            >
              🔄 Reset Level
            </button>
          </div>
          {message && <LiveHint>{message}</LiveHint>}
        </div>
      </div>
    </div>
  );
}
