<template>
  <div class="container">
    <h1>Woordle Oplosser</h1>
    <p>Hoeveel letters</p>
    <v-chip-group color="primary" v-model="letterCount">
      <v-chip :value="4">4</v-chip>
      <v-chip :value="5">5</v-chip>
      <v-chip :value="6">6</v-chip>
      <v-chip :value="7">7</v-chip>
      <v-chip :value="8">8</v-chip>
    </v-chip-group>
    <p class="mt-5">🟩 Correcte letters</p>
    <div class="letter-field">
      <v-text-field v-for="i in letterCount" color="green" :maxlength="2" class="input green"
                    @input="setLetter($event,'green', 0, i - 1)" v-model="green[i - 1]"/>
      <v-btn class="close-button" icon="mdi-close" variant="plain" @click="clearField('green')"></v-btn>
    </div>
    <p class="mt-5">🟨 Gele letters</p>
    <div class="yellow-field">
      <div class="letter-field" v-for="(yellow, j) in yellows">
        <v-text-field @keyup="handleKey($event,'yellow', j, i - 1)"
                      @input="setLetter($event,'yellow', j, i - 1)"
                      v-for="i in letterCount" color="yellow"
                      :maxlength="2" class="input yellow" :class="'row'+j" v-model="yellow[i - 1]"/>
        <v-btn class="close-button" icon="mdi-close" variant="plain" @click="clearField('yellow', j)"></v-btn>
      </div>
    </div>
    <p class="mt-5">⬛ Incorrecte letters</p>
    <div class="letter-field">
      <v-text-field color="grey" class="input left" v-model="wrong"/>
      <v-btn class="close-button" icon="mdi-close" variant="plain" @click="clearField('black')"></v-btn>
    </div>
    <v-btn color="primary" variant="tonal" @click="solve()">Oplossen</v-btn>
    <div class="mt-10 text-center" v-if="options.length > 0">
      <div class="more-options">
        <p class="font-weight-bold text-uppercase">{{ options.length }} mogelijkheden</p>
        <v-switch v-if="options.length > showOptions.length" class="ml-5" hide-details v-model="showAll"
                  label="Alle opties laten zien"/>
      </div>
      <div class="solve-options mt-5">
        <v-sheet color="" border rounded class="solve-option" v-for="option in (showAll ? options : showOptions)">
          {{ option }}
        </v-sheet>
      </div>
      <p class="mt-5 mb-10" v-if="!showAll && options.length > showOptions.length">en nog
        {{ options.length - showOptions.length }} meer...</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from "vue";
import {useTheme} from "vuetify";

const theme = useTheme()
console.log(theme)

let words: string[] = []
let lenWords = {}
fetch('/wordlist-filtered.txt').then(r => r.text().then(x => {
  words = x.split('\n')
  for (let word of words) {
    if (lenWords[word.length] === undefined) lenWords[word.length] = []
    lenWords[word.length].push(word.toLowerCase())
  }
  console.log('Loaded wordlist')
}))

const letterCount = ref(5)
const green = ref(['a', '', 'r', '', ''])
const yellows = ref([['e', '', 'd', 'a', ''], ['', '', '', '', '']])
const wrong = ref("")
const options = ref([])
const showOptions = ref([])
const showAll = ref(false)

watch(letterCount, () => {
  green.value = '_'.repeat(letterCount.value).split('').map(() => '')
  yellows.value = ['_'.repeat(letterCount.value).split('').map(() => '')]
  wrong.value = ''
  options.value = []
  showOptions.value = []
  showAll.value = false
})

let dontUpdate = false;
watch(yellows, () => {
  if (dontUpdate) return;
  let newYellows = []
  for (let row of yellows.value) {
    let rowEmpty = true
    for (let letter of row) {
      if (letter !== '' && letter !== null && letter !== undefined) {
        rowEmpty = false
        break;
      }
    }
    if (!rowEmpty)
      newYellows.push(row)
  }
  dontUpdate = true
  newYellows.push([...new Array(letterCount.value)].map(() => ''))
  if (newYellows.length === 1)
    newYellows.push([...new Array(letterCount.value)].map(() => ''))
  yellows.value = newYellows
  setTimeout(() => dontUpdate = false, 10)
}, {deep: true})

function handleKey(e, type, row, letter) {
  // console.log(e)
}

function setLetter(e, type, row = 0, letter = 0) {
  let input = e.data?.toLowerCase?.() ?? '';
  if (type === 'yellow') {
    for (let i = 0; i < yellows.value.length; i++) {
      if (i === row) continue
      if (yellows.value[i][letter].toLowerCase() === input) {
        yellows.value[row][letter] = ''
        return
      }
    }
    if (green.value[letter] === input) {
      yellows.value[row][letter] = ''
      return
    }
    yellows.value[row][letter] = input
    let el = document.querySelectorAll(`.input.yellow.row${row}`)[letter].querySelector('input')
    if (letter < letterCount.value - 1) {
      console.log(el)
    }
  }
  if (type === 'green') {
    for (let i = 0; i < yellows.value.length; i++) {
      if (yellows.value[i][letter].toLowerCase() === input) {
        green.value[letter] = ''
        return
      }
    }
    green.value[letter] = input
  }
}

function clearField(type, row = 0) {
  if (type === 'green')
    green.value = [...new Array(letterCount.value)].map(() => '')
  if (type === 'yellow') {
    yellows.value[row] = [...new Array(letterCount.value)].map(() => '')
  }
  if (type === 'black')
    wrong.value = ''
}

function solve() {
  showAll.value = false
  let list = lenWords[letterCount.value]
  let greens = green.value.map((l, i) => [l?.toLowerCase?.() ?? '', i]).filter(l => l[0] !== '')
  let yellowses = yellows.value.flatMap(y => y.map((l, i) => [l?.toLowerCase?.() ?? '', i]).filter(l => l[0] !== ''))
  let wrongs = [...wrong.value.toLowerCase()].filter(l => !green.value.includes(l) && !yellowses.map(j => j[0]).includes(l))

  let greened = list.filter(word => greens.every(([letter, i]) => word[i] === letter))
  let yellowed = greened.filter(word => yellowses.every(([letter, i]) => word.includes(letter) && word[i] !== letter))
  options.value = yellowed.filter(word => wrongs.every(letter => !word.includes(letter)))
  showOptions.value = options.value.slice(0, 60)
}
</script>

<style scoped>
.container {
  max-width: 600px;
  width: calc(100% - 40px);
  margin: 0 auto;
  padding: 20px 10px 10px;
}

.letter-field {
  display: flex;
  gap: 10px;
}

.close-button {
  margin-top: 15px;
}

.input:deep(input) {
  font-size: 25px;
  text-transform: uppercase;
  font-weight: bold;
  font-family: monospace;
  text-align: center;
}

.input.left:deep(input) {
  text-align: left;
  letter-spacing: 20px;
}

.solve-options {
  display: flex;
  gap: 15px;
  max-width: 100%;
  flex-wrap: wrap;
  justify-content: center;
}

.solve-option {
  padding: 5px 10px;
  font-size: 18px;
  text-transform: uppercase;
  margin: 0;
}

.more-options {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
