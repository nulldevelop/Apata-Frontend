import { MAX_IMAGE_SIZE } from '@/lib/validation/pet'

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível ler a imagem'))
    }
    image.src = objectUrl
  })
}

function canvasToFile(canvas: HTMLCanvasElement, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Não foi possível comprimir a imagem'))
        return
      }
      resolve(new File([blob], 'foto-comprimida.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', quality)
  })
}

export async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_IMAGE_SIZE) return file

  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  let scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight))
  let quality = 0.85

  for (let attempt = 0; attempt < 12; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Seu navegador não suporta compressão de imagens')

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const compressed = await canvasToFile(canvas, quality)
    if (compressed.size <= MAX_IMAGE_SIZE) return compressed

    quality = Math.max(0.35, quality - 0.1)
    if (quality === 0.35) scale *= 0.8
  }

  throw new Error('Não foi possível reduzir a imagem para 5 MB')
}
