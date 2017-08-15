'use strict';

module.exports = class {
    constructor(referenceColors) {
        this.setReferenceColors(referenceColors);
    }

    normalizeColorArray(pColor) {
        // Ensure each color value is en array [ R, G, B, A ]
        // 'A' may be missing. If so, add a 100% alpha value
        if (Array.isArray(pColor)) {
            // Copy the color to avoid modify the provided value
            let color = pColor.slice();
            if (color.length < 4) {
                color.push(1);
            }
            if (color.length === 4) {
                return color;
            }
        }

        return false;
    }

    setReferenceColors(referenceColors) {
        this.referenceColors = {};

        for (let [name, color] of Object.entries(referenceColors)) {
            color = this.normalizeColorArray(color);
            if (color !== false) {
                this.referenceColors[name] = color
            }
        }
    }

    findNearest(color) {
        color = this.normalizeColorArray(color);

        if (color === false) {
            return color;
        }

        // Find the nearest color from referenceColors
        let nearestDistance = Number.MAX_SAFE_INTEGER;
        let nearestColor = false;
        for (let [name, test] of Object.entries(this.referenceColors)) {
            let distance = this.colorDistance(color, test);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestColor = name;
            }
        }

        return nearestColor;
    }

    /**
     * Euclidian distance between 2 colors, using R/G/B/A as 4 dimension
     *
     *
     * @param c1 array of 4
     * @param c2
     * @returns {boolean}
     */
    colorDistance(c1, c2) {
        c1 = this.normalizeColorArray(c1);
        c2 = this.normalizeColorArray(c2);

        if (c1 === false || c2 === false) {
            return false;
        }

        // Alpha value, which is normally a float between 0 and 1, sbould be normalized to 0-255 range
        c1[3] *= 255;
        c2[3] *= 255;

        let euclidianSum = 0;
        for (let i = 0; i < 4; i++) {
            euclidianSum += Math.pow(c2[i] - c1[i], 2);
        }

        return Math.sqrt(euclidianSum);
    }
};
