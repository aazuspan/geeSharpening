/**
 * Sharpen the R, G, and B bands of an image using a simple mean.
 * @param {ee.Image} img An image to sharpen.
 * @param {string} redBand The label of the red band.
 * @param {string} greenBand The label of the green band.
 * @param {string} blueBand The label of the blue band.
 * @param {string} pBand The label of the panchromatic band.
 * @return {ee.Image} An image with R, G, and B bands sharpened to the spatial 
 * resolution of the original panchromatic band.
*/
exports.sharpen = function (img, redBand, greenBand, blueBand, pBand) {
    var p = img.select(pBand);
    var panProj = p.projection();

    var bands = [redBand, greenBand, blueBand];
    var sharpBands = [];

    for (var i = 0; i < bands.length; i++) {
        var band = img.select(bands[i]);

        var sharpBand = band.resample().reproject(panProj);
        sharpBand = sharpBand.add(p).multiply(0.5);

        sharpBands.push(sharpBand);
    }


    return ee.Image(sharpBands).rename(["Rs", "Gs", "Bs"]);
}