const STEPS = [
  ["Router", "Decides whether the question is a lookup or needs reasoning across pages, and sizes retrieval to match."],
  ["Retriever", "Searches page images with late-interaction MaxSim, so tables, charts and layout survive instead of being flattened into text."],
  ["Extractor", "Reads the retrieved pages and writes down atomic claims, each tied to the region of the page it came from."],
  ["Verifier", "Checks every claim against its own cited region. When confidence is low the graph goes back and retrieves more."],
  ["Synthesizer", "Writes the answer from verified claims only — or abstains when nothing holds up."],
];

export default function Method() {
  return (
    <section className="method">
      <h2>How an answer gets made</h2>
      <p>
        Retrieval runs over the rendered page rather than a text dump of it, and five agents pass the
        result along a graph that can loop back on itself. Every stage is inspectable, and the last
        one is allowed to say nothing.
      </p>
      <div className="steps">
        {STEPS.map(([t, d], i) => (
          <div className="step" key={t}>
            <div className="sh">
              <span className="sn">{i + 1}</span>
              <b>{t}</b>
            </div>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
