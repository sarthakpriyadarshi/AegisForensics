// Montserrat font loader for jsPDF
// Loads Montserrat TTF from public folder and adds it to jsPDF

export async function addMontserratFont(doc: any) {
  try {
    // Fetch Montserrat Regular TTF from public folder
    const regularResponse = await fetch('/Montserrat-Regular.ttf');
    const regularBuffer = await regularResponse.arrayBuffer();
    const regularBase64 = btoa(
      new Uint8Array(regularBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Fetch Montserrat Bold TTF from public folder
    const boldResponse = await fetch('/Montserrat-Bold.ttf');
    const boldBuffer = await boldResponse.arrayBuffer();
    const boldBase64 = btoa(
      new Uint8Array(boldBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Add fonts to jsPDF
    doc.addFileToVFS('Montserrat-Regular.ttf', regularBase64);
    doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
    
    doc.addFileToVFS('Montserrat-Bold.ttf', boldBase64);
    doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
    
    return true;
  } catch (error) {
    console.error('Failed to load Montserrat font:', error);
    // Fallback to helvetica if font loading fails
    return false;
  }
}
