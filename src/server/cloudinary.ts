import { randomUUID } from 'node:crypto'
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'
import { withTimeout } from '@/server/timeout'

const PETS_FOLDER = 'pets_apata'
const UPLOAD_TIMEOUT_MS = 10_000

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  ...(process.env.CLOUDINARY_UPLOAD_PREFIX ? { upload_prefix: process.env.CLOUDINARY_UPLOAD_PREFIX } : {}),
})

function hasCloudinaryCredentials() {
  return Boolean(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET)
}

export async function uploadPetPhoto(file: File): Promise<UploadApiResponse> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (!hasCloudinaryCredentials()) {
    return {
      secure_url: `data:${file.type};base64,${buffer.toString('base64')}`,
      public_id: `local:${randomUUID()}`,
    } as UploadApiResponse
  }

  const upload = new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder: PETS_FOLDER }, (error, result) => {
      if (error) reject(error)
      else if (result) resolve(result)
      else reject(new Error('Upload sem resposta'))
    })
    uploadStream.end(buffer)
  })

  return withTimeout(upload, UPLOAD_TIMEOUT_MS, 'Tempo esgotado ao enviar a imagem')
}

export function destroyPhoto(publicId: string): Promise<unknown> {
  if (publicId.startsWith('local:')) return Promise.resolve()
  return cloudinary.uploader.destroy(publicId)
}
