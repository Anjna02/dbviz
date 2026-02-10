function CostGraph({ costs }) {
  const max = Math.max(...Object.values(costs).filter(Boolean));

  return (
    <div style={{ marginTop: 20 }}>
      <h4 style={{ color: "#fff" }}>Cost Comparison</h4>

      {Object.entries(costs).map(([name, cost]) => {
        if (cost === null) return null;

        const width = (cost / max) * 100;

        return (
          <div key={name} style={{ marginBottom: 8 }}>
            <div style={{ color: "#ccc", fontFamily: "monospace" }}>
              {name}: {cost}
            </div>
            <div
              style={{
                height: 12,
                width: `${width}%`,
                background: name === "IndexScan" ? "#2ecc71" : "#e74c3c",
                borderRadius: 4
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default CostGraph;
