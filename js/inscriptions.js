import { db } from "../firebase.js";

import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const form =
  document.getElementById(
    "signupForm"
  );

const formArea =
  document.getElementById(
    "formArea"
  );

const prenomInput =
  document.getElementById(
    "prenom"
  );

const nomInput =
  document.getElementById(
    "nom"
  );

const surnomInput =
  document.getElementById(
    "surnom"
  );

const suggestedNickname =
  document.getElementById(
    "suggestedNickname"
  );

const submitBtn =
  document.getElementById(
    "submitBtn"
  );

const message =
  document.getElementById(
    "formMessage"
  );

const successCard =
  document.getElementById(
    "successCard"
  );

const successNickname =
  document.getElementById(
    "successNickname"
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


/* ========================================
   STATE
======================================== */

let suggestionRequest = 0;

let isSubmitting = false;


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


function capitalize(value) {

  const text =
    clean(value);

  if (!text) {
    return "";
  }

  return (
    text.charAt(0).toUpperCase()
    +
    text.slice(1)
  );

}


function makeBaseNickname(
  prenom,
  nom
) {

  const p =
    capitalize(prenom);

  const n =
    clean(nom);

  if (!p || !n) {
    return "";
  }

  return (
    `${p} ${n.charAt(0).toUpperCase()}`
  );

}


/* ========================================
   NICKNAME
======================================== */

async function nicknameExists(
  nickname
) {

  const key =
    normalizeKey(
      nickname
    );

  if (!key) {
    return true;
  }

  const snapshot =
    await getDoc(
      doc(
        nicknamesRef,
        key
      )
    );

  return snapshot.exists();

}


async function findAvailableNickname(
  base
) {

  let candidate =
    clean(base);

  let counter =
    2;

  while (
    await nicknameExists(
      candidate
    )
  ) {

    candidate =
      `${base} ${counter}`;

    counter++;

  }

  return candidate;

}


async function updateSuggestion() {

  const requestId =
    ++suggestionRequest;

  const base =
    makeBaseNickname(
      prenomInput.value,
      nomInput.value
    );

  if (!base) {

    suggestedNickname.textContent =
      "—";

    return;

  }

  suggestedNickname.textContent =
    "Recherche…";

  try {

    const nickname =
      await findAvailableNickname(
        base
      );

    if (
      requestId !==
      suggestionRequest
    ) {
      return;
    }

    suggestedNickname.textContent =
      nickname;

  }

  catch (error) {

    console.error(
      "Erreur suggestion surnom :",
      error
    );

    if (
      requestId ===
      suggestionRequest
    ) {

      suggestedNickname.textContent =
        base;

    }

  }

}


/* ========================================
   MESSAGES
======================================== */

function setMessage(
  type,
  text
) {

  message.className =
    `message ${type}`;

  message.textContent =
    text;

}


function clearMessage() {

  message.className =
    "message";

  message.textContent =
    "";

}


/* ========================================
   EVENTS
======================================== */

prenomInput.addEventListener(
  "input",
  updateSuggestion
);


nomInput.addEventListener(
  "input",
  updateSuggestion
);


/* ========================================
   SUBMIT
======================================== */

form.addEventListener(
  "submit",

  async event => {

    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearMessage();


    const prenom =
      clean(
        prenomInput.value
      );

    const nom =
      clean(
        nomInput.value
      );

    const customNickname =
      clean(
        surnomInput.value
      );


    if (
      !prenom ||
      !nom
    ) {

      setMessage(
        "error",
        "Le prénom et le nom sont obligatoires."
      );

      return;

    }


    isSubmitting =
      true;

    submitBtn.disabled =
      true;

    submitBtn.textContent =
      "Inscription…";


    try {

      const baseNickname =
        makeBaseNickname(
          prenom,
          nom
        );


      const finalNickname =
        customNickname
          ? customNickname
          : await findAvailableNickname(
              baseNickname
            );


      const nicknameKey =
        normalizeKey(
          finalNickname
        );


      if (!nicknameKey) {

        throw new Error(
          "Le surnom choisi n'est pas valide."
        );

      }


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
              "Ce surnom vient d'être pris."
            );

          }


          /*
           * JOUEUR
           */

          transaction.set(
            playerRef,
            {

              prenom,

              nom,

              surnom:
                finalNickname,

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


          /*
           * RESERVATION DU SURNOM
           */

          transaction.set(
            nicknameRef,
            {

              nickname:
                finalNickname,

              playerId:
                playerRef.id,

              createdAt:
                serverTimestamp()

            }
          );

        }
      );


      /*
       * CONFIRMATION
       */

      successNickname.textContent =
        finalNickname;


      formArea.style.display =
        "none";


      successCard.classList.add(
        "visible"
      );

    }

    catch (error) {

      console.error(
        "Erreur inscription :",
        error
      );


      setMessage(
        "error",
        error?.message ||
        "Impossible d'enregistrer l'inscription."
      );

    }

    finally {

      isSubmitting =
        false;


      submitBtn.disabled =
        false;


      submitBtn.textContent =
        "✍️ Valider mon inscription";

    }

  }

);
