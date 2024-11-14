const fs = require('fs')

const config = require( "./config");

const prefix = '/' + config.githubPrefix + '/'

const imagesrc =  prefix + '/images'

module.exports = {
  title: '',
  background: imagesrc + '/backgrounds/main.png',
  playerstate: {
    name: null,
    flags: [],
    //load all possible flags from scr  ipt and save them as flag_name: "did-something-flag,?? fr you dont wanna do this bro?
    settings: {
      textspeed: { type: 'counter', value: 90, max: 100, min: 0, step: 1, disabled: false },
      animation: { type: 'checkbox', value: true, disabled: false },
      debug: { type: 'checkbox', value: false, disabled: false },
      NSFW: { type: 'checkbox', value: false, disabled: false },
      //autoplay: { type: 'checkbox', value: false, disabled: true },
      volume: {type: 'counter',  value: -1, max: 100, min: 0, disabled: true }, //TODO: 0 is not correctly parsed
      language: {
        type: 'carousel',
        value: 'English',
        values: ['English', 'Polish'],
        disabled: false
      }
    },

    stats: {
      dismas_affectiom: 0,
      junia_affection: 0,
      reynauld_affection: 0,
      paracelsus_affection: 0,

      corrution: 0
    }
  },

  //generate lists from files
}

//geenrate from script files
