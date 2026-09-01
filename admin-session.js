const ADMIN_STORAGE_KEY = "suziniAmericanoAdmin";
const ADMIN_PASSWORD = "Mel@nie.28";


export function isAdminConnected() {
  return localStorage.getItem(ADMIN_STORAGE_KEY) === "true";
}


export function loginAdmin(password) {

  if (password === ADMIN_PASSWORD) {

    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      "true"
    );

    return true;
  }

  return false;
}


export function logoutAdmin() {

  localStorage.removeItem(
    ADMIN_STORAGE_KEY
  );

}


export function requireAdmin() {

  if (!isAdminConnected()) {

    window.location.href =
      "admin.html";

    return false;
  }

  return true;
}
