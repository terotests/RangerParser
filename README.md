# RangerParser - Language Agnostic DSL parser

The parser is opinionated, zero configuration parser for typical language syntaxes. Unlike
many tokenizers and parsers, which require defining grammar first, the RangeParser does not
require any kind of setup to parse most common language structures. You can use it to parse
simple GraphQL, SQL, JavaScript or similar syntaxes without any configuration usually associated
with generating parsers.

So how is that possible? The trick is that parse supports some common language elements and structures
out of the box

```typescript
{ // 1. curly brackets {} are parsed into block nodes. Actually, empty file is invisible block

  if // 2. all tokens are parsed into expression lists

  if () // 3. all parenthesis () are parsed as expression nodes

  1.456 // 4. numbers are parsed as double of int nodes

  "hello" // 5. string literals are parsed as string nodes
  'hello'
  `hello`
}
```

Newlines inside a block will start a new expression, but iterators ignore that.

Surprisingly, those simple rules are just enough to transform most common language syntaxes into AST tree
which can be used as a basis of a language or configuration files.

Thus, the parser only has six (6) different main types:

1. **Block** like `{}`
2. **Expression** like `()`
3. **Int** like `1` or `-123`
4. **Double** like `4.5`, `-.5` or `1e-10`
5. **String** like `"hello\n"` supporting escape chars too
6. **Token** like `if` or `while` or `+` (operators are also parsed as tokens)

Additionally, specific operators are detected and separated, for example `x+y` would be parsed as a
single token. Since `+` is detected as operator, `x`, `+` and `y` are parsed as separate tokens.

# Parser and Iterator

The parser has two basic components:

1. Parser, which is used to transform string to AST tree
2. Iterator, which is used to walk the AST tree accroding to language rules

For example, to match simple `if` statement like this

```typescript
if (x + y) {
} else {
}
```

You can create a definintion like

```typescript
[T("if"), E, Bl, T("else"), Bl];
```

Code example

```typescript
import { T, E, Bl, iterator } from "ranger-parser";
test("Documentation example", () => {
  const IF_THEN_ELSE = [T("if"), E, Bl, T("else"), Bl];
  const iter = iterator(
    parse(`
  if( x + y ) {
  
  } else {
  
  }`)
  );
  let didMatch = false;
  iter.match(IF_THEN_ELSE, ([, condition, block, , elseBlock]) => {
    // if we have match, this callback is called an iterator moves forward
    const [x, plus, y] = condition.peek(3);
    expect(x.token).to.equal("x");
    expect(plus.token).to.equal("+");
    expect(y.token).to.equal("y");
    didMatch = true;
  });
  // .... the iterator has now consumed the if sentence and is ready to consume more data
  expect(didMatch).to.be.true;
});
```

# RangerType

Defines type of parsed value.

```typescript
export enum RangerType {
  Double = 1,
  Int = 2,
  String = 3,
  Token = 4
}
```

# CodeNode

CodeNode is the primitive building block fo the AST

```typescript
export class CodeNode {
  code: SourceCode;     // source code
  sp: number;           // start position of parsed node in source code string
  ep: number;           // end postion of parsed node in source code string
  nodeType: RangerType;   // type of node, Double, Int, String, Token
  isExpression: boolean;  // Expression type, like LISP syntax ( + 4 5)
  isBlock: boolean;       // Block type like { }
  token: string;          // parsed token
  doubleValue: number;    // parse value of double type
  stringValue: string;    // parsed string value
  intValue: number;       // parsed int value
  children: Array<CodeNode> = []; // possible child nodes if expression or block
  parent: CodeNode;       // parent node
```

# Matching iterators

Iterators have some defined matchers to match against common types like

```typescript
iterator(`1234`).m([IsInt()], ([num]) => {
  // num.int() should now equal 1234
});
```

Each call to `iter.match()` will return boolean indicating whether the iterator did match or not.
The callback will have all matched positions filled with corresponding iterators. In case of match the iterator will consume the matched positions.

Here is a list of defined trivial matchers

- `T` or `IsToken` will match a token or list of tokens
- `D` or `IsDouble` will match double literal
- `S` or `IsString` will match a defined string literal or any string literal
- `I` or `IsInt` will match integer literal
- `E` or `IsExpression` will match expression like `()`
- `Bl` or `IsBlock` will match block expression like `{}`
- `A` or `IsAny` will match anything

There are also some grouping matchers like

- `Optional` which returns match or empty iterator
- `OneOf` which matches the first one of the given matchers
- `Sequence` which matches if the given sequence is matched, returned type is the first iterator

Currently the usage is not well documented, see test folder for examples.

# Usage and examples

See the `test/` directory

# Limitations

The set of operators is fixed, ad idea would be to change the operator set dynamic.

Keywords could be optionally separated from operators to support better control over the structure.

Comments in the syntax is not supported.

# Code Coverate

Still needs some work to get to the 100%

```
-----------------|----------|----------|----------|----------|-------------------|
File             |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
-----------------|----------|----------|----------|----------|-------------------|
All files        |     83.5 |    72.06 |    85.94 |    83.26 |                   |
 CodeNode.js     |      100 |      100 |      100 |      100 |                   |
 NodeIterator.js |    83.33 |    67.06 |    80.43 |    83.02 |... 10,413,418,430 |
 RangerParser.js |    79.93 |    74.37 |      100 |    79.93 |... 39,449,453,454 |
 RangerType.js   |      100 |      100 |      100 |      100 |                   |
 SourceCode.js   |      100 |      100 |      100 |      100 |                   |
-----------------|----------|----------|----------|----------|-------------------|
```
