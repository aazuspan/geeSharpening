// Calculate the MSE between the bands of an assesment image and a reference image. 
// Images should have same number of bands, same resolution, and same extent. 
// See Hagag et al 2013.
// Note: MSE is relative to image intensity.
exports.calculateBandMSE = function(referenceImage, assessmentImage) {
    var mse = referenceImage
                .subtract(assessmentImage)
                .pow(2)
                .reduceRegion({reducer: ee.Reducer.mean()});
    
    return mse;
  }
  
  
  // Calculate the cumulative MSE between an assesment image and a reference image. 
  // Images should have same number of bands, same resolution, and same extent. 
  // See Hagag et al 2013, equation 5. To get cumulative image MSE, sum the band MSEs.
  // Note: MSE is relative to image intensity.
  exports.calculate = function(referenceImage, assessmentImage) {
    var bandMSE = exports.calculateBandMSE(referenceImage, assessmentImage);
    
    return ee.Number(bandMSE.values().reduce(ee.Reducer.sum()));
  }