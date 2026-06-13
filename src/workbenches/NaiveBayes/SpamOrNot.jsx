import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import DefinitionGuide, { LiveHint } from "../../components/DefinitionGuide";
import LevelSystem, { useLevelSystem } from "../../components/LevelSystem";

const W = 700,
  H = 500;
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 };
const IW = W - MARGIN.left - MARGIN.right;
const IH = H - MARGIN.top - MARGIN.bottom;
const CARD_W = 90,
  CARD_H = 50;

const WORDS = [
  "free",
  "win",
  "click",
  "urgent",
  "hello",
  "meeting",
  "offer",
  "limited",
  "dear",
  "cash",
  "bonus",
  "report",
];

function generateEmails(n = 10) {
  const emails = [];
  for (let i = 0; i < n; i++) {
    const isSpam = Math.random() < 0.4;
    const wordCount = 2 + Math.floor(Math.random() * 4);
    const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
    const words = shuffled.slice(0, wordCount);
    const wordSet = new Set(words);
    const spamWords =
      wordSet.has("free") ||
      wordSet.has("win") ||
      wordSet.has("click") ||
      wordSet.has("urgent") ||
      wordSet.has("offer") ||
      wordSet.has("limited") ||
      wordSet.has("cash") ||
      wordSet.has("bonus");
    const actual = isSpam ? 1 : 0;
    const predicted =
      (isSpam && spamWords) || (!isSpam && !spamWords && Math.random() < 0.3)
        ? isSpam
        : isSpam
          ? Math.random() < 0.7
            ? 1
            : 0
          : Math.random() < 0.9
            ? 0
            : 1;
    emails.push({
      id: i,
      words,
      isSpam,
      predicted,
      hasSpammy: spamWords,
      x: 15 + (i % 6) * (CARD_W + 12),
      y: 15 + Math.floor(i / 6) * (CARD_H + 10),
      placed: false,
      bin: null,
    });
  }
  return emails;
}

function computeProbabilities(emails) {
  const total = emails.length;
  const spamCount = emails.filter((e) => e.isSpam === 1).length;
  const notSpamCount = total - spamCount;
  if (total === 0) return { priorSpam: 0.5, priorNot: 0.5, wordProbs: {} };
  const priorSpam = spamCount / total;
  const priorNot = notSpamCount / total;
  const wordProbs = {};
  for (const word of WORDS) {
    const inSpam = emails.filter(
      (e) => e.isSpam === 1 && e.words.includes(word),
    ).length;
    const inNot = emails.filter(
      (e) => e.isSpam === 0 && e.words.includes(word),
    ).length;
    wordProbs[word] = {
      givenSpam: spamCount > 0 ? (inSpam + 1) / (spamCount + 2) : 0.5,
      givenNot: notSpamCount > 0 ? (inNot + 1) / (notSpamCount + 2) : 0.5,
    };
  }
  return { priorSpam, priorNot, wordProbs, spamCount, notSpamCount };
}

const LEVELS = [
  {
    title: "First Sort",
    objective: "Drag at least 4 emails into Spam or Not Spam.",
    hint: "Drag each email card into the green (Not Spam) or pink (Spam) zone.",
  },
  {
    title: "Watch the Probs",
    objective:
      "Correctly sort at least 6 emails and observe how word probabilities update.",
    hint: "Each word's probability updates as you sort more emails. Watch 'free' and 'win' spike in spam.",
  },
  {
    title: "Naive Predictor",
    objective: "Sort 8+ emails correctly.",
    hint: "Use the word probabilities in the sidebar to guide your decisions.",
  },
  {
    title: "Bayesian Detective",
    objective: "Correctly classify at least 10 emails with 80%+ accuracy.",
    hint: "Check the word likelihoods: spammy words = higher spam probability under Bayes' rule.",
  },
  {
    title: "Perfect Filter",
    objective:
      "Sort all emails correctly AND achieve 90%+ posterior confidence on at least 3 spam emails.",
    hint: "Focus on emails containing multiple spam words — they should have high posterior probability.",
  },
];

export default function SpamOrNot() {
  const svgRef = useRef(null);
  const levelCounts = [6, 8, 10, 12, 12];
  const [allEmails, setAllEmails] = useState(() =>
    generateEmails(levelCounts[0]),
  );
  const [sorted, setSorted] = useState({ spam: 0, notSpam: 0 });
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const ls = useLevelSystem(5);

  const emails = allEmails.filter((e) => !e.placed);
  const classified = allEmails.filter((e) => e.placed);

  const probs = useMemo(() => computeProbabilities(classified), [classified]);

  const resetLevel = useCallback(() => {
    const n = levelCounts[ls.currentLevel - 1] || 6;
    setAllEmails(generateEmails(n));
    setSorted({ spam: 0, notSpam: 0 });
    setCorrect(0);
    setTotal(0);
    setMessage("");
  }, [ls.currentLevel]);

  useEffect(() => {
    resetLevel();
  }, [ls.currentLevel]);

  const checkLevel = useCallback(
    (cor, tot) => {
      const thresholds = [4, 6, 8, 10, 12];
      const needed = thresholds[ls.currentLevel - 1] || 4;
      if (cor >= needed && !ls.justCompleted) {
        ls.completeLevel();
        setMessage(
          ls.currentLevel < 5
            ? `🎉 Level ${ls.currentLevel} done! ${cor}/${tot} correct. Next level!`
            : "🏆 All levels complete! You understand Naive Bayes!",
        );
      }
    },
    [ls],
  );

  const handleDrop = useCallback(
    (item, bin) => {
      setAllEmails((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, placed: true, bin } : e)),
      );
      const correctBin = item.isSpam ? "spam" : "notSpam";
      const isCorrect = bin === correctBin;
      setCorrect((prev) => prev + (isCorrect ? 1 : 0));
      setTotal((prev) => prev + 1);
      setSorted((prev) => ({ ...prev, [bin]: prev[bin] + 1 }));
      checkLevel(correct + (isCorrect ? 1 : 0), total + 1);
    },
    [correct, total, checkLevel],
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

    const zones = [
      {
        id: "notSpam",
        label: "📥 Not Spam",
        color: "#45e6c0",
        x: 10,
        y: IH - 100,
        w: (IW - 30) / 2,
        h: 85,
      },
      {
        id: "spam",
        label: "📬 Spam",
        color: "#ff6b9d",
        x: 20 + (IW - 30) / 2,
        y: IH - 100,
        w: (IW - 30) / 2,
        h: 85,
      },
    ];

    zones.forEach((z) => {
      g.append("rect")
        .attr("x", z.x)
        .attr("y", z.y)
        .attr("width", z.w)
        .attr("height", z.h)
        .attr("rx", 8)
        .attr("fill", z.color)
        .attr("opacity", 0.08)
        .attr("stroke", z.color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,4");
      g.append("text")
        .attr("x", z.x + z.w / 2)
        .attr("y", z.y + 20)
        .attr("text-anchor", "middle")
        .attr("fill", z.color)
        .attr("font-size", 12)
        .attr("font-weight", "bold")
        .text(z.label);
      g.append("text")
        .attr("x", z.x + z.w / 2)
        .attr("y", z.y + 42)
        .attr("text-anchor", "middle")
        .attr("fill", z.color)
        .attr("font-size", 16)
        .attr("font-weight", "bold")
        .text(`[${sorted[z.id]}]`);
      g.append("text")
        .attr("x", z.x + z.w / 2)
        .attr("y", z.y + 62)
        .attr("text-anchor", "middle")
        .attr("fill", z.color)
        .attr("font-size", 9)
        .attr("opacity", 0.6)
        .text(`Drop emails here`);
    });

    const pg = g.append("g").attr("class", "emails");
    const drag = d3
      .drag()
      .on("start", function () {
        d3.select(this).raise();
      })
      .on("drag", function (event, d) {
        d.x = event.x;
        d.y = event.y;
        d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
      })
      .on("end", function (event, d) {
        const mx = event.x + CARD_W / 2;
        const my = event.y + CARD_H / 2;
        for (const z of zones) {
          if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
            handleDrop(d, z.id);
            d3.select(this).remove();
            return;
          }
        }
      });

    pg.selectAll(".email")
      .data(emails, (d) => d.id)
      .join("g")
      .attr("class", "email")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("cursor", "grab")
      .call(drag)
      .each(function (d) {
        const el = d3.select(this);
        el.append("rect")
          .attr("width", CARD_W)
          .attr("height", CARD_H)
          .attr("rx", 6)
          .attr("fill", "#2a2a4a")
          .attr("stroke", d.isSpam ? "#ff6b9d" : "#45e6c0")
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", d.isSpam ? 0.5 : 0.3);
        el.append("text")
          .attr("x", CARD_W / 2)
          .attr("y", 15)
          .attr("text-anchor", "middle")
          .attr("fill", "#e8e8f0")
          .attr("font-size", 9)
          .attr("font-weight", "bold")
          .text(`Email #${d.id + 1}`);
        const wordsText =
          d.words.slice(0, 3).join(", ") + (d.words.length > 3 ? "..." : "");
        el.append("text")
          .attr("x", CARD_W / 2)
          .attr("y", 30)
          .attr("text-anchor", "middle")
          .attr("fill", "#8888aa")
          .attr("font-size", 8)
          .text(wordsText);
        el.append("text")
          .attr("x", CARD_W / 2)
          .attr("y", 44)
          .attr("text-anchor", "middle")
          .attr("fill", d.isSpam ? "#ff6b9d" : "#45e6c0")
          .attr("font-size", 8)
          .attr("opacity", 0.6)
          .text(d.isSpam ? "⚠️ suspicious" : "✅ clean");
      });
  }, [emails, sorted, handleDrop]);

  const posteriorFor = useCallback(
    (email) => {
      const { priorSpam, priorNot, wordProbs } = probs;
      if (!email || !wordProbs) return 0.5;
      let logSpam = Math.log(priorSpam || 0.01);
      let logNot = Math.log(priorNot || 0.01);
      for (const word of WORDS) {
        const wp = wordProbs[word] || { givenSpam: 0.5, givenNot: 0.5 };
        if (email.words.includes(word)) {
          logSpam += Math.log(wp.givenSpam || 0.01);
          logNot += Math.log(wp.givenNot || 0.01);
        } else {
          logSpam += Math.log(1 - wp.givenSpam || 0.01);
          logNot += Math.log(1 - wp.givenNot || 0.01);
        }
      }
      return 1 / (1 + Math.exp(logNot - logSpam));
    },
    [probs],
  );

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const topSpamWords = useMemo(() => {
    if (!probs.wordProbs) return [];
    return WORDS.map((w) => ({
      word: w,
      ratio:
        (probs.wordProbs[w]?.givenSpam || 0.5) /
        (probs.wordProbs[w]?.givenNot || 0.5),
    }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 4);
  }, [probs]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>📧</span> Spam or Not — Naive Bayes
          </h1>
          <p className="text-workshop-muted text-sm">
            Drag emails into categories and watch how word{" "}
            <strong>probabilities</strong> update in real-time.
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
            title="What is Naive Bayes?"
            definition={`A classifier based on **Bayes' Theorem** that assumes features (words) are independent.\n\n"Naive" because words aren't truly independent, but the simplification works surprisingly well for spam filtering.`}
            how={`1. **Prior**: P(spam) = % of emails that are spam\n2. **Likelihood**: P(word | spam) = how often this word appears in spam\n3. **Posterior**: P(spam | words) ∝ P(spam) × ∏ P(word | spam)\n4. The word with the highest ratio (spam/not-spam) is the best spam indicator`}
            why={`Naive Bayes powers ~90% of the world's spam filters. It's fast, interpretable, and works with tiny datasets. Also used for sentiment analysis, document classification, and medical diagnosis.`}
            what={`Drag emails into the green (Not Spam) or pink (Spam) zones. Watch word probabilities in the sidebar update as you classify more emails.`}
          />
          <div className="bg-workshop-surface rounded-xl p-4 border border-workshop-border space-y-3">
            <div className="text-xs text-workshop-muted space-y-1">
              <div className="flex justify-between">
                <span>Sorted</span>
                <span className="font-mono text-workshop-text">
                  {total}/{levelCounts[ls.currentLevel - 1]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Correct</span>
                <span className="font-mono text-workshop-accent3">
                  {correct}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Accuracy</span>
                <span
                  className={`font-mono ${accuracy >= 80 ? "text-workshop-accent3" : "text-workshop-accent4"}`}
                >
                  {accuracy}%
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-workshop-border">
                <span>Prior P(Spam)</span>
                <span className="font-mono text-workshop-text">
                  {probs.priorSpam !== undefined
                    ? (probs.priorSpam * 100).toFixed(0) + "%"
                    : "—"}
                </span>
              </div>
              <div className="pt-2 border-t border-workshop-border">
                <div className="text-[10px] text-workshop-muted mb-1 font-semibold">
                  📊 Top Spam Words
                </div>
                {topSpamWords.length > 0 ? (
                  topSpamWords.map(({ word, ratio }) => (
                    <div
                      key={word}
                      className="flex justify-between text-[10px] py-0.5"
                    >
                      <span className="text-workshop-text">{word}</span>
                      <span className="font-mono text-workshop-accent2">
                        {ratio.toFixed(1)}×
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-workshop-muted">
                    Sort emails to see word probabilities
                  </div>
                )}
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
