class Inter2Context {
  static main() {
    const value1 = Inter2Context.identity("secret value");
    const value2 = Inter2Context.identity("non secret value");

    Inter2Context.method(value1);
  }

  static identity(s) {
    return s;
  }

  static method(str) {
    console.log(str);
  }
}

Inter2Context.main();
