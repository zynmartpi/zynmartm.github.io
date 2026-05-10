const cn = (...classes) => classes.filter(Boolean).join(" ");

const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  outline: "border bg-card hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
  link: "text-primary underline-offset-4 hover:underline",
};

const buttonSizes = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-[12px] gap-1.5 px-3",
  lg: "h-10 px-6",
  icon: "size-9",
  "icon-sm": "size-8",
  "icon-lg": "size-10",
};

export function Button(label, { variant = "default", size = "default", className = "", id = "", disabled = false, type = "button", onClick = null, icon = "" } = {}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-sm font-extrabold transition-all active:translate-y-px disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none",
    buttonVariants[variant] || buttonVariants.default,
    buttonSizes[size] || buttonSizes.default,
    className
  );
  const attrs = `class="${classes}" type="${type}"${id ? ` id="${id}"` : ""}${disabled ? " disabled" : ""}`;
  const content = icon ? `${icon}${label ? ` ${label}` : ""}` : label;
  return `<button ${attrs}>${content}</button>`;
}

export function Card(children, { className = "", id = "" } = {}) {
  const classes = cn("rounded-xl border bg-card text-card-foreground shadow-sm", className);
  return `<div${id ? ` id="${id}"` : ""} class="${classes}">${children}</div>`;
}

export function CardHeader(children, { className = "" } = {}) {
  const classes = cn("flex flex-col space-y-1.5 p-6", className);
  return `<div class="${classes}">${children}</div>`;
}

export function CardTitle(children, { className = "" } = {}) {
  const classes = cn("font-semibold leading-none tracking-tight", className);
  return `<h3 class="${classes}">${children}</h3>`;
}

export function CardDescription(children, { className = "" } = {}) {
  const classes = cn("text-sm text-muted-foreground", className);
  return `<p class="${classes}">${children}</p>`;
}

export function CardContent(children, { className = "" } = {}) {
  const classes = cn("p-6 pt-0", className);
  return `<div class="${classes}">${children}</div>`;
}

export function CardFooter(children, { className = "" } = {}) {
  const classes = cn("flex items-center p-6 pt-0", className);
  return `<div class="${classes}">${children}</div>`;
}

export function Badge(children, { variant = "default", className = "" } = {}) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  };
  const classes = cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
    variants[variant] || variants.default,
    className
  );
  return `<span class="${classes}">${children}</span>`;
}

export function Input({ id = "", type = "text", placeholder = "", value = "", className = "", required = false, disabled = false, autocomplete = "" } = {}) {
  const classes = cn(
    "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    className
  );
  return `<input type="${type}"${id ? ` id="${id}"` : ""} class="${classes}" placeholder="${placeholder}" value="${value}"${required ? " required" : ""}${disabled ? " disabled" : ""}${autocomplete ? ` autocomplete="${autocomplete}"` : ""} />`;
}

export function Textarea({ id = "", placeholder = "", value = "", className = "", rows = 3, required = false } = {}) {
  const classes = cn(
    "flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    className
  );
  return `<textarea${id ? ` id="${id}"` : ""} class="${classes}" placeholder="${placeholder}" rows="${rows}"${required ? " required" : ""}>${value}</textarea>`;
}

export function Skeleton({ className = "", width = "", height = "" } = {}) {
  const classes = cn("animate-pulse rounded-md bg-primary/10", className);
  const style = (width || height) ? ` style="${width ? `width:${width};` : ""}${height ? `height:${height};` : ""}"` : "";
  return `<div class="${classes}"${style}></div>`;
}

export function Separator({ className = "" } = {}) {
  const classes = cn("shrink-0 bg-border h-[1px] w-full", className);
  return `<div class="${classes}"></div>`;
}

export function Avatar(children, { className = "" } = {}) {
  const classes = cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className);
  return `<div class="${classes}">${children}</div>`;
}

export function AvatarImage(src, alt = "", { className = "" } = {}) {
  const classes = cn("aspect-square h-full w-full object-cover", className);
  return src ? `<img src="${src}" alt="${alt}" class="${classes}" />` : "";
}

export function AvatarFallback(children, { className = "" } = {}) {
  const classes = cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-bold", className);
  return `<div class="${classes}">${children}</div>`;
}

function SpinnerIcon() {
  return `<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>`;
}

function Loader2() {
  return `<svg class="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>`;
}

function ImageWithSkeleton(src, alt, { className = "", skeletonClass = "" } = {}) {
  const id = `img-${Math.random().toString(36).substr(2, 9)}`;
  return `
    <div class="relative w-full h-full ${className}" id="${id}-container">
      <div class="absolute inset-0 w-full h-full rounded-none animate-pulse bg-primary/10" id="${id}-skeleton"></div>
      <img src="${src}" alt="${alt}" class="object-cover w-full h-full transition-opacity duration-300 opacity-0 ${className}" 
        onload="document.getElementById('${id}-skeleton').style.display='none';this.style.opacity='1'" 
        onerror="this.src='https://placehold.co/600x400?text=No+Image';document.getElementById('${id}-skeleton').style.display='none';this.style.opacity='1'" />
    </div>`;
}

export { cn, SpinnerIcon, Loader2, ImageWithSkeleton };
