# Evaluation Infra

This directory has the scripts used to evaluate our dynamic analysis on our port of CamBench.

## Usage

These scripts requires `pydantic` and `pyyaml`. Install through `pip` or with `poetry install`.

```
rm -rf logs
python3 evaluate.py ./examplecmd
```

`examplecmd` is a file with an example for how a command should be written.

It takes in the environment variables `OBU_TESTFILE` (a js test file to evaluate), `OBU_TESTCASE` (a unique identifier for the test), and an `OBU_KEY`.

To make a judgement, it should output `<OBU_KEY> yes` to `stderr` if the usage is secure and `<OBU_KEY> no` if the usage is insecure.
