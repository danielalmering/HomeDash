import Vue from 'vue';
import emoticonData from './emoticons.data.json';

import { Component } from 'vue-property-decorator';

import './emoticons.scss';
import WithRender from './emoticons.tpl.html';

@WithRender
@Component
export default class Emoticons extends Vue {

    emoticons: { [key: string]: any } = emoticonData;
    emoticonCategories: string[] = [];

    selectedCategory: string = 'people';

    mounted(){
        this.emoticonCategories = Object.keys(this.emoticons);
    }

    selectCategory(category: string){
        this.selectedCategory = category;
    }

    selectEmoji(name: string){
        this.$emit('emojiSelected', name);
    }
}