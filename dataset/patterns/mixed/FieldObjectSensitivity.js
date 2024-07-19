class DataObject {
    constructor() {
        this.value1 = "";
        this.value2 = "";
    }
}

function main() {
    const dataObject1 = new DataObject();
    const dataObject2 = new DataObject();
    
    dataObject1.value1 = "secret value";
    dataObject2.value1 = "non secret value";
    dataObject1.value2 = "non secret value";
    dataObject2.value2 = "secret value";

    console.log(dataObject2.value2);
}

main();