<template>
  <footer class="footer">
    <div class="footer__wrapper">
      <div class="footer__inner">
        <div class="footer__love">
          <p>
            Made with
            <svg class="footer__icon footer__icon--heart">
              <use xlink:href="/img/icons.svg#icon-heart"></use>
            </svg>
            and
            <a href="https://nuxtjs.org" class="footer__link--nuxtjs">NuxtJS</a>
            in
            <a href="https://durhamnc.gov/" class="footer__love--drhm"
              >Durham, North Carolina</a
            >
          </p>
        </div>
        <div v-if="srcLink" class="footer__view-source">
          <p>
            View source: <a :href="srcLink">content</a>,
            <a :href="componentSrc">component</a>. Please feel free to submit a
            pull request.
          </p>
        </div>
        <div class="footer__copyright">
          <p>Copyright &copy; 2021 Phillip Harrington. All Rights Reserved.</p>
        </div>
        <div class="footer__links">
          <div class="footer__links--contact">
            <nuxt-link to="/contact">Contact</nuxt-link>
          </div>
          <div class="footer__squares">
            <a
              href="https://gitlab.com/phillipsharring"
              class="footer__link"
              title="Phillip Harrington on GitLab"
            >
              <svg class="footer__icon footer__icon--gitlab">
                <use xlink:href="/img/icons.svg#icon-gitlab"></use>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/phillipsharring"
              class="footer__link"
              title="Phillip Harrington on LinkedIn"
            >
              <svg class="footer__icon footer__icon--linkedin">
                <use xlink:href="/img/icons.svg#icon-linkedin"></use>
              </svg>
            </a>
            <a
              href="https://twitter.com/phillipsharring"
              class="footer__link"
              title="Phillip Harrington on Twitter"
            >
              <svg class="footer__icon footer__icon--twitter">
                <use xlink:href="/img/icons.svg#icon-twitter"></use>
              </svg>
            </a>
          </div>
          <div class="footer__squares footer__squares--home">
            <nuxt-link to="/" class="focus-outline-white">
              <div class="initials-xs" id="f-initials">
                <svg
                  class="svg1"
                  viewbox="0 0 64 48"
                  xmlns="http://www.w3.org/2000/svg"
                  alt="PH"
                >
                  <title>Home Page</title>
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
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  computed: {
    srcLink() {
      return this.$store.getters['layout/srcLink']
    },
    componentSrc() {
      return `${this.$config.gitlabBase}/pages/_slug.vue`
    },
  },
}
</script>

<style lang="scss">
@media only screen and (max-width: 340px) {
  .footer {
    &__copyright,
    &__links {
      max-width: 70%;
      margin: 0 auto;
    }
  }
}

@media only screen and (max-width: 430px) {
  .footer {
    &__love,
    &__view-source {
      max-width: 70%;
      margin: 0 auto;
    }
  }
}

.footer {
  margin-top: auto;

  a {
    color: $secondary; /* $gray-400; */
  }

  &__wrapper {
    display: flex;
    align-items: flex-end;
    font-size: 1.6rem;
    line-height: $l-24;
    color: $secondary; /* $gray-200; */
  }

  &__inner {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: $l-32 $l-40 $l-48;
    margin-right: auto;
    margin-left: auto;
    max-width: $l-690;
    background-color: $primary;
    background-image: linear-gradient(
      to bottom,
      $primary,
      $primary,
      lighten($primary, 10%),
      lighten($primary, 40%)
    );
  }

  &__love {
    font-size: 1.4rem;
    line-height: 2.1rem;
    width: $full;
    flex-grow: 1;
    text-align: center;
    // margin-top: $l-20;

    &--drhm {
      &:hover {
        background-image: -webkit-gradient(
          linear,
          left top,
          right top,
          from(#ee3a43),
          color-stop(#ffd24f),
          color-stop(#00467f),
          to(#ee3a43)
        );
        background-size: 200%;
        background-image: -o-linear-gradient(
          left,
          #ee3a43,
          #ffd24f,
          #00467f,
          #ee3a43
        );
        background-image: -webkit-gradient(
          linear,
          left top,
          right top,
          from(#ee3a43),
          color-stop(#ffd24f),
          color-stop(#00467f),
          to(#ee3a43)
        );
        background-image: linear-gradient(
          to right,
          #ee3a43,
          #ffd24f,
          #00467f,
          #ee3a43
        );
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        -webkit-animation: shine 2.5s linear infinite;
        animation: shine 2.5s linear infinite;
      }
    }
  }

  &__view-source {
    width: $full;
    flex-grow: 1;
    margin-top: $l-16;
    margin-bottom: $l-16;
    color: $secondary;
    font-size: 1.4rem;
    line-height: $l-20;
    font-style: italic;
    font-family: $serif;
    text-align: center;
  }

  &__copyright {
    width: 45%;
    font-size: 1.2rem;
    line-height: $l-20;
    color: $secondary;
  }

  &__links {
    display: flex;
    padding-top: 0.4rem;
    color: $gray-400;

    &--contact {
      display: none;
    }
  }

  &__link {
    margin-right: 0.8rem;

    &--nuxtjs {
      &:hover {
        color: #06ba8a;
      }
    }

    &:last-child {
      margin-right: $l-16;
    }
  }

  &__squares {
    display: flex;

    &--home {
      justify-content: flex-end;
    }
  }

  &__icon {
    color: $secondary; /* $gray-400; */
    width: $l-24;
    height: $l-24;
    fill: currentColor;

    &--heart {
      width: 1.8rem;
      height: 2.4rem;
      fill: #f963bf;

      &:hover {
        fill: #ff0000;
      }
    }

    &--gitlab {
      &:hover {
        fill: #fc6d26;
      }
    }

    &--linkedin {
      &:hover {
        fill: #0a66c2;
      }
    }

    &--twitter {
      &:hover {
        fill: #1d9bf0;
      }
    }
  }
}

.initials-xs {
  width: auto;
  height: $l-24;

  svg {
    width: 3rem;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 4;
  }
}

#f-initials {
  &:hover {
    background-color: $secondary;
    svg {
      stroke: url(#lg2);
    }
  }
}

@media only screen and (min-width: 650px) {
  .footer {
    &__copyright {
      width: $two-thirds;
    }

    &__links {
      justify-content: flex-end;

      &--contact {
        display: flex;
        justify-content: center;
        font-size: 1.2rem;
        line-height: $l-20;

        a {
          margin-right: $l-16;
        }
      }
    }

    &__squares {
      &--home {
        margin-top: 0;
      }
    }
  }
}
</style>
