/*
 *  const cheat sheet:
 *
 *  GAME.CHAPTERS: {gameName, chapters: []}
 *  GAME.PLAYERSTATE: {name, flags, reputation: {}}
 *
 */

//presistent settigns for the game
const CONFIG = {
  debug: true,
  disableDebug: () => {
    CONFIG.debug = false
    console.clear()
  },
  amount_save_slots: 8
}

const CURRENT = {
  chapter: GAME.CHAPTERS[0], //positioning live
  currentChapter: null,
  scene: null,
  dialogue: 0, //which dialogues[n] index scene is at

  openModal: null, //which modal is open
  popup: false,
  //space advances
  spaceHandler: {
    callbacks: new Map(),
    cooldown: 0.15 * 1000, //in ms
    last_space: Date.now() //when last space was clicked
  },

  //saveslot names
  saveHandles: {
    saves: [],
    saveSlot: null
  }

  ,
  lastChoiceText: null
}

//html targets -------------
const HTML = {
  all_modals: [],

  textbox: document.createElement('div'),
  textboxSprite: document.createElement('div'),
  nametag: document.createElement('div'), //inside the talk-panel
  text: document.createElement('p'), //inside the talk-panel
  menu: {
    panel: document.createElement('div'),
    start: document.createElement('button'),
    save: document.createElement('button'),
    load: document.createElement('button'),
    back: document.createElement('button'),
    log: document.createElement('button'),
    settings: document.createElement('button')
  }, //inside the talk-panel
  nextbutton: document.createElement('button'), //inside the talk-panel
  optionsbutton: document.createElement('button'), //inside the talk-panel
  inputpanel: document.createElement('div'),
  inputbox: document.createElement('input'), // inside inputpanel input element
  confirminputbutton: document.createElement('button'), // inside inputpanel
  randominputbutton: document.createElement('button'), // inside inputpanel
  choices: document.createElement('div'),
  characters: document.createElement('div'),

  background: document.createElement('div'), // background IMAGE in div
  overlay: document.createElement('div'),
  log: {
    modal: document.createElement('div'), // container modal for log
    logarea: document.createElement('div')
  },
  saves: {
    modal: document.createElement('div'), //saves panel for loading/saving
    slots: document.createElement('div') //container holding the divs for slots directly
  },
  settings: {
    modal: document.createElement('div'), //settings panel for loading/saving
    values: {
      /* runtime generated from GAME.PLAYERSTATE
      textspeed: document.createElement('span'),
      animation: document.createElement('span'),
      colorblind: document.createElement('span'),
      debug: document.createElement('span'),
      autoplay: document.createElement('span'),
      volume: document.createElement('span')
      */
    }
  },

  popup: {
    modal: document.createElement('div'),
    text: document.createElement('p'),
    okbutton: document.createElement('button'),
    cancelbutton: document.createElement('button')
  }
}

// INIT----------------------------------



//initializes game start
function init() {

  preloadImages()

  HTML.all_modals = document.querySelectorAll('.modal')

  HTML.nametag = document.getElementById('nametag')
  HTML.textbox = document.getElementById('talk-panel')
  HTML.textboxSprite = HTML.textbox?.querySelector('.talkbox')
  HTML.characters = document.getElementById('sprite-panel')
  HTML.choices = document.getElementById('choice-panel')
  HTML.text = document.getElementById('line')
  //menu
  HTML.menu.panel = document.getElementById('game-menu')
  HTML.menu.start = document.getElementById('start-menu-item')
  HTML.menu.save = document.getElementById('save-menu-item')
  HTML.menu.load = document.getElementById('load-menu-item')
  HTML.menu.back = document.getElementById('back-menu-item')
  HTML.menu.log = document.getElementById('log-menu-item')
  HTML.menu.settings = document.getElementById('settings-menu-item')

  HTML.nextbutton = document.getElementById('next-line-button')
  //HTML.optionsbutton = document.getElementById('options-button')
  HTML.inputpanel = document.getElementById('input-textbox-panel')
  HTML.inputbox = document.getElementById('talkbox-text-input')
  HTML.confirminputbutton = document.getElementById('confirm-textinput-button')

  HTML.randominputbutton = document.getElementById('random-textinput-button')

  HTML.background = document.getElementById('background-panel')

  HTML.overlay = document.getElementById('overlay')
  HTML.saves.modal = document.getElementById('saves-panel')
  HTML.saves.slots = document.getElementById('saves-container')

  HTML.log.modal = document.getElementById('log-panel')
  HTML.log.logarea = document.getElementById('log-container')

  HTML.settings.modal = document.getElementById('settings-panel')

  let possible_settings = Object.keys(GAME.PLAYERSTATE_DEFAULTS.settings)

  possible_settings.forEach(setting => {
    let settingElement = document.getElementById('setting-' + setting)
    HTML.settings.values[setting] = settingElement
  })

  HTML.popup.modal = document.getElementById('popup')
  HTML.popup.text = HTML.popup.modal.querySelector('p')
  HTML.popup.okbutton = document.getElementById('popup-ok')
  HTML.popup.cancelbutton = document.getElementById('popup-cancel')

  window.typewriter = new Typewriter('line')

  CURRENT.chapter = GAME.CHAPTERS[0]
  CURRENT.currentChapter = null
  CURRENT.scene = null
  CURRENT.dialogue = 0
  GAME.PLAYERSTATE = structuredClone(GAME.PLAYERSTATE_DEFAULTS)
  GAME.PLAYERSTATE.settings = Object.keys(GAME.PLAYERSTATE.settings).reduce((acc, key) => {
    acc[key] = GAME.PLAYERSTATE.settings[key].value;
    return acc;
  }, {});


  hideAll()
  HTML.menu.start.children.item(0).innerHTML = 'Start'

  spaceUnbindAll()

  loadSettings(true)

  loadMainMenu()

  loadModals()

  loadSideMenu()

  loadSaves()


  if (!getCookie('firstTimeOpen')) {
    openPopup("<br><br>Hi! This is a demo for a self-made Darkest dungeon Dating sim. There are a LOT of placeholder Assets here, some AI made, some borrowed from Darkest Dungeon itself. In the [finished] version, everything will be drawn by hand.",
      () => {

      }
    )

    setCookie('firstTimeOpen', 'yes')

  }

}

function preloadImages() {
  let spinner = document.getElementById('spinner')

  show(HTML.overlay, spinner)

  imageArray = GAME_CONFIG.images
  let images = [];
  for (let i = 0; i < imageArray.length; i++) {
    images[i] = new Image();
    images[i].src = imageArray[i];
    //console.log(imageArray[i])
  }

  hide(HTML.overlay, spinner)
}

function initChapter(chapter = CURRENT.chapter) {
  HTML.text.removeAttribute('style');

  showTitle(chapter.title)

  //next button starts chapter
  registerButtonClick(function () {
    if (isHidden(HTML.overlay)) {
      start(chapter.start)
    }
  })

  //space advances chapter also
  spaceAdvances('init', function () {
    start(chapter.start)
    spaceUnbind('init')
  })
}

function loadMainMenu() {

  display(HTML.inputpanel, 'none')
  changeBackground(HTML.background, GAME.MAINMENU_BG)
  setTextbox('A DD1 Dating Sim')

  HTML.text.style.alignSelf = "center"

  clear(HTML.characters)

  const title = document.createElement('h2')
  title.classList.add('main-title')
  title.innerHTML = GAME.GAMETITLE

  HTML.characters.appendChild(title)
  show(HTML.characters, HTML.textbox, HTML.menu.panel)
}

//INITIAL LOAD of start/save/load
function loadSideMenu() {
  enableMenu(true)

  // disableButton(HTML.menu.save) //cant save in main menu

  //when start clicked
  registerButtonClick(() => {
    initChapter(CURRENT.chapter)

    //start restarts journey from now on
    registerButtonClick(() => {
      if (!isDisabled(HTML.menu.load) && isHidden(HTML.overlay)) {
        show(HTML.overlay)
        openPopup("Are you sure you want to restart? [You'll lose unsaved changes!]", () => {
          init()
        })
      }
    }, HTML.menu.start)
  }, HTML.menu.start)

  registerButtonClick(() => {
    if (!isDisabled(HTML.menu.load) && isHidden(HTML.overlay)) {
      openModal(HTML.saves.modal)
      HTML.saves.modal.setAttribute('data-mode', 'load')
    }
  }, HTML.menu.load)

  registerButtonClick(() => {
    if (!isDisabled(HTML.menu.save) && isHidden(HTML.overlay)) {
      openModal(HTML.saves.modal)
      HTML.saves.modal.setAttribute('data-mode', 'save')
    }
  }, HTML.menu.save)

  registerButtonClick(() => {
    if (!isDisabled(HTML.menu.settings) && isHidden(HTML.overlay)) {
      openModal(HTML.settings.modal)
    }
  }, HTML.menu.settings)

  registerButtonClick(() => {
    if (!isDisabled(HTML.menu.log) && isHidden(HTML.overlay)) {
      openModal(HTML.log.modal)
    }
  }, HTML.menu.log)
}

function loadModals() {
  hide(...HTML.all_modals)

  HTML.log.logarea.innerHTML = '' //empty out log

  //all buttons can close from the start
  document.querySelectorAll('.close-modal-button').forEach(button => {
    registerButtonClick(() => {
      closeModal(CURRENT.openModal)
    }, button)
  })
}

function loadSaves() {
  log('Start Loading Game Saves!')
  //1. clear displayed saves
  clear(HTML.saves.slots)

  SaveManager.loadAllStates()
    .then(allGameStates => {
      if (allGameStates) {
        //2. find all current Saves from IndexDB
        const template = document.querySelector('#templatesave')

        //for all 8 slots
        for (let i = 0; i < CONFIG.amount_save_slots; i++) {
          let save = allGameStates.find(save => save.id == i + '')
          const clone = template.content.cloneNode(true)

          if (save) {
            log(
              save.version + ' < save version  | game version > ' + GAME.GAME_VERSION
            )
            //3. display all filled saves
            let save_wrapper = clone.querySelector('.save-wrapper')
            save_wrapper.setAttribute('data-save', 'filled')
            save_wrapper.setAttribute('data-slot', i)

            const input = save_wrapper.querySelector('input')
            input.id = 'input-' + i
            input.value = save.name

            const info = save_wrapper.querySelector(
              '.save-info-container'
            )
            const infos = info.querySelectorAll('p')
            infos[0].innerText = save.playerState.name
            infos[1].innerText = 'Chapter ' + (save.coordinates.chapter_id + 1)
            infos[2].innerText = save.lastSaved.toLocaleString()

            const deletebtn = save_wrapper.querySelector('.delete-save-button')

            registerButtonClick(event => {
              openPopup('Delete Save? [CANNOT be undone!]', () => {
                unselectSave(save_wrapper)
                deleteState(i + '') //string
              })

              event.stopPropagation() //dont bubble up
            }, deletebtn)

            HTML.saves.slots.appendChild(save_wrapper)
          }
          //if save does not exist
          else {
            let save_wrapper = clone.querySelector('.save-wrapper')
            save_wrapper.setAttribute('data-slot', i)

            HTML.saves.slots.appendChild(clone)
          }
        }
        //allow for loading/saving... depending on which mode youre in
        $('.save-wrapper').on('click', event => {
          const cause = event.currentTarget

          switch (HTML.saves.modal.getAttribute('data-mode')) {
            case 'save':
              handleSave(cause)
              break
            case 'load':
              handleLoad(cause)
              break

            default:
              log('not known mode')
              break
          }
        })
      }
    })
    .catch(error => {
      error('Failed to load all game states', error)
    })

  /*
    const gameState = {
    name: 'some name',
    id: 'save-' + saveSlot,
    playerState: GAME.PLAYERSTATE,
    coordinates: {
    chapter_id: chapter,
    scene_id: scene,
    dialogue_index: dialogue
    },
    lastSaved: new Date()
  }
   */
  //user clicked on save in save mode
  function handleSave(cause) {
    const input = cause.querySelector('input')
    const deletebtn = cause.querySelector('.delete-save-button')
    const confirmbtn = cause.querySelector('.confirm-save-button')

    //1. make save selected
    selectSave(cause)

    //2. when input typed in clicked, validate
    registerInputs(input, () => {
      validateInput(input.value.trim(), confirmbtn)
    })

    //3. clicking on a filled save has less steps //???? bro what does this mean
    if (cause.getAttribute('data-save') == 'empty') {
      //put user in typing, only allow valid filenames
      input.focus()
      validateInput(input.value.trim(), confirmbtn)

      //saving when confirm clicked
      registerButtonClick(() => {
        if (!isDisabled(confirmbtn)) {
          saveNewState(input.value, cause.getAttribute('data-slot'))
        }
      }, confirmbtn)

      //when close clicked -> make inactive
      registerButtonClick(event => {
        unselectSave(cause)

        //click stays in button\
        event.stopPropagation()
      }, deletebtn)

      //data-save='filled'===========
    } else {
      //3.5. ish, remove the lock
      $('.save-wrapper').removeClass('inactive')
      //4.? confirm button shows popup before overriding save
      //saving when confirm clicked
      registerButtonClick(() => {
        if (!isDisabled(confirmbtn)) {
          openPopup('Overwrite previous Save? [Cannot be Undone]', () => {
            saveNewState(input.value, cause.getAttribute('data-slot'))
            unselectSave(cause) //order matters, empty the input AFTER extracting the text
          })
        }
      }, confirmbtn)

      //5. save deletion to filled slots assigned in the loadSaves() method
    }
  }

  function handleLoad(target) {
    openPopup("Load this Save? You're gonna lose unsaved progress!", () => {
      let id = target.getAttribute('data-slot')
      loadState(id)
      closeModal(HTML.saves.modal)
    })
  }

  //-----util
  function selectSave(cause) {
    $('.save-wrapper').addClass('inactive')
    $('.save-wrapper').removeClass('active')
    cause.classList.remove('inactive')
    cause.classList.add('active')
  }
  function unselectSave(cause) {
    $('.save-wrapper').removeClass('inactive') //remove inactive from all
    cause.classList.remove('active') //remove active from current

    cause.querySelector('input').value = ''
  }

  function validateInput(value, confirmbtn) {
    if (!value) {
      confirmbtn.classList.add('disabled')
      confirmbtn.title = 'Savename must be at least one character long!'
    } else {
      confirmbtn.classList.remove('disabled')
      confirmbtn.title = ''
    }
  }
}

//assuming user and html have same settings, html taler prio ofc
function loadSettings(reload = false) {
  //usable anywhere, so this is necessary in case Player Settings have to be loaded in
  //reload eboots all setting settings (overwriting local!)
  if (reload) {
    Object.keys(GAME.PLAYERSTATE_DEFAULTS.settings).forEach((setting) => {
      let UISetting = HTML.settings.values[setting.trim()];
      let parent = UISetting?.closest(".settings-row");

      let defaultSetting = GAME.PLAYERSTATE_DEFAULTS.settings[setting]; //"immutable"
      let playerSetting = GAME.PLAYERSTATE.settings[setting]; //direct value since thats the only thing the player needs to know

      let type = defaultSetting.type

      let value = type == 'checkbox' ? (playerSetting || false) : (playerSetting || defaultSetting || false)

      let disabled = defaultSetting.disabled;



      if (!UISetting) {
        warn("no UI element exists for setting name: " + setting);
      } else {
        if (!value && type != "checkbox") {
          warn("no default value for setting: " + setting);
        }
        settingsSetUI(UISetting, value, type); //set the html element checkbox/spinner display

        //disable based on default options
        if (disabled) parent.classList.add("disabled");
        else parent.classList.remove("disabled");

        if (type == 'counter') {
          settingsValidateCounter(parent)
        }
      }
    });
  }

  //load the buttons functionality:
  $('button.settings-icon').off('click')

  $('button.settings-icon.settings-checkbox').on('click', settingClicked)

  //----- holding down on carousels
  let timerId = 0;
  let initialInterval = 200;
  let minInterval = 50;
  let intervalDecrement = 10; // aspeedup rate

  $('button.settings-icon:not(.settings-checkbox)').on('mousedown', function (event) {
    let currentInterval = initialInterval;

    function startIncrement() {
      settingClicked(event); //always click once
      currentInterval = Math.max(currentInterval - intervalDecrement, minInterval);
      timerId = setTimeout(startIncrement, currentInterval);
    }

    startIncrement();
  }).on('mouseup mouseleave', function () {
    //when user leaves button/stops holding remove interval
    clearTimeout(timerId);
  });

}

//shows a "title" card for a given title
function showTitle(title) {
  hide(
    HTML.characters,
    HTML.choices,
    HTML.nametag,
    HTML.overlay,
    HTML.optionsbutton
  )

  CURRENT.scene = null
  CURRENT.dialogue = null
  //chapter can be initialized

  show(HTML.textbox, HTML.nextbutton, HTML.background, HTML.menu.panel)
  display(HTML.inputpanel, 'none')

  changeBackground(HTML.background) //turn bg to black

  disableMenu()

  setTextbox(title)
}

//starts a scene with a given id at an optional dialogue point
function start(scene_id, dialogue = null) {
  log('starting scene: ' + scene_id)

  HTML.menu.start.children.item(0).innerHTML = 'Restart'
  allowCloseWindow(false) //cant close window without saving

  registerButtonClick(false)
  spaceUnbindAll()

  CURRENT.scene = scene_id
  CURRENT.dialogue = dialogue ? dialogue : 0

  const scn = currentScene()

  changeBackground(HTML.background, scn.background)

  const current = scn.dialogues[CURRENT.dialogue]
  loadDialogue(current)

  //continue here
}

//--------------------------- RENDERING DIALOGUE

function loadDialogue(dialogue) {
  log('Loading dialogues[' + dialogue + '] in scene id: ' + CURRENT.scene)

  show(HTML.nextbutton, HTML.optionsbutton, HTML.menu.panel, HTML.textbox)
  enableMenu(true) //enable menu based on what the player can cant do

  if (dialogueValid(dialogue.conditions)) {
    loadDialogueBackground(dialogue.background)

    loadDialogueCharacters(dialogue.characters, dialogue.speaking)

    loadDialogueSetsFlags(dialogue.flags)

    loadDialogueText(dialogue)

    loadDialogueChoices(dialogue.choices) //blocking

    loadInput(dialogue.input) //blocking

    handleDialogueGoto(dialogue.goto) //not blocking but defining

    handleSpaceBehavior(dialogue)

  } else {
    nextDialogue() //load next dialogue next
  }
}

function handleSpaceBehavior(dialogue) {
  //awaiting user input
  if (dialogue.input || dialogue.choices) {
    spaceUnbindAll()
  } else {
    //1. if space pressed and text is being typewritten

    spaceAdvances('next_diag', function () {
      //if text is displaying

      if (window.typewriter.currentTimeout) {
        window.typewriter.stop() //1. stop drawing the box

        setTextbox(dialogue.text, 0) //2. set textbox immediately to whats requested
      } else {
        //text is not being displayed anymore
        if (dialogue.goto) {
          nextScene(dialogue.goto)
        } else {
          nextDialogue() //default state -> space goes to next dialogue
        }

        //spaceUnbindAll();
      }
    })
  }
}

function dialogueValid(conditions) {
  if (!conditions) {
    return true
  }

  return validatePlayerDataAll(...conditions)
}

function loadDialogueCharacters(characters, speaking) {
  setNametag(speaking)
  show(HTML.nametag, HTML.characters, HTML.background)

  hide(HTML.overlay)

  clear(HTML.characters)

  if (!characters) {
    return
  }

  characters.forEach(char => {
    let sprite = char.sprite
    let cName = char.name

    let character = document.createElement('div')
    character.classList.add('sprite')
    if (cName === speaking) {
      character.classList.add('talking')
      if (getPlayerSetting('animation')) {

        character.classList.add('animated-sprite')
      }
    }

    changeBackground(character, sprite)

    HTML.characters.appendChild(character)

    //optional animation of appearance:

  })
}


function loadDialogueSetsFlags(flags) {

  if (flags) {
    log("dialogue flags:", ...flags)
    setPlayerdataFlags(flags)

  }
  else {
    log("dialogue sets no flags!")
  }
}

function loadDialogueBackground(background) {
  if (background) {
    changeBackground(HTML.background, background)
  } else {
    log('dialogue has no background!')

    const scn = currentScene() //use scene background
    changeBackground(HTML.background, scn.background)
  }
}

function loadDialogueText(dialogue) {
  let text = dialogue.text;
  let speaker = dialogue.speaking;
  show(HTML.menu.panel);
  show(HTML.nametag);
  show(HTML.textbox);

  //textbox look if character speaking and has sprites
  if (speaker != "Narrator" && speaker != "Player") {
    let character = dialogue.characters.find((char) => char.name == speaker);

    //no sprites means normal talkbox
    if (!character?.sprite)
      HTML.textboxSprite.classList.remove("leftspeaker", "rightspeaker");
    else {
      //display correct box
      let characterIndex = dialogue.characters.findIndex(
        (char) => char.name == speaker
      );
      let allchars = Math.floor(dialogue.characters.length / 2);
      if (characterIndex < allchars) {
        HTML.textboxSprite.classList.add("leftspeaker");
        HTML.textboxSprite.classList.remove("rightspeaker");
      } else {
        HTML.textboxSprite.classList.add("rightspeaker");
        HTML.textboxSprite.classList.remove("leftspeaker");
      }
    }
  } else {
    HTML.textboxSprite.classList.remove("leftspeaker", "rightspeaker");
  }

  if (speaker == "Narrator") {
    HTML.text.classList.add("narrator-font")
  }
  else {
    HTML.text.classList.remove("narrator-font")
  }

  let userSpeed =
    getPlayerSetting("textspeed") == 100
      ? 0
      : 100 - getPlayerSetting("textspeed");

  let delay = dialogue.choices ? 0 : userSpeed;

  setTextbox(text, delay);
}

function loadDialogueChoices(choices) {
  clear(HTML.choices) //remove all choice buttons

  if (choices) {
    removeTalkingSprites()

    show(HTML.overlay, HTML.choices)

    hide(HTML.nextbutton)

    choices.forEach(choice => {
      let btn = document.createElement('button')

      btn.classList.add('choice-button', 'panel', 'enabled')
      btn.id = 'button-choice-' + choice.id
      btn.innerHTML = choice.text

      //write log about playes choice on click
      registerClicks(btn, () => {
        writeLog('Player chose: ', choice.text, false)
      })

      choiceSetsFlags(choice, btn)
      choiceRedirects(choice, btn)

      HTML.choices.appendChild(btn)
    })
  } else {
    log('dialogue has no choices!')

    hide(HTML.overlay, HTML.choices)
    show(HTML.nextbutton)
  }
}

function loadInput(dialogueInput) {
  // TODO: name based easter eggs?
  const names = [
    '[Milo]',
    'AM',
    'Zoosmell',
    'Dick Mullen',
    'Fellow Traveler',
    'Heir',
    'Ebony Way',
    '24601',
    'Paul Allen',
    'Beetlejuice',
    'K/Clara',
    "Run failed"
  ]

  //user is supposed to input
  if (dialogueInput) {
    hide(HTML.nextbutton) //can only go next after inputting
    display(HTML.inputpanel, 'flex')
    show(HTML.inputpanel)
    HTML.inputbox.value = ''

    spaceUnbindAll() //no spacing around when typing

    validateInput() //cached textboxes

    //register clicking on ok done writing
    registerButtonClick(() => {
      if (validateInput()) {
        setPlayerDataAtrribute_raw(dialogueInput, HTML.inputbox.value)
        display(HTML.inputpanel, 'none')

        removeInputEvents(HTML.inputbox)

        nextDialogue()
      }
    }, HTML.confirminputbutton)

    //random button click
    registerButtonClick(() => {
      HTML.inputbox.value = names[Math.floor(Math.random() * names.length)]
      HTML.inputbox.focus()
      validateInput()
    }, HTML.randominputbutton)

    //validate and unblock the next button
    registerInputs(HTML.inputbox, validateInput)

    HTML.inputbox.focus() //start user on in writing
  } else {
    hide(HTML.inputpanel)
    log('dialogue has no input values!')
  }
}

//for names only
function validateInput() {
  const restrictednames = [
    'dismas',
    'reynauld',
    'junia',
    'paracelsus',
    'boudica',
    'audrey',
    'willam',
    'tardif',
    'amani',
    'barristan',
    'damian',
    'missandei',
    'margaret',
    'sahar',
    'sarmenti',
    'baldwin',
    'josephine',
    'bigby',
    'alhazred'
  ]

  const input = HTML.inputbox.value.toLowerCase().trim()

  if (!input) {
    setTooltip(
      HTML.confirminputbutton,
      'Gotta have something to call you, chief'
    )
    disableButton(HTML.confirminputbutton)
    return false
  } else if (restrictednames.includes(input)) {
    setTooltip(
      HTML.confirminputbutton,
      'Hey, ' + input + ' is *my* name!  -' + input.toUpperCase()[0]
    )
    disableButton(HTML.confirminputbutton)
    return false
  } else {
    setTooltip(HTML.confirminputbutton, '')

    enableButton(HTML.confirminputbutton)
    return true
  }
}

function handleDialogueGoto(scene_id) {
  if (scene_id) {
    hide(HTML.choices)
    show(HTML.nextbutton)
    registerButtonClick(function () {
      nextScene(scene_id)
    })
  } else {
    log('dialogue has no goto; goto is next dialogue!')
    registerButtonClick(function () {
      nextDialogue()
    })
  }
}

function choiceSetsFlags(choice, button) {
  if (choice.flags) {
    log('setting flags on choice ' + choice.id)

    registerClicks(button, function () {
      setPlayerdataFlags(...choice.flags)
    })
  } else {
    log('choice ' + choice.id + ' has no Flags!')
  }
}

function choiceRedirects(choice, button) {
  if (choice.goto) {
    log('setting goto on choice ' + choice.id)

    registerClicks(button, function () {
      nextScene(choice.goto)
    })
  } else {
    log('choice ' + choice.id + ' has no goto; goto is next dialogue.')
    registerClicks(button, function () {
      nextDialogue()
    })
  }
}

// LOG writing ===================================================

function writeLog
  (actionText, descriptionText, dialogue = true) {
  let line = document.createElement('div')
  line.classList.add('log-entry')
  if (!dialogue) line.classList.add('log-entry-action')

  let action = dialogue ? document.createElement('b') : document.createElement('span')
  let description = document.createElement('span')

  line.append(action, description)

  action.innerText = highlight(actionText)
  description.innerHTML = highlight(descriptionText).replaceAll('_name', GAME.PLAYERSTATE.name)

  HTML.log.logarea.appendChild(line)
}

// STORY FLOW-------------- -----------------=======================

function nextScene(scene_id = null) {
  spaceUnbindAll() //unbind all - will be rebound if necessary
  if (scene_id) {
    if (scene_id == 'end') {
      endChapter()
    } else {
      start(scene_id)
    }
  } else {
    throw new Error(scene_id + ' is not a valid id!')
  }
}

function nextDialogue() {
  spaceUnbindAll() //will be rebound if next dialogue needs it
  const scene = currentScene()

  let dialogue = scene.dialogues[CURRENT.dialogue]
  if (dialogueValid(dialogue.conditions) && !dialogue.choices) writeLog(dialogue.speaking + ': ', dialogue.text)


  if (scene.dialogues.length > CURRENT.dialogue + 1) {
    CURRENT.dialogue += 1

    loadDialogue(scene.dialogues[CURRENT.dialogue])
  } else if (scene.dialogues[CURRENT.dialogue].goto) {
    nextScene(scene.dialogues[CURRENT.dialogue].goto)
  } else {
    throw new Error('cant go to next!')
  }
}

function endChapter() {
  hideAll()
  //next chapter available
  if (GAME.CHAPTERS[CURRENT.currentChapter + 1]) {
    CURRENT.currentChapter++
    CURRENT.chapter = GAME.CHAPTERS[CURRENT.currentChapter]
    CURRENT.scene = GAME.CHAPTERS[CURRENT.currentChapter].scenes[0].id
    CURRENT.dialogue = 0

    initChapter()
  } else {
    show(HTML.textbox)
    show(HTML.menu.panel)
    setTextbox('The End <3', 0)
  }
}

//INTERACTION AND BUTTONS ------------------------------------------

function setTooltip(element, text) {
  element.title = text
}

//one action per button | button: DOMElement
function registerButtonClick(callback, button = HTML.nextbutton) {
  log('setting what <' + button.id + '> does')

  removeClicks(button)

  //function present => new function for nextbutton
  if (callback) {
    //button doesnt get focus

    if (button.tabIndex == '-1') {
      button.addEventListener('mousedown', function (event) {
        event.preventDefault() // Prevents the button from gaining focus
      })
    }
    registerClicks(button, callback)
  } else {
    log('<' + button.id + '> does nothing!')
  }
}

// adds all callbacks
function registerClicks(element, ...callbacks) {
  const e = $(element)

  let functions = 0
  callbacks.forEach(callback => {
    let new_callback = event => {
      if (isDisabled(element) || isHidden(element)) {
        log('<' + element.id + '> is disabled!')
        return
      }
      callback(event)
    }
    e.on('click', new_callback)
    functions++
  })

  log(
    'new functions (' +
    functions +
    ') registered to element id: ' +
    element.id +
    ' on click!'
  )
}

function registerInputs(element, ...callbacks) {
  const e = $(element)
  let functions = 0
  callbacks.forEach(callback => {
    e.on('input', callback)
    functions++
  })

  log(
    'new functions (' +
    functions +
    ') registered to element id: ' +
    element.id +
    ' on input!'
  )
}

//space advances dialogue

function spaceAdvances(callback_id, callback, keycode = 32) {
  log('defining keypress bahavior for code: ' + callback_id)

  if (keycode == 32) log('setting space behavior')
  if (keycode == 27) log('setting escape behavior')

  const wrappedCallback = event => {
    //compat, 229 special code for "IMO" processing
    if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) {
      return
    }

    //clicked correct key
    if (event.keyCode === keycode) {
      //if space stagger
      if (
        Date.now() - CURRENT.spaceHandler.last_space >
        CURRENT.spaceHandler.cooldown &&
        keycode == 32 && !CURRENT.popup
      ) {
        log('space advancing from function: ' + callback_id)

        CURRENT.spaceHandler.last_space = Date.now() //space clicked

        callback()
        return
      }

      //escape
      if (event.keyCode == 27) {
        callback()
        return
      }
    }
  }

  if (CURRENT.spaceHandler.callbacks.get(callback_id)) {
    log(
      'Overwriting ' +
      callback_id +
      ' with new but not necessarily different function'
    )
  }

  CURRENT.spaceHandler.callbacks.set(callback_id, wrappedCallback)

  // Register the wrapped callback as an event listener for 'keydown'
  document.addEventListener('keydown', wrappedCallback)
}

function spaceUnbind(key) {
  // Retrieve the wrapped callback using the key
  const callback = CURRENT.spaceHandler.callbacks.get(key)
  if (callback) {
    // Remove the event listener
    document.removeEventListener('keydown', callback)
    // Remove the entry from the map
    CURRENT.spaceHandler.callbacks.delete(key)
  }
}

function spaceUnbindAll() {
  // Iterate through all callbacks in the map
  CURRENT.spaceHandler.callbacks.forEach((callback, key) => {
    document.removeEventListener('keydown', callback)
    if (key.includes('space')) log('unbinding Space behavior: ' + key)
    CURRENT.spaceHandler.callbacks.set(key, null)
  })
  // Clear the map after removing all listeners
  // CURRENT.spaceHandler.callbacks.clear()
}

//removes all click listeenrs
function removeClicks(element) {
  const e = $(element)

  e.off('click')

  log('clicks unregistered from ' + element.id)
}
function removeInputEvents(element) {
  const e = $(element)

  e.off('input')

  log('inputs unregistered from ' + element.id)
}

// ====================================================setting user data -----------------

function setPlayerdataFlags(...flags) {

  log('Setting Flags on user! [' + flags.join(', ') + ']')

  flags.forEach(flag => {
    if (flag.includes('!')) {
      flag = flag.replace('!', '')
      GAME.PLAYERSTATE.flags = GAME.PLAYERSTATE.flags.filter(e => {
        return e != flag
      });
    }
    else {
      if (!GAME.PLAYERSTATE.flags.includes(flag)) {
        GAME.PLAYERSTATE.flags.push(flag)
      }
    }
  })
}

//all flags must be true
function validatePlayerDataAll(...flags) {
  let hasFlags = true
  flags.forEach(flag => {
    //1. distinction is flag should NOT be present: ['!flagName']
    if (flag.includes('!')) {
      flag = flag.replace('!', '')

      if (GAME.PLAYERSTATE.flags.includes(flag)) {
        hasFlags = false
      }

    }
    //2. ['flagName']
    else {
      if (!GAME.PLAYERSTATE.flags.includes(flag)) {
        hasFlags = false
      }
    }
  })

  return hasFlags
}

//=== more serious functions

function setPlayerDataSetting(setting, value) {
  setting = setting.trim()

  GAME.PLAYERSTATE.settings[setting] = value
}

function getPlayerDataSetting(setting) {
  let possibleSetting = GAME.PLAYERSTATE.settings[setting]
  if (possibleSetting == null) throw Error('get what setting?: ' + setting)

  return GAME.PLAYERSTATE.settings[setting]
}

//ONLY to be used with inputbox
function setPlayerDataAtrribute_raw(attr, value) {
  log('changing user state!')
  if (GAME.PLAYERSTATE[attr]) {
    log('overwriting existing value: ' + GAME.PLAYERSTATE[attr] + ' to: ' + value)
  } else {
    log('new player attribute: ' + GAME.PLAYERSTATE[attr])
  }

  GAME.PLAYERSTATE[attr] = value
}

//==========================================SAVING LOADING -----------------------------

function saveNewState(filename = '', saveSlot = -1) {
  log(`Saving game to slot: ${saveSlot}`)
  //showSaveIcon()

  const gameState = {
    name: filename,
    id: saveSlot,
    playerState: GAME.PLAYERSTATE,
    coordinates: {
      chapter_id: CURRENT.chapter.id,
      scene_id: CURRENT.scene,
      dialogue_index: CURRENT.dialogue
    },
    log: HTML.log.logarea.innerHTML,
    lastSaved: new Date(),
    version: GAME.GAME_VERSION
  }

  SaveManager.saveGameState(gameState)
    .then(() => log('Game state saved successfully'))
    .catch(error => { error('Failed to save game state', error) })

  loadSaves()
}

function updateState(id) {
  SaveManager.loadGameState(id).then(gameState => {
    if (!gameState) {
      log('Game state not found!')
      return
    }

    // Modify the game state as needed
    gameState.coordinates = {
      chapter_id: CURRENT.chapter.id,
      scene_id: CURRENT.scene,
      dialogue_index: CURRENT.dialogue
    }
    gameState.playerState = GAME.PLAYERSTATE
    gameState.log = HTML.log.logarea.innerHTML
    gameState.lastSaved = new Date() // Update the timestamp or any other property
    gameState.version = GAME.GAME_VERSION

    // Save (update) the game state
    SaveManager.saveGameState(gameState)
      .then(() => log('Game state updated successfully'))
      .catch(error => error('Failed to update game state', error))
  })

  loadSaves()
}

function loadState(id) {
  SaveManager.loadGameState(id)
    .then(state => {
      CURRENT.dialogue = state.coordinates.dialogue_index
      CURRENT.scene = state.coordinates.scene_id

      CURRENT.chapter = GAME.CHAPTERS.find(
        c => c.id == state.coordinates.chapter_id
      )
      CURRENT.currentChapter = GAME.CHAPTERS.findIndex(
        c => c.id == state.coordinates.chapter_id
      )

      GAME.PLAYERSTATE = state.playerState

      HTML.log.logarea.innerHTML = state.log

      //log(state)
      registerButtonClick(false, HTML.nextbutton)
      registerButtonClick(false, HTML.randominputbutton)
      registerButtonClick(false, HTML.confirminputbutton)
      spaceUnbindAll()

      loadSettings(true)

      start(CURRENT.scene, CURRENT.dialogue)
    })
    .catch(error => error('Failed to load game state', error))
}

function deleteState(id) {
  SaveManager.deleteGameState(id)
    .then(value => {
      log('reloading states')
      loadSaves()
    })
    .catch(error => error('Failed to delete game state', error))
}

function _dontusethis_deleteDatabase() {
  SaveManager.close().then(() => {
    SaveManager.deleteDatabase()
      .then(() => { })
      .catch(error => { })
  })

  setTimeout(() => {
    SaveManager.deleteDatabase()
      .then(() => { })
      .catch(error => { })
    SaveManager = new GameDB('MOUTHSIM-DEV', 'saves')
  }, 500)
}

//UTIL=======================

function findScene(chapter, scene_id) {
  //if scene = "end" ...

  for (let i = 0; i < chapter.scenes.length; i++) {
    let scene = chapter.scenes[i]
    if (scene.id == scene_id) {
      return scene
    }
  }

  log('NO SCENE WITH ID ' + scene_id + ' EXISTS')

  return undefined
}

function currentScene() {
  return findScene(CURRENT.chapter, CURRENT.scene)
}
/*
 * from now on this will
 * be a place thats meant only
 * for ui and looks
 * --a haiku to my eed gods for not letting me fogrt that
 */

// UI util-------------------------------------UI UTIL FROM GENERIC TO SPECIFI

function clear(element) {
  element.innerHTML = ''
}

//hiding and showing without breaking flow
function hide(...elements) {
  elements.forEach(element => {
    element.style.visibility = 'hidden'
  })
}

function hideAll() {
  hide(
    HTML.nametag,
    HTML.characters,
    HTML.choices,
    HTML.menu.panel,
    HTML.saves.modal,
    HTML.textbox,
    HTML.nextbutton,
    HTML.optionsbutton,
    HTML.overlay,
    HTML.popup.modal
  )
}

function show(...elements) {
  elements.forEach(element => {
    element.style.visibility = 'visible'
  })
}

function isHidden(element) {
  return (
    element.style.visibility == 'hidden' || element.style.visibility == 'none'
  )
}

//how the display shout be set to
function display(element, state) {
  element.style.display = state
}

function disableButton(button) {
  button.classList.remove('enabled')
  button.classList.add('disabled')
}

function enableButton(button) {
  button.classList.remove('disabled')
  button.classList.add('enabled')
}

function isDisabled(button) {
  return button.classList.contains('disabled')
}
//modals like settings,
function openPopup(text, callback) {
  //u spaceUnbindAll()
  CURRENT.popup = true;
  document.body.focus()

  show(HTML.popup.modal)
  show(HTML.overlay)

  HTML.popup.text.innerHTML = highlight(text)
  HTML.overlay.style.zIndex = 69


  spaceAdvances(
    'esc_popup',
    function () {

      closePopup()
      spaceUnbind("esc_popup")
    },
    27
  )

  registerButtonClick(() => {
    callback()
    closePopup()
  }, HTML.popup.okbutton)

  registerButtonClick(() => {
    closePopup()
  }, HTML.popup.cancelbutton)
}

function closePopup() {
  hide(HTML.popup.modal)
  hide(HTML.overlay)
  HTML.overlay.style.zIndex = 56
  CURRENT.popup = false
}
function openModal(modal) {
  spaceUnbindAll()

  //when modal is open closing it with esc is possible
  spaceAdvances(
    'esc',
    function () {
      if (!CURRENT.popup)
        closeModal(modal)
    },
    27
  )

  CURRENT.openModal = modal

  show(modal)
  show(HTML.overlay)
  disableButton(HTML.nextbutton)

  if (modal.id == HTML.saves.modal.id) loadSaves()
}

function closeModal(modal) {
  spaceUnbind('esc')
  CURRENT.openModal = null
  // show(HTML.nextbutton) not necessary?
  if (modal) {
    if (modal.id == HTML.saves.modal.id) closeSaves()
    hide(modal)
    hide(HTML.overlay)
  }
  enableButton(HTML.nextbutton)
  const scene = currentScene() //TODO: performance pot

  if (scene) {
    //rebind space
    handleSpaceBehavior(scene.dialogues[CURRENT.dialogue])
  }
}

function toggle(to_close, to_open) {
  closeModal(to_close)
  openModal(to_open)
}

//called when savegame modal closes
function closeSaves() {
  $('.save-wrapper.active input').val('')
  $('.save-wrapper').removeClass('inactive')
  $('.save-wrapper').removeClass('active')

  $('.save-wrapper.active .save-button').removeClass('disabled')

  document.querySelectorAll('.save-wrapper input').forEach(i => {
    removeInputEvents(i)
  })
  document
    .querySelectorAll('.save-wrapper .save-button')
    .forEach(b => {
      registerButtonClick(false, b)
    })
}

function changeBackground(element, bg = 'black') {
  if (bg && element) {
    if (bg == 'black') {
      element.style.backgroundImage = `none`
      element.style.backgroundColor = bg
    } else {
      element.style.backgroundImage = `url(${bg})`
    }
  } else {
    log('ERROR: problem(s) with drawing background:')
    if (!element) {
      log('invalid element')
    }
    if (!bg) {
      log('invalid background')
    }
  }
}

function setTextbox(text, delay) {
  text = text.replaceAll('_name', GAME.PLAYERSTATE.name)

  if (delay != 0) {
    show(HTML.textbox)

    window.typewriter.showText(text, delay) //class handles that
  } else {

    clearTimeout(window.typewriter.currentTimeout) //stop generating
    HTML.text.innerHTML = highlight(text)

  }
}

function setNametag(name) {
  const namebox = HTML.nametag
  show(namebox)

  if (name === 'Player') {
    name = GAME.PLAYERSTATE.name
  }

  namebox.textContent = name
}
// ---------------==============SETTINGS==============================================--settings

//user knows only bools go into checkboxes :P
function settingsSetUI(element, value, type) {
  switch (type) {
    case 'checkbox': //checkbox
      if (value) {
        element.classList.add('checked')
      } else {
        element.classList.remove('checked')
      }
      break
    case 'carousel':
      element.innerHTML = value
      break
    case 'counter':
      element.innerHTML = value
      break
    default:
      console.log("unknown type: " + type)
      break
  }
}

function getPlayerSetting(setting) {
  return GAME.PLAYERSTATE.settings[setting]
}
//returns object
function getDefaultSetting(setting) {
  return GAME.PLAYERSTATE_DEFAULTS.settings[setting]
}

function settingsValidateCounter(settingsContent) {
  const maxValue = parseInt(settingsContent.getAttribute('data-max')) || 100
  const minValue = parseInt(settingsContent.getAttribute('data-min')) || 0

  let displayElement = settingsContent.querySelector('.settings-button-value')
  let decreaseElement = settingsContent.querySelector(
    '.settings-button-decrease'
  )
  let increaseElement = settingsContent.querySelector(
    '.settings-button-increase'
  )

  let settingName = displayElement.id.split('-')[1]

  let playerValue = GAME.PLAYERSTATE.settings[settingName]
  let displayValue = parseInt(displayElement.innerText)

  //1. check if playerstate matches display - it HSOULD

  if (playerValue != displayValue) {
    log(
      'mismatch detected > player: ' + playerValue + '  \nui: ' + displayValue,
      true
    )
  }


  if (playerValue == maxValue) {
    disableButton(increaseElement);
  } else {
    enableButton(increaseElement);
  }
  if (playerValue == minValue) {
    disableButton(decreaseElement);
  } else {
    enableButton(decreaseElement);
  }
}

function settingClicked(event) {
  let cause = event.target
  let parent = cause?.closest('.settings-content')

  let type = parent?.getAttribute('data-type')

  if (!type) throw Error('BRO.........')

  switch (type) {
    case 'carousel':
      handleCarousel(cause, parent)
      break
    case 'checkbox':
      handleCheckbox(cause)
      break
    case 'counter':
      handleCounter(cause)
      break

    default:
      warn('mysterious and strange frankly worrying button! (unknown input type on this element): ' + type)

      break
  }

  function handleCarousel(button) {
    let parent = button.closest('.settings-content')
    let valueHolder = parent.querySelector('.settings-button-value')

    const direction = button.getAttribute('data-switch')
    let settingName = valueHolder.id.split('-')[1]

    let defaultSetting = getDefaultSetting(settingName)

    let values = defaultSetting.values
    let currentValue = getPlayerDataSetting(settingName)

    let currentIndex = values.findIndex(val => val == currentValue)//0
    let newIndex = currentIndex; //0

    if (direction == "decrease") {
      newIndex = (newIndex == 0 ? values.length : currentIndex) - 1;
    } else {
      newIndex = newIndex == values.length - 1 ? 0 : currentIndex + 1;
    }

    let newValue = values[newIndex]

    setPlayerDataSetting(settingName, newValue)
    settingsSetUI(valueHolder, newValue, 'carousel')

  }

  function handleCounter(button) {
    let parent = button.closest('.settings-content')
    let valueHolder = parent.querySelector('.settings-button-value')

    let settingName = valueHolder.id.split('-')[1]

    let defaultSetting = getDefaultSetting(settingName)

    const type = button.getAttribute('data-switch') //determines if -1 * or 1 *1
    const maxValue = defaultSetting.max || 100
    const minValue = defaultSetting.min || 0
    const step = defaultSetting.step || 1

    let multiplier = type == 'decrease' ? -1 : 1


    let currentValue = getPlayerDataSetting(settingName) //never. trust. the. ui. killing myself. btw

    const newValue = Math.min(
      maxValue,
      Math.max(minValue, multiplier * step + currentValue) //plus/inus step cant go beyond bounds!
    )

    setPlayerDataSetting(settingName, newValue)
    settingsSetUI(valueHolder, newValue, 'counter')
    settingsValidateCounter(parent)
  }

  function handleCheckbox(button) {

    //0. get current ui data
    let currentUIValue = !!button.classList.contains('checked')
    let settingName = button.id.split('-')[1] //hashtag trust me
    //see which element was clicked


    //1. set the PLAYERSTATE Data (and the window warning on)!
    const newSettingvalue = !currentUIValue //checkbox yeah love?

    setPlayerDataSetting(settingName, newSettingvalue)
    settingsSetUI(button, newSettingvalue, 'checkbox')
  }
}

// SPECIFIC UI FUNCTIONS ==================== for a declarative approach or whatever

function highlight(text) {
  const yellow_regex = /\[(.*?)\]/g
  text = text.replace(yellow_regex, '<span class="text-yellow">$1</span>')

  const red_regex = /\{(.*?)\}/g
  text = text.replace(red_regex, '<span class="text-red">$1</span>')

  const pink_regex = /\$(.*?)\$/g
  text = text.replace(pink_regex, '<span class="text-pink">$1</span>')

  return text
}

function disableMenu() {
  const menuitems = HTML.menu.panel.querySelectorAll(
    '.talkbox-menu-item'
  )

  menuitems.forEach(button => {
    disableButton(button)
  })
}

function enableMenu(restrictive = false) {
  if (restrictive) {
    disableMenu()

    if (canSave()) {
      enableButton(HTML.menu.save)
    }
    if (canLoad()) {
      enableButton(HTML.menu.load)
    }
    if (canBack()) {
      enableButton(HTML.menu.back)
    }
    if (canRestart() || canStart()) {
      enableButton(HTML.menu.start)
    }
    if (canLog()) {
      enableButton(HTML.menu.log)
    }
    if (canSettings()) {
      enableButton(HTML.menu.settings)
    }
  } else {
    const menuitems = HTML.menu.panel.querySelectorAll(
      '.talkbox-menu-item'
    )

    menuitems.forEach(button => {
      enableButton(button)
    })
  }

  function canSave() {
    //can save when player is named and in scene
    if (GAME.PLAYERSTATE.name && CURRENT.scene) {
      return true
    } else {
      return false
    }
  }

  function canLoad() {
    return true //can load everywhere
  }

  function canSettings() {
    return true //can load everywhere
  }

  function canLog() {
    const logEmpty = HTML.log.logarea.innerHTML.trim() === '';

    if (logEmpty) {
      return false;
    }
    return true;
  }

  function canBack() {
    return false
  }

  function canStart() {
    if (!CURRENT.scene) {
      return true;
    }
    return false;
  }

  function canRestart() {
    if (CURRENT.scene) {
      return true;
    }
    return false;
  }
}

function disableNextButton() {
  const next = HTML.nextbutton

  disableButton(next)
}

function enableNextButton() {
  const next = HTML.nextbutton

  enableButton(next)
}

//removes talking tag from all sprites
function removeTalkingSprites() {
  let characters = $(HTML.characters)

  characters.children().removeClass('talking')
}

//----------------------------------------browser stuff

function allowCloseWindow(on) {
  window.onbeforeunload = !on ? unloadMessage : null
}

function unloadMessage() {
  return 'This game does NOT autosave - all progress will be lost!'
}

function log(...text) {
  if (CONFIG.debug && getPlayerSetting('debug')) console.log('LOG: ', ...text)
}

function warn(text) {
  console.log('WARN: ' + text)
}


function error(text, error) {
  console.log('ERROR: ' + text + ' >>> ', error)
}