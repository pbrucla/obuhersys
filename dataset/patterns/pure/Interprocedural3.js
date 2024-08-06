class Interprocedural3 {
  static main() {
    const value = "secret value";
    this.method1(value);
  }

  static method1(str1) {
    const value2 = str1;
    this.method2(value2);
  }

  static method2(str2) {
    console.log(str2);
  }
}

Interprocedural3.main();
