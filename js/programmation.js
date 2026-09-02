import { db } from "../firebase.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ========================================
   ELEMENTS
======================================== */

const currentList =
  document.getElementById(
    "currentList"
  );

const doneList =
  document.getElementById(
    "doneList"
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


const playersQuery =
  query(
    playersRef,
    orderBy(
      "createdAt",
      "asc"
    )
  );


const matchesQuery =
  query(
    matchesRef,
    orderBy(
      "roundNumber",
      "asc"
    )
  );


/* ========================================
   STATE
======================================== */

let players = [];

let matches = [];


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


function getPlayerNickname(
  playerId
) {

  const player =
    players.find(
      item =>
        item.id === playerId
    );


  if (!player) {

    return "Joueur";

  }


  return (
    clean(
      player.surnom ||
      player.nickname
    ) ||
    "Joueur"
  );

}


function getTeamName(team) {

  if (
    !Array.isArray(team) ||
    team.length === 0
  ) {

    return "Équipe";

  }


  return team
    .map(
      getPlayerNickname
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
      getPlayerNickname
    )
    .join(" • ");

}


function getScore(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return "—";

  }


  return String(value);

}


/* ========================================
   STATUT MATCH
======================================== */

function isCompleted(match) {

  return (
    match.status ===
    "completed"
  );

}


function isPlaying(match) {

  return (
    match.status ===
    "playing"
  );

}


function getMatchStatus(
  match
) {

  if (
    isCompleted(match)
  ) {

    return {
      label:
        "Terminé",

      cssClass:
        "done"
    };

  }


  if (
    isPlaying(match)
  ) {

    return {
      label:
        "En cours",

      cssClass:
        ""
    };

  }


  return {
    label:
      "À venir",

    cssClass:
      ""
  };

}


/* ========================================
   GROUPER PAR TOUR
======================================== */

function getRounds() {

  const roundsMap =
    new Map();


  matches.forEach(
    match => {

      const roundNumber =
        Number(
          match.roundNumber
        ) || 0;


      if (
        !roundsMap.has(
          roundNumber
        )
      ) {

        roundsMap.set(
          roundNumber,
          {
            roundNumber,
            matches: [],
            bench: []
          }
        );

      }


      const round =
        roundsMap.get(
          roundNumber
        );


      round.matches.push(
        match
      );


      /*
       * Le banc est identique
       * pour tous les matchs d'un même tour.
       * On garde la première valeur disponible.
       */

      if (
        round.bench.length === 0 &&
        Array.isArray(
          match.bench
        )
      ) {

        round.bench =
          match.bench;

      }

    }
  );


  return Array
    .from(
      roundsMap.values()
    )
    .sort(
      (a, b) =>
        a.roundNumber -
        b.roundNumber
    );

}


/* ========================================
   ETAT TOUR
======================================== */

function isRoundCompleted(
  round
) {

  return (
    round.matches.length > 0 &&
    round.matches.every(
      isCompleted
    )
  );

}


function isRoundPlaying(
  round
) {

  return round.matches.some(
    isPlaying
  );

}


function getRoundStatus(
  round
) {

  if (
    isRoundCompleted(
      round
    )
  ) {

    return {
      label:
        "Terminé",

      cssClass:
        "done"
    };

  }


  if (
    isRoundPlaying(
      round
    )
  ) {

    return {
      label:
        "En cours",

      cssClass:
        ""
    };

  }


  return {
    label:
      "À venir",

    cssClass:
      ""
  };

}


/* ========================================
   TRI MATCHS
======================================== */

function sortMatches(
  roundMatches
) {

  return [
    ...roundMatches
  ].sort(
    (a, b) => {

      const indexA =
        Number(
          a.matchIndex
        ) || 0;

      const indexB =
        Number(
          b.matchIndex
        ) || 0;


      if (
        indexA !== indexB
      ) {

        return (
          indexA -
          indexB
        );

      }


      return String(
        a.court || ""
      ).localeCompare(
        String(
          b.court || ""
        ),
        "fr",
        {
          numeric:
            true
        }
      );

    }
  );

}


/* ========================================
   RENDER MATCH
======================================== */

function renderMatch(
  match
) {

  const state =
    getMatchStatus(
      match
    );


  const teamA =
    getTeamName(
      match.teamA
    );


  const teamB =
    getTeamName(
      match.teamB
    );


  return `

    <div class="match-card">

      <div class="match-head">

        <div class="court-name">
          🎾 ${escapeHtml(
            match.court ||
            "Terrain"
          )}
        </div>


        <div
          class="match-status ${state.cssClass}"
        >
          ${escapeHtml(
            state.label
          )}
        </div>

      </div>


      <div class="team-row">

        <div class="team-name">
          ${escapeHtml(
            teamA
          )}
        </div>

        <div class="score-box">
          ${escapeHtml(
            getScore(
              match.scoreA
            )
          )}
        </div>

      </div>


      <div class="team-row">

        <div class="team-name">
          ${escapeHtml(
            teamB
          )}
        </div>

        <div class="score-box">
          ${escapeHtml(
            getScore(
              match.scoreB
            )
          )}
        </div>

      </div>

    </div>

  `;

}


/* ========================================
   RENDER BANC
======================================== */

function renderBench(
  round
) {

  return `

    <div class="bench-block">

      <div class="bench-title">
        🌴 Banc
      </div>

      <div class="bench-list">
        ${escapeHtml(
          getBenchNames(
            round.bench
          )
        )}
      </div>

    </div>

  `;

}


/* ========================================
   RENDER TOUR
======================================== */

function renderRound(
  round
) {

  const status =
    getRoundStatus(
      round
    );


  const roundMatches =
    sortMatches(
      round.matches
    );


  return `

    <article class="round-card">

      <div class="round-head">

        <div class="round-title">
          Tour ${escapeHtml(
            round.roundNumber
          )}
        </div>


        <div
          class="round-state ${status.cssClass}"
        >
          ${escapeHtml(
            status.label
          )}
        </div>

      </div>


      ${roundMatches
        .map(
          renderMatch
        )
        .join("")
      }


      ${renderBench(
        round
      )}

    </article>

  `;

}


/* ========================================
   AFFICHAGE
======================================== */

function render() {

  const rounds =
    getRounds();


  const currentRounds =
    rounds.filter(
      round =>
        !isRoundCompleted(
          round
        )
    );


  const doneRounds =
    rounds
      .filter(
        isRoundCompleted
      )
      .reverse();


  const pendingMatches =
    matches.filter(
      match =>
        !isCompleted(
          match
        )
    );


  const doneMatches =
    matches.filter(
      isCompleted
    );


  /* COMPTEURS */

  countRounds.textContent =
    String(
      rounds.length
    );


  countPending.textContent =
    String(
      pendingMatches.length
    );


  countDone.textContent =
    String(
      doneMatches.length
    );


  /* A VENIR / EN COURS */

  if (
    currentRounds.length === 0
  ) {

    currentList.innerHTML = `

      <div class="empty">
        Aucun match à jouer pour le moment.
      </div>

    `;

  }

  else {

    currentList.innerHTML =
      currentRounds
        .map(
          renderRound
        )
        .join("");

  }


  /* TERMINES */

  if (
    doneRounds.length === 0
  ) {

    doneList.innerHTML = `

      <div class="empty">
        Aucun tour terminé.
      </div>

    `;

  }

  else {

    doneList.innerHTML =
      doneRounds
        .map(
          renderRound
        )
        .join("");

  }

}


/* ========================================
   JOUEURS TEMPS REEL
======================================== */

onSnapshot(

  playersQuery,

  snapshot => {

    players =
      snapshot.docs.map(
        snapshotDoc => {

          const data =
            snapshotDoc.data() ||
            {};


          return {

            id:
              snapshotDoc.id,

            surnom:
              data.surnom ||
              data.nickname ||
              "Sans surnom"

          };

        }
      );


    /*
     * Les matchs contiennent des IDs joueurs.
     * On refait donc l'affichage quand un surnom
     * est modifié par l'organisateur.
     */

    render();

  },


  error => {

    console.error(
      "Erreur chargement joueurs :",
      error
    );

  }

);


/* ========================================
   MATCHS TEMPS REEL
======================================== */

onSnapshot(

  matchesQuery,

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
      "Erreur chargement programmation :",
      error
    );


    currentList.innerHTML = `

      <div class="empty">
        Impossible de charger la programmation.
      </div>

    `;


    doneList.innerHTML = `

      <div class="empty">
        Impossible de charger les résultats.
      </div>

    `;


    countRounds.textContent =
      "0";

    countPending.textContent =
      "0";

    countDone.textContent =
      "0";

  }

);
