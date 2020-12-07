var mse = require("users/aazuspan/geeSharpening:qualityAlgorithms/MSE");
var utils = require("users/aazuspan/geeSharpening:utils");

// Relative average sepctral error (RASE). Vaiopoulos 2011. Values close to 0 are good.
exports.calculate = function (referenceImage, assessmentImage, perBand) {
  // Default to returning image average
  if (utils.isMissing(perBand)) {
    perBand = false;
  }

  var mseBands = ee
    .Array(mse.calculate(referenceImage, assessmentImage, true))
    .sqrt();

  // Calculate the mean of each band, then the mean of the means
  var xbar = referenceImage
    .reduceRegion(ee.Reducer.mean())
    .values()
    .reduce(ee.Reducer.mean());

  var rase = mseBands.multiply(100).divide(xbar).toList();

  // If not per band, average all bands
  if (perBand === false) {
    rase = ee.Number(rase.reduce(ee.Reducer.mean()));
  }

  return rase;
};