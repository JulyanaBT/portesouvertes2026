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

const rankingList =
  document.getElementById(
    "rankingList"
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


function getNickname(player) {

  return clean(
    player?.surnom ||
    player?.nickname ||
    "Sans surnom"
  );

}


function sortByNickname(a, b) {

  return a.nickname
    .localeCompare(
      b.nickname,
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
       * Le banc est enregistré dans
       * chaque match du même tour.
       *
       * On ne garde donc qu'une seule
       * copie du banc.
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
   STATISTIQUES DE BASE
======================================== */

function makeBaseStats() {

  const stats =
    new Map();


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

          matches:
            0,

          wins:
            0,

          losses:
            0,

          matchPointsTotal:
            0,

          scoredTotal:
            0,

          concededTotal:
            0,

          gameDiffTotal:
            0,

          activeTurns:
            0,

          benchTurns:
            0,

          bonusGamePoints:
            0,

          rankingMatchPoints:
            0,

          rankingScored:
            0,

          rankingConceded:
            0,

          rankingDiff:
            0,

          countedResults:
            0,

          results:
            []
        }
      );

    }
  );


  return stats;

}


/* ========================================
   BONUS PAR TOUR ACTIF
======================================== */

function addRoundBonus(stats) {

  const rounds =
    getRounds();


  rounds.forEach(
    round => {

      const activeInRound =
        new Set();


      /*
       * Joueurs programmés
       * sur les terrains.
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

              activeInRound.add(
                playerId
              );

            }
          );

        }
      );


      /*
       * Joueurs sur le banc.
       */

      round.bench.forEach(
        playerId => {

          activeInRound.add(
            playerId
          );


          const row =
            stats.get(
              playerId
            );


          if (row) {

            row.benchTurns++;

          }

        }
      );


      /*
       * Chaque joueur présent dans
       * la rotation reçoit :
       *
       * +1 tour actif
       * +2 points de jeu bonus
       */

      activeInRound.forEach(
        playerId => {

          const row =
            stats.get(
              playerId
            );


          if (!row) {
            return;
          }


          row.activeTurns++;

          row.bonusGamePoints +=
            2;

        }
      );

    }
  );

}


/* ========================================
   MATCHS TERMINES
======================================== */

function getCompletedMatches() {

  return matches.filter(
    match =>
      match.status ===
      "completed"
  );

}


/* ========================================
   CALCUL DU CLASSEMENT
======================================== */

function computeRanking() {

  const stats =
    makeBaseStats();


  /*
   * Bonus lié aux tours.
   */

  addRoundBonus(
    stats
  );


  /*
   * Résultats des matchs terminés.
   */

  getCompletedMatches()
    .forEach(
      match => {

        const scoreA =
          Number(
            match.scoreA
          );


        const scoreB =
          Number(
            match.scoreB
          );


        if (
          !Number.isFinite(
            scoreA
          ) ||
          !Number.isFinite(
            scoreB
          ) ||
          scoreA === scoreB
        ) {

          return;

        }


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


        const teamAWon =
          scoreA > scoreB;


        /*
         * EQUIPE A
         */

        teamA.forEach(
          playerId => {

            const row =
              stats.get(
                playerId
              );


            if (!row) {
              return;
            }


            const matchPoints =
              teamAWon
                ? 2
                : 1;


            row.matches++;

            row.wins +=
              teamAWon
                ? 1
                : 0;

            row.losses +=
              teamAWon
                ? 0
                : 1;

            row.matchPointsTotal +=
              matchPoints;

            row.scoredTotal +=
              scoreA;

            row.concededTotal +=
              scoreB;

            row.gameDiffTotal +=
              scoreA -
              scoreB;


            row.results.push({
              matchPoints,
              scored:
                scoreA,
              conceded:
                scoreB,
              diff:
                scoreA -
                scoreB
            });

          }
        );


        /*
         * EQUIPE B
         */

        teamB.forEach(
          playerId => {

            const row =
              stats.get(
                playerId
              );


            if (!row) {
              return;
            }


            const matchPoints =
              teamAWon
                ? 1
                : 2;


            row.matches++;

            row.wins +=
              teamAWon
                ? 0
                : 1;

            row.losses +=
              teamAWon
                ? 1
                : 0;

            row.matchPointsTotal +=
              matchPoints;

            row.scoredTotal +=
              scoreB;

            row.concededTotal +=
              scoreA;

            row.gameDiffTotal +=
              scoreB -
              scoreA;


            row.results.push({
              matchPoints,
              scored:
                scoreB,
              conceded:
                scoreA,
              diff:
                scoreB -
                scoreA
            });

          }
        );

      }
    );


  const rows =
    Array.from(
      stats.values()
    );


  /*
   * ========================================
   * 10 MEILLEURS RESULTATS
   * ========================================
   *
   * On classe d'abord les résultats
   * individuels du joueur :
   *
   * 1. points match
   * 2. différence de jeux
   * 3. jeux marqués
   *
   * Puis on ne conserve que les 10 meilleurs.
   */

  rows.forEach(
    row => {

      const bestTen =
        [...row.results]
          .sort(
            (a, b) => {

              if (
                b.matchPoints !==
                a.matchPoints
              ) {

                return (
                  b.matchPoints -
                  a.matchPoints
                );

              }


              if (
                b.diff !==
                a.diff
              ) {

                return (
                  b.diff -
                  a.diff
                );

              }


              return (
                b.scored -
                a.scored
              );

            }
          )
          .slice(
            0,
            10
          );


      row.countedResults =
        bestTen.length;


      /*
       * Points match
       */

      row.rankingMatchPoints =
        bestTen.reduce(
          (
            total,
            result
          ) =>
            total +
            result.matchPoints,
          0
        );


      /*
       * Jeux marqués.
       *
       * Comme sur le Summer Tour,
       * le bonus des tours actifs
       * est ajouté ici.
       */

      row.rankingScored =
        bestTen.reduce(
          (
            total,
            result
          ) =>
            total +
            result.scored,
          0
        )
        +
        row.bonusGamePoints;


      /*
       * Jeux encaissés
       */

      row.rankingConceded =
        bestTen.reduce(
          (
            total,
            result
          ) =>
            total +
            result.conceded,
          0
        );


      /*
       * Différence
       */

      row.rankingDiff =
        row.rankingScored -
        row.rankingConceded;

    }
  );


  /*
   * ========================================
   * ORDRE DU CLASSEMENT
   * ========================================
   *
   * 1. points match
   * 2. différence de jeux
   * 3. jeux marqués
   * 4. surnom
   */

  return rows.sort(
    (a, b) => {

      if (
        b.rankingMatchPoints !==
        a.rankingMatchPoints
      ) {

        return (
          b.rankingMatchPoints -
          a.rankingMatchPoints
        );

      }


      if (
        b.rankingDiff !==
        a.rankingDiff
      ) {

        return (
          b.rankingDiff -
          a.rankingDiff
        );

      }


      if (
        b.rankingScored !==
        a.rankingScored
      ) {

        return (
          b.rankingScored -
          a.rankingScored
        );

      }


      return a.nickname
        .localeCompare(
          b.nickname,
          "fr",
          {
            sensitivity:
              "base",

            numeric:
              true
          }
        );

    }
  );

}


/* ========================================
   CARTE CLASSEMENT
======================================== */

function renderRankCard(
  row,
  index
) {

  let topClass =
    "";


  if (index === 0) {
    topClass =
      "top1";
  }


  if (index === 1) {
    topClass =
      "top2";
  }


  if (index === 2) {
    topClass =
      "top3";
  }


  let position =
    String(
      index + 1
    );


  if (index === 0) {
    position =
      "🥇";
  }


  if (index === 1) {
    position =
      "🥈";
  }


  if (index === 2) {
    position =
      "🥉";
  }


  let diffClass =
    "";


  if (
    row.rankingDiff > 0
  ) {

    diffClass =
      "diff-positive";

  }


  if (
    row.rankingDiff < 0
  ) {

    diffClass =
      "diff-negative";

  }


  const diffDisplay =
    row.rankingDiff > 0
      ? `+${row.rankingDiff}`
      : String(
          row.rankingDiff
        );


  return `

    <div
      class="rank-card ${topClass}"
    >

      <div class="rank-main">


        <div class="rank-pos">

          ${position}

        </div>


        <div>

          <div class="rank-name">

            ${escapeHtml(
              row.nickname
            )}

          </div>


          <div class="rank-sub">

            ${row.matches}
            match${row.matches > 1 ? "s" : ""}
            •

            ${row.activeTurns}
            tour${row.activeTurns > 1 ? "s" : ""}
            actif${row.activeTurns > 1 ? "s" : ""}

            •

            ${row.countedResults}/10
            résultat${row.countedResults > 1 ? "s" : ""}
            retenu${row.countedResults > 1 ? "s" : ""}

          </div>

        </div>


        <div class="rank-points">

          <strong>
            ${row.rankingMatchPoints}
          </strong>

          <span>
            pts match
          </span>

        </div>


      </div>


      <div class="rank-stats">


        <div class="mini-stat">

          <strong>
            ${row.wins}
          </strong>

          <span>
            V
          </span>

        </div>


        <div class="mini-stat">

          <strong>
            ${row.losses}
          </strong>

          <span>
            D
          </span>

        </div>


        <div class="mini-stat bonus">

          <strong>
            +${row.bonusGamePoints}
          </strong>

          <span>
            Bonus
          </span>

        </div>


        <div class="mini-stat">

          <strong>
            ${row.rankingScored}
          </strong>

          <span>
            +
          </span>

        </div>


        <div class="mini-stat">

          <strong>
            ${row.rankingConceded}
          </strong>

          <span>
            -
          </span>

        </div>


        <div
          class="mini-stat ${diffClass}"
        >

          <strong>
            ${diffDisplay}
          </strong>

          <span>
            Diff
          </span>

        </div>


      </div>

    </div>

  `;

}


/* ========================================
   AVANT LE PREMIER RESULTAT
======================================== */

function renderWaitingRanking(
  ranking
) {

  const sorted =
    [...ranking]
      .sort(
        sortByNickname
      );


  rankingList.innerHTML =
    sorted
      .map(
        (
          row,
          index
        ) => `

          <div class="rank-card">

            <div class="rank-main">


              <div class="rank-pos">

                ${index + 1}

              </div>


              <div>

                <div class="rank-name">

                  ${escapeHtml(
                    row.nickname
                  )}

                </div>


                <div class="rank-sub">

                  ${row.activeTurns}
                  tour${row.activeTurns > 1 ? "s" : ""}
                  actif${row.activeTurns > 1 ? "s" : ""}

                  •

                  bonus +${row.bonusGamePoints}

                </div>

              </div>


              <div class="rank-points">

                <strong>
                  0
                </strong>

                <span>
                  pts match
                </span>

              </div>


            </div>


            <div class="rank-stats">


              <div class="mini-stat bonus">

                <strong>
                  +${row.bonusGamePoints}
                </strong>

                <span>
                  Bonus
                </span>

              </div>


              <div class="mini-stat">

                <strong>
                  ${row.rankingScored}
                </strong>

                <span>
                  +
                </span>

              </div>


              <div class="mini-stat">

                <strong>
                  ${row.rankingConceded}
                </strong>

                <span>
                  -
                </span>

              </div>


              <div class="mini-stat">

                <strong>
                  ${row.rankingDiff}
                </strong>

                <span>
                  Diff
                </span>

              </div>


            </div>

          </div>

        `
      )
      .join("");

}


/* ========================================
   RENDER
======================================== */

function render() {

  if (
    players.length === 0
  ) {

    rankingList.innerHTML = `

      <div class="ranking-empty">

        Aucun joueur inscrit.

      </div>

    `;

    return;

  }


  const ranking =
    computeRanking();


  /*
   * Aucun match encore terminé.
   */

  const hasCompletedResult =
    ranking.some(
      row =>
        row.matches > 0
    );


  if (
    !hasCompletedResult
  ) {

    renderWaitingRanking(
      ranking
    );

    return;

  }


  rankingList.innerHTML =
    ranking
      .map(
        renderRankCard
      )
      .join("");

}


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


    rankingList.innerHTML = `

      <div class="ranking-empty">

        Impossible de charger les joueurs.

      </div>

    `;

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
      "Erreur chargement classement :",
      error
    );


    rankingList.innerHTML = `

      <div class="ranking-empty">

        Impossible de charger le classement.

      </div>

    `;

  }

);
