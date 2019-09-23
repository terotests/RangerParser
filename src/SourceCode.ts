export class SourceCode {
  code: string;
  lines: Array<string>;
  filename: string;
  constructor(code_str: string) {
    this.code = "";
    this.lines = [];
    this.filename = "";
    this.code = code_str;
    this.lines = code_str.split("\n");
  }
  getLineString(line_index: number): string {
    if (line_index < 0) {
      return "";
    }
    if (this.lines.length > line_index) {
      return this.lines[line_index];
    }
    return "";
  }
  getLine(sp: number): number {
    let cnt: number = 0;
    for (let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + (str.length + 1);
      if (cnt > sp) {
        return i;
      }
    }
    return -1;
  }
  getColumnStr(sp: number): string {
    let cnt: number = 0;
    let last_col: number = 0;
    for (let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + (str.length + 1);
      if (cnt > sp) {
        let ll: number = sp - last_col;
        let ss: string = "";
        while (ll > 0) {
          ss = ss + " ";
          ll = ll - 1;
        }
        return ss;
      }
      last_col = cnt;
    }
    return "";
  }
  getColumn(sp: number): number {
    let cnt: number = 0;
    let last_col: number = 0;
    for (let i = 0; i < this.lines.length; i++) {
      var str = this.lines[i];
      cnt = cnt + (str.length + 1);
      if (cnt > sp) {
        return sp - last_col;
      }
      last_col = cnt;
    }
    return -1;
  }
}
