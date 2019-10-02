import { expect } from "chai";
import { iterator, CodeNodeIterator, T, Ti } from "../src/NodeIterator";

export class Maybe<T> {
  private constructor(private value: T | null) {}

  static some<T>(value: T) {
    if (!value) {
      throw Error("Provided value must not be empty");
    }
    return new Maybe(value);
  }

  static none<T>() {
    return new Maybe<T>(null);
  }

  static fromValue<T>(value: T) {
    return value ? Maybe.some(value) : Maybe.none<T>();
  }

  getOrElse(defaultValue: T) {
    return this.value === null ? defaultValue : this.value;
  }

  left(f: (wrapped: T) => void): Maybe<T> {
    if (this.value === null) {
      f(this.value);
    }
    return this;
  }

  map<R>(f: (wrapped: T) => R): Maybe<R> {
    if (this.value === null) {
      return Maybe.none<R>();
    } else {
      return Maybe.fromValue(f(this.value));
    }
  }

  forEach(f: (wrapped: T) => void): Maybe<T> {
    if (this.value !== null) {
      f(this.value);
    }
    return this;
  }

  flatMap<R>(f: (wrapped: T) => Maybe<R>): Maybe<R> {
    if (this.value === null) {
      return Maybe.none<R>();
    } else {
      return f(this.value);
    }
  }
  bind() {
    return this.value;
  }
}

describe("Monadic test", () => {
  test("Try matching select", () => {
    const iter = iterator(`SELECT * FROM table`);

    const FindSelect = (iter: CodeNodeIterator): Maybe<CodeNodeIterator> => {
      if (iter.m([Ti("SELECT")])) {
        return Maybe.some(iter);
      }
    };
    const FindAsterix = (iter: CodeNodeIterator): Maybe<CodeNodeIterator> => {
      if (iter.m([T("*")])) {
        return Maybe.some(iter);
      }
    };
    const FindFrom = (iter: CodeNodeIterator): Maybe<CodeNodeIterator> => {
      if (iter.m([Ti("FROM")])) {
        return Maybe.some(iter);
      }
    };

    const s = FindSelect(iter)
      .flatMap(FindAsterix)
      .flatMap(FindFrom)
      .flatMap(i => {
        const [tbl] = i.peek();
        return Maybe.some(tbl.token);
      });
    expect(s.bind()).to.equal("table");
  });
});
