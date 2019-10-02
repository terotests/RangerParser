import { expect } from "chai";
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
} from "../src/NodeIterator";
import { stat } from "fs";

interface TABLEStatement {
  tag: "TABLE";
  schema?: string;
  name?: string;
  subquery?: SELECTStatement;
  alias?: AliasStatement;
}

interface AliasStatement {
  tag: "ALIAS";
  name: string;
}

interface FROMStatement {
  tag: "FROM";
  sources: TABLEStatement[];
}

interface ColumnExpression {
  tag: "COL";
  schema?: string;
  table?: string;
  name?: string;
  column?: string;
  alias?: string;
}

interface SELECTStatement {
  tag: "SELECT";
  from?: FROMStatement;
  columns?: ColumnExpression[];
}

// const iter = new CodeNodeIterator(p.rootNode.children);
describe("SQL parser test", () => {
  test("Tow Sample SQL statements", () => {
    // -- adding comments ?
    const iter = iterator(
      `
-- SQL comment test
select * from purchases, (
    select * from cat where name like 'jerry'
  ) jeba  ;
SELECT 
    AVG(u.age) as keskiarvo,  -- comment about average
    min(main.user.length) as pituus, 
    u.id,   -- user ID
    p.id,   -- product ID 
    * 
FROM 
  main.user u,
  main.product p,
  (select 
      id, 
      count( xddd ) as cnt, 
      max(ranges) 
    from   
      foo, 
      bar, 
      (select * from table2) zed
   ) fs
WHERE
    u.name like '%glen%'
  AND
    p.id = 120
  AND
    p.completed = true;
SELECT max(id) from karhu;  
  `,
      {
        lineCommentStart: "--"
      }
    );

    const ASTERISK = [T("*")];
    let aggrCnt = 0;

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
    const firstOf = (...fns: Array<(iter: CodeNodeIterator) => boolean>) => {
      for (const fn of fns) {
        if (fn(iter)) {
          return;
        }
      }
    };

    const IsEndOfExpr = (iter): boolean =>
      iter.test(KEYWORDS) || iter.test(COMMA) || iter.test(SEMICOLON);

    const EndOfExpr = [
      TestOneOf(T(","), T(";"), Ti(["SELECT", "FROM", "WHERE", "ORDER"]))
    ];

    const MatchAlias = (iter): any => {
      const asDef = {
        as: ""
      };
      if (
        iter.m([T("as"), T()], ([, as]) => {
          asDef.as = as.token();
        })
      ) {
        return asDef;
      }
      if (IsEndOfExpr(iter)) return;
      if (
        iter.m([T()], ([as]) => {
          asDef.as = as.token();
        })
      ) {
        return asDef;
      }
    };
    const MatchColumnAccess = (iter): ColumnExpression | undefined => {
      // in case some keyword, ; etc.
      // if (IsEndOfExpr(iter)) return;
      const tabledef: ColumnExpression = {
        tag: "COL"
      };
      return iter.case([
        [EndOfExpr, () => undefined],
        [
          // <schema>.<table>.<column>
          [T(), T("."), T(), T("."), T()],
          ([s, , t, , c], iter) => {
            tabledef.schema = s.token();
            tabledef.table = t.token();
            tabledef.column = c.token();
            tabledef.alias = MatchAlias(iter);
            // iff(MatchAlias(iter), a => (tabledef.alias = a));
            return tabledef;
          }
        ],
        [
          [T(), T("."), T()],
          ([t, , c], iter) => {
            tabledef.table = t.token();
            tabledef.column = c.token();
            tabledef.alias = MatchAlias(iter);
            return tabledef;
          }
        ],
        [
          [T()],
          ([c]) => {
            tabledef.column = c.token();
            return tabledef;
          }
        ]
      ]);
    };

    const MatchTableAlias = (iter): AliasStatement | undefined => {
      if (IsEndOfExpr(iter)) return;
      let alias;
      iter.m([T()], ([t]) => {
        alias = t.token();
      });
      return alias;
    };

    const MatchTableDef = (iter): TABLEStatement | undefined => {
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

    const MatchAggregate = (iter): any => {
      let res: any = undefined;
      if (
        iter.m([AGGREGATES, E], ([fn, e]) => {
          aggrCnt++;
          res = {
            type: "aggregate",
            name: fn.token(),
            column: MatchColumnAccess(e)
          };
        })
      ) {
        iff(MatchAlias(iter), a => (res.alias = a));
      }
      return res;
    };

    // will match a select statement
    const MatchSELECT = (iter): SELECTStatement => {
      if (iter.match([Ti(["SELECT"])])) {
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
        // matching where condition here...
        // if (iter.m([Ti("WHERE")])) {
        //   statement.where = {};
        // }
        iter.iterateUntil(iter => !iter.m(SEMICOLON));
        return statement;
      }
    };
    const statements = [];
    iter.whileDidProceed(iter => {
      iff(MatchSELECT(iter), sel => statements.push(sel));
    });
    console.log(statements);
    expect(aggrCnt).to.equal(5);
    expect(statements.length).to.equal(3);
    console.log(JSON.stringify(statements, null, 2));
  });
});
