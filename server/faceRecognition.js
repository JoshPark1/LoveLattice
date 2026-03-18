const path = require('path');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');

// Patch nodejs environment for face-api
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function loadModels() {
    if (modelsLoaded) return;
    const modelPath = path.join(__dirname, 'node_modules', '@vladmandic', 'face-api', 'model');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    modelsLoaded = true;
}

async function fetchImageBuffer(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per retry
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const arrayBuffer = await res.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (e) {
            console.log(`[FACE-API] Image fetch attempt ${i + 1} failed: ${e.message}`);
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

async function getFaceDescriptors(imageSource, single = true) {
    let img;
    if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
        const buffer = await fetchImageBuffer(imageSource);
        img = await canvas.loadImage(buffer);
    } else {
        img = await canvas.loadImage(imageSource);
    }

    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 });
    
    if (single) {
        const detection = await faceapi.detectSingleFace(img, options).withFaceLandmarks().withFaceDescriptor();
        return detection ? [detection.descriptor] : [];
    } else {
        const detections = await faceapi.detectAllFaces(img, options).withFaceLandmarks().withFaceDescriptors();
        return detections.map(d => d.descriptor);
    }
}

async function compareFaces(referencePhotoPath, storyImageUrl) {
    try {
        await loadModels();

        // 1. Get reference descriptor (we only need the best face from the reference photo)
        const refDescriptors = await getFaceDescriptors(referencePhotoPath, true);
        if (refDescriptors.length === 0) {
            console.log("[FACE-API] No face detected in reference photo:", referencePhotoPath);
            return { match: false, distance: null, error: "No face in reference" };
        }
        const refDescriptor = refDescriptors[0];

        // 2. Get ALL story descriptors (it might be a group photo)
        const storyDescriptors = await getFaceDescriptors(storyImageUrl, false);
        if (storyDescriptors.length === 0) {
            return { match: false, distance: null, error: "No face in story" };
        }

        // 3. Compare all faces in the story against the reference
        let bestDistance = Infinity;
        for (const storyDescriptor of storyDescriptors) {
            const distance = faceapi.euclideanDistance(refDescriptor, storyDescriptor);
            if (distance < bestDistance) {
                bestDistance = distance;
            }
        }

        // Threshold 0.5 prevents false positives on visually similar faces (like the 0.55 distance found)
        const isMatch = bestDistance < 0.5;
        return { match: isMatch, distance: bestDistance };
    } catch (e) {
        console.error("[FACE-API] Image processing error:", e);
        return { match: false, error: e.message };
    }
}

module.exports = { compareFaces };
