import quickvoxelcore from 'quickvoxelcore/dist/quickvoxelcore.es6.js'
import { View } from './View.js'

class Quickgui {

  constructor () {
    this._qvcore = new quickvoxelcore.QuickvoxelCore( document.getElementById('renderCanvas') )
    this._volumeCollection = this._qvcore.getVolumeCollection()
    this._renderEngine = this._qvcore.getRenderEngine()
    this._view = new View(
      this._renderEngine.getListOfColormaps(),
      this._renderEngine.getBlendMethodList()
    )

    this._slotToAddFileTo = -1

    this._initEvents()
  }

  _initEvents () {
    let that = this

    this._view.on('addingFile', function(file, slotIndex){
      that._volumeCollection.addVolumeFromFile( file )
      that._slotToAddFileTo = slotIndex
    })

    this._view.on("useSliders", function(distance, sliderId){
      let axis = sliderId[0].toUpperCase()

      // this is a translation
      if (sliderId.indexOf('Translate') >= 0){
        let adaptedDistance = distance / 5
        that._renderEngine['translateAlong' + axis + 'Dominant'](adaptedDistance)
        that._view.updatePositionInfo( that._renderEngine.getPosition() )

      // this is a rotation
      } else if (sliderId.indexOf('Rotate') >= 0){
        let adaptedAngle = distance / 100
        that._renderEngine['rotateAround' + axis + 'Dominant'](adaptedAngle)

        that._view.updateRotatationInfo( that._renderEngine.getPlaneSystemEulerAngle() )

      }
    })

    this._view.on("volumeDisplay", function(display, slotIndex){
      that._renderEngine.displayVolumeSlotN(slotIndex, display)
    })

    this._view.on("volumeContrast", function(contrastVal, slotIndex){
      that._renderEngine.setContrastSlotN(slotIndex, contrastVal)
    })

    this._view.on("volumeBrightness", function(brightnessVal, slotIndex){
      that._renderEngine.setBrightnessSlotN(slotIndex, brightnessVal)
    })

    this._view.on("volumeColormap", function(colormap, slotIndex){
      that._renderEngine.setColormapSlotN(slotIndex, colormap)
    })

    this._view.on("volumeBlendingMethod", function(method){
      that._renderEngine.setBlendMethod(method)
    })

    this._view.on("volumeBlendingRatio", function(ratio){
      that._renderEngine.setBlendingRatio(ratio)
    })

    this._view.on("planePositionReset", function(){
      that._renderEngine.resetPosition()
      that._view.updatePositionInfo( that._renderEngine.getPosition() )
    })


    this._view.on("planeRotationReset", function(){
      that._renderEngine.setPlaneSystemEulerAngle(0, 0, 0)
      that._view.updateRotatationInfo( that._renderEngine.getPlaneSystemEulerAngle() )
    })

    this._view.on("volumeTime", function(time, slotIndex){
      if (that._renderEngine.isSlotTakenN(slotIndex))
        that._renderEngine.setTimeIndexSlotN(slotIndex, time)
    })





    // mount the volume when it's ready!
    that._volumeCollection.on("volumeReady", function(volume){
      // this should not happen, but we are never too safe
      if (that._slotToAddFileTo === -1)
        return

      that._renderEngine.mountVolumeN( that._slotToAddFileTo, volume )
      that._view.updateMaxTime(that._slotToAddFileTo, volume.getTimeLength()-1 )
    })





    // If a volume fails at opening
    that._volumeCollection.on("errorAddingVolume", function(v){
      alert("Could not open this file.")
    })

    // If a volume fails at opening
    that._volumeCollection.on("volumeRemoved", function(removedVolumeId){
      let volumeIds = that._volumeCollection.getVolumeIds()
      that._view.updateVolumeList( volumeIds )
      alert("The volume " + id + " just go removed.")

    })


  }

}

export { Quickgui }
