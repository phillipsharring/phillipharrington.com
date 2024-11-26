<template>
  <header class="header">
    <div class="header__wrapper">
      <div class="header__logo">
        <div class="header__logo-inner">
          <h6 class="header__logo-responsive">
            <div class="header__logo-link">
              <nuxt-link to="/" @click.native="maybeHideMenu">
                <div id="initials">
                  <svg
                    class="svg1"
                    viewbox="0 0 64 48"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      class="path1"
                      d="M 47 2 l -45 0 l 0 44 l 10 0 l 0 -32 l 9 0 a 1 1 0 0 1 0 13 l -7 0"
                    />
                    <path
                      class="path2"
                      d="M 16 46 l 46 0 l 0 -44 l -11 0 l 0 34 M 49 24 l -12 0 M 35 24 l 0 -12 M 35 24 l 0 12"
                    />
                  </svg>
                </div>
              </nuxt-link>
              <div id="name" :class="nameClass">
                <svg>
                  <use xlink:href="/img/sprite.svg#icon-name"></use>
                </svg>
              </div>
            </div>
          </h6>
        </div>
        <!--suppress HtmlUnknownTag -->
        <layout-nav-hamburger-menu />
      </div>
      <!--suppress HtmlUnknownTag -->
      <layout-nav-main-menu :class="mainMenuClass" />
    </div>
  </header>
</template>

<script>
export default {
  computed: {
    mainMenuClass() {
      const className = this.$store.getters['nav/isHamburgerOpen']
        ? 'block'
        : 'hidden'
      return { [className]: true }
    },

    nameClass() {
      return {
        'very-hidden': !this.onHome(),
      }
    },
  },

  methods: {
    onHome() {
      return this.$route.path === '/'
    },

    maybeHideMenu() {
      if (this.onHome() && this.$store.getters['nav/isHamburgerOpen']) {
        this.$store.commit('nav/setHamburger', false)
      }
    },
  },
}
</script>

<style scoped lang="scss">
.header {
  // border-style: solid;
  // border-top-width: 0.7rem;
  // border-color: $primary;
  padding-top: 0.7rem;

  &__wrapper {
    height: $l-100;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
  }

  &__logo {
    width: 100%;
    height: $full;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: $l-16;
    padding-right: $l-16;
  }

  &__logo-inner {
    width: $full;
    height: $full;
    display: flex;
    align-items: center;
  }

  &__logo-responsive {
    height: $l-64;
    z-index: 50;
    display: flex;
    align-items: center;
    // margin: 0.4rem;
    width: $l-80;
  }

  &__logo-link {
    display: block;
    width: $full;
    height: $full;
    outline: none;
    color: #252957;

    #initials,
    #name {
      display: block;
      height: $full;

      svg {
        fill: currentColor;
        height: 100%;
        width: 100%;
      }
    }

    #initials {
      width: 6.4rem;

      .svg1 {
        fill: none;
      }

      .svg1 path {
        --dashes: 18rem;
        --spaces: 20rem;
        stroke: url(#lg1);
        stroke-width: 0.4rem;
        stroke-dasharray: 0 var(--spaces);
        stroke-dashoffset: 1rem;
        -webkit-animation-name: phStrokeAnim;
        animation-name: phStrokeAnim;
        -webkit-animation-duration: 0.7s;
        animation-duration: 0.7s;
        -webkit-animation-delay: 0.5s;
        animation-delay: 0.5s;
        -webkit-animation-fill-mode: forwards;
        animation-fill-mode: forwards;
      }

      .path2 {
        -webkit-animation-delay: 1.15s;
        animation-delay: 1.15s;
      }
    }

    #initials:hover {
      /* background: $secondary; / * darken($primary, 30%); */
      .svg1 path {
        stroke: url(#lg2);
      }
    }

    #name {
      display: none;
      // background-image: url(/img/name.png);
      // background-size: 164px 42px;
      width: 19.2rem;
    }
  }
}

@media only screen and (min-width: 650px) {
  .header {
    &__wrapper {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      max-width: $l-690;
      margin-left: auto;
      margin-right: auto;
    }

    &__logo {
      width: auto;
    }

    &__logo-responsive {
      display: block;
      width: 100%;
      height: $l-48;
      margin-right: 0.8rem;
    }

    &__logo-link {
      display: flex;
      justify-content: flex-start;

      #initials {
        margin-right: 1.6rem;
      }

      #name {
        display: block;
      }
    }
  }
}

@-webkit-keyframes phStrokeAnim {
  0% {
    stroke-dasharray: 1 var(--spaces);
  }
  100% {
    stroke-dasharray: var(--dashes) var(--spaces);
  }
}

@keyframes phStrokeAnim {
  0% {
    stroke-dasharray: 1 var(--spaces);
  }
  100% {
    stroke-dasharray: var(--dashes) var(--spaces);
  }
}
</style>
