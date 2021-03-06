import { expect } from "chai";
import { parse } from "../src/RangerParser";

describe("Testing parsing short expressions", () => {
  test("Empty string should be a block node", () => {
    const p = parse("");
    expect(p.isBlock).to.be.true;
  });
  test("Test empty expression", () => {
    const root = parse(`
(x y)    
    `);
    const firstRow = root.children[0];
    const firstChild = firstRow.children[0];
    expect(firstRow.isExpression).to.be.true;
    expect(firstChild.isExpression).to.be.true;
  });
  test("Test empty expression after a token", () => {
    const root = parse(`
token (x y)    
    `);
    const firstRow = root.children[0];
    const firstChild = firstRow.children[0];
    const secondChild = firstRow.children[1];
    expect(firstRow.isExpression).to.be.true;
    expect(firstChild.token).to.be.not.undefined;
    expect(secondChild.isExpression).to.be.true;
  });
  test("Test empty expression after a token inside expr", () => {
    const root = parse(`
SELECT xxx    
  (token (x y)) 
    `);
    const firstRow = root.children[1];
    const firstExpr = firstRow.children[0];
    const firstChild = firstExpr.children[0];
    const secondChild = firstExpr.children[1];
    expect(firstExpr.isExpression).to.be.true;
    expect(firstChild.token).to.be.not.undefined;
    expect(secondChild.isExpression).to.be.true;
  });
  test("Testing block node parsing", () => {
    const root = parse(`{
      a
      b
    }
    second block {

    }
    `);
    expect(root.isBlock, "root should be a block node").to.be.true;

    // first child of the root block should be a block
    const p = root.children[0];
    expect(p.children.length, "Should have two children").to.equal(2);

    // second child of the root block should be a block
    const second = root.children[1];
    expect(second.children.length, "Should have three children").to.equal(3);
  });

  test("Individual lines are separate children", () => {
    const root = parse(`
    a
    b
    c
    d
    `);
    expect(root.children.length, "Should have four children").to.equal(4);
  });

  test("Test simple expression", () => {
    const root = parse(`
    (a + (b))
    `);
    const first = root.children[0];
    expect(first.children.length, "Should have one child").to.equal(1);
    const firstExpr = first.children[0];
    expect(
      firstExpr.children.length,
      "Should have three subexpressions"
    ).to.equal(3);
    const lastChild = firstExpr.children[2];
    expect(lastChild.isExpression).to.be.true;
  });
  test("Test simple expression 2", () => {
    const root = parse(`
    a + b
    `);
    const first = root.children[0];
    expect(first.children.length, "Should have three children").to.equal(3);
  });

  // TODO: fix this
  test("Test simple expression 3", () => {
    const root = parse(`a + b`);
    const first = root.children[0];
    expect(first.children.length, "Should have three children").to.equal(3);
  });

  // TODO: fix this
  test("Test simple expression 4", () => {
    const root = parse(`a aab
    `);
    const first = root.children[0];
    expect(first.children.length, "Should have three children").to.equal(2);
  });

  test("Individual block nodes are separate", () => {
    const root = parse(`
    {}
    {}
    {}
    {}
    `);
    expect(root.children.length, "Should have four children").to.equal(4);
  });
  test("Adjacent blocks are separate", () => {
    const root = parse(`{}{}{}{}
    `);
    expect(root.children.length, "Should have four children").to.equal(4);
  });
  test("Adjacent blocks with some separated by newlines", () => {
    const root = parse(`{}{}
    {}{}
    `);
    expect(root.children.length, "Should have four children").to.equal(4);
  });
  test("Empty Expressions inside blocks", () => {
    const root = parse(`{()}{()}
    {()}{()}
    `);
    expect(root.children.length, "Should have four children").to.equal(4);
    root.children.forEach(ch => {
      expect(ch.isExpression).to.be.true;
    });
  });

  test("Individual multiline block nodes are separate", () => {
    const root = parse(`
    {

    }
    {

    }
    {

    }
    {

    }
    `);
    expect(root.children.length, "Should have four children").to.equal(4);
  });

  test("Individual multiblock lines with multiple entries are separate ", () => {
    const root = parse(`
    if {

    } else
    if {

    } else
    if {

    } else
    if {

    } else
    `);
    expect(root.children.length, "Should have four children").to.equal(4);
  });

  test("Individual multiblock lines with multiple connected blocks are separate ", () => {
    const root = parse(`
      if {

      } else {

      }
      if {

      } else {

      }
      if {

      } else {

      }
      if {

      } else {

      }
      `);
    expect(root.children.length, "Should have four children").to.equal(4);
  });

  test("Test block starting after newlines", () => {
    const root = parse(`
    if {

    } else 
    {

    }
    `);
    expect(root.children.length, "Should have two children").to.equal(2);
  });

  test("Test line comments", () => {
    const root = parse(
      `
    a
    b
    // c
    d
    `,
      {
        lineCommentStart: "//"
      }
    );
    expect(root.children.length, "Should have three children").to.equal(3);
  });
  test("Test line comments 2", () => {
    const root = parse(
      `
    a
    b
    ; c
    ; d
    `,
      {
        lineCommentStart: ";"
      }
    );
    expect(root.children.length, "Should have two children").to.equal(2);
  });
  test("Test block comment", () => {
    const root = parse(
      `
    a
    b
    /*
    c
    d
    */
    `,
      {
        lineCommentStart: ";",
        blockComment: ["/*", "*/"]
      }
    );
    expect(root.children.length, "Should have two children").to.equal(2);
  });
  test("Test block comment2", () => {
    const root = parse(
      `
    /*
    a
    b
    c
    d
    */
    `,
      {
        lineCommentStart: ";",
        blockComment: ["/*", "*/"]
      }
    );
    expect(root.children.length, "Should have no children").to.equal(0);
  });
});
