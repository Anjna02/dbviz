from parser.parser import parse_sql
from planner.planner import build_logical_plan
from planner.optimizer import build_physical_plan
from planner.explain import explain
import json

sql = """
SELECT name, age
FROM users
WHERE age > 30 AND city = 'DELHI'
"""

ast = parse_sql(sql)
logical = build_logical_plan(ast)
physical = build_physical_plan(logical)

print("\nEXPLAIN JSON:")
print(json.dumps(explain(physical), indent=2))
