class Class1 {
  constructor() {
    this.value1 = "";
    this.value2 = "";
  }
}

function main() {
  const classObject = new Class1();
  classObject.value1 = "secret value";
  classObject.value2 = "non secret value";

  console.log(classObject.value1);
}

main();
