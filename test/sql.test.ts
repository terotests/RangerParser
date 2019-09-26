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
  MatchFnSignature
} from "../src/NodeIterator";

// const iter = new CodeNodeIterator(p.rootNode.children);
describe("SQL parser test", () => {
  test("Tow Sample SQL statements", () => {
    const iter = iterator(`
select * from purchases, (select * from cat where name like 'abba') jeba;
SELECT 
    AVG(u.age) as keskiarvo, 
    min(main.user.length) as pituus, 
    u.id, 
    p.id, 
    * 
FROM 
  main.user u,
  main.product p,
  (select id, count( xddd ), max(ranges) from foo, bar) f
WHERE
    u.name like '%glen%'
  AND
    p.id = 120
  AND
    p.completed = true;
SELECT max(id) from karhu;  
  `);

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
    const MatchColumnAccess = (iter): any => {
      // in case some keyword, ; etc.
      if (IsEndOfExpr(iter)) return;
      const tabledef = {
        name: "column",
        schema: "",
        table: "",
        column: "",
        alias: undefined
      };
      // <schema>.<table>.<column>
      if (
        iter.match([T(), T("."), T(), T("."), T()], ([s, , t, , c]) => {
          tabledef.schema = s.token();
          tabledef.table = t.token();
          tabledef.column = c.token();
        })
      ) {
        tabledef.alias = MatchAlias(iter);
        return tabledef;
      }
      // <table>.<column>
      if (
        iter.match([T(), T("."), T()], ([t, , c]) => {
          tabledef.table = t.token();
          tabledef.column = c.token();
        })
      ) {
        tabledef.alias = MatchAlias(iter);
        return tabledef;
      }
      // <column>
      if (
        iter.match([T()], ([c]) => {
          tabledef.column = c.token();
        })
      ) {
        tabledef.alias = MatchAlias(iter);
        return tabledef;
      }
    };

    const MatchTableAlias = (iter): any => {
      if (IsEndOfExpr(iter)) return;
      let alias;
      iter.m([T()], ([t]) => {
        alias = t.token();
      });
      return alias;
    };

    const MatchTableDef = (iter): any => {
      if (IsEndOfExpr(iter)) return;
      const tabledef = {
        name: "tabledef",
        schema: "",
        full: "",
        alias: "",
        subquery: undefined
      };
      // <table>.<column> <alias>
      // subquery start
      if (
        iter.m([E, T()], ([e, t]) => {
          iff(MatchSELECT(e), sel => (tabledef.subquery = sel));
          tabledef.alias = t.token();
        })
      ) {
        return tabledef;
      }

      if (
        iter.match([T(), T("."), T()], ([s, , full]) => {
          tabledef.full = full.token();
          tabledef.schema = s.token();
        })
      ) {
        tabledef.alias = MatchTableAlias(iter);
        return tabledef;
      }
      // <column>
      if (
        iter.match([T()], ([full]) => {
          tabledef.full = full.token();
        })
      ) {
        tabledef.alias = MatchTableAlias(iter);
        return tabledef;
      }
      return undefined;
    };

    const MatchAggregate = (iter): any => {
      let res: any = undefined;
      if (
        iter.m([AGGREGATES, E], ([fn, e]) => {
          // TODO: iterate e
          aggrCnt++;
          res = {
            type: "aggregate",
            name: fn.token(),
            column: MatchColumnAccess(e)
          };
        })
      ) {
        res.alias = MatchAlias(iter);
      }
      return res;
    };

    // will match a select statement
    const MatchSELECT = (iter): any => {
      if (iter.match([Ti(["SELECT"])])) {
        const statement = {
          name: "SELECT",
          columns: [],
          from: []
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
          iter.whileDidProceed(iter => {
            if (iter.test(KEYWORDS)) {
              return;
            }
            iter.m(COMMA);
            iff(MatchTableDef(iter), def => {
              statement.from.push(def);
            });
          });
        }
        iter.iterateUntil(iter => !iter.m(SEMICOLON));
        return statement;
      }
    };
    const statements = [];
    iter.whileDidProceed(iter => {
      iff(MatchSELECT(iter), sel => statements.push(sel));
    });
    expect(aggrCnt).to.equal(5);
    expect(statements.length).to.equal(3);
    console.log(JSON.stringify(statements, null, 2));
  });
});
