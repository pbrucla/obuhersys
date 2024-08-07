# Obuhersys: Dynamic Analysis of Cryptographic API Misuse in NodeJS

_to be published in [MIT URTC 2024](https://urtc.mit.edu/)_

Obuhersys is a dynamic analysis framework for detecting cryptographic API misuses in NodeJS software.

It features two methods to dynamically log API misuses at runtime with low overhead:
- [ofunc](ofunc/), which inject logging calls by doing AST transformations on the source code, and
- [oproxy](oproxy/), which inject logging calls by wrapping the Node Standard Library using JavaScript's Proxy class

The output of either logger can then be run through our [checker](oproxy/src/log/index.ts) and [ruleset](oproxy/src/tests/checks.js) to report any API misuses!

It also features a [benchmark for cryptographic API misuse detection in NodeJS](dataset/) which is a port of the wonderful [CamBench Analysis Capabilities benchmark](https://github.com/CROSSINGTUD/CamBench/tree/main/CamBench_Cap) written for Java.

## Usage

In the future, this project will be published to `npm` with a easy-to-use CLI. For now, use a local installation.

First, clone the repository
```shell
gh repo clone pbrucla/obuhersys
cd obuhersys
```

Next, build each subproject

```shell
cd oproxy && pnpm install && pnpm build
cd ofunc && pnpm install && pnpm build

# shell variables to be used later
export oproxy=$(realpath oproxy/)
export ofunc=$(realpath ofunc/)
```

Ensure you are using node v20
```shell
nvm use 20
```

Navigate to the directory containing your JavaScript project.

First make a `logs` directory
```shell
mkdir -p logs
```

Then you may choose between oproxy and ofunc for dynamic analysis.
Identical results should be produced although oproxy is slightly faster than ofunc.

To use oproxy (recommended),
```shell
node --import $oproxy/dist/index.js yourentrypoint.js
```

To use ofunc,
```shell
node --import $ofunc/dist/index.js yourentrypoint.js
```

After running the dynamic analysis, a logfile will be created in `logs/` to analyze.
Below command will analyze the log and output violations found:
```shell
node $oproxy/dist/log/index.js -c $oproxy/src/tests/checks.js <your log file>
```

## Developers

Developed by [Psi Beta Rho @ UCLA](https://github.com/pbrucla)
