export function renderSkeletonImage(src, alt, className = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `skeleton-image-wrapper relative overflow-hidden bg-gray-100 ${className}`;
  wrapper.style.cssText = "min-height:100px";

  const img = new Image();
  img.className = "w-full h-full object-cover transition-opacity duration-300";
  img.style.cssText = "opacity:0;position:absolute;inset:0";
  img.src = src;
  img.alt = alt;
  img.onerror = () => { img.src = "https://placehold.co/600x400?text=No+Image"; img.style.opacity = "1"; };
  img.onload = () => { img.style.opacity = "1"; const sk = wrapper.querySelector(".skeleton-placeholder"); if (sk) sk.remove(); };

  const placeholder = document.createElement("div");
  placeholder.className = "skeleton-placeholder absolute inset-0 bg-gray-100 animate-pulse";

  wrapper.appendChild(placeholder);
  wrapper.appendChild(img);
  return wrapper;
}

export function Skeleton({ className = "" }) {
  const el = document.createElement("div");
  el.className = `bg-gray-100 animate-pulse rounded-lg ${className}`;
  return el;
}
