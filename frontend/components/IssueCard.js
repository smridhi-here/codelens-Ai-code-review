const SEVERITY_STYLES = {
  error: {
    label: "Bug",
    text: "text-diff-del",
    bg: "bg-diff-delBg",
    dot: "bg-diff-del",
  },
  warning: {
    label: "Style",
    text: "text-diff-warn",
    bg: "bg-diff-warnBg",
    dot: "bg-diff-warn",
  },
  info: {
    label: "Suggestion",
    text: "text-slate-dark",
    bg: "bg-slate-light",
    dot: "bg-slate",
  },
};

export default function IssueCard({ issue }) {
  const style = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.info;

  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
          >
            {style.label}
          </span>
          {issue.line ? (
            <span className="font-mono text-xs text-inkmute">
              line {issue.line}
            </span>
          ) : null}
        </div>
        <span className="font-mono text-xs text-inkmute">{issue.rule}</span>
      </div>
      <p className="text-sm text-ink">{issue.message}</p>
      {issue.suggestion ? (
        <p className="mt-2 border-l-2 border-line pl-3 text-sm text-inkmute">
          Fix: {issue.suggestion}
        </p>
      ) : null}
    </div>
  );
}
