// Responsive WebP versions of /images/*.jpg live in /images/w800 and /images/w1600 (generated with sharp).
export const webpSrcSet=(src:string)=>{const m=src.match(/^\/images\/([\w-]+)\.jpe?g$/);return m?`/images/w800/${m[1]}.webp 800w, /images/w1600/${m[1]}.webp 1600w`:undefined};
