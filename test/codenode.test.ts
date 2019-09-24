import { SourceCode } from "../src/SourceCode";
import { CodeNode } from "../src/CodeNode";
import { expect } from "chai";

const sampleSource = `line1
line2
line3
`;

describe("CodeNode tests", () => {
  test("getPositionalString", () => {
    const sourceFile = new SourceCode(sampleSource);
    const n = new CodeNode(sourceFile, 2, 3);
    expect(n.getPositionalString(1)).to.equal("ine");
    expect(n.getPositionalString(2)).to.equal("line1");
    expect(n.getPositionalString()).to.equal(sampleSource);
  });
});
