var utils = require('users/aazuspan/geeSharpening:utils');


/**
 * Sharpen the R, G, B, and NIR bands of an image using Brovey sharpening following Zhang & Roy 2016
 * @param {ee.Image} img An image to sharpen.
 * @param {string} redBand The label of the red band.
 * @param {string} greenBand The label of the green band.
 * @param {string} blueBand The label of the blue band.
 * @param {string} nirBand The label of the NIR band.
 * @param {string} pBand The label of the panchromatic band.
 * @param {number=} wRed The proportional weight of the red band.
 * @param {number=} wGreen The proportional weight of the green band.
 * @param {number=} wBlue The proportional weight of the blue band.
 * @return {ee.Image} An image with R, G, B, and NIR bands sharpened to the spatial 
 * resolution of the original panchromatic band.
*/
exports.sharpen = function (img, redBand, greenBand, blueBand, nirBand, pBand, wRed, wGreen, wBlue) {
    var p = img.select(pBand);
    var panProj = p.projection();

    // If any weights are missing, use equal weights
    if ([wRed, wGreen, wBlue].some(utils.isMissing)) {
        wRed = 1 / 3;
        wGreen = 1 / 3;
        wBlue = 1 / 3;
    }

    // Calculate intensity band as sum of the weighted visible bands
    var intensity = utils.calculateWeightedIntensity(img, redBand, greenBand, blueBand, wRed, wGreen, wBlue);
    // Resample the intensity band
    var intensitySharp = intensity.resample().reproject(panProj);

    var bands = [redBand, greenBand, blueBand, nirBand];
    var sharpBands = [];

    // Resample each band and inject pan spatial data
    for (var i = 0; i < bands.length; i++) {
        var band = img.select(bands[i]);
        var sharpBand = band.resample().reproject(panProj);
        sharpBand = sharpBand.divide(intensitySharp).multiply(p);

        sharpBands.push(sharpBand);
    }

    return ee.Image(sharpBands).rename(["Rs", "Gs", "Bs", "NIRs"]);
}