export const cloudinaryConfig = {
  cloudName: import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || "dfce7wnqg",
  apiKey: import.meta.env?.VITE_CLOUDINARY_API_KEY || "",
  uploadPreset: import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || "zynmart_presets",
};

const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], { type: mime });
};

export const uploadImageToCloudinary = async (imageSource) => {
  const { cloudName, uploadPreset } = cloudinaryConfig;
  try {
    const formData = new FormData();
    if (typeof imageSource === "string" && imageSource.startsWith("data:")) {
      formData.append("file", dataURLtoBlob(imageSource), "image.jpg");
    } else {
      formData.append("file", imageSource);
    }
    formData.append("upload_preset", uploadPreset);
    formData.append("cloud_name", cloudName);
    formData.append("folder", "zynmart_products");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    const data = await res.json();
    return data.secure_url;
  } catch (e) {
    console.error("Cloudinary upload error:", e);
    return null;
  }
};
