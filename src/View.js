import dat from 'dat.gui';

function round(number, decimals){
  let factor = Math.pow(10, decimals)
  return Math.round(number*factor) / factor
}

class View {

  constructor ( colormapList, blendMethods ) {
    this._guiControllers = new dat.GUI({ width: 400 } )
    this._guiDeleteController = null
    this._colormapList = colormapList
    this._blendMethods = blendMethods
    this._initDatgui()
    this._initSliders()


    this._events = {
      addingFile: null,
      useSliders: null,
      volumeDisplay: null,
      volumeContrast: null,
      volumeBrightness: null,
      volumeColormap: null,
      volumeBlendingMethod: null,
      volumeBlendingRatio: null,
      planePositionReset: null,
      planeRotationReset: null,
      volumeTime: null
    }
  }


  on (eventName, eventCb) {
    if ((eventName in this._events) && (typeof eventCb === 'function')){
      this._events[ eventName ] = eventCb
    }
  }


  _callEvent (eventName, args) {
    if (this._events[eventName]) {
      return this._events[eventName](...args)
    }
  }


  _initCanvas () {
    let canvas = document.createElement('canvas')
    canvas.id = "renderCanvas"
    var body = document.getElementsByTagName("body")[0]
    body.appendChild(canvas)
    return canvas
  }


  _initDatgui () {
    let that = this

    function openFile (n) {
      console.log("OPEN FILE");
      // dynamically create a file input dialog that we dont even bther adding to the DOM
      //let fileInput = document.createElement('input')
      //fileInput.type='file'
      let fileInput = document.getElementById('fileInput')
      fileInput.addEventListener('change', function(e) {
        var file = e.target.files.length ? e.target.files[0] : null
        if (file) {
          //volumeCollection.addVolumeFromFile( file )
          that._callEvent('addingFile', [file, n])
        } else {
          alert('Did you really select a file?')
        }
      })
      fileInput.click()
    }

    function openFilePrimary () {openFile(0)}
    function openFileSecondary () {openFile(1)}

    // add a volume button
    this._guiControllers.add({openFile: openFilePrimary}, 'openFile').name("Add Primary Volume")
    this._guiControllers.add({openFile: openFileSecondary}, 'openFile').name("Add Secondary Volume")


    let primaryGroup = this._guiControllers.addFolder('Primary Volume')
    primaryGroup.add({display: true}, 'display')
      .name('Display Volume')
      .onChange(function(val){
        that._callEvent('volumeDisplay', [val, 0])
      })

    primaryGroup.add({contrast: 1}, 'contrast').min(0.5).max(3).step(0.1)
      .name('Contrast')
      .onChange(function(val){
        that._callEvent('volumeContrast', [val, 0])
      })

    primaryGroup.add({brightness: 0}, 'brightness').min(-1).max(1).step(0.01)
      .name('Brightness')
      .onChange(function(val){
        that._callEvent('volumeBrightness', [val, 0])
      })

    primaryGroup.add({colormaps: 'greys'}, 'colormaps', this._colormapList )
      .name('Colormap')
      .onChange(function(val){
        that._callEvent('volumeColormap', [val, 0])
      })

    this._timeControllerPrimary = primaryGroup.add({time: 0}, 'time').min(0).max(0).step(1)
      .name('Time')
      .onChange(function(val){
        that._callEvent('volumeTime', [val, 0])
      })


    let secondaryGroup = this._guiControllers.addFolder('Secondary Volume')
    secondaryGroup.add({display: true}, 'display')
      .name('Display Volume')
      .onChange(function(val){
        that._callEvent('volumeDisplay', [val, 1])
      })

    secondaryGroup.add({contrast: 1}, 'contrast').min(0.5).max(3).step(0.1)
      .name('Contrast')
      .onChange(function(val){
        that._callEvent('volumeContrast', [val, 1])
      })

    secondaryGroup.add({brightness: 0}, 'brightness').min(-1).max(1).step(0.01)
      .name('Brightness')
      .onChange(function(val){
        that._callEvent('volumeBrightness', [val, 1])
      })

    secondaryGroup.add({colormaps: 'greys'}, 'colormaps', this._colormapList )
      .name('Colormap')
      .onChange(function(val){
        that._callEvent('volumeColormap', [val, 1])
      })

    this._timeControllerSecondary = secondaryGroup.add({time: 0}, 'time').min(0).max(0).step(1)
      .name('Time')
      .onChange(function(val){
        that._callEvent('volumeTime', [val, 1])
      })

      console.log( this._timeControllerSecondary);

    let blendingGroup = this._guiControllers.addFolder('Blending')
    blendingGroup.add({method: 'ratio'}, 'method', this._blendMethods )
      .name('Method')
      .onChange(function(val){
        console.log( val);
        that._callEvent('volumeBlendingMethod', [val])
      })

    blendingGroup.add({ratio: 0.5}, 'ratio').min(0).max(1).step(0.01)
      .name('Ratio')
      .onChange(function(val){
        that._callEvent('volumeBlendingRatio', [val])
      })

    let orthoPlanesGroup = this._guiControllers.addFolder('Ortho Planes')
    this._orthoPlanePosition = orthoPlanesGroup.add({position: '0, 0, 0'}, 'position')
      .name('Position')
      /*
      .onFinishChange(function(val){
        console.log( val);
        that._callEvent('volumeBlendingMethod', [val])
      })
      */

    function resetPosition () {
      that._callEvent('planePositionReset', [])
    }

    function resetRotation () {
      that._callEvent('planeRotationReset', [])
    }

    orthoPlanesGroup.add({resetPos: resetPosition}, 'resetPos').name("Reset Position")

    this._orthoPlaneRotation = orthoPlanesGroup.add({rotation: '0, 0, 0'}, 'rotation')
      .name('Rotation (rad)')

    orthoPlanesGroup.add({resetRot: resetRotation}, 'resetRot').name("Reset Rotation")
  }

  _initSliders () {
    let that = this
    let sliders = document.querySelectorAll('.staticSlider')
    let cursorPosition = 0
    let sliderDown = false

    sliders.forEach(function(slider){
      slider.addEventListener('mousedown', function(e){
        //console.log(e);
        sliderDown = true
        cursorPosition = e.screenX
      })
      slider.addEventListener('mouseup', function(e){
        //console.log(e);
        sliderDown = false
      })
      slider.addEventListener('mousemove', function(e){
        //console.log(e);
        if (!sliderDown)
          return

        let d = e.screenX - cursorPosition
        cursorPosition = e.screenX

        //slide(d, e.target.id)
        that._callEvent('useSliders', [d, e.target.id])
      })
    })

    /*
    function slide (d, source) {
      console.log(source, d)
    }
    */
  }

  setColormapList (list) {
    this._colormapList = list
  }

  updatePositionInfo (p) {
    this._orthoPlanePosition.object.position = round(p.x, 3) + ', ' + round(p.y, 3) + ', ' + round(p.z, 3)
    this._orthoPlanePosition.updateDisplay()
  }


  updateRotatationInfo (p) {
    this._orthoPlaneRotation.object.rotation = round(p.x, 3) + ', ' + round(p.y, 3) + ', ' + round(p.z, 3)
    this._orthoPlaneRotation.updateDisplay()
  }


  updateMaxTime (slot, t) {
    if(slot === 0){
      this._timeControllerPrimary.max(t).updateDisplay()
    }else if(slot === 1){
      this._timeControllerSecondary.max(t).updateDisplay()
    }
  }

}

export { View }
