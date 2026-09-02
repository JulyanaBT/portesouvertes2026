import { db } from "../firebase.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const activeList =
  document.getElementById(
    "activeList"
  );

const waitingList =
  document.getElementById(
    "waitingList"
  );

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


/* ========================================
   FIRESTORE
======================================== */

const playersRef =
  collection(
    db,
    "players"
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
   HELPERS
======================================== */

function getNickname(data) {

  return String(
    data.surnom ||
    data.nickname ||
    "Sans surnom"
  ).trim();

}


function sortByNickname(a, b) {

  return a.nickname.localeCompare(
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
   ELEMENTS
======================================== */

function createChip(
  nickname,
  type
) {

  const div =
    document.createElement(
      "div"
    );


  div.className =
    type === "waiting"
      ? "player-chip waiting"
      : "player-chip";


  div.textContent =
    nickname ||
    "Sans surnom";


  return div;

}


function createEmpty(text) {

  const div =
    document.createElement(
      "div"
    );


  div.className =
    "empty";


  div.textContent =
    text;


  return div;

}


/* ========================================
   AFFICHAGE
======================================== */

function renderPlayers(
  activePlayers,
  waitingPlayers
) {

  activeList.innerHTML =
    "";

  waitingList.innerHTML =
    "";


  activePlayers.sort(
    sortByNickname
  );

  waitingPlayers.sort(
    sortByNickname
  );


  /* ACTIFS */

  if (
    activePlayers.length === 0
  ) {

    activeList.appendChild(

      createEmpty(
        "Aucun joueur actif."
      )

    );

  }

  else {

    activePlayers.forEach(
      player => {

        activeList.appendChild(

          createChip(
            player.nickname,
            "active"
          )

        );

      }
    );

  }


  /* EN ATTENTE */

  if (
    waitingPlayers.length === 0
  ) {

    waitingList.appendChild(

      createEmpty(
        "Aucun joueur en attente."
      )

    );

  }

  else {

    waitingPlayers.forEach(
      player => {

        waitingList.appendChild(

          createChip(
            player.nickname,
            "waiting"
          )

        );

      }
    );

  }


  /* COMPTEURS */

  countActive.textContent =
    String(
      activePlayers.length
    );


  countWaiting.textContent =
    String(
      waitingPlayers.length
    );


  countTotal.textContent =
    String(
      activePlayers.length +
      waitingPlayers.length
    );

}


/* ========================================
   TEMPS REEL
======================================== */

onSnapshot(

  playersQuery,

  snapshot => {

    const activePlayers =
      [];

    const waitingPlayers =
      [];


    snapshot.forEach(
      documentSnapshot => {

        const data =
          documentSnapshot.data() ||
          {};


        const player = {

          id:
            documentSnapshot.id,

          nickname:
            getNickname(
              data
            )

        };


        if (
          data.active === true
        ) {

          activePlayers.push(
            player
          );

        }

        else {

          waitingPlayers.push(
            player
          );

        }

      }
    );


    renderPlayers(
      activePlayers,
      waitingPlayers
    );

  },


  error => {

    console.error(
      "Erreur chargement joueurs :",
      error
    );


    activeList.innerHTML =
      "";

    waitingList.innerHTML =
      "";


    activeList.appendChild(

      createEmpty(
        "Impossible de charger les joueurs."
      )

    );


    waitingList.appendChild(

      createEmpty(
        "Impossible de charger les joueurs."
      )

    );


    countActive.textContent =
      "0";

    countWaiting.textContent =
      "0";

    countTotal.textContent =
      "0";

  }

);
