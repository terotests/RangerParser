import { CodeNode } from "./CodeNode";
import { SourceCode } from "./SourceCode";
import { RangerType } from "./RangerType";

/**
 * 
 * Transforms a string into CodeNode
 * 
 * @param codeString string to transform
 */
export const parse = (codeString: string) => {
  const sourceFile = new SourceCode(codeString);
  const parser = new RangerParser(sourceFile);
  parser.parse(true);
  return parser.rootNode;
};

// isc95notc95limiter_24
const isNotLimiter = (c: number): boolean => {
  return c > 32 && c != 41 && c != 40 && c != 125;
};

export class RangerParser {
  code: SourceCode;
  buff: string;
  __len: number;
  i: number;
  last_line_start: number;
  current_line_index: number;
  parents: Array<CodeNode>;
  next: CodeNode;
  paren_cnt: number;
  get_op_pred: number;
  rootNode: CodeNode;
  curr_node: CodeNode;
  had_error: boolean;
  disableOperators: boolean;
  constructor(code_module: SourceCode) {
    this.__len = 0;
    this.i = 0;
    this.last_line_start = 0; /** note: unused */
    this.current_line_index = 0;
    this.parents = [];
    this.paren_cnt = 0;
    this.get_op_pred = 0; /** note: unused */
    this.had_error = false;
    this.disableOperators = false;
    this.buff = code_module.code;
    this.code = code_module;
    this.__len = this.buff.length;
    this.rootNode = new CodeNode(this.code, 0, 0);
    this.rootNode.is_block_node = true;
    this.rootNode.expression = true;
    this.curr_node = this.rootNode;
    this.parents.push(this.curr_node);
    this.paren_cnt = 1;
  }
  parse_raw_annotation(): CodeNode {
    let sp: number = this.i;
    let ep: number = this.i;
    this.i = this.i + 1;
    sp = this.i;
    ep = this.i;
    if (this.i < this.__len) {
      const a_node2: CodeNode = new CodeNode(this.code, sp, ep);
      a_node2.expression = true;
      a_node2.row = this.current_line_index;
      this.curr_node = a_node2;
      this.parents.push(a_node2);
      this.i = this.i + 1;
      this.paren_cnt = this.paren_cnt + 1;
      this.parse(false);
      return a_node2;
    } else {
    }
    return new CodeNode(this.code, sp, ep);
  }
  skip_space(is_block_parent: boolean): boolean {
    const s: string = this.buff;
    let did_break: boolean = false;
    if (this.i >= this.__len) {
      return true;
    }
    let c: number = s.charCodeAt(this.i);
    while (this.i < this.__len && c <= 32) {
      if (c < 8) {
        this.i = this.__len;
        return true;
      }
      if (is_block_parent && (c == 10 || c == 13)) {
        this.end_expression();
        this.current_line_index = this.current_line_index + 1;
        did_break = true;
        break;
      }
      let had_break: boolean = false;
      while ((this.i < this.__len && c == 10) || c == 13) {
        had_break = true;
        this.i = this.i + 1;
        if (this.i >= this.__len) {
          return true;
        }
        c = s.charCodeAt(this.i);
        if (c == 10 || c == 13) {
        }
      }
      if (had_break) {
        this.current_line_index = this.current_line_index + 1;
      } else {
        this.i = 1 + this.i;
        if (this.i >= this.__len) {
          return true;
        }
        c = s.charCodeAt(this.i);
      }
    }
    return did_break;
  }
  end_expression(): boolean {
    this.i = 1 + this.i;
    if (this.i >= this.__len) {
      return false;
    }
    this.paren_cnt = this.paren_cnt - 1;
    if (this.paren_cnt < 0) {
      console.log("Parser error ) mismatch");
    }
    this.parents.pop();
    if (typeof this.curr_node !== "undefined" && this.curr_node != null) {
      this.curr_node.ep = this.i;
      this.curr_node.infix_operator = false;
    }
    if (this.parents.length > 0) {
      this.curr_node = this.parents[this.parents.length - 1];
    } else {
      this.curr_node = this.rootNode;
    }
    this.curr_node.infix_operator = false;
    return true;
  }
  getOperator(disabled: boolean): number {
    if (disabled) {
      return 0;
    }
    const s: string = this.buff;
    if (this.i + 2 >= this.__len) {
      return 0;
    }
    const c: number = s.charCodeAt(this.i);
    const c2: number = s.charCodeAt(this.i + 1);
    switch (c) {
      case 42:
        this.i = this.i + 1;
        return 14;
      case 47:
        this.i = this.i + 1;
        return 14;
      case 37:
        this.i = this.i + 1;
        return 14;
      case 43:
        this.i = this.i + 1;
        return 13;
      case 45:
        this.i = this.i + 1;
        return 13;
      case 60:
        if (c2 == 61) {
          this.i = this.i + 2;
          return 11;
        }
        this.i = this.i + 1;
        return 11;
      case 62:
        if (c2 == 61) {
          this.i = this.i + 2;
          return 11;
        }
        this.i = this.i + 1;
        return 11;
      case 33:
        if (c2 == 61) {
          this.i = this.i + 2;
          return 10;
        }
        return 0;
      case 61:
        if (c2 == 61) {
          this.i = this.i + 2;
          return 10;
        }
        this.i = this.i + 1;
        return 3;
      case 38:
        if (c2 == 38) {
          this.i = this.i + 2;
          return 6;
        }
        return 0;
      case 124:
        if (c2 == 124) {
          this.i = this.i + 2;
          return 5;
        }
        return 0;
      default:
        break;
    }
    return 0;
  }
  isOperator(disabled: boolean): number {
    if (disabled) {
      return 0;
    }
    const s: string = this.buff;
    if (this.i - 2 > this.__len) {
      return 0;
    }
    const c: number = s.charCodeAt(this.i);
    const c2: number = s.charCodeAt(this.i + 1);
    switch (c) {
      case 91:
        return 1;
      case 42:
        return 1;
      case 47:
        return 14;
      case 44:
        return 12;
      case 43:
        return 13;
      case 37:
        return 14;
      case 45:
        return 13;
      case 59:
        return 10;
      case 60:
        if (c2 == 61) {
          return 11;
        }
        return 11;
      case 62:
        if (c2 == 61) {
          return 11;
        }
        return 11;
      case 33:
        if (c2 == 61) {
          return 10;
        }
        return 0;
      case 61:
        if (c2 == 61) {
          return 10;
        }
        return 3;
      case 38:
        if (c2 == 38) {
          return 6;
        }
        return 0;
      case 124:
        if (c2 == 124) {
          return 5;
        }
        return 0;
      default:
        break;
    }
    return 0;
  }
  getOperatorPred(str: string, disabled: boolean): number {
    if (disabled) {
      return 0;
    }
    switch (str) {
      case "<":
        return 11;
      case ">":
        return 11;
      case "<=":
        return 11;
      case ">=":
        return 11;
      case "==":
        return 10;
      case "!=":
        return 10;
      case "=":
        return 3;
      case "&&":
        return 6;
      case "||":
        return 5;
      case "+":
        return 13;
      case "-":
        return 13;
      case "%":
        return 14;
      case "*":
        return 14;
      case "/":
        return 14;
      default:
        break;
    }
    return 0;
  }
  insert_node(p_node: CodeNode): void {
    let push_target: CodeNode = this.curr_node;
    if (this.curr_node.infix_operator) {
      push_target = this.curr_node.infix_node;
      if (push_target.to_the_right) {
        push_target = push_target.right_node;
        p_node.parent = push_target;
      }
    }
    push_target.children.push(p_node);
  }
  parse_attributes(): boolean {
    const s: string = this.buff;
    let last_i: number = 0;
    const do_break: boolean = false;
    /** unused:  const attr_name : string  = ""   **/

    let sp: number = this.i;
    let ep: number = this.i;
    let c: number = 0;
    let cc1: number = 0;
    let cc2: number = 0;
    cc1 = s.charCodeAt(this.i);
    while (this.i < this.__len) {
      last_i = this.i;
      while (this.i < this.__len && s.charCodeAt(this.i) <= 32) {
        this.i = 1 + this.i;
      }
      cc1 = s.charCodeAt(this.i);
      cc2 = s.charCodeAt(this.i + 1);
      if (this.i >= this.__len) {
        break;
      }
      if (cc1 == 62) {
        return do_break;
      }
      if (cc1 == 47 && cc2 == 62) {
        this.i = 2 + this.i;
        return true;
      }
      sp = this.i;
      ep = this.i;
      c = s.charCodeAt(this.i);
      while (
        this.i < this.__len &&
        ((c >= 65 && c <= 90) ||
          (c >= 97 && c <= 122) ||
          (c >= 48 && c <= 57) ||
          c == 95 ||
          c == 45)
      ) {
        this.i = 1 + this.i;
        c = s.charCodeAt(this.i);
      }
      this.i = this.i - 1;
      const an_sp: number = sp;
      const an_ep: number = this.i;
      c = s.charCodeAt(this.i);
      while (this.i < this.__len && c != 61) {
        this.i = 1 + this.i;
        c = s.charCodeAt(this.i);
      }
      if (c == 61) {
        this.i = 1 + this.i;
      }
      while (this.i < this.__len && s.charCodeAt(this.i) <= 32) {
        this.i = 1 + this.i;
      }
      if (this.i >= this.__len) {
        break;
      }
      c = s.charCodeAt(this.i);
      if (c == 123) {
        const cNode: CodeNode = this.curr_node;
        const new_attr: CodeNode = new CodeNode(this.code, sp, ep);
        new_attr.value_type = 21;
        new_attr.parsed_type = new_attr.value_type;
        new_attr.vref = s.substring(an_sp, an_ep + 1);
        new_attr.string_value = s.substring(sp, ep);
        this.curr_node.attrs.push(new_attr);
        this.curr_node = new_attr;
        this.paren_cnt = this.paren_cnt + 1;
        const new_qnode: CodeNode = new CodeNode(this.code, this.i, this.i);
        new_qnode.expression = true;
        this.insert_node(new_qnode);
        this.parents.push(new_qnode);
        this.curr_node = new_qnode;
        this.i = 1 + this.i;
        this.parse(false);
        this.curr_node = cNode;
        continue;
      }
      if (c == 34 || c == 39) {
        this.i = this.i + 1;
        sp = this.i;
        ep = this.i;
        c = s.charCodeAt(this.i);
        while (this.i < this.__len && c != 34 && c != 39) {
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i);
        }
        ep = this.i;
        if (this.i < this.__len && ep > sp) {
          const new_attr_1: CodeNode = new CodeNode(this.code, sp, ep);
          new_attr_1.value_type = 21;
          new_attr_1.parsed_type = new_attr_1.value_type;
          new_attr_1.vref = s.substring(an_sp, an_ep + 1);
          new_attr_1.string_value = s.substring(sp, ep);
          this.curr_node.attrs.push(new_attr_1);
        }
        this.i = 1 + this.i;
      }
      if (last_i == this.i) {
        this.i = 1 + this.i;
      }
    }
    return do_break;
  }
  
  parse(disable_ops: boolean): void {
    const s: string = this.buff;
    let c: number = s.charCodeAt(0);
    /** unused:  const next_c : number  = 0   **/

    let fc: number = 0;
    let sp: number = 0;
    let ep: number = 0;
    let last_i: number = 0;
    let had_lf: boolean = false;
    let disable_ops_set: boolean = disable_ops;
    while (this.i < this.__len) {
      if (typeof this.curr_node !== "undefined" && this.curr_node != null) {
        if (this.curr_node.value_type == 21) {
          return;
        }
        if (this.curr_node.value_type == 19) {
          return;
        }
      }
      if (this.had_error) {
        break;
      }
      last_i = this.i;
      let is_block_parent: boolean = false;
      if (had_lf) {
        had_lf = false;
        this.end_expression();
        break;
      }
      if (typeof this.curr_node !== "undefined" && this.curr_node != null) {
        if (
          typeof this.curr_node.parent !== "undefined" &&
          this.curr_node.parent != null
        ) {
          const nodeParent: CodeNode = this.curr_node.parent;
          if (nodeParent.is_block_node) {
            is_block_parent = true;
          }
        }
      }
      if (this.skip_space(is_block_parent)) {
        break;
      }
      had_lf = false;
      c = s.charCodeAt(this.i);
      if (this.i < this.__len) {
        if (this.isOperator(false)) {
          const sp = this.i;
          this.i++;
          const ep = this.i;
          const new_ref_node: CodeNode = new CodeNode(this.code, sp, ep);
          new_ref_node.vref = s.substring(sp, ep);
          new_ref_node.ns = [new_ref_node.vref];
          new_ref_node.parsed_type = 11;
          new_ref_node.value_type = 11;
          new_ref_node.parent = this.curr_node;
          this.curr_node.children.push(new_ref_node);
          continue;
        }

        c = s.charCodeAt(this.i);
        if (this.i < this.__len - 1) {
          fc = s.charCodeAt(this.i + 1);
          // block or expression start
          if (c == 40 || c == 123) {
            this.paren_cnt = this.paren_cnt + 1;
            if (typeof this.curr_node === "undefined") {
              this.rootNode = new CodeNode(this.code, this.i, this.i);
              this.curr_node = this.rootNode;
              this.curr_node.expression = true;
              this.parents.push(this.curr_node);
            } else {
              const new_qnode: CodeNode = new CodeNode(
                this.code,
                this.i,
                this.i
              );
              new_qnode.expression = true;
              this.insert_node(new_qnode);
              this.parents.push(new_qnode);
              this.curr_node = new_qnode;
            }
            if (c == 123) {
              this.curr_node.is_block_node = true;
            }
            this.i = 1 + this.i;
            this.parse(disable_ops_set);
            continue;
          }
        }
        sp = this.i;
        ep = this.i;
        fc = s.charCodeAt(this.i);
        if (
          (fc == 45 &&
            s.charCodeAt(this.i + 1) >= 46 &&
            s.charCodeAt(this.i + 1) <= 57) ||
          (fc >= 48 && fc <= 57)
        ) {
          let is_double: boolean = false;
          sp = this.i;
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i);
          while (
            this.i < this.__len &&
            ((c >= 48 && c <= 57) ||
              c == 46 ||
              (this.i == sp && (c == 43 || c == 45)))
          ) {
            if (c == 46) {
              is_double = true;
            }
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i);
          }
          ep = this.i;
          const new_num_node: CodeNode = new CodeNode(this.code, sp, ep);
          if (is_double) {
            new_num_node.parsed_type = 2;
            new_num_node.value_type = 2;
            new_num_node.double_value = isNaN(parseFloat(s.substring(sp, ep)))
              ? undefined
              : parseFloat(s.substring(sp, ep));
          } else {
            new_num_node.parsed_type = 3;
            new_num_node.value_type = 3;
            new_num_node.int_value = isNaN(parseInt(s.substring(sp, ep)))
              ? undefined
              : parseInt(s.substring(sp, ep));
          }
          this.insert_node(new_num_node);
          continue;
        }
        const str_limit: number = fc;
        const b_had_str: boolean = fc == 34 || fc == 96 || fc == 39;
        if (b_had_str) {
          sp = this.i + 1;
          ep = sp;
          c = s.charCodeAt(this.i);
          let must_encode: boolean = false;
          while (this.i < this.__len) {
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i);
            if (c == str_limit) {
              break;
            }
            if (c == 92) {
              this.i = 1 + this.i;
              if (this.i < this.__len) {
                must_encode = true;
                c = s.charCodeAt(this.i);
              } else {
                break;
              }
            }
          }
          ep = this.i;
          if (this.i < this.__len) {
            let encoded_str: string = "";
            if (must_encode) {
              const subs: string = s.substring(sp, ep);
              const orig_str: string = subs;
              const str_length: number = orig_str.length;
              let ii: number = 0;
              while (ii < str_length) {
                const cc: number = orig_str.charCodeAt(ii);
                if (cc == 92) {
                  const next_ch: number = orig_str.charCodeAt(ii + 1);
                  switch (next_ch) {
                    case 34:
                      encoded_str = encoded_str + String.fromCharCode(34);
                      break;
                    case 92:
                      encoded_str = encoded_str + String.fromCharCode(92);
                      break;
                    case 47:
                      encoded_str = encoded_str + String.fromCharCode(47);
                      break;
                    case 98:
                      encoded_str = encoded_str + String.fromCharCode(8);
                      break;
                    case 102:
                      encoded_str = encoded_str + String.fromCharCode(12);
                      break;
                    case 110:
                      encoded_str = encoded_str + String.fromCharCode(10);
                      break;
                    case 114:
                      encoded_str = encoded_str + String.fromCharCode(13);
                      break;
                    case 116:
                      encoded_str = encoded_str + String.fromCharCode(9);
                      break;
                    case 117:
                      ii = ii + 4;
                      break;
                    default:
                      break;
                  }
                  ii = ii + 2;
                } else {
                  encoded_str = encoded_str + orig_str.substring(ii, 1 + ii);
                  ii = ii + 1;
                }
              }
            } else {
            }
            const new_str_node: CodeNode = new CodeNode(this.code, sp, ep);
            new_str_node.parsed_type = 4;
            new_str_node.value_type = 4;
            if (must_encode) {
              new_str_node.string_value = encoded_str;
            } else {
              new_str_node.string_value = s.substring(sp, ep);
            }
            this.insert_node(new_str_node);
            this.i = 1 + this.i;
            continue;
          }
        }
        // true
        if (
          fc == 116 &&
          s.charCodeAt(this.i + 1) == 114 &&
          s.charCodeAt(this.i + 2) == 117 &&
          s.charCodeAt(this.i + 3) == 101
        ) {
          const new_true_node: CodeNode = new CodeNode(this.code, sp, sp + 4);
          new_true_node.value_type = 5;
          new_true_node.parsed_type = 5;
          new_true_node.boolean_value = true;
          this.insert_node(new_true_node);
          this.i = this.i + 4;
          continue;
        }
        // false
        if (
          fc == 102 &&
          s.charCodeAt(this.i + 1) == 97 &&
          s.charCodeAt(this.i + 2) == 108 &&
          s.charCodeAt(this.i + 3) == 115 &&
          s.charCodeAt(this.i + 4) == 101
        ) {
          const new_f_node: CodeNode = new CodeNode(this.code, sp, sp + 5);
          new_f_node.value_type = 5;
          new_f_node.parsed_type = 5;
          new_f_node.boolean_value = false;
          this.insert_node(new_f_node);
          this.i = this.i + 5;
          continue;
        }
        // @() something
        if (fc == 64) {
          this.i = this.i + 1;
          sp = this.i;
          ep = this.i;
          c = s.charCodeAt(this.i);
          while (
            this.i < this.__len &&
            s.charCodeAt(this.i) > 32 &&
            c != 40 &&
            c != 41 &&
            c != 125
          ) {
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i);
          }
          ep = this.i;
          if (this.i < this.__len && ep > sp) {
            const a_node2: CodeNode = new CodeNode(this.code, sp, ep);
            const a_name: string = s.substring(sp, ep);
            if (a_name == "noinfix") {
              disable_ops_set = true;
            }
            a_node2.expression = true;
            this.curr_node = a_node2;
            this.parents.push(a_node2);
            this.i = this.i + 1;
            this.paren_cnt = this.paren_cnt + 1;
            this.parse(disable_ops_set);
            let use_first: boolean = false;
            if (1 == a_node2.children.length) {
              const ch1: CodeNode = a_node2.children[0];
              use_first = ch1.isPrimitive();
            }
            if (use_first) {
              const theNode: CodeNode = a_node2.children.splice(0, 1).pop();
              this.curr_node.props[a_name] = theNode;
            } else {
              this.curr_node.props[a_name] = a_node2;
            }
            this.curr_node.prop_keys.push(a_name);
            continue;
          }
        }
        let ns_list: Array<string> = [];
        let last_ns: number = this.i;
        let ns_cnt: number = 1;
        let vref_had_type_ann: boolean = false;
        let vref_ann_node: CodeNode;
        let vref_end: number = this.i;

        // this is how we used to handle adding first expression inside the
        // block node

        if (
          this.i < this.__len &&
          s.charCodeAt(this.i) > 32 &&
          // c != 58 &&
          c != 40 &&
          c != 41 &&
          c != 125
        ) {
          if (this.curr_node.is_block_node == true) {
            const new_expr_node: CodeNode = new CodeNode(this.code, sp, ep);
            new_expr_node.parent = this.curr_node;
            new_expr_node.expression = true;
            this.curr_node.children.push(new_expr_node);
            this.curr_node = new_expr_node;
            this.parents.push(new_expr_node);
            this.paren_cnt = 1 + this.paren_cnt;
            this.parse(disable_ops_set);
            continue;
          }
        }

        let op_c: number = 0;
        op_c = this.getOperator(disable_ops_set);
        let last_was_newline: boolean = false;
        if (op_c > 0) {
        } else {
          while (
            this.i < this.__len &&
            s.charCodeAt(this.i) > 32 &&
            // c != 58 &&
            c != 40 &&
            c != 41 &&
            c != 125
          ) {
            if (this.i > sp) {
              const is_opchar: number = this.isOperator(false);
              if (is_opchar > 0) {
                break;
              }
            }
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i);
            if (c == 10 || c == 13) {
              last_was_newline = true;
              break;
            }
            if (c == 46) {
              ns_list.push(s.substring(last_ns, this.i));
              last_ns = this.i + 1;
              ns_cnt = 1 + ns_cnt;
            }
            if (this.i > vref_end && c == 64) {
              vref_had_type_ann = true;
              vref_end = this.i;
              vref_ann_node = this.parse_raw_annotation();
              c = s.charCodeAt(this.i);
              break;
            }
          }
        }
        ep = this.i;
        if (vref_had_type_ann) {
          ep = vref_end;
        }
        ns_list.push(s.substring(last_ns, ep));
        c = s.charCodeAt(this.i);
        while (this.i < this.__len && c <= 32 && false == last_was_newline) {
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i);
          if (is_block_parent && (c == 10 || c == 13)) {
            this.i = this.i - 1;
            c = s.charCodeAt(this.i);
            had_lf = true;
            break;
          }
        }
        if (false == disable_ops_set && c == 58) { // 58 is ":"
          this.i = this.i + 1;
          while (this.i < this.__len && s.charCodeAt(this.i) <= 32) {
            this.i = 1 + this.i;
          }
          let vt_sp: number = this.i;
          let vt_ep: number = this.i;
          c = s.charCodeAt(this.i);
          if (c == 40) {
            const vann_arr2: CodeNode = this.parse_raw_annotation();
            vann_arr2.expression = true;
            const new_expr_node_1: CodeNode = new CodeNode(
              this.code,
              sp,
              vt_ep
            );
            new_expr_node_1.vref = s.substring(sp, ep);
            new_expr_node_1.ns = ns_list;
            new_expr_node_1.expression_value = vann_arr2;
            new_expr_node_1.parsed_type = 17;
            new_expr_node_1.value_type = 17;
            if (vref_had_type_ann) {
              new_expr_node_1.vref_annotation = vref_ann_node;
              new_expr_node_1.has_vref_annotation = true;
            }
            this.curr_node.children.push(new_expr_node_1);
            continue;
          }

          // [ is also special character in the books 

          let had_type_ann: boolean = false;
          while (this.i < this.__len && isNotLimiter(c)) {
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i);
            if (c == 64) {
              had_type_ann = true;
              break;
            }
          }
          if (this.i <= this.__len) {
            vt_ep = this.i;
            /** unused:  const type_name_2 : string  = s.substring(vt_sp, vt_ep )   **/

            const new_ref_node: CodeNode = new CodeNode(this.code, sp, ep);
            new_ref_node.vref = s.substring(sp, ep);
            new_ref_node.ns = ns_list;
            new_ref_node.parsed_type = 11;
            new_ref_node.value_type = 11;
            new_ref_node.type_name = s.substring(vt_sp, vt_ep);
            new_ref_node.parent = this.curr_node;
            if (vref_had_type_ann) {
              new_ref_node.vref_annotation = vref_ann_node;
              new_ref_node.has_vref_annotation = true;
            }
            this.curr_node.children.push(new_ref_node);
            if (had_type_ann) {
              const vann: CodeNode = this.parse_raw_annotation();
              new_ref_node.type_annotation = vann;
              new_ref_node.has_type_annotation = true;
            }
            continue;
          }
        } else {
          if (this.i <= this.__len && ep > sp) {
            const new_vref_node: CodeNode = new CodeNode(this.code, sp, ep);
            new_vref_node.vref = s.substring(sp, ep);
            new_vref_node.parsed_type = 11;
            new_vref_node.value_type = 11;
            new_vref_node.ns = ns_list;
            new_vref_node.parent = this.curr_node;
            const op_pred: number = this.getOperatorPred(
              new_vref_node.vref,
              disable_ops_set
            );
            if (new_vref_node.vref == ",") {
              this.curr_node.infix_operator = false;
              continue;
            }
            let pTarget: CodeNode = this.curr_node;
            if (this.curr_node.infix_operator) {
              const iNode: CodeNode = this.curr_node.infix_node;
              if (op_pred > 0 || iNode.to_the_right == false) {
                pTarget = iNode;
              } else {
                const rn: CodeNode = iNode.right_node;
                new_vref_node.parent = rn;
                pTarget = rn;
              }
            }
            pTarget.children.push(new_vref_node);
            if (vref_had_type_ann) {
              new_vref_node.vref_annotation = vref_ann_node;
              new_vref_node.has_vref_annotation = true;
            }
            if (this.i + 1 < this.__len) {
              if (
                s.charCodeAt(this.i + 1) == 40 ||
                s.charCodeAt(this.i + 0) == 40
              ) {
                if (
                  0 == op_pred &&
                  this.curr_node.infix_operator &&
                  1 == this.curr_node.children.length
                ) {
                }
              }
            }            
            continue;
          }
        }
        // ) or }
        if (c == 41 || c == 125) {
          if (
            c == 125 &&
            is_block_parent &&
            this.curr_node.children.length > 0
          ) {
            this.end_expression();
          }
          this.i = 1 + this.i;
          this.paren_cnt = this.paren_cnt - 1;
          if (this.paren_cnt < 0) {
            break;
          }
          this.parents.pop();
          if (typeof this.curr_node !== "undefined" && this.curr_node != null) {
            this.curr_node.ep = this.i;
          }
          if (this.parents.length > 0) {
            this.curr_node = this.parents[this.parents.length - 1];
          } else {
            this.curr_node = this.rootNode;
          }
          break;
        }
        if (last_i == this.i) {
          this.i = 1 + this.i;
        }
      }
    }
  }
}
