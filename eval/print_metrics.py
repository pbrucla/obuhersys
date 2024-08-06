"""
Usage: python3 print_metrics.py results1.txt results2.txt [... other result files]

This prints out blank column, accuracy, precision, recall, f1 score
of each results file in a row in latex table format.
"""

import sys
from pathlib import Path
import yaml

from evaluate import TestCase

dataset_dir = Path(__file__).parent.parent / "dataset"


def evaluate_metrics(labels, pred):
    """
    "Insecure" marked as True, "Secure" marked as False.
    """
    # Ensure both lists are of the same length
    if len(labels) != len(pred):
        raise ValueError("Both lists must be of the same length")

    # Initialize counts
    tp = fp = tn = fn = 0

    for l, p in zip(labels, pred):
        if l == True and p == True:
            tp += 1
        elif l == True and p == False:
            fn += 1
        elif l == False and p == True:
            fp += 1
        elif l == False and p == False:
            tn += 1
        else:
            raise NotImplementedError("Should never reach here lol")

    # Calculations
    total = len(labels)

    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1_score = (
        (2 * precision * recall) / (precision + recall)
        if (precision + recall) > 0
        else 0
    )

    return (accuracy, precision, recall, f1_score)


# # Example usage
# labels = [True, False, True, True, False]
# pred = [True, False, False, True, False]
# print(evaluate_metrics(labels, pred))
if len(sys.argv) == 1:
    print(__doc__.strip())
    exit()

dataset = dict()

for meta_yaml in dataset_dir.rglob("*.yml"):
    meta = yaml.safe_load(meta_yaml.read_text())
    if meta is None:
        continue
    for test_case in meta:
        test_case = TestCase(**test_case)
        test_file = meta_yaml.parent / test_case.filename
        test_id = str(test_file.relative_to(dataset_dir))
        dataset[test_id] = not test_case.secure

correct = "✅"
incorrect = "❌"

for resfile in sys.argv[1:]:
    with open(resfile, "r") as fin:
        lines = [
            line
            for line in fin.read().split("\n")
            if correct in line or incorrect in line
        ]

    labels = []
    pred = []
    for line in lines:
        result, id_ = line.split()
        lbl = dataset[id_]
        y_hat = lbl if result == correct else not lbl
        labels.append(lbl)
        pred.append(y_hat)
    metrics = [f"{n:.3f}" for n in evaluate_metrics(labels, pred)]
    print("TODO", *metrics, sep=" & ", end=r"\\ \hline" + "\n")
