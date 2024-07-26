class Class1 {
    constructor() {
        this.string1 = "";
        this.string2 = "";
    }
}

function main() {
    const classObject = new Class1();
    classObject.string1 = "secret value";
    classObject.string2 = "value";
    let output;

    const condition = 1;
    if (condition > 0) {
        output = "The value is: " + classObject.string2;
    } else {
        output = "The value is: " + classObject.string1;
    }

    console.log(output);
}

main();