# LL(1) Parser

This project allows users to input a grammar in BNF format, performs left recursion elimination, calculates FIRST & FOLLOW sets, and constructs an LL(1) parsing table.

## Features
- Input grammar in BNF format
- Left recursion elimination
- Compute FIRST & FOLLOW sets
- Generate LL(1) parsing table

## How to Use
1. Enter grammar in BNF format
2. Click 'Analyze' to process the grammar
3. View FIRST, FOLLOW, and LL(1) parsing table results

## Example Grammar
E -> E + T | T
T -> T * F | F
F -> ( E ) | id

## Technologies Used
- HTML
- CSS (Monochrome Theme)
- JavaScript
