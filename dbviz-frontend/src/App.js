import { useState, useRef } from "react";
import PlanNode from "./components/PlanNode";
import CostGraph from "./components/CostGraph";
import BPlusTree from "./components/BPlusTree";

/* ---------- helpers ---------- */

function extractIndexScan(plan) {
  if (!plan) return null;

  if (plan.node === "IndexScan") return plan;

  if (plan.children) {
    for (const child of plan.children) {
      const found = extractIndexScan(child);
      if (found) return found;
    }
  }
  return null;
}

function extractFilterCondition(plan) {
  if (!plan) return null;

  if (plan.node === "Filter" && plan.condition) {
    return plan.condition;
  }

  if (plan.children) {
    for (const child of plan.children) {
      const found = extractFilterCondition(child);
      if (found) return found;
    }
  }

  return null;
}

function parseIndexCondition(condition) {
  if (!condition) return null;

  const match = condition.match(/(\w+)\s*(=|>|<)\s*(\d+)/);
  if (!match) return null;

  return {
    column: match[1],
    operator: match[2],
    value: Number(match[3]),
  };
}

/* ---------- App ---------- */

function App() {
  const [sql, setSql] = useState(
    "SELECT name, age FROM users WHERE age > 30 AND city = 'DELHI'"
  );
  const [plan, setPlan] = useState(null);
  const [costs, setCosts] = useState(null);

  const treeRef = useRef(null);

  const runExplain = async () => {
    console.log("EXPLAIN clicked");

    const res = await fetch("http://localhost:5000/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
    });

    const data = await res.json();
    console.log("Backend response:", data);

    setPlan(data.plan);
    setCosts(data.costs);

    const indexKey = "USERS.AGE";

    /* ---------- BUILD B+ TREE ---------- */
    if (data.indexData && treeRef.current) {
      console.log("bulkLoad called with:", data.indexData[indexKey]);
      treeRef.current.bulkLoad(data.indexData[indexKey]);
    }

    /* ---------- DRIVE INDEX SCAN ANIMATION ---------- */
    setTimeout(() => {
      const indexScan = extractIndexScan(data.plan);
      const filterCondition = extractFilterCondition(data.plan);

      console.log("Filter condition:", filterCondition);

      const cond = parseIndexCondition(filterCondition);
      console.log("Parsed index condition:", cond);

      if (cond && treeRef.current) {
        const keys = data.indexData[indexKey];
        const maxKey = Math.max(...keys); // FIX: NO Infinity

        console.log(
          "Triggering indexRangeScan:",
          cond.value,
          "→",
          maxKey
        );

        if (cond.operator === ">") {
          treeRef.current.indexRangeScan(cond.value, maxKey);
        } else if (cond.operator === "<") {
          treeRef.current.indexRangeScan(
            Math.min(...keys),
            cond.value
          );
        } else if (cond.operator === "=") {
          treeRef.current.indexSearch(cond.value);
        }
      }
    }, 0);
  };

  const getMaxCost = (node) => {
    let max = node.cost || 0;
    if (node.children) {
      node.children.forEach((c) => {
        max = Math.max(max, getMaxCost(c));
      });
    }
    return max;
  };

  return (
    <div style={{ padding: 20, background: "#121212", minHeight: "100vh" }}>
      <h2 style={{ color: "#fff" }}>Database Query Visualizer</h2>

      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        rows={4}
        style={{ width: "100%", fontFamily: "monospace" }}
      />

      <br />
      <button onClick={runExplain} style={{ marginTop: 10 }}>
        EXPLAIN
      </button>

      {costs && <CostGraph costs={costs} />}

      {plan && (
        <div style={{ marginTop: 20 }}>
          <PlanNode node={plan} maxCost={getMaxCost(plan)} />
        </div>
      )}

      {/* 🔥 B+ Tree driven by optimizer */}
      <BPlusTree ref={treeRef} />
    </div>
  );
}

export default App;
