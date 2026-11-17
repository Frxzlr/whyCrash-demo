const categories: Record<string, string> = {
  modules: "Modules & packages",
  network: "Network & HTTP",
  runtime: "Files, processes & memory",
  javascript: "JavaScript runtime",
  data: "Data & serialization",
};

/** CrashLab metadata classification for analytics; this is not a diagnostic rule. */
export function classifyRule(ruleId: string | undefined): string {
  if (!ruleId) return "Uncategorized";
  const rule = ruleId.toLowerCase();
  if (/module|package|require|import|extension|native/.test(rule)) return categories.modules!;
  if (/connection|network|dns|tls|http|address|request|fetch|url/.test(rule)) return categories.network!;
  if (/file|spawn|permission|memory|process|open-files/.test(rule)) return categories.runtime!;
  if (/json|date|clone|bigint|circular/.test(rule)) return categories.data!;
  return categories.javascript!;
}
