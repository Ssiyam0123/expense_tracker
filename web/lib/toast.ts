export function showToast(message: string, type: "success" | "error" | "info" = "success") {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Remove any existing toast
  const existing = document.getElementById("custom-toast-notification");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = "custom-toast-notification";
  toast.innerText = message;
  
  // Base styling for glassmorphic premium look
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "12px";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "600";
  toast.style.color = "#ffffff";
  toast.style.zIndex = "9999";
  toast.style.boxShadow = "0 8px 32px 0 rgba(0, 0, 0, 0.37)";
  toast.style.backdropFilter = "blur(8px)";
  toast.style.border = "1px solid rgba(255, 255, 255, 0.08)";
  toast.style.transition = "all 0.3s ease";
  toast.style.transform = "translateY(50px)";
  toast.style.opacity = "0";

  if (type === "success") {
    toast.style.backgroundColor = "rgba(16, 185, 129, 0.85)"; // Emerald
  } else if (type === "error") {
    toast.style.backgroundColor = "rgba(239, 68, 68, 0.85)"; // Red
  } else {
    toast.style.backgroundColor = "rgba(59, 130, 246, 0.85)"; // Blue
  }

  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateY(50px)";
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
