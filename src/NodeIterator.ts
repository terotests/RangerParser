import { RangerParser } from "./RangerParser";
import { CodeNode } from './CodeNode'
import { RangerType } from './RangerType'

type BoolOrUndef = boolean | undefined;
const EMPTY_ARRAY: [] = [];

export const iterator = (rootNode: CodeNode) => {
  return new CodeNodeIterator(rootNode.children);
};

export const SyntaxError = (str?: string) => (i: CodeNodeIterator) => {
  const peek = i.peek();
  const msg = `Syntax error at ${
    peek[0] ? peek[0].getPositionalString() : "End of file"
  }  
  ${str || ""}
  Token ${peek[0] ? peek[0].vref : "not known"}
  `;
  console.error(msg);
  throw msg;
};

export const Expr = str => (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].expression) {
      const cn = new CodeNode(n[0].code, n[0].sp, n[0].ep);
      cn.children = n[0].children;
      const first = cn.children[0];
      if (first && first.vref === str) {
        return [new CodeNodeIterator([cn]), 1];
      }
    }
  }
  return EMPTY_ARRAY;
};

export const isInt = (i: CodeNodeIterator): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].value_type === RangerType.Int) {
      return [i, 1];
    }
  }
  return EMPTY_ARRAY;
};

export const I = isInt;

export const IsInt = (i: CodeNodeIterator): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].value_type === RangerType.Int) {
      return [i, 1];
    }
  }
  return EMPTY_ARRAY;
};

export const IsAny = (i: CodeNodeIterator): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    return [i, 1];
  }
  return [];
};
export const isAny = IsAny;
export const A = IsAny;

export const isDouble = (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].double_value === RangerType.Double) {
      return [i, 1];
    }
  }
  return EMPTY_ARRAY;
};

export const D = isDouble;

export const IsBlock = (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].is_block_node) {
      return [new CodeNodeIterator(n[0].children), 1];
    }
  }
  return EMPTY_ARRAY;
};
export const Bl = IsBlock;

export const isExpression = (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].expression) {
      const cn = new CodeNode(n[0].code, n[0].sp, n[0].ep);
      cn.children = n[0].children;
      return [new CodeNodeIterator([cn]), 1];
    }
  }
  return EMPTY_ARRAY;
};
export const E = isExpression;

export const IsBool = (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].value_type === RangerType.Bool) {
      return [i, 1];
    }
  }
  return EMPTY_ARRAY;
};
export const B = IsBool;

export const IsString = (str?) => (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].value_type === RangerType.String) {
      if (typeof str === "undefined") {
        return [i, 1];
      }
      if (n[0].string_value === str) {
        return [i, 1];
      }
    }
  }
  return EMPTY_ARRAY;
};
export const S = IsString;

export const IsToken = (str?: string | string[], ignoreCase?: boolean) => (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].value_type === RangerType.Token) {
      if (typeof str === "undefined") {
        return [i, 1];
      }
      if (Array.isArray(str)) {
        for (const s of str) {
          if (ignoreCase) {
            if (n[0].vref.toLowerCase() === s.toLowerCase()) {
              return [i, 1];
            }
          } else {
            if (n[0].vref === s) {
              return [i, 1];
            }
          }
        }
      } else {
        if (ignoreCase) {
          if (n[0].vref.toLowerCase() === str.toLowerCase()) {
            return [i, 1];
          }
        } else {
          if (n[0].vref === str) {
            return [i, 1];
          }
        }
      }
    }
  }
  return EMPTY_ARRAY;
};

export const T = IsToken;

export class CodeNodeIterator {
  i = 0;
  c = 0;
  node: CodeNode[];
  constructor(node: CodeNode[]) {
    this.node = node;
  }

  clone() {
    const c = new CodeNodeIterator(this.node);
    c.i = this.i;
    c.c = this.c;
    return c;
  }

  match(
    tests: Array<(i: CodeNodeIterator) => [CodeNodeIterator, number] | []>,
    fn?: (values: CodeNodeIterator[]) => void
  ): boolean {
    const res: CodeNodeIterator[] = [];
    const root = this.clone();
    let total = 0;
    for (const test of tests) {
      const cc = root.clone();
      const [it, cnt] = test(cc);
      root.take(cnt);
      total += cnt;
      if (cnt) {
        res.push(it);
      } else {
        return false;
      }
    }
    if (fn) fn(res);
    this.i = root.i;
    this.c = root.c;
    return true;
  }

  m(
    tests: Array<(i: CodeNodeIterator) => [CodeNodeIterator, number] | []>,
    fn?: (values: CodeNodeIterator[]) => void
  ) {
    return this.match(tests, fn);
  }

  match1<T1>(
    test: (i: CodeNodeIterator) => [T1] | [],
    fn: (values: [T1]) => void
  ) {
    const value = test(this);
    if (value.length === 1) {
      fn(value);
      this.take(1);
    }
  }
  // match2(I.IsNumber)
  // match2(I.IsText('ALL'))
  match2<T1, T2>(
    t1: (i: CodeNodeIterator) => [T1] | [],
    t2: (i: CodeNodeIterator) => [T2] | [],
    fn: (values: [T1, T2]) => void
  ) {
    const c = this.clone();
    const v1 = t1(c);
    c.skip(1);
    const v2 = t2(c);
    if (v1.length === 1 && v2.length === 1) {
      fn([v1[0], v2[0]]);
      this.take(2);
    }
  }

  match3<T1, T2, T3>(
    t1: (i: CodeNodeIterator) => [T1] | [],
    t2: (i: CodeNodeIterator) => [T2] | [],
    t3: (i: CodeNodeIterator) => [T3] | [],
    fn: (values: [T1, T2, T3]) => void
  ) {
    const c = this.clone();
    const v1 = t1(c);
    c.skip(1);
    const v2 = t2(c);
    c.skip(1);
    const v3 = t3(c);
    if (v1.length === 1 && v2.length === 1 && v3.length === 1) {
      fn([v1[0], v2[0], v3[0]]);
      this.take(3);
    }
  }

  nextIs(s: string): boolean {
    let n = this.peek();
    return n[0] && n[0].vref.toLowerCase() === s.toLowerCase();
  }

  toString(): string {
    let n = this.peek();
    return n[0] ? n[0].string_value : "";
  }
  toInt(): number {
    let n = this.peek();
    return n[0] ? n[0].int_value : 0;
  }
  toDouble(): number {
    let n = this.peek();
    return n[0] ? n[0].double_value : 0;
  }
  toBool(): boolean {
    let n = this.peek();
    return n[0] ? n[0].boolean_value : false;
  }
  toTokenString(): string {
    let n = this.peek();
    return n[0] ? n[0].vref : "";
  }

  toNextLine() {
    this.i++;
    this.c = 0;
  }

  lineHasMore() {
    const n = this.node[this.i];
    return n && n.children.length > this.c;
  }

  untilNextLine(fn: (i: CodeNodeIterator) => void) {
    const startI = this.i;
    while (this.lineHasMore()) {
      fn(this);
      this.take(1);
    }
    this.i = startI + 1;
    this.c = 0;
  }

  skip(s: string | number): boolean {
    if (typeof s === "number") {
      this.take(s);
      return true;
    }
    let n = this.peek();
    if (n[0] && n[0].vref.toLowerCase() === s.toLowerCase()) {
      this.take();
      return true;
    }
    return false;
  }

  firstToString(): string {
    const [n] = this.peek();
    if (n) {
      if (n.value_type === RangerType.String) {
        return `"${n.string_value}"`;
      }
      if (n.value_type === RangerType.Int) {
        return `${n.int_value}`;
      }
      if (n.value_type === RangerType.Bool) {
        return `${n.boolean_value}`;
      }
      if (n.value_type === RangerType.Double) {
        return `${n.double_value}`;
      }
      if (n.value_type === RangerType.Token) {
        return `${n.vref}`;
      }
      return "";
    }
    return "";
  }

  take(cnt: number = 1): CodeNode[] {
    // let n = this.node[this.i];
    let x = 0;
    const res: CodeNode[] = new Array<CodeNode>(cnt);
    while (x < cnt) {
      const n = this.node[this.i];
      if (!n) {
        break;
      }
      if (!n.is_block_node && !n.expression) {
        res.push(n);
        x++;
        this.c = 0;
        this.i++;
        continue;
      }
      if (n.is_block_node || (n.expression && n.children.length === 0)) {
        res.push(n);
        x++;
        this.c = 0;
        this.i++;
        continue;
      }
      if (n.children.length == this.c) {
        this.c = 0;
        this.i++;
        continue;
      }
      res.push(n.children[this.c]);
      this.c++;
      x++;
    }
    if (typeof res[0] === "undefined") {
      return [];
    }
    return res;
  }

  peek(cnt: number = 1): CodeNode[] {
    let x = 0;
    const startI = this.i;
    const startC = this.c;
    const res: CodeNode[] = new Array(cnt);
    while (x < cnt) {
      const n = this.node[this.i];
      if (!n) {
        break;
      }
      if (!n.is_block_node && !n.expression) {
        res[x] = n;
        x++;
        this.c = 0;
        this.i++;
        continue;
      }
      if (n.is_block_node || (n.expression && n.children.length === 0)) {
        res[x] = n;
        x++;
        this.c = 0;
        this.i++;
        continue;
      }
      if (n.children.length === this.c) {
        this.c = 0;
        this.i++;
        continue;
      }
      res[x] = n.children[this.c];
      this.c++;
      x++;
    }
    this.i = startI;
    this.c = startC;
    if (typeof res[0] === "undefined") {
      return EMPTY_ARRAY;
    }
    return res;
  }

  takeUntil(fn: (n: CodeNode[]) => boolean): CodeNode[] {
    const res: CodeNode[] = [];
    while (this.peek().length > 0 && fn(this.peek())) {
      res.push(this.take().pop());
    }
    return res;
  }

  didProceed(
    fn: (iter: CodeNodeIterator) => void,
    errorHandler?: (iter: CodeNodeIterator) => void
  ): boolean {
    const si = this.i;
    const sc = this.c;
    fn(this);
    const did = !(si === this.i && sc === this.c);
    if (!did && errorHandler) {
      errorHandler(this);
    }
    return did;
  }

  peekUntil(fn: (n: CodeNode[]) => boolean): CodeNode[] {
    const startI = this.i;
    const startC = this.c;

    const res = this.takeUntil(fn);

    this.i = startI;
    this.c = startC;
    return res;
  }

  iterateUntilToken(
    token: string | string[],
    fn: (iter: CodeNodeIterator) => boolean
  ) {
    let lastPos: CodeNode[] = [];
    if (Array.isArray(token)) {
      while (fn(this)) {
        const next = this.peek();
        if (next[0] === lastPos[0]) {
          if (next.length === 1) {
            this.skip(1);
            continue;
          }
          return;
        }
        if (next.length > 0) {
          const n = next[0];
          for (let i = 0; i < token.length; i++) {
            if (n[0] && n[0].vref.toLowerCase() === token[i].toLowerCase()) {
              return;
            }
          }
        }
        lastPos = next;
      }
      return;
    }
    while (fn(this)) {
      const next = this.peek();
      if (next[0] === lastPos[0]) {
        if (next.length === 1) {
          this.skip(1);
          continue;
        }
        return;
      }
      if (next.length > 0) {
        const n = next[0];
        if (n[0] && n[0].vref.toLowerCase() === token.toLowerCase()) {
          return;
        }
      }
    }
  }

  atEnd(): boolean {
    if (this.node.length === 0) {
      return true;
    }
    if (this.i >= this.node.length) {
      return true;
    }
    if (this.i === this.node.length - 1) {
      const list = this.node[this.i];
      if (!list || this.c >= list.children.length) {
        return true;
      }
    }
    return false;
  }

  iterateUntil(fn: (iter: CodeNodeIterator) => boolean) {
    let last_i = this.i;
    let last_c = this.c;
    while (fn(this)) {
      if (this.i === last_i && this.c == last_c) {
        this.skip(1);
        if (this.atEnd()) {
          return;
        }
        last_i = this.i;
        last_c = this.c;
        continue;
      }
      const next = this.peek();
      if (next.length === 0) {
        return;
      }
      last_i = this.i;
      last_c = this.c;
    }
  }

  takeUntilToken(token: string | string[]) {
    if (Array.isArray(token)) {
      return this.takeUntil(n => {
        for (let i = 0; i < token.length; i++) {
          if (n[0] && n[0].vref.toLowerCase() === token[i].toLowerCase()) {
            return false;
          }
        }
        return true;
      });
    }
    return this.takeUntil(n => {
      console.log("takeUnti", n[0] ? n[0].vref : "");
      if (n[0] && n[0].vref.toLowerCase() === token.toLowerCase()) {
        console.log("**** FOUND ");
        return false;
      }
      return true;
    });
  }

  hasToken(token: string, delimiters: string[]) {
    let found = false;
    const rows = this.peekUntil(n => {
      for (let i = 0; i < delimiters.length; i++) {
        if (n[0] && n[0].vref.toLowerCase() === delimiters[i].toLowerCase()) {
          return false;
        }
      }
      if (n[0] && n[0].vref.toLowerCase() === token.toLowerCase()) {
        found = true;
        return false;
      }
      return true;
    });
    return found;
  }
}
