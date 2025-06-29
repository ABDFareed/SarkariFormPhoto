// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadUI = document.getElementById('uploadUI');
const previewUI = document.getElementById('previewUI');
const targetSizeInput = document.getElementById('targetSize');
const sizeUnitSelect = document.getElementById('sizeUnit');
const dpiToggle = document.getElementById('dpiToggle');
const dpiInput = document.getElementById('dpiInput');
const resizeToggle = document.getElementById('resizeToggle');
const resizeUnit = document.getElementById('resizeUnit');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const lockBtn = document.getElementById('lockBtn');
const compressBtn = document.getElementById('compressBtn');
const formatSelect = document.getElementById('formatSelect');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const dpiSetting = document.getElementById('dpiSetting');
const resizeSetting = document.getElementById('resizeSetting');

// State
let originalFile = null;
let originalWidth = 0;
let originalHeight = 0;
let aspectRatioLocked = true;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  previewUI.hidden = true;
  loader.hidden = true;
  
  // Event listeners
  document.querySelector('.btn-browse').addEventListener('click', () => fileInput.click());
  document.querySelector('.btn-change').addEventListener('click', () => fileInput.click());
  
  // Toggle handlers
  dpiToggle.addEventListener('change', () => {
    dpiInput.disabled = !dpiToggle.checked;
    updateSettingStates();
  });
  
  resizeToggle.addEventListener('change', () => {
    const enabled = resizeToggle.checked;
    widthInput.disabled = !enabled;
    heightInput.disabled = !enabled;
    resizeUnit.disabled = !enabled;
    lockBtn.disabled = !enabled;
    updateSettingStates();
  });
  
  // Lock aspect ratio button
  lockBtn.addEventListener('click', () => {
    aspectRatioLocked = !aspectRatioLocked;
    lockBtn.classList.toggle('locked', aspectRatioLocked);
    lockBtn.classList.toggle('unlocked', !aspectRatioLocked);
    lockBtn.querySelector('i').className = aspectRatioLocked ? 
      'ti ti-lock' : 'ti ti-lock-open';
  });
  
  fileInput.addEventListener('change', handleFileSelect);
  compressBtn.addEventListener('click', startCompression);
  
  // Setup drag and drop
  setupDragAndDrop();
  updateSettingStates();
});

function setupDragAndDrop() {
  const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
  events.forEach(event => {
    dropZone.addEventListener(event, preventDefaults);
    document.body.addEventListener(event, preventDefaults);
  });

  ['dragenter', 'dragover'].forEach(event => {
    dropZone.addEventListener(event, highlight);
  });

  ['dragleave', 'drop'].forEach(event => {
    dropZone.addEventListener(event, unhighlight);
  });
  
  dropZone.addEventListener('drop', handleDrop);
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  dropZone.classList.add('active');
}

function unhighlight() {
  dropZone.classList.remove('active');
}

function updateSettingStates() {
  dpiSetting.classList.toggle('enabled', dpiToggle.checked);
  resizeSetting.classList.toggle('enabled', resizeToggle.checked);
}

// File handling
function handleDrop(e) {
  const files = e.dataTransfer.files;
  if (files.length) handleFiles(files[0]);
}

function handleFileSelect() {
  if (fileInput.files.length) handleFiles(fileInput.files[0]);
}

function handleFiles(file) {
  if (!file) return;
  
  // Validate file type
  if (!file.type.match(/image\/(jpeg|png|webp)/)) {
    alert('Please select an image file (JPG, PNG, WebP)');
    return;
  }
  
  // Validate file size
  if (file.size > 10 * 1024 * 1024) {
    alert('File size exceeds 10MB limit');
    return;
  }
  
  originalFile = file;
  
  // UI transition
  uploadUI.hidden = true;
  previewUI.hidden = false;
  
  const imgPreview = document.getElementById('imagePreview');
  const objectURL = URL.createObjectURL(file);
  
  imgPreview.onload = function() {
    originalWidth = this.naturalWidth || this.width;
    originalHeight = this.naturalHeight || this.height;
    
    // Update UI
    document.getElementById('filenameDisplay').textContent = file.name;
    document.getElementById('dimensionsDisplay').textContent = 
      `${originalWidth} × ${originalHeight} px`;
    document.getElementById('filesizeDisplay').textContent = 
      formatFileSize(file.size);
    
    // Set default values for resize inputs
    widthInput.value = originalWidth;
    heightInput.value = originalHeight;
    
    // Clean up memory
    URL.revokeObjectURL(objectURL);
  };
  
  imgPreview.onerror = function() {
    alert('Error loading image preview');
    URL.revokeObjectURL(objectURL);
  };
  
  imgPreview.src = objectURL;
}

function startCompression() {
  if (!originalFile) {
    alert('Please upload an image first');
    return;
  }
  
  const targetSize = parseFloat(targetSizeInput.value);
  if (isNaN(targetSize) || targetSize <= 0) {
    alert('Please enter a valid target size');
    return;
  }
  
  const unit = sizeUnitSelect.value;
  const targetBytes = unit === 'KB' ? targetSize * 1024 : targetSize * 1024 * 1024;
  
  try {
    // Show loader
    compressBtn.hidden = true;
    loader.hidden = false;
    loaderText.textContent = "Compressing image...";
    
    // Determine output format
    const outputFormat = formatSelect.value;
    
    // Start compression
    compressImage(originalFile, targetBytes, outputFormat);
  } catch (error) {
    handleError(error);
  }
}

async function compressImage(file, targetBytes, outputFormat) {
  const img = new Image();
  const reader = new FileReader();
  
  reader.onload = async function(e) {
    img.src = e.target.result;
    
    img.onload = async function() {
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      
      // Get settings
      const dpiValue = dpiToggle.checked && dpiInput.value ? parseInt(dpiInput.value) : 96;
      const unit = resizeUnit.value;
      
      // Calculate dimensions
      let newWidth = originalWidth;
      let newHeight = originalHeight;
      
      if (resizeToggle.checked) {
        newWidth = convertToPixels(
          widthInput.value || originalWidth,
          unit,
          originalWidth,
          dpiValue
        );
        
        newHeight = convertToPixels(
          heightInput.value || originalHeight,
          unit,
          originalHeight,
          dpiValue
        );
        
        if (aspectRatioLocked) {
          if (widthInput.value && !heightInput.value) {
            newHeight = (originalHeight / originalWidth) * newWidth;
          } else if (heightInput.value && !widthInput.value) {
            newWidth = (originalWidth / originalHeight) * newHeight;
          }
        }
      }
      
      // Ensure valid dimensions
      newWidth = Math.max(1, Math.round(newWidth));
      newHeight = Math.max(1, Math.round(newHeight));
      
      // Set initial canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 1. First Stage: Aggressive quality reduction
      let compressedBlob = await forceCompression(
        canvas, 
        targetBytes, 
        outputFormat
      );
      
      // 2. Second Stage: Dimension reduction if still too large
      if (compressedBlob.size > targetBytes) {
        loaderText.textContent = "Reducing dimensions...";
        compressedBlob = await reduceDimensions(
          img,
          canvas,
          targetBytes,
          outputFormat
        );
      }
      
      // Convert to base64 for reliable storage
      const base64Data = await blobToBase64(compressedBlob);
      
      // Prepare results
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `SarkariFormPhotoCompressed_${timestamp}.${outputFormat}`;
      
      // Store results
      sessionStorage.setItem('compressedData', base64Data);
      sessionStorage.setItem('dimensions', `${canvas.width} × ${canvas.height} px`);
      sessionStorage.setItem('filesize', formatFileSize(compressedBlob.size));
      sessionStorage.setItem('format', outputFormat.toUpperCase());
      sessionStorage.setItem('filename', filename);
      
      // Redirect to results page
      window.location.href = 'results.html';
    };
  };
  
  reader.readAsDataURL(file);
}

// New function: Dimension reduction
async function reduceDimensions(img, originalCanvas, targetBytes, format) {
  let currentCanvas = originalCanvas;
  let currentBlob = await canvasToBlob(currentCanvas, 0.1, format);
  let reductionFactor = 0.9; // Reduce dimensions by 10% each step
  let iteration = 0;
  
  while (currentBlob.size > targetBytes && iteration < 10) {
    iteration++;
    
    // Create new canvas with reduced dimensions
    const newWidth = Math.max(10, Math.floor(currentCanvas.width * reductionFactor));
    const newHeight = Math.max(10, Math.floor(currentCanvas.height * reductionFactor));
    
    const newCanvas = document.createElement('canvas');
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;
    const ctx = newCanvas.getContext('2d');
    
    // Draw original image to maintain quality
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Update loader text
    loaderText.textContent = `Reducing dimensions... ${newWidth}x${newHeight}`;
    
    // Compress with minimum quality
    currentBlob = await canvasToBlob(newCanvas, 0.1, format);
    currentCanvas = newCanvas;
    
    // If still too large, increase reduction
    if (currentBlob.size > targetBytes) {
      reductionFactor *= 0.8; // More aggressive reduction
    }
  }
  
  return currentBlob;
}

// Aggressive compression algorithm
async function forceCompression(canvas, targetBytes, format) {
  let quality = 0.9; // Start at 90% quality
  let blob = await canvasToBlob(canvas, quality, format);
  
  // Reduce quality until target size is met
  while (blob.size > targetBytes && quality > 0.01) {
    quality = Math.max(0.01, quality - 0.05);
    blob = await canvasToBlob(canvas, quality, format);
    
    // Update loader text
    loaderText.textContent = `Reducing quality... ${Math.round(quality * 100)}%`;
  }
  
  return blob;
}

// Aggressive compression algorithm
async function forceCompression(canvas, targetBytes, format) {
  let quality = 0.9; // Start at 90% quality
  let blob = await canvasToBlob(canvas, quality, format);
  
  // Reduce quality until target size is met
  while (blob.size > targetBytes && quality > 0.01) {
    quality -= 0.05; // Reduce quality by 5% each step
    blob = await canvasToBlob(canvas, quality, format);
    
    // Update loader text
    loaderText.textContent = `Compressing... ${Math.round((1 - quality) * 100)}% reduced`;
  }
  
  return blob;
}

// Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function() {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

// Unit conversion functions
function convertToPixels(value, unit, original, dpi) {
  if (!value) return 0;
  value = parseFloat(value);
  if (unit === "px") return value;
  if (unit === "%") return (original * value) / 100;
  if (unit === "in") return value * dpi;
  if (unit === "cm") return value * dpi / 2.54;
  return value;
}

function canvasToBlob(canvas, quality, format) {
  return new Promise(resolve => {
    if (format === 'png') {
      canvas.toBlob(blob => resolve(blob), 'image/png');
    } else if (format === 'webp') {
      canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
    } else {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
    }
  });
}

function handleError(error) {
  console.error('Compression error:', error);
  alert(`Error: ${error.message || 'Compression failed'}`);
  
  // Reset UI
  compressBtn.hidden = false;
  loader.hidden = true;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}