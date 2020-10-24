var sharpening = require('users/aazuspan/geeSharpening:sharpening');


var img = l8
    .filterBounds(extent)
    .sort("CLOUD_COVER")
    .first()
    .clip(extent);


var brov = sharpening.brovey.sharpen(img, "B4", "B3", "B2", "B5", "B8", 0.52, 0.25, 0.23);
var simpleMean = sharpening.simpleMean.sharpen(img, "B4", "B3", "B2", "B8");
var ihs = sharpening.IHS.sharpen(img, "B4", "B3", "B2", "B8");
var pca = sharpening.PCA.sharpen(img.select(["B2", "B3", "B4"]), img.select(["B8"]), 1, true);


Map.addLayer(img, { bands: ["B4", "B3", "B2"], min: 0, max: 0.4 }, "L8");
Map.addLayer(brov, { min: 0, max: 0.4 }, "Brovey")
Map.addLayer(simpleMean, { min: 0, max: 0.4 }, "SimpleMean")
Map.addLayer(ihs, { min: 0, max: 0.4 }, "IHS")
Map.addLayer(pca, { bands: ["B4", "B3", "B2"], min: 0, max: 0.4 }, "PCA")