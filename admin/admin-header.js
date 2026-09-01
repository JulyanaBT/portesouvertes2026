const headerTarget = document.getElementById("siteHeader");

if (headerTarget) {

  headerTarget.innerHTML = `

    <header class="site-header admin-header">

      <div class="header-top">

        <a
          href="index.html"
          class="header-logo"
          aria-label="Accueil admin"
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
          class="header-logo header-logo-right"
          aria-label="Version publique"
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
          href="matchs.html"
          data-nav="matchs"
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


  const currentPage =
    document.body.dataset.page;

  if (currentPage) {

    const activeLink =
      document.querySelector(
        `[data-nav="${currentPage}"]`
      );

    if (activeLink) {
      activeLink.classList.add("active");
    }

  }

}
