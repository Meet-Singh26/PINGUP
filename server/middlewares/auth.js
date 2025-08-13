export const protect = async (req, res, next) => {
  try {
    const { userId } = await req.auth();
    if (!userId) {
      res.json({ success: false, message: "not authenticated" });
    }
    next();
  } catch (error) {}
  res.json({ success: false, message: error.message });
};
