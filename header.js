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


  const isAdminPage =
    document.body.dataset.admin ===
    "true";


  const adminConnected =
    isAdminConnected();


  /*
   * Correspondance PUBLIC / ADMIN
   */

  const publicPages = {

    accueil:
      "index.html",

    participants:
      "participants.html",

    programmation:
      "programmation.html",

    classement:
      "classement.html"

  };


  const adminPages = {

    accueil:
      "admin.html",

    participants:
      "admin-participants.html",

    programmation:
      "admin-programmation.html",

    classement:
      "admin-classement.html"

  };


  let julyanaTarget =
    null;


  if (adminConnected) {

    julyanaTarget =
      isAdminPage
        ? (
            publicPages[currentPage] ||
            "index.html"
          )
        : (
            adminPages[currentPage] ||
            "admin.html"
          );

  }



  headerTarget.innerHTML = `

    <header class="site-header">

      <div class="header-top">


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


        <div class="header-event">

          <span>
            ${
              isAdminPage
                ? "MODE ORGANISATEUR"
                : "PORTES OUVERTES"
            }
          </span>

          <strong>
            Americano
          </strong>

        </div>


        ${
          julyanaTarget

          ? `

            <a
              href="${julyanaTarget}"
              class="header-logo header-logo-right admin-switch"
              aria-label="${
                isAdminPage
                  ? "Passer au site public"
                  : "Passer en administration"
              }"
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


      <nav class="main-nav">


        <a
          href="${
            isAdminPage
              ? "admin.html"
              : "index.html"
          }"
          data-nav="accueil"
        >

          <span class="nav-icon">
            ⌂
          </span>

          <span class="nav-label">
            Accueil
          </span>

        </a>


        <a
          href="${
            isAdminPage
              ? "admin-participants.html"
              : "participants.html"
          }"
          data-nav="participants"
        >

          <span class="nav-icon">
            👥
          </span>

          <span class="nav-label">
            Joueurs
          </span>

        </a>


        <a
          href="${
            isAdminPage
              ? "admin-programmation.html"
              : "programmation.html"
          }"
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
          href="${
            isAdminPage
              ? "admin-classement.html"
              : "classement.html"
          }"
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
