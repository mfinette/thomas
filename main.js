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

// Make the background be a picture inside of a sphere
// Create a sphere geometry
const sphereGeometry = new THREE.SphereGeometry(200, 32, 32);

// Load the background texture
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('background4.jpeg');

// Create a material using the background texture
const backgroundMaterial = new THREE.MeshBasicMaterial({
    map: backgroundTexture,
    side: THREE.BackSide, // Render the texture on the inside of the sphere
});

// Create a sphere mesh
const sphere = new THREE.Mesh(sphereGeometry, backgroundMaterial);

// Add the sphere to the scene
scene.add(sphere);

// Create a box geometry and material
const geometry = new THREE.BoxGeometry(9, 16, 9);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

const video = document.getElementById('video');
//video.onloadeddata = function () {
  //  video.play();
//};

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
camera.position.y = 17; // Initial height from the box

// Add ambient light
const light = new THREE.AmbientLight(0xffffff, 0.5);
const cameraLight = new THREE.PointLight(0xffffff, 100);
scene.add(light);
// Add grid helper
const gridHelper = new THREE.GridHelper(1000, 1000, 0xfc03e8, 0xfc03e8);
scene.add(gridHelper);

// fog
scene.fog = new THREE.FogExp2(0x000000, 0.005);

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


const slayText = document.getElementById('slayText');

// Function to load and play the audio
function loadAndPlayAudio() {
    audioContext.resume().then(function() {
        audioLoader.load('anniv.mp3', function(buffer) {
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

let hasbeenclicked = false;
// Event listener to start playing the audio when the document is clicked
document.addEventListener('click', function() {
    if (!hasbeenclicked)
        {
            hasbeenclicked = true;
            loadAndPlayAudio();
            startAnimation();
            slayText.style.display = 'none';
        }
});

class Radius {
    constructor(value) {
        this.radius = value;
        this.increasing = true;
        this.decreasing = false;
        this.orbitSpeed = 0.0033;
        this.cameraHeight = 60;
        this.cameraAnimating = false;
    }
}

let radiusObject = new Radius(15);

function changeRadius(radius)
{
    const duration = 1500;
    const increase = 15;
    if (radius.decreasing)
    {
        const target = radius.radius - increase;
        radius.decreasing = false;
        new TWEEN.Tween(radius)
        .to({radius: target}, duration)
        .onComplete(() => {
            radius.increasing = true;
        })
        .easing(TWEEN.Easing.Linear.None)
        .start();
    }
    if (radius.increasing)
        {
            const target = radius.radius + increase;
            radius.increasing = false;
            new TWEEN.Tween(radius)
            .to({radius: target}, duration)
            .onComplete(() => {
                radius.decreasing = true;
            })
            .easing(TWEEN.Easing.Linear.None)
            .start();
        }
}

function startAnimation()
{
    if (!radiusObject.cameraAnimating)
    {
        const duration = 4000;
        radiusObject.cameraAnimating = true;
        new TWEEN.Tween(radiusObject)
        .to({cameraHeight: 17}, duration)
        .easing(TWEEN.Easing.Linear.None)
        .start();
        new TWEEN.Tween(radiusObject)
        .to({orbitSpeed: 0.0003}, duration)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(() => {
        })
        .onComplete(() => {
            video.play();
        })
        .start();
    }
}

// Function to update camera position and look at the box
function updateCamera() {
    const elapsedTime = performance.now() * radiusObject.orbitSpeed; // Speed of orbit

    // Update camera position
    camera.position.x = radiusObject.radius * Math.cos(elapsedTime);
    camera.position.z = radiusObject.radius * Math.sin(elapsedTime);

    // Make sure the camera is always looking at the box
    camera.lookAt(box.position);
    camera.position.y = radiusObject.cameraHeight;
    //cameraLight.position.copy(camera.position);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updateCamera();
    changeRadius(radiusObject);
    TWEEN.update();
    renderer.render(scene, camera);
    //composer.render();
}

animate();