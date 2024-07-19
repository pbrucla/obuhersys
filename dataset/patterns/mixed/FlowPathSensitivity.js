function main() {
    let value = "secret value";

    const condition = 1;
    if (condition > 0) {
        value = "non secret value";
    } else {
        value = "secret value";
    }

    console.log(value); // Use console.log instead of print
}

main();