import { useState, Fragment } from "react";
import { useLanguage } from "../utils/LanguageContext";

const sections = ["definition", "how", "why", "what"];
const sectionIcons = { definition: "📖", how: "🔧", why: "💡", what: "👆" };

function renderLine(line, i) {
  const parts = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    const boldStart = remaining.indexOf("**");
    if (boldStart === -1) {
      parts.push(<Fragment key={key++}>{remaining}</Fragment>);
      break;
    }
    if (boldStart > 0) {
      parts.push(
        <Fragment key={key++}>{remaining.slice(0, boldStart)}</Fragment>,
      );
    }
    const boldEnd = remaining.indexOf("**", boldStart + 2);
    if (boldEnd === -1) {
      parts.push(<Fragment key={key++}>{remaining.slice(boldStart)}</Fragment>);
      break;
    }
    parts.push(
      <strong key={key++}>{remaining.slice(boldStart + 2, boldEnd)}</strong>,
    );
    remaining = remaining.slice(boldEnd + 2);
  }

  return parts.length > 0 ? parts : null;
}

function renderParagraph(text, i) {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length === 1) {
    const rendered = renderLine(lines[0], 0);
    if (!rendered) return null;
    return (
      <p key={i} className="text-xs text-workshop-text/90 leading-relaxed">
        {rendered}
      </p>
    );
  }
  return (
    <p key={i} className="text-xs text-workshop-text/90 leading-relaxed">
      {lines.map((line, li) => (
        <Fragment key={li}>
          {renderLine(line, li)}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </p>
  );
}

export default function DefinitionGuide({ title, definition, how, why, what }) {
  const [open, setOpen] = useState("definition");
  const { t } = useLanguage();
  const toggle = (key) => setOpen(open === key ? null : key);
  const content = { definition, how, why, what };

  return (
    <div className="bg-workshop-surface rounded-xl border border-workshop-border overflow-hidden">
      <div className="p-3 border-b border-workshop-border bg-workshop-bg">
        <h3 className="text-xs font-semibold text-workshop-accent tracking-wider uppercase">
          {title}
        </h3>
      </div>

      {sections.map((key) => (
        <div key={key}>
          <button
            onClick={() => toggle(key)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-all cursor-pointer ${
              open === key
                ? "bg-workshop-accent/10 text-workshop-accent"
                : "text-workshop-muted hover:text-workshop-text hover:bg-workshop-border/30"
            }`}
          >
            <span>{sectionIcons[key]}</span>
            <span className="font-medium">{t("guide." + key)}</span>
            <span
              className="ml-auto transition-transform"
              style={{
                transform: open === key ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              ▸
            </span>
          </button>
          {open === key && (
            <div className="px-3 pb-3 space-y-1.5">
              {content[key].split("\n\n").filter(Boolean).map(renderParagraph)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function LiveHint({ children }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-workshop-accent4/10 border border-workshop-accent4/20 text-xs text-workshop-text/90 leading-relaxed">
      <span className="text-workshop-accent4 shrink-0 mt-0.5">⚡</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
