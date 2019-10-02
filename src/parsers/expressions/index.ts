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

interface Op {
  operator: string;
  params: any[];
}

/*

[a, '.', b, '.', c]
a.b.c.d[f()]

=> new tree based on expressions
(. (. a b) c)

sthe iterator new sees only E => ( t, E T )

a * c + d => (+ (* a c) d )

a, b, c => (b a c)


*/
