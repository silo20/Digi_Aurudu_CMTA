// ===== Global Variables =====
let registeredPlayer = { name: "", mobile: "" };
let currentActiveGame = null; // Tracks the currently displayed game section ID

// --- Kotta Pora Variables ---
let kpGameOver = false;
let kpScore1 = 0;
let kpScore2 = 0;
const kpMaxScore = 10;
let kpLeaderboard = [];
let kpBotTimeoutId = null;

// --- Kana Mutti Variables ---
const KM_POT_COUNT = 4;
let kmCorrectPotIndex = -1;
let kmCanPlayerClick = false;
let kmLeaderboard = [];
let kmShuffleTimeoutId = null;

// --- Aliyata Asa Variables ---
let aaGameIntervalId = null;
let aaIsMoving = false;
let aaEyeElement = null;
let aaBoardElement = null;
let aaBoardRect = null;
let aaStatusElement = null;
let aaPlaceButton = null;
let aaPlayAgainButton = null;
let aaLeaderboard = [];

// --- Kamba Adeema Variables ---
let kaGameOver = false;
let kaRopePosition = 50; // Percentage from left (0-100)
const KA_BOT_WIN_THRESHOLD = 90; // Position % where Bot wins
const KA_PLAYER_WIN_THRESHOLD = 10; // Position % where Player wins
const KA_BOT_PULL_STRENGTH = 1.8; // How strongly Bot pulls when it's its turn (higher = stronger)
const KA_PLAYER_PULL_STRENGTH = 1.5; // How much Player pulls per click (adjust difficulty)
const KA_BOT_RESISTANCE = 0.4; // How much Bot pulls back slightly even when Player should win (optional, lower = easier for player)
const KA_PULL_INTERVAL = 200; // Milliseconds between game ticks (lower = faster game)
let kaGameIntervalId = null;
let kaRopeMarker = null;
let kaStatusElement = null;
let kaPullButton = null;
let kaPlayAgainButton = null;
let kaLeaderboard = [];
let kaLastWinner = 'Bot'; // Track who won the last round ('Bot' or player name), Bot wins first by default


// --- !!! CRITICAL ALIYATA ASA TARGET VALUES - ADJUST THESE FOR input_file_0.jpeg !!! ---
const AA_TARGET_X = 135; // <<< ADJUST THIS (Pixels from board left) - EXAMPLE GUESS
const AA_TARGET_Y = 115; // <<< ADJUST THIS (Pixels from board top) - EXAMPLE GUESS
const AA_TARGET_RADIUS = 18; // <<< ADJUST: Pixel tolerance for a hit
const AA_MOVE_INTERVAL = 300; // <<< ADJUST: Speed (higher = slower)
// --- !!! END OF CRITICAL VALUES !!! ---


// ===== Utility Functions =====

function hideAllSections() {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('gameSelectionSection').style.display = 'none';
    const gameContainers = document.querySelectorAll('.game-container');
    gameContainers.forEach(container => container.style.display = 'none');
}

function showSection(sectionId) {
    hideAllSections();
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    } else {
        console.error("Section not found:", sectionId);
    }
}

// ===== Registration Logic =====
function registerPlayer() {
    const nameInput = document.getElementById('playerName');
    const mobileInput = document.getElementById('mobileNumber');
    const name = nameInput.value.trim();
    const mobile = mobileInput.value.trim();

    if (name === "") { alert("කරුණාකර ඔබේ නම ඇතුලත් කරන්න!"); nameInput.focus(); return; }
    if (mobile === "") { alert("කරුණාකර දුරකථන අංකය ඇතුලත් කරන්න!"); mobileInput.focus(); return; }
    if (!/^\d{10}$/.test(mobile)) { alert("දුරකථන අංකය ඉලක්කම් 10කින් සමන්විත විය යුතුය!"); mobileInput.focus(); return; }

    registeredPlayer.name = name;
    registeredPlayer.mobile = mobile;
    console.log("Player Registered:", registeredPlayer);
    mobileInput.value = ''; // Clear mobile

    document.getElementById('welcomeMessage').textContent = `ආයුබෝවන්, ${registeredPlayer.name}!`;
    showSection('gameSelectionSection');
}

// ===== Game Selection Logic =====
function selectGame(gameId) {
    console.log("Selecting game:", gameId);
    currentActiveGame = gameId;
    showSection(`${gameId}GameSection`);

    switch (gameId) {
        case 'kottaPora':
            initializeKottaPora();
            break;
        case 'kanaMutti':
            initializeKanaMutti();
            break;
        case 'aliyataAsa':
            setTimeout(initializeAliyataAsa, 50); // Delay for dimensions
            break;
        case 'kambaAdeema':
            initializeKambaAdeema();
            break;
        default:
            console.error("Unknown game selected:", gameId);
            showGameSelectionMenu();
    }
}

// Function to return to the game selection menu
function showGameSelectionMenu() {
    console.log("Returning to menu from:", currentActiveGame);

    // Stop specific game logic based on the active game
    if (currentActiveGame === 'kottaPora') {
        kpGameOver = true;
        if (kpBotTimeoutId) clearTimeout(kpBotTimeoutId);
        kpBotTimeoutId = null;
    } else if (currentActiveGame === 'kanaMutti') {
        kmCanPlayerClick = false;
        if (kmShuffleTimeoutId) clearTimeout(kmShuffleTimeoutId);
        kmShuffleTimeoutId = null;
        const pots = document.querySelectorAll('#kanaMuttiGameSection .pot');
        pots.forEach(pot => pot.classList.remove('broken', 'correct', 'incorrect', 'shuffling'));
        const kmStatus = document.getElementById('kmStatusMessage');
        if (kmStatus) kmStatus.textContent = 'මුට්ටි දෙස බලන්න...';
        const kmPlayAgain = document.getElementById('kmPlayAgainButton');
        if (kmPlayAgain) kmPlayAgain.style.display = 'none';
    } else if (currentActiveGame === 'aliyataAsa') {
        aaIsMoving = false;
        if (aaGameIntervalId) clearInterval(aaGameIntervalId);
        aaGameIntervalId = null;
        if(aaEyeElement) aaEyeElement.classList.remove('hit', 'miss');
        if(aaPlaceButton) aaPlaceButton.disabled = false;
        if(aaPlayAgainButton) aaPlayAgainButton.style.display = 'none';
        if(aaStatusElement) aaStatusElement.textContent = 'ඇස එහා මෙහා යනවා...';
        const targetZoneDebug = document.getElementById('aaTargetZoneDebug');
        if (targetZoneDebug) targetZoneDebug.style.display = 'none';
    } else if (currentActiveGame === 'kambaAdeema') {
        kaGameOver = true;
        if (kaGameIntervalId) clearInterval(kaGameIntervalId);
        kaGameIntervalId = null;
        if (kaRopeMarker) kaRopeMarker.style.left = '50%';
        if (kaPullButton) kaPullButton.disabled = false;
        if (kaPlayAgainButton) kaPlayAgainButton.style.display = 'none';
        if (kaStatusElement) kaStatusElement.textContent = 'කඹේ අදින්න සූදානම්!..';
    }

    currentActiveGame = null;
    showSection('gameSelectionSection');
}


// =======================================
// ===== Kotta Pora Game Logic =========
// =======================================

function initializeKottaPora() {
    console.log("Initializing Kotta Pora for:", registeredPlayer.name);
    const kpDisplayName = document.getElementById('kpDisplayName');
    if (kpDisplayName) kpDisplayName.textContent = registeredPlayer.name;
    resetGameKP();
    renderLeaderboardKP();
}

function hitKP() {
    if (kpGameOver) return;
    kpScore1++;
    document.getElementById('scoreKP1').textContent = `Score: ${kpScore1}`;
    checkWinnerKP();
}

function botPlayKP() {
    if (kpBotTimeoutId) clearTimeout(kpBotTimeoutId);
    if (kpGameOver) return;

    const delay = Math.floor(Math.random() * 800) + 400;
    kpBotTimeoutId = setTimeout(() => {
        if (kpGameOver) return;
        kpScore2++;
        document.getElementById('scoreKP2').textContent = `Score: ${kpScore2}`;
        checkWinnerKP();
        if (!kpGameOver) botPlayKP();
    }, delay);
}

function checkWinnerKP() {
    if (kpGameOver) return;
    let winnerName = '';
    let scoreString = '';

    if (kpScore1 >= kpMaxScore) {
        winnerName = registeredPlayer.name;
        scoreString = `(${kpScore1} - ${kpScore2})`;
        document.getElementById('winnerKP').textContent = `🎉 ${winnerName} දිනුම්! ${scoreString}`;
        kpGameOver = true;
    } else if (kpScore2 >= kpMaxScore) {
        winnerName = 'Bot';
        scoreString = `(${kpScore2} - ${kpScore1})`;
        document.getElementById('winnerKP').textContent = `🤖 Bot දිනුම්! ${scoreString}`;
        kpGameOver = true;
    }

    if (kpGameOver) {
        if (kpBotTimeoutId) clearTimeout(kpBotTimeoutId);
        kpBotTimeoutId = null;
        addToLeaderboardKP(winnerName, scoreString);
    }
}

function addToLeaderboardKP(winner, scoreInfo) {
    const entry = { name: winner, score: scoreInfo, timestamp: new Date().getTime() };
    kpLeaderboard.unshift(entry);
    if (kpLeaderboard.length > 5) kpLeaderboard.pop();
    renderLeaderboardKP();
}

function renderLeaderboardKP() {
    const list = document.getElementById('leaderboardListKP');
    list.innerHTML = "";
    if (kpLeaderboard.length === 0) {
        list.innerHTML = "<li>ප්‍රමුඛ පුවරුව හිස්ය.</li>";
    } else {
        kpLeaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${entry.name} ${entry.score}`;
            list.appendChild(li);
        });
    }
}

function resetGameKP() {
    console.log("Resetting Kotta Pora");
    kpScore1 = 0;
    kpScore2 = 0;
    kpGameOver = false;
    if (kpBotTimeoutId) clearTimeout(kpBotTimeoutId);
    kpBotTimeoutId = null;

    document.getElementById('scoreKP1').textContent = "Score: 0";
    document.getElementById('scoreKP2').textContent = "Score: 0";
    document.getElementById('winnerKP').textContent = "සෙල්ලම පටන් ගමු!";

    if (currentActiveGame === 'kottaPora') {
        setTimeout(() => { if (!kpGameOver) botPlayKP(); }, 100);
    }
}


// =======================================
// ===== Kana Mutti Game Logic =========
// =======================================

function initializeKanaMutti() {
    console.log("Initializing Kana Mutti for:", registeredPlayer.name);
    const kmPlayAgain = document.getElementById('kmPlayAgainButton');
    if(kmPlayAgain) kmPlayAgain.style.display = 'none';
    const potsContainer = document.getElementById('kmPotsContainer');
    if (!potsContainer) return;

    const pots = potsContainer.querySelectorAll('.pot');
    pots.forEach(pot => {
        pot.removeEventListener('click', handlePotClick);
        pot.addEventListener('click', handlePotClick);
    });

    startKanaMuttiRound();
    renderLeaderboardKM();
}

function startKanaMuttiRound() {
    console.log("Starting new Kana Mutti round");
    kmCanPlayerClick = false;
    const kmPlayAgain = document.getElementById('kmPlayAgainButton');
     if(kmPlayAgain) kmPlayAgain.style.display = 'none';
     const kmStatus = document.getElementById('kmStatusMessage');
     if(kmStatus) kmStatus.textContent = 'මුට්ටි මාරු වෙනවා... සූදානම් වන්න!';
    if (kmShuffleTimeoutId) clearTimeout(kmShuffleTimeoutId);

    const pots = document.querySelectorAll('#kanaMuttiGameSection .pot');
    if (pots.length === 0) return;
    pots.forEach(pot => {
        pot.classList.remove('broken', 'correct', 'incorrect', 'shuffling');
        pot.style.cursor = 'pointer';
        pot.textContent = '🏺';
        pot.onclick = handlePotClick;
    });

    pots.forEach(pot => pot.classList.add('shuffling'));
    kmCorrectPotIndex = Math.floor(Math.random() * KM_POT_COUNT);
    console.log("KM Correct Pot:", kmCorrectPotIndex);

    kmShuffleTimeoutId = setTimeout(() => {
        if (currentActiveGame !== 'kanaMutti') return;
        pots.forEach(pot => pot.classList.remove('shuffling'));
        kmCanPlayerClick = true;
        if(kmStatus) kmStatus.textContent = `නිවැරදි මුට්ටිය තෝරන්න, ${registeredPlayer.name}!`;
        kmShuffleTimeoutId = null;
    }, 2000);
}

function handlePotClick(event) {
    if (!kmCanPlayerClick) return;
    kmCanPlayerClick = false;
    const clickedPot = event.target.closest('.pot');
    if (!clickedPot) return;

    const clickedIndex = parseInt(clickedPot.id.split('-')[1]);
    console.log("KM Pot clicked:", clickedIndex);

    const pots = document.querySelectorAll('#kanaMuttiGameSection .pot');
    pots.forEach((pot, index) => {
        pot.classList.add('broken');
        pot.onclick = null;
        if (index === kmCorrectPotIndex) pot.classList.add('correct');
        else pot.classList.add('incorrect');
    });

    let resultMessage = '';
    let winOrLoss = '';
    if (clickedIndex === kmCorrectPotIndex) {
        resultMessage = `🎉 සුභ පැතුම් ${registeredPlayer.name}! ඔබ දිනුම්!`;
        winOrLoss = 'Win';
    } else {
        resultMessage = `😕වැරදියි. නිවැරදි මුට්ටිය අංක ${kmCorrectPotIndex + 1}.`;
        winOrLoss = 'Loss';
    }
    const kmStatus = document.getElementById('kmStatusMessage');
    if(kmStatus) kmStatus.textContent = resultMessage;
    addToLeaderboardKM(registeredPlayer.name, winOrLoss);
    const kmPlayAgain = document.getElementById('kmPlayAgainButton');
    if(kmPlayAgain) kmPlayAgain.style.display = 'inline-block';
}

function resetKanaMutti() {
    console.log("Resetting Kana Mutti");
    startKanaMuttiRound();
}

function addToLeaderboardKM(playerName, result) {
    const entry = { name: playerName, result: result, timestamp: new Date().getTime() };
    kmLeaderboard.unshift(entry);
    if (kmLeaderboard.length > 5) kmLeaderboard.pop();
    renderLeaderboardKM();
}

function renderLeaderboardKM() {
    const list = document.getElementById('leaderboardListKM');
    list.innerHTML = "";
    if (kmLeaderboard.length === 0) {
        list.innerHTML = "<li>ප්‍රමුඛ පුවරුව හිස්ය.</li>";
    } else {
        kmLeaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            const resultText = entry.result === 'Win' ? 'දිනුම්' : 'පැරදුම්';
            li.textContent = `${index + 1}. ${entry.name} - ${resultText}`;
            list.appendChild(li);
        });
    }
}


// =======================================
// ===== Aliyata Asa Game Logic ========
// =======================================

function initializeAliyataAsa() {
    console.log("Initializing Aliyata Asa for:", registeredPlayer.name);
    aaEyeElement = document.getElementById('aaMovingEye');
    aaBoardElement = document.getElementById('aaBoard');
    aaStatusElement = document.getElementById('aaStatusMessage');
    aaPlaceButton = document.getElementById('aaPlaceEyeButton');
    aaPlayAgainButton = document.getElementById('aaPlayAgainButton');

    if (!aaEyeElement || !aaBoardElement || !aaStatusElement || !aaPlaceButton || !aaPlayAgainButton) {
        console.error("Aliyata Asa elements not found!");
        showGameSelectionMenu(); return;
    }
    aaBoardRect = aaBoardElement.getBoundingClientRect();
    console.log("AA Board Rect:", aaBoardRect);

    const targetZoneDebug = document.getElementById('aaTargetZoneDebug');
    if (targetZoneDebug) {
        targetZoneDebug.style.left = `${AA_TARGET_X}px`;
        targetZoneDebug.style.top = `${AA_TARGET_Y}px`;
        targetZoneDebug.style.width = `${AA_TARGET_RADIUS * 2}px`;
        targetZoneDebug.style.height = `${AA_TARGET_RADIUS * 2}px`;
        // targetZoneDebug.style.display = 'block'; // Uncomment to show debug zone
    }

    startAliyataAsaRound();
    renderLeaderboardAA();
}

function startAliyataAsaRound() {
    console.log("Starting Aliyata Asa round");
    if (aaGameIntervalId) clearInterval(aaGameIntervalId);
    aaGameIntervalId = null;
    aaIsMoving = false;

    if(aaEyeElement) aaEyeElement.classList.remove('hit', 'miss');
    if(aaPlaceButton) aaPlaceButton.disabled = false;
    if(aaPlayAgainButton) aaPlayAgainButton.style.display = 'none';
    if(aaStatusElement) aaStatusElement.textContent = 'සූදානම් වන්න... ඇස එහා මෙහා යයි!';

    if(aaBoardElement) aaBoardRect = aaBoardElement.getBoundingClientRect();
    moveEyeRandomly(); // Initial position

    setTimeout(() => {
        if (currentActiveGame !== 'aliyataAsa') return;
        if(aaStatusElement) aaStatusElement.textContent = 'ඇස එහා මෙහා යනවා... හරි තැනට ආවම ඔබන්න!';
        aaIsMoving = true;
        if (aaBoardElement && aaBoardElement.offsetWidth > 0 && aaBoardElement.offsetHeight > 0) {
             aaGameIntervalId = setInterval(moveEyeRandomly, AA_MOVE_INTERVAL);
        } else {
            console.warn("AA Board dimensions not ready, interval not started.");
        }
    }, 1500);
}

function moveEyeRandomly() {
    if (!aaIsMoving || !aaBoardElement || !aaEyeElement || !aaBoardRect || aaBoardElement.offsetWidth <= 0 || aaBoardElement.offsetHeight <= 0) {
         if (aaGameIntervalId && !aaIsMoving) { clearInterval(aaGameIntervalId); aaGameIntervalId = null; }
        return;
    }
    const boardWidth = aaBoardElement.offsetWidth;
    const boardHeight = aaBoardElement.offsetHeight;
    const eyeWidth = aaEyeElement.offsetWidth;
    const eyeHeight = aaEyeElement.offsetHeight;
    const maxX = Math.max(0, boardWidth - eyeWidth);
    const maxY = Math.max(0, boardHeight - eyeHeight);
    const randomX = Math.floor(Math.random() * (maxX + 1));
    const randomY = Math.floor(Math.random() * (maxY + 1));
    aaEyeElement.style.left = `${randomX}px`;
    aaEyeElement.style.top = `${randomY}px`;
}

function placeEyeAA() {
    if (!aaIsMoving) return;
    console.log("Attempting to place eye AA");
    aaIsMoving = false;
    if (aaGameIntervalId) clearInterval(aaGameIntervalId);
    aaGameIntervalId = null;

    if(aaPlaceButton) aaPlaceButton.disabled = true;

    const eyeWidth = aaEyeElement.offsetWidth;
    const eyeHeight = aaEyeElement.offsetHeight;
    const eyeCenterX = aaEyeElement.offsetLeft + eyeWidth / 2;
    const eyeCenterY = aaEyeElement.offsetTop + eyeHeight / 2;
    const distanceX = eyeCenterX - AA_TARGET_X;
    const distanceY = eyeCenterY - AA_TARGET_Y;
    const distanceFromTarget = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    console.log(`Eye Center: (${eyeCenterX.toFixed(1)}, ${eyeCenterY.toFixed(1)}), Target: (${AA_TARGET_X}, ${AA_TARGET_Y}), Dist: ${distanceFromTarget.toFixed(1)}, Radius: ${AA_TARGET_RADIUS}`);

    let resultMessage = '';
    let winOrLoss = '';
    if (distanceFromTarget <= AA_TARGET_RADIUS) {
        resultMessage = `✅ නියමයි ${registeredPlayer.name}! ඔබ ඇස නිවැරදිව තිබ්බා!`;
        winOrLoss = 'Hit';
        if(aaEyeElement) aaEyeElement.classList.add('hit');
    } else {
        resultMessage = `❌ වැරදියි! මදක් එහාට මෙහාට වුනා.`;
        winOrLoss = 'Miss';
        if(aaEyeElement) aaEyeElement.classList.add('miss');
    }

    if(aaStatusElement) aaStatusElement.textContent = resultMessage;
    addToLeaderboardAA(registeredPlayer.name, winOrLoss);
    if(aaPlayAgainButton) aaPlayAgainButton.style.display = 'inline-block';
}

function resetAliyataAsa() {
    console.log("Resetting Aliyata Asa");
    startAliyataAsaRound();
}

function addToLeaderboardAA(playerName, result) {
    const entry = { name: playerName, result: result, timestamp: new Date().getTime() };
    aaLeaderboard.unshift(entry);
    if (aaLeaderboard.length > 5) aaLeaderboard.pop();
    renderLeaderboardAA();
}

function renderLeaderboardAA() {
    const list = document.getElementById('leaderboardListAA');
    list.innerHTML = "";
    if (aaLeaderboard.length === 0) {
        list.innerHTML = "<li>ප්‍රමුඛ පුවරුව හිස්ය.</li>";
    } else {
        aaLeaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            const resultText = entry.result === 'Hit' ? 'නිවැරදියි 👍' : 'වැරදියි 👎';
            li.textContent = `${index + 1}. ${entry.name} - ${resultText}`;
            list.appendChild(li);
        });
    }
}


// =======================================
// ===== Kamba Adeema Game Logic =======
// =======================================

function initializeKambaAdeema() {
    console.log("Initializing Kamba Adeema for:", registeredPlayer.name);
    kaRopeMarker = document.getElementById('kaRopeMarker');
    kaStatusElement = document.getElementById('kaStatusMessage');
    kaPullButton = document.getElementById('kaPullButton');
    kaPlayAgainButton = document.getElementById('kaPlayAgainButton');

    if (!kaRopeMarker || !kaStatusElement || !kaPullButton || !kaPlayAgainButton) {
        console.error("Kamba Adeema elements not found!");
        showGameSelectionMenu(); return;
    }
    // Optional: Load last winner from localStorage
    // kaLastWinner = localStorage.getItem('kaLastWinner') || 'Bot';

    resetKambaAdeema();
    renderLeaderboardKA();
}

function startKambaAdeemaRound() {
    console.log("Starting Kamba Adeema round. Last Winner:", kaLastWinner);
    if (kaGameIntervalId) clearInterval(kaGameIntervalId);
    kaGameIntervalId = null;
    kaGameOver = false;
    kaRopePosition = 50; // Start at center

    if (kaRopeMarker) kaRopeMarker.style.left = `${kaRopePosition}%`;
    if (kaPullButton) kaPullButton.disabled = false;
    if (kaPlayAgainButton) kaPlayAgainButton.style.display = 'none';

    if (kaLastWinner === 'Bot') { // Player's turn to have a chance
         if (kaStatusElement) kaStatusElement.textContent = `ඔබේ වාරය! ${registeredPlayer.name}, අදින්න!`;
    } else { // Bot's turn to win (or first round)
         if (kaStatusElement) kaStatusElement.textContent = 'Bot ගෙන් දිනන්න බලන්න!';
    }

    if (currentActiveGame === 'kambaAdeema') {
        kaGameIntervalId = setInterval(gameTickKA, KA_PULL_INTERVAL);
    }
}

// Main game loop function (runs periodically)
function gameTickKA() {
    if (kaGameOver || currentActiveGame !== 'kambaAdeema') {
        if (kaGameIntervalId) clearInterval(kaGameIntervalId);
        kaGameIntervalId = null;
        return;
    }

    // Bot's behavior depends on who won last
    // If Player won last, or if it's the initial state where kaLastWinner is 'Bot', Bot should win this time.
    if (kaLastWinner !== 'Bot' && kaLastWinner !== registeredPlayer.name) { // Handles initial case or if player won last
        kaLastWinner = 'Bot'; // Ensure first round is Bot's turn if needed, though default handles it.
    }

    if (kaLastWinner === registeredPlayer.name) { // If player won last, Bot pulls strongly this round
         kaRopePosition += KA_BOT_PULL_STRENGTH;
        // Check if bot wins
        if (kaRopePosition >= KA_BOT_WIN_THRESHOLD) {
            kaGameOver = true;
            if (kaStatusElement) kaStatusElement.textContent = '🤖 Bot දිනුම්!';
            if (kaPullButton) kaPullButton.disabled = true;
            if (kaPlayAgainButton) kaPlayAgainButton.style.display = 'inline-block';
            if (kaGameIntervalId) clearInterval(kaGameIntervalId);
            kaGameIntervalId = null;
            addToLeaderboardKA("Bot", "Win"); // Record bot win
        }
    } else { // If Bot won last (or first round), Player has a chance. Bot offers slight resistance.
        kaRopePosition += KA_BOT_RESISTANCE;
        // Player needs to click to pull it back and win. Win check is in playerPullKA.
    }

    // Ensure rope doesn't go out of bounds and update visual
    kaRopePosition = Math.max(0, Math.min(100, kaRopePosition));
    if (kaRopeMarker) kaRopeMarker.style.left = `${kaRopePosition}%`;

}


// Function called when the player clicks the "අදින්න!" button
function playerPullKA() {
    if (kaGameOver) return;
    console.log("Player pulled!");

    kaRopePosition -= KA_PLAYER_PULL_STRENGTH;
    kaRopePosition = Math.max(0, kaRopePosition); // Clamp at 0%
    if (kaRopeMarker) kaRopeMarker.style.left = `${kaRopePosition}%`;

    // Check if player wins (only possible if it was their turn: kaLastWinner was 'Bot')
    if (kaRopePosition <= KA_PLAYER_WIN_THRESHOLD && kaLastWinner === 'Bot') {
            kaGameOver = true;
            if (kaStatusElement) kaStatusElement.textContent = `🎉 ${registeredPlayer.name} දිනුම්!`;
            if (kaPullButton) kaPullButton.disabled = true;
            if (kaPlayAgainButton) kaPlayAgainButton.style.display = 'inline-block';
            if (kaGameIntervalId) clearInterval(kaGameIntervalId);
            kaGameIntervalId = null;
            addToLeaderboardKA(registeredPlayer.name, "Win"); // Record player win
    }

    // Optional: Cosmetic button feedback
    if(kaPullButton) {
        kaPullButton.style.backgroundColor = '#81c784';
        setTimeout(() => {
             if(kaPullButton && !kaPullButton.disabled) kaPullButton.style.backgroundColor = '#4caf50';
        }, 100);
    }
}

// Function to reset the Kamba Adeema game
function resetKambaAdeema() {
    console.log("Resetting Kamba Adeema");
    startKambaAdeemaRound();
}

// Kamba Adeema Leaderboard Functions (Updated)
function addToLeaderboardKA(winnerName, result) {
    const entry = { name: winnerName, result: result, timestamp: new Date().getTime() };
    kaLeaderboard.unshift(entry);
    if (kaLeaderboard.length > 5) kaLeaderboard.pop();

    // --- IMPORTANT: Update who won last ---
    kaLastWinner = winnerName; // Store the actual winner's name ('Bot' or player name)
    // ---

    renderLeaderboardKA();
    // Optional: Save to localStorage
    // localStorage.setItem('kaLeaderboard', JSON.stringify(kaLeaderboard));
    // localStorage.setItem('kaLastWinner', kaLastWinner);
}

function renderLeaderboardKA() {
    const list = document.getElementById('leaderboardListKA');
    list.innerHTML = "";
    if (kaLeaderboard.length === 0) {
        list.innerHTML = "<li>ප්‍රමුඛ පුවරුව හිස්ය.</li>";
    } else {
        kaLeaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            const resultText = entry.result === 'Win' ? 'දිනුම් 👍' : 'පැරදුම් 👎'; // Assuming only wins now
            li.textContent = `${index + 1}. ${entry.name} - ${resultText}`;
            list.appendChild(li);
        });
    }
}


// =======================================
// ===== Placeholder for Lissana Gaha ====
// =======================================
// This function exists but the button in HTML points to kambaAdeema
function initializeLissanaGaha() {
    console.log("Initializing Lissana Gaha (Placeholder - Not Active)");
    showGameSelectionMenu(); // Go back if somehow selected
}


// ===== Initial Setup on Page Load =====
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    // Optional: Load state from localStorage
    // kaLastWinner = localStorage.getItem('kaLastWinner') || 'Bot';
    // ... load other leaderboards ...

    showSection('registerSection'); // Default start

     // Initial render of all leaderboards
     renderLeaderboardKP();
     renderLeaderboardKM();
     renderLeaderboardAA();
     renderLeaderboardKA();
});