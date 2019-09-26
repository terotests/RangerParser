import { RangerParser, parse } from "./RangerParser";
import { CodeNode } from "./CodeNode";
import { SourceCode } from "./SourceCode";
import { RangerType } from "./RangerType";

type BoolOrUndef = boolean | undefined;
export const EMPTY_ARRAY: [] = [];

export type MatchFnResult = [CodeNodeIterator, number] | [] | undefined;
export type MatchFnSignature = (i: CodeNodeIterator) => MatchFnResult;

export { parse, RangerParser };

export const iterator = (rootNode: CodeNode | string) => {
  if (typeof rootNode === "string") {
    return new CodeNodeIterator(parse(rootNode).children);
  }
  return new CodeNodeIterator(rootNode.children);
};

export const Optional = (fn: MatchFnSignature) => (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const res = fn(i);
  if (res.length === 0) {
    return [EMPTY_ITERATOR, 0];
  }
  return res;
};

export const OneOf = (...fns: MatchFnSignature[]) => (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  for (let x = 0; x < fns.length; x++) {
    const fn = fns[x];
    const res = fn(i);
    if (res.length > 0) {
      return res;
    }
  }
  return EMPTY_ARRAY;
};

export const Sequence = (...fns: MatchFnSignature[]) => (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  let first: MatchFnResult | undefined;
  let totalCnt = 0;
  const iter = i.clone();
  for (let x = 0; x < fns.length; x++) {
    const fn = fns[x];
    const res = fn(iter);
    if (res.length === 0) {
      return EMPTY_ARRAY;
    }
    if (!first) {
      const [it] = res;
      first = [it.clone(), res[1]];
    }
    totalCnt += res[1];
    iter.take(res[1]);
  }
  if (!first) {
    return EMPTY_ARRAY;
  }
  return [first[0], totalCnt];
};

export const Expr = str => (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].isExpression) {
      const cn = new CodeNode(n[0].code, n[0].sp, n[0].ep);
      cn.children = n[0].children;
      const first = cn.children[0];
      if (first && first.token === str) {
        return [new CodeNodeIterator([cn]), 1];
      }
    }
  }
  return EMPTY_ARRAY;
};

export const isInt = (i: CodeNodeIterator): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].nodeType === RangerType.Int) {
      return [i, 1];
    }
  }
  return EMPTY_ARRAY;
};

export const I = isInt;

export const IsInt = (i: CodeNodeIterator): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].nodeType === RangerType.Int) {
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
    if (n[0].nodeType === RangerType.Double) {
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
    if (n[0].isBlock) {
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
    if (n[0].isExpression) {
      // const cn = new CodeNode(n[0].code, n[0].sp, n[0].ep);
      // cn.children = n[0].children;
      return [new CodeNodeIterator(n[0].children), 1];
    }
  }
  return EMPTY_ARRAY;
};
export const E = isExpression;

export const IsString = (str?) => (
  i: CodeNodeIterator
): [CodeNodeIterator, number] | [] => {
  const n = i.peek();
  if (n.length > 0) {
    if (n[0].nodeType === RangerType.String) {
      if (typeof str === "undefined") {
        return [i, 1];
      }
      if (n[0].stringValue === str) {
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
    if (n[0].nodeType === RangerType.Token) {
      if (typeof str === "undefined") {
        return [i, 1];
      }
      if (Array.isArray(str)) {
        for (const s of str) {
          if (ignoreCase) {
            if (n[0].token.toLowerCase() === s.toLowerCase()) {
              return [i, 1];
            }
          } else {
            if (n[0].token === s) {
              return [i, 1];
            }
          }
        }
      } else {
        if (ignoreCase) {
          if (n[0].token.toLowerCase() === str.toLowerCase()) {
            return [i, 1];
          }
        } else {
          if (n[0].token === str) {
            return [i, 1];
          }
        }
      }
    }
  }
  return EMPTY_ARRAY;
};

export const T = IsToken;
export const Ti = (str?: string | string[]) => IsToken(str, true);

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
    for (const test of tests) {
      const cc = root.clone();
      if (typeof test !== "function") {
        console.log("Test not a function ", test);
        console.error(cc.peek());
      }
      const result = test(cc);
      if (typeof result === "undefined" || result.length === 0) {
        return false;
      }
      const [it, cnt] = test(cc);
      root.take(cnt);
      res.push(it);
    }
    if (fn) fn(res);
    this.i = root.i;
    this.c = root.c;
    return true;
  }

  m(tests: Array<MatchFnSignature>, fn?: (values: CodeNodeIterator[]) => void) {
    return this.match(tests, fn);
  }

  test(
    tests: Array<MatchFnSignature>,
    fn?: (values: CodeNodeIterator[]) => void
  ) {
    return this.clone().match(tests, fn);
  }

  toString(): string {
    let n = this.peek();
    return n[0] ? n[0].stringValue : "";
  }
  toInt(): number {
    let n = this.peek();
    return n[0] ? n[0].intValue : 0;
  }
  toDouble(): number {
    let n = this.peek();
    return n[0] ? n[0].doubleValue : 0;
  }
  toTokenString(): string {
    let n = this.peek();
    return n[0] ? n[0].token : "";
  }
  token(): string {
    let n = this.peek();
    return n[0] ? n[0].token : "";
  }
  string(): string {
    let n = this.peek();
    return n[0] ? n[0].stringValue : "";
  }
  int(): number {
    let n = this.peek();
    return n[0] ? n[0].intValue : 0;
  }
  double(): number {
    let n = this.peek();
    return n[0] ? n[0].doubleValue : 0;
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

  skip(s: string | number | undefined): boolean {
    if (typeof s === "undefined") {
      this.take(1);
      return true;
    }
    if (typeof s === "number") {
      this.take(s);
      return true;
    }
    let n = this.peek();
    if (n[0] && n[0].token.toLowerCase() === s.toLowerCase()) {
      this.take();
      return true;
    }
    return false;
  }

  firstToString(): string {
    const [n] = this.peek();
    if (n) {
      if (n.nodeType === RangerType.String) {
        return `"${n.stringValue}"`;
      }
      if (n.nodeType === RangerType.Int) {
        return `${n.intValue}`;
      }
      if (n.nodeType === RangerType.Double) {
        return `${n.doubleValue}`;
      }
      if (n.nodeType === RangerType.Token) {
        return `${n.token}`;
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
      if (!n.isBlock && !n.isExpression) {
        res.push(n);
        x++;
        this.c = 0;
        this.i++;
        continue;
      }
      if (n.isBlock || (n.isExpression && n.children.length === 0)) {
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
    let i = this.i;
    let c = this.c;
    const res: CodeNode[] = new Array(cnt);
    while (x < cnt) {
      const n = this.node[i];
      if (!n) {
        break;
      }
      if (!n.isBlock && !n.isExpression) {
        res[x] = n;
        x++;
        c = 0;
        i++;
        continue;
      }
      if (n.isBlock || (n.isExpression && n.children.length === 0)) {
        res[x] = n;
        x++;
        c = 0;
        i++;
        continue;
      }
      if (n.children.length === c) {
        c = 0;
        i++;
        continue;
      }
      res[x] = n.children[c];
      c++;
      x++;
    }
    if (typeof res[0] === "undefined") {
      return EMPTY_ARRAY;
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

  whileDidProceed(fn: (iter: CodeNodeIterator) => void) {
    this.iterateUntil(iter => this.didProceed(fn));
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
}

export const EMPTY_ITERATOR = new CodeNodeIterator([]);
