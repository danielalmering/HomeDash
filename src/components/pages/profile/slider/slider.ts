import PhotoSlider from 'sensejs/vue/components/photo-slider';

import './slider.scss';
import WithRender from './slider.tpl.html';
import { Prop, Component } from 'vue-property-decorator';
import { getSliderImages } from '../../../../utils/main.util';
import Player from './slider-player';

@WithRender
@Component({
    components: {
        player: Player
    }
})
export default class ProfilePhotoSlider extends PhotoSlider {

    getSliderImages = getSliderImages;

    onClick(photoId: number){
        this.$emit('photoSelected', photoId);
    }

    get getMedia(){
        return (item: any) => {
            if(item.hasOwnProperty('wowza_sync')){
                return item.wowza_sync ? true : false;
            } else {
                return false;
            }
        };
    }

}