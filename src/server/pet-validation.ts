import { MAX_IMAGE_SIZE, petFieldsSchema, petImageSchema, petUpdateSchema } from '@/lib/validation/pet'
import type { Fields } from '@/server/body'

export class PetValidationError extends Error {
  status = 400
}

export function validatePetPayload(fields: Fields, file: File | null, partial = false) {
  const fieldsResult = (partial ? petUpdateSchema : petFieldsSchema).safeParse(fields)
  if (!fieldsResult.success) {
    throw new PetValidationError(fieldsResult.error.issues[0]?.message ?? 'Dados inválidos')
  }

  if (file) {
    const fileResult = petImageSchema.safeParse(file)
    if (!fileResult.success) {
      throw new PetValidationError(fileResult.error.issues[0]?.message ?? 'Imagem inválida')
    }
  }

  return { fields: fieldsResult.data, file }
}

export { MAX_IMAGE_SIZE }
