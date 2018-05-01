import PhotoSlider from 'sensejs/vue/components/photo-slider';

import './slider.scss';
import WithRender from './slider.tpl.html';
import { Prop, Component } from 'vue-property-decorator';
import { getSliderImages } from '../../../../util';
import NanoCosmos from './slider-player';

@WithRender
@Component({
    components: {
        nanocosmos: NanoCosmos
    }
})
export default class ProfilePhotoSlider extends PhotoSlider {

    getSliderImages = getSliderImages;

    onClick(photoId: number){
        this.$emit('photoSelected', photoId);
    }

}