<template>
  <main class="main">
    <div class="main-inner content">
      <Nuxt />
    </div>
  </main>
</template>

<style lang="scss">
@import '../../assets/scss/_variables';

.main {
  flex-grow: 1;
  padding-bottom: $l-64;
  background-color: $white;
}

.main-inner {
  padding-left: $l-16;
  padding-right: $l-16;
  margin: 2.5rem auto 4.8rem;
  max-width: $l-690;
}

.content {
  color: $black;

  img {
    max-width: $full;
  }

  h1,
  h2,
  h3,
  h4 {
    font-weight: 700;
  }

  h2,
  h3,
  h4 {
    color: darken($blue-400, 5%);
  }

  h1 {
    color: darken($blue-400, 10%);
    font-family: $sans;
    font-weight: 700;
    font-size: 3.4rem;
    line-height: 5.4rem;
    // margin-top: 0;
    margin-bottom: 2.5rem;

    &:first-child {
      margin-top: 0;
    }
  }

  h2 {
    font-family: $sans;
    font-weight: 700;
    font-size: 2.8rem;
    line-height: 4.2rem;
    margin-top: 5rem;
    margin-bottom: 3.5rem;
  }

  h3 {
    font-family: $sans;
    font-weight: 700;
    font-size: 2.4rem;
    line-height: 3.6rem;
    margin-top: 4rem;
    margin-bottom: 3rem;
  }

  h4 {
    font-family: $sans;
    font-weight: 700;
    font-size: 2rem;
    line-height: 3rem;
    margin-top: 3rem;
    margin-bottom: 3rem;
  }

  p {
    font-family: $serif;
    font-weight: 400;
    font-size: 2rem;
    line-height: 4rem;
    // margin-top: 0;
    margin-bottom: 2rem;
  }

  a {
    text-decoration: underline;
    color: $green-700;
    font-weight: 400;
  }

  ul,
  ol {
    margin-bottom: $l-20;
  }

  ul li,
  ol li {
    font-size: 2rem;
    line-height: 3.3rem;
  }

  ul li {
    list-style: inside disc;
  }

  ol li {
    list-style: inside decimal;
  }

  blockquote {
    position: relative;
    border-left: 0.7rem solid desaturate($primary, 35%);
    font-family: 'Times New Roman', Times, serif;
    font-style: italic;
    padding: 0.8rem 0 0.8rem 5.8rem;
    background-color: $green-200;
    background-image: linear-gradient(to right, $green-200, $white);

    p {
      color: $gray-500;
      font-size: 2.2rem;
      line-height: 4rem;
      margin: 0;
      position: relative;
      z-index: 10;

      cite {
        display: inline-block;
        margin-top: 0.7rem;
        margin-left: 4rem;
        font-size: 1.8rem;

        &::before {
          content: '—';
          margin-right: 1rem;
        }
      }
    }

    &::before {
      content: '“';
      position: absolute;
      top: -0.7rem;
      left: -2.5rem;
      line-height: 1;
      color: $green-300;
      font-size: 17rem;
      font-family: Catamaran, serif;
      letter-spacing: 0.1rem;
      z-index: 1;
    }
  }
}

@media only screen and (min-width: 40.625em) {
  .content {
    // img {
    //   width: $full;
    // }

    p {
      font-size: 1.8rem;
      line-height: 3.7rem;
    }
  }
}
</style>
