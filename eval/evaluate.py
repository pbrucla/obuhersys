import os
from argparse import ArgumentParser
from pathlib import Path
from subprocess import PIPE, Popen, TimeoutExpired

import yaml
from pydantic import BaseModel, Field

dataset = Path(__file__).parent.parent / "dataset"


class TestCase(BaseModel):
    # filename of test file in same directory
    filename: str

    # description field is optional
    description: str | None = Field(default_factory=lambda: None)

    # whether the test case is a secure api usage or not
    secure: bool


def main():
    parser = ArgumentParser()
    parser.add_argument(
        "--fix", help="open editor/shell to fix broken yaml", action="store_true"
    )
    parser.add_argument("--dry", help="dry run", action="store_true")
    parser.add_argument("testcmd", help="cmd used to test a file")
    args = parser.parse_args()

    correct_count = 0
    total_count = 0

    for meta_yaml in dataset.rglob("*.yml"):
        try:
            meta = yaml.safe_load(meta_yaml.read_text())
        except Exception as e:
            print(meta_yaml, "is not valid yaml")
            print(e)
            if args.fix:
                os.system("$EDITOR " + str(meta_yaml))
                continue
            exit(1)

        if meta is None:
            continue
        if not isinstance(meta, list):
            print(meta_yaml, "does not contain list in root")
            exit(1)

        for test_case in meta:
            try:
                test_case = TestCase(**test_case)
            except Exception as e:
                print("Error in test case", repr(test_case))
                print(e)
                exit(1)

            test_file = meta_yaml.parent / test_case.filename
            if not test_file.exists():
                print(test_file, "missing")
                print("(declared in", meta_yaml, ")")
                if not args.fix:
                    exit(1)
                cwd = Path.cwd()
                os.chdir(meta_yaml.parent)
                os.system("bash")
                os.chdir(cwd)
                continue
            if args.dry:
                continue

            # run test case
            key = os.urandom(8).hex()
            os.environ["OBU_TESTFILE"] = str(test_file.absolute())
            os.environ["OBU_KEY"] = key
            p = Popen([args.testcmd], stdin=PIPE, stdout=PIPE, stderr=PIPE)
            try:
                outs, errs = p.communicate(timeout=5)
            except TimeoutExpired:
                p.kill()
                outs, errs = p.communicate(timeout=5)

            ret_secure = any(
                "yes" in line and key in line
                for line in errs.decode().split("\n")
            )
            correct = ret_secure == test_case.secure
            correct_count += correct
            total_count += 1
            emote = "✅" if correct else "❌"
            print(emote, test_file.relative_to(dataset))

    print(f"Passed {correct_count}/{total_count}")


if __name__ == "__main__":
    main()
