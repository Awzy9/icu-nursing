import { Fragment, type ReactNode } from "react";
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>]+)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    const link = p.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noreferrer" className="break-words underline">{link[1]}</a>;
    if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noreferrer" className="break-all underline">{p}</a>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}
export function WorkingBody({ body }: { body: string }) {
  const lines = body.split("\n"), nodes: ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line || /^---+$/.test(line)) continue;
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) { const text = heading[2]!; nodes.push(heading[1]!.length < 3 ? <h2 key={i} className="mt-8 border-b border-border pb-2 text-xl font-semibold">{inline(text)}</h2> : <h3 key={i} className="mt-5 text-lg font-semibold">{inline(text)}</h3>); continue; }
    if (line.startsWith("|") && lines[i + 1]?.match(/^\s*\|?[\s:|-]+\|/)) {
      const cells = (s: string) => s.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
      const heads = cells(line); i += 2; const rows: string[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("|")) { rows.push(cells(lines[i]!)); i++; } i--;
      nodes.push(<div key={i} className="my-4 overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr>{heads.map((c, j) => <th key={j} scope="col" className="border border-border bg-muted p-3 text-start">{inline(c)}</th>)}</tr></thead><tbody>{rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} className="border border-border p-3 align-top">{inline(c)}</td>)}</tr>)}</tbody></table></div>); continue;
    }
    if (/^[-*]\s/.test(line) || /^\d+[.)]\s/.test(line)) {
      const items: string[] = []; const numbered = /^\d+[.)]\s/.test(line);
      while (i < lines.length && (numbered ? /^\d+[.)]\s/ : /^[-*]\s/).test(lines[i]!.trim())) { items.push(lines[i]!.trim().replace(/^(?:[-*]|\d+[.)])\s/, "")); i++; } i--;
      const list = items.map((s, j) => <li key={j}>{inline(s)}</li>); nodes.push(numbered ? <ol key={i} className="my-3 list-decimal space-y-2 ps-6">{list}</ol> : <ul key={i} className="my-3 list-disc space-y-2 ps-6">{list}</ul>); continue;
    }
    if (line.startsWith("**Answer:")) {
      const answer = [line]; while (i + 1 < lines.length && !/^\*\*Q\d|^##/.test(lines[i + 1]!.trim())) answer.push(lines[++i]!);
      nodes.push(<details key={i} className="my-4 rounded-lg border border-border p-4"><summary className="min-h-8 cursor-pointer font-semibold">Show answer and explanation</summary><div className="mt-3 space-y-2">{answer.filter(Boolean).map((s,j)=><p key={j}>{inline(s)}</p>)}</div></details>); continue;
    }
    nodes.push(<p key={i} className={line.startsWith(">") ? "my-3 border-s-4 border-primary ps-4 text-muted-foreground" : "my-3 leading-7"}>{inline(line.replace(/^>\s?/, ""))}</p>);
  }
  return <div className="min-w-0 break-words" lang="en" dir="ltr">{nodes}</div>;
}
