import Component from '../../ts/engine/Component';
import DebugComponent from '../../ts/components/DebugComponent';
import Scene from '../../ts/engine/Scene';
import { PixiRunner } from '../../ts/PixiRunner'
import { PIXICmp } from '../../ts/engine/PIXIObject';
import Msg from '../../ts/engine/Msg';

/**
 * Structure for gradients
 */
class Grad {
    x = 0;
    y = 0;
    z = 0;

    constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }

    dot2(x, y) {
        return this.x * x + this.y * y;
    };

    dot3(x, y, z) {
        return this.x * x + this.y * y + this.z * z;
    };

}

class PerlinNoise {

    constructor() {
        this.seed(0);
    }

    grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];

    // table of periods
    p = [151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
    // To remove the need for index wrapping, double the permutation table length
    perm = new Array(512);
    gradP = new Array(512);

    // supports 2^16 different seed values
    seed(seed) {
        if (seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }

        seed = Math.floor(seed);
        if (seed < 256) {
            seed |= seed << 8;
        }

        for (var i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = this.p[i] ^ (seed & 255);
            } else {
                v = this.p[i] ^ ((seed >> 8) & 255);
            }

            this.perm[i] = this.perm[i + 256] = v;
            this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
        }
    };

    // Skewing and unskewing factors for 2, 3, and 4 dimensions
    F2 = 0.5 * (Math.sqrt(3) - 1);
    G2 = (3 - Math.sqrt(3)) / 6;

    F3 = 1 / 3;
    G3 = 1 / 6;


    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }

    // 2D Perlin Noise
    perlin2(x, y) {
        // Find unit grid cell containing point
        var X = Math.floor(x), Y = Math.floor(y);
        // Get relative xy coordinates of point within that cell
        x = x - X; y = y - Y;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; Y = Y & 255;

        // Calculate noise contributions from each of the four corners
        var n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
        var n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
        var n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
        var n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);

        // Compute the fade curve value for x
        var u = this.fade(x);

        // Interpolate the four results
        return this.lerp(
            this.lerp(n00, n10, u),
            this.lerp(n01, n11, u),
            this.fade(y));
    };


    // calculates perlin noise at specified coordinates, returns value between -1 and 1
    calcPoint(x: number, y: number, persistence: number, octaves: number, zoom: number) {
        // total output noise value
        let total = 0.0;
        // initial frequency
        let frequency = 1/zoom;
        // initial amplitude
        let amplitude = 1.0;

        // for each octave
        for (let i = 0; i < octaves; i++) {
            total = total + this.perlin2(x * frequency, y * frequency) * amplitude;
            // set frequency and amplitude
            frequency = frequency * 2;
            // decrease amplitude
            amplitude = amplitude * persistence;
        }

        // fix bound values
        if (total < -1) total = -1;
        if (total > 1) total = 1;
        return total;

    }

    calcPlane(bitmap: ImageData, width: number, height: number, persistence: number, octaves: number, zoom: number, scale: number) {
        // for each pixel, generate its perlin value and write it into RGB channel
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                let val = this.calcPoint(Math.floor(i / scale), Math.floor(j / scale), persistence, octaves, zoom);
                let colorVal = (val + 1) * 127; // scale to 0-255

                // grayscale
                bitmap.data[(i + j * width) * 4 + 3] = 255; // alpha
                bitmap.data[(i + j * width) * 4 + 2] = colorVal; // blue
                bitmap.data[(i + j * width) * 4 + 1] = colorVal; // green
                bitmap.data[(i + j * width) * 4 + 0] = colorVal; // red
            }
        }
    }
}

class PerlinNoiseDemo {

    constructor() {
        let canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        let width = canvas.width;
        let height = canvas.height;

        // perlin noise configurations
        let persistence = 0.8;
        let octaves = 4; // number of iterations
        let zoom = 6;
        let scale = 16; // size of one noise-pixel

        let context =canvas.getContext("2d");
        // allocate bitmap
        let imageData = context.createImageData(width, height);
        // init perlin generator
        let perlin = new PerlinNoise();
        // calculate noise
        perlin.calcPlane(imageData, width, height, persistence, octaves, zoom, scale);
        // draw directly onto the canvas
        context.putImageData(imageData, 0, 0);
    }
}

new PerlinNoiseDemo();
