document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("checkGrammar").addEventListener("click", () => {
        showLoadingEffect();
        setTimeout(() => {
            processGrammar();
        }, 1000);
    });

    document.getElementById("toggleDarkMode").addEventListener("click", toggleDarkMode);
});

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

    // Convert input grammar into structured format
    let grammar = parseGrammar(grammarText);

    // Step 1: Remove Left Recursion
    let updatedGrammar = removeLeftRecursion(grammar);
    outputDiv.innerHTML = `<b>Step 1: Grammar after Removing Left Recursion</b><br><pre>${formatGrammar(updatedGrammar)}</pre><br>`;

    // Step 2: Compute FIRST Sets
    let firstSets = computeFirstSets(updatedGrammar);
    outputDiv.innerHTML += `<b>Step 2: FIRST Sets</b><br>${formatSetOutput(firstSets)}<br><br>`;

    // Step 3: Compute FOLLOW Sets
    let followSets = computeFollowSets(updatedGrammar, firstSets);
    outputDiv.innerHTML += `<b>Step 3: FOLLOW Sets</b><br>${formatSetOutput(followSets)}<br><br>`;

    // Step 4: Construct LL(1) Parsing Table
    let parsingTable = constructLL1Table(updatedGrammar, firstSets, followSets);
    outputDiv.innerHTML += `<b>Step 4: LL(1) Parsing Table</b><br>${formatParsingTable(parsingTable)}<br><br>`;

    outputDiv.style.opacity = 1;
}

// Step 1: Parse Input Grammar (BNF to structured format)
function parseGrammar(input) {
    let lines = input.split("\n");
    let grammar = {};

    lines.forEach(line => {
        let [nt, productions] = line.split("->").map(s => s.trim());
        let rules = productions.split("|").map(rule => rule.trim().split(" "));
        grammar[nt] = rules;
    });

    return grammar;
}

// Step 2: Remove Left Recursion
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

// Step 3: Compute FIRST Sets
function computeFirstSets(grammar) {
    let first = {};
    for (let nt in grammar) {
        first[nt] = new Set();
    }

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
                        } else {
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

// Step 4: Compute FOLLOW Sets
function computeFollowSets(grammar, firstSets) {
    let follow = {};
    for (let nt in grammar) {
        follow[nt] = new Set();
    }
    follow[Object.keys(grammar)[0]].add("$");

    let changed = true;
    while (changed) {
        changed = false;
        for (let nt in grammar) {
            for (let production of grammar[nt]) {
                let trailer = new Set(follow[nt]);

                for (let i = production.length - 1; i >= 0; i--) {
                    let symbol = production[i];

                    if (!isTerminal(symbol)) {
                        let beforeSize = follow[symbol].size;
                        follow[symbol] = new Set([...follow[symbol], ...trailer]);

                        if (firstSets[symbol].has("ε")) {
                            trailer = new Set([...trailer, ...firstSets[symbol]]);
                            trailer.delete("ε");
                        } else {
                            trailer = new Set(firstSets[symbol]);
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

// Step 5: Construct LL(1) Parsing Table
function constructLL1Table(grammar, firstSets, followSets) {
    let table = {};

    for (let nt in grammar) {
        table[nt] = {};
        for (let production of grammar[nt]) {
            let firstSet = new Set();

            if (isTerminal(production[0]) || production[0] === "ε") {
                firstSet.add(production[0]);
            } else {
                for (let symbol of production) {
                    firstSet = new Set([...firstSet, ...firstSets[symbol]]);
                    if (!firstSets[symbol].has("ε")) break;
                }
            }

            for (let terminal of firstSet) {
                if (terminal !== "ε") {
                    table[nt][terminal] = production.join(" ");
                }
            }

            if (firstSet.has("ε")) {
                for (let terminal of followSets[nt]) {
                    table[nt][terminal] = production.join(" ");
                }
            }
        }
    }

    return table;
}

// Utility Functions
function isTerminal(symbol) {
    return !symbol.match(/^[A-Z]$/);
}

function formatGrammar(grammar) {
    return Object.entries(grammar)
        .map(([key, value]) => `${key} -> ${value.map(r => r.join(" ")).join(" | ")}`)
        .join("<br>");
}

function formatSetOutput(setObject) {
    return Object.entries(setObject)
        .map(([key, value]) => `${key}: { ${[...value].join(", ")} }`)
        .join("<br>");
}

function formatParsingTable(table) {
    let result = `<table border='1'><tr><th>Non-Terminal</th>`;

    let terminals = new Set();
    for (let nt in table) for (let t in table[nt]) terminals.add(t);
    terminals = [...terminals];

    terminals.forEach(terminal => result += `<th>${terminal}</th>`);
    result += "</tr>";

    for (let nt in table) {
        result += `<tr><td>${nt}</td>`;
        terminals.forEach(terminal => {
            result += `<td>${table[nt][terminal] || ""}</td>`;
        });
        result += "</tr>";
    }

    result += "</table>";
    return result;
}
