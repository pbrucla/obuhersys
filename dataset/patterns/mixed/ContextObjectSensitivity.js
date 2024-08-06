function getDataObject(value) {
  const dataObject = new DataObject();
  dataObject.internalData = value;
  return dataObject;
}

class DataObject {
  constructor() {
    this.internalData = "";
  }
}

function main() {
  const dataObject1 = getDataObject("secret value");
  const dataObject2 = getDataObject("non secret value");

  console.log(dataObject2.internalData);
}

main();
