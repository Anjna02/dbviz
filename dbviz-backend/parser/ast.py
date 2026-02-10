# parser/ast.py

from dataclasses import dataclass
from typing import List, Union

@dataclass
class Column:
    name: str

@dataclass
class Table:
    name: str

@dataclass
class Condition:
    left: str
    operator: str
    right: Union[str, int]

@dataclass
class BinaryCondition:
    left: Union['Condition', 'BinaryCondition']
    operator: str  # AND / OR
    right: Union['Condition', 'BinaryCondition']

@dataclass
class SelectQuery:
    columns: List[Column]
    table: Table
    where: Union[Condition, BinaryCondition, None]
