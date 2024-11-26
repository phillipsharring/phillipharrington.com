<template>
  <div>
    <h3 v-if="posts.length">Recent Posts</h3>
    <div v-for="post in posts" :key="post.path">
      <h4>
        <nuxt-link :to="{ name: 'slug', params: { slug: post.slug } }">{{
          post.title
        }}</nuxt-link>
      </h4>
      <p>{{ post.excerpt }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ['posts'],
}
</script>
