# LL(1) Grammar Analyzer

## Overview
This LL(1) Grammar Analyzer checks whether a given grammar is LL(1), computes FIRST and FOLLOW sets, and generates an LL(1) parsing table. Users can input a grammar in JSON format, and the tool will analyze it step by step.

## How to Use
1. **Enter the Grammar in JSON Format** - Provide a grammar with non-terminals as keys and their corresponding productions as arrays.
2. **Click the Check Grammar Button** - The tool will process the input and generate the required analysis.
3. **View the Results** - The tool displays:
   - FIRST sets
   - FOLLOW sets
   - LL(1) Parsing Table
   - Whether the grammar is LL(1) or not

## Sample Grammar Inputs
Use the following example JSON grammars to test the tool:

### Example 1: Simple LL(1) Grammar
```json
{
  "S": [["a", "A"]],
  "A": [["b", "A"], ["c"]]
}
```

### Example 2: Grammar with ε-productions
```json
{
  "S": [["A", "b"], ["c"]],
  "A": [["ε"], ["a"]]
}
```

### Example 3: Grammar with Potential Conflicts
```json
{
  "S": [["A", "B"], ["a"]],
  "A": [["a"], ["b"]],
  "B": [["b"]]
}
```

## Output Format
- The **FIRST and FOLLOW sets** are displayed in a structured format.
- The **LL(1) Parsing Table** is shown as a table.
- If conflicts exist, they are highlighted in the table.

## Notes
- The tool assumes terminals are lowercase and non-terminals are uppercase.
- The start symbol is the first key in the JSON object.
- The end-of-input symbol `$` is automatically included in the FOLLOW set of the start symbol.

## Author
This tool was created to help users understand and analyze LL(1) grammars efficiently.

