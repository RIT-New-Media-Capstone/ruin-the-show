// Client-side sketch manager that works with global mode p5.js sketches
let currentPage = null;
let p5Instance = null;
let p5Loaded = false;

// Set up state checking interval
setInterval(() => {
  fetch('/getState')
    .then(res => res.json())
    .then(data => {
      if (data.state) {
        let newPage = data.state;
        
        // Convert state name to page name as needed
        if (newPage === 'PLAYING') {
          newPage = 'sketch';
        } else if (newPage === 'IDLE') {
          newPage = 'idle';
        } else if (newPage === 'ONBOARDING') {
          newPage = 'onboarding';
        }
        
        // Only change if state has actually changed
        if (newPage.toLowerCase() !== currentPage) {
          console.log(`State change detected: ${currentPage || 'none'} -> ${newPage}`);
          unloadPage();
          currentPage = newPage.toLowerCase();
          loadPage(currentPage);
        }
      }
    })
    .catch(err => {
      console.error('Error fetching game state:', err);
    });
}, 1000);

// Cleanly unload the current page/sketch
function unloadPage() {
  if (!currentPage) return;
  
  console.log(`Unloading ${currentPage}...`);
  
  // Remove all canvases
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    canvas.remove();
  });
  
  // Clear global p5 functions to avoid conflicts
  window.setup = undefined;
  window.draw = undefined;
  window.preload = undefined;
  window.mousePressed = undefined;
  window.mouseReleased = undefined;
  window.keyPressed = undefined;
  window.keyReleased = undefined;
  
  // Remove any existing p5 instances
  if (p5Instance && typeof p5Instance.remove === 'function') {
    p5Instance.remove();
  }
  
  // Try to stop animation loops
  try {
    if (window.p5 && typeof window.noLoop === 'function') {
      window.noLoop();
    }
  } catch (e) {
    console.warn("Error stopping animation:", e);
  }
  
  // Remove the script tag
  const script = document.getElementById('dynamicModule');
  if (script) {
    script.remove();
    console.log("Script element removed");
  }

  window.location.reload();
  
  p5Instance = null;
}

// Load the appropriate page based on state
function loadPage(pageName) {
  console.log(`Loading ${pageName}...`);
  
  // Ensure p5.js is loaded before proceeding
  if (!window.p5 && !p5Loaded) {
    console.log("Loading p5.js library...");
    const p5Script = document.createElement('script');
    p5Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js';
    p5Script.onload = () => {
      console.log("p5.js loaded successfully");
      p5Loaded = true;
      loadSketchScript(pageName);
    };
    document.head.appendChild(p5Script);
  } else {
    loadSketchScript(pageName);
  }
}

// Load and execute the sketch script
function loadSketchScript(pageName) {
  console.log(`Loading script: ${pageName}.js`);
  
  // Load the sketch module
  const script = document.createElement('script');
  script.id = 'dynamicModule';
  script.src = `${pageName}.js`;

  script.onload = () => {
    console.log(`${pageName}.js loaded`);
    
    // Ensure global p5 is initialized with the sketch's setup/draw functions
    try {
      if (typeof window.setup === 'function') {
        console.log(`Found setup function in ${pageName}.js`);
        
        // Create a new global p5 instance
        // This will automatically use the global setup() and draw() functions
        p5Instance = new p5();
        console.log(`${pageName} sketch started`);
      } else {
        console.error(`No setup function found in ${pageName}.js`);
      }
    } catch (err) {
      console.error(`Failed to initialize sketch for ${pageName}.js:`, err);
    }
  };

  script.onerror = (e) => {
    console.error(`Failed to load ${pageName}.js:`, e);
  };

  document.body.appendChild(script);
}

// Initialize when document is loaded
window.addEventListener('DOMContentLoaded', () => {
  // Start by checking the current state
  fetch('/getState')
    .then(res => res.json())
    .then(data => {
      if (data.state) {
        let initialPage = data.state;
        
        // Convert state name to page name
        if (initialPage === 'PLAYING') {
          initialPage = 'sketch';
        } else if (initialPage === 'IDLE') {
          initialPage = 'idle';
        } else if (initialPage === 'ONBOARDING') {
          initialPage = 'onboarding';
        }
        
        currentPage = initialPage.toLowerCase();
        loadPage(currentPage);
      } else {
        // Default to idle if no state is returned
        currentPage = 'idle';
        loadPage(currentPage);
      }
    })
    .catch(err => {
      console.error('Error fetching initial state:', err);
      // Fall back to idle on error
      currentPage = 'idle';
      loadPage(currentPage);
    });
});

// For debugging in console
window.getCurrentPage = () => currentPage;