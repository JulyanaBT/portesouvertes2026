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

      <div class="main-nav-shell">

        <button
          type="button"
          class="nav-scroll-arrow nav-scroll-left"
          aria-label="Faire défiler le menu vers la gauche"
          hidden
        >
          ‹
        </button>


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


          <a
            href="statistiques.html"
            data-nav="statistiques"
          >

            <span class="nav-icon">
              📊
            </span>

            <span class="nav-label">
              Stats
            </span>

          </a>


          <a
            href="infos.html"
            data-nav="infos"
          >

            <span class="nav-icon">
              ℹ️
            </span>

            <span class="nav-label">
              Infos
            </span>

          </a>


        </nav>


        <button
          type="button"
          class="nav-scroll-arrow nav-scroll-right"
          aria-label="Faire défiler le menu vers la droite"
          hidden
        >
          ›
        </button>

      </div>

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


  /*
   * ========================================
   * NAVIGATION HORIZONTALE
   * ========================================
   */

  const nav =
    headerTarget.querySelector(
      ".main-nav"
    );


  const leftArrow =
    headerTarget.querySelector(
      ".nav-scroll-left"
    );


  const rightArrow =
    headerTarget.querySelector(
      ".nav-scroll-right"
    );


  /*
   * Affiche ou masque les flèches
   * suivant la position du scroll.
   */

  function updateNavArrows() {

    if (
      !nav ||
      !leftArrow ||
      !rightArrow
    ) {
      return;
    }


    const maxScroll =
      nav.scrollWidth -
      nav.clientWidth;


    const tolerance =
      3;


    leftArrow.hidden =
      nav.scrollLeft <=
      tolerance;


    rightArrow.hidden =
      nav.scrollLeft >=
      maxScroll -
      tolerance;

  }


  /*
   * Centre l'onglet actif.
   */

  function centerActiveLink() {

    if (
      !nav ||
      !activeLink
    ) {
      return;
    }


    const targetLeft =
      activeLink.offsetLeft -
      (
        nav.clientWidth -
        activeLink.offsetWidth
      ) / 2;


    const maxScroll =
      Math.max(
        0,
        nav.scrollWidth -
        nav.clientWidth
      );


    const finalLeft =
      Math.max(
        0,
        Math.min(
          targetLeft,
          maxScroll
        )
      );


    nav.scrollTo({
      left: finalLeft,
      behavior: "auto"
    });


    requestAnimationFrame(
      updateNavArrows
    );

  }


  /*
   * Flèche gauche
   */

  leftArrow?.addEventListener(
    "click",
    () => {

      nav.scrollBy({
        left:
          -Math.max(
            140,
            nav.clientWidth * 0.7
          ),

        behavior:
          "smooth"
      });

    }
  );


  /*
   * Flèche droite
   */

  rightArrow?.addEventListener(
    "click",
    () => {

      nav.scrollBy({
        left:
          Math.max(
            140,
            nav.clientWidth * 0.7
          ),

        behavior:
          "smooth"
      });

    }
  );


  /*
   * Mise à jour pendant
   * un scroll tactile.
   */

  nav?.addEventListener(
    "scroll",
    updateNavArrows,
    {
      passive: true
    }
  );


  /*
   * Recalcul si rotation écran
   * ou changement de largeur.
   */

  window.addEventListener(
    "resize",
    () => {

      centerActiveLink();

    }
  );


  /*
   * Premier affichage.
   */

  requestAnimationFrame(
    () => {

      centerActiveLink();
      updateNavArrows();

    }
  );

}
