import Vue from 'vue'

import {
  getRatio,
  getModel,
  SliderMixin
} from './slider-utils.js'

import { between } from '../../utils/format.js'
import { stopAndPrevent } from '../../utils/event.js'

export default Vue.extend({
  name: 'QSlider',

  mixins: [ SliderMixin ],

  props: {
    value: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      model: this.value,
      curRatio: (this.value - this.min) / (this.max - this.min)
    }
  },

  watch: {
    value (v) {
      this.model = between(v, this.min, this.max)
    },

    min (v) {
      this.model = between(this.model, v, this.max)
    },

    max (v) {
      this.model = between(this.model, this.min, v)
    }
  },

  computed: {
    ratio () {
      return this.active === true ? this.curRatio : this.modelRatio
    },

    modelRatio () {
      return (this.model - this.min) / (this.max - this.min)
    },

    trackStyle () {
      return { width: (100 * this.ratio) + '%' }
    },

    thumbStyle () {
      return { left: (100 * this.ratio) + '%' }
    },

    thumbClass () {
      return this.preventFocus === false && this.focus === true ? 'q-slider--focus' : null
    },

    events () {
      if (this.editable) {
        return this.$q.platform.is.mobile
          ? { click: this.__mobileClick }
          : {
            mousedown: this.__activate,
            focus: this.__focus,
            blur: this.__blur,
            keydown: this.__keydown,
            keyup: this.__keyup
          }
      }
    }
  },

  methods: {
    __updateValue (change) {
      if (this.model !== this.value) {
        this.$emit('input', this.model)
        change === true && this.$emit('change', this.model)
      }

      if (change === true) {
        this.curRatio = (this.model - this.min) / (this.max - this.min)
      }
    },

    __getDragging () {
      return this.$el.getBoundingClientRect()
    },

    __updatePosition (event, dragging = this.dragging) {
      const ratio = getRatio(
        event,
        dragging,
        this.$q.i18n.rtl
      )

      this.curRatio = ratio
      this.model = getModel(ratio, this.min, this.max, this.step, this.decimals)
    },

    __focus () {
      this.focus = true
    },

    __keydown (evt) {
      if (![37, 40, 39, 38].includes(evt.keyCode)) {
        return
      }

      stopAndPrevent(evt)

      const
        step = (evt.ctrlKey ? 10 : 1) * this.computedStep,
        offset = [37, 40].includes(evt.keyCode) ? -step : step

      let model = this.model + offset

      if (this.decimals) {
        model = parseFloat(model.toFixed(this.decimals))
      }

      this.model = between(model, this.min, this.max)
      this.__updateValue()
    }
  },

  render (h) {
    return h('div', {
      staticClass: 'q-slider',
      attrs: {
        role: 'slider',
        'aria-valuemin': this.min,
        'aria-valuemax': this.max,
        'aria-valuenow': this.value,
        'data-step': this.step,
        'aria-disabled': this.disable,
        tabindex: this.computedTabindex
      },
      'class': this.classes,
      on: this.events,
      directives: this.editable ? [{
        name: 'touch-pan',
        value: this.__pan,
        modifiers: {
          horizontal: true,
          prevent: true,
          stop: true
        }
      }] : null
    }, [
      h('div', { staticClass: 'q-slider__track-container absolute overflow-hidden' }, [
        h('div', {
          staticClass: 'q-slider__track absolute-full',
          style: this.trackStyle
        }),

        this.markers === true
          ? h('div', {
            staticClass: 'q-slider__track-markers absolute-full fit',
            style: this.markerStyle
          })
          : null
      ]),

      h('div', {
        staticClass: 'q-slider__thumb-container absolute non-selectable',
        'class': this.thumbClass,
        style: this.thumbStyle
      }, [
        h('svg', {
          staticClass: 'q-slider__thumb absolute',
          attrs: { width: '21', height: '21' }
        }, [
          h('circle', {
            attrs: {
              cx: '10.5',
              cy: '10.5',
              r: '7.875'
            }
          })
        ]),

        this.label === true || this.labelAlways === true ? h('div', {
          staticClass: 'q-slider__pin absolute flex flex-center'
        }, [
          h('span', { staticClass: 'q-slider__pin-value-marker' }, [ this.model ])
        ]) : null,

        h('div', { staticClass: 'q-slider__focus-ring' })
      ])
    ])
  }
})
