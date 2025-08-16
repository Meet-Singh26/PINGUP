import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

// Add Post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;

    let image_urls = [];

    if (images && images.length) {
      console.log(`Uploading ${images.length} images...`);

      try {
        image_urls = await Promise.all(
          images.map(async (image, index) => {
            console.log(`Uploading image ${index + 1}/${images.length}`);

            const response = await imagekit.upload({
              file: image.buffer,
              fileName: `${Date.now()}_${image.originalname}`, // Unique filename
              folder: "/posts",
            });

            console.log(`Image ${index + 1} uploaded:`, response.fileId);

            const url = imagekit.url({
              path: response.filePath,
              transformation: [
                { quality: "auto" },
                { format: "webp" },
                { width: "1280" },
              ],
            });

            return url;
          })
        );
        console.log("All images uploaded successfully");
      } catch (uploadError) {
        console.error("ImageKit batch upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
          error: uploadError.message,
        });
      }
    }

    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });

    res.json({ success: true, message: "Post created successfully" });
  } catch (error) {
    console.error("Post creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: "Internal server error",
    });
  }
};

// Get Posts
export const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);

    // user connections and followings
    const userIds = [userId, ...user.connections, ...user.following];
    const posts = await Post.find({ user: { $in: userIds } })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Like Posts
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);

    if (post.likes_count.includes(userId)) {
      post.likes_count = post.likes_count.filter((user) => user !== userId);
      await post.save();
      res.json({ success: true, message: "Post unliked" });
    } else {
      post.likes_count.push(userId);
      await post.save();
      res.json({ success: true, message: "Post liked" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
