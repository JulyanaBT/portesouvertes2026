import { db } from "../../firebase.js";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ========================================
   ELEMENTS
======================================== */

const countTotal =
  document.getElementById(
    "countTotal"
  );

const countActive =
  document.getElementById(
    "countActive"
  );

const countWaiting =
  document.getElementById(
    "countWaiting"
  );

const playersList =
  document.getElementById(
    "playersList"
  );

const listStatus =
  document.getElementById(
    "listStatus"
  );

const addPlayerBtn =
  document.getElementById(
    "addPlayerBtn"
  );

const addPlayerPanel =
  document.getElementById(
    "addPlayerPanel"
  );

const addPlayerForm =
  document.getElementById(
    "addPlayerForm"
  );

const cancelAddPlayerBtn =
  document.getElementById(
    "cancelAddPlayerBtn"
  );

const savePlayerBtn =
  document.getElementById(
    "savePlayerBtn"
  );

const addPrenom =
  document.getElementById(
    "addPrenom"
  );

const addNom =
  document.getElementById(
    "addNom"
  );

const addSurnom =
  document.getElementById(
    "addSurnom"
  );

const addPlayerMessage =
  document.getElementById(
    "addPlayerMessage"
  );


/* ========================================
   FIRESTORE
======================================== */

const playersRef =
  collection(
    db,
    "players"
  );

const nicknamesRef =
  collection(
    db,
    "nicknames"
  );

const playersQuery =
  query(
    playersRef,
    orderBy(
      "createdAt",
      "asc"
    )
  );


/* ========================================
   STATE
======================================== */

let players = [];

let isSavingPlayer = false;


/* ========================================
   HELPERS
======================================== */

function clean(value) {

  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");

}


function normalizeKey(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


function escapeHtml(value) {

  return String(value || "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function getNickname(player) {

  return clean(
    player.surnom ||
    player.nickname ||
    "Sans surnom"
  );

}


function getFullName(player) {

  return clean(
    `${player.prenom || ""} ${player.nom || ""}`
  ) || "—";

}


function sortPlayers(a, b) {

  if (
    a.active === true &&
    b.active !== true
  ) {
    return -1;
  }

  if (
    a.active !== true &&
    b.active === true
  ) {
    return 1;
  }

  return getNickname(a)
    .localeCompare(
      getNickname(b),
      "fr",
      {
        sensitivity:
          "base",

        numeric:
          true
      }
    );

}


/* ========================================
   MESSAGES
======================================== */

function setAddMessage(
  type,
  text
) {

  addPlayerMessage.className =
    `admin-message visible ${type}`;

  addPlayerMessage.textContent =
    text;

}


function clearAddMessage() {

  addPlayerMessage.className =
    "admin-message";

  addPlayerMessage.textContent =
    "";

}


/* ========================================
   RENDER
======================================== */

function render() {

  const activePlayers =
    players.filter(
      player =>
        player.active === true
    );

  const waitingPlayers =
    players.filter(
      player =>
        player.active !== true
    );


  countTotal.textContent =
    String(
      players.length
    );

  countActive.textContent =
    String(
      activePlayers.length
    );

  countWaiting.textContent =
    String(
      waitingPlayers.length
    );


  listStatus.textContent =
    `${players.length} joueur${players.length > 1 ? "s" : ""}`;


  if (
    players.length === 0
  ) {

    playersList.innerHTML = `

      <div class="players-empty">
        Aucun joueur inscrit.
      </div>

    `;

    return;

  }


  const sortedPlayers =
    [...players]
      .sort(
        sortPlayers
      );


  playersList.innerHTML =
    sortedPlayers
      .map(
        player =>
          renderPlayerCard(
            player
          )
      )
      .join("");

}


function renderPlayerCard(
  player
) {

  const active =
    player.active === true;

  const nickname =
    getNickname(
      player
    );

  const fullName =
    getFullName(
      player
    );


  return `

    <article
      class="player-admin-card ${active ? "active" : "waiting"}"
      data-player-id="${escapeHtml(player.id)}"
    >

      <div class="player-card-head">

        <div class="player-main">

          <div class="player-nickname">
            ${escapeHtml(nickname)}
          </div>

          <div class="player-name">
            ${escapeHtml(fullName)}
          </div>

        </div>


        <span
          class="player-status ${active ? "active" : "waiting"}"
        >
          ${active ? "Actif" : "Attente"}
        </span>

      </div>


      <div class="player-quick-actions">

        <button
          class="admin-btn ${active ? "admin-btn-warning" : "admin-btn-success"}"
          type="button"
          data-action="toggle"
          data-id="${escapeHtml(player.id)}"
        >
          ${
            active
              ? "⏸ Désactiver"
              : "▶️ Activer"
          }
        </button>


        <button
          class="admin-btn"
          type="button"
          data-action="edit"
          data-id="${escapeHtml(player.id)}"
        >
          ✏️
        </button>

      </div>


      <details class="player-more">

        <summary>
          Plus d'actions
        </summary>


        <div class="player-secondary-actions">

          <button
            class="admin-btn"
            type="button"
            data-action="edit"
            data-id="${escapeHtml(player.id)}"
          >
            Modifier
          </button>


          <button
            class="admin-btn admin-btn-danger"
            type="button"
            data-action="delete"
            data-id="${escapeHtml(player.id)}"
          >
            Supprimer
          </button>

        </div>

      </details>

    </article>

  `;

}


/* ========================================
   LISTENER FIRESTORE
======================================== */

onSnapshot(

  playersQuery,

  snapshot => {

    players =
      snapshot.docs.map(
        snapshotDoc => ({

          id:
            snapshotDoc.id,

          ...snapshotDoc.data()

        })
      );


    render();

  },


  error => {

    console.error(
      "Erreur chargement joueurs admin :",
      error
    );


    listStatus.textContent =
      "Erreur";


    playersList.innerHTML = `

      <div class="players-empty">
        Impossible de charger les joueurs.
      </div>

    `;

  }

);


/* ========================================
   AJOUT PANEL
======================================== */

addPlayerBtn.addEventListener(
  "click",
  () => {

    clearAddMessage();

    addPlayerPanel.classList.toggle(
      "visible"
    );


    if (
      addPlayerPanel.classList.contains(
        "visible"
      )
    ) {

      addPrenom.focus();

    }

  }
);


cancelAddPlayerBtn.addEventListener(
  "click",
  () => {

    addPlayerForm.reset();

    clearAddMessage();

    addPlayerPanel.classList.remove(
      "visible"
    );

  }
);


/* ========================================
   AJOUT MANUEL
======================================== */

addPlayerForm.addEventListener(
  "submit",

  async event => {

    event.preventDefault();

    if (
      isSavingPlayer
    ) {
      return;
    }


    clearAddMessage();


    const prenom =
      clean(
        addPrenom.value
      );

    const nom =
      clean(
        addNom.value
      );

    const surnom =
      clean(
        addSurnom.value
      );


    if (
      !prenom ||
      !nom ||
      !surnom
    ) {

      setAddMessage(
        "error",
        "Prénom, nom et surnom sont obligatoires."
      );

      return;

    }


    const nicknameKey =
      normalizeKey(
        surnom
      );


    if (
      !nicknameKey
    ) {

      setAddMessage(
        "error",
        "Le surnom n'est pas valide."
      );

      return;

    }


    isSavingPlayer =
      true;

    savePlayerBtn.disabled =
      true;

    savePlayerBtn.textContent =
      "Ajout…";


    try {

      const playerRef =
        doc(
          playersRef
        );

      const nicknameRef =
        doc(
          nicknamesRef,
          nicknameKey
        );


      await runTransaction(
        db,

        async transaction => {

          const nicknameSnapshot =
            await transaction.get(
              nicknameRef
            );


          if (
            nicknameSnapshot.exists()
          ) {

            throw new Error(
              "Ce surnom est déjà utilisé."
            );

          }


          transaction.set(
            playerRef,
            {

              prenom,

              nom,

              surnom,

              nicknameKey,

              active:
                false,

              status:
                "registered",

              arrivalAt:
                null,

              departureAt:
                null,

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()

            }
          );


          transaction.set(
            nicknameRef,
            {

              nickname:
                surnom,

              playerId:
                playerRef.id,

              createdAt:
                serverTimestamp()

            }
          );

        }
      );


      addPlayerForm.reset();


      setAddMessage(
        "ok",
        `${surnom} a été ajouté.`
      );

    }

    catch (error) {

      console.error(
        "Erreur ajout joueur :",
        error
      );


      setAddMessage(
        "error",
        error?.message ||
        "Impossible d'ajouter le joueur."
      );

    }

    finally {

      isSavingPlayer =
        false;

      savePlayerBtn.disabled =
        false;

      savePlayerBtn.textContent =
        "Ajouter";

    }

  }

);


/* ========================================
   ACTIVER / DESACTIVER
======================================== */

async function togglePlayer(
  player
) {

  const playerRef =
    doc(
      db,
      "players",
      player.id
    );


  const newActive =
    player.active !== true;


  await updateDoc(
    playerRef,
    {

      active:
        newActive,

      status:
        newActive
          ? "active"
          : "registered",

      arrivalAt:
        newActive
          ? serverTimestamp()
          : player.arrivalAt || null,

      departureAt:
        newActive
          ? null
          : serverTimestamp(),

      updatedAt:
        serverTimestamp()

    }
  );

}


/* ========================================
   MODIFIER
======================================== */

async function editPlayer(
  player
) {

  const oldNickname =
    getNickname(
      player
    );


  const prenom =
    prompt(
      "Prénom :",
      player.prenom || ""
    );


  if (
    prenom === null
  ) {
    return;
  }


  const nom =
    prompt(
      "Nom :",
      player.nom || ""
    );


  if (
    nom === null
  ) {
    return;
  }


  const surnom =
    prompt(
      "Surnom :",
      oldNickname
    );


  if (
    surnom === null
  ) {
    return;
  }


  const newPrenom =
    clean(
      prenom
    );

  const newNom =
    clean(
      nom
    );

  const newNickname =
    clean(
      surnom
    );


  if (
    !newPrenom ||
    !newNom ||
    !newNickname
  ) {

    alert(
      "Prénom, nom et surnom sont obligatoires."
    );

    return;

  }


  const oldNicknameKey =
    player.nicknameKey ||
    normalizeKey(
      oldNickname
    );


  const newNicknameKey =
    normalizeKey(
      newNickname
    );


  if (
    !newNicknameKey
  ) {

    alert(
      "Le surnom n'est pas valide."
    );

    return;

  }


  const playerRef =
    doc(
      db,
      "players",
      player.id
    );


  /*
   * PAS DE CHANGEMENT DE CLE SURNOM
   */

  if (
    oldNicknameKey ===
    newNicknameKey
  ) {

    await updateDoc(
      playerRef,
      {

        prenom:
          newPrenom,

        nom:
          newNom,

        surnom:
          newNickname,

        updatedAt:
          serverTimestamp()

      }
    );

    return;

  }


  /*
   * CHANGEMENT DE SURNOM
   */

  const oldNicknameRef =
    doc(
      nicknamesRef,
      oldNicknameKey
    );


  const newNicknameRef =
    doc(
      nicknamesRef,
      newNicknameKey
    );


  await runTransaction(
    db,

    async transaction => {

      const newNicknameSnapshot =
        await transaction.get(
          newNicknameRef
        );


      if (
        newNicknameSnapshot.exists()
      ) {

        throw new Error(
          "Ce surnom est déjà utilisé."
        );

      }


      transaction.update(
        playerRef,
        {

          prenom:
            newPrenom,

          nom:
            newNom,

          surnom:
            newNickname,

          nicknameKey:
            newNicknameKey,

          updatedAt:
            serverTimestamp()

        }
      );


      transaction.delete(
        oldNicknameRef
      );


      transaction.set(
        newNicknameRef,
        {

          nickname:
            newNickname,

          playerId:
            player.id,

          createdAt:
            serverTimestamp()

        }
      );

    }
  );

}


/* ========================================
   SUPPRIMER
======================================== */

async function deletePlayer(
  player
) {

  const nickname =
    getNickname(
      player
    );


  const confirmed =
    confirm(
      `Supprimer définitivement ${nickname} ?`
    );


  if (
    !confirmed
  ) {
    return;
  }


  const playerRef =
    doc(
      db,
      "players",
      player.id
    );


  const nicknameKey =
    player.nicknameKey ||
    normalizeKey(
      nickname
    );


  const nicknameRef =
    doc(
      nicknamesRef,
      nicknameKey
    );


  await runTransaction(
    db,

    async transaction => {

      transaction.delete(
        playerRef
      );

      transaction.delete(
        nicknameRef
      );

    }
  );

}


/* ========================================
   ACTIONS CARTES
======================================== */

playersList.addEventListener(
  "click",

  async event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (
      !button
    ) {
      return;
    }


    const playerId =
      button.dataset.id;


    const action =
      button.dataset.action;


    const player =
      players.find(
        item =>
          item.id === playerId
      );


    if (
      !player
    ) {
      return;
    }


    button.disabled =
      true;


    try {

      if (
        action === "toggle"
      ) {

        await togglePlayer(
          player
        );

      }


      if (
        action === "edit"
      ) {

        await editPlayer(
          player
        );

      }


      if (
        action === "delete"
      ) {

        await deletePlayer(
          player
        );

      }

    }

    catch (error) {

      console.error(
        "Erreur action joueur :",
        error
      );


      alert(
        error?.message ||
        "Action impossible."
      );

    }

    finally {

      button.disabled =
        false;

    }

  }

);
