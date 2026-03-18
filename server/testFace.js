const path = require('path');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const fs = require('fs');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function loadModels() {
    console.log("Loading models...");
    const modelPath = path.join(__dirname, 'node_modules', '@vladmandic', 'face-api', 'model');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    console.log("Models loaded.");
}

async function runDemo(refPath, targetPath, outputPath) {
    await loadModels();

    console.log(`Loading reference image: ${refPath}`);
    const refImg = await canvas.loadImage(refPath);
    const optionsRef = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 });
    const refDetection = await faceapi.detectSingleFace(refImg, optionsRef).withFaceLandmarks().withFaceDescriptor();
    if (!refDetection) {
        console.error("No face detected in reference image!");
        return;
    }
    const refDescriptor = refDetection.descriptor;
    console.log("Reference face processed.");

    console.log(`Loading target image: ${targetPath}`);
    const targetImg = await canvas.loadImage(targetPath);

    console.log("Detecting all faces in target image...");
    // Lowering the minConfidence from default 0.5 to 0.1 to catch harder-to-detect faces (shadows/angles/hair)
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 });
    const targetDetections = await faceapi.detectAllFaces(targetImg, options).withFaceLandmarks().withFaceDescriptors();

    console.log(`Found ${targetDetections.length} face(s) in target image.`);

    // Create a new canvas to draw the output
    const outCanvas = canvas.createCanvas(targetImg.width, targetImg.height);
    const ctx = outCanvas.getContext('2d');
    ctx.drawImage(targetImg, 0, 0);

    targetDetections.forEach((detection, i) => {
        const distance = faceapi.euclideanDistance(refDescriptor, detection.descriptor);
        const isMatch = distance < 0.5; // 0.6 is confidence threshold

        const box = detection.detection.box;

        // Draw bounding box
        ctx.strokeStyle = isMatch ? '#00FF00' : '#FF0000'; // Green if match, Red if not
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw text background
        ctx.fillStyle = isMatch ? '#00FF00' : '#FF0000';
        const text = isMatch ? `MATCH! (${distance.toFixed(2)})` : `No match (${distance.toFixed(2)})`;
        ctx.font = '24px Arial';
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(box.x, box.y - 30, textWidth + 10, 30);

        // Draw text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, box.x + 5, box.y - 5);

        console.log(`Face ${i + 1}: Distance ${distance.toFixed(2)} - ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    });

    // Save the image
    const outBuffer = outCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(outputPath, outBuffer);
    console.log(`\nDemo completed! Output saved to: ${outputPath}`);
}

const refPic = process.argv[2];
const targetPic = process.argv[3];
const outPic = process.argv[4] || 'demo_output.jpg';

if (!refPic || !targetPic) {
    console.log("Usage: node testFace.js <reference_image_path> <target_image_path> [output_image_path]");
    process.exit(1);
}

runDemo(refPic, targetPic, outPic).catch(console.error);
