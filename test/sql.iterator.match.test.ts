import { expect } from "chai";
import { iterator } from "../src/NodeIterator";
import { MatchColumnAccess, MatchAggregate } from "../src/parsers/sql";

// const iter = new CodeNodeIterator(p.rootNode.children);
describe("SQL parsing tests", () => {
  test("MatchAggregate", () => {
    const iter = iterator(`AVG(user.length) as ka`);
    const res = MatchAggregate(iter);
    expect(res).to.be.not.null;
    expect(res).to.be.not.undefined;
    if (res) {
      expect(res.aggregate.token()).to.equal("AVG");
      expect(res.alias.name.token()).to.equal("ka");
    }
  });
  test("MatchAggregate, lower case", () => {
    const iter = iterator(`avg(user.length) as ka`);
    const res = MatchAggregate(iter);
    expect(res).to.be.not.null;
    expect(res).to.be.not.undefined;
    if (res) {
      expect(res.aggregate.token()).to.equal("avg");
      expect(res.alias.name.token()).to.equal("ka");
    }
  });
  test("MatchColumnAccess", () => {
    // -- adding comments ?
    const iter = iterator(`schema.table.column`);
    const res = MatchColumnAccess(iter);
    expect(res).to.be.not.null;
    expect(res).to.be.not.undefined;
    if (res) {
      expect(res.schema.token()).to.equal("schema");
      expect(res.table.token()).to.equal("table");
      expect(res.column.token()).to.equal("column");

      console.log(res.schema.token());
    }
  });
});
