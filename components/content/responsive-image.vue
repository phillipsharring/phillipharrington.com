<template>
  <div :class="imageClasses">
    <picture v-if="isReady">
      <source
        v-if="square"
        media="(max-width: 224px)"
        :srcset="`${this.base}-sq@0.34x${this.extension} 224w`"
      />
      <source
        v-if="square"
        media="(max-width: 329px)"
        :srcset="`${this.base}-sq@0.50x${this.extension} 329w`"
      />
      <source
        v-if="square"
        media="(max-width: 466px)"
        :srcset="`${this.base}-sq@0.66x${this.extension} 434w`"
      />
      <source :srcset="srcSet" :sizes="sizes" />
      <img :src="srcDefault" :alt="alt" :title="alt" />
    </picture>
  </div>
</template>

<script>
export default {
  props: {
    alt: {
      type: String,
      // provide some freakin' alt text, people
      required: true,
    },
    caption: {
      type: String,
      required: false,
    },
    brdr: {
      type: Boolean,
      default: false,
    },
    side: {
      type: String,
      default: 'right',
    },
    size: {
      type: String,
      default: 'full', // full, half
    },
    square: {
      type: Boolean,
      default: false,
    },
    src: {
      type: String,
      required: true,
    },
    home: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      base: '',
      extension: '',
    }
  },

  computed: {
    isReady() {
      return this.home || (this.base !== '' && this.extension !== '')
    },

    imageClasses() {
      return {
        ri: true,
        'ri--border': this.brdr === true,
        [`ri--${this.side}`]: true,
        'ri--half': this.size === 'half',
        'ri--third': this.size === 'third',
        'ri--square': this.square === true,
        'ri--not-square': this.square !== true,
      }
    },

    srcSet() {
      return `
          ${this.srcSetExtraSmall},
          ${this.srcSetSmall},
          ${this.srcSetMedium},
          ${this.srcSetLarge},
          ${this.srcSetHuge}
        `
    },

    srcSetExtraSmall() {
      return `${this.base}@0.17x${this.extension} 224w`
    },

    srcSetSmall() {
      return `${this.base}@0.25x${this.extension} 329w`
    },

    srcSetMedium() {
      return `${this.srcDefault} 434w`
    },

    srcSetLarge() {
      return `${this.base}@0.50x${this.extension} 658w`
    },

    srcSetHuge() {
      return `${this.base}@1x${this.extension} 1316w`
    },

    srcDefault() {
      return `${this.base}@0.33x${this.extension}`
    },

    sizes() {
      return `(max-width: 256px) 224px,
        (max-width: 361px) 329px,
        (max-width: 466px) 434px,
        ${this.slotWidthLarge},
        ${this.slotWidthHuge}`
    },

    slotWidthLarge() {
      if (this.size === 'full') return '(max-width: 690px) 658px'
      if (this.size === 'half') return '(max-width: 690px) 329px'
      // third
      return '(max-width: 690px) 224px'
    },

    slotWidthHuge() {
      if (this.size === 'full') return '658px'
      if (this.size === 'half') return '329px'
      // third
      return '224px'
    },
  },

  created() {
    this.base = this.src.split('.').shift()
    this.extension = '.' + this.src.split('.').pop()
  },
}
</script>

<style lang="scss">
.ri {
  margin-bottom: 2rem;

  &--border {
    border: 0.4rem solid $blue-500;
  }

  & img {
    display: block;
  }
}

// @media only screen and (min-width: 467px) and (max-width: 649px) {
// }

@media only screen and (min-width: 467px) {
  .ri {
    flex-shrink: 0;
    width: 100%;

    &--right {
      margin-top: 0.8rem;
      float: right;
      margin-left: 2rem;
    }

    &--left {
      margin-top: 0.9rem;
      float: left;
      margin-right: 2rem;
    }

    &--half {
      width: 50%;
    }

    &--third {
      width: 33.33%;
    }
  }
}
</style>
