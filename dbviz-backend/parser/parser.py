# parser/parser.py

from parser.ast import *
from parser.lexer import tokenize

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos = 0

    def current(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def eat(self, token_type):
        token = self.current()
        if token and token.type == token_type:
            self.pos += 1
            return token
        raise SyntaxError(f"Expected {token_type}, got {token}")

    def parse(self):
        self.eat("SELECT")
        columns = self.parse_columns()
        self.eat("FROM")
        table = Table(self.eat("IDENT").value)
        where = None
        if self.current() and self.current().type == "WHERE":
            self.eat("WHERE")
            where = self.parse_condition()
        return SelectQuery(columns, table, where)

    def parse_columns(self):
        cols = []
        while True:
            cols.append(Column(self.eat("IDENT").value))
            if self.current() and self.current().type == "COMMA":
                self.eat("COMMA")
            else:
                break
        return cols

    def parse_condition(self):
        left = self.parse_simple_condition()
        while self.current() and self.current().type in ("AND", "OR"):
            op = self.eat(self.current().type).type
            right = self.parse_simple_condition()
            left = BinaryCondition(left, op, right)
        return left

    def parse_simple_condition(self):
        col = self.eat("IDENT").value
        op = self.eat("OP").value
        val_token = self.current()
        if val_token.type == "NUMBER":
            value = int(self.eat("NUMBER").value)
        else:
            value = self.eat("STRING").value.strip("'")
        return Condition(col, op, value)


def parse_sql(sql: str):
    tokens = tokenize(sql)
    return Parser(tokens).parse()
