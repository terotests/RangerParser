import {
  parse,
  T,
  S,
  I,
  E,
  Bl,
  A,
  iterator,
  D,
  CodeNodeIterator,
  Optional,
  OneOf,
  Sequence,
  Ti,
  EMPTY_ARRAY,
  EMPTY_ITERATOR,
  MatchFnSignature,
  TestOneOf
} from "../../NodeIterator";

interface TABLEStatement {
  tag: "TABLE";
  schema?: string;
  name?: string;
  subquery?: SELECTStatement;
  alias?: Alias;
}

interface Alias {
  tag: "ALIAS";
  name: CodeNodeIterator;
}

interface FROMStatement {
  tag: "FROM";
  sources: TABLEStatement[];
}

interface ColumnExpression {
  tag: "COL";
  schema?: CodeNodeIterator;
  table?: CodeNodeIterator;
  column?: CodeNodeIterator;
  alias?: Alias;
}

interface Aggregate {
  tag: "AGGREGATE";
  aggregate?: CodeNodeIterator;
  params?: CodeNodeIterator;
  alias?: Alias;
}

interface SELECTStatement {
  tag: "SELECT";
  from?: FROMStatement;
  columns?: (ColumnExpression | Aggregate)[];
}

const AGGREGATES = Ti(["AVG", "MIN", "MAX", "count"]);
const SEMICOLON = [T(";")];
const COMMA = [T(",")];
const KEYWORDS = [Ti(["SELECT", "FROM", "WHERE", "ORDER"])];

const iff = <T>(a: T | undefined, b: (param: T) => void) => {
  if (typeof a !== "undefined") {
    b(a);
    return true;
  }
  return false;
};

export const EndOfExpr = [
  TestOneOf(T(","), T(";"), Ti(["SELECT", "FROM", "WHERE", "ORDER"]))
];

export const MatchAlias = (iter: CodeNodeIterator) => {
  return iter.case<Alias>([
    [EndOfExpr, () => undefined],
    [
      [T("as"), T()],
      ([, name]) => ({
        tag: "ALIAS",
        name
      })
    ],
    [
      [T()],
      ([name]) => ({
        tag: "ALIAS",
        name
      })
    ]
  ]);
};

export const MatchColumnAccess = (
  iter: CodeNodeIterator
): ColumnExpression | undefined => {
  return iter.case<ColumnExpression>([
    [EndOfExpr, () => undefined],
    [
      // <schema>.<table>.<column>
      [T(), T("."), T(), T("."), T()],
      ([schema, , table, , column], iter) => ({
        tag: "COL",
        schema,
        table,
        column,
        alias: MatchAlias(iter)
      })
    ],
    [
      // <table>.<column>
      [T(), T("."), T()],
      ([table, , column], iter) => ({
        tag: "COL",
        table,
        column,
        alias: MatchAlias(iter)
      })
    ],
    [
      // <column>
      [T()],
      ([column], iter) => ({
        tag: "COL",
        column,
        alias: MatchAlias(iter)
      })
    ]
  ]);
};

const MatchTableAlias = (iter: CodeNodeIterator): Alias | undefined => {
  return iter.case<Alias>([
    [EndOfExpr, () => undefined],
    [
      [T()],
      ([name]) => ({
        tag: "ALIAS",
        name
      })
    ]
  ]);
};

export const MatchTableDef = (
  iter: CodeNodeIterator
): TABLEStatement | undefined => {
  // if (IsEndOfExpr(iter)) return;
  return iter.case([
    [EndOfExpr, () => undefined],
    [
      // TODO: how to match end of expression here in the case statements
      [E, T()], // <SELECT> <ALIAS>
      ([e, t]) => ({
        tag: "TABLE",
        alias: t.token(),
        subquery: MatchSELECT(e)
      })
    ],
    [
      [T(), T("."), T()], // <schema.tablename>
      ([s, , full], iter) => ({
        tag: "TABLE",
        name: full.token(), // <-- problem information lost here!!!
        schema: s.token(),
        alias: MatchTableAlias(iter)
      })
    ],
    [
      [T()], // <TABLENAME>
      ([full]) => ({
        tag: "TABLE",
        name: full.token(),
        alias: MatchTableAlias(iter)
      })
    ]
  ]);
};

export const MatchAggregate = (iter: CodeNodeIterator): Aggregate => {
  return iter.case<Aggregate>([
    [EndOfExpr, () => undefined],
    [
      [AGGREGATES, E],
      ([aggregate, params], iter): Aggregate => ({
        tag: "AGGREGATE",
        aggregate,
        params,
        alias: MatchAlias(iter)
      })
    ]
  ]);
};

export const MatchSELECT = (iter): SELECTStatement => {
  return iter.case([
    [[Ti(["SELECT"])]],
    () => {
      const statement: SELECTStatement = {
        tag: "SELECT",
        columns: []
      };
      iter.whileDidProceed(i => {
        if (i.test(KEYWORDS)) return;
        i.m(COMMA);
        if (iff(MatchAggregate(i), c => statement.columns.push(c))) {
          return;
        }
        if (iff(MatchColumnAccess(i), c => statement.columns.push(c))) {
          return;
        }
      });
      // FROM
      if (iter.m([Ti("FROM")])) {
        const from: FROMStatement = {
          tag: "FROM",
          sources: []
        };
        iter.whileDidProceed(iter => {
          if (iter.test(KEYWORDS)) {
            return;
          }
          iter.m(COMMA);
          iff(MatchTableDef(iter), def => {
            from.sources.push(def);
          });
        });
        statement.from = from;
      }
      iter.iterateUntil(iter => !iter.m(SEMICOLON));
      return statement;
    }
  ]);
};
