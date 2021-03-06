import {getVectorRelativeToPlayer} from '../utils/aframe-utils';
import {FPSCtrl} from '../utils/fps-utils';

/**
 * A helper that tracks the distance between camera and video player and reduces the volume based on the distance.s
 * TODO better damping function also calculate a min-distance from where the maximum volume is used based on plane height/width.
 */
AFRAME.registerComponent('video-positional-audio', {
  dependencies: ['simple-video-player'],
  schema: {
    radius: {type: 'number', default: '10'},
    volume: {type: 'number', default: '1'}
  },
  init: function () {
    this.mInterval = new FPSCtrl(5, function () {
      var video = this.el.querySelector('video');

      let distanceVector = getVectorRelativeToPlayer(this.el);
      let distance = distanceVector.length();
      let radius = this.data.radius;
      let volume = this.data.volume;

      if (distance <= radius) {
        video.volume = volume * (1 - distance / radius);
        // console.log(distance/radius/2);
      } else {
        video.volume = 0;
      }
    }, this)
      .start();
  },
  remove: function () {
    this.mInterval.stop();
  }
});
