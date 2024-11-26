<template>
  <div v-if="loading" :class="loadingClasses"></div>
</template>

<script>
export default {
  data: () => ({
    loading: false,
    full: false,
    timeout: null,
  }),

  computed: {
    loadingClasses() {
      return {
        'loading-bar': true,
        'loading-bar--full': this.full,
      }
    },
  },

  methods: {
    start() {
      this.loading = true
      this.timeout = setTimeout(() => {
        this.full = true
      }, 1)
    },
    finish() {
      clearTimeout(this.timeout)
      this.full = false
      setTimeout(() => {
        this.loading = false
      }, 250)
    },
  },
}
</script>

<style scoped lang="scss">
.loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100%;
  height: 0;
  background: $primary;
  background: linear-gradient(270deg, $green, $blue, $pink);
  background-size: 600% 600%;
  -webkit-animation: backgroundGradient 2.5s linear infinite;
  -moz-animation: backgroundGradient 2.5s linear infinite;
  -o-animation: backgroundGradient 2.5s linear infinite;
  animation: backgroundGradient 2.5s linear infinite;
  transition: height 0.25s linear;

  &--full {
    height: 0.7rem;
  }
}
</style>
