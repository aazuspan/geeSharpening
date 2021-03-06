var mse = require("users/aazuspan/geeSharp:qualityAlgorithms/MSE.js");
var utils = require("users/aazuspan/geeSharp:utils.js");

/**
 * Calculate peak signal noise ratio (PSNR) between a reference image and a
 * modified image. Larger values mean there is less distortion from the
 * reference image to the assessment image.
 *
 * See Hagag et. al., 2013.
 * @param {ee.Image} referenceImage An unmodified image.
 * @param {ee.Image} assessmentImage A version of the reference image that has
 *  been modified, such as through compression or pan-sharpening. PSNR will be
 *  calculated between this image and the reference image.
 * @param {boolean, default false} perBand If true, PSNR will be calculated
 *  band-wise and returned as a list. If false, the average PSNR of all bands
 *  will be calculated and returned as a number.
 * @param {ee.Geometry, default null} geometry The region to calculate PSNR
 *  for.
 * @param {ee.Number, default null} scale The scale, in projection units, to
 *  calculate PSNR at.
 * @param {ee.Number, default 1000000000000} maxPixels The maximum number of
 *  pixels to sample.
 * @return {ee.Number | ee.List} Band average or per-band PSNR for the image,
 *  depending on perBand.
 */
exports.calculate = function (
  referenceImage,
  assessmentImage,
  perBand,
  geometry,
  scale,
  maxPixels
) {
  // Default to returning image average
  if (utils.isMissing(perBand)) {
    perBand = false;
  }

  if (utils.isMissing(maxPixels)) {
    maxPixels = 1e12;
  }

  var maxVal = referenceImage.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: geometry,
    scale: scale,
    maxPixels: maxPixels,
  });

  var bandMSEs = mse.calculate(
    referenceImage,
    assessmentImage,
    true,
    geometry,
    scale,
    maxPixels
  );

  // Zip the gfs and MSEk values to get a list of lists
  var bandVals = maxVal.values().zip(bandMSEs);

  // Map over each band list
  var x = bandVals.map(function (band) {
    var gfs = ee.Number(ee.List(band).get(0));
    var MSEk = ee.Number(ee.List(band).get(1));

    return gfs.divide(MSEk.sqrt());
  });

  // Take the log10 of all band values
  var xLog = ee.Array(
    x.map(function (y) {
      return ee.Number(y).log10();
    })
  );

  var psnr = xLog.multiply(20).toList();

  // If not per band, average all bands
  if (perBand === false) {
    psnr = ee.Number(psnr.reduce(ee.Reducer.mean()));
  }

  return psnr;
};
