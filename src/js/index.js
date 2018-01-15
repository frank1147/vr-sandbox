'use strict';
// Dependencies we load from vendor.js
import 'aframe';
import 'aframe-physics-system';
import 'aframe-mouse-cursor-component';
import 'aframe-extras/dist/aframe-extras.controls';

// TODO track down error to be able to test kinematic-body for player element
// import 'aframe-extras/dist/aframe-extras.misc';

// project entry
import './a-systems';
import './a-shaders';
import './a-components';
import './a-primitives';
import './a-car';

// Load Application
import './a-project';

import $ from 'jquery';

import 'networked-aframe';

import './gameHotkeys';

import {setPosition} from './util';

import debounce from 'lodash.debounce';
import trim from 'lodash.trim';

import DiffDOM from 'diff-dom';

import {
  onAFrameAttributeChange, onAttributeChange, onElementChange, onTagChanged,
  onXYZAFrameChange
} from './network-sync';
import {attachGameLogic} from './ballGameLogic';

// ------------------

// ----------------
//
// NOTE:Make sure that Bootstrap's CSS classes are included in your HTML.
// NOTE:Make sure that Bootstrap's CSS classes are included in your HTML.
// global.jQuery = global.$ = $;

// require('bootstrap');
// require('@gladeye/aframe-preloader-component');
// NOTE:use below approach if component above is not sufficient
/* var manager = document.querySelector('a-assets').fileLoader.manager
 manager.onStart=function(){
     console.log(arguments)

 };
*/
/*
onAttributeChange(undefined, 'position', function () {
  console.log('------------------------------');
  console.log('changed element:', arguments);
});
*/

// TODO track all elements with a position attribute (for now estimate that those are a-frame elements)
/* onXYZAFrameChange('[position]', function (evt) {
   console.log('Entity has moved from', evt, evt.detail, evt.detail.oldData, 'to', evt.detail.newData, '!');
});
*/
if (module.hot) {
  module.hot.accept();
}
// Load html
let aScene = require('../scene/index.hbs');
document.addEventListener('DOMContentLoaded', function () {
  $('body').append(aScene({
    defaults: {
      camera: {
        position: '0 0 3.8'
      },
      sky: {
        color: '#ECECEC'
      }
    }
  })
  );

  reloadSceneToDOM();
});

/**
 // load etherpad frame
 document.addEventListener('DOMContentLoaded', function () {
  var iframe = document.querySelector('.overlay-editor');
  iframe.src = 'http://' + window.location.hostname + ':85/p/helloEtherpad';
  console.log(iframe);
});
 */

// listening for changes of a-scene like added removed
onTagChanged('a-scene', function (elementsInfo) {
  // console.log('a-scene changed', elementsInfo);

  function initScene (scene) {
    scene.setAttribute('visible', false);

    addLoadingListenersToScene(elementsInfo.added[0], function () {
      scene.setAttribute('visible', true);
    });

    attachGameLogic();
  }

  // the first time called, this will attach logic for nothing as the initial scene is empty
  if (elementsInfo.added.length > 0) {
    initScene(elementsInfo.added[0]);
  }
});

function addLoadingListenersToScene (scene, loadedhandler = () => {}) {
  var assets = scene.querySelector('a-assets');
  console.log(assets);
  if (assets == null) {
    console.log('scene does not contain asssets for the loader');
    loadedhandler();
    return;
  }

  var manager = assets.fileLoader.manager;
  manager.onStart = function () {
    console.log('scene assests start loading', arguments);
  };

  manager.onStart = function () {
    console.log('scene assests start loading', arguments);
  };

  manager.onError = function () {
    console.log('scene assests error loading', arguments);
  };
  manager.onProgress = function () {
    console.log('scene assests progress loading', arguments);
  };

  manager.onLoad = function () {
    console.log('scene assests loaded', arguments);
    loadedhandler();
  };
}

/*

*/

// --------------------------------------

// --------------------------------------

function reloadSceneToDOM () {
  $('body').addClass('splash-screen');

  var elem = document.querySelector('.overlay-editor .content-area');

  var content = require('../staticContent.hbs');

  elem.value = content();

  function staticUpdateScene () {
    var sceneDefinition = require('../sceneDefinition.hbs');

    var copy = $(sceneDefinition()).append(trim(elem.value));

    // FIXME no longer detecting loaded
    /*  copy.get(0).addEventListener('loaded', function () {
      console.log('scene was loaded');
      setTimeout(function () {
        copy.attr('visible', true);
      }, 500);
    }); */

    $('a-scene').replaceWith(copy);

    // ----------------------------------
  }

  function diffUpdateScene () {
    // TODO test if the diffing has the wanted result of increasing load times of area as well as reducing uneccessary computations
    var dd = new DiffDOM();

    var sceneOld = $('a-scene').get(0);
    var sceneNew = $('<a-scene>').append(trim(elem.value)).get(0);

    var diff = dd.diff(sceneOld, sceneNew);
    console.log(sceneOld, sceneNew, diff);
    // dd.apply(sceneOld, diff);
  }

  function initSceneFromTextarea (staticUpdate = true) {
    console.log('changed');
    // var scene = document.querySelector('#aframe-project');

    // var el = htmlToElement(trim(elem.value));
    // console.log('el:', el);
    // scene.innerHTML += elem.value;
    // scene.appendChild(el);

    // document.querySelector('a-scene').append(el);

    // $('a-scene').append(trim(elem.value));

    if (staticUpdate) {
      staticUpdateScene();
    } else {
      diffUpdateScene();
    }

    // $('a-scene').get(0).originalHTML=trim(elem.value)
    //   $('a-scene').get(0).reload();
  }

  initSceneFromTextarea();

  elem.addEventListener('keypress', debounce(initSceneFromTextarea, 2000));
}
