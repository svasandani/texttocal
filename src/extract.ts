import { existsSync, mkdirSync } from "fs";
import { parse } from "node-html-parser";
import { ocrSpace } from "ocr-space-api-wrapper";
import sharp from "sharp";

/**
 * Limit to 800 KB
 */
const FILE_SIZE_LIMIT = 1024 * 1024 * 0.8;
const TMP_DIR = "./tmp";

export const saveImageToFile = async (imageUrl: string) => {
  console.log({
    msg: "Saving image to file",
    imageUrl,
  });

  if (!existsSync(TMP_DIR)) {
    console.log({
      msg: "Creating tmp directory",
    });
    mkdirSync(TMP_DIR);
  }

  const file = await fetch(imageUrl);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const image = sharp(buffer);
  const path = `${TMP_DIR}/${imageUrl.split("/").pop()}`;
  await image.toFile(path);

  console.log({
    msg: "Image saved to file",
    path,
  });

  return path;
}

/**
 * File must be under 1024 KB to be processed by OCR Space
 */
export const resizeImageToFilesize = async (path: string) => {
  console.log({
    msg: "Resizing image to filesize",
    path,
  });

  const image = sharp(path);
  const metadata = await image.metadata();
  const buffer = await image.toBuffer();
  const isTooLarge = buffer.length > FILE_SIZE_LIMIT;

  console.log({
    msg: "Is image too large",
    metadata,
    bufferLength: buffer.length,
    isTooLarge,
  });

  const resizedPath = `${path.replace(/\.[^.]+$/, "")}-resized.jpg`;

  if (isTooLarge) {
    console.log({
      msg: "Image is too large, reducing size",
    });

    const reductionFactor = Math.sqrt((FILE_SIZE_LIMIT) / buffer.length);
    const newWidth = Math.floor(metadata.width! * reductionFactor);
    const newHeight = Math.floor(metadata.height! * reductionFactor);

    console.log({
      msg: "New dimensions",
      reductionFactor,
      newWidth,
      newHeight,
    });

    image.resize(newWidth, newHeight);
    await image.toFile(resizedPath);

    console.log({
      msg: "Image resized",
      resizedPath,
    });

    return resizedPath
  }
  
  return path;
}

export const parseTextFromImage = async (path: string) => {
  console.log({
    msg: "Parsing text from image",
    path,
  });
  
  const response = await ocrSpace(path, {
    apiKey: process.env.OCR_SPACE_API_KEY,
    detectOrientation: true,
    scale: true,
    OCREngine: "2",
  });
  
  if (response.IsErroredOnProcessing) {
    throw new Error(response.ErrorMessage);
  }

  const text = response.ParsedResults.map((line) => line.ParsedText).join("\n");

  console.log({
    msg: "Parsed text from image",
    text,
  });
  
  return text;
};

export const parseTextFromLink = async (url: string) => {
  console.log({
    msg: "Parsing text from link",
    url,
  });
  
  const response = await fetch(url);
  const responseText = await response.text();
  const html = parse(responseText);
  html?.querySelectorAll("head, iframe, script, style").forEach((element) => {
    element.remove();
  });
  html?.removeWhitespace();
  const text = html?.textContent;

  console.log({
    msg: "Parsed text from link",
    text,
  });

  return text;
}
