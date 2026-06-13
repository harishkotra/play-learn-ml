import { LANGUAGES } from "../utils/i18n";

export default function LanguageSwitcher({ locale, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {Object.entries(LANGUAGES).map(([code, { label }]) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`px-2 py-1 text-[10px] rounded cursor-pointer font-bold transition-colors ${
            locale === code
              ? "bg-workshop-accent text-white"
              : "bg-workshop-border/50 text-workshop-muted hover:text-workshop-text hover:bg-workshop-border"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
