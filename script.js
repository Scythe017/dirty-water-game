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
      addChoice("WAIT", waitScene);
    }
  );
}

function waitScene() {
  typeText("You wait. The world continues.", walkScene);
}

function parkScene() {
  typeText("The park exists. Progress is real.", walkScene);
}

function friendsHouse() {
  typeText(
    "Your friend is gone. A note asks you to get eggs from the store.",
    () => addChoice("Go to the store", storeEntrance)
  );
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
    `${enemy.name} appears.\nEnemy HP: ${enemy.hp}`,
    () => {
      addChoice("ATTACK", attackMenu);
      addChoice("USE ITEM", inventoryMenu);
      addChoice("FLEE", flee);
    }
  );
}

function attackMenu() {
  clearChoices();
  typeText("Choose attack:", () => {
    addChoice("Fists (10)", () => damageEnemy(10));
    addChoice("Throw Rock (15)", () => damageEnemy(15));
  });
}

function damageEnemy(dmg) {
  enemy.hp -= dmg;
  if (enemy.hp <= 0) winFight();
  else enemyTurn();
}

function enemyTurn() {
  player.hp -= enemy.dmg;
  if (player.hp <= 0) gameOver();
  else fightMenu();
}

function flee() {
  if (Math.random() < 0.25 && !enemy.boss) {
    typeText("You escape.", backrooms);
  } else {
    enemyTurn();
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
// PROGRESSION
// =======================
function winFight() {
  clearChoices();
  if (enemy.boss) {
    const reward = bosses[enemy.name].reward;
    if (!player.permanent.includes(reward)) {
      player.permanent.push(reward);
      player.inventory.push(reward);
    } else {
      player.inventory.push("Metal Ball");
    }
    player.flags.bossesDefeated[enemy.name] = true;
  }
  player.level++;
  saveGame();
  levelUp();
}

function levelUp() {
  typeText(
    `Level up! You are now level ${player.level}.`,
    () => {
      addChoice("Increase Max HP (+10)", () => {
        player.maxHp += 10;
        player.hp = player.maxHp;
        backrooms();
      });
      addChoice("Get random item", () => {
        const pool = ["Beer", "Meat", "Slingshot"];
        player.inventory.push(pool[Math.floor(Math.random() * pool.length)]);
        backrooms();
      });
    }
  );
}

// =======================
// STORE / BACKROOMS
// =======================
function storeEntrance() {
  typeText("The store is wrong. Creatures move.", () => {
    startFight("Creature");
    player.flags.firstFightDone = true;
  });
}

function backrooms() {
  updateStats();
  clearChoices();
  typeText("Back rooms of the store. Endless.", () => {
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

function bossEncounter() {
  const available = Object.keys(bosses)
    .filter(b => !player.flags.bossesDefeated[b]);
  if (available.length === 0) {
    typeText("No bosses remain.", backrooms);
    return;
  }
  startFight(available[0], true);
}

// =======================
// END
// =======================
function gameOver() {
  localStorage.removeItem("dirtyWaterSave");
  clearChoices();
  typeText("You collapse. Dirty water fills the screen.", () => {
    addChoice("Restart", () => location.reload());
  });
}

// =======================
// START
// =======================
loadGame();
walkScene();
