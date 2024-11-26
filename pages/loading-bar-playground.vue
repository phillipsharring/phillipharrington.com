<template>
  <div class="lbp">
    <h1>Loading Bar Playground</h1>
    <p>
      The Nuxt loading bar can appear and disappear so quickly on page
      transitions, and sometimes doesn't show at all, that I thought it would be
      fun (mostly for me) to have a whole page where people can turn it on and
      off and enjoy the effect. This also seems useful for testing 🤷🏼‍♂️
    </p>
    <div class="lbp__form">
      <h4>Have fun!</h4>
      <button class="lbp__button" @click="start">
        Start
      </button>
      <button class="lbp__button" @click="stop" :disabled="!running">
        Stop
      </button>
      <input
        v-model="duration"
        id="duration"
        class="lbp__input"
        type="number"
      />
      <label for="duration" class="lbp__label">Duration (in seconds)</label>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      timeout: null,
      duration: 5,
      running: false,
    }
  },

  methods: {
    start() {
      this.running = true
      this.$nuxt.$loading.start()
      setTimeout(() => {
        this.running = false
        this.$nuxt.$loading.finish()
      }, this.duration * 1000)
    },

    stop() {
      clearTimeout(this.timeout)
      this.running = false
      this.$nuxt.$loading.finish()
    },
  },
}
</script>

<style scoped lang="scss">
.lbp {
  &__form {
    & > * {
      &:not(:last-child) {
        margin-right: 2rem;
      }
    }

    & button {
      border: none;
      padding: 1.4rem 2.8rem;
      font-size: 2rem;
      cursor: pointer;
      background-color: $primary;

      &:hover {
        background-color: $green-400;
      }
    }

    & input {
      width: 10rem;
      border: 0.2rem solid $gray-400;
      padding: 1.2rem;
      font-size: 2rem;
      cursor: pointer;
    }

    & label {
      font-size: 2rem;
      color: $secondary;
    }
  }
}
</style>
