import { MAX_IMAGE_SIZE, petFieldsSchema, petImageSchema, petUpdateSchema } from '@/lib/validation/pet'
import type { Fields } from '@/server/body'

export class PetValidationError extends Error {
  status = 400
}

function normalizePetFields(fields: Fields): Fields {
  const normalized = { ...fields }
  for (const key of ['vacinado', 'vermifugado', 'castrado', 'microchip']) {
    if (typeof normalized[key] === 'string') normalized[key] = normalized[key] === 'true'
  }
  for (const key of ['dataVermifugacao', 'numeroMicrochip']) {
    if (normalized[key] === '') delete normalized[key]
  }
  return normalized
}

export function validatePetPayload(fields: Fields, file: File | null, partial = false) {
  const fieldsResult = (partial ? petUpdateSchema : petFieldsSchema).safeParse(normalizePetFields(fields))
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

export function toPetPersistence(fields: Record<string, unknown>) {
  const data = { ...fields }
  if ('dataVermifugacao' in data) {
    data.dataVermifugacao = data.dataVermifugacao ? new Date(`${data.dataVermifugacao}T00:00:00.000Z`) : null
  }
  return data
}

export { MAX_IMAGE_SIZE }
