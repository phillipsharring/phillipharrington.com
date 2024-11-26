<template>
  <div class="menu">
    <nav class="menu__nav" @click.self="hideMenu">
      <ul class="menu__list">
        <li class="menu__item" v-for="link in links" :key="link.url">
          <nuxt-link
            :to="link.url"
            v-html="link.label"
            class="menu__link"
            @click.native.self="hideMenu"
          />
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  data() {
    return {
      links: [
        { url: '/about', label: 'About' },
        { url: '/blog', label: 'Blog' },
        { url: '/work', label: 'Work' },
        { url: '/music', label: 'Music' },
      ],
    }
  },

  methods: {
    hideMenu(event) {
      if (
        event.target.tagName === 'A' &&
        event.target.classList.contains('menu-link') &&
        this.$route.path !== event.target.pathname
      ) {
        return false
      }

      this.$store.commit('nav/setHamburger', false)
    },
  },
}
</script>

<style scoped lang="scss">
.menu {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  // border-top-width: 0.7rem;
  padding-top: 0.7rem;
  border-color: $primary;
  background-image: linear-gradient(to bottom, $white, $gray-50);

  &__nav {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  &__list {
    width: 100%;
  }

  &__item {
    list-style: none;
    margin: 0;
    padding: 0;

    &:first-child {
      margin-top: -6.4rem;
    }
  }

  &__link {
    font-family: $sans;
    font-weight: 400;
    display: block;
    width: $full;
    font-size: 3.6rem;
    line-height: $l-40;
    padding-top: $l-32;
    padding-bottom: 2.8rem;
    text-align: center;
    color: $secondary;
    background-image: linear-gradient(270deg, $white, $white);
    background-position: center center;
    background-size: 0 100%;
    background-repeat: no-repeat;
    transition: padding, background-size 0.2s;

    &:hover,
    &:active {
      background-image: linear-gradient(270deg, $green, $blue, $pink);
      background-position: center bottom;
      background-size: 600% 100%;
      -webkit-animation: backgroundPositionGradient 2.5s linear infinite;
      -moz-animation: backgroundPositionGradient 2.5s linear infinite;
      -o-animation: backgroundPositionGradient 2.5s linear infinite;
      animation: backgroundPositionGradient 2.5s linear infinite;
    }
  }
}

@media only screen and (min-width: 650px) {
  .menu {
    position: static;
    display: block;
    width: auto;
    background-color: transparent;
    margin-right: 1.6rem;
    background-image: none;
    border-style: solid;
    border-top-width: 0;
    min-width: 8rem;

    &__nav {
      height: auto;
      flex-direction: row;
      align-items: flex-start;

      &:first-child {
        margin-top: auto;
      }
    }

    &__list {
      width: auto;
    }

    &__item {
      display: inline-block;
    }

    &__link {
      width: auto;
      text-align: center;
      padding: 0.8rem 1.6rem;
      font-size: 1.8rem;
      line-height: 2.8rem;
      background-image: linear-gradient(270deg, $white, $white);
      background-position: center bottom;
      background-size: 0 0.2rem;
      background-repeat: no-repeat;
      transition: padding, background-size 0.2s;

      &.nuxt-link-exact-active {
        background-image: linear-gradient(270deg, $primary, $primary);
        background-size: 100% 0.2rem;
        background-position: center bottom;
        background-repeat: no-repeat;
      }

      &:active,
      &:hover {
        background-image: linear-gradient(270deg, $green, $blue, $pink, $green);
        background-position: center bottom;
        background-size: 600% 0.2rem;
        -webkit-animation: backgroundPositionGradient 2.5s linear infinite;
        -moz-animation: backgroundPositionGradient 2.5s linear infinite;
        -o-animation: backgroundPositionGradient 2.5s linear infinite;
        animation: backgroundPositionGradient 2.5s linear infinite;
      }
    }
  }
}
</style>
