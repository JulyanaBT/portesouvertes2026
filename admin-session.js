const ADMIN_STORAGE_KEY =
  "suziniAmericanoAdmin";

const ADMIN_PASSWORD =
  "Mel@nie.28";


/* ========================================
   ETAT DE LA SESSION
======================================== */

export function isAdminConnected() {

  return (
    localStorage.getItem(
      ADMIN_STORAGE_KEY
    ) === "true"
  );

}


/* ========================================
   CONNEXION
======================================== */

export function loginAdmin(password) {

  if (password !== ADMIN_PASSWORD) {

    return false;

  }

  localStorage.setItem(
    ADMIN_STORAGE_KEY,
    "true"
  );

  return true;

}


/* ========================================
   DECONNEXION
======================================== */

export function logoutAdmin() {

  localStorage.removeItem(
    ADMIN_STORAGE_KEY
  );

}


/* ========================================
   PROTECTION DES PAGES ADMIN
======================================== */

export function requireAdmin() {

  if (isAdminConnected()) {

    return true;

  }

  window.location.href =
    "index.html";

  return false;

}


/* ========================================
   BOUTONS RESERVES ADMIN
======================================== */

export function canAccessAdmin() {

  return isAdminConnected();

}
