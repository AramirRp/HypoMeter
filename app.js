// État global
let state = {
  activeGame: null,
  pendingGame: null,
  games: [],
  keywords: {
    positive: ["hype", "incroyable", "génial"],
    negative: ["nul", "décevant"],
  },
  messageCount: 0,
  connectedChannels: [],
};

// Configuration Twitch
const TWITCH_CLIENT_ID = "n9t2mmltmqnmyhfugrh5ci62ad6rzy";
const TWITCH_REDIRECT_URI = "https://hypometer-twitch.vercel.app";

// Gestionnaire de localStorage
const Storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  remove: (key) => localStorage.removeItem(key),
};

// Sauvegarde de l'état
function saveState() {
  Storage.set("appState", state);
}

// Calcul du score d'un jeu
function calculateGameScore(game) {
  if (!game) return;

  const positive = game.positiveReactions || 0;
  const negative = game.negativeReactions || 0;
  const neutral = game.neutralReactions || 0;
  const total = positive + negative + neutral;

  if (total === 0) {
    game.score = 0;
    return;
  }

  // Score basé sur la différence positive/négative, pondéré par le total
  const difference = positive - negative;
  const ratio = total > 0 ? difference / total : 0;
  game.score = Math.round(ratio * 100);
}

// Connexion Twitch
function connectToTwitch() {
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${TWITCH_REDIRECT_URI}&response_type=token&scope=chat:read`;
  window.location.href = authUrl;
}

// Initialisation du client Twitch
async function initTwitchClient() {
  const accessToken = Storage.get("twitchToken");
  const username = Storage.get("twitchUsername");
  if (!accessToken || !username) return;

  let channels = Storage.get("connectedChannels") || [];
  if (channels.length === 0) {
    channels = [username.toLowerCase()];
    Storage.set("connectedChannels", channels);
  }

  // Déconnecte l'ancien client si besoin
  if (window.twitchClient && window.twitchClient.disconnect) {
    await window.twitchClient.disconnect();
  }

  const client = new tmi.Client({
    options: { debug: false },
    identity: {
      username: username,
      password: `oauth:${accessToken}`,
    },
    channels: channels,
  });

  client.on("message", (channel, tags, message, self) => {
    if (self) return;
    handleChatMessage(channel, tags["display-name"] || tags.username, message);
  });

  client.on("connected", (addr, port) => {
    console.log("Connecté au(x) channel(s) :", channels);
    document.getElementById("connectionStatus").classList.add("connected");
    document.getElementById("connectionText").textContent = "Connecté à Twitch";
    state.connectedChannels = channels;
    saveState();
  });

  client.on("disconnected", (reason) => {
    console.log("Déconnecté de Twitch:", reason);
    document.getElementById("connectionStatus").classList.remove("connected");
    document.getElementById("connectionText").textContent = "Déconnecté";
  });

  try {
    await client.connect();
    window.twitchClient = client;
  } catch (error) {
    console.error("Erreur de connexion Twitch:", error);
    document.getElementById("connectionText").textContent =
      "Erreur de connexion";
  }
}

// Callback OAuth Twitch
function handleTwitchCallback() {
  const hash = window.location.hash;
  if (hash) {
    const accessToken = hash.match(/access_token=([^&]*)/);
    if (accessToken) {
      Storage.set("twitchToken", accessToken[1]);
      window.location.hash = "";

      fetchTwitchUsername(accessToken[1]).then((username) => {
        if (username) {
          Storage.set("twitchUsername", username);
          initTwitchClient();
          updateTwitchUI();
        } else {
          alert("Impossible de récupérer le pseudo Twitch.");
        }
      });
    }
  }
}

// Rejoindre un channel
function joinChannel() {
  const channelName = document
    .getElementById("channelName")
    .value.trim()
    .toLowerCase();
  if (!channelName) {
    alert("Veuillez entrer un nom de channel");
    return;
  }

  if (!state.connectedChannels.includes(channelName)) {
    state.connectedChannels.push(channelName);
    Storage.set("connectedChannels", state.connectedChannels);

    // Rejoindre le channel avec le client actuel
    if (window.twitchClient) {
      window.twitchClient.join(channelName);
      console.log("Rejoint le channel:", channelName);
    }
  }

  document.getElementById("channelName").value = "";
  saveState();
}

// Démarrer un nouveau contexte de jeu
function startNewGameContext() {
  // Créer un jeu temporaire qui capture déjà les messages
  state.pendingGame = {
    id: Date.now().toString(),
    name: null, // Sera défini plus tard
    positiveReactions: 0,
    negativeReactions: 0,
    neutralReactions: 0,
    score: 0,
    totalMessages: 0,
    createdAt: new Date().toISOString(),
    isPending: true,
  };

  // Activer immédiatement le contexte de capture
  state.activeGame = state.pendingGame;

  // Afficher le formulaire de saisie
  document.getElementById("newGameContext").style.display = "none";
  document.getElementById("gameInputForm").style.display = "block";
  document.getElementById("pendingGameContext").style.display = "block";

  updateUI();
  saveState();

  console.log(
    "Nouveau contexte démarré - les messages sont maintenant capturés"
  );
}

// Confirmer le nouveau jeu
function confirmNewGame() {
  const gameName = document.getElementById("gameName").value.trim();

  if (!gameName) {
    alert("Veuillez entrer un nom de jeu");
    return;
  }

  // Finaliser le jeu en attente
  if (state.pendingGame && state.activeGame === state.pendingGame) {
    state.pendingGame.name = gameName;
    state.pendingGame.isPending = false;
    state.games.push(state.pendingGame);
    state.pendingGame = null;
  }

  // Réinitialiser l'interface
  document.getElementById("gameName").value = "";
  document.getElementById("gameInputForm").style.display = "none";
  document.getElementById("pendingGameContext").style.display = "none";
  document.getElementById("newGameContext").style.display = "none";
  document.getElementById("activeGameContext").style.display = "block";
  document.getElementById("currentGameName").textContent = gameName;

  updateUI();
  saveState();

  console.log(`Jeu "${gameName}" confirmé et activé`);
}

// Annuler la création du nouveau jeu
function cancelNewGame() {
  // Arrêter la capture de messages
  state.activeGame = null;
  state.pendingGame = null;

  document.getElementById("gameName").value = "";
  document.getElementById("gameInputForm").style.display = "none";
  document.getElementById("pendingGameContext").style.display = "none";
  document.getElementById("newGameContext").style.display = "block";

  updateUI();
  saveState();
}

// Terminer le contexte actuel
function endGameContext() {
  if (confirm("Êtes-vous sûr de vouloir terminer ce contexte de jeu ?")) {
    state.activeGame = null;
    state.pendingGame = null;
    updateUI();
    saveState();
  }
}

// NOUVELLE FONCTION : Supprimer un jeu
function removeGame(gameId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce jeu du classement ?")) {
    // Trouver l'index du jeu
    const gameIndex = state.games.findIndex((game) => game.id === gameId);

    if (gameIndex > -1) {
      // Retirer le jeu de la liste
      state.games.splice(gameIndex, 1);

      // Si c'est le jeu actif, le désactiver
      if (state.activeGame && state.activeGame.id === gameId) {
        state.activeGame = null;
      }

      saveState();
      updateUI();
      console.log(`Jeu avec l'ID ${gameId} supprimé`);
    }
  }
}

// Simulation de messages de chat (pour test)
function simulateChatMessage() {
  if (window.twitchClient) return; // Ne pas simuler si connecté à Twitch
  if (!state.activeGame) return;

  const viewers = [
    "Viewer123",
    "Gamer456",
    "HypeGamer",
    "StreamFan",
    "GameLover",
  ];
  const positiveMessages = [
    "Ce jeu a l'air incroyable !",
    "HYPE HYPE HYPE !!!",
    "Génial, j'ai hâte !",
    "Ça va être fou !",
    "Meilleur jeu de l'année !",
  ];
  const negativeMessages = [
    "Bof, ça a l'air nul...",
    "Pas convaincu du tout",
    "Décevant comme d'hab",
    "Encore un truc commercial",
    "Ça va être chiant",
  ];

  const isPositive = Math.random() > 0.3;
  const viewer = viewers[Math.floor(Math.random() * viewers.length)];
  const message = isPositive
    ? positiveMessages[Math.floor(Math.random() * positiveMessages.length)]
    : negativeMessages[Math.floor(Math.random() * negativeMessages.length)];

  handleChatMessage("simulation", viewer, message);
}

// Analyse de message
function analyzeMessage(message) {
  const messageWords = message.toLowerCase().split(/\s+/);
  let sentiment = "neutral";
  let foundKeywords = [];

  // Chercher des mots-clés positifs
  for (const word of state.keywords.positive) {
    if (messageWords.some((msgWord) => msgWord.includes(word.toLowerCase()))) {
      foundKeywords.push({ word, type: "positive" });
    }
  }

  // Chercher des mots-clés négatifs
  for (const word of state.keywords.negative) {
    if (messageWords.some((msgWord) => msgWord.includes(word.toLowerCase()))) {
      foundKeywords.push({ word, type: "negative" });
    }
  }

  if (foundKeywords.length > 0) {
    const positiveCount = foundKeywords.filter(
      (k) => k.type === "positive"
    ).length;
    const negativeCount = foundKeywords.filter(
      (k) => k.type === "negative"
    ).length;

    if (positiveCount > negativeCount) sentiment = "positive";
    else if (negativeCount > positiveCount) sentiment = "negative";
  }

  return {
    sentiment,
    keywords: foundKeywords,
  };
}

// Ajout d'un message dans le chat
function addChatMessage(username, message, sentiment) {
  const chatMessages = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "chat-message " + (sentiment || "neutral");
  div.innerHTML = `<strong>${username}:</strong> ${message}`;
  chatMessages.appendChild(div);

  // Limiter le nombre de messages affichés
  while (chatMessages.children.length > 10) {
    chatMessages.removeChild(chatMessages.firstChild);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Gestion d'un message reçu (Twitch ou simulation)
function handleChatMessage(channel, username, message) {
  state.messageCount++;
  const analysis = analyzeMessage(message);

  // Analyser et mettre à jour les stats uniquement si on a un contexte actif
  if (state.activeGame) {
    updateGameStats(state.activeGame.id, analysis.sentiment);
  }

  addChatMessage(username, message, analysis.sentiment);
  updateLeaderboard();
  updateUI();
  saveState();
}

// Mise à jour des stats d'un jeu - CORRECTION DU BUG
function updateGameStats(gameId, sentiment) {
  let game;

  // Chercher dans le jeu actif ou en attente
  if (state.activeGame && state.activeGame.id === gameId) {
    game = state.activeGame;
  } else {
    game = state.games.find((g) => g.id === gameId);
  }

  if (!game) return;

  // CORRECTION : Incrémenter totalMessages avant de traiter le sentiment
  game.totalMessages = (game.totalMessages || 0) + 1;

  switch (sentiment) {
    case "positive":
      game.positiveReactions = (game.positiveReactions || 0) + 1;
      break;
    case "negative":
      game.negativeReactions = (game.negativeReactions || 0) + 1;
      break;
    case "neutral":
      game.neutralReactions = (game.neutralReactions || 0) + 1;
      break;
  }

  calculateGameScore(game);
}

// Ajout d'un mot-clé
function addKeyword() {
  const newKeyword = document
    .getElementById("newKeyword")
    .value.trim()
    .toLowerCase();
  const keywordType = document.querySelector(
    'input[name="keywordType"]:checked'
  ).value;

  if (!newKeyword) {
    alert("Veuillez entrer un mot-clé");
    return;
  }

  if (state.keywords[keywordType].includes(newKeyword)) {
    alert("Ce mot-clé existe déjà");
    return;
  }

  state.keywords[keywordType].push(newKeyword);
  saveState();
  updateUI();
  document.getElementById("newKeyword").value = "";
}

// Suppression d'un mot-clé
function removeKeyword(button) {
  // Le bouton est dans le tag du mot-clé
  const keywordTag = button.parentElement;
  // Récupère le texte du mot-clé (sans le bouton ×)
  const keyword = keywordTag.textContent.replace("×", "").trim().toLowerCase();
  // Détermine le type (positive/negative) via la classe CSS
  const isPositive = keywordTag.classList.contains("positive");
  const keywordType = isPositive ? "positive" : "negative";
  // Trouve l'index dans le tableau
  const index = state.keywords[keywordType].indexOf(keyword);
  if (index > -1) {
    state.keywords[keywordType].splice(index, 1);
    saveState();
    updateUI();
  }
}

// NOUVELLE FONCTION : Import des données
function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = function (e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const importedData = JSON.parse(event.target?.result);

        // Validation basique des données
        if (!importedData.games || !importedData.keywords) {
          alert("Fichier invalide : structure de données incorrecte");
          return;
        }

        // Demander confirmation
        const confirmImport = confirm(
          `Voulez-vous importer ces données ?\n` +
            `- ${importedData.games?.length || 0} jeux\n` +
            `- ${
              (importedData.keywords?.positive?.length || 0) +
              (importedData.keywords?.negative?.length || 0)
            } mots-clés\n` +
            `- ${importedData.totalMessages || 0} messages analysés\n\n` +
            `Cela remplacera vos données actuelles.`
        );

        if (confirmImport) {
          // Fusionner les données importées avec l'état actuel
          state.games = [...(state.games || []), ...(importedData.games || [])];

          // Pour les mots-clés, on les ajoute s'ils n'existent pas déjà
          if (importedData.keywords?.positive) {
            importedData.keywords.positive.forEach((keyword) => {
              if (!state.keywords.positive.includes(keyword)) {
                state.keywords.positive.push(keyword);
              }
            });
          }

          if (importedData.keywords?.negative) {
            importedData.keywords.negative.forEach((keyword) => {
              if (!state.keywords.negative.includes(keyword)) {
                state.keywords.negative.push(keyword);
              }
            });
          }

          // Mettre à jour le compteur de messages si nécessaire
          if (
            importedData.totalMessages &&
            importedData.totalMessages > state.messageCount
          ) {
            state.messageCount = importedData.totalMessages;
          }

          saveState();
          updateUI();
          alert("Données importées avec succès !");
        }
      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        alert(
          "Erreur lors de l'import du fichier. Vérifiez que le fichier est valide."
        );
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

// Export des données - AMÉLIORÉ
function exportData() {
  const data = {
    games: state.games,
    keywords: state.keywords,
    totalMessages: state.messageCount,
    timestamp: new Date().toISOString(),
    version: "1.0", // Pour la compatibilité future
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hypometer_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Réinitialisation des données
function resetData() {
  if (confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ?")) {
    state = {
      activeGame: null,
      pendingGame: null,
      games: [],
      keywords: {
        positive: ["hype", "incroyable", "génial"],
        negative: ["nul", "décevant"],
      },
      messageCount: 0,
      connectedChannels: [],
    };
    saveState();
    updateUI();
  }
}

// Gestion manuelle du hype (+1/-1)
function manualHype(gameId, value) {
  const game = state.games.find((g) => g.id === gameId);
  if (!game) return;

  if (value === 1) {
    game.positiveReactions = (game.positiveReactions || 0) + 1;
  } else if (value === -1) {
    game.negativeReactions = (game.negativeReactions || 0) + 1;
  }

  game.totalMessages = (game.totalMessages || 0) + 1;
  calculateGameScore(game);
  saveState();
  updateLeaderboard();
  updateUI();
}

// Mise à jour du leaderboard - AVEC BOUTON SUPPRIMER
function updateLeaderboard() {
  if (!state.games || state.games.length === 0) return;

  // Sort by (positiveReactions - negativeReactions) descending, then by totalMessages descending
  const sortedGames = [...state.games].sort((a, b) => {
    const diffA = (a.positiveReactions || 0) - (a.negativeReactions || 0);
    const diffB = (b.positiveReactions || 0) - (b.negativeReactions || 0);
    if (diffB !== diffA) return diffB - diffA;
    return (b.totalMessages || 0) - (a.totalMessages || 0);
  });

  const gamesList = document.getElementById("gamesList");
  gamesList.innerHTML = "";

  sortedGames.forEach((game, index) => {
    const rankClass =
      index === 0
        ? "rank-1"
        : index === 1
        ? "rank-2"
        : index === 2
        ? "rank-3"
        : "rank-other";
    const diff = (game.positiveReactions || 0) - (game.negativeReactions || 0);
    const gameDiv = document.createElement("div");
    gameDiv.className = `game-item ${rankClass}`;
    gameDiv.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="game-info">
                <div class="game-name">${game.name || "Jeu en cours..."}</div>
                <div class="game-stats">
                    ${game.positiveReactions || 0} positives • 
                    ${game.negativeReactions || 0} négatives • 
                    ${game.totalMessages || 0} messages<br>
                    <strong>Différence : ${diff}</strong>
                </div>
                <div class="manual-hype-controls" style="margin-top:8px;">
                    <button class="btn-hype" onclick="manualHype('${
                      game.id
                    }', 1)">+1</button>
                    <button class="btn-dehype" onclick="manualHype('${
                      game.id
                    }', -1)">-1</button>
                    <button class="btn-remove" onclick="removeGame('${
                      game.id
                    }')" style="background-color: #dc3545; margin-left: 5px;">🗑️</button>
                </div>
            </div>
        `;
    gamesList.appendChild(gameDiv);
  });
}

// UI et initialisation
function updateUI() {
  updateLeaderboard();
  document.getElementById("messagesCount").textContent = state.messageCount;

  // Mots-clés
  const keywordList = document.getElementById("keywordList");
  keywordList.innerHTML = "";

  state.keywords.positive.forEach((keyword) => {
    const keywordTag = document.createElement("div");
    keywordTag.className = "keyword-tag positive";
    keywordTag.innerHTML = `${keyword} <button class="remove-keyword" onclick="removeKeyword(this)">×</button>`;
    keywordList.appendChild(keywordTag);
  });

  state.keywords.negative.forEach((keyword) => {
    const keywordTag = document.createElement("div");
    keywordTag.className = "keyword-tag negative";
    keywordTag.innerHTML = `${keyword} <button class="remove-keyword" onclick="removeKeyword(this)">×</button>`;
    keywordList.appendChild(keywordTag);
  });

  // Contexte de jeu
  if (state.activeGame && !state.activeGame.isPending) {
    document.getElementById("currentGameName").textContent =
      state.activeGame.name;
    document.getElementById("activeGameContext").style.display = "block";
    document.getElementById("newGameContext").style.display = "none";
    document.getElementById("gameInputForm").style.display = "none";
    document.getElementById("pendingGameContext").style.display = "none";
  } else if (state.activeGame && state.activeGame.isPending) {
    document.getElementById("activeGameContext").style.display = "none";
    document.getElementById("newGameContext").style.display = "none";
    document.getElementById("gameInputForm").style.display = "block";
    document.getElementById("pendingGameContext").style.display = "block";
  } else {
    document.getElementById("activeGameContext").style.display = "none";
    document.getElementById("newGameContext").style.display = "block";
    document.getElementById("gameInputForm").style.display = "none";
    document.getElementById("pendingGameContext").style.display = "none";
  }
}

// Chargement de l'état initial
function loadInitialState() {
  const savedState = Storage.get("appState");
  if (savedState) {
    state = { ...state, ...savedState };
    // Ne pas réactiver un contexte en attente au rechargement
    if (state.activeGame && state.activeGame.isPending) {
      state.activeGame = null;
      state.pendingGame = null;
    }
  }
  updateUI();
}

// UI Twitch
function updateTwitchUI() {
  const accessToken = Storage.get("twitchToken");
  const username = Storage.get("twitchUsername");
  const isConnected = !!accessToken && !!username;

  document.getElementById("twitchConnectBtn").style.display = isConnected
    ? "none"
    : "inline-block";
  document.getElementById("twitchUserInfo").style.display = isConnected
    ? "block"
    : "none";
  document.getElementById("channelInputs").style.display = isConnected
    ? "block"
    : "none";

  if (isConnected) {
    document.getElementById(
      "twitchUsernameDisplay"
    ).textContent = `Connecté en tant que ${username}`;
    checkLiveStatus(username);
  } else {
    document.getElementById("twitchUsernameDisplay").textContent = "";
    document.getElementById("liveStatus").textContent = "";
  }
}

function disconnectTwitch() {
  if (window.twitchClient) {
    window.twitchClient.disconnect();
  }

  Storage.remove("twitchToken");
  Storage.remove("twitchUsername");
  Storage.remove("connectedChannels");
  state.connectedChannels = [];

  document.getElementById("connectionStatus").classList.remove("connected");
  document.getElementById("connectionText").textContent = "Déconnecté";
  updateTwitchUI();
  saveState();
}

// Vérifie si le channel est en live
async function checkLiveStatus(username) {
  const accessToken = Storage.get("twitchToken");
  if (!accessToken || !username) return;

  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${username}`,
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      document.getElementById("liveStatus").textContent = "🟢 En live";
    } else {
      document.getElementById("liveStatus").textContent = "🔴 Hors ligne";
    }
  } catch (e) {
    console.error("Erreur lors de la vérification du statut live:", e);
    document.getElementById("liveStatus").textContent = "";
  }
}

// Récupère le pseudo Twitch via l'API
async function fetchTwitchUsername(accessToken) {
  try {
    const response = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": TWITCH_CLIENT_ID,
      },
    });
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data[0].login;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du username:", error);
  }
  return null;
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  loadInitialState();
  handleTwitchCallback();
  updateTwitchUI();

  // Simuler des messages seulement si pas connecté à Twitch
  setInterval(() => {
    if (!window.twitchClient) {
      simulateChatMessage();
    }
  }, 3000);
});
