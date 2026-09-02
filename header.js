import {
  isAdminConnected
} from "./admin-session.js";


const headerTarget =
  document.getElementById(
    "siteHeader"
  );


if (headerTarget) {

  const currentPage =
    document.body.dataset.page ||
    "accueil";


  const adminConnected =
    isAdminConnected();


  /*
   * ========================================
   * CORRESPONDANCE PUBLIC → ADMIN
   * ========================================
   */

  const adminPages = {

    accueil:
      "admin/index.html",

    joueurs:
      "admin/joueurs.html",

    programmation:
      "admin/programmation.html",

    classement:
      "admin/classement.html"

  };


  const adminTarget =
    adminPages[currentPage] ||
    "admin/index.html";


  /*
   * ========================================
   * HEADER
   * ========================================
   */

  headerTarget.innerHTML = `

    <header class="site-header">

      <div class="header-top">


        <!-- LOGO SUZINI -->

        <a
          href="index.html"
          class="header-logo"
          aria-label="Accueil"
        >

          <img
            src="assets/logo-suzini.png"
            alt="TC Suzini"
          >

        </a>


        <!-- TITRE -->

        <div class="header-event">

          <span>
            PORTES OUVERTES
          </span>

          <strong>
            Americano
          </strong>

        </div>


        <!-- LOGO JUL'YANA -->

        ${
          adminConnected

          ? `

            <a
              href="${adminTarget}"
              class="header-logo header-logo-right admin-switch"
              aria-label="Passer en administration"
            >

              <img
                src="assets/logo-julyana.png"
                alt="Jul'Yana Beach Tennis"
              >

            </a>

          `

          : `

            <div
              class="header-logo header-logo-right"
              aria-hidden="true"
            >

              <img
                src="assets/logo-julyana.png"
                alt="Jul'Yana Beach Tennis"
              >

            </div>

          `
        }

      </div>


      <!-- NAVIGATION -->

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
   * ========================================
   * ONGLET ACTIF
   * ========================================
   */

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
