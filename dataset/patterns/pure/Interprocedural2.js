class Interprocedural2 {
  static main() {
    const value = "secret value";
    this.method(value);
  }

  static method(str) {
    console.log(str);
  }
}

Interprocedural2.main();
