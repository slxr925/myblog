type PublicBlogTarget =
  | string
  | number
  | null
  | undefined
  | {
      publicId?: string | null
      id?: string | number | null
    }

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const isUuidIdentifier = (value: string): boolean => UUID_PATTERN.test(value)

export const getPublicBlogIdentifier = (target: PublicBlogTarget): string | null => {
  if (target == null) {
    return null
  }

  if (typeof target === 'string' || typeof target === 'number') {
    return String(target)
  }

  if (target.publicId) {
    return String(target.publicId)
  }

  if (target.id != null) {
    if (import.meta.env.DEV) {
      console.warn('Missing publicId for public blog navigation, falling back to numeric id:', target)
    }
    return String(target.id)
  }

  return null
}

export const getPublicBlogPath = (target: PublicBlogTarget): string => {
  const identifier = getPublicBlogIdentifier(target)
  return identifier ? `/blog/${identifier}` : '/blog'
}
