class Inter2Object {
    static main() {
        const dataObject1 = new Inter2Object.DataObject();
        const dataObject2 = new Inter2Object.DataObject();
        dataObject1.value = "secret value";
        dataObject2.value = "non secret value";

        Inter2Object.method(dataObject2.value);
    }

    static method(str) {
        console.log(str);
    }
}

Inter2Object.DataObject = class {
    constructor() {
        this.value = "";
    }
};

Inter2Object.main();