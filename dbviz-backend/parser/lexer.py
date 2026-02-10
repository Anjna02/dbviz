# parser/lexer.py

import re
from dataclasses import dataclass

@dataclass
class Token:
    type: str
    value: str

TOKEN_SPEC = [
    ("SELECT",   r"SELECT\b"),
    ("FROM",     r"FROM\b"),
    ("WHERE",    r"WHERE\b"),
    ("AND",      r"AND\b"),
    ("OR",       r"OR\b"),
    ("OP",       r"=|>|<"),
    ("COMMA",    r","),
    ("NUMBER",   r"\d+"),
    ("STRING",   r"'[^']*'"),
    ("IDENT",    r"[a-zA-Z_][a-zA-Z0-9_]*"),
    ("SKIP",     r"[ \t\n]+"),
]

TOKEN_REGEX = "|".join(f"(?P<{name}>{pattern})" for name, pattern in TOKEN_SPEC)

def tokenize(sql: str):
    tokens = []
    for match in re.finditer(TOKEN_REGEX, sql.upper()):
        kind = match.lastgroup
        value = match.group()
        if kind == "SKIP":
            continue
        tokens.append(Token(kind, value))
    return tokens
