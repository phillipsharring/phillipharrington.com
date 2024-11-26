<template>
  <div class="jumbotron">
    <div :class="innerClasses">
      <content-responsive-image
        v-if="page['image']"
        :src="page['image']"
        :alt="page['alt']"
        :caption="page['caption'] || ''"
        :size="page['image-size'] || 'full'"
        :side="page['image-side'] || 'left'"
        :square="page['image-has-square'] || false"
      />
      <div class="jumbotron__content">
        <nuxt-content :document="page" />
      </div>
    </div>
  </div>
</template>

<script>
import ResponsiveImage from './responsive-image'

export default {
  components: {
    ResponsiveImage,
  },

  props: ['page', 'imageSide'],

  computed: {
    innerClasses() {
      return {
        jumbotron__inner: true,
        'jumbotron__inner--left': this.imageSide === 'left',
        'jumbotron__inner--right': this.imageSide === 'right',
      }
    },
  },
}
</script>

<style lang="scss">
.jumbotron {
  background-image: linear-gradient(to bottom, $blue-100, $white);
  margin: $n-16 $n-16 0;
  padding: $l-16 $l-16 3.2rem;

  &__inner {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}

@media only screen and (min-width: 467px) {
  .jumbotron {
    margin: $n-20;
    padding-left: $l-20;
    padding-right: $l-20;
    padding-top: $l-20;

    &__inner {
      &--left {
        flex-direction: row;
      }

      &--right {
        flex-direction: row-reverse;
      }
    }
  }

  div.jumbotron div.ri--right,
  div.jumbotron div.ri--left {
    margin-top: 0;
  }
}
</style>
