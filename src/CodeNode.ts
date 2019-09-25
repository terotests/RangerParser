import { SourceCode } from "./SourceCode";

export class CodeNode {
  code: SourceCode;
  sp: number;
  ep: number;
  nodeType: number;
  isExpression: boolean;
  isBlock: boolean;
  token: string;
  doubleValue: number;
  stringValue: string;
  intValue: number;
  children: Array<CodeNode> = [];
  parent: CodeNode;

  constructor(source: SourceCode, start: number, end: number) {
    this.sp = start;
    this.ep = end;
    this.code = source;
  }
  getPositionalString(range = 50): string {
    return this.code.code.substring(this.sp - range, this.ep + range);
  }
}
