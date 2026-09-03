import { db } from "../../firebase.js";

import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ========================================
   ELEMENTS
======================================== */

const paymentList =
  document.getElementById(
    "paymentList"
  );

const paymentEmpty =
  document.getElementById(
    "paymentEmpty"
  );

const unpaidCount =
  document.getElementById(
    "unpaidCount"
  );

const onlineCount =
  document.getElementById(
    "onlineCount"
  );

const cbCount =
  document.getElementById(
    "cbCount"
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
   STATE
======================================== */

let players = [];


/* ========================================
   HELPERS
======================================== */

function clean(value) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );

}


function escapeHtml(value) {

  return String(
    value || ""
  )
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


/*
 * Même logique de surnom
 * que dans admin/js/joueurs.js
 */

function getNickname(player) {

  return clean(
    player.surnom ||
    player.nickname ||
    "Sans surnom"
  );

}


/* ========================================
   PAIEMENT
======================================== */

function getPaymentMethod(player) {

  if (
    player.paymentMethod ===
    "online"
  ) {

    return "online";

  }


  if (
    player.paymentMethod ===
    "cb"
  ) {

    return "cb";

  }


  return null;

}


function getPaymentLabel(method) {

  if (
    method === "online"
  ) {

    return "En ligne";

  }


  if (
    method === "cb"
  ) {

    return "CB";

  }


  return "Non payé";

}


/* ========================================
   TRI
======================================== */

function sortPlayers(a, b) {

  const aPayment =
    getPaymentMethod(a);

  const bPayment =
    getPaymentMethod(b);


  const aPaid =
    aPayment
      ? 1
      : 0;


  const bPaid =
    bPayment
      ? 1
      : 0;


  /*
   * Non payés en premier.
   */

  if (
    aPaid !== bPaid
  ) {

    return (
      aPaid -
      bPaid
    );

  }


  /*
   * Puis ordre alphabétique
   * des surnoms.
   */

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
   COMPTEURS
======================================== */

function renderCounters() {

  let unpaid =
    0;

  let online =
    0;

  let cb =
    0;


  players.forEach(
    player => {

      const method =
        getPaymentMethod(
          player
        );


      if (
        method === "online"
      ) {

        online += 1;

      }

      else if (
        method === "cb"
      ) {

        cb += 1;

      }

      else {

        unpaid += 1;

      }

    }
  );


  unpaidCount.textContent =
    String(
      unpaid
    );


  onlineCount.textContent =
    String(
      online
    );


  cbCount.textContent =
    String(
      cb
    );

}


/* ========================================
   CARTE JOUEUR
======================================== */

function renderPlayer(
  player
) {

  const nickname =
    getNickname(
      player
    );


  const method =
    getPaymentMethod(
      player
    );


  return `

    <article
      class="payment-row"
      data-player-id="${escapeHtml(player.id)}"
      data-payment="${method || "unpaid"}"
    >

      <div class="payment-player">

        <div class="payment-nickname">
          ${escapeHtml(nickname)}
        </div>


        <span class="payment-state">
          ${getPaymentLabel(method)}
        </span>

      </div>


      <div class="payment-actions">


        <button
          type="button"
          class="
            payment-action
            ${
              method === null
                ? "active-unpaid"
                : ""
            }
          "
          data-payment-action="unpaid"
          data-id="${escapeHtml(player.id)}"
        >
          ❌ Non payé
        </button>


        <button
          type="button"
          class="
            payment-action
            ${
              method === "online"
                ? "active-online"
                : ""
            }
          "
          data-payment-action="online"
          data-id="${escapeHtml(player.id)}"
        >
          🌐 En ligne
        </button>


        <button
          type="button"
          class="
            payment-action
            ${
              method === "cb"
                ? "active-cb"
                : ""
            }
          "
          data-payment-action="cb"
          data-id="${escapeHtml(player.id)}"
        >
          💳 CB
        </button>


      </div>

    </article>

  `;

}


/* ========================================
   RENDER
======================================== */

function render() {

  renderCounters();


  if (
    players.length === 0
  ) {

    paymentList.innerHTML =
      "";

    paymentEmpty.hidden =
      false;

    return;

  }


  paymentEmpty.hidden =
    true;


  const sortedPlayers =
    [...players]
      .sort(
        sortPlayers
      );


  paymentList.innerHTML =
    sortedPlayers
      .map(
        player =>
          renderPlayer(
            player
          )
      )
      .join("");

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
      "Erreur chargement inscriptions admin :",
      error
    );


    paymentEmpty.hidden =
      false;


    paymentEmpty.textContent =
      "Impossible de charger les joueurs.";

  }

);


/* ========================================
   MODIFIER PAIEMENT
======================================== */

async function updatePayment(
  player,
  paymentMethod
) {

  const playerRef =
    doc(
      db,
      "players",
      player.id
    );


  await updateDoc(
    playerRef,
    {

      paymentMethod:
        paymentMethod === "unpaid"
          ? null
          : paymentMethod,

      paymentUpdatedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    }
  );

}


/* ========================================
   ACTIONS
======================================== */

paymentList.addEventListener(
  "click",

  async event => {

    const button =
      event.target.closest(
        "button[data-payment-action]"
      );


    if (
      !button
    ) {

      return;

    }


    const playerId =
      button.dataset.id;


    const paymentMethod =
      button.dataset.paymentAction;


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


    const currentMethod =
      getPaymentMethod(
        player
      ) || "unpaid";


    /*
     * Si on clique sur l'état
     * déjà sélectionné :
     * aucune écriture inutile.
     */

    if (
      currentMethod ===
      paymentMethod
    ) {

      return;

    }


    const row =
      button.closest(
        ".payment-row"
      );


    const buttons =
      row
        ? row.querySelectorAll(
            ".payment-action"
          )
        : [];


    buttons.forEach(
      item => {

        item.disabled =
          true;

      }
    );


    try {

      await updatePayment(
        player,
        paymentMethod
      );

      /*
       * Pas besoin de render() ici.
       *
       * Le onSnapshot Firestore
       * recevra immédiatement la
       * modification et réorganisera
       * automatiquement la liste.
       */

    }

    catch (error) {

      console.error(
        "Erreur modification paiement :",
        error
      );


      alert(
        "Impossible de modifier le paiement."
      );


      buttons.forEach(
        item => {

          item.disabled =
            false;

        }
      );

    }

  }
);
