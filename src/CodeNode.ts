import { SourceCode } from "./SourceCode";

export class CodeNode {
  code: SourceCode;
  sp: number;
  ep: number;
  row: number;
  col: number;
  has_operator: boolean;
  disabled_node: boolean;
  op_index: number;
  is_array_literal: boolean;
  is_system_class: boolean;
  is_plugin: boolean;
  is_direct_method_call: boolean;
  mutable_def: boolean;
  expression: boolean;
  vref: string;
  is_block_node: boolean;
  type_type: string;
  type_name: string;
  key_type: string;
  array_type: string;
  ns: Array<string>;
  props: { [key: string]: CodeNode } = {};
  has_vref_annotation: boolean;
  vref_annotation: CodeNode;
  has_type_annotation: boolean;
  type_annotation: CodeNode;
  parsed_type: number;
  value_type: number;
  double_value: number;
  string_value: string;
  int_value: number;
  boolean_value: boolean;
  expression_value: CodeNode;
  prop_keys: Array<string>;
  comments: Array<CodeNode>;
  children: Array<CodeNode> = [];
  parent: CodeNode;
  attrs: Array<CodeNode>;

  constructor(source: SourceCode, start: number, end: number) {
    this.sp = 0;
    this.ep = 0;
    this.code = source;
  }
  isPrimitive(): boolean {
    switch (this.value_type) {
      case 2:
        return true;
      case 4:
        return true;
      case 3:
        return true;
      case 5:
        return true;
      case 14:
        return true;
      case 15:
        return true;
      case 13:
        return true;
    }
    return false;
  }
  getPositionalString(): string {
    if (this.ep > this.sp && this.ep - this.sp < 50) {
      let start: number = this.sp;
      let end: number = this.ep;
      start = start - 100;
      end = end + 50;
      if (start < 0) {
        start = 0;
      }
      if (end >= this.code.code.length) {
        end = this.code.code.length - 1;
      }
      return this.code.code.substring(start, end);
    }
    return "";
  }
  getFirst(): CodeNode {
    return this.children[0];
  }
  getSecond(): CodeNode {
    return this.children[1];
  }
  getThird(): CodeNode {
    return this.children[2];
  }
}
