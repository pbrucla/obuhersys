function identity(s) {
  return s;
}

function main() {
  const value1 = identity("value");
  const value2 = identity("secret value");
  let output;

  const condition = 1;
  if (condition > 1) {
    output = "The value is: " + value2;
  } else {
    output = "The value is: " + value1;
  }

  console.log(output);
}

main();
