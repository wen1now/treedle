/**
 * Represents a tree node.
 * @typedef {Object} TreeNode
 * @property {Map<number, TreeNode>} children
 * @property {word[]} words
 * @property {TreeNode | null} parent
 * @property {word} guess
 */

const SAVE_NAME = "treedle_test"
/** @type {TreeNode} The root of the tree. */
var rootNode;
/** @type {TreeNode[]} A list of all nodes that are incomplete. */
var activeNodes;
/** @type {number} The index of the currently displayed node in activeNodes. */
var displayedNode;
/** @type {string} The current word. */
var _currentWord = "";
/** @type {number} Words left in the tree. */
var remainingWords;


// don't ask why i'm not just using typescript

/**
 * Initialises the game state.
 */
function init() {
    rootNode = {
        children: new Map(),
        words: SECRETS,
        parent: null,
        guess: NULL_WORD,
    };

    activeNodes = [rootNode];
    chooseNewNode();
    displayNode();
    clearCurrentWord();
    remainingWords = SECRETS.length;
}

/**
 * Resets activeNodes.
 */
function setActiveNodes() {
    activeNodes = [];
    var Q = [rootNode];
    while (Q.length) {
        let node = Q.pop();
        if (node.guess == NULL_WORD) {
            activeNodes.push(node);
        }
        node.children.forEach((newNode) => {
            Q.push(newNode)
        })
    }
}

/**
 * Splits a node given a guess, and pushes children to activeNodes.
 * @param {TreeNode} node 
 * @param {string} word 
 * @returns {boolean} Whether the guess was correct.
 */
function splitNode(node, word) {
    let rvalue = false;
    for (w of node.words) {
        let s = diff(w, word);
        if (s == 0) {
            remainingWords--;
            rvalue = true;
            continue;
        };
        if (node.children.has(s)) {
            node.children.get(s).words.push(w);
        } else {
            let newNode = {
                children: new Map(),
                words: [w],
                parent: node,
                guess: NULL_WORD,
            }
            node.children.set(s, newNode)
            activeNodes.push(newNode)
        }
    }
    node.guess = word;
    return rvalue;
}

/**
 * Randomises a new display node.
 */
function chooseNewNode() {
    displayedNode = Math.floor(Math.random() * activeNodes.length);
}

/**
 * Returns the wordle difference, defined to be
 * 
 * sum(c_i * 3^i) over i=0 to i=4,
 * 
 * where c_i is 0 if correct, 1 if wrong position, and 2 if incorrect.
 * @param {string} target 
 * @param {string} guess 
 * @returns {number}
 */
function diff(target, guess) {
    var letters = {};
    var g = z = 0;
    for (let i = 0; i < 5; i++) {
        if (target[i] != guess[i]) {
            letters[target[i]] = (letters[target[i]] || 0) + 1;
        } else {
            g += 1 << i;
        }
    }

    for (let i = 0; i < 5; i++) {
        if (1 << i & g) continue;
        if (letters[guess[i]]) {
            z += 3 ** i;
            letters[guess[i]] -= 1;
        } else {
            z += 3 ** i * 2;
        }
    }

    return z;
}

//modified from https://stackoverflow.com/a/65917797
/**
 * Returns the array of indices in decreasing order.
 * @param {Map<number,*>} map 
 * @returns {number[]}
 */
function sortedKeys(map) {
    return [...map.keys()].sort((a, b) => b - a);
}

/**
 * Converts the current state of the world to a save string.
 * @returns {string}
 */
function getSaveString() {
    var complete = activeNodes.length == 0;
    var s = complete ? ["F_"] : ["P_"];
    var Q = [rootNode];
    while (Q.length) {
        let node = Q.pop();
        if (complete && node.children.size == 0) {
            s.push("_");
        } else {
            s.push(WTC.get(node.guess));
        }
        for (const i of sortedKeys(node.children)) {
            Q.push(node.children.get(i));
        }
    }
    let t = "";
    let c = 0;
    for (let z of s) {
        if (z == "_") { c++ }
        else {
            t += "9".repeat(Math.floor(c/10));
            if (c % 10) { t += (c % 10) - 1}
            t += z;
            c = 0;
        }
    }
    t += "9".repeat(Math.floor(c/10));
    if (c % 10) { t += (c % 10) - 1}
    return t;
}

/**
 * Saves to localStorage.
 */
function save() {
    localStorage.setItem(SAVE_NAME, getSaveString());
}

/**
 * Loads save from localStorage.
 */
function load() {
    let saveString = localStorage.getItem(SAVE_NAME);
    if (saveString === null) {
        // no save exists; i don't think there's anything
        // special i want to do but just in case here is a
        // block to do stuff in
        init();
        return;
    }
    importSave(saveString) || loadError();
}

/**
 * Returns `CTW.get(str.slice(i, j))` if it exists, or null otherwise.
 * @param {string} str 
 * @param {number} i 
 * @param {number} j
 * @returns {word | null}
 */
function ctwStringAux(str, i, j) {
    if (CTW.has(str.slice(i, i + j))) {
        return CTW.get(str.slice(i, i + j));
    } else return null;
}

/**
 * Imports a save. Noet that loadError is NOT called here, and must be
 * handled using the return value of this function.
 * @param {string} saveString 
 * @returns {boolean} Whether the import was successful.
 */
function importSave(saveString) {
    init();
    let headerIndex = saveString.indexOf("_");
    if (headerIndex == -1) {return false}
    let complete = headerIndex[0] == "F";
    let treeString = saveString.slice(headerIndex + 1);
    for (let i = 0; i < 10; i++) {
        treeString = treeString.replaceAll(i, "_".repeat(i + 1));
    }
    if (complete) {
        document.getElementById("completed-popup").style.display = 'flex';
        return true;
    } else {
        let ci = 0;
        let Q = [rootNode];
        qiter:
        while (ci < treeString.length) {
            let currentNode = Q.pop();
            if (currentNode === undefined) return false;
            // leaf is empty
            if (treeString[ci] == "_") {
                ci++;
                continue;
            }
            // code length 2 or 3
            for (const l of [2,3]) {
                let w = ctwStringAux(treeString, ci, l);
                if (w !== null) {
                    ci += l;
                    splitNode(currentNode, w);
                    for (const num of sortedKeys(currentNode.children)){
                        Q.push(currentNode.children.get(num));
                    }
                    continue qiter;
                }
            }
            return false;
        }
        if (Q.length) return false; // yes, i will require strict compatibility
        setActiveNodes();
    }
    return true;
}

/**
 * Displays an error in loading a save.
 */
function loadError() {
    alert(`Error loading save. Click Export to export the corrupted save if you\
    want to recover it; otherwise, click Restart to start over.`)
    init();
}

// UI and Input/Output below

/** Draw the keyboard. */
function setupKeyboard() {
    // Define the rows of keys
    let rows = ["qwertyuiop", "asdfghjkl", ["z","x","c","v","b","n","m","del"]];

    // Get the container element
    let keyboardContainer = document.getElementById("keyarea");

    let rowContainer = document.createElement("div");
    rowContainer.classList.add("keyboard-row");
    // Create a key element
    let keyElement = document.createElement("div");
    keyElement.textContent = "Enter >";
    keyElement.id = 'key-enter';
    keyElement.addEventListener('click', clickedKey);
    keyElement.classList.add("keyboard-enter");
    rowContainer.appendChild(keyElement);
    keyboardContainer.appendChild(rowContainer);

    // Loop through each row
    rows.forEach(row => {
        // Create a row container
        let rowContainer = document.createElement("div");
        rowContainer.classList.add("keyboard-row");

        // Loop through each key in the row
        for (let key of row) {
            // Create a key element
            let keyElement = document.createElement("div");
            keyElement.textContent = key.toUpperCase();
            keyElement.id = 'key-' + key;
            keyElement.addEventListener('click', clickedKey);
            keyElement.classList.add("keyboard-key");

            // Append the key element to the row container
            rowContainer.appendChild(keyElement);
        }

        // Append the row container to the keyboard container
        keyboardContainer.appendChild(rowContainer);
    });
}

function clickedKey(_) {
    key = this.innerHTML.toLowerCase();
    if (key == "del") {
        deleteLetter();
    } else if (key == "enter &gt;") {
        submitCurrentGuess();
    } else {
        submitLetter(key);
    }
}

/** Display the currently active node on the screen. */
function displayNode() {
    document.getElementById('remaining').textContent = remainingWords;
    for (i of "qwertyuiopasdfghjklzxcvbnm") {
        document.getElementById('key-' + i).classList.remove(
            'correct', 'midcorrect', 'incorrect')
    }

    let container = document.getElementById('past-guesses');
    container.replaceChildren();

    if (activeNodes.length == 0) {
        document.getElementById("completed-popup").style.display = 'flex';
        return;
    }

    let currentNode = activeNodes[displayedNode];
    let testWord = currentNode.words[0];
    while (currentNode.parent !== null) {
        currentNode = currentNode.parent;
        appendGuess(container, currentNode.guess, diff(testWord, currentNode.guess));
    }
}

/**
 * Prepend a word to the interface.
 * @param {HTMLElement} outerContainer 
 * @param {word} word 
 * @param {number} score 
 */
function appendGuess(outerContainer, word, score) {
    const container = document.createElement('div');
    container.classList.add('word');

    for (let i = 0; i < 5; i++) {
        const letterDiv = document.createElement('div');
        letterDiv.classList.add('letter');
        let newClass = ['correct', 'midcorrect', 'incorrect'][score % 3];
        letterDiv.classList.add(newClass);
        document.getElementById('key-' + word[i]).classList.add(newClass)
        score = Math.floor(score / 3);

        letterDiv.textContent = word[i].toUpperCase();
        container.appendChild(letterDiv);
    }
    outerContainer.prepend(container);
}

// Some functions for guessing and stuff
/** Submit a letter. */
function submitLetter(letter) {
    if (_currentWord.length == 5 ||
        letter.length !== 1 || !letter.match(/[a-zA-Z]/)){
        return
    }
    _currentWord += letter;
    letter = letter.toLowerCase();
    let letterDiv = document.getElementById('letter-' + _currentWord.length);
    letterDiv.textContent = letter.toUpperCase();
    letterDiv.classList.remove('hide');
}

/** Deletes the last letter. */
function deleteLetter() {
    if (_currentWord.length) {
        document.getElementById('letter-' + _currentWord.length)
            .classList.add('hide')
        _currentWord = _currentWord.slice(0, -1);
    }
}

/** Clears the current guess. */
function clearCurrentWord() {
    _currentWord = "";
    for (let i = 1; i <= 5; i++) {
        document.getElementById('letter-' + i).classList.add('hide')
    }
}

document.addEventListener('keydown', function(event) {
    if (document.getElementById('export-popup').style.display == '' &&
        document.getElementById('import-popup').style.display == '') {
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
            submitLetter(event.key);
        } else if (event.key === 'Enter') {
            submitCurrentGuess();
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
            deleteLetter();
        }
    }
})

function submitCurrentGuess() {
    submitGuess(_currentWord);
}

/**
 * Submits a guess.
 * @param {word} word
 */
function submitGuess(word) {
    word = word.toLowerCase();
    if (!ALL_WORDS.has(word)) {
        invalidGuess();
        return;
    }
    if (splitNode(activeNodes[displayedNode], word)) {
        happyEffect();
    }
    activeNodes.splice(displayedNode, 1);
    chooseNewNode();
    displayNode();
    clearCurrentWord();
    save();
}

var _happyInterval;
function happyEffect() {
    var element = document.getElementById('remaining');
    
    // Apply green text color directly
    element.classList.add('green-text');

    clearTimeout(_happyInterval);

    // After 2 seconds, remove the green color class to start fading out
    _happyInterval = setTimeout(function() {
        // Remove the green color class
        element.classList.remove('green-text');
    }, 2000);
}

var _invalidInterval;
function invalidGuess() {
    document.getElementById('invalid-word-popup').classList.add('visible');
    
    // Automatically hide the alert after 3 seconds
    clearTimeout(_invalidInterval);
    _invalidInterval = setTimeout(() => {
        document.getElementById('invalid-word-popup').classList
            .remove('visible');
    }, 1500);
}

function importClick() {
    document.getElementById('import-popup').style.display = 'flex';
}

function exportClick() {
    document.getElementById('export-content').value = getSaveString();
    document.getElementById('export-popup').style.display = 'flex';
}

function restartClick() {
    document.getElementById('restart-popup').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function(){
    setupKeyboard();
    load();
    chooseNewNode();
    displayNode();

    // Steal more ChatGPT code.
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('export-popup') ||
            event.target === document.getElementById('export-popup-close') ||
            event.target === document.getElementById('export-btn')) {
            document.getElementById('export-popup').style.display = '';
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('completed-popup') ||
            event.target === document.getElementById('completed-popup-close')) {
            document.getElementById('completed-popup').style.display = '';
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('import-popup') ||
            event.target === document.getElementById('import-popup-close') ||
            event.target === document.getElementById('import-btn')) {
            document.getElementById('import-popup').style.display = '';
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('restart-popup') ||
            event.target === document.getElementById('restart-popup-close') ||
            event.target === document.getElementById('restart-btn')) {
            document.getElementById('restart-popup').style.display = '';
        }
    });

    document.getElementById('export-btn').addEventListener('click', () => {
        const blob = new Blob([getSaveString()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'treedle.txt';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('import-btn').addEventListener('click', () => {
        if (!importSave(document.getElementById('import-content').value)) {
            loadError();
        }
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        init();
        localStorage.removeItem(SAVE_NAME);
    });
});