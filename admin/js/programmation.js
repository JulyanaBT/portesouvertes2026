import { db } from "../../firebase.js";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ========================================
   CONFIGURATION
======================================== */

const COURTS = [
  "Lisa de Los Pimentos",
  "Manon Queen Bee"
];

const MAX_PLAYERS_ON_COURT =
  COURTS.length * 4;


/* ========================================
   ELEMENTS
======================================== */

const countActive =
  document.getElementById(
    "countActive"
  );

const countRounds =
  document.getElementById(
    "countRounds"
  );

const countPending =
  document.getElementById(
    "countPending"
  );

const countDone =
  document.getElementById(
    "countDone"
  );

const statusMsg =
  document.getElementById(
    "statusMsg"
  );

const btnInitial =
  document.getElementById(
    "btnInitial"
  );

const btnNext =
  document.getElementById(
    "btnNext"
  );

const btnReset =
  document.getElementById(
    "btnReset"
  );

const currentList =
  document.getElementById(
    "currentList"
  );

const doneList =
  document.getElementById(
    "doneList"
  );

const editModal =
  document.getElementById(
    "editModal"
  );

const editFields =
  document.getElementById(
    "editFields"
  );

const btnCancelEdit =
  document.getElementById(
    "btnCancelEdit"
  );

const btnSaveEdit =
  document.getElementById(
    "btnSaveEdit"
  );


/* ========================================
   FIRESTORE
======================================== */

const playersRef =
  collection(
    db,
    "players"
  );

const matchesRef =
  collection(
    db,
    "matches"
  );

const programmationRef =
  doc(
    db,
    "settings",
    "programmation"
  );


/* ========================================
   STATE
======================================== */

let players = [];

let matches = [];

let config = {};

let editing = null;

let actionRunning = false;


/* ========================================
   HELPERS
======================================== */

function clean(value) {

  return String(value || "")
    .trim();

}


function escapeHtml(value) {

  return String(value ?? "")
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


function shuffle(array) {

  const result =
    [...array];


  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];

  }


  return result;

}


function getNickname(playerId) {

  const player =
    players.find(
      item =>
        item.id === playerId
    );


  return clean(
    player?.surnom ||
    player?.nickname ||
    "Joueur"
  );

}


function getTeamName(team) {

  if (
    !Array.isArray(team)
  ) {

    return "Équipe";

  }


  return team
    .map(
      getNickname
    )
    .join(" / ");

}


function getBenchNames(bench) {

  if (
    !Array.isArray(bench) ||
    bench.length === 0
  ) {

    return "Aucun joueur sur le banc";

  }


  return bench
    .map(
      getNickname
    )
    .join(" • ");

}


function activePlayers() {

  return players
    .filter(
      player =>
        player.active === true
    )
    .sort(
      (a, b) =>
        getNickname(a.id)
          .localeCompare(
            getNickname(b.id),
            "fr",
            {
              sensitivity:
                "base",

              numeric:
                true
            }
          )
    );

}


function completedMatches() {

  return matches.filter(
    match =>
      match.status ===
      "completed"
  );

}


function pendingMatches() {

  return matches.filter(
    match =>
      match.status !==
      "completed"
  );

}


function getRoundNumbers() {

  return [
    ...new Set(
      matches.map(
        match =>
          Number(
            match.roundNumber
          )
      )
    )
  ]
    .filter(
      number =>
        Number.isFinite(
          number
        )
    )
    .sort(
      (a, b) =>
        a - b
    );

}


function matchesForRound(
  roundNumber
) {

  return matches
    .filter(
      match =>
        Number(
          match.roundNumber
        ) ===
        Number(
          roundNumber
        )
    )
    .sort(
      (a, b) =>
        Number(
          a.matchIndex || 0
        ) -
        Number(
          b.matchIndex || 0
        )
    );

}


function roundCompleted(
  roundNumber
) {

  const roundMatches =
    matchesForRound(
      roundNumber
    );


  return (
    roundMatches.length > 0 &&
    roundMatches.every(
      match =>
        match.status ===
        "completed"
    )
  );

}


/* ========================================
   STATISTIQUES ROTATION
======================================== */

function createStats(
  sourceMatches
) {

  const stats =
    new Map();


  players.forEach(
    player => {

      stats.set(
        player.id,
        {
          played: 0,
          bench: 0,
          partners:
            new Map(),
          opponents:
            new Map()
        }
      );

    }
  );


  const roundMap =
    new Map();


  sourceMatches.forEach(
    match => {

      const roundNumber =
        Number(
          match.roundNumber
        );


      if (
        !roundMap.has(
          roundNumber
        )
      ) {

        roundMap.set(
          roundNumber,
          []
        );

      }


      roundMap
        .get(roundNumber)
        .push(match);

    }
  );


  roundMap.forEach(
    roundMatches => {

      const bench =
        roundMatches.find(
          match =>
            Array.isArray(
              match.bench
            )
        )?.bench || [];


      bench.forEach(
        playerId => {

          if (
            stats.has(
              playerId
            )
          ) {

            stats.get(
              playerId
            ).bench++;

          }

        }
      );

    }
  );


  sourceMatches.forEach(
    match => {

      const teamA =
        Array.isArray(
          match.teamA
        )
          ? match.teamA
          : [];

      const teamB =
        Array.isArray(
          match.teamB
        )
          ? match.teamB
          : [];


      [
        ...teamA,
        ...teamB
      ].forEach(
        playerId => {

          if (
            stats.has(
              playerId
            )
          ) {

            stats.get(
              playerId
            ).played++;

          }

        }
      );


      if (
        teamA.length === 2
      ) {

        addPartner(
          stats,
          teamA[0],
          teamA[1]
        );

      }


      if (
        teamB.length === 2
      ) {

        addPartner(
          stats,
          teamB[0],
          teamB[1]
        );

      }


      teamA.forEach(
        playerA => {

          teamB.forEach(
            playerB => {

              addOpponent(
                stats,
                playerA,
                playerB
              );

              addOpponent(
                stats,
                playerB,
                playerA
              );

            }
          );

        }
      );

    }
  );


  return stats;

}


function addPartner(
  stats,
  playerA,
  playerB
) {

  if (
    !stats.has(playerA) ||
    !stats.has(playerB)
  ) {
    return;
  }


  const partnersA =
    stats.get(
      playerA
    ).partners;

  const partnersB =
    stats.get(
      playerB
    ).partners;


  partnersA.set(
    playerB,
    (
      partnersA.get(
        playerB
      ) || 0
    ) + 1
  );


  partnersB.set(
    playerA,
    (
      partnersB.get(
        playerA
      ) || 0
    ) + 1
  );

}


function addOpponent(
  stats,
  playerA,
  playerB
) {

  if (
    !stats.has(
      playerA
    )
  ) {
    return;
  }


  const opponents =
    stats.get(
      playerA
    ).opponents;


  opponents.set(
    playerB,
    (
      opponents.get(
        playerB
      ) || 0
    ) + 1
  );

}


/* ========================================
   SELECTION DES JOUEURS
======================================== */

function choosePlayers(
  activeList,
  sourceMatches
) {

  const stats =
    createStats(
      sourceMatches
    );


  const ranked =
    [...activeList]
      .sort(
        (a, b) => {

          const statsA =
            stats.get(a.id) || {};

          const statsB =
            stats.get(b.id) || {};


          /*
           * Priorité :
           *
           * 1. moins de matchs joués
           * 2. plus de passages au banc
           * 3. hasard
           */

          if (
            (statsA.played || 0) !==
            (statsB.played || 0)
          ) {

            return (
              (statsA.played || 0) -
              (statsB.played || 0)
            );

          }


          if (
            (statsA.bench || 0) !==
            (statsB.bench || 0)
          ) {

            return (
              (statsB.bench || 0) -
              (statsA.bench || 0)
            );

          }


          return (
            Math.random() -
            .5
          );

        }
      );


  const playingCount =
    Math.min(
      MAX_PLAYERS_ON_COURT,
      Math.floor(
        ranked.length / 4
      ) * 4
    );


  if (
    playingCount < 4
  ) {

    throw new Error(
      "Il faut au moins 4 joueurs actifs."
    );

  }


  return {

    selected:
      ranked.slice(
        0,
        playingCount
      ),

    bench:
      ranked
        .slice(
          playingCount
        )
        .map(
          player =>
            player.id
        )

  };

}


/* ========================================
   QUALITE D'UNE COMPOSITION
======================================== */

function arrangementScore(
  ids,
  sourceMatches
) {

  const stats =
    createStats(
      sourceMatches
    );


  let score = 0;


  for (
    let i = 0;
    i < ids.length;
    i += 4
  ) {

    const teamA = [
      ids[i],
      ids[i + 1]
    ];

    const teamB = [
      ids[i + 2],
      ids[i + 3]
    ];


    const partnerA =
      stats
        .get(teamA[0])
        ?.partners
        .get(teamA[1]) || 0;


    const partnerB =
      stats
        .get(teamB[0])
        ?.partners
        .get(teamB[1]) || 0;


    /*
     * Rejouer avec le même partenaire
     * est fortement pénalisé.
     */

    score +=
      partnerA * 1000;

    score +=
      partnerB * 1000;


    /*
     * Rejouer contre le même adversaire
     * est également pénalisé,
     * mais moins fortement.
     */

    teamA.forEach(
      playerA => {

        teamB.forEach(
          playerB => {

            score +=
              (
                stats
                  .get(playerA)
                  ?.opponents
                  .get(playerB) ||
                0
              ) * 120;

          }
        );

      }
    );

  }


  return score;

}


/* ========================================
   CREATION D'UN TOUR
======================================== */

function buildRound(
  roundNumber,
  sourceMatches
) {

  const activeList =
    activePlayers();


  const {
    selected,
    bench
  } =
    choosePlayers(
      activeList,
      sourceMatches
    );


  const selectedIds =
    selected.map(
      player =>
        player.id
    );


  let bestIds = null;

  let bestScore =
    Infinity;


  /*
   * On essaie beaucoup de combinaisons
   * et on garde la meilleure.
   */

  for (
    let attempt = 0;
    attempt < 1500;
    attempt++
  ) {

    const candidate =
      shuffle(
        selectedIds
      );


    const score =
      arrangementScore(
        candidate,
        sourceMatches
      );


    if (
      score < bestScore
    ) {

      bestScore =
        score;

      bestIds =
        candidate;

    }

  }


  const generated =
    [];


  for (
    let index = 0;
    index < bestIds.length / 4;
    index++
  ) {

    const base =
      index * 4;


    generated.push({

      roundNumber,

      matchIndex:
        index + 1,

      court:
        COURTS[index] ||
        `Terrain ${index + 1}`,

      teamA: [
        bestIds[base],
        bestIds[base + 1]
      ],

      teamB: [
        bestIds[base + 2],
        bestIds[base + 3]
      ],

      bench,

      scoreA:
        null,

      scoreB:
        null,

      status:
        "pending",

      winner:
        null

    });

  }


  return generated;

}


/* ========================================
   ENREGISTRER UN TOUR
======================================== */

async function saveRound(
  generatedMatches
) {

  const batch =
    writeBatch(db);


  generatedMatches.forEach(
    match => {

      const matchRef =
        doc(
          matchesRef
        );


      batch.set(
        matchRef,
        {
          ...match,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()
        }
      );

    }
  );


  await batch.commit();

}


/* ========================================
   GENERATION INITIALE
======================================== */

async function generateInitial() {

  if (
    actionRunning
  ) {
    return;
  }


  if (
    matches.length > 0
  ) {

    alert(
      "Une programmation existe déjà."
    );

    return;

  }


  if (
    activePlayers().length < 4
  ) {

    alert(
      "Il faut au moins 4 joueurs actifs."
    );

    return;

  }


  actionRunning = true;

  btnInitial.disabled =
    true;


  statusMsg.textContent =
    "Génération des deux premiers tours…";


  try {

    /*
     * TOUR 1
     */

    const round1 =
      buildRound(
        1,
        []
      );


    /*
     * TOUR 2
     *
     * On intègre déjà le tour 1 dans
     * le calcul pour avoir immédiatement
     * une rotation différente.
     */

    const round2 =
      buildRound(
        2,
        round1
      );


    const batch =
      writeBatch(db);


    [
      ...round1,
      ...round2
    ].forEach(
      match => {

        const matchRef =
          doc(
            matchesRef
          );


        batch.set(
          matchRef,
          {
            ...match,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()
          }
        );

      }
    );


    await batch.commit();


    await setDoc(
      programmationRef,
      {
        lastGenerateCompletedCount:
          0,

        updatedAt:
          serverTimestamp()
      },
      {
        merge:
          true
      }
    );


    statusMsg.textContent =
      "✅ Les deux premiers tours sont prêts.";

  }

  catch (error) {

    console.error(
      "Erreur génération initiale :",
      error
    );


    alert(
      error?.message ||
      "Génération impossible."
    );


    statusMsg.textContent =
      "Erreur pendant la génération.";

  }

  finally {

    actionRunning =
      false;

    render();

  }

}


/* ========================================
   NOUVEAU TOUR
======================================== */

async function generateNext() {

  if (
    actionRunning
  ) {
    return;
  }


  if (
    matches.length === 0
  ) {

    alert(
      "Génère d'abord les deux premiers tours."
    );

    return;

  }


  if (
    activePlayers().length < 4
  ) {

    alert(
      "Il faut au moins 4 joueurs actifs."
    );

    return;

  }


  const completedCount =
    completedMatches().length;


  const lastGenerateCount =
    Number(
      config.lastGenerateCompletedCount ||
      0
    );


  if (
    completedCount <=
    lastGenerateCount
  ) {

    alert(
      "Valide au moins un nouveau match avant de générer un autre tour."
    );

    return;

  }


  actionRunning =
    true;

  btnNext.disabled =
    true;


  statusMsg.textContent =
    "Génération du nouveau tour…";


  try {

    const roundNumbers =
      getRoundNumbers();


    const nextRound =
      roundNumbers.length
        ? Math.max(
            ...roundNumbers
          ) + 1
        : 1;


    const generated =
      buildRound(
        nextRound,
        matches
      );


    await saveRound(
      generated
    );


    await setDoc(
      programmationRef,
      {
        lastGenerateCompletedCount:
          completedCount,

        updatedAt:
          serverTimestamp()
      },
      {
        merge:
          true
      }
    );


    statusMsg.textContent =
      `✅ Tour ${nextRound} généré.`;

  }

  catch (error) {

    console.error(
      "Erreur nouveau tour :",
      error
    );


    alert(
      error?.message ||
      "Génération impossible."
    );


    statusMsg.textContent =
      "Erreur pendant la génération.";

  }

  finally {

    actionRunning =
      false;

    render();

  }

}


/* ========================================
   DEMARRER MATCH
======================================== */

async function startMatch(
  match
) {

  if (
    match.status ===
    "completed"
  ) {
    return;
  }


  await updateDoc(
    doc(
      db,
      "matches",
      match.id
    ),
    {
      status:
        "playing",

      startedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()
    }
  );

}


/* ========================================
   VALIDER MATCH
======================================== */

async function validateMatch(
  matchId
) {

  const match =
    matches.find(
      item =>
        item.id === matchId
    );


  if (!match) {
    return;
  }


  const scoreAInput =
    document.querySelector(
      `[data-score="A"][data-match="${matchId}"]`
    );


  const scoreBInput =
    document.querySelector(
      `[data-score="B"][data-match="${matchId}"]`
    );


  const rawA =
    scoreAInput?.value ?? "";

  const rawB =
    scoreBInput?.value ?? "";


  if (
    rawA === "" ||
    rawB === ""
  ) {

    alert(
      "Saisis les deux scores."
    );

    return;

  }


  const scoreA =
    Number(rawA);

  const scoreB =
    Number(rawB);


  if (
    !Number.isInteger(scoreA) ||
    !Number.isInteger(scoreB) ||
    scoreA < 0 ||
    scoreB < 0 ||
    scoreA > 99 ||
    scoreB > 99
  ) {

    alert(
      "Les scores doivent être compris entre 0 et 99."
    );

    return;

  }


  if (
    scoreA === scoreB
  ) {

    alert(
      "Un match ne peut pas se terminer sur une égalité."
    );

    return;

  }


  await updateDoc(
    doc(
      db,
      "matches",
      matchId
    ),
    {
      scoreA,

      scoreB,

      status:
        "completed",

      winner:
        scoreA > scoreB
          ? "A"
          : "B",

      completedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()
    }
  );

}


/* ========================================
   REINITIALISER
======================================== */

async function resetProgrammation() {

  if (
    actionRunning
  ) {
    return;
  }


  const firstConfirm =
    confirm(
      "Réinitialiser toute la programmation ? Tous les matchs et scores seront supprimés."
    );


  if (
    !firstConfirm
  ) {
    return;
  }


  const secondConfirm =
    confirm(
      "Confirmation définitive : supprimer toute la programmation ?"
    );


  if (
    !secondConfirm
  ) {
    return;
  }


  actionRunning =
    true;

  btnReset.disabled =
    true;

  statusMsg.textContent =
    "Réinitialisation…";


  try {

    const snapshot =
      await getDocs(
        matchesRef
      );


    /*
     * Firestore accepte au maximum
     * 500 opérations par batch.
     * Notre Americano sera très largement
     * en dessous.
     */

    const batch =
      writeBatch(db);


    snapshot.forEach(
      snapshotDoc => {

        batch.delete(
          snapshotDoc.ref
        );

      }
    );


    batch.delete(
      programmationRef
    );


    await batch.commit();


    statusMsg.textContent =
      "✅ Programmation réinitialisée.";

  }

  catch (error) {

    console.error(
      "Erreur réinitialisation :",
      error
    );


    alert(
      "Impossible de réinitialiser la programmation."
    );


    statusMsg.textContent =
      "Erreur de réinitialisation.";

  }

  finally {

    actionRunning =
      false;

    render();

  }

}


/* ========================================
   MODIFICATION MATCH
======================================== */

function openEditModal(
  matchId
) {

  const match =
    matches.find(
      item =>
        item.id === matchId
    );


  if (!match) {
    return;
  }


  const original = [
    ...(match.teamA || []),
    ...(match.teamB || [])
  ];


  editing = {
    matchId:
      match.id,

    roundNumber:
      Number(
        match.roundNumber
      ),

    original
  };


  const available =
    activePlayers();


  const options =
    available
      .map(
        player => `
          <option value="${escapeHtml(player.id)}">
            ${escapeHtml(getNickname(player.id))}
          </option>
        `
      )
      .join("");


  const labels = [
    "Équipe A — Joueur 1",
    "Équipe A — Joueur 2",
    "Équipe B — Joueur 1",
    "Équipe B — Joueur 2"
  ];


  editFields.innerHTML =
    original
      .map(
        (
          playerId,
          index
        ) => `

          <div class="edit-field">

            <label>
              ${escapeHtml(labels[index])}
            </label>

            <select
              data-edit-slot="${index}"
            >
              ${options}
            </select>

          </div>

        `
      )
      .join("");


  editFields
    .querySelectorAll(
      "[data-edit-slot]"
    )
    .forEach(
      select => {

        const index =
          Number(
            select.dataset.editSlot
          );


        select.value =
          original[index];

      }
    );


  editModal.classList.add(
    "visible"
  );

}


function closeEditModal() {

  editing =
    null;


  editFields.innerHTML =
    "";


  editModal.classList.remove(
    "visible"
  );

}


/*
 * Remplacement intelligent :
 *
 * si on met dans le match un joueur qui
 * était déjà ailleurs dans ce même tour,
 * les deux joueurs échangent leurs places.
 *
 * Cela évite qu'un joueur apparaisse
 * deux fois dans le même tour.
 */

async function saveEditModal() {

  if (!editing) {
    return;
  }


  const roundMatches =
    matchesForRound(
      editing.roundNumber
    );


  const editedMatch =
    roundMatches.find(
      match =>
        match.id ===
        editing.matchId
    );


  if (!editedMatch) {
    return;
  }


  const selects =
    Array.from(
      editFields.querySelectorAll(
        "[data-edit-slot]"
      )
    )
      .sort(
        (a, b) =>
          Number(
            a.dataset.editSlot
          ) -
          Number(
            b.dataset.editSlot
          )
      );


  const selected =
    selects.map(
      select =>
        select.value
    );


  if (
    new Set(selected).size !==
    selected.length
  ) {

    alert(
      "Un joueur ne peut pas apparaître deux fois dans le même match."
    );

    return;

  }


  let workingMatches =
    roundMatches.map(
      match => ({
        ...match,

        teamA:
          [...(match.teamA || [])],

        teamB:
          [...(match.teamB || [])],

        bench:
          [...(match.bench || [])]
      })
    );


  for (
    let slot = 0;
    slot < 4;
    slot++
  ) {

    const oldPlayer =
      editing.original[slot];

    const newPlayer =
      selected[slot];


    if (
      oldPlayer ===
      newPlayer
    ) {
      continue;
    }


    /*
     * On échange les deux joueurs
     * partout dans le tour.
     */

    workingMatches =
      workingMatches.map(
        match => {

          const replace =
            value => {

              if (
                value === oldPlayer
              ) {
                return newPlayer;
              }


              if (
                value === newPlayer
              ) {
                return oldPlayer;
              }


              return value;

            };


          return {
            ...match,

            teamA:
              match.teamA.map(
                replace
              ),

            teamB:
              match.teamB.map(
                replace
              ),

            bench:
              match.bench.map(
                replace
              )
          };

        }
      );

  }


  const batch =
    writeBatch(db);


  workingMatches.forEach(
    match => {

      batch.update(
        doc(
          db,
          "matches",
          match.id
        ),
        {
          teamA:
            match.teamA,

          teamB:
            match.teamB,

          bench:
            match.bench,

          updatedAt:
            serverTimestamp()
        }
      );

    }
  );


  await batch.commit();


  closeEditModal();

}


/* ========================================
   RENDER MATCH
======================================== */

function renderMatch(
  match
) {

  const done =
    match.status ===
    "completed";

  const playing =
    match.status ===
    "playing";


  let statusLabel =
    "À jouer";

  let statusClass =
    "";


  if (playing) {

    statusLabel =
      "En cours";

    statusClass =
      "playing";

  }


  if (done) {

    statusLabel =
      "Terminé";

    statusClass =
      "done";

  }


  return `

    <div class="match-admin-card">

      <div class="match-head">

        <div class="court-name">
          🎾 ${escapeHtml(
            match.court ||
            "Terrain"
          )}
        </div>


        <button
          class="match-edit-btn"
          type="button"
          data-action="edit"
          data-match="${escapeHtml(match.id)}"
          title="Modifier les joueurs"
        >
          ⚙️
        </button>


        <div
          class="match-status ${statusClass}"
        >
          ${statusLabel}
        </div>

      </div>


      <div class="team-row">

        <div class="team-name">
          ${escapeHtml(
            getTeamName(
              match.teamA
            )
          )}
        </div>


        <input
          class="score-input"
          type="number"
          min="0"
          max="99"
          inputmode="numeric"
          value="${match.scoreA ?? ""}"
          data-score="A"
          data-match="${escapeHtml(match.id)}"
          ${done ? "disabled" : ""}
        >

      </div>


      <div class="team-row">

        <div class="team-name">
          ${escapeHtml(
            getTeamName(
              match.teamB
            )
          )}
        </div>


        <input
          class="score-input"
          type="number"
          min="0"
          max="99"
          inputmode="numeric"
          value="${match.scoreB ?? ""}"
          data-score="B"
          data-match="${escapeHtml(match.id)}"
          ${done ? "disabled" : ""}
        >

      </div>


      ${
        done
          ? ""
          : `
            <div class="match-actions">

              <button
                class="admin-btn"
                type="button"
                data-action="start"
                data-match="${escapeHtml(match.id)}"
                ${playing ? "disabled" : ""}
              >
                ▶️ En cours
              </button>


              <button
                class="admin-btn admin-btn-success"
                type="button"
                data-action="validate"
                data-match="${escapeHtml(match.id)}"
              >
                ✅ Valider
              </button>

            </div>
          `
      }

    </div>

  `;

}


/* ========================================
   RENDER TOUR
======================================== */

function renderRound(
  roundNumber
) {

  const roundMatches =
    matchesForRound(
      roundNumber
    );


  const done =
    roundCompleted(
      roundNumber
    );


  const bench =
    roundMatches[0]?.bench ||
    [];


  return `

    <article class="round-card">

      <div class="round-head">

        <div class="round-title">
          Tour ${roundNumber}
        </div>


        <div
          class="round-status ${done ? "done" : ""}"
        >
          ${done ? "Terminé" : "À jouer"}
        </div>

      </div>


      ${roundMatches
        .map(
          renderMatch
        )
        .join("")
      }


      <div class="bench-admin">

        <strong>
          🌴 Banc
        </strong>

        <div>
          ${escapeHtml(
            getBenchNames(
              bench
            )
          )}
        </div>

      </div>

    </article>

  `;

}


/* ========================================
   RENDER GLOBAL
======================================== */

function render() {

  const roundNumbers =
    getRoundNumbers();


  const pendingRounds =
    roundNumbers.filter(
      roundNumber =>
        !roundCompleted(
          roundNumber
        )
    );


  const doneRounds =
    roundNumbers
      .filter(
        roundCompleted
      )
      .reverse();


  const activeCount =
    activePlayers().length;

  const completedCount =
    completedMatches().length;

  const pendingCount =
    pendingMatches().length;


  countActive.textContent =
    String(activeCount);

  countRounds.textContent =
    String(
      roundNumbers.length
    );

  countPending.textContent =
    String(
      pendingCount
    );

  countDone.textContent =
    String(
      completedCount
    );


  currentList.innerHTML =
    pendingRounds.length
      ? pendingRounds
          .map(
            renderRound
          )
          .join("")
      : `
          <div class="program-empty">
            Aucun tour en cours.
          </div>
        `;


  doneList.innerHTML =
    doneRounds.length
      ? doneRounds
          .map(
            renderRound
          )
          .join("")
      : `
          <div class="program-empty">
            Aucun tour terminé.
          </div>
        `;


  const lastGenerateCount =
    Number(
      config.lastGenerateCompletedCount ||
      0
    );


  btnInitial.disabled =
    actionRunning ||
    matches.length > 0 ||
    activeCount < 4;


  btnNext.disabled =
    actionRunning ||
    matches.length === 0 ||
    activeCount < 4 ||
    completedCount <=
      lastGenerateCount;


  btnReset.disabled =
    actionRunning ||
    matches.length === 0;


  if (!actionRunning) {

    statusMsg.textContent =
      `${activeCount} joueur${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""} — ` +
      `${roundNumbers.length} tour${roundNumbers.length > 1 ? "s" : ""} — ` +
      `${pendingCount} match${pendingCount > 1 ? "s" : ""} à jouer — ` +
      `${completedCount} terminé${completedCount > 1 ? "s" : ""}.`;

  }

}


/* ========================================
   ACTIONS
======================================== */

currentList.addEventListener(
  "click",

  async event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {
      return;
    }


    const matchId =
      button.dataset.match;

    const action =
      button.dataset.action;


    const match =
      matches.find(
        item =>
          item.id === matchId
      );


    if (!match) {
      return;
    }


    button.disabled =
      true;


    try {

      if (
        action === "start"
      ) {

        await startMatch(
          match
        );

      }


      if (
        action === "validate"
      ) {

        await validateMatch(
          matchId
        );

      }


      if (
        action === "edit"
      ) {

        openEditModal(
          matchId
        );

      }

    }

    catch (error) {

      console.error(
        "Erreur action match :",
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


/*
 * Les matchs terminés restent modifiables
 * via la roue dentée.
 */

doneList.addEventListener(
  "click",

  event => {

    const button =
      event.target.closest(
        '[data-action="edit"]'
      );


    if (!button) {
      return;
    }


    openEditModal(
      button.dataset.match
    );

  }

);


/* ========================================
   BOUTONS
======================================== */

btnInitial.addEventListener(
  "click",
  generateInitial
);


btnNext.addEventListener(
  "click",
  generateNext
);


btnReset.addEventListener(
  "click",
  resetProgrammation
);


btnCancelEdit.addEventListener(
  "click",
  closeEditModal
);


btnSaveEdit.addEventListener(
  "click",

  async () => {

    btnSaveEdit.disabled =
      true;


    try {

      await saveEditModal();

    }

    catch (error) {

      console.error(
        "Erreur modification match :",
        error
      );


      alert(
        error?.message ||
        "Modification impossible."
      );

    }

    finally {

      btnSaveEdit.disabled =
        false;

    }

  }

);


editModal.addEventListener(
  "click",

  event => {

    if (
      event.target ===
      editModal
    ) {

      closeEditModal();

    }

  }

);


/* ========================================
   FIRESTORE TEMPS REEL
======================================== */

onSnapshot(

  query(
    playersRef,
    orderBy(
      "createdAt",
      "asc"
    )
  ),

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
      "Erreur joueurs :",
      error
    );


    statusMsg.textContent =
      "Impossible de charger les joueurs.";

  }

);


onSnapshot(

  query(
    matchesRef,
    orderBy(
      "roundNumber",
      "asc"
    )
  ),

  snapshot => {

    matches =
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
      "Erreur matchs :",
      error
    );


    statusMsg.textContent =
      "Impossible de charger la programmation.";

  }

);


onSnapshot(

  programmationRef,

  snapshot => {

    config =
      snapshot.exists()
        ? snapshot.data() || {}
        : {};


    render();

  },

  error => {

    console.error(
      "Erreur configuration programmation :",
      error
    );

  }

);
