document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("checkGrammar").addEventListener("click", () => {
        showLoadingEffect();
        setTimeout(() => {
            analyzeGrammar();
        }, 1000);
    });

    document.getElementById("toggleDarkMode").addEventListener("click", toggleDarkMode);
    applySavedTheme();
});

function showLoadingEffect() {
    const outputDiv = document.getElementById("output");
    outputDiv.style.opacity = 0;
    outputDiv.innerHTML = "🔄 Checking grammar step by step...";
    setTimeout(() => {
        outputDiv.style.opacity = 1;
    }, 300);
}

function analyzeGrammar() {
    const outputDiv = document.getElementById("output");
    let grammarText = document.getElementById("grammarInput").value;
    let grammar;

    try {
        grammar = JSON.parse(grammarText);
    } catch (error) {
        outputDiv.innerHTML = "❌ Invalid Grammar Format! Please enter valid JSON.";
        return;
    }

    // Step 1: Compute FIRST Sets
    let firstSets = computeFirstSets(grammar);
    outputDiv.innerHTML = `<b>Step 1: FIRST Sets</b><br> ${formatSetOutput(firstSets)}<br><br>`;

    // Step 2: Compute FOLLOW Sets
    let followSets = computeFollowSets(grammar, firstSets);
    outputDiv.innerHTML += `<b>Step 2: FOLLOW Sets</b><br> ${formatSetOutput(followSets)}<br><br>`;

    // Step 3: Construct LL(1) Parsing Table
    let parsingTable = constructLL1Table(grammar, firstSets, followSets);
    outputDiv.innerHTML += `<b>Step 3: LL(1) Parsing Table</b><br> ${formatParsingTable(parsingTable)}<br><br>`;

    outputDiv.style.opacity = 1;
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    // Store user preference in local storage
    const isDarkMode = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
}

// Apply saved theme on page load
function applySavedTheme() {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "enabled") {
        document.body.classList.add("dark-mode");
    }
}

// Step 1: Compute FIRST Sets
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

// Step 2: Compute FOLLOW Sets
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

// Step 3: Construct LL(1) Parsing Table (Conflicts shown in the table)
function constructLL1Table(grammar, firstSets, followSets) {
    let table = {};

    for (let nt in grammar) {
        table[nt] = {};
        for (let production of grammar[nt]) {
            let firstSet = new Set();

            // Compute FIRST(α) for the production
            if (isTerminal(production[0]) || production[0] === "ε") {
                firstSet.add(production[0]);
            } else {
                for (let symbol of production) {
                    firstSet = new Set([...firstSet, ...firstSets[symbol]]);
                    if (!firstSets[symbol].has("ε")) break;
                }
            }

            // Populate the table using FIRST set
            for (let terminal of firstSet) {
                if (terminal !== "ε") {
                    if (!table[nt][terminal]) {
                        table[nt][terminal] = production;
                    } else {
                        table[nt][terminal] = `⚠ Conflict! (${table[nt][terminal]} / ${production})`;
                    }
                }
            }

            // If ε is in FIRST, use FOLLOW set
            if (firstSet.has("ε")) {
                for (let terminal of followSets[nt]) {
                    if (!table[nt][terminal]) {
                        table[nt][terminal] = production;
                    } else {
                        table[nt][terminal] = `⚠ Conflict! (${table[nt][terminal]} / ${production})`;
                    }
                }
            }
        }
    }

    return table;
}

// Helper Functions
function isTerminal(symbol) {
    return !symbol.match(/^[A-Z]$/);
}

function formatSetOutput(setObject) {
    return Object.entries(setObject)
        .map(([key, value]) => `${key}: { ${[...value].join(", ")} }`)
        .join("<br>");
}

function formatParsingTable(table) {
    let terminals = new Set();
    let nonTerminals = Object.keys(table);

    // Collect all terminals from the parsing table
    for (let nt in table) {
        for (let terminal in table[nt]) {
            terminals.add(terminal);
        }
    }

    terminals = [...terminals]; // Convert set to array

    // Start building the table
    let result = `<table border='1'>
        <tr>
            <th>Non-Terminal</th>`;

    // Create terminal headers
    for (let terminal of terminals) {
        result += `<th>${terminal}</th>`;
    }
    result += `</tr>`;

    // Populate rows with productions
    for (let nt of nonTerminals) {
        result += `<tr><td>${nt}</td>`;

        for (let terminal of terminals) {
            let production = table[nt][terminal] || ""; // Empty if no production
            
            // Highlight conflicts directly in the table
            let cellClass = production.includes("⚠ Conflict!") ? "conflict-cell" : (production ? "valid-cell" : "");

            result += `<td class="${cellClass}">${production}</td>`;
        }

        result += `</tr>`;
    }

    result += "</table>";
    return result;
}
