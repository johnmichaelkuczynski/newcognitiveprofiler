import path from 'path';
import mammoth from 'mammoth';

/**
 * Parses the content of Word and PDF documents
 */
export async function parseDocument(file: any): Promise<string> {
  try {
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Handle different file types
    if (fileExt === '.pdf') {
      try {
        // For PDFs, extract text from buffer
        // This is a simple extraction method looking for text patterns in the PDF
        const content = file.buffer.toString('utf-8', 0, Math.min(file.buffer.length, 50000));
        
        // Try to find text content in the PDF
        // Look for sequences that look like text (letters, numbers, punctuation)
        const plainTextMatches = content.match(/[A-Za-z0-9 .,;:!?'"()[\]{}\/\\-_+=@#$%^&*|~`<>]{5,}/g) || [];
        if (plainTextMatches.length > 0) {
          return plainTextMatches.join(' ');
        }
        
        // Fallback to metadata if text extraction fails
        return extractMetadataFromFile(file);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return "PDF content could not be extracted. The file was received but text extraction failed. Please try a text-based format like .txt or .docx for better results.";
      }
    } else if (fileExt === '.docx' || fileExt === '.doc') {
      return await parseWord(file.buffer);
    } else {
      // For text files and other formats, convert buffer to string
      return file.buffer.toString('utf-8');
    }
  } catch (error: any) {
    console.error('Error parsing document:', error);
    throw new Error(`Failed to parse document: ${error.message}`);
  }
}

/**
 * Extract basic metadata from uploaded file when full parsing isn't possible
 */
function extractMetadataFromFile(file: any): string {
  const metadata = [
    `Filename: ${file.originalname}`,
    `File size: ${(file.size / 1024).toFixed(2)} KB`,
    `File type: ${file.mimetype}`,
  ];
  
  // Add buffer preview (first 1000 characters as text)
  try {
    const bufferPreview = file.buffer.toString('utf-8', 0, 5000)
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Replace non-printable chars
      .trim();
    
    if (bufferPreview.length > 0) {
      metadata.push(`Content preview: ${bufferPreview}`);
    }
  } catch (e) {
    console.log('Could not extract buffer preview');
  }
  
  return metadata.join('\n\n');
}



/**
 * Parse Word documents using mammoth
 */
async function parseWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error: any) {
    console.error('Error parsing Word document:', error);
    throw new Error(`Failed to parse Word document: ${error.message}`);
  }
}