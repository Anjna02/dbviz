from dataclasses import dataclass
from typing import List

@dataclass
class PhysicalPlan:
    cost: float
    rows: int


@dataclass
class SeqScan(PhysicalPlan):
    table: str


@dataclass
class IndexScan(PhysicalPlan):
    table: str
    index: str
    condition: object


@dataclass
class Filter(PhysicalPlan):
    condition: object
    child: PhysicalPlan


@dataclass
class Projection(PhysicalPlan):
    columns: List[str]
    child: PhysicalPlan
