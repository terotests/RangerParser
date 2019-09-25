# RangerParser - Language Agnostic DSL parser

The parser is opinionated, zero configuration parser for typical language syntaxes. Unlike
many tokenizers and parsers, which require defining grammar first, the RangeParser does not
require any kind of setup to parse most common language structures.

The parser has two basic components:

1. Parser, which is used to transform string to AST tree
2. Iterator, which is used to walk the AST tree accroding to language rules

For example, you can create iterator like this

```typescript
import { iterator } from "ranger-parser";
const iter = iterator(`
fragment {
  something
}`);
```

And then start walking the

Examples of supported syntaxes

```typescript
const foo = (x, y) => {
  return x + y;
};
```

Or SQL syntax like

```sql
SELECT * FROM users WHERE firstnime like 'John';
```

Or LISP syntax like this

```clojure
(+ 6 9 2)
```

# Usage and examples

See the `test/` directory

# Code Coverate

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
