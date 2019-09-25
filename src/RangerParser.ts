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

export class RangerParser {
  code: SourceCode;
  buff: string;
  __len: number;
  i: number;
  current_line_index: number;
  parents: Array<CodeNode>;
  next: CodeNode;
  paren_cnt: number;
  rootNode: CodeNode;
  curr_node: CodeNode;
  disableOperators: boolean;
  constructor(code_module: SourceCode) {
    this.__len = 0;
    this.i = 0;
    this.current_line_index = 0;
    this.parents = [];
    this.paren_cnt = 0;
    this.disableOperators = false;
    this.buff = code_module.code;
    this.code = code_module;
    this.__len = this.buff.length;
    this.rootNode = new CodeNode(this.code, 0, this.buff.length);
    this.rootNode.isBlock = true;
    this.rootNode.isExpression = true;
    this.curr_node = this.rootNode;
    this.parents.push(this.curr_node);
    this.paren_cnt = 1;
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
      throw "Parser error, ) mismatch";
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
    return true;
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
      case 46:
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
        return 11;
      case 62:
        return 11;
      case 33:
        return 3;
      case 61:
        return 3;
      case 38:
        return 3;
      case 124:
        return 5;
      default:
        break;
    }
    return 0;
  }
  insert_node(p_node: CodeNode): void {
    let push_target: CodeNode = this.curr_node;
    push_target.children.push(p_node);
  }
  parse(disable_ops: boolean): void {
    const s: string = this.buff;
    let c: number = s.charCodeAt(0);
    let fc: number = 0;
    let sp: number = 0;
    let ep: number = 0;
    let last_i: number = 0;
    let had_lf: boolean = false;
    let disable_ops_set: boolean = disable_ops;
    while (this.i < this.__len) {
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
          if (nodeParent.isBlock) {
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
        c = s.charCodeAt(this.i);
        if (this.i < this.__len - 1) {
          fc = s.charCodeAt(this.i + 1);
          // block or expression start
          if (c == 40 || c == 123) {
            this.paren_cnt = this.paren_cnt + 1;
            if (typeof this.curr_node === "undefined") {
              this.rootNode = new CodeNode(this.code, this.i, this.i);
              this.curr_node = this.rootNode;
              this.curr_node.isExpression = true;
              this.parents.push(this.curr_node);
            } else {
              const new_qnode: CodeNode = new CodeNode(
                this.code,
                this.i,
                this.i
              );
              new_qnode.isExpression = true;
              this.insert_node(new_qnode);
              this.parents.push(new_qnode);
              this.curr_node = new_qnode;
            }
            if (c == 123) {
              this.curr_node.isBlock = true;
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
          // -123 or .123
          ((fc == 45 || fc == 46) &&
            s.charCodeAt(this.i + 1) >= 48 &&
            s.charCodeAt(this.i + 1) <= 57) ||
          // -.333
          (fc == 45 &&
            s.charCodeAt(this.i + 1) === 46 &&
            s.charCodeAt(this.i + 2) >= 48 &&
            s.charCodeAt(this.i + 2) <= 57) ||
          // normal start as number
          (fc >= 48 && fc <= 57)
        ) {
          let is_double: boolean = fc === 46;
          sp = this.i;
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i);
          let expCnt = 0;
          while (
            this.i < this.__len &&
            ((c >= 48 && c <= 57) ||
              c == 46 ||
              (expCnt === 0 && c == 101) ||
              (this.i == sp && (c == 43 || c == 45)))
          ) {
            // 101 e
            // 45  -
            // 43  +
            if (c == 101) {
              const c2 = s.charCodeAt(this.i + 1);
              if (c2 == 45 || c2 == 43) {
                is_double = true;
                this.i = this.i + 2;
                c = s.charCodeAt(this.i);
                expCnt++;
                continue;
              }
            }

            if (c == 46) {
              is_double = true;
            }
            this.i = 1 + this.i;
            c = s.charCodeAt(this.i);
          }
          ep = this.i;
          const new_num_node: CodeNode = new CodeNode(this.code, sp, ep);
          if (is_double) {
            new_num_node.nodeType = RangerType.Double;
            new_num_node.doubleValue = isNaN(parseFloat(s.substring(sp, ep)))
              ? undefined
              : parseFloat(s.substring(sp, ep));
          } else {
            new_num_node.nodeType = RangerType.Int;
            new_num_node.intValue = isNaN(parseInt(s.substring(sp, ep)))
              ? undefined
              : parseInt(s.substring(sp, ep));
          }
          this.insert_node(new_num_node);
          continue;
        }

        if (this.isOperator(false)) {
          const sp = this.i;
          this.i++;
          const ep = this.i;
          const new_ref_node: CodeNode = new CodeNode(this.code, sp, ep);
          new_ref_node.token = s.substring(sp, ep);
          new_ref_node.nodeType = RangerType.Token;
          new_ref_node.parent = this.curr_node;
          this.curr_node.children.push(new_ref_node);
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
            }
            const new_str_node: CodeNode = new CodeNode(this.code, sp, ep);
            new_str_node.nodeType = RangerType.String;
            if (must_encode) {
              new_str_node.stringValue = encoded_str;
            } else {
              new_str_node.stringValue = s.substring(sp, ep);
            }
            this.insert_node(new_str_node);
            this.i = 1 + this.i;
            continue;
          }
        }

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
          if (this.curr_node.isBlock == true) {
            const new_expr_node: CodeNode = new CodeNode(this.code, sp, ep);
            new_expr_node.parent = this.curr_node;
            new_expr_node.isExpression = true;
            this.curr_node.children.push(new_expr_node);
            this.curr_node = new_expr_node;
            this.parents.push(new_expr_node);
            this.paren_cnt = 1 + this.paren_cnt;
            this.parse(disable_ops_set);
            continue;
          }
        }

        let last_was_newline: boolean = false;
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
        }
        ep = this.i;
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
        if (this.i <= this.__len && ep > sp) {
          const new_token_node: CodeNode = new CodeNode(this.code, sp, ep);
          new_token_node.token = s.substring(sp, ep);
          new_token_node.nodeType = RangerType.Token;
          new_token_node.parent = this.curr_node;
          let pTarget: CodeNode = this.curr_node;
          pTarget.children.push(new_token_node);
          continue;
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
