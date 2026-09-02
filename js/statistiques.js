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

const playerSelect =
  document.getElementById(
    "playerSelect"
  );

const selectedName =
  document.getElementById(
    "selectedName"
  );

const activeTurns =
  document.getElementById(
    "activeTurns"
  );

const playedMatches =
  document.getElementById(
    "playedMatches"
  );

const benchTurns =
  document.getElementById(
    "benchTurns"
  );

const playedRatio =
  document.getElementById(
    "playedRatio"
  );

const relationsList =
  document.getElementById(
    "relationsList"
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

let selectedId = "";


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


function getNickname(player) {

  return clean(
    player?.surnom ||
    player?.nickname ||
    "Sans surnom"
  );

}


function sortPlayers(a, b) {

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


function addMap(
  map,
  key,
  increment = 1
) {

  if (!map) {
    return;
  }


  map.set(
    key,
    (
      map.get(key) ||
      0
    ) + increment
  );

}


/* ========================================
   GROUPER LES MATCHS PAR TOUR
======================================== */

function getRounds() {

  const roundsMap =
    new Map();


  matches.forEach(
    match => {

      const roundNumber =
        Number(
          match.roundNumber
        );


      if (
        !Number.isFinite(
          roundNumber
        )
      ) {
        return;
      }


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
       * Le banc est dupliqué
       * dans chaque document match.
       *
       * On ne garde donc qu'une seule
       * copie par tour.
       */

      if (
        round.bench.length === 0 &&
        Array.isArray(
          match.bench
        )
      ) {

        round.bench =
          [...match.bench];

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
   CALCUL DES STATISTIQUES
======================================== */

function computeStats() {

  const stats =
    new Map();


  /*
   * Initialisation
   */

  players.forEach(
    player => {

      stats.set(
        player.id,
        {
          id:
            player.id,

          nickname:
            getNickname(
              player
            ),

          activeTurns:
            0,

          played:
            0,

          bench:
            0,

          partners:
            new Map(),

          opponents:
            new Map()
        }
      );

    }
  );


  const rounds =
    getRounds();


  /*
   * Analyse tour par tour
   */

  rounds.forEach(
    round => {

      const playersInRound =
        new Set();


      /*
       * Joueurs présents sur les terrains
       */

      round.matches.forEach(
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

              playersInRound.add(
                playerId
              );

            }
          );

        }
      );


      /*
       * Joueurs sur le banc
       */

      round.bench.forEach(
        playerId => {

          playersInRound.add(
            playerId
          );


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


      /*
       * Tours actifs
       *
       * Un joueur compte un tour actif
       * s'il était soit sur le terrain,
       * soit sur le banc.
       */

      playersInRound.forEach(
        playerId => {

          if (
            stats.has(
              playerId
            )
          ) {

            stats.get(
              playerId
            ).activeTurns++;

          }

        }
      );


      /*
       * Matchs / partenaires / adversaires
       */

      round.matches.forEach(
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


          /*
           * Match joué
           */

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


          /*
           * Partenaires équipe A
           */

          if (
            teamA.length >= 2
          ) {

            addMap(
              stats.get(
                teamA[0]
              )?.partners,
              teamA[1]
            );


            addMap(
              stats.get(
                teamA[1]
              )?.partners,
              teamA[0]
            );

          }


          /*
           * Partenaires équipe B
           */

          if (
            teamB.length >= 2
          ) {

            addMap(
              stats.get(
                teamB[0]
              )?.partners,
              teamB[1]
            );


            addMap(
              stats.get(
                teamB[1]
              )?.partners,
              teamB[0]
            );

          }


          /*
           * Adversaires
           */

          teamA.forEach(
            playerA => {

              teamB.forEach(
                playerB => {

                  addMap(
                    stats.get(
                      playerA
                    )?.opponents,
                    playerB
                  );


                  addMap(
                    stats.get(
                      playerB
                    )?.opponents,
                    playerA
                  );

                }
              );

            }
          );

        }
      );

    }
  );


  return stats;

}


/* ========================================
   SELECTEUR JOUEUR
======================================== */

function renderSelect() {

  const previousSelection =
    selectedId;


  const sortedPlayers =
    [...players]
      .sort(
        sortPlayers
      );


  playerSelect.innerHTML = `

    <option value="">
      Choisir un joueur
    </option>

    ${sortedPlayers
      .map(
        player => `

          <option
            value="${escapeHtml(player.id)}"
          >
            ${escapeHtml(
              getNickname(player)
            )}
          </option>

        `
      )
      .join("")
    }

  `;


  /*
   * On conserve le joueur sélectionné
   * pendant les mises à jour temps réel.
   */

  if (
    previousSelection &&
    players.some(
      player =>
        player.id ===
        previousSelection
    )
  ) {

    selectedId =
      previousSelection;

  }

  else if (
    sortedPlayers.length > 0
  ) {

    selectedId =
      sortedPlayers[0].id;

  }

  else {

    selectedId =
      "";

  }


  playerSelect.value =
    selectedId;

}


/* ========================================
   AFFICHAGE VIDE
======================================== */

function renderEmpty(text) {

  relationsList.innerHTML = `

    <div class="stats-empty">
      ${escapeHtml(text)}
    </div>

  `;

}


/* ========================================
   RELATIONS
======================================== */

function renderRelations(
  selectedStats
) {

  const rows =
    players
      .filter(
        player =>
          player.id !==
          selectedId
      )
      .sort(
        sortPlayers
      )
      .map(
        player => {

          const partners =
            selectedStats
              .partners
              .get(
                player.id
              ) || 0;


          const opponents =
            selectedStats
              .opponents
              .get(
                player.id
              ) || 0;


          return {

            id:
              player.id,

            nickname:
              getNickname(
                player
              ),

            partners,

            opponents

          };

        }
      );


  if (
    rows.length === 0
  ) {

    renderEmpty(
      "Aucune relation à afficher."
    );

    return;

  }


  relationsList.innerHTML =
    rows
      .map(
        row => {

          const partnerZero =
            row.partners === 0
              ? "zero"
              : "";


          const opponentZero =
            row.opponents === 0
              ? "zero"
              : "";


          return `

            <div class="relation-row">

              <div class="relation-name">
                ${escapeHtml(
                  row.nickname
                )}
              </div>


              <div
                class="relation-num ${partnerZero}"
              >
                ${row.partners}
              </div>


              <div
                class="relation-num vs ${opponentZero}"
              >
                ${row.opponents}
              </div>

            </div>

          `;

        }
      )
      .join("");

}


/* ========================================
   RENDER GLOBAL
======================================== */

function render() {

  renderSelect();


  if (!selectedId) {

    selectedName.textContent =
      "Vue joueur";

    activeTurns.textContent =
      "0";

    playedMatches.textContent =
      "0";

    benchTurns.textContent =
      "0";

    playedRatio.textContent =
      "0%";


    renderEmpty(
      "Aucun joueur disponible."
    );


    return;

  }


  const stats =
    computeStats();


  const selectedStats =
    stats.get(
      selectedId
    );


  if (!selectedStats) {

    selectedName.textContent =
      "Vue joueur";


    renderEmpty(
      "Statistiques indisponibles."
    );


    return;

  }


  /*
   * Pourcentage de tours joués :
   *
   * matchs joués / tours durant lesquels
   * le joueur était présent dans la rotation.
   *
   * Comme un joueur ne dispute jamais plus
   * d'un match par tour, cela revient au
   * pourcentage de tours passés sur le terrain.
   */

  const ratio =
    selectedStats.activeTurns > 0
      ? Math.round(
          (
            selectedStats.played /
            selectedStats.activeTurns
          ) * 100
        )
      : 0;


  selectedName.textContent =
    selectedStats.nickname;


  activeTurns.textContent =
    String(
      selectedStats.activeTurns
    );


  playedMatches.textContent =
    String(
      selectedStats.played
    );


  benchTurns.textContent =
    String(
      selectedStats.bench
    );


  playedRatio.textContent =
    `${ratio}%`;


  renderRelations(
    selectedStats
  );

}


/* ========================================
   CHANGEMENT JOUEUR
======================================== */

playerSelect.addEventListener(
  "change",
  () => {

    selectedId =
      playerSelect.value;


    render();

  }
);


/* ========================================
   JOUEURS TEMPS REEL
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
      "Erreur chargement joueurs :",
      error
    );


    playerSelect.innerHTML = `

      <option value="">
        Erreur de chargement
      </option>

    `;


    renderEmpty(
      "Impossible de charger les joueurs."
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
      "Erreur chargement statistiques :",
      error
    );


    renderEmpty(
      "Impossible de charger les statistiques."
    );

  }

);
