import {
  isAdminConnected
} from "../admin-session.js";


const headerTarget =
  document.getElementById(
    "siteHeader"
  );


if (!headerTarget) {

  throw new Error(
    "Élément #siteHeader introuvable."
  );

}


/*
 * Sécurité interface minimale :
 * si l'appareil n'est pas connecté en admin,
 * on renvoie vers la page de connexion admin.
 */

const currentPath =
  window.location.pathname;


const isAdminHome =
  currentPath.endsWith("/admin/") ||
  currentPath.endsWith("/admin/index.html");


if (
  !isAdminConnected() &&
  !isAdminHome
) {

  window.location.href =
    "index.html";

}


/*
 * HEADER ADMIN
 */

headerTarget.innerHTML = `

  <header class="site-header admin-header">

    <div class="header-top">


      <a
        href="index.html"
        class="header-logo"
        aria-label="Accueil administration"
      >

        <img
          src="../assets/logo-suzini.png"
          alt="TC Suzini"
        >

      </a>


      <div class="header-event">

        <span>
          MODE ORGANISATEUR
        </span>

        <strong>
          Americano
        </strong>

      </div>


      <a
        href="../index.html"
        class="header-logo header-logo-right admin-public-switch"
        aria-label="Passer au site public"
      >

        <img
          src="../assets/logo-julyana.png"
          alt="Jul'Yana Beach Tennis"
        >

      </a>


    </div>


    <nav class="main-nav">


      <a
        href="index.html"
        data-nav="accueil"
      >

        <span class="nav-icon">
          🏠
        </span>

        <span class="nav-label">
          Accueil
        </span>

      </a>


      <a
        href="joueurs.html"
        data-nav="joueurs"
      >

        <span class="nav-icon">
          👥
        </span>

        <span class="nav-label">
          Joueurs
        </span>

      </a>


      <a
        href="inscriptions.html"
        data-nav="inscriptions"
      >

        <span class="nav-icon">
          💳
        </span>

        <span class="nav-label">
          Inscriptions
        </span>

      </a>


      <a
        href="programmation.html"
        data-nav="programmation"
      >

        <span class="nav-icon">
          🎾
        </span>

        <span class="nav-label">
          Matchs
        </span>

      </a>


      <a
        href="classement.html"
        data-nav="classement"
      >

        <span class="nav-icon">
          🏆
        </span>

        <span class="nav-label">
          Classement
        </span>

      </a>


    </nav>

  </header>

`;


/*
 * ONGLET ACTIF
 */

const currentPage =
  document.body.dataset.page;


if (currentPage) {

  const activeLink =
    headerTarget.querySelector(
      `[data-nav="${currentPage}"]`
    );


  if (activeLink) {

    activeLink.classList.add(
      "active"
    );

  }

}
