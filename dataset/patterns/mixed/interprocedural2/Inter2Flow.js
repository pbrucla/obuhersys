class Inter2Flow {
    static main() {
        let value = "non secret value";
        Inter2Flow.method(value);
        value = "secret value";
    }

    static method(str) {
        console.log(str);
    }
}

Inter2Flow.main();