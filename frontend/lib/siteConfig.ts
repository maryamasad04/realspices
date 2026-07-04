/** Social links — defaults open Facebook/Instagram home until client handles are provided via env. */
export const SITE_SOCIAL = {
  facebook:
    process.env.NEXT_PUBLIC_FACEBOOK_URL ?? 'https://www.facebook.com/',
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://www.instagram.com/',
} as const;
