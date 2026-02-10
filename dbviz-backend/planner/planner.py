from planner.logical_plan import *
from parser.ast import SelectQuery

def build_logical_plan(ast: SelectQuery) -> LogicalPlan:
    scan = SeqScan(ast.table.name)

    if ast.where:
        scan.parent_filter = ast.where  # 👈 attach filter
        plan = Filter(ast.where, scan)
    else:
        plan = scan

    return Projection([col.name for col in ast.columns], plan)
