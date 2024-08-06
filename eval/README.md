# Evaluation Infra

This directory has the scripts used to evaluate our dynamic analysis on our port of cambench.

## Usage

This script requires `pydantic` and `pyyaml`. Install through `pip`.

```
rm -rf logs
python3 evaluate.py ./examplecmd
```

`examplecmd` is a file with an example for how a command should be written.

It takes in `OBU_TESTFILE` (js test file to evaluate) and `OBU_KEY` environment variables.

To make a judgement, it outputs `<OBU_KEY> yes` to `stderr` if the usage is secure and `<OBU_KEY> no` if the usage is insecure.
