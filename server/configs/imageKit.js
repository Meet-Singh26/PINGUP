import ImageKit from "imagekit";
import dotenv from "dotenv";

// Load environment variables - this is more reliable for production
dotenv.config();

// Add debug logging to check if environment variables are loaded
console.log("ImageKit Environment Check:", {
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY ? "Present" : "Missing",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? "Present" : "Missing",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT ? "Present" : "Missing",
  publicKeyLength: process.env.IMAGEKIT_PUBLIC_KEY?.length || 0,
  privateKeyLength: process.env.IMAGEKIT_PRIVATE_KEY?.length || 0,
});

// Validate required environment variables
if (
  !process.env.IMAGEKIT_PUBLIC_KEY ||
  !process.env.IMAGEKIT_PRIVATE_KEY ||
  !process.env.IMAGEKIT_URL_ENDPOINT
) {
  throw new Error("Missing required ImageKit environment variables");
}

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Test ImageKit connection on startup
imagekit
  .listFiles({
    limit: 1,
  })
  .then(() => {
    console.log("✅ ImageKit connection successful");
  })
  .catch((error) => {
    console.error("❌ ImageKit connection failed:", error.message);
  });

export default imagekit;
