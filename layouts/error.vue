<template>
  <div>
    <h1>Page not found</h1>
    <h2><a href="/">Home page</a></h2>
  </div>
</template>

<script>
export default {
  props: ['error'],
  layout: 'error', // you can set a custom layout for the error page
}
</script>
