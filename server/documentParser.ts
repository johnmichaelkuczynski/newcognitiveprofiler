import path from 'path';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

/**
 * Parses the content of Word and PDF documents
 */
export async function parseDocument(file: any): Promise<string> {
  try {
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Handle different file types
    if (fileExt === '.pdf') {
      try {
        // Load PDF document using pdf-lib
        const pdfDoc = await PDFDocument.load(file.buffer);
        
        // Get page count for logging
        const pageCount = pdfDoc.getPageCount();
        console.log(`PDF has ${pageCount} pages`);
        
        // Extract text directly from the buffer using multiple approaches
        const content = file.buffer.toString('utf-8');
        
        // Start with an empty result
        let extractedText = '';
        
        // First approach - extract text from streams (where most readable content is)
        const streamMatches = content.match(/stream[\s\S]*?endstream/g) || [];
        for (const stream of streamMatches) {
          // Clean stream data and extract readable text
          const cleanStream = stream
            .replace(/stream|endstream/g, '')
            .replace(/[\\n\\r]/g, ' ')
            .replace(/[^\x20-\x7E]/g, ' ');
          
          // Find spans of readable text (5+ chars)
          const textFragments = cleanStream.match(/[A-Za-z0-9 .,;:!?'"()[\]{}\/\\-_+=@#$%^&*|~`<>]{5,}/g) || [];
          if (textFragments.length > 0) {
            extractedText += textFragments.join(' ') + ' ';
          }
        }
        
        // Second approach - look for text between markers
        const textObjectMatches = content.match(/BT[\s\S]*?ET/g) || [];
        for (const textObj of textObjectMatches) {
          // Extract text within parentheses (common PDF text format)
          const parenthesesMatches = textObj.match(/\(([^\)]+)\)/g) || [];
          for (const match of parenthesesMatches) {
            extractedText += match.substring(1, match.length - 1) + ' ';
          }
        }
        
        // Clean up the extracted text
        extractedText = extractedText
          .replace(/\\r\\n|\\r|\\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // If we got significant content, return it
        if (extractedText.length > 100) {
          console.log(`Successfully extracted ${extractedText.length} characters of text`);
          return extractedText;
        }
        
        // As a last resort, grab any text-like sequences from the entire PDF
        const lastResortMatches = content.match(/[A-Za-z]{3,}[A-Za-z0-9 .,;:!?'"()[\]{}\/\\-_+=@#$%^&*|~`<>]{10,}/g) || [];
        if (lastResortMatches.length > 0) {
          const lastResortText = lastResortMatches.join(' ');
          console.log(`Extracted ${lastResortText.length} characters using last resort method`);
          return lastResortText;
        }
        
        // If all extraction methods fail, let the user know
        return "This PDF appears to be either image-based or encrypted. Please try uploading a text-based PDF or convert your document to .txt or .docx format.";
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return `PDF analysis failed. We received your file but couldn't extract meaningful text. If this is an academic paper on prostitution, please try converting it to plain text format for better results.`;
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