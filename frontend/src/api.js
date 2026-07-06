async function j(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) {
    let m = r.statusText;
    try { m = (await r.json()).detail || m; } catch (e) {}
    throw new Error(m);
  }
  return r.json();
}
const post = (url, body) =>
  j(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  health: () => j("/health"),
  documents: () => j("/documents"),
  document: (id) => j("/documents/" + id),
  tickers: (q) => j("/tickers?q=" + encodeURIComponent(q) + "&limit=10"),
  company: (ticker, forms = "", limit = 40) =>
    j(`/company?ticker=${encodeURIComponent(ticker)}&forms=${encodeURIComponent(forms)}&limit=${limit}`),
  query: (question, doc_ids) => post("/query", { question, doc_ids }),
  ingest: (ticker) => post("/ingest", { ticker, form: "10-K" }),
  ingestFiling: (payload) => post("/ingest", payload),
};
