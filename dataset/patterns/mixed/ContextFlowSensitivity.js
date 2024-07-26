function identity(s) {
    return s;
}

function main() {
    let value1 = identity("secret value");
    let value2 = identity("non secret value");

    console.log(value2);

    value2 = identity("secret value");
}

main();