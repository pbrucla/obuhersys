class DataObject {
    constructor() {
        this.internalData = "";
    }
}

function main() {
    const dataObject1 = new DataObject();
    const dataObject2 = new DataObject();
    dataObject1.internalData = "secret value";
    dataObject2.internalData = "value";
    let output;

    const condition = 1;
    if (condition > 0) {
        output = "The output is: " + dataObject1.internalData;
    } else {
        output = "The output is: " + dataObject2.internalData;
    }

    console.log(output);
}

main();