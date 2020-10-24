/**
 * Sharpen the R, G, and B bands of an image using IHS.
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
    var imgHsv = img.select([redBand, greenBand, blueBand]).rgbToHsv();

    // Replace the value band with the pan band and convert back to RGB
    var imgRgb = imgHsv
        .addBands([p])
        .select(["hue", "saturation", pBand])
        .hsvToRgb();

    return imgRgb;
}