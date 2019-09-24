import { SourceCode } from "./SourceCode";

export class CodeNode {
  code: SourceCode;
  sp: number;
  ep: number;
  value_type: number;
  expression: boolean;
  vref: string;
  is_block_node: boolean;
  double_value: number;
  string_value: string;
  int_value: number;
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
