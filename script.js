// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadUI = document.getElementById('uploadUI');
const previewUI = document.getElementById('previewUI');
const sizeControl = document.getElementById('sizeControl');
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
const downloadBtn = document.getElementById('downloadBtn');

// State
let originalFile = null;
let aspectRatioLocked = true;
let processedBlob = null;
let originalWidth = 0;
let originalHeight = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Set preview UI hidden
  previewUI.hidden = true;
  
  // Initialize browse button
  document.querySelector('.btn-browse').addEventListener('click', () => fileInput.click());
  
  // Initialize change image button
  document.querySelector('.btn-change')?.addEventListener('click', () => fileInput.click());
  
  // Setup toggle handlers
  dpiToggle.addEventListener('change', () => {
    dpiInput.disabled = !dpiToggle.checked;
  });
  
  resizeToggle.addEventListener('change', () => {
    const enabled = resizeToggle.checked;
    widthInput.disabled = !enabled;
    heightInput.disabled = !enabled;
    resizeUnit.disabled = !enabled;
    lockBtn.disabled = !enabled;
  });
  
  // Initialize lock button
  lockBtn.addEventListener('click', () => {
    aspectRatioLocked = !aspectRatioLocked;
    lockBtn.classList.toggle('locked', aspectRatioLocked);
    lockBtn.classList.toggle('unlocked', !aspectRatioLocked);
    lockBtn.querySelector('i').className = aspectRatioLocked ? 
      'ti ti-lock' : 'ti ti-lock-open';
  });
});

// Drag & Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
  dropZone.addEventListener(event, preventDefaults, false);
  document.body.addEventListener(event, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(event => {
  dropZone.addEventListener(event, highlight, false);
});

['dragleave', 'drop'].forEach(event => {
  dropZone.addEventListener(event, unhighlight, false);
});

dropZone.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', handleFileSelect);

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
  
  // Switch UI states
  uploadUI.hidden = true;
  previewUI.hidden = false;
  
  // Load preview image
  const imgPreview = document.getElementById('imagePreview');
  const objectURL = URL.createObjectURL(file);
  
  imgPreview.onload = function() {
    originalWidth = this.naturalWidth;
    originalHeight = this.naturalHeight;
    
    // Update file info
    document.getElementById('filenameDisplay').textContent = file.name;
    document.getElementById('dimensionsDisplay').textContent = 
      `${originalWidth} × ${originalHeight} px`;
    document.getElementById('filesizeDisplay').textContent = 
      formatFileSize(file.size);
    
    // Clean up memory
    URL.revokeObjectURL(objectURL);
  };
  
  imgPreview.onerror = function() {
    alert('Error loading image preview');
    URL.revokeObjectURL(objectURL);
  };
  
  imgPreview.src = objectURL;
  
  // Handle change image button
  document.querySelector('.btn-change').addEventListener('click', () => {
    previewUI.hidden = true;
    uploadUI.hidden = false;
    fileInput.value = '';
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

function convertFromPixels(value, unit, original, dpi) {
  if (unit === "px") return value;
  if (unit === "%") return (value / original) * 100;
  if (unit === "in") return value / dpi;
  if (unit === "cm") return (value * 2.54) / dpi;
  return value;
}

// Width input handler
widthInput.addEventListener('input', () => {
  if (aspectRatioLocked && widthInput.value) {
    const unit = resizeUnit.value;
    const dpi = dpiToggle.checked && dpiInput.value ? parseInt(dpiInput.value) : 96;
    const widthPx = convertToPixels(widthInput.value, unit, originalWidth, dpi);
    const heightPx = (originalHeight / originalWidth) * widthPx;
    
    heightInput.value = Math.round(
      convertFromPixels(heightPx, unit, originalHeight, dpi) * 100
    ) / 100;
  }
});

// Height input handler
heightInput.addEventListener('input', () => {
  if (aspectRatioLocked && heightInput.value) {
    const unit = resizeUnit.value;
    const dpi = dpiToggle.checked && dpiInput.value ? parseInt(dpiInput.value) : 96;
    const heightPx = convertToPixels(heightInput.value, unit, originalHeight, dpi);
    const widthPx = (originalWidth / originalHeight) * heightPx;
    
    widthInput.value = Math.round(
      convertFromPixels(widthPx, unit, originalWidth, dpi) * 100
    ) / 100;
  }
});

// Compression
compressBtn.addEventListener('click', async () => {
  if (!originalFile) {
    alert('Please upload an image first');
    return;
  }
  
  const targetSize = parseFloat(targetSizeInput.value);
  if (isNaN(targetSize)) {
    alert('Please enter a valid target size');
    return;
  }
  
  const unit = sizeUnitSelect.value;
  const targetBytes = unit === 'KB' ? targetSize * 1024 : targetSize * 1024 * 1024;
  
  try {
    compressBtn.innerHTML = '<i class="ti ti-loader"></i> Compressing...';
    compressBtn.disabled = true;
    
    processedBlob = await compressImage(originalFile, targetBytes);
    downloadBtn.disabled = false;
    
    const originalSizeBytes = originalFile.size;
    const newSize = formatFileSize(processedBlob.size);
    const reduction = Math.round((1 - processedBlob.size / originalSizeBytes) * 100);
    alert(`Compression successful!\nNew size: ${newSize}\nReduction: ${reduction}%`);
  } catch (error) {
    alert(`Compression failed: ${error.message}`);
  } finally {
    compressBtn.innerHTML = '<i class="ti ti-compress"></i> Compress';
    compressBtn.disabled = false;
  }
});

// Download
downloadBtn.addEventListener('click', () => {
  if (!processedBlob) return;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(processedBlob);
  link.download = `compressed-${originalFile.name}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Helpers
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

async function compressImage(file, targetBytes) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = function(e) {
      img.src = e.target.result;
      
      img.onload = async function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Get settings
        const useDPI = dpiToggle.checked;
        const useResize = resizeToggle.checked;
        const dpiValue = useDPI && dpiInput.value ? parseInt(dpiInput.value) : 96;
        const unit = resizeUnit.value;
        
        // Calculate dimensions
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        if (useResize && (widthInput.value || heightInput.value)) {
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
          
          // Maintain aspect ratio if locked
          if (aspectRatioLocked) {
            if (widthInput.value && !heightInput.value) {
              newHeight = (originalHeight / originalWidth) * newWidth;
            } else if (heightInput.value && !widthInput.value) {
              newWidth = (originalWidth / originalHeight) * newHeight;
            }
          }
        }
        
        canvas.width = Math.round(newWidth);
        canvas.height = Math.round(newHeight);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Binary search for optimal quality
        let min = 1, max = 100, quality = 90;
        let blob = null;
        
        for (let i = 0; i < 10; i++) {
          blob = await canvasToBlob(canvas, quality / 100);
          
          if (blob.size < targetBytes) min = quality;
          else max = quality;
          
          const newQuality = Math.round((min + max) / 2);
          if (newQuality === quality) break;
          quality = newQuality;
          
          if (Math.abs(blob.size - targetBytes) < targetBytes * 0.1) break;
        }
        
        resolve(blob);
      };
      
      img.onerror = () => reject(new Error('Image loading failed'));
    };
    
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
  });
}