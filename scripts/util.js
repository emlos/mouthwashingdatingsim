class GameDB {
  constructor (dbName, storeName) {
    this.dbName = dbName
    this.storeName = storeName
    this.dbVersion = 1 // Start with version 1, increment if schema changes are needed
    this.db = null // This will hold the opened database
  }

  //prepare to put data into db table 'store': 'saves'
  async open () {
    if (this.db) return this.db // Use already opened database

    const openDatabase = version => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, version)
        request.onerror = event => {
          console.error('Database error: ', event.target.errorCode)

          reject(new Error(event.target.errorCode))
        }
        request.onsuccess = event => {
          const db = event.target.result
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.close()
            resolve(openDatabase(version + 1)) // Recursively attempt to open with incremented version
          } else {
            resolve(db)
          }
        }
        request.onupgradeneeded = event => {
          const db = event.target.result
          if (!db.objectStoreNames.contains(this.storeName)) {
            console.log('Creating object store')
            db.createObjectStore(this.storeName, { keyPath: 'id' })
          }
        }
        request.onblocked = () => {
          console.warn('Please close all other tabs with this site open!')
          reject(new Error('Database open blocked'))
        }
      })
    }

    this.db = await openDatabase(this.dbVersion)
    return this.db // Return the opened database
  }

  async close () {
    if (this.db) {
      this.db.close()
      this.db = null
      console.log('Database connection closed.')
    }
  }

  async saveGameState (gameState) {
    await this.open()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      console.log(gameState)
      const request = store.put(gameState)

      request.onsuccess = event => resolve(event.target.result)
      request.onerror = event => reject(event.target.errorCode)
    })
  }

  async loadGameState (save_id) {
    await this.open()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName])
      const store = transaction.objectStore(this.storeName)
      const request = store.get(save_id)

      request.onsuccess = event => {
        resolve(event.target.result)
      }
      request.onerror = event => {
        reject(event.target.errorCode)
      }
    })
  }

  async loadAllStates () {
    const db = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }
      request.onerror = event => {
        reject(event.target.errorCode)
      }
    })
  }
  async deleteGameState (save_id) {
    await this.open() // Ensure the database is open
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(save_id)

      request.onsuccess = () => {
        console.log('Deleting save successful, id: ' + save_id)
        resolve()
      }
      request.onerror = event => reject(event.target.errorCode)
    })
  }

  async deleteDatabase () {
    await this.close() // Make sure to close the database connection first
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName)

      request.onsuccess = () => {
        console.log('Database deleted successfully')
        resolve()
      }

      request.onerror = event => {
        console.error('Database deletion failed: ', event.target.errorCode)
        reject(event.target.errorCode)
      }

      request.onblocked = () => {
        //console.log("Database deletion blocked. Make sure all connections are closed.");
        this.deleteDatabase()
      }
    })
  }
}
class Typewriter {
  constructor (elementId, delay = 30) {
    this.element = document.getElementById(elementId)
    this.delay = delay
    this.defaultDelay = delay
    this.currentTimeout = null
    this.elements = [] //differently colored strings with class name
    this.elementIndex = 0 //current colored string
    this.charIndex = 0
  }

  parseText (text) {
    const patterns = [
      { regex: /\{(.*?)\}/g, className: 'text-red' }, //curlies are red
      { regex: /\[(.*?)\]/g, className: 'text-yellow' }, //brackets are yellow
      { regex: /\$(.*?)\$/g, className: 'text-pink' } //pink
    ]

    let parsedElements = []
    let currentIndex = 0

    const handleMatch = (match, p1, offset, regex) => {
      if (offset > currentIndex) {
        parsedElements.push({
          text: text.slice(currentIndex, offset),
          class: ''
        })
      }
      parsedElements.push({ text: p1, class: regex.className })
      currentIndex = offset + match.length
    }

    patterns.forEach(pattern => {
      text.replace(pattern.regex, (match, p1, offset) =>
        handleMatch(match, p1, offset, pattern)
      )
    })

    if (currentIndex < text.length) {
      parsedElements.push({ text: text.slice(currentIndex), class: '' })
    }

    return parsedElements
  }

  typeWriter () {
    if (this.elementIndex < this.elements.length) { 
      const { text, class: className } = this.elements[this.elementIndex]

      if (this.charIndex < text.length) {
        const span = document.createElement('span')
        if (className) {
          span.className = className
        }
        span.textContent = text.charAt(this.charIndex)
        this.element.appendChild(span)

        let delay = this.delay ? this.delay : this.defaultDelay
        if (['.', ',', '?', '!', '-'].includes(text.charAt(this.charIndex))) {
          delay *= 1.5 // Increase delay by 10%
        }

        this.charIndex++
        this.currentTimeout = setTimeout(() => this.typeWriter(), delay)
      } else {
        this.elementIndex++
        this.charIndex = 0
        this.typeWriter()
      }
    }
    else {
      this.stop()
    }
  }

  stop() {
    clearTimeout(this.currentTimeout)
    this.elementIndex = 0
    this.charIndex = 0
    //this.element.innerHTML = ''
    
    this.currentTimeout = null
  }

  showText (newText, customDelay) {
    clearTimeout(this.currentTimeout)
    this.elementIndex = 0
    this.charIndex = 0
    this.element.innerHTML = ''
    this.elements = this.parseText(newText)

    this.delay = customDelay ? customDelay : this.defaultDelay

    this.typeWriter()
  }
}


function setCookie(name, value) {
  document.cookie = name + "=" + value + "; path=/";
}
// Function to get a cookie
function getCookie(name) {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  if (parts.length === 2) return parts.pop().split(";").shift();
}


//window.typewriter set in ui
var SaveManager = new GameDB('MOUTHSIM-DEV', 'saves')
