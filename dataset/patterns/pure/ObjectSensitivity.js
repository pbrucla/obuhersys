class DataObject {
    constructor() {
        this.value = "";
    }
}

function main() {
    const dataObject1 = new DataObject();
    const dataObject2 = new DataObject();
    dataObject1.value = "secret value";
    dataObject2.value = "non secret value";

    console.log(dataObject1.value);
}

main();