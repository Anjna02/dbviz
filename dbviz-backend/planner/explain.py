import planner.physical_plan as P
from parser.ast import Condition, BinaryCondition


def condition_to_string(cond):
    if isinstance(cond, Condition):
        return f"{cond.left} {cond.operator} {cond.right}"
    if isinstance(cond, BinaryCondition):
        return f"({condition_to_string(cond.left)} {cond.operator} {condition_to_string(cond.right)})"
    return ""


def explain(plan: P.PhysicalPlan):
    if isinstance(plan, P.Projection):
        return {
            "node": "Projection",
            "columns": plan.columns,
            "cost": plan.cost,
            "rows": plan.rows,
            "children": [explain(plan.child)]
        }

    if isinstance(plan, P.Filter):
        return {
            "node": "Filter",
            "condition": condition_to_string(plan.condition),
            "cost": plan.cost,
            "rows": plan.rows,
            "children": [explain(plan.child)]
        }

    if isinstance(plan, P.IndexScan):
        return {
            "node": "IndexScan",
            "table": plan.table,
            "index": plan.index,
            "cost": plan.cost,
            "rows": plan.rows
        }

    if isinstance(plan, P.SeqScan):
        return {
            "node": "SeqScan",
            "table": plan.table,
            "cost": plan.cost,
            "rows": plan.rows
        }

    raise Exception("Unknown physical plan")
