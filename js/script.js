/* =========================================================
   TEXTUREN
========================================================= */

const blockTextures = {

    1: "images/Gras.png",
    2: "images/Holz.png",
    3: "images/Brett.png",
    4: "images/Werkbank.png",
    5: "images/Stein.png",
    6: "images/Bruchstein.png",
    7: "images/Kohle.png",
    8: "images/Ofen.png",
    9: "images/Sand.png",
    10: "images/Glas.png",
    11: "images/Eisenerz.png",
    12: "images/Golderz.png",
    13: "images/Redstoneerz.png",
    14: "images/Diamanterz.png",
    15: "images/Smaragderz.png",
    16: "images/Obsidian.png",
    17: "images/Netherziegel.png",
    18: "images/Glowstone.png",
    19: "images/Endstone.png",
    20: "images/Bedrock.png"

};


// =========================================================
// BILDER VORLADEN
// =========================================================

Object.values(blockTextures).forEach(src => {
    const img = new Image();
    img.src = src;
});

// Hintergrund und Spitzhacke ebenfalls vorladen
[
    "images/Hintergrund.png",
    "images/Spitzhacke.png"
].forEach(src => {
    const img = new Image();
    img.src = src;
});


/* =========================================================
   VARIABLEN
========================================================= */

let countMerge = 0;
let score = 0;
let bestScore = 0;

let combo = 0;
let lastMergeTime = 0;

let dragClone = null;
let originalBlock = null;
let originalCell = null;

let gameEnded = false;


/* =========================================================
   HILFSFUNKTIONEN
========================================================= */

const cells = () =>
    [...document.querySelectorAll(".cell")];

const blocks = () =>
    [...document.querySelectorAll(".block")];

function getMaxLevel() {

    let max = 1;

    blocks().forEach(block => {

        max = Math.max(
            max,
            parseInt(block.dataset.level)
        );

    });

    return max;
}


function calculateSpawnLevel() {

    const max = getMaxLevel();

    if (max < 9)
        return 1;

    return Math.max(1, max - 7);

}


/* =========================================================
   SCORE
========================================================= */

function addScore(level) {

    const now = Date.now();

    if (now - lastMergeTime < 2500) {

        combo++;

    } else {

        combo = 1;

    }

    lastMergeTime = now;

    const comboMultiplier =
        Math.max(1, combo);

    const gained =
        level * 10 * comboMultiplier;

    score += gained;

    if (score > bestScore) {
        bestScore = score;
    }

    updateHUD();

    if (combo >= 2) {

        showFloatingText(
            `🔥 COMBO x${combo}! +${gained}`
        );

    } else {

        showFloatingText(
            `✨ +${gained}`
        );

    }

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    document.getElementById("scoreDisplay")
        .textContent = score;

    document.getElementById("bestDisplay")
        .textContent = bestScore;

    document.getElementById("comboDisplay")
        .textContent = `x${combo}`;

}


/* =========================================================
   LEVEL DISPLAY
========================================================= */

function updateLevelDisplay() {

    const maxLvl = getMaxLevel();

    const spawnLevel =
        calculateSpawnLevel();

    document.getElementById("levelDisplay").innerHTML =

        `Höchster Block: <b>${maxLvl}</b><br>
         Spawn-Level: <b>${spawnLevel}</b> |
         Merges: <b>${countMerge}</b>`;

    const progress =
        Math.min(
            100,
            (maxLvl / 20) * 100
        );

    document.getElementById("progressBar")
        .style.width = progress + "%";

}


/* =========================================================
   SPEICHERN
========================================================= */

function saveGame() {

    const save = {

        cells: cells().map(cell => {

            if (!cell.children.length)
                return null;

            return parseInt(
                cell.children[0].dataset.level
            );

        }),

        countMerge,
        score,
        bestScore

    };

    localStorage.setItem(
        "minecraftMergeSave",
        JSON.stringify(save)
    );

}


/* =========================================================
   LADEN
========================================================= */

function loadGame() {

    const data =
        localStorage.getItem(
            "minecraftMergeSave"
        );

    if (!data) {

        updateHUD();
        updateLevelDisplay();

        return;
    }

    try {

        const save =
            JSON.parse(data);

        countMerge =
            save.countMerge || 0;

        score =
            save.score || 0;

        bestScore =
            save.bestScore || score;

        save.cells?.forEach(
            (level, index) => {

                if (level === null)
                    return;

                createBlock(
                    cells()[index],
                    level
                );

            }
        );

    } catch (error) {

        console.error(
            "Spielstand konnte nicht geladen werden:",
            error
        );

        localStorage.removeItem(
            "minecraftMergeSave"
        );

    }

    updateHUD();
    updateLevelDisplay();

}


/* =========================================================
   BLOCK ERSTELLEN
========================================================= */

function createBlock(cell, level) {

    const block =
        document.createElement("div");

    block.className = "block";

    block.dataset.level =
        level;

    block.style.backgroundImage =
        `url("${blockTextures[level]}")`;

    cell.appendChild(block);

    enableDrag(block);

    return block;

}


/* =========================================================
   SPAWN
========================================================= */

function spawnBlock(level = null) {

    if (gameEnded)
        return;

    const empty =
        cells().filter(
            cell => cell.children.length === 0
        );

    if (empty.length === 0) {

        checkGameOver();

        if (!gameEnded)
            showFloatingText("⚠️ SPIELFELD VOLL!");

        return;
    }


    const cell =
        empty[
            Math.floor(
                Math.random() * empty.length
            )
        ];


    let spawnLevel =
        level ?? calculateSpawnLevel();


    /*
       Seltene bessere Blöcke:
       10 % Chance auf +1 Level
    */

    if (
        level === null &&
        Math.random() < 0.10 &&
        spawnLevel < 20
    ) {

        spawnLevel++;

        showFloatingText(
            "✨ SELTENER BLOCK!"
        );

    }


    createBlock(
        cell,
        spawnLevel
    );


    animatePickaxe();

    updateLevelDisplay();

    saveGame();

    checkGameOver();

}


/* =========================================================
   ALTE BLÖCKE ENTFERNEN
========================================================= */

function raiseBlocksToSpawnLevel() {

    const spawnLevel = calculateSpawnLevel();

    blocks().forEach(block => {

        let level = parseInt(block.dataset.level);

        if (level < spawnLevel) {

            level = spawnLevel;

            block.dataset.level = level;

            block.style.backgroundImage =
                `url("${blockTextures[level]}")`;

            block.classList.add("merge-animation");

            setTimeout(() => {
                block.classList.remove("merge-animation");
            }, 450);
        }

    });
}

/* =========================================================
   MERGE
========================================================= */

function mergeBlocks(
    targetCell,
    level,
    oldBlock
) {

    const newLevel =
        level + 1;


    /*
       Alten Zielblock entfernen.
    */

    targetCell.innerHTML = "";


    const newBlock =
        createBlock(
            targetCell,
            newLevel
        );


    /*
       Alten gezogenen Block entfernen.
    */

    if (
        oldBlock &&
        oldBlock.parentElement
    ) {

        oldBlock.remove();

    }


    countMerge++;


    addScore(newLevel);


    /*
       Merge-Animation
    */

    newBlock.classList.add(
        "merge-animation"
    );

    setTimeout(() => {

        newBlock.classList.remove(
            "merge-animation"
        );

    }, 450);


    raiseBlocksToSpawnLevel();

    updateLevelDisplay();

    saveGame();


    /*
       Ende
    */

    if (newLevel >= 20) {

        setTimeout(
            showEndPopup,
            350
        );

        return;
    }


    checkGameOver();

}


/* =========================================================
   DRAG & DROP
========================================================= */

function enableDrag(block) {

    block.onpointerdown = e => {

        if (gameEnded)
            return;

        e.preventDefault();

        originalBlock = block;

        originalCell =
            block.parentElement;

	dragClone =
            block.cloneNode(true);

	dragClone.style.visibility = "visible";

	originalBlock.style.visibility = "hidden";
        
        dragClone.style.position =
            "fixed";

        dragClone.style.pointerEvents =
            "none";

        dragClone.style.width =
            window.innerWidth <= 600
                ? "80px"
                : "90px";

        dragClone.style.height =
            window.innerWidth <= 600
                ? "80px"
                : "90px";

        dragClone.style.zIndex =
            "999999";

        dragClone.style.opacity =
            ".9";

        dragClone.style.transform =
            "scale(1.08)";

        document.body.appendChild(
            dragClone
        );

        moveClone(e);

        window.onpointermove =
            moveClone;

        window.onpointerup =
            finishDrag;

    };

}


/* =========================================================
   DRAG BEWEGUNG
========================================================= */

function moveClone(e) {

    if (!dragClone)
        return;


    const size =
        window.innerWidth <= 600
            ? 40
            : 45;


    dragClone.style.left =
        (e.clientX - size) + "px";

    dragClone.style.top =
        (e.clientY - size) + "px";


    /*
       Alle alten Markierungen entfernen
    */

    cells().forEach(cell => {

        cell.classList.remove(
            "drop-target",
            "merge-target"
        );

    });


    /*
       Ziel finden
    */

    const target =
        document.elementFromPoint(
            e.clientX,
            e.clientY
        );

    const targetCell =
        target?.closest(".cell");


    if (
        targetCell &&
        targetCell !== originalCell
    ) {

        if (
            targetCell.children.length === 0
        ) {

            targetCell.classList.add(
                "drop-target"
            );

        } else {

            const other =
                targetCell.children[0];

            const otherLevel =
                parseInt(
                    other.dataset.level
                );

            const ownLevel =
                parseInt(
                    originalBlock.dataset.level
                );


            if (
                otherLevel === ownLevel
            ) {

                targetCell.classList.add(
                    "merge-target"
                );

            }

        }

    }

}


/* =========================================================
   DRAG ENDE
========================================================= */

function finishDrag(e) {

    if (!dragClone)
        return;

    const dropTarget =
        document.elementFromPoint(
            e.clientX,
            e.clientY
        );

    const targetCell =
        dropTarget?.closest(".cell");

    const originalLevel =
        parseInt(
            originalBlock.dataset.level
        );

    let successfulMove = false;

    cells().forEach(cell => {
        cell.classList.remove(
            "drop-target",
            "merge-target"
        );
    });


    // ==========================================
    // LEERE ZIELZELLE
    // ==========================================

    if (
        targetCell &&
        targetCell !== originalCell &&
        targetCell.children.length === 0
    ) {

        targetCell.appendChild(
            originalBlock
        );

        originalBlock.style.visibility =
            "visible";

        successfulMove = true;
    }


    // ==========================================
    // MERGE
    // ==========================================

    else if (
        targetCell &&
        targetCell !== originalCell &&
        targetCell.children.length > 0
    ) {

        const other =
            targetCell.children[0];

        const otherLevel =
            parseInt(
                other.dataset.level
            );

        if (otherLevel === originalLevel) {

            mergeBlocks(
                targetCell,
                originalLevel,
                originalBlock
            );

            successfulMove = true;
        }
    }


    // ==========================================
    // NICHT ERFOLGREICH
    // ==========================================

    if (
        !successfulMove &&
        originalBlock
    ) {

        originalBlock.style.visibility =
            "visible";
    }


    // Clone entfernen

    dragClone.remove();

    dragClone = null;

    originalBlock = null;
    originalCell = null;


    updateLevelDisplay();
    saveGame();
}

/* =========================================================
   GAME OVER
========================================================= */

function canMergeExist() {

    const allBlocks = blocks();

    for (let i = 0; i < allBlocks.length; i++) {

        const levelA =
            parseInt(
                allBlocks[i].dataset.level
            );

        for (
            let j = i + 1;
            j < allBlocks.length;
            j++
        ) {

            const levelB =
                parseInt(
                    allBlocks[j].dataset.level
                );

            if (levelA === levelB)
                return true;

        }

    }

    return false;

}


function checkGameOver() {

    if (gameEnded)
        return;


    const empty =
        cells().some(
            cell => cell.children.length === 0
        );


    /*
       Solange eine Zelle frei ist,
       kann weitergespielt werden.
    */

    if (empty)
        return;


    /*
       Wenn noch ein Merge möglich ist,
       ebenfalls kein Game Over.
    */

    if (canMergeExist())
        return;


    gameEnded = true;

    showGameOver();

}


/* =========================================================
   POPUPS
========================================================= */

function showEndPopup() {

    document.getElementById(
        "finalScore"
    ).textContent = score;

    document.getElementById(
        "finalBest"
    ).textContent = bestScore;

    document.getElementById(
        "popup"
    ).style.display = "flex";

}


function showGameOver() {

    document.getElementById(
        "gameOverScore"
    ).textContent = score;

    document.getElementById(
        "gameOverBest"
    ).textContent = bestScore;

    document.getElementById(
        "gameOver"
    ).style.display = "flex";

}


/* =========================================================
   FLOATING TEXT
========================================================= */

function showFloatingText(text) {

    const element =
        document.getElementById(
            "floatingText"
        );

    element.textContent = text;

    element.classList.remove("show");

    /*
       Browser-Reflow erzwingen,
       damit die Animation erneut startet.
    */

    void element.offsetWidth;

    element.classList.add("show");

}


/* =========================================================
   SPITZHACKE ANIMATION
========================================================= */

function animatePickaxe() {

    const pickaxe =
        document.getElementById(
            "pickaxe"
        );

    pickaxe.classList.remove("hit");

    void pickaxe.offsetWidth;

    pickaxe.classList.add("hit");

}


/* =========================================================
   NEUSTART
========================================================= */

function restartGame() {

    localStorage.removeItem(
        "minecraftMergeSave"
    );

    window.location.href =
        "index.html";

}


document.getElementById(
    "restartButton"
).onclick = restartGame;


document.getElementById(
    "gameOverRestart"
).onclick = restartGame;


/* =========================================================
   PICKAXE
========================================================= */

document.getElementById(
    "pickaxe"
).onclick = () => {

    spawnBlock();

};


/* =========================================================
   ENTER
========================================================= */

document.addEventListener(
    "keydown",
    e => {

        if (e.key !== "Enter")
            return;


        const popupVisible =
            document.getElementById(
                "popup"
            ).style.display === "flex";


        const gameOverVisible =
            document.getElementById(
                "gameOver"
            ).style.display === "flex";


        const resetVisible =
            document.getElementById(
                "confirmReset"
            ).style.display === "flex";


        if (popupVisible) {

            restartGame();

            return;

        }


        if (gameOverVisible) {

            restartGame();

            return;

        }


        if (resetVisible)
            return;


        spawnBlock();

    }
);


/* =========================================================
   RESET
========================================================= */

const confirmReset =
    document.getElementById(
        "confirmReset"
    );


document.getElementById(
    "resetGame"
).onclick = () => {

    confirmReset.style.display =
        "flex";

};


document.getElementById(
    "confirmYes"
).onclick = restartGame;


document.getElementById(
    "confirmNo"
).onclick = () => {

    confirmReset.style.display =
        "none";

};


/* =========================================================
   START
========================================================= */

loadGame();
