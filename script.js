// =======================
// CORE STATE
// =======================
let player = {
  hp: 100,
  maxHp: 100,
  level: 1,
  inventory: ["Rubber Ball"],
  permanent: [],
  location: "walk",
  flags: {
    firstFightDone: false,
    bossesDefeated: {}
  }
};

let enemy = null;
let typing = false;

// =======================
// DATA
// =======================
const enemies = {
  Creature: { hp: 100, dmg: 10 },
  Worker: { hp: 125, dmg: 15 },
  Freefood: { hp: 150, dmg: 20 },
  Mite: { hp: 10, dmg: 15 }
};

const bosses = {
  Cat: { hp: 250, dmg: 20, reward: "Shovel" },
  "The SKY": { hp: 400, dmg: 25, reward: "Metal Ball" },
  Skineater: { hp: 320, dmg: 30, reward: "Stick" },
  "a BOX": { hp: 500, dmg: 30, reward: "Beach Ball" },
  "THE MANAGER": { hp: 750, dmg: 40, reward: "Shotgun" }
};

const items = {
  "Beer": () => player.hp = Math.min(player.hp + 5, player.maxHp),
  "Meat": () => {
    player.maxHp += 5;
    player.hp = Math.min(player.hp + 10, player.maxHp);
  },
  "Rubber Ball": () => enemy.hp -= 10,
  "Slingshot": () => enemy.hp -= 5,
  "Metal Ball": () => enemy.hp -= 20,
  "Beach Ball": () => enemy.hp -= 15,
  "Shovel": () => enemy.hp -= 25,
  "Stick": () => enemy.hp -= 12,
  "Shotgun": () => enemy.hp -= 50
};

// =======================
// DOM
// =======================
const textEl = document.getElementById("text");
const choicesEl = document.getElementById("choices");
const statsEl = document.getElementById("stats");

// =======================
// TYPEWRITER
// =======================
function typeText(text, cb) {
  typing = true;
  textEl.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    textEl.textContent += text[i++];
    if (i >= text.length) {
      clearInterval(interval);
      typing = false;
      if (cb) cb();
    }
  }, 18);
}

// =======================
// SAVE SYSTEM
// =======================
function saveGame() {
  localStorage.setItem("dirtyWaterSave", JSON.stringify(player));
}

function loadGame() {
  const save = localStorage.getItem("dirtyWaterSave");
  if (save) player = JSON.parse(save);
}

// =======================
// UI HELPERS
// =======================
function updateStats() {
  statsEl.textContent =
    `HP ${player.hp}/${player.maxHp} | LV ${player.level} | INV ${player.inventory.join(", ")}`;
}

function clearChoices() {
  choicesEl.innerHTML = "";
}

function addChoice(label, action) {
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = () => !typing && action();
  choicesEl.appendChild(b);
}

// =======================
// WORLD
// =======================
function walkScene() {
  player.location = "walk";
  saveGame();
  updateStats();
  clearChoices();
  typeText(
    "You are on a walk. No rules. Just movement.",
    () => {
      addChoice("Go to friend's house", friendsHouse);
      addChoice("Walk to the park", parkScene);
    }
  );
}

function parkScene() {
  typeText(
    "You reach the park. You get bored quickly and decide to go to your friend's house.",
    friendsHouse
  );
}

function friendsHouse() {
  typeText(
    "Your friend is not home. A note reads: 'Hey, I won’t be home. Can you go to the store and get some eggs?'",
    () => addChoice("Go to the store", storeEntrance)
  );
}

// =======================
// STORE
// =======================
function storeEntrance() {
  typeText(
    "You enter the store. The shelves are quiet... but you feel something is off.",
    () => startFight("Creature")
  );
}

function backrooms() {
  updateStats();
  clearChoices();
  typeText("You step into the back rooms of the store. The game begins.", () => {
    addChoice("Search drawers", findItem);
    addChoice("Go deeper", randomEncounter);
    if (player.level >= 5) addChoice("Boss Door", bossEncounter);
  });
}

function findItem() {
  const pool = ["Beer", "Meat", "Slingshot"];
  const found = pool[Math.floor(Math.random() * pool.length)];
  player.inventory.push(found);
  saveGame();
  typeText(`You found ${found}.`, backrooms);
}

function randomEncounter() {
  const list = Object.keys(enemies);
  startFight(list[Math.floor(Math.random() * list.length)]);
}

// =======================
// COMBAT
// =======================
function startFight(name, isBoss = false) {
  const data = isBoss ? bosses[name] : enemies[name];
  enemy = { name, hp: data.hp, dmg: data.dmg, boss: isBoss };
  fightMenu();
}

function fightMenu() {
  updateStats();
  clearChoices();
  typeText(
    `${enemy.name} appears!\nEnemy HP: ${enemy.hp}`,
    () => {
      addChoice("ATTACK", attackMenu);
      addChoice("USE ITEM", inventoryMenu);
      addChoice("FLEE", flee);
    }
  );
}

function attackMenu() {
  clearChoices();
  typeText("Choose your attack:", () => {
    addChoice("Fists (10 dmg)", () => playerAttack(10));
    addChoice("Throw Rock (15 dmg)", () => playerAttack(15));
  });
}

function playerAttack(dmg) {
  enemy.hp -= dmg;
  if (enemy.hp <= 0) return winFight();
  enemyTurn();
}

function enemyTurn() {
  player.hp -= enemy.dmg;
  if (player.hp <= 0) return gameOver();
  fightMenu();
}

function flee() {
  if (!enemy.boss && Math.random() < 0.25) {
    typeText("You flee successfully.", backrooms);
  } else {
    typeText("Failed to flee!", () => enemyTurn());
  }
}

// =======================
// INVENTORY
// =======================
function inventoryMenu() {
  clearChoices();
  typeText("Inventory:", () => {
    player.inventory.forEach((item, i) => {
      addChoice(item, () => {
        items[item]?.();
        player.inventory.splice(i, 1);
        if (enemy.hp <= 0) winFight();
        else fightMenu();
      });
    });
    addChoice("Back", fightMenu);
  });
}

// =======================
// WIN / LEVEL UP
// =======================
function winFight() {
  clearChoices();
  if (enemy.boss) {
    const reward = bosses[enemy.name].reward;
    if (!player.permanent.includes(reward)) {
      player.permanent.push(reward);
      player.inventory.push(reward);
      typeText(`Boss defeated! You got a permanent item: ${reward}`, backrooms);
    } else {
      player.inventory.push("Metal Ball");
      typeText(`Boss defeated! You got a Metal Ball instead.`, backrooms);
    }
    player.flags.bossesDefeated[enemy.name] = true;
  } else {
    typeText(`${enemy.name} defeated!`, backrooms);
  }
  player.level++;
  saveGame();
  levelUp();
}

function levelUp() {
  clearChoices();
  typeText(
    `Level up! You are now level ${player.level}.`,
    () => {
      addChoice("Increase Max HP (+10)", () => {
        player.maxHp += 10;
        player.hp = player.maxHp;
        backrooms();
      });
      addChoice("Get a random item", () => {
        const pool = ["Beer", "Meat", "Slingshot"];
        player.inventory.push(pool[Math.floor(Math.random() * pool.length)]);
        backrooms();
      });
    }
  );
}

// =======================
// BOSS
// =======================
function bossEncounter() {
  const available = Object.keys(bosses).filter(b => !player.flags.bossesDefeated[b]);
  if (available.length === 0) {
    typeText("No bosses remain.", backrooms);
    return;
  }
  startFight(available[0], true);
}

// =======================
// GAME OVER
// =======================
function gameOver() {
  localStorage.removeItem("dirtyWaterSave");
  clearChoices();
  typeText("You collapse. Game Over.", () => {
    addChoice("Restart", () => location.reload());
  });
}

// =======================
// START GAME
// =======================
loadGame();
walkScene();
