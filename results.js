document.addEventListener('DOMContentLoaded', () => {
  // Get elements
  const compressedPreview = document.getElementById('compressedPreview');
  const dimensionsDisplay = document.getElementById('dimensionsDisplay');
  const filesizeDisplay = document.getElementById('filesizeDisplay');
  const formatDisplay = document.getElementById('formatDisplay');
  const downloadBtn = document.getElementById('downloadBtn');
  const newCompressionBtn = document.getElementById('newCompressionBtn');
  
  // Get compressed data from session storage
  const base64Data = sessionStorage.getItem('compressedData');
  const dimensions = sessionStorage.getItem('dimensions');
  const filesize = sessionStorage.getItem('filesize');
  const format = sessionStorage.getItem('format');
  const filename = sessionStorage.getItem('filename');
  
  if (base64Data) {
    // Display compressed image
    compressedPreview.src = base64Data;
    dimensionsDisplay.textContent = dimensions;
    filesizeDisplay.textContent = filesize;
    formatDisplay.textContent = format;
  } else {
    alert('No compressed image found');
    window.location.href = 'index.html';
  }
  
  // Download button
  downloadBtn.addEventListener('click', () => {
    // Create download link from base64
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  // New compression button
  newCompressionBtn.addEventListener('click', () => {
    // Clear session storage
    sessionStorage.removeItem('compressedData');
    sessionStorage.removeItem('dimensions');
    sessionStorage.removeItem('filesize');
    sessionStorage.removeItem('format');
    sessionStorage.removeItem('filename');
    
    window.location.href = 'index.html';
  });
});