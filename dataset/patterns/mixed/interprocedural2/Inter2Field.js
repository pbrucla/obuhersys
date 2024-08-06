class Inter2Field {
  static main() {
    const classObject = new Inter2Field.Class1();
    classObject.value1 = "secret value";
    classObject.value2 = "non secret value";

    console.log(classObject.value2);
    Inter2Field.method(classObject.value1);
  }

  static method(str) {
    console.log(str);
  }
}

Inter2Field.Class1 = class {
  constructor() {
    this.value1 = "";
    this.value2 = "";
  }
};

Inter2Field.main();
