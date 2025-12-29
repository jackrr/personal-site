console.log("Loading wasm...");
import init, { State } from "./eymo_wasm.js";

const sampleConfigs = {
  faceParty: {
    label: "Face Party",
    config: `leye: scale(4), saturate(1.2), brighten(1.4), spin(0.3), drift(150)
reye: scale(4), saturate(1.2), brighten(1.4), spin(-0.5), drift(225, 225)
mouth: copy_to(reye_region+1), scale(1.5), brighten(1.2), saturate(1.3)
leye_region: swap_with(mouth+1), scale(1.5), brighten(1.2), saturate(1.3)
`,
  },
  faces: {
    label: "Faces",
    config: `face: spin(0.75), drift(500, 20), scale(0.6)
face: spin(-0.6), drift(350, 63), scale(0.8)
face: spin(0.4), drift(380, -26), scale(0.25)
face: spin(-3), drift(160, -58), scale(0.4)
face: spin(1.6), drift(420, 66), scale(0.9)
face: spin(0.4), drift(550, 35), scale(0.7)
face: spin(0.8), drift(750, -67), scale(1.2)
face: spin(-1.6), drift(80, 55), scale(0.75)
face: spin(1.5), drift(450, 18), scale(1.3)
face: spin(-4), drift(280, 98), scale(0.6)
face: spin(2.5), drift(810, -82), scale(0.3)
face: spin(1.8), drift(180, 76), scale(0.9)`,
  },
  swapFaceParts: {
    label: "Tiled Monster",
    config: `nose: scale(0.8), channels(0.8, 0.8, 1.2)
mouth: flip(vertical), scale(1.6), copy_to(leye_region+1), brighten(1.2)
reye_region: scale(1.6), swap_with(mouth+1), brighten(1.2)
face: tile, flip(vertical)
`,
  },
  swapFaces: {
    label: "Swap Faces (2+ People)",
    config: `face: copy_to(face+1), scale(1.5)`,
  },
};

// Generate sample config buttons
function generateSampleButtons() {
  const sampleButtonsContainer = document.getElementById("sample-buttons");
  const cmdTextarea = document.getElementById("cmd");

  Object.entries(sampleConfigs).forEach(([key, config]) => {
    const button = document.createElement("button");
    button.className = "eymo-sample-button";
    button.textContent = config.label;
    button.addEventListener("click", () => {
      cmdTextarea.value = config.config;
      let submit = document.getElementById("submit");
      submit.click();
    });
    sampleButtonsContainer.appendChild(button);
  });
}

async function print(canvas) {
  const dataUrl = canvas.toDataURL("image/png", 1.0); // high quality

  const img = new Image();
  img.src = dataUrl;

  img.onload = () => {
    const printWindow = window.open("", "", `width=${canvas.width},height=${canvas.height}`);
    printWindow.document.write(`
      <html>
      <head>
        <title>Print</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; }
          img { width: ${canvas.width}px; height: ${canvas.height}px; }
        </style>
      </head>
      <body><img src="${dataUrl}"></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
}

async function run() {
  console.log("Initializing wasm...");

  // Show loading state
  const loading = document.getElementById("loading");
  const main = document.getElementById("main");
  const startButtonContainer = document.getElementById("start-container");

  startButtonContainer.style.display = "none";
  loading.classList.add("visible");

  try {
    await init();

    let textArea = document.getElementById("cmd");
    textArea.value = sampleConfigs.faceParty.config;

    let thing = await new State("canvas", textArea.value);

    let submit = document.getElementById("submit");
    submit.addEventListener("click", async () => {
      await thing.set_cmd(textArea.value);
    });

    let play = document.getElementById("play");
    play.addEventListener("click", async () => {
      await thing.start();
    });

    let stop = document.getElementById("stop");
    stop.addEventListener("click", async () => {
      await thing.stop();
    });

    let printButton = document.getElementById("print");
    printButton.addEventListener("click", () => {
      print(document.getElementById("canvas"));
    });

    thing.start();

    generateSampleButtons();

    // Hide loading and show main interface
    loading.classList.remove("visible");
    main.classList.add("visible");
  } catch (error) {
    console.error("Failed to initialize Eymo:", error);
    loading.innerHTML =
      '<div style="color: #dc3545;">Failed to load Eymo. Please try again.</div>';
    setTimeout(() => {
      loading.classList.remove("visible");
      startButtonContainer.style.display = "inline-block";
    }, 3000);
  }
}

let start = document.getElementById("start");
start.addEventListener("click", () => {
  run();
});
