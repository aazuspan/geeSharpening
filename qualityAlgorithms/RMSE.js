var mse = require("users/aazuspan/geeSharpening:qualityAlgorithms/MSE");
var utils = require("users/aazuspan/geeSharpening:utils");

// Calculate the RMSE between an assesment image and a reference image.
// Images should have same number of bands, same resolution, and same extent.
// If not perBand, the mean RMSE of all bands is returned, not the sum of all RMSE.
// See Hagag et al 2013, equation 5.
// Note: MSE is relative to image intensity.
exports.calculate = function (referenceImage, assessmentImage, perBand) {
  // Default to returning image average
  if (utils.isMissing(perBand)) {
    perBand = false;
  }

  var mseBands = mse.calculate(referenceImage, assessmentImage, true);

  var rmse = ee.Array(mseBands).sqrt().toList();

  // If not per band, average all bands
  if (perBand === false) {
    rmse = ee.Number(rmse.reduce(ee.Reducer.mean()));
  }

  return rmse;
};