import './gui-list-view';
import './gui-color-list';
import './gui-material-list';
import './gui-mesh-list';
import _ from 'lodash';
import {appendHTML3D, createHTML} from '../../utils/dom-utils';
import {createGlowForMesh} from './glow-shader';
import {FPSCtrl} from '../../utils/fps-utils';
import {namespaceExists} from '../../utils/namespace';

/**
 * Prototyping....
 * currently only working for simple-car
 *
 */

AFRAME.registerComponent('product-configurator', {
  schema: {
    template: {type: 'string'}
  },
  init: function (x) {
    var el = this.el;// document.querySelectorAll('a-simple-car')[1];

    // el.setAttribute('simple-billboard', true);

    var mats = AFRAME.nk.querySelectorAll(el, '.Mesh:where(material)');

    var [chassis, ...tires] = mats.map(el => el.material);

    // load product // no additional meshes for now

    // ------------------------------

    // hides the helper if entity not visible
    this.mHelperScript = new FPSCtrl(2, function () {
      var vis = this.el.getAttribute('visible');

      if (namespaceExists('mesh.material', this.mGlowHelper)) {
        this.mGlowHelper.mesh.material.visible = vis;
      }
    }, this).start();

    // ------------------------------

    function createColorListView (parent, caption, handler, options) {
      var template = `
                            <a-entity class="backPlane"  scale='.25 .25 .25' >
                              <a-entity gui-color-list="caption:${caption}"></a-entity>             
                            </a-entity>
                            `;

      var el = createHTML(template);

      parent.appendChild(el);

      var colorListEl = el.querySelector('[gui-color-list]');
      colorListEl.addEventListener('change', handler);

      _.each(options, (v, k) => colorListEl.setAttribute(k, v));
    }

    function createMaterialListView (parent, caption, handler, options) {
      var template = `
                            <a-entity class="backPlane"  scale='.25 .25 .25' >
                              <a-entity gui-material-list="caption:${caption}"></a-entity>             
                            </a-entity>
                            `;

      var el = createHTML(template);

      parent.appendChild(el);

      var colorListEl = el.querySelector('[gui-material-list]');
      colorListEl.addEventListener('change', handler);

      _.each(options, (v, k) => colorListEl.setAttribute(k, v));
    }

    // --------------------------------------------
    // TODO refactor listview and references to data
    function getAllValuesFromListView (el) {
      var d = el.querySelector('a-gui-flex-container');
      var meshes = d.__vue__.$data.items.map(v => v.value);
      return meshes;
    }

    // --------------------------------------------
    function createMeshListView (parent, caption, handler, options) {
      var template = `<a-entity class="backPlane"  scale='.25 .25 .25'  gui-mesh-list="caption:${caption}"></a-entity>`;

      var el = createHTML(template);

      parent.appendChild(el);

      // TODO rely on change event again as soon as list-view is fixed
      el.addEventListener('change-todo', handler);

      _.each(options, (v, k) => el.setAttribute(k, v));
    }

    // ------------------------------
    var that = this;
    var lastEl, lastElWireframe, lastElGlow, lastElGlowTimer;
    // FIXME meshlistview will break movement (probably problem with vue and reactiveGetter)
    createMeshListView(el, 'meshes', function (e) {
      lastEl = e.detail.value;

      // opaopa ------------------------
      var meshes = getAllValuesFromListView(el.querySelector('[gui-mesh-list]'));
      console.log('meshes in list', meshes);

      console.log('mesh selected', lastEl);

      // copy orig
      meshes.forEach(mesh => {
        if (!_.has(mesh, 'material._op')) _.set(mesh, 'material._op', _.get(mesh, 'material.opacity', 1));
      });

      // FIXME make all materials transparent
      meshes.forEach(mesh => {
        _.set(mesh, 'material.transparent', true);
      });

      // make other meshes transparent
      meshes.forEach(function (mesh) {
        if (lastEl == mesh) { _.set(mesh, 'material.opacity', _.get(mesh, 'material._op')); } else { _.set(mesh, 'material.opacity', _.get(mesh, 'material._op') * 0.5); }
      });

      // glow ---------------------

      // remove prev glow overlay
      if (namespaceExists('mesh.parent', lastElGlow)) {
        lastElGlow.mesh.parent.remove(lastElGlow.mesh);
      }
      // add new glow overlay
      that.mGlowHelper = lastElGlow = createGlowForMesh(lastEl, lastEl.el.object3D, lastEl.el.sceneEl.camera.el.object3D);

      if (lastElGlowTimer) lastElGlowTimer.pause();
      // update position every now and then (in case mesh is moved)
      lastElGlowTimer = new FPSCtrl(10, function (e) {
        lastElGlow.mesh.position.copy(lastEl.position);
      }).start();

      lastEl.parent.add(lastElGlow.mesh);
    }, {position: '-2 1 0'});

    // ------------------------------

    createColorListView(el, 'body reflect', function (e) {
      if (lastEl) {
        lastEl.material.color = new THREE.Color(e.detail.color);
      } else {
        tires.forEach(function (tireMaterials) {
          // rim aber auch karosserie des autos
          tireMaterials[0].emissive = new THREE.Color(e.detail.color);
        });
      }
    }, {position: '4 6 0'});

    createColorListView(el, 'tires', function (e) {
      if (lastEl) {
        lastEl.material.color = new THREE.Color(e.detail.color);
      } else {
        tires.forEach(function (tireMaterials) {
          // tread aber auch frontblende des autos
          console.log('material', e.details);
          tireMaterials[1].color = new THREE.Color(e.detail.color);
        });
      }
    }, {position: '3 6 0'});

    createMaterialListView(el, 'materials', function (e) {
      console.log('material selected', e.detail, tires);

      if (lastEl) {
        // lastEl.material.copy(e.detail.material);
        lastEl.material = e.detail.material;
      } else {
        tires.forEach(function (tireMaterials) {
          // tires[0] emissiveColor=> rim //aber auch karossierie des autos
          tireMaterials[0].copy(e.detail.material);
        });
      }
    }, {position: '-5 6 0'});
  },
  remove: function () {
    var planes = this.el.querySelectorAll('.backPlane');
    planes.forEach(a => a.parentEl.remove(a));

    this.mHelperScript.stop();

    if (namespaceExists('mesh.parent', this.mGlowHelper)) {
      this.mGlowHelper.mesh.parent.remove(this.mGlowHelper.mesh);
    }
  }

});
