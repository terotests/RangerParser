import { SourceCode } from "../src/SourceCode";
import { expect } from "chai";

const sampleSource = `line1
line2
line3
`;

describe("SourceCode tests", () => {
  test("Test reading lines in", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getLineString(1)).to.equal("line2");
    expect(sourceFile.getLineString(2)).to.equal("line3");
  });
  test("getLineString underflow of line string param", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getLineString(-1000)).to.equal("");
  });
  test("getLineString test", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getLineString(1000)).to.equal("");
  });
  test("getLine tests", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getLine(0)).to.equal(0);
    expect(sourceFile.getLine(6)).to.equal(1);
    expect(sourceFile.getLine(12)).to.equal(2);
  });
  test("getLine overflow", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getLine(1000)).to.equal(-1);
  });
  test("getColumn", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getColumn(2)).to.equal(2);
    expect(sourceFile.getColumn(7)).to.equal(1);
  });
  test("getColumn overflow", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getColumn(21111)).to.equal(-1);
  });
  test("getColumnStr", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getColumnStr(2)).to.equal("  ");
    expect(sourceFile.getColumnStr(7)).to.equal(" ");
  });
  test("getColumnStr overflow", () => {
    const sourceFile = new SourceCode(sampleSource);
    expect(sourceFile.getColumnStr(2111)).to.equal("");
  });
});
