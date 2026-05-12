# Data Quality Report

## Dataset overview

- Rows: 8
- Columns: 6
- Memory usage: 0.001 MB

## Missing values

| column         |   missing_count |   missing_percent |
|:---------------|----------------:|------------------:|
| age            |               1 |              12.5 |
| revenue        |               1 |              12.5 |
| signup_channel |               1 |              12.5 |
| customer_id    |               0 |               0   |
| city           |               0 |               0   |
| is_active      |               0 |               0   |

## Duplicate rows

- Duplicate count: 0
- Duplicate percentage: 0.0%

## Constant columns

No constant columns detected.

## Column types

| column         | dtype   |   unique_values |
|:---------------|:--------|----------------:|
| customer_id    | int64   |               8 |
| age            | float64 |               5 |
| city           | str     |               5 |
| revenue        | float64 |               6 |
| signup_channel | str     |               3 |
| is_active      | bool    |               2 |

## First recommendations

- Review columns with missing values before modeling or reporting.
- Validate categorical variables with high cardinality.
- Check duplicate logic depending on the business definition of a duplicated record.
- Confirm numerical variable units and expected ranges.
