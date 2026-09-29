import { PRICE } from './shop'

// Every drop shown on the home page chooser and in the menu.
// Only BELIEVE 01 has confirmed details; BELIEVE 02 is a teaser.
export const DROPS = [
  {
    n: '01',
    path: '/believe-01',
    name: 'BELIEVE 01',
    meta: '40 pieces · Black / White',
    price: PRICE,
    cta: 'Explore',
    soon: false,
  },
  {
    n: '02',
    path: '/believe-02',
    name: 'BELIEVE 02',
    meta: 'Details at the reveal',
    price: 'TBA',
    cta: 'Take a look',
    soon: true,
  },
]

// Sections on the BELIEVE 01 page (menu shortcuts).
export const SECTIONS_01 = [
  ['mark', 'The Mark'],
  ['word', 'The Word'],
  ['colorway', 'Colorway'],
  ['fit', 'The Fit'],
  ['details', 'The Drop'],
  ['lookbook', 'Lookbook'],
  ['shop', 'Shop'],
]
