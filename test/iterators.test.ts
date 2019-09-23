import { HelloWorld } from "../src/index";
import { expect } from "chai";

import { parse } from "../src/RangerParser";
import { T, S, I, E, B, Bl, A, iterator } from "../src/NodeIterator";

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

// const iter = new CodeNodeIterator(p.rootNode.children);
describe("Test node iterators", () => {
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
    expect(ch1.expression, "to be expression").to.be.true;
    expect(ch2.is_block_node, "to be a block").to.be.true;

    expect(ch1.children.length, "four children").to.equal(4);
    expect(ch2.children.length, "one children").to.equal(1);

    // The problem seems to be there that the sequence is
    // expression -> if () {} else
    // block -> {}
    // and not expression -> {}
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
        expect(varname.vref).to.equal("x");
      })
    ).to.be.true;
    // match arrow fucntion definition
    expect(iter.m(MATCH_ARROW_FN, ([iter, int]) => {})).to.be.true;
    // match the second const def
    expect(
      iter.m(MATCH_CONST_DEF, ([iter, int]) => {
        const [, varname] = iter.peek(2);
        expect(varname.vref).to.equal("xyz");
      })
    ).to.be.true;
    // match the second arrow function definition
    expect(iter.m(MATCH_ARROW_FN, ([iter, int]) => {})).to.be.true;
    // match the third const def
    expect(
      iter.m(MATCH_CONST_DEF, ([iter, int]) => {
        const [, varname] = iter.peek(2);
        expect(varname.vref).to.equal("foo");
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
        expect(varname.vref).to.equal("users");
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
        expect(varname.vref).to.equal("users");
      })
    ).to.be.true;
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
        expect(tag.vref).to.equal("div");
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
        expect(tag.vref).to.equal("div");
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
        expect(varname.vref).to.equal("i");
      })
    ).to.be.true;
  });
  test("test matching ;", () => {
    const iter = iterator(parse(`;`));
    expect(iter.m(SEMICOLON, ([iter, int]) => {})).to.be.true;
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
});
