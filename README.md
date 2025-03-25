# LL(1) Parser

This project allows users to input a grammar in **BNF format**, eliminates left recursion, computes **FIRST & FOLLOW** sets, constructs an **LL(1) parsing table**, and **parses input strings** based on the generated table.

## Features
- Input grammar in **BNF format**
- Left recursion elimination
- Compute **FIRST & FOLLOW** sets
- Generate **LL(1) parsing table**
- **Parse input strings** and validate against the LL(1) grammar

## How to Use
1. Enter grammar in **BNF format**
2. Click **'Analyze'** to process the grammar
3. View **FIRST, FOLLOW, and LL(1) parsing table** results
4. Enter a string to parse and check if it is accepted by the LL(1) grammar

## Example Grammar
E -> E + T | T
T -> T * F | F
F -> ( E ) | id


## Example Input String
id + id * id

**Valid (Accepted by LL(1) grammar)**  

## Error Example (Conflict in Grammar)
S -> A | a
A -> a

## Technologies Used
- HTML
- CSS
- JavaScript
