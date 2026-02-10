import planner.logical_plan as L
import planner.physical_plan as P
from parser.ast import Condition, BinaryCondition

# Fake statistics (later: from catalog)
TABLE_STATS = {
    "USERS": {
        "rows": 10000,
        "pages": 1000
    }
}

INDEX_STATS = {
    "USERS.AGE": {
        "height": 3,
        "selectivity": 0.1
    }
}

SEQ_PAGE_COST = 1.0
RANDOM_PAGE_COST = 4.0


def estimate_seq_scan(table):
    stats = TABLE_STATS[table]
    cost = stats["pages"] * SEQ_PAGE_COST
    return cost, stats["rows"]


def estimate_index_scan(table, condition):
    key = f"{table}.{condition.left}"
    idx = INDEX_STATS.get(key)
    if not idx:
        return None

    rows = int(TABLE_STATS[table]["rows"] * idx["selectivity"])
    cost = idx["height"] * RANDOM_PAGE_COST
    return cost, rows


def extract_index_condition(condition):
    if isinstance(condition, Condition):
        return condition

    if isinstance(condition, BinaryCondition):
        left = extract_index_condition(condition.left)
        if left:
            return left
        return extract_index_condition(condition.right)

    return None


def build_physical_plan(logical: L.LogicalPlan) -> P.PhysicalPlan:

    # 1️⃣ Projection
    if isinstance(logical, L.Projection):
        child = build_physical_plan(logical.child)
        return P.Projection(
            cost=child.cost,
            rows=child.rows,
            columns=logical.columns,
            child=child
        )

    # 2️⃣ Filter
    if isinstance(logical, L.Filter):
        child = build_physical_plan(logical.child)
        return P.Filter(
            cost=child.cost + 1,
            rows=int(child.rows * 0.3),
            condition=logical.condition,
            child=child
        )

    # 3️⃣ Scan decision point (🔥 IMPORTANT)
    if isinstance(logical, L.SeqScan):
        seq_cost, seq_rows = estimate_seq_scan(logical.table)

        index_condition = None
        if hasattr(logical, "parent_filter"):
            index_condition = extract_index_condition(logical.parent_filter)

        if index_condition:
            idx = estimate_index_scan(logical.table, index_condition)
            if idx:
                idx_cost, idx_rows = idx
                if idx_cost < seq_cost:
                    return P.IndexScan(
                        cost=idx_cost,
                        rows=idx_rows,
                        table=logical.table,
                        index=f"{logical.table}.{index_condition.left}",
                        condition=index_condition
                    )

        return P.SeqScan(
            cost=seq_cost,
            rows=seq_rows,
            table=logical.table
        )

    raise Exception("Unknown logical plan")

def estimate_scan_costs(table, index_condition=None):
    seq_cost, _ = estimate_seq_scan(table)

    idx_cost = None
    if index_condition:
        idx = estimate_index_scan(table, index_condition)
        if idx:
            idx_cost, _ = idx

    return {
        "SeqScan": seq_cost,
        "IndexScan": idx_cost
    }


INDEX_DATA = {
    "USERS.AGE": [10, 15, 20, 22, 30, 35, 40]
}
