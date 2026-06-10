import {
  loginService,
  getProfileService,
  logoutService,
  updateProfileService,
} from "../services/auth.service.js";

// Login
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password harus diisi.",
      });
    }

    const result = await loginService(email, password);
    res.status(200).json({
      success: true,
      message: "Login berhasil.",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Profile (User yang sedang login)
export const getProfileController = async (req, res) => {
  try {
    const user_id = req.user.user_id; // Dari middleware auth
    const profile = await getProfileService(user_id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const logoutController = async (req, res) => {
  try {
    const result = await logoutService({
      user_id: req.user.user_id,
      token: req.auth.token,
      decoded: req.auth.decoded,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Profile
export const updateProfileController = async (req, res) => {
  try {
    const user_id = req.user.user_id; // Dari middleware auth
    const updatedUser = await updateProfileService(user_id, req.body);
    res.status(200).json({
      success: true,
      message: "Profile berhasil diupdate.",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
