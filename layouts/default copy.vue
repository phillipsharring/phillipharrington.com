<template>
  <div class="layout">
    <layout-page-header />
    <layout-page-content :class="hamburgerClass" />
    <layout-page-footer :class="hamburgerClass" />
    <svg width="0" height="0" id="defs">
      <defs>
        <lineargradient gradientunits="objectBoundingBox" id="lg1" x1="0">
          <stop
            class="fade-out fade-out-1"
            offset="0%"
            stop-color="#e977e5"
          ></stop>
          <stop
            class="fade-out fade-out-2"
            offset="60%"
            stop-color="#53d5c9"
          ></stop>
          <stop
            class="fade-out fade-out-3"
            offset="70%"
            stop-color="#a4e34e"
          ></stop>
        </lineargradient>
        <lineargradient gradientunits="objectBoundingBox" id="lg2" x1="0">
          <stop offset="0%" stop-color="#e977e5"></stop>
          <stop offset="60%" stop-color="#53d5c9"></stop>
          <stop offset="70%" stop-color="#a4e34e"></stop>
        </lineargradient>
      </defs>
    </svg>
  </div>
</template>

<script>
export default {
  computed: {
    hamburgerClass() {
      return { hidden: this.$store.getters['nav/isHamburgerOpen'] }
    },
  },
}
</script>

<style lang="scss">
.layout {
  background-color: $white;
  display: flex;
  flex-direction: column;
  min-height: $h-screen;

  svg#defs {
    width: 0;
    height: 0;
  }

  .fade-out {
    animation-name: phFadeAnim;
    animation-duration: 4s;
    animation-delay: 4s;
    animation-fill-mode: forwards;
    -webkit-animation-name: phFadeAnim;
    -webkit-animation-duration: 4s;
    -webkit-animation-delay: 4s;
    -webkit-animation-fill-mode: forwards;
  }

  .fade-out-1 {
    --start-color: #e977e5;
  }
  .fade-out-2 {
    --start-color: #53d5c9;
  }
  .fade-out-3 {
    --start-color: #a4e34e;
  }
}

@-webkit-keyframes phFadeAnim {
  0% {
    offset: var(--start-color);
  }
  100% {
    stop-color: #252957;
  }
}

@keyframes phFadeAnim {
  0% {
    offset: var(--start-color);
  }
  100% {
    stop-color: #252957;
  }
}
</style>
