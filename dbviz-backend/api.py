from flask import Flask, request, jsonify
from flask_cors import CORS

from parser.parser import parse_sql
from planner.planner import build_logical_plan
from planner.optimizer import (
    build_physical_plan,
    estimate_scan_costs,
    INDEX_DATA
)
from planner.explain import explain
from parser.ast import Condition, BinaryCondition

# ✅ app MUST be defined before routes
app = Flask(__name__)
CORS(app)


def extract_index_condition(condition):
    if isinstance(condition, Condition):
        return condition

    if isinstance(condition, BinaryCondition):
        return (
            extract_index_condition(condition.left)
            or extract_index_condition(condition.right)
        )

    return None


@app.route("/explain", methods=["POST"])
def explain_query():
    data = request.json
    sql = data.get("sql")

    ast = parse_sql(sql)
    logical = build_logical_plan(ast)
    physical = build_physical_plan(logical)

    idx_cond = extract_index_condition(ast.where) if ast.where else None
    costs = estimate_scan_costs(ast.table.name, idx_cond)

    index_key = f"{ast.table.name}.AGE"

    return jsonify({
        "plan": explain(physical),
        "costs": costs,
        "indexData": {
            index_key: INDEX_DATA.get(index_key, [])
        }
    })


if __name__ == "__main__":
    app.run(debug=True)
