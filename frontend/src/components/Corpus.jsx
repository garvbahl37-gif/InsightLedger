// What is currently indexed, as a table — the same shape an analyst keeps their
// own source list in. Replaces a bar chart that said less in more space.
export default function Corpus({ filings, onScope }) {
  if (!filings.length) return null;
  const pages = filings.reduce((s, f) => s + f.pages, 0);
  return (
    <div style={{ marginTop: 52 }}>
      <div className="leaf-head">
        <h2>In the corpus</h2>
        <span className="meta num">{filings.length} filings · {pages} pages</span>
      </div>
      <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 70 }}>Ticker</th>
            <th>Company</th>
            <th style={{ width: 70 }}>Form</th>
            <th style={{ width: 100 }}>Filed</th>
            <th className="r" style={{ width: 70 }}>Pages</th>
            <th className="r" style={{ width: 92 }} />
          </tr>
        </thead>
        <tbody>
          {filings.map((f) => (
            <tr key={f.doc_id}>
              <td className="tk">{f.doc_id.split("-")[0]}</td>
              <td className="co">{f.company || f.title}</td>
              <td>{f.doc_type}</td>
              <td className="num">{f.date}</td>
              <td className="r num">{f.pages}</td>
              <td className="r">
                <button className="ask-link" onClick={() => onScope(f.doc_id)}>Only this</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
