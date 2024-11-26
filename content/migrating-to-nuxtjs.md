---
content-type: blog-post
title: Migrating to NuxtJS for Content
description: How I learned to stop worrying, and embrace modern JavaScript frameworks and the Jamstack
status: draft
---

# Migrating to NuxtJS for Content

I've been playing around w/ [NuxtJS](https://nuxtjs.org) for a side project and found it to be so nifty that I decided to redo my 'always in mid-redo' personal website using Nuxt and the [Nuxt Content](https://content.nuxtjs.org/) module.

I had a redo in progress using a flimsy Laravel CMS I wrote along w/ a boilerplate admin section and fun new mobile-first styling using Tailwind CSS, so picking up that effort and migrating the new look and feel into Nuxt didn't take too much of an effort to switch contexts.

## How I Did It

I started with a basic Nuxt install.

Here's a fun way to get routes from the content.

```js{5-7}[nuxt.config.js]
export default {
  generate: {
    async routes () {
      const { $content } = require('@nuxt/content')
      const files = await $content({ deep: true }).only(['path']).fetch()
      return files
        .map(file => file.path === '/index' ? '/' : file.path.replace(/\/[0-9]{2}$/, ''))
        .filter(function (value, index, self) { return self.indexOf(value) === index })
    },
  },
}
```
