import {
  parse,
  T,
  S,
  I,
  E,
  Bl,
  A,
  iterator,
  D,
  CodeNodeIterator,
  Optional,
  OneOf,
  Sequence,
  Ti,
  EMPTY_ARRAY,
  EMPTY_ITERATOR,
  MatchFnSignature,
  TestOneOf,
  Match
} from "../../NodeIterator";
import { CodeNode } from "../../CodeNode";

export const EndOfExpr = [TestOneOf(T(";"))];

const FunctionCall = (iter: CodeNodeIterator) => {
  return iter.case([
    [EndOfExpr, () => undefined],
    [
      [E, E],
      ([name, params]) => ({
        tag: "CALL",
        name,
        params
      })
    ],
    [
      [T(), E],
      ([name, params]) => ({
        tag: "CALL",
        name,
        params
      })
    ]
  ]);
};

export interface operator {
  match: Match[];
  pred: number;
}

const operators: Array<operator> = [
  // member access
  {
    match: [A, T("."), A],
    pred: 19
  },
  // computed member access
  {
    match: [A, T("["), A, T("]")],
    pred: 19
  },
  // function call
  {
    match: [A, E],
    pred: 19
  },
  {
    match: [T("!"), A],
    pred: 16
  },
  {
    match: [A, T("+"), A],
    pred: 16
  },
  {
    match: [A, T("-"), A],
    pred: 16
  },
  {
    match: [A, T("*"), A],
    pred: 14
  },
  {
    match: [A, T("/"), A],
    pred: 14
  }
];

// 1. first expression => ! ?
// 2. second

interface Expression {
  operator?: string;
  precedence?: number;
  params?: any[];
  parent?: Expression;
  tag: string;
  value?: CodeNodeIterator;
}

const newChild = (parent: Expression, tag: string, precedence: number = 21) => {
  return { parent, tag, params: [], precedence };
};

/*

a + b * c

a * b + c

a -> parsed, '*' parsed pred : 14 we have (* a )
  -> parsing b --> will be * operator, will return pred 16 (+ b c)
      -> it is larger than ours, we have to switch the order
      -> first will be our last (* a b)
      -> we will become first of (+ (* a b ) c)

a * b + c * d 

a -> parsed, '+' parsed pred : 14
  -> parsing b, now returns (+ b (* c d))
      -> it is larger than ours, we have to switch the order
      -> first will be our last (* a b)
      -> we will become first of (+ (* a b ) (* c d)) 

b + c * d * e

b -> parsed, '+' parsed pred : 14 (+ b ?)
  -> parsing c, (* c ?)
     -> parsing d -> (* d ?)
       -> parsing e -> 
     -> d -> (* d e)
  -> c -> (* c (* d e))
-> b -> (+ b (* c (* d e)))

b * c + d + e

b -> parsed, '+' parsed pred : 14 (* b ?)
  -> parsing c, (+ c ?)
     -> parsing d -> (+ d ?)
       -> parsing e -> 
     -> d -> (+ d e)
  -> c -> (+ c (+ d e))
-> b, bigger pred
    -> first ("c") will be our last (* b c)
    -> if it is an operator, we will become first of (+ (* b c) (+ d e)) 

*/

export const ParseNode = (parent: Expression, iter: CodeNodeIterator) => {
  return iter.case<Expression>([
    [
      [T("!"), A],
      ([, sub]) => {
        const n = newChild(parent, "NOT");
        n.params.push(ParseNode(n, sub));
        return n;
      }
    ],
    [[S()], ([i]) => ({ tag: "STRING", value: i })],
    [[I], ([i]) => ({ tag: "INT", value: i })],
    [[D], ([i]) => ({ tag: "DOUBLE", value: i })],
    [[T(["false", "true"])], ([i]) => ({ tag: "BOOLEAN", value: i })]
  ]);
};

/*

[a, '.', b, '.', c]
a.b.c.d[f()]

=> new tree based on expressions
(. (. a b) c)

sthe iterator new sees only E => ( t, E T )

a * c + d => (+ (* a c) d )

a, b, c => (b a c)


*/
