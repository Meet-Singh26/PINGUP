import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";

// Create an empty object to store SS Event connections
const connections = {};

// Controller function for the SSE endpoint
export const sseController = (req, res) => {
  const { userId } = req.params;
  console.log("New client connected: ", userId);

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  // Store the connection
  connections[userId] = res;

  // Ping client every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    if (connections[userId]) {
      res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
    }
  }, 30000);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(pingInterval);
    delete connections[userId];
    console.log("Client disconnected:", userId);
  });
};

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";

    if (message_type === "image") {
      const fileBuffer = fs.readFileSync(image.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });
      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
    });

    // Populate sender info before sending
    const populatedMessage = await Message.findById(message._id).populate(
      "from_user_id",
      "username full_name profile_picture"
    );

    // Immediate response
    res.json({ success: true, message: populatedMessage });

    // Prepare broadcast data
    const broadcastData = JSON.stringify({
      type: "new_message",
      message: populatedMessage,
    });

    // Send to recipient if connected
    if (connections[to_user_id]) {
      connections[to_user_id].write(`data: ${broadcastData}\n\n`);
    }
  } catch (error) {
    console.error("Message send error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id: to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    })
      .populate("from_user_id")
      .sort({ created_at: -1 });

    // mark messages as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId, seen: false },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get recent messages
export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const messages = await Message.find({ to_user_id: userId })
      .populate("from_user_id to_user_id")
      .sort({ created_at: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
