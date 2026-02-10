import { useState } from "react";
import "./PlanNode.css";

function PlanNode({ node, maxCost }) {
  const [open, setOpen] = useState(true);

  const intensity = node.cost / maxCost;

  let color = "#2ecc71"; // green
  if (intensity > 0.7) color = "#e74c3c"; // red
  else if (intensity > 0.4) color = "#f1c40f"; // yellow

  return (
    <div className="plan-node">
      <div
        className="plan-header"
        style={{ borderLeft: `6px solid ${color}` }}
        onClick={() => setOpen(!open)}
      >
        <strong>{node.node}</strong>
        <span className="meta">
          cost: {node.cost} | rows: {node.rows}
        </span>
      </div>

      {node.condition && (
        <div className="condition">🔍 {node.condition}</div>
      )}

      {node.index && (
        <div className="index">📌 index: {node.index}</div>
      )}

      {open && node.children && (
        <div className="children">
          {node.children.map((child, i) => (
            <PlanNode key={i} node={child} maxCost={maxCost} />
          ))}
        </div>
      )}
    </div>
  );
}

export default PlanNode;
