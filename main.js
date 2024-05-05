import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { HalftonePass } from 'three/addons/postprocessing/HalftonePass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';

// Create a scene
const scene = new THREE.Scene();

// Set the background color to black
scene.background = new THREE.Color('black');

// Create a box geometry and material
const geometry = new THREE.BoxGeometry(9, 16, 9);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

const video = document.getElementById('video');
video.onloadeddata = function () {
    video.play();
};

// Create your video texture
const videoTexture = new THREE.VideoTexture(video);
videoTexture.needsUpdate = true;

// Create a material using the video texture
const videoMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.FrontSide,
    toneMapped: false,
});
videoMaterial.needsUpdate = true;


// Create a box mesh
const box = new THREE.Mesh(geometry, videoMaterial);

// Position the box at the origin
box.position.set(0, 9, 0);

// Add the box to the scene
scene.add(box);


// Create a perspective camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // Initial distance from the box
camera.position.y = 20; // Initial height from the box

// Add ambient light
const light = new THREE.AmbientLight(0xffffff, 0.5);
// scene.add(light);
// Add grid helper
const gridHelper = new THREE.GridHelper(100, 100, 0xfc03e8, 0xfc03e8);
scene.add(gridHelper);

// Create a WebGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Effect composer
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Unreal bloom pass
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.35;
bloomPass.strength = 0.4;
bloomPass.radius = 1;
composer.addPass(bloomPass);


//audio context
var audioContext = new AudioContext();
// audio loader
var listener = new THREE.AudioListener();
camera.add(listener);

// Define audioLoader
var audioLoader = new THREE.AudioLoader();

// Create an AnalyserNode
var analyser = audioContext.createAnalyser();

// Create a BiquadFilterNode for low-pass filtering
var bandPassFilter = audioContext.createBiquadFilter();
bandPassFilter.type = 'bandpass';
bandPassFilter.frequency.value = 200; // Adjust the low frequency cutoff
bandPassFilter.Q.value = 1; // Adjust the bandwidth
bandPassFilter.gain.value = 6; // Adjust the gain

// Connect the AnalyserNode to the band-pass filter
analyser.connect(bandPassFilter);


// Function to load and play the audio
function loadAndPlayAudio() {
    audioContext.resume().then(function() {
        audioLoader.load('bangarang.mp3', function(buffer) {
            // Create an AudioBufferSourceNode
            var source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(analyser); // Connect to the AnalyserNode
            analyser.connect(audioContext.destination); // Connect the AnalyserNode to the destination
            
            // Start playing the audio
            source.start();
        });
    });
}

// Event listener to start playing the audio when the document is clicked
document.addEventListener('click', function() {
    loadAndPlayAudio();
});

// Function to scale the box according to the music volume
function scaleBoxAccordingToMusicVolume(analyser, box) {
    // Get the frequency data
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    // Calculate the average volume
    let totalVolume = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        totalVolume += frequencyData[i];
    }
    const averageVolume = totalVolume / frequencyData.length;

    // Calculate the scale factor based on the average volume
    let scaleFactor = (averageVolume / 255) + 0.1; // Assuming the volume data is normalized between 0 and 255
    // Create a Tween to smoothly scale the box
    const tween = new TWEEN.Tween(box.scale)
    .to({ x: scaleFactor * 5, y: scaleFactor * 5, z: scaleFactor * 5}, 100) // Duration of the animation
    .easing(TWEEN.Easing.Quadratic.Out) // Easing function
    tween.start();
}

// Assuming you have a box mesh in your scene
// Call the scaling function periodically to update the box's scale based on the audio volume
setInterval(function() {
    scaleBoxAccordingToMusicVolume(analyser, box);
}, 100); // Adjust the interval as needed

// Function to update camera position and look at the box
function updateCamera() {
    const radius = 55; // Distance from the box
    const elapsedTime = performance.now() * 0.0005; // Speed of orbit

    // Update camera position
    camera.position.x = radius * Math.cos(elapsedTime);
    camera.position.z = radius * Math.sin(elapsedTime);

    // Make sure the camera is always looking at the box
    camera.lookAt(box.position);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updateCamera();
    TWEEN.update();
    // renderer.render(scene, camera);
    composer.render();
}

animate();