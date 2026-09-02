import { db } from "../../firebase.js";

import {
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ========================================
   ELEMENTS
======================================== */

const clearMatchesBtn =
  document.getElementById(
    "clearMatchesBtn"
  );

const resetPlayersBtn =
  document.getElementById(
    "resetPlayersBtn"
  );

const clearPlayersBtn =
  document.getElementById(
    "clearPlayersBtn"
  );

const clearSettingsBtn =
  document.getElementById(
    "clearSettingsBtn"
  );

const clearAllBtn =
  document.getElementById(
    "clearAllBtn"
  );

const maintenanceStatus =
  document.getElementById(
    "maintenanceStatus"
  );


/* ========================================
   COLLECTIONS
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

const matchesRef =
  collection(
    db,
    "matches"
  );

const settingsRef =
  collection(
    db,
    "settings"
  );


/* ========================================
   STATUS
======================================== */

function showStatus(
  message,
  type = ""
) {

  maintenanceStatus.textContent =
    message;


  maintenanceStatus.className =
    "maintenance-status visible";


  if (type) {

    maintenanceStatus.classList.add(
      type
    );

  }

}


function clearStatus() {

  maintenanceStatus.textContent =
    "";

  maintenanceStatus.className =
    "maintenance-status";

}


/* ========================================
   BLOQUER LES BOUTONS
======================================== */

function setBusy(
  busy
) {

  [
    clearMatchesBtn,
    resetPlayersBtn,
    clearPlayersBtn,
    clearSettingsBtn,
    clearAllBtn
  ].forEach(
    button => {

      if (button) {

        button.disabled =
          busy;

      }

    }
  );

}


/* ========================================
   SUPPRESSION D'UNE COLLECTION
======================================== */

async function deleteCollection(
  collectionRef
) {

  const snapshot =
    await getDocs(
      collectionRef
    );


  if (
    snapshot.empty
  ) {

    return 0;

  }


  /*
   * Firestore limite un batch
   * à 500 opérations.
   *
   * On travaille volontairement
   * par groupes de 400.
   */

  const docs =
    snapshot.docs;


  const CHUNK_SIZE =
    400;


  let deleted =
    0;


  for (
    let start = 0;
    start < docs.length;
    start += CHUNK_SIZE
  ) {

    const chunk =
      docs.slice(
        start,
        start + CHUNK_SIZE
      );


    const batch =
      writeBatch(
        db
      );


    chunk.forEach(
      snapshotDoc => {

        batch.delete(
          snapshotDoc.ref
        );

      }
    );


    await batch.commit();


    deleted +=
      chunk.length;

  }


  return deleted;

}


/* ========================================
   REINITIALISER LES JOUEURS
======================================== */

async function resetPlayersState() {

  const snapshot =
    await getDocs(
      playersRef
    );


  if (
    snapshot.empty
  ) {

    return 0;

  }


  const docs =
    snapshot.docs;


  const CHUNK_SIZE =
    400;


  let updated =
    0;


  for (
    let start = 0;
    start < docs.length;
    start += CHUNK_SIZE
  ) {

    const chunk =
      docs.slice(
        start,
        start + CHUNK_SIZE
      );


    const batch =
      writeBatch(
        db
      );


    chunk.forEach(
      snapshotDoc => {

        batch.update(
          snapshotDoc.ref,
          {
            active:
              false,

            status:
              "registered",

            arrivalAt:
              null,

            departureAt:
              null,

            updatedAt:
              serverTimestamp()
          }
        );

      }
    );


    await batch.commit();


    updated +=
      chunk.length;

  }


  return updated;

}


/* ========================================
   EFFACER LES MATCHS
======================================== */

async function clearMatches() {

  const confirmed =
    window.confirm(
      "Effacer toute la programmation et tous les résultats de matchs ?\n\nLes joueurs seront conservés."
    );


  if (!confirmed) {
    return;
  }


  setBusy(
    true
  );

  clearStatus();


  try {

    showStatus(
      "Suppression des matchs en cours…"
    );


    const matchesDeleted =
      await deleteCollection(
        matchesRef
      );


    /*
     * La programmation utilise
     * settings/programmation.
     *
     * On supprime ici tous les settings
     * pour être certain de repartir
     * avec une génération propre.
     */

    const settingsDeleted =
      await deleteCollection(
        settingsRef
      );


    showStatus(
      `${matchesDeleted} match(s) supprimé(s). ${settingsDeleted} réglage(s) supprimé(s).`,
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur suppression matchs :",
      error
    );


    showStatus(
      "Impossible d’effacer les matchs.",
      "error"
    );

  }

  finally {

    setBusy(
      false
    );

  }

}


/* ========================================
   RESET ETAT JOUEURS
======================================== */

async function resetPlayers() {

  const confirmed =
    window.confirm(
      "Réinitialiser l’état de tous les joueurs ?\n\nLes inscriptions et surnoms seront conservés."
    );


  if (!confirmed) {
    return;
  }


  setBusy(
    true
  );

  clearStatus();


  try {

    showStatus(
      "Réinitialisation des joueurs en cours…"
    );


    const updated =
      await resetPlayersState();


    showStatus(
      `${updated} joueur(s) réinitialisé(s).`,
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur reset joueurs :",
      error
    );


    showStatus(
      "Impossible de réinitialiser les joueurs.",
      "error"
    );

  }

  finally {

    setBusy(
      false
    );

  }

}


/* ========================================
   EFFACER LES JOUEURS
======================================== */

async function clearPlayers() {

  const confirmed =
    window.confirm(
      "Supprimer tous les joueurs inscrits et tous les surnoms réservés ?\n\nLes matchs seront conservés."
    );


  if (!confirmed) {
    return;
  }


  const confirmedAgain =
    window.confirm(
      "Confirmer la suppression des joueurs ?"
    );


  if (!confirmedAgain) {
    return;
  }


  setBusy(
    true
  );

  clearStatus();


  try {

    showStatus(
      "Suppression des joueurs en cours…"
    );


    const playersDeleted =
      await deleteCollection(
        playersRef
      );


    const nicknamesDeleted =
      await deleteCollection(
        nicknamesRef
      );


    showStatus(
      `${playersDeleted} joueur(s) et ${nicknamesDeleted} surnom(s) supprimé(s).`,
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur suppression joueurs :",
      error
    );


    showStatus(
      "Impossible d’effacer les joueurs.",
      "error"
    );

  }

  finally {

    setBusy(
      false
    );

  }

}


/* ========================================
   EFFACER SETTINGS
======================================== */

async function clearSettings() {

  const confirmed =
    window.confirm(
      "Effacer tous les réglages de programmation ?"
    );


  if (!confirmed) {
    return;
  }


  setBusy(
    true
  );

  clearStatus();


  try {

    showStatus(
      "Suppression des réglages en cours…"
    );


    const deleted =
      await deleteCollection(
        settingsRef
      );


    showStatus(
      `${deleted} réglage(s) supprimé(s).`,
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur suppression réglages :",
      error
    );


    showStatus(
      "Impossible d’effacer les réglages.",
      "error"
    );

  }

  finally {

    setBusy(
      false
    );

  }

}


/* ========================================
   TOUT EFFACER
======================================== */

async function clearAll() {

  const firstConfirmation =
    window.confirm(
      "ATTENTION\n\nCette action va supprimer :\n\n• tous les joueurs\n• tous les surnoms\n• tous les matchs\n• tous les résultats\n• tous les réglages\n\nContinuer ?"
    );


  if (
    !firstConfirmation
  ) {

    return;

  }


  const secondConfirmation =
    window.confirm(
      "DERNIÈRE CONFIRMATION\n\nLa remise à zéro complète est définitive.\n\nTout effacer ?"
    );


  if (
    !secondConfirmation
  ) {

    return;

  }


  setBusy(
    true
  );

  clearStatus();


  try {

    showStatus(
      "Remise à zéro complète en cours…"
    );


    /*
     * On supprime d'abord les matchs
     * et réglages, puis joueurs/surnoms.
     */

    const matchesDeleted =
      await deleteCollection(
        matchesRef
      );


    const settingsDeleted =
      await deleteCollection(
        settingsRef
      );


    const playersDeleted =
      await deleteCollection(
        playersRef
      );


    const nicknamesDeleted =
      await deleteCollection(
        nicknamesRef
      );


    showStatus(
      `Remise à zéro terminée : ${matchesDeleted} match(s), ${settingsDeleted} réglage(s), ${playersDeleted} joueur(s) et ${nicknamesDeleted} surnom(s) supprimé(s).`,
      "success"
    );

  }

  catch (error) {

    console.error(
      "Erreur remise à zéro complète :",
      error
    );


    showStatus(
      "La remise à zéro complète a rencontré une erreur. Vérifie les données avant de recommencer.",
      "error"
    );

  }

  finally {

    setBusy(
      false
    );

  }

}


/* ========================================
   EVENTS
======================================== */

clearMatchesBtn?.addEventListener(
  "click",
  clearMatches
);


resetPlayersBtn?.addEventListener(
  "click",
  resetPlayers
);


clearPlayersBtn?.addEventListener(
  "click",
  clearPlayers
);


clearSettingsBtn?.addEventListener(
  "click",
  clearSettings
);


clearAllBtn?.addEventListener(
  "click",
  clearAll
);
