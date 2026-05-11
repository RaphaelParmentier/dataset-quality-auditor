import pandas as pd

from src.data_quality import run_data_quality_checks

df = pd.read_csv("data/sample_custumers.csv")

report = run_data_quality_checks(df)

print("DATASET OVERVIEW")
print(report["overview"])

print("\nMISSING VALUES")
print(report["missing_values"])

print("\nDUPLICATES")
print(report["duplicates"])

print("\nCONSTANT COLUMNS")
print(report["constant_columns"])

print("\nCOLUMN TYPES")
print(report["column_types"])