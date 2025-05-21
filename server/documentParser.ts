import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

/**
 * Parses the content of Word and PDF documents
 */
export async function parseDocument(file: any): Promise<string> {
  try {
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Handle different file types
    if (fileExt === '.pdf') {
      return await parsePdf(file.buffer);
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
 * Parse PDF files using pdf-parse
 */
async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
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