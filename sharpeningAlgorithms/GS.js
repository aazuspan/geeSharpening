var utils = require('users/aazuspan/geeSharpening:utils');


/**
 * Calculate the next Gram-Schmidt transformed image given a list of previous
 * Gram-Schmidt transformed images. See Equation 1 of Hallabia et al 2014.
 * @param {ee.Image} ms A multispectral image.
 * @param {ee.List} gsList A list of Gram-Schmidt transformed images.
 */
function calculateGs(ms, gsList) {
    // Get the previous GS
    var previous = ee.Image(ee.List(gsList).get(-1));

    // Calculate coefficient g between MS and previous GS
    var g = calculateGsCoefficient(ms, previous);
    var gsNew = ms.subtract(g);

    // Return the list with the new GS image added
    return ee.List(gsList).add(gsNew);
}


/**
 * Calculate the Gram-Schmidt coefficient g. See Equation 2 in Hallabia et al
 * 2014. 
 * @param {ee.Image} ms A multispectral image.
 * @param {ee.Image} gs A Gram-Schmidt transformed image.
 */
function calculateGsCoefficient(ms, gs) {
    var imgArray = ee.Image.cat(ms, gs).toArray();

    var covarMatrix =  imgArray.reduceRegion({
                        reducer: ee.Reducer.covariance(),
                        geometry: ms.geometry(),
                        scale: ms.projection().nominalScale(),
                        maxPixels: 1e9
    });

    var covarArray = ee.Array(covarMatrix.get("array"));

    var covar = covarArray.get([0, 1]);
    var variance = covarArray.get([1, 1]);

    var g = covar.divide(variance);

    return ee.Image.constant(g);
}


/**
 * Sharpen all bands of an image using the Gram-Schmidt orthonormalization
 * process, following Hallabia et al 2014.
 * @param {ee.Image} img An image to sharpen.
 * @param {ee.Image} pan An single-band panchromatic image.
 * @return {ee.Image} The input image with all bands sharpened to the spatial 
 *  resolution of the panchromatic band.
*/
exports.sharpen = function(img, pan) {
    // Resample multispectral bands to pan resolution
    img = img.resample("bilinear").reproject({
        crs: pan.projection(), 
        scale: pan.projection().nominalScale()
    });

    // Calculate panSim as a mean of the MS bands
    var panSim = img.reduce({reducer: ee.Reducer.mean()});

    // GS1 image is the panSim 
    var gsList = ee.List([
        panSim
    ]);

    // Convert the multispectral bands to an image collection so that it can be iterated over
    var msCollection = utils.multibandToCollection(img);

    // Iterate over the MS collection, calculating GS bands
    var gsCollection = ee.ImageCollection(ee.List(msCollection.iterate(calculateGs, gsList)));

    // Convert the GS collection to a multiband image
    var gsBands = gsCollection.toBands();

    // Histogram match the pan band to the simulated pan band
    var panMatch = utils.linearHistogramMatch(pan, panSim);

    // Swap the matched pan band for the first GS band
    gsBands = ee.Image.cat(panMatch, gsBands.slice(1));

    // Spatial detail is the difference between the matched pan band and the simulated pan band
    var detail = panMatch.subtract(panSim);

    // Convert GS bands to an image collection so that it can be mapped over
    var gsBandImages = utils.multibandToCollection(gsBands);

    // Calculate constant g coefficients for each gsBand
    var gCoefficients = gsBandImages.map(function(x) {return calculateGsCoefficient(x, panSim)});

    // Sharpen the multispectral bands using g coefficients and pan detail
    var sharpBands = img.add(gCoefficients.toBands().slice(1).multiply(detail));

    return sharpBands;
}