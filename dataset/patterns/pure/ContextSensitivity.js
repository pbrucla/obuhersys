class ContextSensitivity {
  static main() {
    const value1 = ContextSensitivity.Identity("secret value");
    const value2 = ContextSensitivity.Identity("non secret value");

    console.log(value1);
  }

  static Identity(s) {
    return s;
  }
}

ContextSensitivity.main();
