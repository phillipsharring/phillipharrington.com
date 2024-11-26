<template>
  <div v-if="updated" class="updated">
    <p v-html="`<strong>Updated: </strong> ${updated}`" />
  </div>
</template>

<script>
export default {
  props: ['updated'],
}
</script>

<style scoped lang="scss">
.updated {
  font-family: $serif;
  font-style: italic;
}
</style>
