function identity(s) {
  return s;
}

class Class1 {
  constructor() {
    this.value1 = "";
    this.value2 = "";
  }
}

function main() {
  const classObject = new Class1();
  classObject.value1 = identity("secret value");
  classObject.value2 = identity("non secret value");

  console.log(classObject.value1);
}

main();
