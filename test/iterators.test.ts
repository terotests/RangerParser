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

// Token matching
const IF_THEN_ELSE = [T("if"), E, Bl, T("else"), Bl];
const MATCH_ARROW_FN = [E, T("="), T(">"), Bl];
const MATCH_CONST_DEF = [T("const"), T(), T("=")];
const CREATE_TABLE = [T("CREATE"), T("TABLE"), T()];
const CREATE_TABLE_IC = [T("CREATE", true), T("TABLE", true), T()];

const OBJ_LITERAL = [Bl];
const KEY_VALUE_1 = [T(), T(":"), A];
const KEY_VALUE_2 = [S(), T(":"), A];

const XML_TAG_OPEN = [T("<"), T()];
const XML_TAG_CLOSE = [T(">")];
const XML_CLOSE_TAG_OPEN = [T("<"), T("/"), T()];

const MATCH_PLUSPLUS = [T(), T("+"), T("+")];
const SEMICOLON = [T(";")];

const MATCH_FRAGMENT = [T("fragment"), Bl];
const MATCH_ANY_FRAGMENT = [T(), Bl];

// const iter = new CodeNodeIterator(p.rootNode.children);
describe("Test node iterators", () => {
  test("Token with numbers", () => {
    expect(
      iterator(`a12345`).m([T()], ([t]) => {
        expect(t.token()).to.equal("a12345");
      })
    ).to.be.true;
  });
  test("Separation of ajacent tokens and numbers", () => {
    expect(
      iterator(`a12345*55`).m([T(), T(), I], ([t, m, n]) => {
        expect(t.token()).to.equal("a12345");
        expect(m.token()).to.equal("*");
        expect(n.int()).to.equal(55);
      })
    ).to.be.true;
  });
  test("Double and adjacent token and int", () => {
    expect(
      iterator(`1.2344*55`).m([D, T(), I], ([t, m, n]) => {
        expect(t.double()).to.equal(1.2344);
        expect(m.token()).to.equal("*");
        expect(n.int()).to.equal(55);
      })
    ).to.be.true;
  });
  test("Double .4", () => {
    expect(
      iterator(`.4`).m([D], ([t]) => {
        expect(t.double()).to.equal(0.4);
      })
    ).to.be.true;
  });
  test("Double -.4", () => {
    expect(
      iterator(`-.4`).m([D], ([t]) => {
        expect(t.double()).to.equal(-0.4);
      })
    ).to.be.true;
  });

  test("Double with exponent", () => {
    expect(
      iterator(`1.23e-5`).m([D], ([t]) => {
        expect(t.double()).to.equal(1.23e-5);
      })
    ).to.be.true;
  });

  test("Double with exponent, second e is not matched into double", () => {
    expect(
      iterator(`1.23e-5e`).m([D, T()], ([t, t2]) => {
        expect(t.double()).to.equal(1.23e-5);
        expect(t2.token()).to.equal("e");
      })
    ).to.be.true;
  });
  test("Double with exponent, postfixed and prefixed with e", () => {
    expect(
      iterator(`e 1.23e-5e`).m([T(), D, T()], ([e, t, t2]) => {
        expect(t.double()).to.equal(1.23e-5);
        expect(t2.token()).to.equal("e");
        expect(e.token()).to.equal("e");
      })
    ).to.be.true;
  });

  test("if then else, test 1", () => {
    const iter = iterator(
      parse(`
if() {

} else {

}   
    `)
    );
    expect(
      iter.m(IF_THEN_ELSE, ([token, int]) => {
        // console.log("found if ... else statement");
      }),
      "Found IF, THEN, ELSE"
    ).to.be.true;
  });
  test("if then else, test 2", () => {
    const iter = iterator(
      parse(`
if() {

} 
else {

}   
    `)
    );
    expect(
      iter.m(IF_THEN_ELSE, ([token, int]) => {
        // console.log("found if ... else statement");
      }),
      "Found IF, THEN, ELSE"
    ).to.be.true;
  });
  test("if then else, test unique block after token", () => {
    const root = parse(`
    if() {
    
    } else 
    {
      thechild
    }   
        `);
    const ch1 = root.children[0];
    const ch2 = root.children[1];
    expect(ch1.isExpression, "to be .isExpression").to.be.true;
    expect(ch2.isBlock, "to be a block").to.be.true;
    expect(ch1.children.length, "four children").to.equal(4);
    expect(ch2.children.length, "one children").to.equal(1);
  });

  test("if then else, test 3", () => {
    const root = parse(`
    if() {
    
    } else 
    {
    
    }   
        `);
    const iter = iterator(root);
    expect(
      iter.m(IF_THEN_ELSE, ([token, int]) => {
        // console.log("found if ... else statement");
      }),
      "Found IF, THEN, ELSE"
    ).to.be.true;
  });
  test("if then else, test 4", () => {
    const root = parse(`
    if (

    )
    {
    
    } 
    else 
    {
    
    }   
        `);
    const iter = iterator(root);
    expect(
      iter.m(IF_THEN_ELSE, ([token, int]) => {
        // console.log("found if ... else statement");
      }),
      "Found IF, THEN, ELSE"
    ).to.be.true;
  });

  test("if then else, test 5", () => {
    const root = parse(`
    if
    (

    )
    {
    
    } 
    else 
    {
    
    }   
        `);
    const iter = iterator(root);
    expect(iter.m(IF_THEN_ELSE, ([token, int]) => {}), "Found IF, THEN, ELSE")
      .to.be.true;
  });

  test("Match dot . operator using foo.bar()", () => {
    expect(
      iterator(`foo.bar()`).m(
        [T("foo"), T("."), T("bar"), E],
        ([foo, dot, bar]) => {
          expect(foo.token()).to.equal("foo");
          expect(dot.token()).to.equal(".");
          expect(bar.token()).to.equal("bar");
        }
      )
    ).to.be.true;
  });
  test("multiline foo.bar()", () => {
    expect(
      iterator(`
      foo
      .bar()`).m([T("foo"), T("."), T("bar"), E], ([foo, dot, bar]) => {
        expect(foo.token()).to.equal("foo");
        expect(dot.token()).to.equal(".");
        expect(bar.token()).to.equal("bar");
      })
    ).to.be.true;
  });

  test("Match arrow function", () => {
    const root = parse(`
    ()
    =>
    {}  
        `);
    const iter = iterator(root);
    expect(iter.m(MATCH_ARROW_FN, ([token, int]) => {})).to.be.true;
  });
  test("Match arrow function 2", () => {
    const root = parse(`
    () => {}  
        `);
    const iter = iterator(root);
    expect(iter.m(MATCH_ARROW_FN, ([token, int]) => {})).to.be.true;
  });
  test("Match const def", () => {
    const root = parse(`
    const x = 10 
        `);
    const iter = iterator(root);
    expect(iter.m(MATCH_CONST_DEF, ([token, int]) => {})).to.be.true;
  });
  test("Match const def and arrow def", () => {
    const root = parse(`
    const x = () => {} 
    const xyz = () => {}  
    const foo 
     =
     () 
     => 
     {}
        `);
    const iter = iterator(root);
    // match the first const definition
    expect(
      iter.m(MATCH_CONST_DEF, ([iter, int]) => {
        const [, varname] = iter.peek(2);
        expect(varname.token).to.equal("x");
      })
    ).to.be.true;
    // match arrow fucntion definition
    expect(iter.m(MATCH_ARROW_FN, ([iter, int]) => {})).to.be.true;
    // match the second const def
    expect(
      iter.m(MATCH_CONST_DEF, ([iter, int]) => {
        const [, varname] = iter.peek(2);
        expect(varname.token).to.equal("xyz");
      })
    ).to.be.true;
    // match the second arrow function definition
    expect(iter.m(MATCH_ARROW_FN, ([iter, int]) => {})).to.be.true;
    // match the third const def
    expect(
      iter.m(MATCH_CONST_DEF, ([iter, int]) => {
        const [, varname] = iter.peek(2);
        expect(varname.token).to.equal("foo");
      })
    ).to.be.true;
    // match the second arrow function definition
    expect(iter.m(MATCH_ARROW_FN, ([iter, int]) => {})).to.be.true;
  });

  test("match create table", () => {
    const iter = iterator(
      parse(`
    CREATE TABLE users
    `)
    );
    expect(
      iter.m(CREATE_TABLE, ([iter, int]) => {
        const [, , varname] = iter.peek(3);
        expect(varname.token).to.equal("users");
      })
    ).to.be.true;
  });
  test("match create table, ignore case", () => {
    const iter = iterator(
      parse(`
    create table users
    `)
    );
    expect(
      iter.m(CREATE_TABLE_IC, ([iter, int]) => {
        const [, , varname] = iter.peek(3);
        expect(varname.token).to.equal("users");
      })
    ).to.be.true;
  });
  test("Optional, test matching optional", () => {
    const iter = iterator(
      parse(`
    create table if exists users
    `)
    );
    expect(
      iter.m(
        [
          T("create"),
          T("table"),
          Optional(T("if")),
          Optional(T("exists")),
          T()
        ],
        ([, , i, e, varname]) => {
          expect(i.token()).to.equal("if");
          expect(e.token()).to.equal("exists");
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.true;
  });
  test("Optional, test non matching optional", () => {
    expect(
      iterator(`create table users`).m(
        [
          T("create"),
          T("table"),
          Optional(T("if")),
          Optional(T("exists")),
          T()
        ],
        ([, , i, e, varname]) => {
          expect(i.token()).to.equal("");
          expect(e.token()).to.equal("");
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.true;
  });
  test("Sequence, two tokens", () => {
    expect(
      iterator(`create table`).m([Sequence(T("create"), T("table"))], ([t]) => {
        expect(t.token()).to.equal("create");
      })
    ).to.be.true;
  });
  test("Sequence, token and .isExpression", () => {
    expect(
      iterator(`create ()`).m([Sequence(T("create"), E)], ([t]) => {
        expect(t.token()).to.equal("create");
      })
    ).to.be.true;
  });
  test("Sequence, int, string, token, .isExpression", () => {
    expect(
      iterator(`3 "foo" * ()`).m([Sequence(I, S(), T(), E)], ([seq]) => {
        const [n, s, t] = seq.peek(3);
        expect(n.intValue).to.equal(3);
        expect(s.stringValue).to.equal("foo");
        expect(t.token).to.equal("*");
      })
    ).to.be.true;
  });
  test("Sequence, no match", () => {
    expect(
      iterator(`create tablez`).m(
        [Sequence(T("create"), T("table"))],
        ([t]) => {
          expect(t.token()).to.equal("create");
        }
      )
    ).to.be.false;
  });
  test("Optional Sequence", () => {
    expect(
      iterator(`create table if exists users`).m(
        [
          T("create"),
          T("table"),
          Optional(Sequence(T("if"), T("exists"))),
          T()
        ],
        ([, , ie, varname]) => {
          expect(ie.token()).to.equal("if");
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.true;
  });
  test("Optional Sequence, Case Insensitive", () => {
    expect(
      iterator(`CREATE TABLE IF EXISTS users`).m(
        [
          Ti("create"),
          Ti("table"),
          Optional(Sequence(Ti("if"), Ti("exists"))),
          T()
        ],
        ([, , ie, varname]) => {
          expect(ie.token()).to.equal("IF");
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.true;
  });
  test("Optional Sequence, no match", () => {
    expect(
      iterator(`create table users`).m(
        [
          T("create"),
          T("table"),
          Optional(Sequence(T("if"), T("exists"))),
          T()
        ],
        ([, , ie, varname]) => {
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.true;
  });
  test("OneOf, test matching last", () => {
    expect(
      iterator(`create index users`).m(
        [T("create"), OneOf(T("table"), T("index")), T()],
        ([, o, varname]) => {
          expect(o.token()).to.equal("index");
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.true;
  });
  test("OneOf, test matching first", () => {
    expect(
      iterator(`create table users`).m(
        [T("create"), OneOf(T("table"), T("index")), T()],
        ([, o, varname]) => {
          expect(o.token()).to.equal("table");
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.true;
  });
  test("OneOf, test matching string in the middle", () => {
    expect(
      iterator(`create "foobar" users`).m(
        [T("create"), OneOf(S("aa"), S("bb"), S("foobar")), T()],
        ([, o, varname]) => {
          expect(o.string()).to.equal("foobar");
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.true;
  });
  test("OneOf, test matching string in the middle (Failure)", () => {
    expect(
      iterator(`create "cc" users`).m(
        [T("create"), OneOf(S("aa"), S("bb"), S("foobar")), T()],
        ([, o, varname]) => {
          expect(o.string()).to.equal("foobar");
          expect(varname.token()).to.equal("users");
        }
      )
    ).to.be.false;
  });
  test("match create table with sub.isExpressions", () => {
    const iter = iterator(
      parse(`
    CREATE TABLE users (
      id bigint;
      name varchar;
    );
    CREATE TABLE orders (
      id bigint
      name varchar
    );
    `)
    );

    let tableCount = 0;
    const consumeSemiColon = (iter: CodeNodeIterator) => iter.m([T(";")]);
    const consumeTable = (iter: CodeNodeIterator) => {
      // optional matches ??
      iter.m([T("CREATE"), T("TABLE"), T(), E], ([, , name, it]) => {
        tableCount++;
        let fieldCount = 0;
        it.whileDidProceed(iter => {
          iter.m([T(), T("bigint")], ([name]) => {
            expect(name.toTokenString()).to.equal("id");
            fieldCount++;
          });
          iter.m([T(), T("varchar")], ([name]) => {
            expect(name.toTokenString()).to.equal(`name`);
            fieldCount++;
          });
          consumeSemiColon(iter);
        });
        expect(fieldCount).to.be.greaterThan(1);
      });
    };
    iter.whileDidProceed(iter => {
      consumeTable(iter);
      consumeSemiColon(iter);
    });
    expect(tableCount).to.equal(2);
  });
  test("match object literal", () => {
    const iter = iterator(
      parse(`
    { matti : 3,
      pekka : 5
    }`)
    );
    expect(
      iter.m(OBJ_LITERAL, ([iter, int]) => {
        expect(iter.m(KEY_VALUE_1)).to.be.true;
        iter.m([T(",")]);
        expect(iter.m(KEY_VALUE_1)).to.be.true;
        // expect(iter.m(KEY_VALUE_1)).to.be.true;
      }),
      "Matching object literal"
    ).to.be.true;
  });
  test("match object literal 2", () => {
    const iter = iterator(
      parse(`
    { matti : 3, pekka : 5
    }`)
    );
    expect(
      iter.m(OBJ_LITERAL, ([iter, int]) => {
        expect(iter.m(KEY_VALUE_1)).to.be.true;
        iter.m([T(",")]);
        expect(iter.m(KEY_VALUE_1)).to.be.true;
        // expect(iter.m(KEY_VALUE_1)).to.be.true;
      }),
      "Matching object literal"
    ).to.be.true;
  });

  // block node starting with string does not work atm
  test("match object literal 3", () => {
    const iter = iterator(
      parse(`
    {
      "x" : 3,
      y : 4
    }`)
    );
    expect(
      iter.m(OBJ_LITERAL, ([iter, int]) => {
        // first node as string is not parsed properly
        const first = iter.peek(3);
        expect(iter.m(KEY_VALUE_2)).to.be.true;
        iter.m([T(",")]);
        expect(iter.m(KEY_VALUE_1)).to.be.true;
      }),
      "Matching object literal"
    ).to.be.true;
  });

  test("match xml tag start", () => {
    const iter = iterator(
      parse(`
    <div></div>`)
    );
    expect(
      iter.m(XML_TAG_OPEN, ([iter, int]) => {
        // first node as string is not parsed properly
        const [, tag] = iter.peek(2);
        expect(tag.token).to.equal("div");
      })
    ).to.be.true;
    expect(iter.m(XML_TAG_CLOSE, ([iter, int]) => {})).to.be.true;
    expect(iter.m(XML_CLOSE_TAG_OPEN, ([iter, int]) => {})).to.be.true;
  });
  test("match xml close tag", () => {
    const iter = iterator(
      parse(`
    </div>`)
    );
    expect(
      iter.m(XML_CLOSE_TAG_OPEN, ([iter, int]) => {
        // first node as string is not parsed properly
        const [, , tag] = iter.peek(3);
        expect(tag.token).to.equal("div");
      })
    ).to.be.true;
    expect(iter.m(XML_TAG_CLOSE, ([iter, int]) => {})).to.be.true;
  });
  test("test matching i++", () => {
    const iter = iterator(parse(`i++`));
    expect(
      iter.m(MATCH_PLUSPLUS, ([iter, int]) => {
        // first node as string is not parsed properly
        const [varname, ,] = iter.peek(3);
        expect(varname.token).to.equal("i");
      })
    ).to.be.true;
  });
  test("test matching ;", () => {
    const iter = iterator(parse(`;`));
    expect(iter.m(SEMICOLON, ([iter, int]) => {})).to.be.true;
  });
  test("Parse an integer", () => {
    const iter = iterator(parse(`333`));
    expect(
      iter.m([I], ([iter, int]) => {
        const [n] = iter.peek(1);
        expect(n.intValue).to.equal(333);
      })
    ).to.be.true;
  });
  test("Parse a double", () => {
    expect(
      iterator("4.55").m([D], ([d]) => {
        expect(d.double()).to.equal(4.55);
      })
    ).to.be.true;
  });
  test("Parse a string, single quotes", () => {
    const iter = iterator(parse(`'hello'`));
    expect(
      iter.m([S()], ([iter, int]) => {
        const [n] = iter.peek(1);
        expect(n.stringValue).to.equal("hello");
      })
    ).to.be.true;
  });
  test("Parse a string, double quotes", () => {
    const iter = iterator(parse(`"hello"`));
    expect(
      iter.m([S()], ([iter, int]) => {
        const [n] = iter.peek(1);
        expect(n.stringValue).to.equal("hello");
      })
    ).to.be.true;
  });
  test("Parse a string, using `", () => {
    const iter = iterator(parse("`hello`"));
    expect(
      iter.m([S()], ([iter, int]) => {
        const [n] = iter.peek(1);
        expect(n.stringValue).to.equal("hello");
      })
    ).to.be.true;
  });
  test("Escaped string values`", () => {
    const iter = iterator(parse(`"\t"`));
    expect(
      iter.m([S()], ([iter, int]) => {
        const [n] = iter.peek(1);
        expect(n.stringValue).to.equal("\t");
      })
    ).to.be.true;
  });
  test("test matching aa,bb,cc", () => {
    const iter = iterator(parse(`aa,bb,cc`));
    expect(
      iter.m([T("aa"), T(","), T("bb"), T(","), T("cc")], ([iter, int]) => {})
    ).to.be.true;
  });

  test("test matching aa,bb,cc in separate lines", () => {
    const iter = iterator(
      parse(`
    aa  ,  
    bb ,   
    cc`)
    );
    expect(
      iter.m([T("aa"), T(","), T("bb"), T(","), T("cc")], ([iter, int]) => {})
    ).to.be.true;
  });
  test("test matching a specific fragment block", () => {
    const iter = iterator(
      parse(`
fragment {
  something
}    
    `)
    );
    let value = "";
    expect(
      iter.m(MATCH_FRAGMENT, ([f, it]) => {
        expect(
          it.m([T("something")], ([it]) => {
            value = it.toTokenString();
          })
        ).to.be.true;
      })
    ).to.be.true;
    expect(value).to.equal("something");
  });
  test("test matching any kind of fragment block", () => {
    const iter = iterator(
      parse(`
do {
  something
}    
    `)
    );
    let value = "";
    expect(
      iter.m(MATCH_ANY_FRAGMENT, ([iter, int]) => {
        const [t, frag] = iter.peek(2);
        const it = iterator(frag);
        expect(t.token).to.equal("do");
        expect(
          it.m([T("something")], ([it]) => {
            value = it.toTokenString();
          })
        ).to.be.true;
      })
    ).to.be.true;
    expect(value).to.equal("something");
  });

  test("test iterateUntil", () => {
    const iter = iterator(`a b c d 10.5 f g`);
    iter.iterateUntil(iter => {
      return iter.test([T()]);
    });
    const [n] = iter.peek(1);
    expect(n.doubleValue).to.equal(10.5);
  });
  test("test firstToString", () => {
    const iter = iterator(`aa bb cc`);
    expect(iter.firstToString()).to.equal("aa");
  });

  test("A bit more complex SQL parsing", () => {
    const iter = iterator(`
SELECT AVG(u.age), min(u.age) u.id, p.id, * from 
  projects.user u,
  projects.product p
WHERE
  u.name like '%glen%'
AND
  p.id = 120
AND
  p.completed = true`);

    const ASTERISK = [T("*")];

    // create a custom matcher...
    const matchNotFROM: MatchFnSignature = iter => {
      if (!iter.m([Ti("from")])) {
        return [iter, 1];
      }
      return EMPTY_ARRAY;
    };
    const matchAggregateFn: MatchFnSignature = iter => {
      const it = iter.clone();
      if (it.m([Ti("AVG"), E])) {
        return [iter, 2];
      }
      return EMPTY_ARRAY;
    };
    let aggrCnt = 0;
    iter.whileDidProceed(iter => {
      const SEMICOLON = [T(";")];
      const PROPERTY_ACCESS = [T(), T("."), T()];
      const AGGREGATES = Ti(["AVG", "MIN", "MAX"]);
      if (iter.match([T(["SELECT"])])) {
        iter.whileDidProceed(i => {
          i.m([AGGREGATES, E], ([fn, e]) => {
            // TODO: iterate e
            aggrCnt++;
          });
          i.m([matchNotFROM], ([i]) => {
            // matches as long as FROM is not encountered
          });
        });
      }
    });
    expect(aggrCnt).to.equal(2);
  });
});
