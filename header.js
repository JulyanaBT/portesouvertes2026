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
   * STYLES NAVIGATION
   * ========================================
   *
   * On les place ici pour éviter que
   * d'anciennes règles de style.css
   * cassent la navigation horizontale.
   */

  const navStyle =
    document.createElement(
      "style"
    );


  navStyle.textContent = `

    #siteHeader .main-nav-shell {

      position: relative;

      width: 100%;

      overflow: hidden;

    }


    #siteHeader .main-nav {

      display: flex !important;

      flex-direction: row !important;

      flex-wrap: nowrap !important;

      align-items: stretch;

      justify-content: flex-start !important;

      gap: 4px;

      width: 100%;

      max-width: 100%;

      box-sizing: border-box;

      overflow-x: auto !important;

      overflow-y: hidden !important;

      padding:
        5px 28px
        6px 28px;

      scroll-behavior: smooth;

      scrollbar-width: none;

      -webkit-overflow-scrolling:
        touch;

      overscroll-behavior-x:
        contain;

    }


    #siteHeader
    .main-nav::-webkit-scrollbar {

      display: none;

    }


    #siteHeader
    .main-nav > a {

      flex:
        0 0 auto !important;

      display: flex;

      flex-direction: column;

      align-items: center;

      justify-content: center;

      min-width: 74px;

      width: auto !important;

      white-space: nowrap;

      box-sizing: border-box;

    }


    #siteHeader
    .main-nav .nav-icon {

      flex: 0 0 auto;

    }


    #siteHeader
    .main-nav .nav-label {

      display: block;

      white-space: nowrap;

    }


    /*
     * FLECHES
     */

    #siteHeader
    .nav-scroll-arrow {

      position: absolute;

      z-index: 30;

      top: 50%;

      transform:
        translateY(-50%);

      display: flex;

      align-items: center;

      justify-content: center;

      width: 25px;

      height: 38px;

      padding: 0;

      border: 0;

      border-radius: 0;

      background:
        rgba(255,255,255,.94);

      color: #111;

      font-size: 25px;

      font-weight: 1000;

      line-height: 1;

      cursor: pointer;

    }


    #siteHeader
    .nav-scroll-arrow[hidden] {

      display: none !important;

    }


    #siteHeader
    .nav-scroll-left {

      left: 0;

      background:
        linear-gradient(
          90deg,
          #ffffff 60%,
          rgba(255,255,255,.80)
        );

    }


    #siteHeader
    .nav-scroll-right {

      right: 0;

      background:
        linear-gradient(
          270deg,
          #ffffff 60%,
          rgba(255,255,255,.80)
        );

    }

  `;


  document.head.appendChild(
    navStyle
  );


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
              class="
                header-logo
                header-logo-right
                admin-switch
              "
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
              class="
                header-logo
                header-logo-right
              "
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


      <!-- ==================================
           NAVIGATION
      =================================== -->

      <div class="main-nav-shell">


        <!-- FLECHE GAUCHE -->

        <button
          type="button"
          class="
            nav-scroll-arrow
            nav-scroll-left
          "
          aria-label="Voir les onglets précédents"
          hidden
        >
          ‹
        </button>


        <!-- ONGLETS -->

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


        <!-- FLECHE DROITE -->

        <button
          type="button"
          class="
            nav-scroll-arrow
            nav-scroll-right
          "
          aria-label="Voir les onglets suivants"
          hidden
        >
          ›
        </button>


      </div>


    </header>

  `;


  /*
   * ========================================
   * ELEMENTS NAVIGATION
   * ========================================
   */

  const nav =
    headerTarget.querySelector(
      ".main-nav"
    );


  const activeLink =
    headerTarget.querySelector(
      `[data-nav="${currentPage}"]`
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
   * ========================================
   * ONGLET ACTIF
   * ========================================
   */

  if (activeLink) {

    activeLink.classList.add(
      "active"
    );

  }


  /*
   * ========================================
   * POSITION DES FLECHES
   * ========================================
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


    /*
     * Pas de scroll nécessaire.
     */

    if (
      maxScroll <= 2
    ) {

      leftArrow.hidden =
        true;

      rightArrow.hidden =
        true;

      return;

    }


    leftArrow.hidden =
      nav.scrollLeft <= 2;


    rightArrow.hidden =
      nav.scrollLeft >=
      maxScroll - 2;

  }


  /*
   * ========================================
   * CENTRER L'ONGLET ACTIF
   * ========================================
   */

  function centerActiveLink() {

    if (
      !nav ||
      !activeLink
    ) {

      return;

    }


    /*
     * Position du centre de l'onglet
     * dans la zone scrollable.
     */

    const linkCenter =
      activeLink.offsetLeft +
      (
        activeLink.offsetWidth / 2
      );


    /*
     * Position désirée :
     * centre de l'écran.
     */

    const targetScroll =
      linkCenter -
      (
        nav.clientWidth / 2
      );


    const maxScroll =
      Math.max(
        0,
        nav.scrollWidth -
        nav.clientWidth
      );


    const finalScroll =
      Math.min(
        Math.max(
          targetScroll,
          0
        ),
        maxScroll
      );


    nav.scrollLeft =
      finalScroll;


    updateNavArrows();

  }


  /*
   * ========================================
   * CLIC FLECHE GAUCHE
   * ========================================
   */

  leftArrow.addEventListener(
    "click",
    () => {

      nav.scrollBy({

        left:
          -(nav.clientWidth * 0.65),

        behavior:
          "smooth"

      });

    }
  );


  /*
   * ========================================
   * CLIC FLECHE DROITE
   * ========================================
   */

  rightArrow.addEventListener(
    "click",
    () => {

      nav.scrollBy({

        left:
          nav.clientWidth * 0.65,

        behavior:
          "smooth"

      });

    }
  );


  /*
   * ========================================
   * SCROLL TACTILE
   * ========================================
   */

  nav.addEventListener(
    "scroll",
    () => {

      updateNavArrows();

    },
    {
      passive: true
    }
  );


  /*
   * ========================================
   * REDIMENSIONNEMENT
   * ========================================
   */

  window.addEventListener(
    "resize",
    () => {

      centerActiveLink();

    }
  );


  /*
   * ========================================
   * INITIALISATION
   * ========================================
   *
   * Double requestAnimationFrame :
   * on attend que le navigateur ait calculé
   * les vraies largeurs du header.
   */

  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          centerActiveLink();

          updateNavArrows();

        }
      );

    }
  );

}
