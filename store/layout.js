export const state = () => ({
  srcLink: null,
})

export const getters = {
  srcLink: state => state.srcLink,
}

export const mutations = {
  setSrcLink: (state, srcLink) => (state.srcLink = srcLink),
}
