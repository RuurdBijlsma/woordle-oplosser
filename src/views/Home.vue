<template>
    <div class="container" :style="{maxWidth: `${letterCount * 82 + 50}px`}">
        <h1>Woordle Oplosser</h1>
        <p>Hoeveel letters</p>
        <v-chip-group color="primary" v-model="letterCount" mandatory>
            <v-chip :value="4">4</v-chip>
            <v-chip :value="5">5</v-chip>
            <v-chip :value="6">6</v-chip>
            <v-chip :value="7">7</v-chip>
            <v-chip :value="8">8</v-chip>
            <v-chip :value="9">9</v-chip>
            <v-chip :value="10">10</v-chip>
            <v-chip :value="11">11</v-chip>
        </v-chip-group>
        <div class="field mt-4">
            <div class="letter-field" v-for="(row, j) in rows">
                <div class="letter-container" v-for="(cell, i) in row">
                    <div class="set-color">
                        <div @click="cell.color = 'green'" class="green"></div>
                        <div @click="cell.color = 'yellow'" class="yellow"></div>
                        <div @click="cell.color = 'grey'" class="grey"></div>
                    </div>
                    <div class="input"
                         :style="{backgroundColor: getColor(cell)}"
                         @click="focusTile = [j, i]"
                         :active="focusTile[0] === j && focusTile[1] === i">
                        {{ cell.letter }}
                    </div>
                </div>
                <v-btn class="close-button" icon="mdi-close" variant="plain" @click="clearField(j)"></v-btn>
            </div>
        </div>
        <v-btn color="primary" class="mt-5" variant="tonal" @click="solve()">Oplossen</v-btn>
        <div class="mt-10 text-center" v-if="options.length > 0">
            <div class="more-options">
                <p class="font-weight-bold text-uppercase">{{ options.length }} mogelijkheden</p>
            </div>
            <div class="solve-options mt-5">
                <v-sheet color="" border rounded class="solve-option" v-for="option in showOptions"
                         @click="addWordRow(option)">
                    {{ option }}
                </v-sheet>
            </div>
            <p class="mt-5 mb-2" v-if="options.length > showOptions.length">en nog
                {{ options.length - showOptions.length }} meer...</p>
            <v-btn class="mb-10" variant="tonal" @click="showLimit += 100">Laat meer zien</v-btn>
        </div>
    </div>
</template>

<script lang="ts" setup>
class Cell {
    letter: string;
    color: string;

    constructor(color = 'grey', letter = '') {
        this.color = color;
        this.letter = letter;
    }
}

import {computed, onUnmounted, ref, watch} from "vue";
import {useTheme} from "vuetify";

const theme = useTheme()
console.log(theme)

document.addEventListener('keydown', handleKey)
onUnmounted(() => document.removeEventListener('keydown', handleKey))

let words: string[] = []
let lenWords: any = {}
fetch('/wordlist-filtered.txt').then(r => r.text().then(x => {
    words = x.split('\n')
    for (let word of words) {
        if (lenWords[word.length] === undefined) lenWords[word.length] = []
        lenWords[word.length].push(word.toLowerCase())
    }
    console.log('Loaded wordlist')
}))

const letterCount = ref(5)
const rows = ref([[new Cell, new Cell, new Cell, new Cell, new Cell]])
const options = ref([] as string[])
const showLimit = ref(50)
const focusTile = ref([0, 0])
const showOptions = computed(() => options.value.slice(0, showLimit.value))

watch(letterCount, () => {
    options.value = []
    showLimit.value = 50
    rows.value = []
})

let dontUpdate = false;
watch(rows, () => {
    if (dontUpdate) return;
    let newRows = []
    for (let row of rows.value) {
        let rowEmpty = true
        for (let cell of row) {
            if (cell.letter !== '' && cell.letter !== null && cell.letter !== undefined) {
                rowEmpty = false
                break;
            }
        }
        if (!rowEmpty)
            newRows.push(row)
    }
    dontUpdate = true
    newRows.push([...new Array(letterCount.value)].map(() => new Cell))
    rows.value = newRows
    setTimeout(() => dontUpdate = false, 10)
}, {deep: true})

function addWordRow(word: string) {
    let lastRow = rows.value[rows.value.length - 1]
    for (let i = 0; i < word.length; i++) {
        if (i < lastRow.length) lastRow[i].letter = word[i]
    }
}

function handleKey(e: KeyboardEvent) {
    let [row, letter] = focusTile.value
    if (e.key === 'Backspace') {
        rows.value[row][letter].letter = ''
        let nextLetter = letter - 1;
        let nextRow = row
        if (nextLetter < 0) {
            if (nextRow === 0) return
            nextLetter = letterCount.value - 1
            nextRow--
        }
        focusTile.value = [nextRow, nextLetter]
    } else {
        let input = e.key?.toLowerCase?.() ?? '';
        if (!'abcdefghijklmnopqrstuvwxyz'.includes(input)) return
        console.log("set key", input)
        rows.value[row][letter].letter = input

        let nextLetter = letter + 1;
        let nextRow = row
        if (nextLetter >= letterCount.value) {
            nextLetter = 0
            nextRow++
        }
        focusTile.value = [nextRow, nextLetter]
    }
}

function getColor(cell: Cell) {
    if (cell.color === 'green') return '#4aa14a'
    if (cell.color === 'yellow') return '#d2bc58'
    if (cell.color === 'grey') return '#4b4b4b'
}

function clearField(row = 0) {
    rows.value[row] = [...new Array(letterCount.value)].map(() => new Cell)
    focusTile.value = [row, 0]
}

const alphabet = 'qwertyuiopasdfghjklzxcvbnm'

function emptyLetterCountObject(value = 0) {
    let res: any = {}
    for (let letter of alphabet)
        res[letter] = value
    return res;
}

function checkWordForCounts(word: string, countObject: any, min = true) {
    let wordCounts: any = {}
    for (let letter of word)
        if (!wordCounts[letter]) wordCounts[letter] = 1
        else wordCounts[letter]++
    // console.log(word, wordCounts)
    if (min) {
        for (let letter in countObject)
            if ((wordCounts[letter] ?? 0) < countObject[letter])
                return false
    } else {
        for (let letter in countObject) {
            if (!wordCounts.hasOwnProperty(letter))
                continue
            if (wordCounts[letter] > countObject[letter])
                return false
        }
    }
    return true
}

function solve() {
    console.log(checkWordForCounts)
    showLimit.value = 50
    let greens: [string, number][] = []
    let minLetterCounts = emptyLetterCountObject()
    let maxLetterCounts = emptyLetterCountObject(Infinity)
    let wrongPlaces: [string, number][] = []
    for (let i = 0; i < rows.value.length; i++) {
        let row = rows.value[i]
        let rowMinLetterCounts = emptyLetterCountObject()
        let rowMaxLetterCounts = emptyLetterCountObject(Infinity)
        for (let j = 0; j < row.length; j++) {
            let cell = row[j]
            if (cell.letter === '') continue
            if (cell.color === 'green') {
                rowMinLetterCounts[cell.letter]++
                rowMaxLetterCounts[cell.letter]++
                let green = greens.find(y => y[0] === cell.letter && y[1] === j)
                // als dit de eerste rij is met een groene hier, en er is een gele uit de vorige rijen met dezelfde letter
                // dan is die gele niet meer relevant behalve dat die letter daar niet herhaalt kan als er meer dan 1 is
                if (!green)
                    greens.push([cell.letter, j])
            } else if (cell.color === 'yellow') {
                rowMinLetterCounts[cell.letter]++
                rowMaxLetterCounts[cell.letter]++
                let wrongPlace = wrongPlaces.find(y => y[0] === cell.letter && y[1] === j)
                if (!wrongPlace)
                    wrongPlaces.push([cell.letter, j])
            } else if (cell.color === 'grey') {
                rowMaxLetterCounts[cell.letter] = rowMinLetterCounts[cell.letter]
                let wrongPlace = wrongPlaces.find(y => y[0] === cell.letter && y[1] === j)
                if (!wrongPlace)
                    wrongPlaces.push([cell.letter, j])
            }
        }
        // splits gele op in include en wrong place want de informatie over dat de letter niet op die positie moet blijft
        // maar de informatie dat die letter er nog in moet ergens gaat weg als er een groene komt met die letter
        for (let letter of alphabet) {
            if (rowMinLetterCounts[letter] > minLetterCounts[letter])
                minLetterCounts[letter] = rowMinLetterCounts[letter]
            if (rowMaxLetterCounts[letter] < maxLetterCounts[letter])
                maxLetterCounts[letter] = rowMaxLetterCounts[letter]
        }
    }

    for (let letter of alphabet) {
        if (minLetterCounts.hasOwnProperty(letter) && minLetterCounts[letter] === 0)
            delete minLetterCounts[letter]
        if (maxLetterCounts.hasOwnProperty(letter) && maxLetterCounts[letter] === Infinity)
            delete maxLetterCounts[letter]
    }

    let list: string[] = lenWords[letterCount.value]
    let greened = list.filter(word => greens.every(([l, i]) => word[i] === l))
    let wrongPlaced = greened.filter(word => wrongPlaces.every(([l, i]) => word[i] !== l))
    let minCounted = wrongPlaced.filter(word => checkWordForCounts(word, minLetterCounts, true))
    let maxCounted = minCounted.filter(word => checkWordForCounts(word, maxLetterCounts, false))

    console.info({greens, minLetterCounts, maxLetterCounts, wrongPlaces})
    options.value = maxCounted
}
</script>

<style scoped>
.container {
    width: calc(100% - 40px);
    margin: 0 auto;
    padding: 20px 10px 10px;
}

.letter-field {
    display: flex;
    gap: 2px;
}

.letter-container {
    flex-grow: 1;
    margin-top: 2px;
    margin-bottom: 2px;
    display: flex;
    flex-direction: column;
}

.set-color {
    display: flex;
    height: 15px;
    width: calc(80px - 12px);
    margin-left: 6px;
    border-top-right-radius: 10px;
    border-top-left-radius: 10px;
    overflow: hidden;
    cursor: pointer;
}

.set-color > div {
    height: 100%;
    width: calc(100% / 3);
}

.green {
    background-color: #4aa14a;
}

.yellow {
    background-color: #ffd500;
}

.grey {
    background-color: #4b4b4b;
}

.close-button {
    margin-top: 35px;
}

.input {
    font-size: 35px;
    text-transform: uppercase;
    font-weight: bold;
    font-family: monospace;
    text-align: center;
    cursor: pointer;
    padding: 14px;
    height: 80px;
    width: 80px;
    border-radius: 8px;
    color: white;
    text-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.input[active='true'] {
    box-shadow: inset 0 0 0 8px #838383;
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
