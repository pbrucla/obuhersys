const crypto = require("node:crypto");

let potato = "aaaaaa";
const tomato = () => {
  console.log(potato);
};

potato = "bbbbb";
potato = "ccccc";
tomato();
tomato();
tomato();
