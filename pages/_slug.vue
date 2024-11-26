<template>
  <div>
    <template v-if="contents">
      <!--loop over the contents and display the appropriate component based on the content-type-->
      <component
        v-for="content in contents"
        :key="content.path"
        :is="content['content-type']"
        :page="content"
        :image-side="content['image-side'] || 'left'"
      />
      <!--if we want posts on this page, show them-->
      <posts-list v-if="posts" :posts="posts" />
    </template>
  </div>
</template>

<script>
// since these are used as dynamic components, Nuxt's awesome auto import doesn't catch them
import BlogPost from '../components/content/blog-post'
import FullPage from '../components/content/full-page'
import JumboTron from '../components/content/jumbo-tron'
import PageSection from '../components/content/page-section'
import PostsList from '../components/content/posts-list'
import ContentResponsiveImage from '../components/content/responsive-image'

// noinspection JSUnusedGlobalSymbols
export default {
  components: {
    BlogPost,
    FullPage,
    JumboTron,
    PageSection,
    PostsList,
    ContentResponsiveImage,
  },

  transition: 'fade-in',

  // head function puts things in the <head> tag, like title, meta, scripts, etc.
  head() {
    const head = {
      title: this.title,
      meta: [
        { name: 'description', hid: 'description', content: this.description },
      ],
    }

    return head
  },

  // nuxtjs' async stand-in for data()
  async asyncData({ $content, params, store, $config }) {
    const isIndex = params.slug ? false : true
    const slug = params.slug ?? 'index'

    // get the contents for this slug from the nuxtjs content module
    // use `let` because we make this into an array if it's not one later
    //
    // why on Earth would the contents be an array?! my paths are sometimes just
    // a page but sometimes I want to build a "page" out of a few different components,
    // like a jumbo-tron, big-image, etc.. see the ~/content directory,
    // e.g. https://gitlab.com/phillipsharring/phillipharrington.com/-/tree/main/content/work
    let contents = await $content(slug, { deep: isIndex })
      .sortBy('path')
      .fetch()
      .then((contents) => {
        // wait a quarter of a second after this loads before turning off the hamburger
        // menu in an attempt to prevent the flash of the old page before "navigating"
        // to the new page. it was bugging me, and this doesn't always fix it, but it's something
        setTimeout(() => {
          store.commit('nav/setHamburger', false)
        }, 250)

        // return the contents
        return contents
      })

    // is `contents` an array? save the result for later
    const isArray = Array.isArray(contents)

    // if `contents` isn't an array, make it into one
    contents = !isArray ? [contents] : contents

    // title & description for SEO, we guess the values these below
    let title = null
    let description = null

    // get the first title & description we can find.
    // probably in [0], but who knows?
    contents.forEach(function (content) {
      if (content?.title && !title) {
        title = content.title
      }

      if (content?.description && !description) {
        description = content.description
      }
    })

    // commit the content's "view source" link to the store so the footer can get it
    store.commit(
      'layout/setSrcLink',
      `${$config.gitlabBase}` +
        '/content' +
        (!isArray
          ? contents[0].path + contents[0].extension
          : contents[0].path.replace(/\/[0-9]{2}$/, ''))
    )

    const criteria =
      $config.env === 'prod'
        ? {
            'content-type': 'blog-post',
            status: { $ne: 'draft' },
          }
        : { 'content-type': 'blog-post' }

    // if the page specified posts, then go get them
    // posts-list: true is only set on index & blog
    const posts =
      contents[0]?.['posts-list'] || false
        ? await $content({ deep: true })
            .where(criteria)
            .only(['title', 'excerpt', 'slug'])
            .fetch()
        : []

    return {
      isIndex,
      title,
      description,
      posts,
      contents,
    }
  },
}
</script>

<style>
/* for fade in/out page transitions */
.fade-in-enter-active,
.fade-in-leave-active {
  transition: opacity 0.13s;
}
.fade-in-enter,
.fade-in-leave-active {
  opacity: 0;
}
</style>
