from dataclasses import dataclass
from typing import List, Optional, Union

@dataclass
class LogicalPlan:
    pass


@dataclass
class SeqScan(LogicalPlan):
    table: str


@dataclass
class Filter(LogicalPlan):
    condition: object
    child: LogicalPlan


@dataclass
class Projection(LogicalPlan):
    columns: List[str]
    child: LogicalPlan
