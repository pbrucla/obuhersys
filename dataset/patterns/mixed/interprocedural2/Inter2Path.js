class Inter2Path {
  static main() {
    const condition = 1;

    if (condition > 0) {
      Inter2Path.method("non secret value");
    } else {
      Inter2Path.method("secret value");
    }
  }

  static method(str) {
    console.log(str);
  }
}

Inter2Path.main();
