export const state = () => ({
  hamburgerOpen: false,
})

export const getters = {
  isHamburgerOpen: state => state.hamburgerOpen,
}

export const mutations = {
  toggleHamburger: state => (state.hamburgerOpen = !state.hamburgerOpen),

  setHamburger: (state, newState) => (state.hamburgerOpen = newState),
}
