document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("checkGrammar").addEventListener("click", () => {
        showLoadingEffect();
        setTimeout(() => {
            processGrammar();
        }, 1000);
    });
    document.getElementById("parseString").addEventListener("click", () => {
        let inputString = document.getElementById("stringInput").value.trim();
        if (!inputString) {
            alert("Please enter a string to parse.");
            return;
        }
        parseInputString(inputString);
    });
});

// Function to parse the input string using LL(1) table
function parseInputString(input) {
    let parsingTable = window.parsingTable;
    let startSymbol = window.startSymbol;
    let stack = ["$", startSymbol];
    let inputTokens = input.split(" ").concat(["$"]);

    let output = `<b>Parsing Steps:</b><br><table border='1' cellspacing='0' cellpadding='5' style='border-collapse: collapse; text-align: center;'><tr><th>Stack</th><th>Input</th><th>Action</th></tr>`;

    while (stack.length > 0) {
        let top = stack.pop();
        let currentInput = inputTokens[0];

        output += `<tr><td>${stack.join(" ") || "ε"}</td><td>${inputTokens.join(" ")}</td>`;

        if (top === currentInput) {
            inputTokens.shift();
            output += `<td>Match ${top}</td></tr>`;
        } else if (parsingTable[top] && parsingTable[top][currentInput]) {
            let production = parsingTable[top][currentInput].split(" ");
            if (production[0] !== "ε") stack.push(...production.reverse());
            output += `<td>${top} → ${production.join(" ")}</td></tr>`;
        } else {
            output += `<td style="color:red;">Error! No rule for ${top} with input ${currentInput}</td></tr>`;
            document.getElementById("stringOutput").innerHTML = output + "</table><br><b style='color:red;'>❌ String Rejected</b>";
            return;
        }
    }

    document.getElementById("stringOutput").innerHTML = output + "</table><br><b style='color:green;'>✅ String Accepted</b>";
}

function showLoadingEffect() {
    const outputDiv = document.getElementById("output");
    outputDiv.style.opacity = 0;
    outputDiv.innerHTML = "🔄 Processing grammar...";
    setTimeout(() => {
        outputDiv.style.opacity = 1;
    }, 300);
}

function processGrammar() {
    const outputDiv = document.getElementById("output");
    let grammarText = document.getElementById("grammarInput").value.trim();

    if (!grammarText) {
        outputDiv.innerHTML = "❌ Please enter a grammar.";
        return;
    }

    let grammar = parseGrammar(grammarText);
    let updatedGrammar = removeLeftRecursion(grammar);
    outputDiv.innerHTML = `<b>Step 1: Grammar after Removing Left Recursion</b><br><pre>${formatGrammar(updatedGrammar)}</pre><br>`;

    let firstSets = computeFirstSets(updatedGrammar);
    outputDiv.innerHTML += `<b>Step 2: FIRST Sets</b><br>${formatSetOutput(firstSets)}<br><br>`;

    let followSets = computeFollowSets(updatedGrammar, firstSets);
    outputDiv.innerHTML += `<b>Step 3: FOLLOW Sets</b><br>${formatSetOutput(followSets)}<br><br>`;

    let parsingTable = constructLL1Table(updatedGrammar, firstSets, followSets);
    outputDiv.innerHTML += `<b>Step 4: LL(1) Parsing Table</b><br>${formatParsingTable(parsingTable)}<br><br>`;

    if (detectConflicts(parsingTable)) {
        outputDiv.innerHTML += `<b style="color:red;">❌ Grammar is NOT LL(1)</b>`;
    } else {
        outputDiv.innerHTML += `<b style="color:green;">✅ Grammar is LL(1)</b>`;
    }

    // ✅ Store globally so parseInputString() can access it
    window.parsingTable = parsingTable;
    window.startSymbol = Object.keys(updatedGrammar)[0];  // First non-terminal is the start symbol

    outputDiv.style.opacity = 1;
}

function parseGrammar(input) {
    let lines = input.split("\n");
    let grammar = {};

    lines.forEach(line => {
        let parts = line.split("->");
        if (parts.length !== 2) return;
        
        let [nt, productions] = parts.map(s => s.trim());
        let rules = productions.split("|").map(rule => rule.trim().split(" "));
        grammar[nt] = rules;
    });

    return grammar;
}

function removeLeftRecursion(grammar) {
    let newGrammar = {};

    Object.keys(grammar).forEach(nt => {
        let alpha = [];
        let beta = [];

        grammar[nt].forEach(prod => {
            if (prod[0] === nt) {
                alpha.push(prod.slice(1));
            } else {
                beta.push(prod);
            }
        });

        if (alpha.length > 0) {
            let newNT = `${nt}'`;
            newGrammar[nt] = beta.map(rule => [...rule, newNT]);
            newGrammar[newNT] = alpha.map(rule => [...rule, newNT]);
            newGrammar[newNT].push(["ε"]);
        } else {
            newGrammar[nt] = grammar[nt];
        }
    });

    return newGrammar;
}

function computeFirstSets(grammar) {
    let first = {};
    for (let nt in grammar) first[nt] = new Set();

    let changed = true;
    while (changed) {
        changed = false;
        for (let nt in grammar) {
            for (let production of grammar[nt]) {
                let beforeSize = first[nt].size;
                if (isTerminal(production[0]) || production[0] === "ε") {
                    first[nt].add(production[0]);
                } else {
                    for (let symbol of production) {
                        if (isTerminal(symbol)) {
                            first[nt].add(symbol);
                            break;
                        }
                        if (first[symbol]) {
                            first[nt] = new Set([...first[nt], ...first[symbol]]);
                            if (!first[symbol].has("ε")) break;
                        }
                    }
                }
                if (first[nt].size !== beforeSize) changed = true;
            }
        }
    }
    return first;
}

function computeFollowSets(grammar, firstSets) {
    let follow = {};
    for (let nt in grammar) follow[nt] = new Set();
    const startSymbol = Object.keys(grammar)[0];  // Get the first non-terminal as start symbol

    if (!follow[startSymbol]) {
        follow[startSymbol] = new Set();  // Ensure follow[startSymbol] is initialized
    }
    
    follow[startSymbol].add("$");  // Now it's safe to call .add()
    
    let changed = true;
    while (changed) {
        changed = false;
        for (let nt in grammar) {
            for (let production of grammar[nt]) {
                let trailer = new Set(follow[nt]);

                for (let i = production.length - 1; i >= 0; i--) {
                    let symbol = production[i];
                    if (!isTerminal(symbol)) {
                        if (!follow[symbol]) follow[symbol] = new Set();  // ✅ Fix here
                        
                        let beforeSize = follow[symbol].size;
                        follow[symbol] = new Set([...follow[symbol], ...trailer]);

                        if (firstSets[symbol] && firstSets[symbol].has("ε")) {
                            trailer = new Set([...trailer, ...firstSets[symbol]]);
                            trailer.delete("ε");
                        } else {
                            trailer = new Set(firstSets[symbol] || []);
                        }

                        if (follow[symbol].size !== beforeSize) changed = true;
                    } else {
                        trailer = new Set([symbol]);
                    }
                }
            }
        }
    }
    return follow;
}


function constructLL1Table(grammar, firstSets, followSets) {
    let table = {};
    for (let nt in grammar) table[nt] = {};

    for (let nt in grammar) {
        for (let production of grammar[nt]) {
            let firstSet = new Set();
            if (isTerminal(production[0]) || production[0] === "ε") {
                firstSet.add(production[0]);
            } else {
                for (let symbol of production) {
                    if (firstSets[symbol]) {
                        firstSet = new Set([...firstSet, ...firstSets[symbol]]);
                        if (!firstSets[symbol].has("ε")) break;
                    }
                }
            }

            for (let terminal of firstSet) {
                if (terminal !== "ε") {
                    if (table[nt][terminal]) table[nt][terminal] += `, ${production.join(" ")}`;
                    else table[nt][terminal] = production.join(" ");
                }
            }

            if (firstSet.has("ε")) {
                for (let terminal of followSets[nt]) {
                    if (table[nt][terminal]) table[nt][terminal] += `, ${production.join(" ")}`;
                    else table[nt][terminal] = production.join(" ");
                }
            }
        }
    }
    return table;
}

function detectConflicts(table) {
    for (let nt in table) {
        for (let terminal in table[nt]) {
            if (table[nt][terminal].includes(",")) {
                return true;  // 🚨 Conflict detected due to multiple productions!
            }
        }
    }
    return false;  // ✅ No conflicts found!
}


function isTerminal(symbol) {
    return !/^[A-Z][0-9']*$/.test(symbol);
}

function formatGrammar(grammar) {
    return Object.entries(grammar).map(([key, value]) => `${key} -> ${value.map(r => r.join(" ")).join(" | ")}`).join("<br>");
}

function formatSetOutput(setObject) {
    return Object.entries(setObject).map(([key, value]) => `${key}: { ${[...value].join(", ")} }`).join("<br>");
}

function formatParsingTable(table) {
    let result = `<table border='1' cellspacing='0' cellpadding='5' style='border-collapse: collapse; text-align: center;'>
                    <tr>
                        <th>Non-Terminal</th>`;

    let terminals = new Set();
    for (let nt in table) for (let terminal in table[nt]) terminals.add(terminal);

    terminals.forEach(terminal => result += `<th>${terminal}</th>`);
    result += "</tr>";

    for (let nt in table) {
        result += `<tr><td><b>${nt}</b></td>`;
        terminals.forEach(terminal => result += `<td>${table[nt][terminal] || "-"}</td>`);
        result += "</tr>";
    }

    result += "</table>";
    return result;
}

// Store globally so parseInputString can access them
window.parsingTable = parsingTable;
window.startSymbol = Object.keys(updatedGrammar)[0];  // First non-terminal is the start symbol
