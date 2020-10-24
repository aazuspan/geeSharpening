var utils = require('users/aazuspan/geeSharpening:utils');


/**
 * Sharpen all bands of an image by converting it to principal components,
 * rescaling a panchromatic band to match the first principal component,
 * swapping the high-resolution panchromatic band for the first principal
 * component, and inverting the transformation to create a high-resolution
 * multispectral image.
 * @param {ee.Image} img An image to sharpen.
 * @param {ee.Image} pBand An single-band panchromatic image.
 * @param {number} substitutePC The number of the principal component to
 *  replace with the pan band. Defaults to 1. Must be in range 1 - n,
 *  where n is the number of bands in the input image.
 * @param {boolean} matchPan If true, the mean and standard deviation of
 *  the pan band will be matched to the mean and standard deviation of the
 *  substituted PC. If false, the range will be matched instead. Defaults
 *  to true.
 * @return {ee.Image} An image sharpened to the spatial resolution of the 
 * panchromatic image.
*/
exports.sharpen = function (img, pan, substitutePC, matchPan) {
    // Default to substituting the first PC
    if (utils.isMissing(substitutePC)) {
        substitutePC = 1;
    }
    // Default to matching mean and standared deviation of the pan band
    if (utils.isMissing(matchPan)) {
        matchPan = true;
    }

    // Resample the image to the panchromatic resolution
    img = img.resample("bilinear")
    img = img.reproject(pan.projection())

    // Store band names for future use
    var bandNames = img.bandNames();
    var panBand = pan.bandNames().get(0);

    // Mean-center the images to allow efficient covariance calculation
    var imgMean = utils.reduceImage(img, ee.Reducer.mean());

    var imgCentered = img.subtract(imgMean);

    // Convert image to 1D array
    var imgArray = imgCentered.toArray();

    // Calculate a covariance matrix between all bands
    var covar = imgArray.reduceRegion({
        reducer: ee.Reducer.centeredCovariance(),
        geometry: imgCentered.geometry(),
        scale: imgCentered.projection().nominalScale(),
        maxPixels: 1e9
    });

    // Pull out the covariance results as an array
    var covarArray = ee.Array(covar.get("array"));

    // Calculate eigenvalues and eigenvectors
    var eigens = covarArray.eigen();

    // Pull out eigenvectors (elements after eigenvalues in each list) [7x7]
    var eigenVectors = eigens.slice(1, 1);

    // Convert image to 2D array
    var imgArray2d = imgArray.toArray(1);

    // Build the names of the principal component bands  
    var pcSeq = ee.List.sequence(1, bandNames.length());
    var pcNames = pcSeq.map(function (x) {
        return ee.String("PC").cat(ee.Number(x).int());
    });

    var principalComponents = ee.Image(eigenVectors)
        .matrixMultiply(imgArray2d)
        // Flatten unnecessary dimension
        .arrayProject([0])
        // Split into a multiband image
        .arrayFlatten([pcNames]);

    // I'm not sure why this is required. I haven't seen anything about
    // inverting the pan band in the literature. But if this isn't done,
    // lighting is reversed. If you compare the first PC with the pan,
    // you'll notice that their lighting looks reversed, which is the
    // only reason I tried this.
    pan = pan.multiply(-1)

    // Rescale the pan band to more closely match the substituted PC
    pan = utils.rescaleBand(pan, principalComponents.select(substitutePC - 1), matchPan);

    // Build the band list, swapping the pan band for the appropriate PC
    var sharpenBands = pcNames.set(substitutePC - 1, panBand);

    principalComponents = principalComponents.addBands(pan);
    principalComponents = principalComponents.select(sharpenBands);

    // Undo the PC transformation
    var reconstructedCentered = ee.Image(eigenVectors)
        .matrixSolve(principalComponents.toArray().toArray(1))
        .arrayProject([0])
        .arrayFlatten([bandNames])

    // Undo the mean-centering
    var reconstructed = reconstructedCentered.add(imgMean);

    return reconstructed;
}